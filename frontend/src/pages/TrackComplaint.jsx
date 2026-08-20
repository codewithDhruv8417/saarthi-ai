import { useState } from "react";

function TrackComplaint({ onBack }) {
  const [ticketId, setTicketId] = useState("");
  const [complaint, setComplaint] = useState(null);
  const [error, setError] = useState("");

  const handleTrack = async () => {
  setError("");
  setComplaint(null);

  const id = ticketId.trim().toUpperCase();

  if (!id) {
    setError("Please enter your ticket ID.");
    return;
  }

  try {
    const API_BASE_URL =
      import.meta.env.VITE_AI_API_URL ||
      "http://127.0.0.1:8000";

    const response = await fetch(
      `${API_BASE_URL}/complaints/${encodeURIComponent(id)}`
    );

    const data = await response.json();

    if (!response.ok) {
      setError(
        data?.detail || "No complaint found for this ticket ID."
      );
      return;
    }

    // Convert backend response into the format
    // already used by the tracking UI.
    setComplaint({
      ticket_id: data.ticket_id,
      issue: data.issue_detected,
      category: data.category,
      department: data.department,
      priority: data.priority,
      status: data.status,
      location:
        data.address ||
        (
          data.latitude !== null &&
          data.longitude !== null
            ? `${data.latitude}, ${data.longitude}`
            : "Location not available"
        ),
      submitted: data.created_at
        ? new Date(data.created_at).toLocaleString()
        : "Unknown",
      assigned_officer_name:
        data.assigned_officer_name || null,
      confidence: data.confidence,
    });
  } catch (error) {
    console.error("Complaint tracking error:", error);

    setError(
      "Unable to connect to SaarthiAI. Please make sure the AI service is running."
    );
  }
};

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-16">

          {/* Logo */}
          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 font-bold text-white">
              S
            </div>

            <div>
              <h1 className="text-xl font-bold text-blue-900">
                SaarthiAI
              </h1>

              <p className="text-xs text-slate-500">
                Complaint Tracking
              </p>
            </div>

          </div>

          {/* Back */}
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-semibold text-slate-600 transition hover:text-blue-700"
          >
            Back
          </button>

        </div>
      </header>


      {/* Main */}
      <main className="mx-auto max-w-4xl px-6 py-14">

        {/* Heading */}
        <div className="mb-10 text-center">

          <p className="text-sm font-bold uppercase tracking-widest text-blue-700">
            Complaint Tracking
          </p>

          <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
            Track your complaint
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">
            Enter your complaint ticket ID to check the current status
            of your civic complaint.
          </p>

        </div>


        {/* Search Card */}
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40">

          <label
            htmlFor="ticket-id"
            className="text-sm font-semibold text-slate-800"
          >
            Complaint Ticket ID
          </label>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row">

            <input
              id="ticket-id"
              type="text"
              value={ticketId}
              onChange={(event) => {
                setTicketId(event.target.value);
                setError("");
                setComplaint(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleTrack();
                }
              }}
              placeholder="Example: TKT-2026-001"
              className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

            <button
              type="button"
              onClick={handleTrack}
              className="rounded-2xl bg-blue-700 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800"
            >
              Track Complaint
            </button>

          </div>


          {/* Error */}
          {error && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">

              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100">
                !
              </span>

              <span>{error}</span>

            </div>
          )}

        </div>


        {/* Complaint Result */}
        {complaint && (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40">

            {/* Ticket Header */}
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center">

              <div>

                <p className="text-sm text-slate-500">
                  Ticket ID
                </p>

                <h3 className="mt-1 text-2xl font-bold text-slate-950">
                  {complaint.ticket_id}
                </h3>

              </div>

              <span className="w-fit rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                {complaint.status}
              </span>

            </div>


            {/* Complaint Progress */}
            <div className="mt-8">

              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Complaint Progress
              </h4>

              <div className="mt-6 flex items-center">

                {/* Submitted */}
                <div className="flex flex-col items-center">

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">
                    ✓
                  </div>

                  <p className="mt-2 text-xs font-semibold text-blue-700">
                    Submitted
                  </p>

                </div>


                {/* Line */}
                <div className="h-1 flex-1 bg-slate-200" />


                {/* Under Review */}
                <div className="flex flex-col items-center">

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-400">
                    2
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    Under Review
                  </p>

                </div>


                {/* Line */}
                <div className="h-1 flex-1 bg-slate-200" />


                {/* Resolved */}
                <div className="flex flex-col items-center">

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-400">
                    3
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    Resolved
                  </p>

                </div>

              </div>

            </div>


            {/* Complaint Details */}
            <div className="mt-10 grid gap-4 sm:grid-cols-2">

              {/* Issue */}
              <div className="rounded-2xl bg-slate-50 p-5">

                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Issue
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {complaint.issue}
                </p>

              </div>


              {/* Category */}
              <div className="rounded-2xl bg-slate-50 p-5">

                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Category
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {complaint.category}
                </p>

              </div>


              {/* Department */}
              <div className="rounded-2xl bg-slate-50 p-5">

                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Department
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {complaint.department}
                </p>

              </div>


              {/* Priority */}
              <div className="rounded-2xl bg-slate-50 p-5">

                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Priority
                </p>

                <p className="mt-2 font-semibold text-orange-600">
                  {complaint.priority}
                </p>

              </div>


              {/* Location */}
              <div className="rounded-2xl bg-slate-50 p-5">

                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Location
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {complaint.location}
                </p>

              </div>


              {/* Submitted */}
              <div className="rounded-2xl bg-slate-50 p-5">

                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Submitted
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {complaint.submitted}
                </p>

              </div>

            </div>

          </div>
        )}

      </main>

    </div>
  );
}

export default TrackComplaint;