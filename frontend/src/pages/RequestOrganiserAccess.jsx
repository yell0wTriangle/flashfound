import { ArrowRight, CalendarPlus, CheckCircle2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RequestOrganiserAccess() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-full bg-gray-50 p-6 lg:p-8 flex items-center justify-center">
      <div className="max-w-3xl w-full bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/60 p-8">
        <div className="h-14 w-14 rounded-2xl bg-blue-50 text-[#2563eb] flex items-center justify-center mb-6">
          {submitted ? <CheckCircle2 size={28} /> : <CalendarPlus size={28} />}
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-3">
          {submitted ? "Organiser access approved for demo" : "Request organiser access"}
        </h1>
        <p className="text-gray-600 mb-6">
          In the real app this sends a request to the admin endpoint. For this unlocked routing demo, submitting lets you continue to the dashboard.
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          <input className="px-4 py-3 rounded-xl border border-gray-200" placeholder="Display name" defaultValue="Aarav Mehta" />
          <input className="px-4 py-3 rounded-xl border border-gray-200" placeholder="Organisation" defaultValue="FlashFound Demo Events" />
        </div>
        <button
          onClick={() => (submitted ? navigate("/organiser/dashboard") : setSubmitted(true))}
          className="px-5 py-3 rounded-xl bg-[#2563eb] text-white font-semibold flex items-center gap-2"
        >
          {submitted ? "Open Dashboard" : "Submit Request"} <ArrowRight size={18} />
        </button>
        <div className="mt-6 flex gap-3 text-sm text-gray-500">
          <ShieldCheck size={18} className="text-blue-500" />
          Admin approval remains backend-only later; no admin link is exposed here.
        </div>
      </div>
    </div>
  );
}
