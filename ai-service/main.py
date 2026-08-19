import io
import os

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from google import genai
from google.genai import types
from PIL import Image
from pydantic import BaseModel


# Load environment variables from .env
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY was not found in .env")


# Create Gemini client
client = genai.Client(api_key=GEMINI_API_KEY)


app = FastAPI(
    title="SaarthiAI AI Service",
    description="AI-powered citizen grievance analysis service",
    version="1.0.0",
)


class ComplaintAnalysis(BaseModel):
    issue_detected: str
    category: str
    priority: str
    department: str
    summary: str
    recommended_action: str
    confidence: float
    review_required: bool


@app.get("/")
def root():
    return {
        "message": "SaarthiAI AI Service is running",
        "status": "online",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.post("/analyze-image", response_model=ComplaintAnalysis)
async def analyze_image(file: UploadFile = File(...)):

    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a valid image file."
        )

    # Read uploaded image
    contents = await file.read()

    # Validate that it is a real image
    try:
        image = Image.open(io.BytesIO(contents))
        image.verify()
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid image."
        )

    try:
        prompt = """
You are SaarthiAI, an intelligent government citizen grievance analysis system.

Analyze the uploaded image carefully.

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
   Clearly describe what problem is visible.

2. category:
   Use a practical government service category.

3. priority:
   Choose exactly one:
   Low, Medium, High, Critical

4. department:
   Recommend the most appropriate government department or authority.

5. summary:
   Give a concise description suitable for a complaint ticket.

6. recommended_action:
   Explain what the responsible authority should do next.

7. confidence:
   Give a number between 0 and 1 representing your confidence
   in the visual identification.

8. review_required:
   Set this to true if confidence is below 0.60.
   Otherwise, set it to false.

Important rules:
- Do not invent details that cannot reasonably be inferred from the image.
- If the image is unclear, explicitly mention the uncertainty.
- Focus only on the visible civic/public-service problem.
- Keep the response suitable for an official government complaint system.
- If multiple issues are visible, identify the primary issue.
- Make the department recommendation based on the detected issue.
"""

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

        if response.parsed is None:
            raise HTTPException(
                status_code=500,
                detail="AI returned an invalid structured response."
            )

        return response.parsed

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"AI analysis failed: {str(exc)}"
        )

