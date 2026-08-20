import { useState } from "react";
import ComplaintPage from "./pages/ComplaintPage";
import TrackComplaint from "./pages/TrackComplaint";

function App() {
  const [currentPage, setCurrentPage] = useState("home");

  if (currentPage === "complaint") {
    return (
      <ComplaintPage
        onBack={() => setCurrentPage("home")}
      />
    );
  }

  if (currentPage === "track") {
    return (
      <TrackComplaint
        onBack={() => setCurrentPage("home")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-5 lg:px-16">

        <button
          type="button"
          onClick={() => setCurrentPage("home")}
          className="flex items-center gap-3 text-left"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 font-bold text-white">
            S
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-blue-900">
              SaarthiAI
            </h1>

            <p className="text-xs text-slate-500">
              Citizen • Government • AI
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setCurrentPage("track")}
          className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
        >
          Track Complaint
        </button>

      </nav>

      {/* Hero */}
      <main>

        <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-16 lg:grid-cols-2 lg:px-16 lg:pt-24">

          {/* Left */}
          <div>

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
              <span className="h-2 w-2 rounded-full bg-blue-600"></span>
              AI-powered civic grievance platform
            </div>

            <h2 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight text-slate-950 md:text-6xl">
              Guiding Every Citizen's Voice
              <span className="block text-blue-700">
                to the Right Authority
              </span>
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              SaarthiAI helps citizens report civic problems using images
              and descriptions. AI analyzes the issue, identifies the
              responsible department, and creates a trackable complaint.
            </p>

            {/* CTA */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">

              <button
                type="button"
                onClick={() => setCurrentPage("complaint")}
                className="rounded-xl bg-blue-700 px-7 py-3.5 font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:-translate-y-0.5 hover:bg-blue-800"
              >
                Report an Issue
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage("track")}
                className="rounded-xl border border-slate-300 bg-white px-7 py-3.5 font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-700"
              >
                Track Complaint
              </button>

            </div>

            {/* Trust */}
            <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-500">
              <span>✓ AI-assisted analysis</span>
              <span>✓ Smart department routing</span>
              <span>✓ Complaint tracking</span>
            </div>

          </div>

          {/* Right visual */}
          <div className="relative">

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-300/40">

              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-5">

                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    SaarthiAI Workflow
                  </p>

                  <h3 className="mt-1 text-xl font-bold text-slate-900">
                    From Report to Resolution
                  </h3>
                </div>

                <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  AI Assisted
                </div>

              </div>

              {/* Workflow */}
              <div className="mt-6 space-y-4">

                {/* Step 1 */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">

                  <div className="flex items-center gap-4">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-700 font-bold text-white">
                      01
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Citizen Report
                      </p>

                      <p className="mt-1 font-semibold text-slate-900">
                        Upload an image and describe the issue
                      </p>
                    </div>

                  </div>

                </div>

                {/* Arrow */}
                <div className="flex justify-center text-xl text-blue-300">
                  ↓
                </div>

                {/* Step 2 */}
                <div className="rounded-2xl bg-blue-50 p-5">

                  <div className="flex items-center gap-4">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-700 font-bold text-white">
                      02
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                        AI Analysis
                      </p>

                      <p className="mt-1 font-semibold text-blue-950">
                        Identify issue, priority and department
                      </p>
                    </div>

                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">

                    <div className="rounded-xl bg-white p-3">
                      <p className="text-xs text-slate-400">
                        Issue
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        Detected
                      </p>
                    </div>

                    <div className="rounded-xl bg-white p-3">
                      <p className="text-xs text-slate-400">
                        Priority
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        Assessed
                      </p>
                    </div>

                    <div className="rounded-xl bg-white p-3">
                      <p className="text-xs text-slate-400">
                        Department
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        Routed
                      </p>
                    </div>

                  </div>

                </div>

                {/* Arrow */}
                <div className="flex justify-center text-xl text-blue-300">
                  ↓
                </div>

                {/* Step 3 */}
                <div className="rounded-2xl border border-green-100 bg-green-50 p-5">

                  <div className="flex items-center gap-4">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-600 font-bold text-white">
                      03
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
                        Trackable Complaint
                      </p>

                      <p className="mt-1 font-semibold text-green-950">
                        Receive a ticket and follow progress
                      </p>
                    </div>

                  </div>

                </div>

              </div>

            </div>

            {/* Decorative elements */}
            <div className="absolute -bottom-5 -left-5 -z-10 h-32 w-32 rounded-full bg-blue-100 blur-2xl"></div>
            <div className="absolute -right-5 -top-5 -z-10 h-32 w-32 rounded-full bg-indigo-100 blur-2xl"></div>

          </div>

        </section>

        {/* How it works */}
        <section className="border-t border-slate-200 bg-white px-6 py-20 lg:px-16">

          <div className="mx-auto max-w-7xl">

            <div className="max-w-2xl">

              <p className="text-sm font-bold uppercase tracking-widest text-blue-700">
                How it works
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                From citizen report to responsible authority
              </h2>

              <p className="mt-4 text-slate-600">
                A simple AI-assisted workflow designed to make civic
                complaints easier to report, route, and track.
              </p>

            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">

              {/* Report */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:shadow-lg">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 font-bold text-white">
                  01
                </div>

                <h3 className="mt-5 text-xl font-bold">
                  Report
                </h3>

                <p className="mt-2 leading-7 text-slate-600">
                  Upload a photograph of the civic problem and describe
                  what you observed.
                </p>

              </div>

              {/* Analyze */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:shadow-lg">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 font-bold text-white">
                  02
                </div>

                <h3 className="mt-5 text-xl font-bold">
                  Analyze
                </h3>

                <p className="mt-2 leading-7 text-slate-600">
                  AI analyzes the image, identifies the issue, determines
                  priority, and recommends the responsible department.
                </p>

              </div>

              {/* Track */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:shadow-lg">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 font-bold text-white">
                  03
                </div>

                <h3 className="mt-5 text-xl font-bold">
                  Track
                </h3>

                <p className="mt-2 leading-7 text-slate-600">
                  Receive a ticket and follow its progress from submission
                  through resolution.
                </p>

              </div>

            </div>

          </div>

        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-950 px-6 py-8 text-center text-sm text-slate-400">
        <p>
          © 2026 SaarthiAI — AI-Powered Citizen Grievance Management
        </p>
      </footer>

    </div>
  );
}

export default App;