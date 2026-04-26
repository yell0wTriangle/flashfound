import { Check, Lock, Search, ShieldAlert, X } from "lucide-react";
import { useMemo, useState } from "react";

const requests = [
  { id: "req_1", name: "Aarav Mehta", email: "aarav@flashfound.demo", date: "Apr 26, 2026" },
  { id: "req_2", name: "KIIT Photography Society", email: "ksac@kiit.ac.in", date: "Apr 26, 2026" },
  { id: "req_3", name: "Moonlit Weddings", email: "hello@moonlit.demo", date: "Apr 26, 2026" },
];

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [key, setKey] = useState("");
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(requests);

  const filtered = useMemo(
    () => pending.filter((request) => [request.name, request.email].some((value) => value.toLowerCase().includes(query.toLowerCase()))),
    [pending, query],
  );

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (key.trim()) setAuthenticated(true);
          }}
          className="w-full max-w-md bg-white text-gray-900 rounded-3xl p-8 shadow-2xl"
        >
          <ShieldAlert className="text-[#2563eb] mb-5" size={36} />
          <h1 className="text-2xl font-bold mb-2">Admin Access</h1>
          <p className="text-gray-500 mb-5">Manual URL only. Real key verification will happen on the backend.</p>
          <div className="relative">
            <Lock size={17} className="absolute left-4 top-3.5 text-gray-400" />
            <input value={key} onChange={(event) => setKey(event.target.value)} placeholder="Enter admin key" className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200" />
          </div>
          <button className="mt-4 w-full py-3 rounded-xl bg-[#2563eb] text-white font-semibold">Unlock Admin</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
        <p className="text-gray-500 mt-1">Approve or deny organiser access requests.</p>
      </header>
      <div className="relative max-w-2xl mb-5">
        <Search size={18} className="absolute left-4 top-3.5 text-gray-400" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users" className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white" />
      </div>
      <div className="max-w-4xl space-y-3">
        {filtered.map((request) => (
          <article key={request.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-gray-900">{request.name}</h2>
              <p className="text-sm text-gray-500">{request.email} - {request.date}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPending((prev) => prev.filter((item) => item.id !== request.id))} className="px-3 py-2 rounded-xl bg-green-600 text-white font-semibold flex items-center gap-2">
                <Check size={16} /> Approve
              </button>
              <button onClick={() => setPending((prev) => prev.filter((item) => item.id !== request.id))} className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold flex items-center gap-2">
                <X size={16} /> Deny
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
