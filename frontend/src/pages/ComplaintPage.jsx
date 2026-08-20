import { useEffect, useState } from "react";

const API_URL =
  import.meta.env.VITE_AI_API_URL ||
  "https://saarthi-api.ds8818059410.workers.dev";

const analysisSteps = [
  "Uploading image...",
  "Identifying issue...",
  "Determining category...",
  "Checking priority...",
  "Finding responsible department...",
  "Generating complaint ticket...",
];

function getErrorMessage(errorData, fallback = "Something went wrong. Please try again.") {
  if (!errorData) {
    return fallback;
  }

  if (typeof errorData === "string") {
    return errorData;
  }

  if (typeof errorData === "object") {
    if (typeof errorData.message === "string") {
      return errorData.message;
    }

    if (typeof errorData.detail === "string") {
      return errorData.detail;
    }

    if (errorData.detail && typeof errorData.detail === "object") {
      if (typeof errorData.detail.message === "string") {
        return errorData.detail.message;
      }

      if (typeof errorData.detail.gemini_response?.error?.message === "string") {
        return errorData.detail.gemini_response.error.message;
      }

      return JSON.stringify(errorData.detail);
    }

    if (typeof errorData.error === "string") {
      return errorData.error;
    }

    return JSON.stringify(errorData);
  }

  return fallback;
}

function ComplaintPage({ onBack }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);

  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    if (!isAnalyzing) {
      return undefined;
    }

    const interval = setInterval(() => {
      setAnalysisStep((current) =>
        current < analysisSteps.length - 1 ? current + 1 : current
      );
    }, 1200);

    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setResult(null);

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setError("Image size must be less than 5 MB.");
      event.target.value = "";
      return;
    }

    setSelectedImage(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setError("");
    setResult(null);

    const fileInput = document.getElementById("image-upload");

    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleGetCurrentLocation = () => {
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setLatitude(lat);
        setLongitude(lng);

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
          );

          if (response.ok) {
            const data = await response.json();

            const address =
              data.display_name ||
              `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

            setLocation(address);
          } else {
            setLocation(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          }
        } catch {
          setLocation(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        } finally {
          setIsGettingLocation(false);
        }
      },
      (geoError) => {
        setIsGettingLocation(false);

        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            setError("Location permission was denied. Enter the location manually.");
            break;

          case geoError.POSITION_UNAVAILABLE:
            setError("Current location is unavailable. Enter the location manually.");
            break;

          case geoError.TIMEOUT:
            setError("Location request timed out. Enter the location manually.");
            break;

          default:
            setError("Could not determine your location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const handleAnalyze = async () => {
    setError("");
    setResult(null);

    if (!selectedImage) {
      setError("Please upload an image first.");
      return;
    }

    if (!description.trim()) {
      setError("Please describe the issue.");
      return;
    }

    if (!location.trim()) {
      setError("Please provide the location.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStep(0);

    try {
      const formData = new FormData();

      formData.append("file", selectedImage);
      formData.append("description", description.trim());
      formData.append("address", location.trim());

      if (latitude !== null) {
        formData.append("latitude", String(latitude));
      }

      if (longitude !== null) {
        formData.append("longitude", String(longitude));
      }

      const response = await fetch(
        `${API_URL}/analyze-image`,
        {
          method: "POST",
          body: formData,
        }
      );

      const contentType = response.headers.get("content-type") || "";

      let responseData;

      if (contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            responseData,
            `Request failed with status ${response.status}.`
          )
        );
      }

      setAnalysisStep(analysisSteps.length - 1);

      setResult(responseData);

      // Give the final step a moment to display.
      await new Promise((resolve) => setTimeout(resolve, 800));
    } catch (requestError) {
      console.error("Complaint analysis failed:", requestError);

      setError(
        requestError?.message ||
          "Could not submit the complaint. Please try again."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

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
            onClick={onBack}
            disabled={isAnalyzing}
            className="text-sm font-semibold text-slate-600 transition hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-4xl px-6 py-12">
        {!isAnalyzing && !result ? (
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
                Upload a photograph, describe the issue, and provide the
                location. SaarthiAI will analyze it and create a trackable
                government complaint.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                <p className="font-semibold">
                  {error}
                </p>
              </div>
            )}

            {/* Complaint Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40">
              {/* Image */}
              <h3 className="text-xl font-bold text-slate-900">
                Upload an image
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Upload a clear photograph of the civic problem.
              </p>

              <div className="mt-6">
                <label
                  htmlFor="image-upload"
                  className="flex min-h-64 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/60 p-6 transition hover:border-blue-500 hover:bg-blue-50"
                >
                  {selectedImage ? (
                    <div className="w-full text-center">
                      <img
                        src={URL.createObjectURL(selectedImage)}
                        alt="Selected complaint"
                        className="mx-auto max-h-80 rounded-2xl object-contain shadow-md"
                      />

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
                  accept="image/png,image/jpeg,image/jpg"
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
                  onChange={(event) => setDescription(event.target.value)}
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
                      setLatitude(null);
                      setLongitude(null);
                    }}
                    placeholder="Enter location manually"
                    className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />

                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={isGettingLocation}
                    className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isGettingLocation
                      ? "Getting Location..."
                      : "Use Current Location"}
                  </button>
                </div>

                {latitude !== null && longitude !== null && (
                  <p className="mt-2 text-xs text-slate-400">
                    Coordinates: {latitude.toFixed(6)},{" "}
                    {longitude.toFixed(6)}
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
        ) : isAnalyzing ? (
          /* Analysis Loading */
          <div className="flex min-h-[600px] items-center justify-center">
            <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xl shadow-slate-200/40">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-700"></div>
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

              <div className="mt-10 rounded-2xl bg-slate-50 p-5">
                <p className="font-semibold text-slate-800">
                  {analysisSteps[analysisStep]}
                </p>
              </div>

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
                    Step {analysisStep + 1} of {analysisSteps.length}
                  </span>

                  <span>
                    Please wait...
                  </span>
                </div>
              </div>

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
                      {index < analysisStep ? "✓" : index + 1}
                    </div>

                    <span className="font-medium">
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Result */
          <div className="space-y-6">
            <div className="rounded-3xl border border-green-200 bg-white p-8 shadow-xl shadow-slate-200/40">

              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
                  ✓
                </div>

                <p className="mt-6 text-sm font-bold uppercase tracking-widest text-green-600">
                  Complaint Submitted
                </p>

                <h2 className="mt-2 text-3xl font-bold text-slate-950">
                  Your complaint has been created
                </h2>

                <p className="mt-3 text-slate-500">
                  Keep this ticket ID to track your complaint.
                </p>
              </div>

              <div className="mt-8 rounded-2xl bg-blue-50 p-6 text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">
                  Ticket ID
                </p>

                <p className="mt-2 text-2xl font-bold tracking-wide text-blue-900">
                  {result.ticket_id}
                </p>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Issue Detected
                  </p>

                  <p className="mt-2 font-semibold text-slate-900">
                    {result.issue_detected}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Category
                  </p>

                  <p className="mt-2 font-semibold text-slate-900">
                    {result.category}
                  </p>
                </div>

                <div className="rounded-2xl bg-orange-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">
                    Priority
                  </p>

                  <p className="mt-2 font-semibold text-orange-950">
                    {result.priority}
                  </p>
                </div>

                <div className="rounded-2xl bg-blue-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                    Department
                  </p>

                  <p className="mt-2 font-semibold text-blue-950">
                    {result.department}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Summary
                </p>

                <p className="mt-2 leading-7 text-slate-700">
                  {result.summary}
                </p>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Recommended Action
                </p>

                <p className="mt-2 leading-7 text-slate-700">
                  {result.recommended_action}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between rounded-2xl bg-green-50 p-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
                    Status
                  </p>

                  <p className="mt-1 font-semibold text-green-900">
                    {result.status}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
                    Confidence
                  </p>

                  <p className="mt-1 text-2xl font-bold text-green-800">
                    {Math.round((result.confidence || 0) * 100)}%
                  </p>
                </div>
              </div>

              {result.address && (
                <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Location
                  </p>

                  <p className="mt-2 text-slate-700">
                    {result.address}
                  </p>
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setSelectedImage(null);
                    setDescription("");
                    setLocation("");
                    setLatitude(null);
                    setLongitude(null);
                    setError("");
                  }}
                  className="flex-1 rounded-2xl bg-blue-700 px-6 py-4 font-bold text-white transition hover:bg-blue-800"
                >
                  Report Another Issue
                </button>

                <button
                  type="button"
                  onClick={onBack}
                  className="flex-1 rounded-2xl border border-slate-300 bg-white px-6 py-4 font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                >
                  Back to Home
                </button>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ComplaintPage;