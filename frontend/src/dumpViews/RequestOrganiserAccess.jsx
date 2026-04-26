import React, { useState } from "react";
import {
  Camera,
  Menu,
  Image as ImageIcon,
  Compass,
  Bell,
  User,
  CalendarPlus,
  ShieldCheck,
  CheckCircle2,
  Lock,
  UploadCloud,
  Mail,
  Zap,
} from "lucide-react";

// Inlined NavBar component for the preview environment
const NavBar = ({ activePage }) => {
  return (
    <nav className="hidden md:flex flex-col items-center py-6 bg-white border-r border-gray-200 w-20 h-full shrink-0 z-30">
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-[#2563eb] mb-8 cursor-pointer transition-transform hover:scale-105">
        <Camera size={26} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col gap-6 w-full items-center">
        <button
          className={`p-3 rounded-xl transition-all ${activePage === "my-photos" ? "text-[#2563eb] bg-blue-50 shadow-sm border border-blue-100" : "text-gray-400 hover:text-[#2563eb] hover:bg-blue-50"}`}
          title="My Photos"
        >
          <ImageIcon size={24} />
        </button>
        <button
          className={`p-3 rounded-xl transition-all ${activePage === "discover" ? "text-[#2563eb] bg-blue-50 shadow-sm border border-blue-100" : "text-gray-400 hover:text-[#2563eb] hover:bg-blue-50"}`}
          title="Find Events"
        >
          <Compass size={24} />
        </button>
        <button
          className={`p-3 rounded-xl transition-all ${activePage === "manage-events" ? "text-[#2563eb] bg-blue-50 shadow-sm border border-blue-100" : "text-gray-400 hover:text-[#2563eb] hover:bg-blue-50"}`}
          title="Organizer Access"
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
          {/* Notification Badge */}
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <button
          className={`p-3 rounded-xl transition-all ${activePage === "profile" ? "text-[#2563eb] bg-blue-50 shadow-sm border border-blue-100" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"}`}
          title="Profile"
        >
          <User size={24} />
        </button>
      </div>
    </nav>
  );
};

const App = () => {
  // Request State: 'idle' | 'submitting' | 'success'
  const [requestStatus, setRequestStatus] = useState("idle");

  const handleRequestAccess = () => {
    setRequestStatus("submitting");

    // Simulate backend verification request
    setTimeout(() => {
      setRequestStatus("success");
    }, 1500);
  };

  return (
    <div className="h-screen w-full bg-gray-50 flex font-sans text-gray-900 overflow-hidden">
      {/* Universal Left Navbar */}
      <NavBar activePage="manage-events" />

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
        <main className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-4 sm:p-6 lg:p-12 custom-scrollbar">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden p-8 sm:p-12 text-center">
            {/* Header section */}
            <div className="w-16 h-16 bg-blue-50 text-[#2563eb] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-blue-100">
              <ShieldCheck size={32} strokeWidth={2} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-3">
              Become an Organizer
            </h1>

            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              FlashFound requires a quick verification step for new event
              organizers to maintain privacy and secure AI processing limits.
            </p>

            {/* Simple Access Button */}
            <div className="mb-12">
              {requestStatus === "success" ? (
                <div className="flex flex-col items-center justify-center gap-3 p-4 bg-green-50 rounded-2xl border border-green-200 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex items-center gap-2 text-green-700 font-bold">
                    <CheckCircle2 size={20} />
                    Request Submitted Successfully
                  </div>
                  <p className="text-xs text-green-600/80 font-medium">
                    We'll review your account and grant access shortly.
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleRequestAccess}
                  disabled={requestStatus === "submitting"}
                  className="w-full sm:w-auto min-w-[240px] flex items-center justify-center gap-2 px-8 py-4 bg-[#2563eb] text-white rounded-xl font-bold shadow-md hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed mx-auto"
                >
                  {requestStatus === "submitting" ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>Request Access</>
                  )}
                </button>
              )}
            </div>

            <hr className="border-gray-100 w-full mb-10" />

            {/* Preview of Organizer Functions */}
            <div className="text-left">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 text-center">
                Organizer Capabilities
              </h3>

              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                {/* Function 1 */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 text-gray-700">
                    <CalendarPlus size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm mb-1">
                      Create Events
                    </h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Host public galleries or setup fully private, face-gated
                      events.
                    </p>
                  </div>
                </div>

                {/* Function 2 */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 text-gray-700">
                    <Mail size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm mb-1">
                      Invite Attendees
                    </h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Add emails to grant access. Attendees unlock photos
                      securely upon registering.
                    </p>
                  </div>
                </div>

                {/* Function 3 */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 text-gray-700">
                    <UploadCloud size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm mb-1">
                      Bulk Photo Upload
                    </h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Upload raw event folders. Our AI handles face detection
                      and vector mapping automatically.
                    </p>
                  </div>
                </div>

                {/* Function 4 */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 text-gray-700">
                    <Lock size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm mb-1">
                      Access Control
                    </h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Edit permissions anytime. Add or revoke access directly
                      from your dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
