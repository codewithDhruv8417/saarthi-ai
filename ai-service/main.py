import io
import os
import random
from datetime import datetime
from typing import List, Literal

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from google import genai
from google.genai import types
from PIL import Image
from pydantic import BaseModel

from database import Complaint, Officer, SessionLocal


# =========================================================
# 1. ENVIRONMENT CONFIGURATION
# =========================================================

# Load values from ai-service/.env
load_dotenv()

# Read the Gemini API key securely
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Stop startup if the API key is missing
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY was not found in .env")


# =========================================================
# 2. GEMINI CLIENT
# =========================================================

# Create the Gemini client
client = genai.Client(api_key=GEMINI_API_KEY)


# =========================================================
# 3. FASTAPI APPLICATION
# =========================================================

app = FastAPI(
    title="SaarthiAI AI Service",
    description="AI-powered citizen grievance analysis service",
    version="1.0.0",
)


# =========================================================
# 4. PYDANTIC MODELS
# =========================================================

class ComplaintAnalysis(BaseModel):
    """
    Complete response returned when a new complaint
    is analyzed by Gemini.
    """

    ticket_id: str
    issue_detected: str
    category: str
    priority: str
    department: str
    summary: str
    recommended_action: str
    confidence: float
    review_required: bool
    status: str


class ComplaintListItem(BaseModel):
    """
    Complaint summary returned by GET /complaints.
    """

    ticket_id: str
    issue_detected: str
    category: str
    priority: str
    department: str

    # Officer assignment information
    assigned_officer_id: int | None
    assigned_officer_name: str | None

    confidence: float
    review_required: bool
    status: str
    created_at: datetime


class ComplaintStatusUpdate(BaseModel):
    """
    Request body used to update complaint status.
    """

    status: Literal[
        "Submitted",
        "Assigned",
        "In Progress",
        "Resolved",
    ]


class ComplaintAssignment(BaseModel):
    """
    Request body used to assign a complaint to an officer.
    """

    officer_id: int


class OfficerResponse(BaseModel):
    """
    Officer information returned by the API.
    """

    id: int
    name: str
    email: str
    department: str
    is_active: bool


# =========================================================
# 5. TICKET ID GENERATOR
# =========================================================

def generate_ticket_id() -> str:
    """
    Generate a SaarthiAI complaint ticket ID.

    Example:
    SAR-20260819-4837
    """

    date_part = datetime.now().strftime("%Y%m%d")
    random_part = random.randint(1000, 9999)

    return f"SAR-{date_part}-{random_part}"


# =========================================================
# 6. ROOT ENDPOINT
# =========================================================

@app.get("/")
def root():
    """
    Confirm that the SaarthiAI service is online.
    """

    return {
        "message": "SaarthiAI AI Service is running",
        "status": "online",
    }


# =========================================================
# 7. HEALTH CHECK
# =========================================================

@app.get("/health")
def health():
    """
    Health-check endpoint for monitoring and deployment.
    """

    return {
        "status": "healthy"
    }


# =========================================================
# 8. GET ALL ACTIVE OFFICERS
# =========================================================

@app.get("/officers", response_model=List[OfficerResponse])
def get_officers():
    """
    Return all active government officers.

    The frontend will use this endpoint to populate
    the officer assignment dropdown.
    """

    db = SessionLocal()

    try:
        officers = (
            db.query(Officer)
            .filter(Officer.is_active == True)
            .order_by(Officer.name.asc())
            .all()
        )

        return [
            OfficerResponse(
                id=officer.id,
                name=officer.name,
                email=officer.email,
                department=officer.department,
                is_active=officer.is_active,
            )
            for officer in officers
        ]

    finally:
        db.close()


# =========================================================
# 9. GET ALL COMPLAINTS
# =========================================================

@app.get("/complaints", response_model=List[ComplaintListItem])
def get_complaints():
    """
    Return all saved complaints.

    Used by:
    - Citizen dashboard
    - Officer dashboard
    - Complaint management
    - Analytics
    """

    db = SessionLocal()

    try:
        complaints = (
            db.query(Complaint)
            .order_by(Complaint.id.desc())
            .all()
        )

        return [
            ComplaintListItem(
                ticket_id=complaint.ticket_id,
                issue_detected=complaint.issue_detected,
                category=complaint.category,
                priority=complaint.priority,
                department=complaint.department,

                # Assigned officer details
                assigned_officer_id=complaint.assigned_officer_id,
                assigned_officer_name=complaint.assigned_officer_name,

                confidence=complaint.confidence,
                review_required=complaint.review_required,
                status=complaint.status,
                created_at=complaint.created_at,
            )
            for complaint in complaints
        ]

    finally:
        db.close()


# =========================================================
# 10. GET ONE COMPLAINT BY TICKET ID
# =========================================================

@app.get("/complaints/{ticket_id}")
def get_complaint(ticket_id: str):
    """
    Return complete information for one complaint.
    """

    db = SessionLocal()

    try:
        complaint = (
            db.query(Complaint)
            .filter(Complaint.ticket_id == ticket_id)
            .first()
        )

        if complaint is None:
            raise HTTPException(
                status_code=404,
                detail="Complaint ticket not found.",
            )

        return {
            "ticket_id": complaint.ticket_id,
            "issue_detected": complaint.issue_detected,
            "category": complaint.category,
            "priority": complaint.priority,
            "department": complaint.department,

            # Officer assignment
            "assigned_officer_id": complaint.assigned_officer_id,
            "assigned_officer_name": complaint.assigned_officer_name,

            "summary": complaint.summary,
            "recommended_action": complaint.recommended_action,
            "confidence": complaint.confidence,
            "review_required": complaint.review_required,
            "status": complaint.status,
            "citizen_description": complaint.citizen_description,
            "image_filename": complaint.image_filename,
            "created_at": complaint.created_at,
        }

    finally:
        db.close()


# =========================================================
# 11. UPDATE COMPLAINT STATUS
# =========================================================

@app.patch("/complaints/{ticket_id}/status")
def update_complaint_status(
    ticket_id: str,
    update: ComplaintStatusUpdate,
):
    """
    Update an existing complaint status.

    Allowed values:
    - Submitted
    - Assigned
    - In Progress
    - Resolved
    """

    db = SessionLocal()

    try:
        complaint = (
            db.query(Complaint)
            .filter(Complaint.ticket_id == ticket_id)
            .first()
        )

        if complaint is None:
            raise HTTPException(
                status_code=404,
                detail="Complaint ticket not found.",
            )

        complaint.status = update.status

        db.commit()
        db.refresh(complaint)

        return {
            "message": "Complaint status updated successfully.",
            "ticket_id": complaint.ticket_id,
            "status": complaint.status,
        }

    except HTTPException:
        raise

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to update complaint status: {str(exc)}",
        )

    finally:
        db.close()


# =========================================================
# 12. ASSIGN COMPLAINT TO OFFICER
# =========================================================

@app.patch("/complaints/{ticket_id}/assign")
def assign_complaint(
    ticket_id: str,
    assignment: ComplaintAssignment,
):
    """
    Assign a complaint to an active officer.

    The officer's department must match the complaint's
    department.

    Successful assignment automatically changes the
    complaint status to "Assigned".
    """

    db = SessionLocal()

    try:
        # -------------------------------------------------
        # Find complaint
        # -------------------------------------------------

        complaint = (
            db.query(Complaint)
            .filter(Complaint.ticket_id == ticket_id)
            .first()
        )

        if complaint is None:
            raise HTTPException(
                status_code=404,
                detail="Complaint ticket not found.",
            )

        # -------------------------------------------------
        # Find active officer
        # -------------------------------------------------

        officer = (
            db.query(Officer)
            .filter(
                Officer.id == assignment.officer_id,
                Officer.is_active == True,
            )
            .first()
        )

        if officer is None:
            raise HTTPException(
                status_code=404,
                detail="Active officer not found.",
            )

        # -------------------------------------------------
        # Validate department compatibility
        # -------------------------------------------------

        if officer.department.lower() not in complaint.department.lower():
            raise HTTPException(
                status_code=400,
                detail=(
                    "Officer department does not match "
                    "complaint department."
                ),
            )

        # -------------------------------------------------
        # Save assignment
        # -------------------------------------------------

        complaint.assigned_officer_id = officer.id
        complaint.assigned_officer_name = officer.name

        # Move complaint to Assigned automatically
        complaint.status = "Assigned"

        db.commit()
        db.refresh(complaint)

        return {
            "message": "Complaint assigned successfully.",
            "ticket_id": complaint.ticket_id,
            "officer_id": officer.id,
            "officer_name": officer.name,
            "department": officer.department,
            "status": complaint.status,
        }

    except HTTPException:
        raise

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to assign complaint: {str(exc)}",
        )

    finally:
        db.close()


# =========================================================
# 13. AI IMAGE ANALYSIS
# =========================================================

@app.post("/analyze-image", response_model=ComplaintAnalysis)
async def analyze_image(
    file: UploadFile = File(...),
    description: str = Form(""),
):
    """
    Main SaarthiAI AI pipeline.

    Flow:

    Image + Description
            ↓
        Gemini AI
            ↓
      Issue Detection
            ↓
         Category
            ↓
         Priority
            ↓
        Department
            ↓
    Recommended Action
            ↓
        Confidence
            ↓
      Ticket Generation
            ↓
     Database Storage
    """

    # =====================================================
    # 13.1 VALIDATE FILE TYPE
    # =====================================================

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a valid image file.",
        )

    # =====================================================
    # 13.2 READ IMAGE
    # =====================================================

    contents = await file.read()

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="The uploaded image is empty.",
        )

    # =====================================================
    # 13.3 VALIDATE IMAGE CONTENT
    # =====================================================

    try:
        image = Image.open(io.BytesIO(contents))
        image.verify()

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid image.",
        )

    # =====================================================
    # 13.4 AI ANALYSIS
    # =====================================================

    try:
        prompt = f"""
You are SaarthiAI, an intelligent government citizen grievance
analysis system.

Analyze the uploaded image carefully and use the citizen's
description as additional context.

Citizen description:
{description if description.strip() else "No description was provided."}

Your task is to identify a visible civic or public-service issue
that could reasonably be reported to a government department.

Examples include:

- Garbage or waste accumulation
- Potholes or damaged roads
- Broken streetlights
- Water leakage
- Drainage problems
- Damaged public property
- Traffic or road infrastructure issues
- Illegal dumping
- Public sanitation problems
- Other civic infrastructure issues

Return the following information:

1. issue_detected:
   Clearly describe the primary problem visible in the image.

2. category:
   Use a practical government service category.

3. priority:
   Choose exactly one:
   Low, Medium, High, Critical

4. department:
   Recommend the most appropriate government department
   or authority.

5. summary:
   Give a concise description suitable for an official
   complaint ticket.

6. recommended_action:
   Explain what the responsible authority should do next.

7. confidence:
   Give a number between 0 and 1 representing your confidence
   in the identification.

8. review_required:
   Set this to true if confidence is below 0.60.
   Otherwise, set it to false.

Important rules:

- Do not invent details that cannot reasonably be inferred
  from the image.
- Use the citizen description as supporting context, not as
  proof of something that is not visible.
- If the image is unclear, explicitly mention the uncertainty.
- If the description conflicts with the image, prioritize what
  is visibly present.
- Focus on the primary civic/public-service issue.
- Keep the response suitable for an official government
  complaint system.
- Recommend the department that would normally handle the
  detected issue.
- Use concise and professional language.
"""

        # -------------------------------------------------
        # Send image + prompt to Gemini
        # -------------------------------------------------

        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=[
                types.Part.from_bytes(
                    data=contents,
                    mime_type=file.content_type,
                ),
                prompt,
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ComplaintAnalysis,
            ),
        )

        # =================================================
        # 13.5 VALIDATE AI RESPONSE
        # =================================================

        if response.parsed is None:
            raise HTTPException(
                status_code=500,
                detail="AI returned an invalid structured response.",
            )

        result = response.parsed

        # =================================================
        # 13.6 GENERATE TICKET
        # =================================================

        result.ticket_id = generate_ticket_id()

        # Newly created complaints start as Submitted
        result.status = "Submitted"

        # =================================================
        # 13.7 SAVE COMPLAINT TO DATABASE
        # =================================================

        db = SessionLocal()

        try:
            complaint = Complaint(
                ticket_id=result.ticket_id,
                issue_detected=result.issue_detected,
                category=result.category,
                priority=result.priority,
                department=result.department,
                summary=result.summary,
                recommended_action=result.recommended_action,
                confidence=result.confidence,
                review_required=result.review_required,
                status=result.status,
                citizen_description=description,
                image_filename=file.filename,

                # No officer is assigned yet
                assigned_officer_id=None,
                assigned_officer_name=None,
            )

            db.add(complaint)
            db.commit()
            db.refresh(complaint)

        except Exception as db_error:
            db.rollback()

            raise HTTPException(
                status_code=500,
                detail=f"Failed to save complaint: {str(db_error)}",
            )

        finally:
            db.close()

        # =================================================
        # 13.8 RETURN RESULT
        # =================================================

        return result

    # =====================================================
    # 13.9 ERROR HANDLING
    # =====================================================

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"AI analysis failed: {str(exc)}",
        )
