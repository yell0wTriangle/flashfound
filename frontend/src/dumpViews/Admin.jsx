import React, { useMemo, useState } from "react";
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
import { apiRequest } from "../lib/api.js";

function formatDate(input) {
  if (!input) return "-";
  try {
    return new Date(input).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return input;
  }
}

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminToken, setAdminToken] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [allRequests, setAllRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const loadRequests = async (token, query = "") => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    const suffix = params.toString() ? `?${params.toString()}` : "";
    const data = await apiRequest(`/admin/organiser-requests${suffix}`, {
      token,
    });
    setAllRequests(data?.requests || []);
  };

  const handleLogin = (event) => {
    event.preventDefault();
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiRequest("/admin/auth", {
          method: "POST",
          body: { access_key: accessKey },
        });
        const token = data?.token;
        if (!token) {
          throw new Error("Admin token missing in response.");
        }
        await loadRequests(token);
        setAdminToken(token);
        setIsAuthenticated(true);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : String(requestError));
        setAccessKey("");
      } finally {
        setLoading(false);
      }
    };
    run();
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    if (!adminToken) return;
    const run = async () => {
      try {
        await loadRequests(adminToken, value);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : String(requestError));
      }
    };
    run();
  };

  const handleRequestReview = async (requestId, action) => {
    if (!adminToken) return;
    setLoading(true);
    setError("");
    try {
      await apiRequest(`/admin/organiser-requests/${requestId}/${action}`, {
        method: "POST",
        token: adminToken,
      });
      await loadRequests(adminToken, searchQuery);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally {
      setLoading(false);
    }
  };

  const pendingRequests = useMemo(
    () => allRequests.filter((request) => request.status === "pending"),
    [allRequests],
  );

  const activeOrganizers = useMemo(() => {
    const approved = allRequests.filter((request) => request.status === "approved");
    const uniqueByUser = new Map();
    approved.forEach((request) => {
      if (!uniqueByUser.has(request.user_id)) {
        uniqueByUser.set(request.user_id, request);
      }
    });
    return [...uniqueByUser.values()];
  }, [allRequests]);

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
                onChange={(event) => {
                  setAccessKey(event.target.value);
                  setError("");
                }}
                className={`w-full pl-11 pr-4 py-3.5 bg-gray-50 border ${error ? "border-red-500 ring-4 ring-red-500/10" : "border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"} rounded-xl text-sm outline-none transition-all`}
              />
            </div>

            {error ? (
              <p className="text-red-500 text-xs font-bold animate-in fade-in slide-in-from-top-1">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-black active:scale-[0.98] transition-all shadow-lg disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify Identity"} <ArrowRight size={18} />
            </button>
          </form>

          <p className="mt-8 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
            Authorized Personnel Only
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 font-sans text-gray-900 overflow-y-auto custom-scrollbar pb-20">
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
              onChange={(event) => handleSearch(event.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto p-4 sm:p-8 space-y-10">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

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
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                      <UserPlus size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-2 py-1 rounded">
                      {formatDate(request.requested_at)}
                    </span>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-bold text-gray-900 truncate">
                      {request.user?.display_name || "Unknown"}
                    </h3>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                      <Mail size={14} />
                      <span className="truncate">{request.user?.email || "No email"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleRequestReview(request.id, "approve")}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#2563eb] text-white rounded-xl text-xs font-bold hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm disabled:opacity-50"
                    >
                      <Check size={14} strokeWidth={3} /> Approve
                    </button>
                    <button
                      onClick={() => handleRequestReview(request.id, "deny")}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      <X size={14} strokeWidth={3} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

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
                {activeOrganizers.map((organizer) => (
                  <tr
                    key={organizer.user_id}
                    className="hover:bg-gray-50/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <CheckCircle2 size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate">
                            {organizer.user?.display_name || "Unknown"}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {organizer.user?.email || "No email"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                        <Calendar size={14} className="text-gray-300" />
                        {formatDate(organizer.reviewed_at || organizer.requested_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        disabled
                        className="p-2 text-gray-300 bg-gray-50 rounded-lg cursor-not-allowed"
                        title="Revoke access will be added in a later phase"
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

      <footer className="max-w-5xl mx-auto px-4 sm:px-8 mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-400 text-[11px] font-medium uppercase tracking-wider">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setIsAuthenticated(false);
              setAdminToken("");
              setAllRequests([]);
              setSearchQuery("");
            }}
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
