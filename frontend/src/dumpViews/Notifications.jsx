import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  Menu,
  Image as ImageIcon,
  Compass,
  Bell,
  User,
  CalendarPlus,
  Check,
  X,
  Clock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { apiRequest } from "../lib/api.js";
import { supabase } from "../lib/supabase.js";
import { DEFAULT_AVATAR_PLACEHOLDER } from "../lib/avatarPlaceholder.js";

const NavBar = ({ activePage }) => {
  return (
    <nav className="hidden md:flex flex-col items-center py-6 bg-white border-r border-gray-200 w-20 h-full shrink-0 z-30">
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-[#2563eb] mb-8 cursor-pointer transition-transform hover:scale-105">
        <Camera size={26} strokeWidth={2.5} />
      </div>

      <div className="flex flex-col gap-6 w-full items-center">
        <button
          className={`p-3 rounded-xl transition-all ${
            activePage === "my-photos"
              ? "text-[#2563eb] bg-blue-50 shadow-sm border border-blue-100"
              : "text-gray-400 hover:text-[#2563eb] hover:bg-blue-50"
          }`}
          title="My Photos"
        >
          <ImageIcon size={24} />
        </button>

        <button
          className={`p-3 rounded-xl transition-all ${
            activePage === "discover"
              ? "text-[#2563eb] bg-blue-50 shadow-sm border border-blue-100"
              : "text-gray-400 hover:text-[#2563eb] hover:bg-blue-50"
          }`}
          title="Find Events"
        >
          <Compass size={24} />
        </button>

        <button
          className={`p-3 rounded-xl transition-all ${
            activePage === "manage-events"
              ? "text-[#2563eb] bg-blue-50 shadow-sm border border-blue-100"
              : "text-gray-400 hover:text-[#2563eb] hover:bg-blue-50"
          }`}
          title="Organizer Access (Create & Manage Events)"
        >
          <CalendarPlus size={24} />
        </button>
      </div>

      <div className="mt-auto flex flex-col gap-4 w-full items-center">
        <button
          className={`relative p-3 rounded-xl transition-all ${
            activePage === "notifications"
              ? "text-[#2563eb] bg-blue-50 shadow-sm border border-blue-100"
              : "text-gray-400 hover:text-[#2563eb] hover:bg-blue-50"
          }`}
          title="Notifications"
        >
          <Bell size={24} />
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <button
          className={`p-3 rounded-xl transition-all ${
            activePage === "profile"
              ? "text-[#2563eb] bg-blue-50 shadow-sm border border-blue-100"
              : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
          }`}
          title="Profile"
        >
          <User size={24} />
        </button>
      </div>
    </nav>
  );
};

function formatRelative(input) {
  const now = Date.now();
  const at = new Date(input).getTime();
  if (!Number.isFinite(at)) return "";
  const diffMs = Math.max(0, now - at);
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

const App = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [requestStatusById, setRequestStatusById] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const withToken = useCallback(async (fn) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error("Session expired. Please log in again.");
    }
    return fn(session.access_token);
  }, []);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await withToken((token) =>
        apiRequest("/notifications", {
          token,
        }),
      );
      setNotifications(data?.notifications || []);
    } catch (requestError) {
      setNotifications([]);
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally {
      setLoading(false);
    }
  }, [withToken]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications],
  );

  const markAllAsRead = async () => {
    try {
      await withToken((token) =>
        apiRequest("/notifications/read-all", {
          method: "POST",
          token,
        }),
      );
      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          is_read: true,
        })),
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    }
  };

  const resolveEventRoute = async ({ token, eventId }) => {
    try {
      const eventData = await apiRequest(`/events/${eventId}/people`, { token });
      const typePath = eventData?.event?.type === "private" ? "private" : "public";
      return `/events/${eventId}/${typePath}`;
    } catch {
      return "/events";
    }
  };

  const handleViewEvent = async (notification) => {
    setBusyId(notification.id);
    setError("");
    try {
      await withToken(async (token) => {
        await apiRequest(`/notifications/${notification.id}/read`, {
          method: "POST",
          token,
        });
        const route = notification.event_id
          ? await resolveEventRoute({ token, eventId: notification.event_id })
          : "/events";
        navigate(route, { state: { from: "/notifications" } });
      });
      setNotifications((previous) =>
        previous.map((item) =>
          item.id === notification.id ? { ...item, is_read: true } : item,
        ),
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally {
      setBusyId("");
    }
  };

  const handleRequestAction = async (notification, action) => {
    const requestId = notification.private_access_request_id;
    if (!requestId) return;

    setBusyId(notification.id);
    setError("");
    try {
      await withToken((token) =>
        apiRequest(`/private-access/requests/${requestId}/${action}`, {
          method: "POST",
          token,
        }),
      );

      setNotifications((previous) =>
        previous.map((item) =>
          item.id === notification.id ? { ...item, is_read: true } : item,
        ),
      );
      setRequestStatusById((previous) => ({
        ...previous,
        [notification.id]: action === "approve" ? "approved" : "denied",
      }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="h-screen w-full bg-gray-50 flex font-sans text-gray-900 overflow-hidden">
      <NavBar activePage="notifications" />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50">
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shrink-0 z-20">
          <div className="flex items-center gap-2 text-[#2563eb]">
            <Camera size={24} strokeWidth={2.5} />
            <span className="text-xl font-bold text-gray-900 tracking-tight">
              FlashFound
            </span>
          </div>
          <button className="text-gray-500 hover:text-gray-900 transition-colors">
            <Menu size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-3xl mx-auto w-full p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                    Notifications
                  </h1>
                  {unreadCount > 0 && (
                    <span className="px-2.5 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-sm">
                  Manage your event access and privacy requests.
                </p>
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm font-semibold text-[#2563eb] hover:text-blue-700 transition-colors bg-blue-50 px-4 py-2 rounded-lg w-fit"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {error ? (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="space-y-4 pb-12">
              {loading ? (
                <div className="py-16 text-center text-gray-500 text-sm">Loading notifications...</div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300">
                  <Bell size={48} className="text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    You're all caught up!
                  </h3>
                  <p className="text-gray-500">
                    You have no new notifications right now.
                  </p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const localStatus = requestStatusById[notification.id] || "pending";
                  const isAccessRequest = notification.type === "private_access_request";
                  const isBusy = busyId === notification.id;

                  return (
                    <div
                      key={notification.id}
                      className={`relative p-5 sm:p-6 rounded-2xl border transition-all ${
                        notification.is_read
                          ? "bg-gray-50/50 border-gray-200 opacity-80 hover:opacity-100"
                          : "bg-white border-blue-100 shadow-md shadow-blue-900/5"
                      }`}
                    >
                      {!notification.is_read && (
                        <span className="absolute top-6 left-3 sm:left-4 w-2 h-2 rounded-full bg-[#2563eb]"></span>
                      )}

                      <div className="flex items-start gap-4 sm:gap-5 ml-2 sm:ml-4">
                        {isAccessRequest ? (
                          <img
                            src={DEFAULT_AVATAR_PLACEHOLDER}
                            alt="Requester"
                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                          />
                        ) : (
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-white ${notification.is_read ? "bg-gray-200 text-gray-500" : "bg-blue-100 text-[#2563eb]"}`}
                          >
                            <CalendarPlus size={20} />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                            <h3
                              className={`text-base font-bold truncate ${notification.is_read ? "text-gray-700" : "text-gray-900"}`}
                            >
                              {notification.title}
                            </h3>
                            <span className="flex items-center gap-1 text-xs font-medium text-gray-400 shrink-0">
                              <Clock size={12} /> {formatRelative(notification.created_at)}
                            </span>
                          </div>

                          <p
                            className={`text-sm leading-relaxed mb-4 ${notification.is_read ? "text-gray-500" : "text-gray-600"}`}
                          >
                            {notification.message}
                          </p>

                          {isAccessRequest ? (
                            <div className="flex flex-wrap items-center gap-3">
                              {localStatus === "pending" ? (
                                <>
                                  <button
                                    onClick={() => handleRequestAction(notification, "approve")}
                                    disabled={isBusy}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-[#2563eb] hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors active:scale-95 shadow-sm disabled:opacity-60"
                                  >
                                    <Check size={16} /> {isBusy ? "Working..." : "Approve"}
                                  </button>
                                  <button
                                    onClick={() => handleRequestAction(notification, "deny")}
                                    disabled={isBusy}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 text-sm font-semibold rounded-xl transition-colors active:scale-95 disabled:opacity-60"
                                  >
                                    <X size={16} /> Deny
                                  </button>
                                </>
                              ) : localStatus === "approved" ? (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-bold">
                                  <ShieldCheck size={14} /> Access Approved
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-500 border border-gray-200 rounded-lg text-xs font-bold">
                                  <X size={14} /> Request Denied
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <button
                                onClick={() => handleViewEvent(notification)}
                                disabled={isBusy}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl transition-colors active:scale-95 shadow-sm disabled:opacity-60"
                              >
                                View Event Gallery{" "}
                                <ArrowRight size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
