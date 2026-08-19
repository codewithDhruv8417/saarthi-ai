import { useState } from "react";

function ComplaintPage({ onBack }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);

  const analysisSteps = [
    "Uploading image...",
    "Identifying issue...",
    "Determining category...",
    "Checking priority...",
    "Finding responsible department...",
    "Generating complaint ticket...",
  ];

  const handleImageChange = (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      alert("Image size must be less than 5 MB.");
      event.target.value = "";
      return;
    }

    setSelectedImage(file);
  };

  const removeImage = () => {
    setSelectedImage(null);

    const fileInput = document.getElementById("image-upload");

    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleAnalyze = () => {
    if (!selectedImage) {
      alert("Please upload an image first.");
      return;
    }

    if (!description.trim()) {
      alert("Please describe the issue.");
      return;
    }

    if (!location.trim()) {
      alert("Please provide the location.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStep(0);

    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;

      if (currentStep < analysisSteps.length) {
        setAnalysisStep(currentStep);
      } else {
        clearInterval(interval);
      }
    }, 1200);
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
                Upload a photograph of the issue and provide a short
                description. SaarthiAI will analyze it and help identify
                the appropriate government department.
              </p>

            </div>


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
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="Enter location manually"
                    className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />

                  <button
                    type="button"
                    className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 font-semibold text-blue-700 transition hover:bg-blue-100"
                  >
                    Use Current Location
                  </button>

                </div>

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
                      width: `${((analysisStep + 1) / analysisSteps.length) * 100}%`,
                    }}
                  ></div>

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

        )}

      </main>

    </div>
  );
}

export default ComplaintPage;