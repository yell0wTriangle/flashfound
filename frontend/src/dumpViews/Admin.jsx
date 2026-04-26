import React, { useState } from "react";
import {
  ShieldAlert,
  Check,
  X,
  Trash2,
  UserPlus,
  Users,
  Mail,
  Calendar,
  Search,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

const App = () => {
  // Access Control State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessKey, setAccessKey] = useState("");
  const [error, setError] = useState(false);

  // Mock Data for Pending Requests
  const [pendingRequests, setPendingRequests] = useState([
    {
      id: "req_1",
      name: "John Doe",
      email: "john@weddingpix.com",
      date: "Oct 20, 2026",
    },
    {
      id: "req_2",
      name: "KIIT Photography Society",
      email: "ksac@kiit.ac.in",
      date: "Oct 21, 2026",
    },
    {
      id: "req_3",
      name: "Sarah Miller",
      email: "sarah.m@freelance.io",
      date: "Oct 22, 2026",
    },
  ]);

  // Mock Data for Active Organizers
  const [activeOrganizers, setActiveOrganizers] = useState([
    {
      id: "org_1",
      name: "TechNova Events",
      email: "admin@technova.com",
      joinedDate: "Jan 15, 2026",
    },
    {
      id: "org_2",
      name: "City Marathon Org",
      email: "access@nyrr.org",
      joinedDate: "Feb 10, 2026",
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");

  // Handlers
  const handleLogin = (e) => {
    e.preventDefault();
    // In a real app, this would check against an environment variable or a secure hash
    if (accessKey === "flashfound_admin_2026") {
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setAccessKey("");
    }
  };

  const approveRequest = (request) => {
    setPendingRequests(pendingRequests.filter((r) => r.id !== request.id));
    setActiveOrganizers([
      {
        ...request,
        joinedDate: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      },
      ...activeOrganizers,
    ]);
  };

  const rejectRequest = (id) => {
    setPendingRequests(pendingRequests.filter((r) => r.id !== id));
  };

  const removeOrganizer = (id) => {
    setActiveOrganizers(activeOrganizers.filter((o) => o.id !== id));
  };

  // --- RENDER LOGIN GATE ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 md:p-10 text-center">
          <div className="w-16 h-16 bg-blue-50 text-[#2563eb] rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-100">
            <ShieldAlert size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
            Internal Access
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            Enter your administrative access key to manage FlashFound
            organizers.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="password"
                placeholder="Access Key"
                value={accessKey}
                onChange={(e) => {
                  setAccessKey(e.target.value);
                  if (error) setError(false);
                }}
                className={`w-full pl-11 pr-4 py-3.5 bg-gray-50 border ${error ? "border-red-500 ring-4 ring-red-500/10" : "border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"} rounded-xl text-sm outline-none transition-all`}
              />
            </div>

            {error && (
              <p className="text-red-500 text-xs font-bold animate-in fade-in slide-in-from-top-1">
                Invalid access key. Access logged.
              </p>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-black active:scale-[0.98] transition-all shadow-lg"
            >
              Verify Identity <ArrowRight size={18} />
            </button>
          </form>

          <p className="mt-8 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
            Authorized Personnel Only
          </p>
        </div>
      </div>
    );
  }

  // --- RENDER DASHBOARD ---
  return (
    <div className="min-h-screen w-full bg-gray-50 font-sans text-gray-900 overflow-y-auto custom-scrollbar pb-20">
      {/* Header Area */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-8 py-8 shrink-0">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-[#2563eb] rounded-xl flex items-center justify-center border border-blue-100 shadow-sm">
              <ShieldCheck size={28} strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                  Admin Console
                </h1>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase rounded border border-emerald-100">
                  Authenticated
                </span>
              </div>
              <p className="text-gray-500 text-sm">
                Review and authorize event organizer credentials.
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto p-4 sm:p-8 space-y-10">
        {/* SECTION: PENDING REQUESTS */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <UserPlus size={20} className="text-[#2563eb]" />
              <h2 className="text-lg font-bold text-gray-900">
                Pending Requests
              </h2>
              <span className="px-2 py-0.5 bg-blue-50 text-[#2563eb] text-xs font-bold rounded-full border border-blue-100">
                {pendingRequests.length}
              </span>
            </div>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-gray-300">
              <CheckCircle2 size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                No pending requests to process.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                      <UserPlus size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-2 py-1 rounded">
                      {req.date}
                    </span>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-bold text-gray-900 truncate">
                      {req.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                      <Mail size={14} />
                      <span className="truncate">{req.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => approveRequest(req)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#2563eb] text-white rounded-xl text-xs font-bold hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm"
                    >
                      <Check size={14} strokeWidth={3} /> Approve
                    </button>
                    <button
                      onClick={() => rejectRequest(req.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <X size={14} strokeWidth={3} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION: AUTHORIZED ORGANIZERS */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Users size={20} className="text-emerald-600" />
            <h2 className="text-lg font-bold text-gray-900">
              Authorized Organizers
            </h2>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full border border-emerald-100">
              {activeOrganizers.length}
            </span>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-gray-400 text-[10px] uppercase tracking-widest border-b border-gray-200">
                  <th className="px-6 py-4 font-bold">Organizer Profile</th>
                  <th className="px-6 py-4 font-bold hidden sm:table-cell">
                    Authorized Since
                  </th>
                  <th className="px-6 py-4 font-bold text-right">
                    Access Control
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeOrganizers.map((org) => (
                  <tr
                    key={org.id}
                    className="hover:bg-gray-50/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <CheckCircle2 size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate">
                            {org.name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {org.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                        <Calendar size={14} className="text-gray-300" />
                        {org.joinedDate}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => removeOrganizer(org.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Revoke Access"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Footer Info */}
      <footer className="max-w-5xl mx-auto px-4 sm:px-8 mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-400 text-[11px] font-medium uppercase tracking-wider">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsAuthenticated(false)}
            className="hover:text-red-500 transition-colors"
          >
            Logout Session
          </button>
          <span>•</span>
          <p>Admin Authorization Logs Active</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            System Online
          </div>
          <span>v1.4.2-adm</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
