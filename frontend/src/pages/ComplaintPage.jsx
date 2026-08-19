import { useState } from "react";

function ComplaintPage() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  const handleImageChange = (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    // Maximum file size = 5 MB
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

    console.log("Complaint Data:");
    console.log("Image:", selectedImage);
    console.log("Description:", description);
    console.log("Location:", location);

    alert("All complaint details are ready for AI analysis.");
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ================= HEADER ================= */}

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
            className="text-sm font-semibold text-slate-600 transition hover:text-blue-700"
          >
            Back
          </button>

        </div>
      </header>


      {/* ================= MAIN ================= */}

      <main className="mx-auto max-w-4xl px-6 py-12">

        {/* Heading */}

        <div className="mb-10">

          <p className="text-sm font-bold uppercase tracking-widest text-blue-700">
            New Complaint
          </p>

          <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
            Tell us what happened
          </h2>

          <p className="mt-4 max-w-2xl leading-7 text-slate-600">
            Upload a photograph of the issue and provide a short description.
            SaarthiAI will analyze it and help identify the appropriate
            government department.
          </p>

        </div>


        {/* ================= COMPLAINT CARD ================= */}

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40">


          {/* ================= IMAGE ================= */}

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


          {/* ================= DESCRIPTION ================= */}

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


          {/* ================= LOCATION ================= */}

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


          {/* ================= ANALYZE ================= */}

          <button
            type="button"
            onClick={handleAnalyze}
            className="mt-10 w-full rounded-2xl bg-blue-700 px-6 py-4 text-lg font-bold text-white shadow-lg shadow-blue-700/20 transition hover:-translate-y-0.5 hover:bg-blue-800"
          >
            Analyze with AI
          </button>

        </div>

      </main>

    </div>
  );
}

export default ComplaintPage;