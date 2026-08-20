import { useEffect, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_AI_API_URL || "http://127.0.0.1:8000";

function ComplaintPage({ onBack }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [description, setDescription] = useState("");

  // Human-readable location
  const [location, setLocation] = useState("");

  // GPS coordinates
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const [isLocating, setIsLocating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);

  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const analysisSteps = [
    "Uploading image...",
    "Identifying issue...",
    "Determining category...",
    "Checking priority...",
    "Finding responsible department...",
    "Generating complaint ticket...",
  ];

  // ---------------------------------------------------------
  // Create / clean image preview URL
  // ---------------------------------------------------------

  useEffect(() => {
    if (!selectedImage) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedImage);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedImage]);

  // ---------------------------------------------------------
  // Image selection
  // ---------------------------------------------------------

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setErrorMessage("");
    setAnalysisResult(null);

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setErrorMessage("Image size must be less than 5 MB.");
      event.target.value = "";
      return;
    }

    setSelectedImage(file);
  };

  // ---------------------------------------------------------
  // Remove selected image
  // ---------------------------------------------------------

  const removeImage = () => {
    setSelectedImage(null);
    setPreviewUrl("");
    setAnalysisResult(null);

    const fileInput = document.getElementById("image-upload");

    if (fileInput) {
      fileInput.value = "";
    }
  };

  // ---------------------------------------------------------
  // Get current device location
  // ---------------------------------------------------------

  const handleGetCurrentLocation = () => {
    setErrorMessage("");

    if (!navigator.geolocation) {
      setErrorMessage(
        "Geolocation is not supported by this browser."
      );
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setLatitude(lat);
        setLongitude(lng);

        // We already have coordinates.
        // For the prototype, use them as a fallback address.
        setLocation(
          `Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`
        );

        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);

        if (error.code === error.PERMISSION_DENIED) {
          setErrorMessage(
            "Location permission was denied. Please allow location access or enter the location manually."
          );
        } else {
          setErrorMessage(
            "Unable to get your current location. Please enter it manually."
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // ---------------------------------------------------------
  // Main AI analysis function
  // ---------------------------------------------------------

  const handleAnalyze = async () => {
    setErrorMessage("");
    setAnalysisResult(null);

    if (!selectedImage) {
      setErrorMessage("Please upload an image first.");
      return;
    }

    if (!description.trim()) {
      setErrorMessage("Please describe the issue.");
      return;
    }

    if (!location.trim()) {
      setErrorMessage("Please provide the location.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStep(0);

    try {
      const formData = new FormData();

      // Required image
      formData.append("file", selectedImage);

      // Citizen description
      formData.append("description", description.trim());

      // Location metadata
      if (latitude !== null) {
        formData.append("latitude", String(latitude));
      }

      if (longitude !== null) {
        formData.append("longitude", String(longitude));
      }

      formData.append("address", location.trim());

      // Move loading UI gradually while the real request runs.
      const progressTimer = setInterval(() => {
        setAnalysisStep((current) => {
          if (current >= analysisSteps.length - 1) {
            return current;
          }

          return current + 1;
        });
      }, 700);

      const response = await fetch(
        `${API_BASE_URL}/analyze-image`,
        {
          method: "POST",
          body: formData,
        }
      );

      clearInterval(progressTimer);

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The AI service returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "AI analysis failed. Please try again."
        );
      }

      // Show the final step before displaying the result.
      setAnalysisStep(analysisSteps.length - 1);

      // Store actual API response
      setAnalysisResult(data);

    } catch (error) {
      setErrorMessage(
        error?.message ||
          "Unable to connect to SaarthiAI AI service."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ---------------------------------------------------------
  // Back button
  // ---------------------------------------------------------

  const handleBack = () => {
    if (!isAnalyzing) {
      onBack();
    }
  };

  // ---------------------------------------------------------
  // Result Screen
  // ---------------------------------------------------------

  if (analysisResult) {
    return (
      <div className="min-h-screen bg-slate-50">

        {/* Header */}
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-16">

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 font-bold text-white">
                S
              </div>

              <div>
                <h1 className="text-xl font-bold text-blue-900">
                  SaarthiAI
                </h1>

                <p className="text-xs text-slate-500">
                  Complaint Result
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleBack}
              className="text-sm font-semibold text-slate-600 transition hover:text-blue-700"
            >
              Back
            </button>

          </div>
        </header>

        {/* Result Content */}
        <main className="mx-auto max-w-5xl px-6 py-12">

          {/* Success Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
              ✓
            </div>

            <p className="mt-5 text-sm font-bold uppercase tracking-widest text-blue-700">
              AI Analysis Complete
            </p>

            <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
              Complaint Generated Successfully
            </h2>

            <p className="mt-3 text-slate-600">
              SaarthiAI analyzed your complaint and generated a
              government service ticket.
            </p>
          </div>

          {/* Ticket */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40">

            <div className="rounded-2xl bg-blue-50 p-6 text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
                Ticket ID
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-950">
                {analysisResult.ticket_id}
              </p>

              <div className="mt-4 inline-flex rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                {analysisResult.status}
              </div>
            </div>

            {/* Main AI Details */}
            <div className="mt-8 grid gap-5 md:grid-cols-2">

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Issue Detected
                </p>

                <p className="mt-2 text-lg font-bold text-slate-900">
                  {analysisResult.issue_detected}
                </p>
              </div>

              <div className="rounded-2xl bg-blue-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                  Category
                </p>

                <p className="mt-2 text-lg font-bold text-blue-950">
                  {analysisResult.category}
                </p>
              </div>

              <div className="rounded-2xl bg-orange-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">
                  Priority
                </p>

                <p className="mt-2 text-lg font-bold text-orange-950">
                  {analysisResult.priority}
                </p>
              </div>

              <div className="rounded-2xl bg-purple-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">
                  Department
                </p>

                <p className="mt-2 text-lg font-bold text-purple-950">
                  {analysisResult.department}
                </p>
              </div>

            </div>

            {/* Confidence */}
            <div className="mt-6 rounded-2xl bg-green-50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
                    AI Confidence
                  </p>

                  <p className="mt-1 text-xl font-bold text-green-900">
                    {(analysisResult.confidence * 100).toFixed(0)}%
                  </p>
                </div>

                <div className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                  {analysisResult.review_required
                    ? "Human Review Required"
                    : "High Confidence"}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-6 rounded-2xl border border-slate-200 p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Complaint Summary
              </p>

              <p className="mt-2 leading-7 text-slate-700">
                {analysisResult.summary}
              </p>
            </div>

            {/* Recommended Action */}
            <div className="mt-6 rounded-2xl border border-slate-200 p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Recommended Action
              </p>

              <p className="mt-2 leading-7 text-slate-700">
                {analysisResult.recommended_action}
              </p>
            </div>

            {/* Location */}
            <div className="mt-6 rounded-2xl bg-slate-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Complaint Location
              </p>

              <p className="mt-2 font-semibold text-slate-900">
                {location}
              </p>

              {latitude !== null &&
                longitude !== null && (
                  <p className="mt-1 text-sm text-slate-500">
                    {latitude.toFixed(6)},{" "}
                    {longitude.toFixed(6)}
                  </p>
                )}
            </div>

            {/* Review Warning */}
            {analysisResult.review_required && (
              <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
                <p className="font-bold text-yellow-900">
                  Human Review Required
                </p>

                <p className="mt-1 text-sm leading-6 text-yellow-800">
                  The AI confidence is below the review threshold.
                  This complaint should be verified by a responsible
                  officer before final action.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setAnalysisResult(null);
                  setSelectedImage(null);
                  setPreviewUrl("");
                  setDescription("");
                  setLocation("");
                  setLatitude(null);
                  setLongitude(null);
                  setAnalysisStep(0);
                }}
                className="flex-1 rounded-2xl bg-blue-700 px-6 py-4 font-bold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800"
              >
                Report Another Issue
              </button>

              <button
                type="button"
                onClick={handleBack}
                className="flex-1 rounded-2xl border border-slate-300 bg-white px-6 py-4 font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
              >
                Back to Home
              </button>
            </div>

          </div>
        </main>
      </div>
    );
  }

  // ---------------------------------------------------------
  // Main Complaint / Loading UI
  // ---------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-16">

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 font-bold text-white">
              S
            </div>

            <div>
              <h1 className="text-xl font-bold text-blue-900">
                SaarthiAI
              </h1>

              <p className="text-xs text-slate-500">
                Report a civic issue
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleBack}
            disabled={isAnalyzing}
            className="text-sm font-semibold text-slate-600 transition hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>

        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-4xl px-6 py-12">

        {!isAnalyzing ? (
          <>
            {/* Heading */}
            <div className="mb-10">

              <p className="text-sm font-bold uppercase tracking-widest text-blue-700">
                New Complaint
              </p>

              <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
                Tell us what happened
              </h2>

              <p className="mt-4 max-w-2xl leading-7 text-slate-600">
                Upload a photograph, describe the issue, and provide
                the location. SaarthiAI will analyze it and create
                a trackable government complaint.
              </p>
            </div>

            {/* Error */}
            {errorMessage && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="font-semibold text-red-800">
                  {errorMessage}
                </p>
              </div>
            )}

            {/* Complaint Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40">

              {/* Image Upload */}
              <h3 className="text-xl font-bold text-slate-900">
                Upload an image
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Upload a clear photograph of the civic problem.
              </p>

              <div className="mt-6">

                <label
                  htmlFor="image-upload"
                  className="flex min-h-64 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 transition hover:border-blue-400 hover:bg-blue-50"
                >
                  {selectedImage ? (
                    <div className="w-full text-center">

                      {previewUrl && (
                        <img
                          src={previewUrl}
                          alt="Selected complaint"
                          className="mx-auto max-h-80 rounded-2xl object-contain shadow-md"
                        />
                      )}

                      <p className="mt-4 font-semibold text-blue-700">
                        Click to choose another image
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {selectedImage.name}
                      </p>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          removeImage();
                        }}
                        className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                      >
                        Remove Image
                      </button>

                    </div>
                  ) : (
                    <div className="text-center">

                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-2xl">
                        📷
                      </div>

                      <p className="mt-4 font-semibold text-slate-800">
                        Click to upload an image
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        PNG, JPG or JPEG • Maximum 5 MB
                      </p>

                    </div>
                  )}
                </label>

                <input
                  id="image-upload"
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={handleImageChange}
                />

              </div>

              {/* Description */}
              <div className="mt-8">

                <div className="flex items-center justify-between">

                  <label className="text-sm font-semibold text-slate-800">
                    Describe the issue
                  </label>

                  <span className="text-xs text-slate-400">
                    {description.length}/500
                  </span>

                </div>

                <textarea
                  rows="5"
                  maxLength="500"
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Example: Garbage has been accumulating here for several days."
                  className="mt-3 w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

              </div>

              {/* Location */}
              <div className="mt-8">

                <label className="text-sm font-semibold text-slate-800">
                  Location
                </label>

                <div className="mt-3 flex flex-col gap-3 sm:flex-row">

                  <input
                    type="text"
                    value={location}
                    onChange={(event) => {
                      setLocation(event.target.value);

                      // Manual address does not necessarily have
                      // GPS coordinates.
                      setLatitude(null);
                      setLongitude(null);
                    }}
                    placeholder="Enter location manually"
                    className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />

                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={isLocating}
                    className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLocating
                      ? "Getting Location..."
                      : "Use Current Location"}
                  </button>

                </div>

                {latitude !== null &&
                  longitude !== null && (
                    <p className="mt-2 text-sm text-green-600">
                      ✓ GPS location captured
                    </p>
                  )}

              </div>

              {/* Analyze */}
              <button
                type="button"
                onClick={handleAnalyze}
                className="mt-10 w-full rounded-2xl bg-blue-700 px-6 py-4 text-lg font-bold text-white shadow-lg shadow-blue-700/20 transition hover:-translate-y-0.5 hover:bg-blue-800"
              >
                Analyze with AI
              </button>

            </div>
          </>
        ) : (
          /* ================= ANALYSIS LOADING ================= */

          <div className="flex min-h-[600px] items-center justify-center">

            <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xl shadow-slate-200/40">

              {/* Loading Icon */}
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-700" />
              </div>

              <p className="mt-8 text-sm font-bold uppercase tracking-widest text-blue-700">
                SaarthiAI
              </p>

              <h2 className="mt-3 text-3xl font-bold text-slate-950">
                Analyzing your complaint
              </h2>

              <p className="mt-4 text-slate-500">
                Our AI is analyzing the submitted image and preparing
                your complaint information.
              </p>

              {/* Current Step */}
              <div className="mt-10 rounded-2xl bg-slate-50 p-5">
                <p className="font-semibold text-slate-800">
                  {analysisSteps[analysisStep]}
                </p>
              </div>

              {/* Progress */}
              <div className="mt-6">

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-700 transition-all duration-700"
                    style={{
                      width: `${
                        ((analysisStep + 1) /
                          analysisSteps.length) *
                        100
                      }%`,
                    }}
                  />
                </div>

                <div className="mt-3 flex justify-between text-xs text-slate-400">

                  <span>
                    Step {analysisStep + 1} of{" "}
                    {analysisSteps.length}
                  </span>

                  <span>
                    Please wait...
                  </span>

                </div>
              </div>

              {/* Steps */}
              <div className="mt-8 space-y-3 text-left">

                {analysisSteps.map((step, index) => (
                  <div
                    key={step}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                      index <= analysisStep
                        ? "bg-blue-50 text-blue-800"
                        : "bg-slate-50 text-slate-400"
                    }`}
                  >

                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        index < analysisStep
                          ? "bg-green-500 text-white"
                          : index === analysisStep
                            ? "bg-blue-700 text-white"
                            : "bg-slate-200 text-slate-400"
                      }`}
                    >
                      {index < analysisStep
                        ? "✓"
                        : index + 1}
                    </div>

                    <span className="font-medium">
                      {step}
                    </span>

                  </div>
                ))}

              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default ComplaintPage;