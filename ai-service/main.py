import io
import os
import random
from datetime import datetime
from typing import List, Literal

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
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

# Read Gemini API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY was not found in .env")


# =========================================================
# 2. GEMINI CLIENT
# =========================================================

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
# 4. CORS CONFIGURATION
# =========================================================

# Local frontend origins.
# Production frontend URL will be added when deployed.
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# 5. PYDANTIC MODELS
# =========================================================

class ComplaintAnalysis(BaseModel):
    """
    Complete response returned after a complaint is analyzed.
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

    assigned_officer_id: int | None
    assigned_officer_name: str | None

    latitude: float | None
    longitude: float | None
    address: str | None

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
# 6. TICKET ID GENERATOR
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
# 7. ROOT ENDPOINT
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
# 8. HEALTH CHECK
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
# 9. GET ACTIVE OFFICERS
# =========================================================

@app.get("/officers", response_model=List[OfficerResponse])
def get_officers():
    """
    Return all active government officers.
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
# 10. GET ALL COMPLAINTS
# =========================================================

@app.get("/complaints", response_model=List[ComplaintListItem])
def get_complaints():
    """
    Return all saved complaints.

    Includes:
    - AI analysis
    - Officer assignment
    - Location
    - Current status
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

                assigned_officer_id=complaint.assigned_officer_id,
                assigned_officer_name=complaint.assigned_officer_name,

                latitude=complaint.latitude,
                longitude=complaint.longitude,
                address=complaint.address,

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
# 11. GET ONE COMPLAINT
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

            # Location
            "latitude": complaint.latitude,
            "longitude": complaint.longitude,
            "address": complaint.address,

            # Complaint details
            "summary": complaint.summary,
            "recommended_action": complaint.recommended_action,

            # AI information
            "confidence": complaint.confidence,
            "review_required": complaint.review_required,

            # Status
            "status": complaint.status,

            # Citizen information
            "citizen_description": complaint.citizen_description,
            "image_filename": complaint.image_filename,

            # Timestamp
            "created_at": complaint.created_at,
        }

    finally:
        db.close()


# =========================================================
# 12. UPDATE COMPLAINT STATUS
# =========================================================

@app.patch("/complaints/{ticket_id}/status")
def update_complaint_status(
    ticket_id: str,
    update: ComplaintStatusUpdate,
):
    """
    Update an existing complaint status.

    Allowed values:
    Submitted
    Assigned
    In Progress
    Resolved
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
# 13. ASSIGN COMPLAINT TO OFFICER
# =========================================================

@app.patch("/complaints/{ticket_id}/assign")
def assign_complaint(
    ticket_id: str,
    assignment: ComplaintAssignment,
):
    """
    Assign a complaint to an active officer.

    The officer's department must match the complaint department.
    """

    db = SessionLocal()

    try:
        # Find complaint
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

        # Find active officer
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

        # Verify department compatibility
        if officer.department.lower() not in complaint.department.lower():
            raise HTTPException(
                status_code=400,
                detail=(
                    "Officer department does not match "
                    "complaint department."
                ),
            )

        # Store officer assignment
        complaint.assigned_officer_id = officer.id
        complaint.assigned_officer_name = officer.name

        # Automatically move complaint to Assigned
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
# 14. AI IMAGE ANALYSIS
# =========================================================

@app.post("/analyze-image", response_model=ComplaintAnalysis)
async def analyze_image(
    file: UploadFile = File(...),
    description: str = Form(""),
    latitude: float | None = Form(None),
    longitude: float | None = Form(None),
    address: str = Form(""),
):
    """
    Main SaarthiAI AI pipeline.

    Input:
        - Citizen image
        - Citizen description
        - GPS latitude
        - GPS longitude
        - Address

    Output:
        - AI analysis
        - Ticket ID
        - Complaint status

    The complaint is stored in SQLite.
    """

    # =====================================================
    # 14.1 VALIDATE FILE
    # =====================================================

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a valid image file.",
        )

    # =====================================================
    # 14.2 READ IMAGE
    # =====================================================

    contents = await file.read()

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="The uploaded image is empty.",
        )

    # =====================================================
    # 14.3 VALIDATE IMAGE CONTENT
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
    # 14.4 VALIDATE GPS
    # =====================================================

    if latitude is not None and not (-90 <= latitude <= 90):
        raise HTTPException(
            status_code=400,
            detail="Latitude must be between -90 and 90.",
        )

    if longitude is not None and not (-180 <= longitude <= 180):
        raise HTTPException(
            status_code=400,
            detail="Longitude must be between -180 and 180.",
        )

    # =====================================================
    # 14.5 AI ANALYSIS
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

        # =================================================
        # SEND IMAGE + PROMPT TO GEMINI
        # =================================================

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
        # 14.6 VALIDATE AI RESPONSE
        # =================================================

        if response.parsed is None:
            raise HTTPException(
                status_code=500,
                detail="AI returned an invalid structured response.",
            )

        result = response.parsed

        # =================================================
        # 14.7 GENERATE TICKET
        # =================================================

        result.ticket_id = generate_ticket_id()
        result.status = "Submitted"

        # =================================================
        # 14.8 SAVE COMPLAINT
        # =================================================

        db = SessionLocal()

        try:
            complaint = Complaint(
                ticket_id=result.ticket_id,

                # AI results
                issue_detected=result.issue_detected,
                category=result.category,
                priority=result.priority,
                department=result.department,
                summary=result.summary,
                recommended_action=result.recommended_action,
                confidence=result.confidence,
                review_required=result.review_required,

                # Initial status
                status=result.status,

                # Citizen data
                citizen_description=description,

                # Location
                latitude=latitude,
                longitude=longitude,
                address=address.strip() if address else None,

                # Image
                image_filename=file.filename,

                # No officer assigned initially
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
        # 14.9 RETURN RESULT
        # =================================================

        return result

    # =====================================================
    # 14.10 ERROR HANDLING
    # =====================================================

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"AI analysis failed: {str(exc)}",
        )
