import { useState } from "react";
import ComplaintPage from "./pages/ComplaintPage";
function App() {
    const [showComplaintPage, setShowComplaintPage] = useState(false);
      if (showComplaintPage) {
        return <ComplaintPage />;
      }
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-5 lg:px-16">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white font-bold">
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
        </div>

        <button className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700">
          Login
        </button>
      </nav>

      {/* Hero Section */}
      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-16 lg:grid-cols-2 lg:px-16 lg:pt-24">

          {/* Left Content */}
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
              responsible department, and helps create a trackable complaint.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button
                 onClick={() => setShowComplaintPage(true)}
                 className="rounded-xl bg-blue-700 px-7 py-3.5 font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:-translate-y-0.5 hover:bg-blue-800"
              >
                Report an Issue
              </button>

              <button className="rounded-xl border border-slate-300 bg-white px-7 py-3.5 font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-700">
                Track Complaint
              </button>
            </div>

            {/* Trust indicators */}
            <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-500">
              <span>✓ AI-assisted analysis</span>
              <span>✓ Smart department routing</span>
              <span>✓ Complaint tracking</span>
            </div>
          </div>

          {/* Right Visual */}
          <div className="relative">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-300/40">

              {/* Dashboard header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    AI Complaint Analysis
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-slate-900">
                    Issue detected
                  </h3>
                </div>

                <div className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                  High Confidence
                </div>
              </div>

              {/* Analysis */}
              <div className="mt-6 space-y-4">

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Detected Issue
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    Large water-filled pothole
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">

                  <div className="rounded-2xl bg-blue-50 p-4">
                    <p className="text-xs text-blue-600">
                      Category
                    </p>
                    <p className="mt-1 font-semibold text-blue-950">
                      Road Infrastructure
                    </p>
                  </div>

                  <div className="rounded-2xl bg-orange-50 p-4">
                    <p className="text-xs text-orange-600">
                      Priority
                    </p>
                    <p className="mt-1 font-semibold text-orange-950">
                      High
                    </p>
                  </div>

                </div>

                <div className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Responsible Department
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    Public Works Department
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-green-50 p-4">
                  <div>
                    <p className="text-xs text-green-600">
                      Ticket Status
                    </p>
                    <p className="mt-1 font-semibold text-green-900">
                      Submitted
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-green-600">
                      Confidence
                    </p>
                    <p className="mt-1 text-xl font-bold text-green-800">
                      95%
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Decorative element */}
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

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:shadow-lg">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 font-bold text-white">
                  01
                </div>

                <h3 className="mt-5 text-xl font-bold">
                  Report
                </h3>

                <p className="mt-2 leading-7 text-slate-600">
                  Upload a photograph of the civic problem and optionally
                  describe what you observed.
                </p>
              </div>

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