import React, { useState } from "react";
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

// Inlined NavBar component for the preview environment
const NavBar = ({ activePage }) => {
  return (
    <nav className="hidden md:flex flex-col items-center py-6 bg-white border-r border-gray-200 w-20 h-full shrink-0 z-30">
      {/* Brand/Logo Icon */}
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-[#2563eb] mb-8 cursor-pointer transition-transform hover:scale-105">
        <Camera size={26} strokeWidth={2.5} />
      </div>

      {/* Main Navigation Links */}
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

      {/* Bottom Utility Links */}
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
          {/* Notification Badge */}
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

const App = () => {
  // Initial Notification Data
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "access_request",
      title: "Photo Access Request",
      message:
        "Sarah Jenkins requested access to view matched photos of you from the event 'Neon Nights Music Festival'.",
      time: "10 mins ago",
      unread: true,
      status: "pending", // pending, approved, denied
      requesterAvatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    },
    {
      id: 2,
      type: "event_invite",
      title: "Event Access Granted",
      message:
        "You have been added to the guest list for 'TechNova Summit '26'. Your secure gallery is now ready to view.",
      time: "2 hours ago",
      unread: true,
    },
    {
      id: 3,
      type: "access_request",
      title: "Photo Access Request",
      message:
        "David Chen requested access to view matched photos of you from the event 'Global Founders Conference'.",
      time: "1 day ago",
      unread: false,
      status: "approved",
      requesterAvatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    },
    {
      id: 4,
      type: "event_invite",
      title: "Event Access Granted",
      message:
        "You have been added to the guest list for 'Winter Charity Gala'. Your secure gallery is now ready to view.",
      time: "3 days ago",
      unread: false,
    },
  ]);

  const handleApprove = (id) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id
          ? { ...notif, status: "approved", unread: false }
          : notif,
      ),
    );
  };

  const handleDeny = (id) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, status: "denied", unread: false } : notif,
      ),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, unread: false })),
    );
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="h-screen w-full bg-gray-50 flex font-sans text-gray-900 overflow-hidden">
      {/* Universal Left Navbar */}
      <NavBar activePage="notifications" />

      {/* Main App Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50">
        {/* Mobile Top Navbar */}
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

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-3xl mx-auto w-full p-4 sm:p-8">
            {/* Header */}
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

            {/* Notification List */}
            <div className="space-y-4 pb-12">
              {notifications.length === 0 ? (
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
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`relative p-5 sm:p-6 rounded-2xl border transition-all ${
                      notification.unread
                        ? "bg-white border-blue-100 shadow-md shadow-blue-900/5"
                        : "bg-gray-50/50 border-gray-200 opacity-80 hover:opacity-100"
                    }`}
                  >
                    {/* Unread dot indicator */}
                    {notification.unread && (
                      <span className="absolute top-6 left-3 sm:left-4 w-2 h-2 rounded-full bg-[#2563eb]"></span>
                    )}

                    <div className="flex items-start gap-4 sm:gap-5 ml-2 sm:ml-4">
                      {/* Icon / Avatar */}
                      {notification.type === "access_request" ? (
                        <img
                          src={notification.requesterAvatar}
                          alt="Requester"
                          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
                        />
                      ) : (
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-white ${notification.unread ? "bg-blue-100 text-[#2563eb]" : "bg-gray-200 text-gray-500"}`}
                        >
                          <CalendarPlus size={20} />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                          <h3
                            className={`text-base font-bold truncate ${notification.unread ? "text-gray-900" : "text-gray-700"}`}
                          >
                            {notification.title}
                          </h3>
                          <span className="flex items-center gap-1 text-xs font-medium text-gray-400 shrink-0">
                            <Clock size={12} /> {notification.time}
                          </span>
                        </div>

                        <p
                          className={`text-sm leading-relaxed mb-4 ${notification.unread ? "text-gray-600" : "text-gray-500"}`}
                        >
                          {notification.message}
                        </p>

                        {/* Action Buttons based on Type */}
                        {notification.type === "access_request" && (
                          <div className="flex flex-wrap items-center gap-3">
                            {notification.status === "pending" ? (
                              <>
                                <button
                                  onClick={() => handleApprove(notification.id)}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-[#2563eb] hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors active:scale-95 shadow-sm"
                                >
                                  <Check size={16} /> Approve
                                </button>
                                <button
                                  onClick={() => handleDeny(notification.id)}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 text-sm font-semibold rounded-xl transition-colors active:scale-95"
                                >
                                  <X size={16} /> Deny
                                </button>
                              </>
                            ) : notification.status === "approved" ? (
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-bold">
                                <ShieldCheck size={14} /> Access Approved
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-500 border border-gray-200 rounded-lg text-xs font-bold">
                                <X size={14} /> Request Denied
                              </div>
                            )}
                          </div>
                        )}

                        {notification.type === "event_invite" && (
                          <div>
                            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl transition-colors active:scale-95 shadow-sm">
                              View Event Gallery <ArrowRight size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
