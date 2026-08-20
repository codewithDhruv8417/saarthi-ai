import base64
import json
import random
from datetime import datetime, timezone

import asgi
import httpx

from fastapi import (
    FastAPI,
    File,
    Form,
    HTTPException,
    Request,
    UploadFile,
)

from fastapi.middleware.cors import CORSMiddleware
from workers import WorkerEntrypoint


# ============================================================
# SaarthiAI Cloud API
# ============================================================

app = FastAPI(
    title="SaarthiAI Cloud API",
    description="AI-powered citizen grievance management API",
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "https://saarthi-ai.pages.dev",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# GEMINI MODELS
#
# We try the newest model first.
# If Gemini temporarily returns 503/429, we fall back
# automatically to another supported model.
# ============================================================

GEMINI_MODELS = [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
]


# ============================================================
# HELPER: GENERATE TICKET ID
# ============================================================

def generate_ticket_id() -> str:
    """
    Generate a SaarthiAI ticket ID.

    Example:
        SAR-20260820-7122
    """

    date_part = datetime.now(timezone.utc).strftime("%Y%m%d")
    random_part = random.randint(1000, 9999)

    return f"SAR-{date_part}-{random_part}"


# ============================================================
# HELPER: BUILD AI PROMPT
# ============================================================

def build_prompt(description: str) -> str:
    """
    Build the prompt sent to Gemini.
    """

    citizen_description = description.strip()

    if not citizen_description:
        citizen_description = "No citizen description was provided."

    return f"""
You are SaarthiAI, an AI-powered government citizen grievance
analysis system.

Analyze the uploaded civic/public infrastructure image carefully.

Use the citizen description only as supporting context.

Citizen description:
{citizen_description}

Identify the PRIMARY civic/public-service issue visible in the image.

Possible examples include:

- pothole / damaged road
- garbage / waste accumulation
- drainage problem
- water leakage
- broken streetlight
- damaged public property
- traffic infrastructure problem
- sanitation problem
- illegal dumping
- other civic infrastructure issue

Return ONLY valid JSON with exactly these fields:

{{
  "issue_detected": "string",
  "category": "string",
  "priority": "Low | Medium | High | Critical",
  "department": "string",
  "summary": "string",
  "recommended_action": "string",
  "confidence": 0.0,
  "review_required": false
}}

Rules:

1. Do not invent details.
2. Focus on visible evidence.
3. Use the citizen description as additional context only.
4. If the image is unclear, mention the uncertainty.
5. Choose the primary issue.
6. confidence must be between 0 and 1.
7. review_required must be true if confidence is below 0.60.
8. Keep the response concise and appropriate for an official
   government complaint system.
"""


# ============================================================
# HELPER: EXTRACT GEMINI RESPONSE TEXT
# ============================================================

def extract_gemini_text(gemini_data: dict) -> str:
    """
    Extract generated text from Gemini's response.
    """

    candidates = gemini_data.get("candidates") or []

    if not candidates:
        raise ValueError(
            "Gemini returned no candidates."
        )

    content = candidates[0].get("content") or {}

    parts = content.get("parts") or []

    if not parts:
        raise ValueError(
            "Gemini returned no content parts."
        )

    text = parts[0].get("text")

    if not text:
        raise ValueError(
            "Gemini returned empty text."
        )

    return text


# ============================================================
# HELPER: NORMALIZE CONFIDENCE
# ============================================================

def normalize_confidence(value) -> float:
    """
    Ensure confidence is always between 0 and 1.
    """

    try:
        confidence = float(value)
    except (TypeError, ValueError):
        confidence = 0.0

    return max(
        0.0,
        min(1.0, confidence),
    )


# ============================================================
# ROOT
# ============================================================

@app.get("/")
async def root():
    return {
        "message": "SaarthiAI Cloud API is running",
        "status": "online",
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
async def health():
    return {
        "status": "healthy",
    }


# ============================================================
# ANALYZE IMAGE
# ============================================================

@app.post("/analyze-image")
async def analyze_image(
    request: Request,
    file: UploadFile = File(...),
    description: str = Form(""),
    latitude: float | None = Form(None),
    longitude: float | None = Form(None),
    address: str = Form(""),
):
    """
    Main SaarthiAI AI endpoint.

    Receives:

        file
        description
        latitude
        longitude
        address

    Performs:

        image validation
        location validation
        Gemini analysis
        ticket creation
        D1 database save

    Returns:

        complete complaint object
    """

    # --------------------------------------------------------
    # GET CLOUDFLARE ENVIRONMENT
    # --------------------------------------------------------

    env = request.scope["env"]

    gemini_api_key = env.GEMINI_API_KEY

    if not gemini_api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured.",
        )

    # --------------------------------------------------------
    # VALIDATE IMAGE
    # --------------------------------------------------------

    if not file.content_type:
        raise HTTPException(
            status_code=400,
            detail="Image content type is missing.",
        )

    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a valid image file.",
        )

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty.",
        )

    # Maximum 5 MB
    if len(image_bytes) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Image size must be 5 MB or less.",
        )

    # --------------------------------------------------------
    # VALIDATE LOCATION
    # --------------------------------------------------------

    if latitude is not None:
        if not (-90 <= latitude <= 90):
            raise HTTPException(
                status_code=400,
                detail="Latitude must be between -90 and 90.",
            )

    if longitude is not None:
        if not (-180 <= longitude <= 180):
            raise HTTPException(
                status_code=400,
                detail="Longitude must be between -180 and 180.",
            )

    # --------------------------------------------------------
    # PREPARE IMAGE
    # --------------------------------------------------------

    image_base64 = base64.b64encode(
        image_bytes
    ).decode("utf-8")

    prompt = build_prompt(description)

    # --------------------------------------------------------
    # GEMINI GENERATION CONFIG
    # --------------------------------------------------------

    generation_config = {
        "response_mime_type": "application/json",
        "response_schema": {
            "type": "OBJECT",
            "properties": {
                "issue_detected": {
                    "type": "STRING",
                },
                "category": {
                    "type": "STRING",
                },
                "priority": {
                    "type": "STRING",
                    "enum": [
                        "Low",
                        "Medium",
                        "High",
                        "Critical",
                    ],
                },
                "department": {
                    "type": "STRING",
                },
                "summary": {
                    "type": "STRING",
                },
                "recommended_action": {
                    "type": "STRING",
                },
                "confidence": {
                    "type": "NUMBER",
                },
                "review_required": {
                    "type": "BOOLEAN",
                },
            },
            "required": [
                "issue_detected",
                "category",
                "priority",
                "department",
                "summary",
                "recommended_action",
                "confidence",
                "review_required",
            ],
        },
    }

    # --------------------------------------------------------
    # GEMINI PAYLOAD
    # --------------------------------------------------------

    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt,
                    },
                    {
                        "inline_data": {
                            "mime_type": file.content_type,
                            "data": image_base64,
                        },
                    },
                ],
            }
        ],
        "generationConfig": generation_config,
    }

    # --------------------------------------------------------
    # CALL GEMINI WITH FALLBACK MODELS
    # --------------------------------------------------------

    analysis = None
    last_gemini_error = None

    async with httpx.AsyncClient(
        timeout=60.0
    ) as client:

        for model_name in GEMINI_MODELS:

            gemini_url = (
                "https://generativelanguage.googleapis.com/"
                f"v1beta/models/{model_name}:generateContent"
            )

            try:
                response = await client.post(
                    gemini_url,
                    headers={
                        "x-goog-api-key": gemini_api_key,
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )

            except Exception as exc:
                last_gemini_error = (
                    f"{model_name}: {exc}"
                )
                continue

            # ------------------------------------------------
            # SUCCESS
            # ------------------------------------------------

            if response.status_code == 200:

                try:
                    gemini_data = response.json()

                    generated_text = (
                        extract_gemini_text(
                            gemini_data
                        )
                    )

                    analysis = json.loads(
                        generated_text
                    )

                    break

                except Exception as exc:
                    last_gemini_error = (
                        f"{model_name}: "
                        f"Could not parse response: {exc}"
                    )
                    continue

            # ------------------------------------------------
            # TEMPORARY BUSY / RATE LIMIT
            #
            # Try the next model.
            # ------------------------------------------------

            if response.status_code in (
                429,
                503,
            ):

                try:
                    error_data = response.json()
                except Exception:
                    error_data = response.text

                last_gemini_error = {
                    "model": model_name,
                    "status_code": response.status_code,
                    "response": error_data,
                }

                continue

            # ------------------------------------------------
            # OTHER GEMINI ERROR
            # ------------------------------------------------

            try:
                error_data = response.json()
            except Exception:
                error_data = response.text

            raise HTTPException(
                status_code=502,
                detail={
                    "message": (
                        "Gemini API request failed."
                    ),
                    "model": model_name,
                    "gemini_response": error_data,
                },
            )

    # --------------------------------------------------------
    # ALL MODELS FAILED
    # --------------------------------------------------------

    if analysis is None:

        raise HTTPException(
            status_code=502,
            detail={
                "message": (
                    "All Gemini models were temporarily "
                    "unavailable. Please try again."
                ),
                "gemini_error": last_gemini_error,
            },
        )

    # --------------------------------------------------------
    # NORMALIZE AI RESPONSE
    # --------------------------------------------------------

    confidence = normalize_confidence(
        analysis.get("confidence")
    )

    review_required = (
        confidence < 0.60
    )

    issue_detected = analysis.get(
        "issue_detected",
        "Issue could not be confidently identified.",
    )

    category = analysis.get(
        "category",
        "Other Civic Issue",
    )

    priority = analysis.get(
        "priority",
        "Medium",
    )

    department = analysis.get(
        "department",
        "Relevant Government Department",
    )

    summary = analysis.get(
        "summary",
        "",
    )

    recommended_action = analysis.get(
        "recommended_action",
        "",
    )

    # --------------------------------------------------------
    # GENERATE TICKET
    # --------------------------------------------------------

    ticket_id = generate_ticket_id()

    created_at = datetime.now(
        timezone.utc
    ).isoformat()

    # --------------------------------------------------------
    # SAVE TO D1
    # --------------------------------------------------------

    try:

        await env.saarthi_db.prepare(
            """
            INSERT INTO complaints (
                ticket_id,
                issue_detected,
                category,
                priority,
                department,
                summary,
                recommended_action,
                confidence,
                review_required,
                status,
                citizen_description,
                latitude,
                longitude,
                address,
                image_filename,
                assigned_officer_id,
                assigned_officer_name,
                created_at
            )
            VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?
            )
            """
        ).bind(
            ticket_id,
            issue_detected,
            category,
            priority,
            department,
            summary,
            recommended_action,
            confidence,
            1 if review_required else 0,
            "Submitted",
            description,
            latitude,
            longitude,
            address.strip()
            if address
            else None,
            file.filename,
            None,
            None,
            created_at,
        ).run()

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail={
                "message": (
                    "AI analysis succeeded, "
                    "but saving the complaint to D1 failed."
                ),
                "error": str(exc),
            },
        )

    # --------------------------------------------------------
    # RETURN COMPLAINT
    # --------------------------------------------------------

    return {
        "ticket_id": ticket_id,
        "issue_detected": issue_detected,
        "category": category,
        "priority": priority,
        "department": department,
        "summary": summary,
        "recommended_action": recommended_action,
        "confidence": confidence,
        "review_required": review_required,
        "status": "Submitted",
        "citizen_description": description,
        "latitude": latitude,
        "longitude": longitude,
        "address": (
            address.strip()
            if address
            else None
        ),
        "image_filename": file.filename,
        "assigned_officer_id": None,
        "assigned_officer_name": None,
        "created_at": created_at,
    }


# ============================================================
# GET SINGLE COMPLAINT
# ============================================================

@app.get("/complaints/{ticket_id}")
async def get_complaint(
    request: Request,
    ticket_id: str,
):
    """
    Fetch one complaint from D1 using ticket ID.
    """

    env = request.scope["env"]

    normalized_ticket_id = (
        ticket_id.strip().upper()
    )

    try:

        result = await env.saarthi_db.prepare(
            """
            SELECT
                id,
                ticket_id,
                issue_detected,
                category,
                priority,
                department,
                summary,
                recommended_action,
                confidence,
                review_required,
                status,
                citizen_description,
                latitude,
                longitude,
                address,
                image_filename,
                assigned_officer_id,
                assigned_officer_name,
                created_at
            FROM complaints
            WHERE ticket_id = ?
            LIMIT 1
            """
        ).bind(
            normalized_ticket_id
        ).first()

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail={
                "message": (
                    "Could not read complaint from D1."
                ),
                "error": str(exc),
            },
        )

    if not result:

        raise HTTPException(
            status_code=404,
            detail=(
                "Complaint not found for this ticket ID."
            ),
        )

    result["review_required"] = bool(
        result.get(
            "review_required",
            0,
        )
    )

    return result


# ============================================================
# LIST RECENT COMPLAINTS
# ============================================================

@app.get("/complaints")
async def list_complaints(
    request: Request,
):
    """
    Return the latest 100 complaints.
    """

    env = request.scope["env"]

    try:

        result = await env.saarthi_db.prepare(
            """
            SELECT
                id,
                ticket_id,
                issue_detected,
                category,
                priority,
                department,
                status,
                latitude,
                longitude,
                address,
                assigned_officer_id,
                assigned_officer_name,
                created_at
            FROM complaints
            ORDER BY id DESC
            LIMIT 100
            """
        ).run()

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail={
                "message": (
                    "Could not list complaints."
                ),
                "error": str(exc),
            },
        )

    return {
        "count": len(result.results),
        "complaints": result.results,
    }


# ============================================================
# UPDATE COMPLAINT STATUS
# ============================================================

@app.patch(
    "/complaints/{ticket_id}/status"
)
async def update_complaint_status(
    request: Request,
    ticket_id: str,
):
    """
    Update complaint status.

    Accepted statuses:

    Submitted
    Assigned
    In Progress
    Resolved
    Rejected

    Example JSON:

    {
        "status": "In Progress"
    }
    """

    env = request.scope["env"]

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Request body must be valid JSON.",
        )

    new_status = str(
        body.get("status", "")
    ).strip()

    allowed_statuses = {
        "Submitted",
        "Assigned",
        "In Progress",
        "Resolved",
        "Rejected",
    }

    if new_status not in allowed_statuses:

        raise HTTPException(
            status_code=400,
            detail={
                "message": (
                    "Invalid complaint status."
                ),
                "allowed_statuses": sorted(
                    allowed_statuses
                ),
            },
        )

    normalized_ticket_id = (
        ticket_id.strip().upper()
    )

    try:

        result = await env.saarthi_db.prepare(
            """
            UPDATE complaints
            SET status = ?
            WHERE ticket_id = ?
            """
        ).bind(
            new_status,
            normalized_ticket_id,
        ).run()

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail={
                "message": (
                    "Could not update complaint status."
                ),
                "error": str(exc),
            },
        )

    if result.meta.changes == 0:

        raise HTTPException(
            status_code=404,
            detail="Complaint not found.",
        )

    return {
        "message": (
            "Complaint status updated successfully."
        ),
        "ticket_id": normalized_ticket_id,
        "status": new_status,
    }


# ============================================================
# CLOUDFLARE PYTHON WORKER ENTRY POINT
# ============================================================

class Default(WorkerEntrypoint):

    async def fetch(self, request):
        return await asgi.fetch(
            app,
            request,
            self.env,
        )