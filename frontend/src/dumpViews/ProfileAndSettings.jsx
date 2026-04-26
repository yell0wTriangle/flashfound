import React, { useState, useEffect } from "react";
import {
  Camera,
  Menu,
  Image as ImageIcon,
  Compass,
  Bell,
  User,
  CalendarPlus,
  ShieldCheck,
  Lock,
  UploadCloud,
  Mail,
  Save,
  LogOut,
  ScanFace,
  X,
  CheckCircle2,
  RefreshCcw,
  AlertCircle,
} from "lucide-react";

// Inlined NavBar component
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
        {/* Active state added for Profile */}
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
  // Profile State
  const [profileData, setProfileData] = useState({
    displayName: "Alex Morgan",
    email: "alex.morgan@example.com",
    publicAvatar: "https://picsum.photos/seed/alex/200/200",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showSavedMsg, setShowSavedMsg] = useState(false);

  // Retake Selfie Modal State
  const [isRetakingSelfie, setIsRetakingSelfie] = useState(false);
  const [cameraStep, setCameraStep] = useState("camera"); // 'camera' | 'analyzing' | 'success'
  const [faceDetected, setFaceDetected] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleSaveProfile = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSavedMsg(true);
      setTimeout(() => setShowSavedMsg(false), 3000);
    }, 1000);
  };

  // Mock Camera Feed Logic
  useEffect(() => {
    let detectionInterval;
    if (isRetakingSelfie && cameraStep === "camera") {
      detectionInterval = setInterval(() => {
        setFaceDetected(Math.random() > 0.3);
      }, 1500);
    } else {
      setFaceDetected(false);
    }
    return () => clearInterval(detectionInterval);
  }, [isRetakingSelfie, cameraStep]);

  // Mock Processing Logic
  useEffect(() => {
    let interval;
    if (cameraStep === "analyzing") {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setCameraStep("success"), 400);
            return 100;
          }
          return prev + 5;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [cameraStep]);

  const handleCaptureSelfie = () => {
    if (!faceDetected) return;
    setCameraStep("analyzing");
  };

  const closeCameraModal = () => {
    setIsRetakingSelfie(false);
    setCameraStep("camera");
    setProgress(0);
  };

  return (
    <div className="h-screen w-full bg-gray-50 flex font-sans text-gray-900 overflow-hidden">
      {/* Universal Left Navbar */}
      <NavBar activePage="profile" />

      {/* Main App Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50 relative">
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

        {/* Page Header */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-8 py-8 shrink-0 z-10">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-1.5">
                Profile & Settings
              </h1>
              <p className="text-sm text-gray-500">
                Manage your public display and secure identity.
              </p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto flex flex-col gap-8 pb-12">
            {/* SECTION 1: PUBLIC PROFILE */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 sm:p-8 border-b border-gray-100 flex items-center gap-3">
                <User className="text-[#2563eb]" size={24} />
                <h2 className="text-xl font-bold text-gray-900">
                  Public Profile
                </h2>
              </div>

              <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-8">
                {/* Avatar Edit */}
                <div className="flex flex-col items-center gap-4 shrink-0">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-50 shadow-md">
                      <img
                        src={profileData.publicAvatar}
                        alt="Public Profile"
                        className="w-full h-full object-cover group-hover:opacity-70 transition-opacity"
                      />
                    </div>
                    <button className="absolute bottom-0 right-0 bg-gray-900 text-white p-2.5 rounded-full shadow-lg hover:bg-black transition-transform active:scale-95 group-hover:scale-110">
                      <Camera size={16} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 text-center max-w-[140px]">
                    Visible to organizers and on shared gallery filters.
                  </p>
                </div>

                {/* Info Edit */}
                <div className="flex-1 flex flex-col gap-5 justify-center">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={profileData.displayName}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          displayName: e.target.value,
                        })
                      }
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      This can be your full name, first name, or a pseudonym.
                    </p>
                  </div>

                  <div className="flex items-center gap-4 mt-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-6 py-3 bg-[#2563eb] text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-70 w-fit"
                    >
                      {isSaving ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <Save size={16} />
                      )}
                      Save Changes
                    </button>

                    {showSavedMsg && (
                      <span className="text-sm font-semibold text-green-600 flex items-center gap-1.5 animate-in fade-in">
                        <CheckCircle2 size={16} /> Saved
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: PRIVATE IDENTITY VECTOR (Source of Truth) */}
            <div className="bg-white rounded-3xl border border-blue-200 shadow-sm overflow-hidden relative">
              {/* Security Background Pattern */}
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <ScanFace size={160} />
              </div>

              <div className="p-6 sm:p-8 border-b border-gray-100 flex items-center gap-3 bg-blue-50/30">
                <ShieldCheck className="text-[#2563eb]" size={24} />
                <h2 className="text-xl font-bold text-gray-900">
                  Verification Selfie
                </h2>
              </div>

              <div className="p-6 sm:p-8">
                <p className="text-sm text-gray-600 mb-6 max-w-xl leading-relaxed">
                  This secure photo is your key to accessing private events. It
                  is <strong>never</strong> shown to organizers or other users.
                  FlashFound uses it strictly to verify your identity and unlock
                  your matched photos.
                </p>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-5 border border-gray-200 rounded-2xl bg-gray-50">
                  <div className="w-20 h-20 bg-gray-200 rounded-xl overflow-hidden relative shrink-0 border border-gray-300">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
                      alt="Blurred Identity"
                      className="w-full h-full object-cover blur-md scale-110 opacity-70"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock
                        size={24}
                        className="text-gray-700 drop-shadow-md"
                      />
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                      <h4 className="font-bold text-gray-900 text-sm">
                        Verification Active
                      </h4>
                    </div>
                    <p className="text-xs text-gray-500">
                      Last updated on Oct 12, 2026
                    </p>
                  </div>

                  <button
                    onClick={() => setIsRetakingSelfie(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold shadow-sm hover:bg-gray-100 active:scale-95 transition-all"
                  >
                    <RefreshCcw size={16} /> Update Selfie
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION 3: ACCOUNT DETAILS & DANGER ZONE */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 sm:p-8 flex flex-col gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Registered Email
                  </label>
                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="w-full pl-11 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 outline-none text-sm cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Email addresses cannot be changed directly for security
                    reasons.
                  </p>
                </div>

                <hr className="border-gray-100 my-2" />

                <div className="flex flex-col sm:flex-row gap-4">
                  <button className="flex items-center justify-center gap-2 px-5 py-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors w-fit">
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RETAKE SELFIE MODAL (Matches Onboarding Step 2) */}
        {isRetakingSelfie && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <ScanFace size={18} className="text-[#2563eb]" /> Update
                  Verification Selfie
                </h3>
                <button
                  onClick={closeCameraModal}
                  className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {cameraStep === "camera" && (
                <div className="flex flex-col">
                  <div className="relative w-full aspect-[4/3] sm:aspect-video bg-gray-900 overflow-hidden flex items-center justify-center">
                    {/* Simulated Camera Feed */}
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800"
                      alt="Camera feed"
                      className="absolute inset-0 w-full h-full object-cover opacity-70"
                    />

                    {/* Validation Overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                      <div
                        className={`w-56 h-72 border-2 rounded-[50px] transition-colors duration-500 flex items-end justify-center pb-6 ${faceDetected ? "border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.4)]" : "border-white/40"}`}
                      >
                        {!faceDetected && (
                          <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-white text-xs font-medium border border-white/10">
                            <AlertCircle
                              size={14}
                              className="text-yellow-400"
                            />{" "}
                            Position face in frame
                          </div>
                        )}
                        {faceDetected && (
                          <div className="bg-green-500/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-white text-xs font-bold animate-pulse">
                            <CheckCircle2 size={14} /> Ready
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-gray-50 flex items-center justify-center">
                    <button
                      onClick={handleCaptureSelfie}
                      disabled={!faceDetected}
                      className={`w-16 h-16 rounded-full border-4 p-1 transition-all active:scale-90 ${faceDetected ? "border-[#2563eb] cursor-pointer" : "border-gray-300 cursor-not-allowed opacity-50"}`}
                    >
                      <div
                        className={`w-full h-full rounded-full transition-colors ${faceDetected ? "bg-[#2563eb]" : "bg-gray-200"}`}
                      ></div>
                    </button>
                  </div>
                </div>
              )}

              {cameraStep === "analyzing" && (
                <div className="p-10 flex flex-col items-center text-center min-h-[360px] justify-center bg-white">
                  <div className="relative mb-6">
                    <div className="absolute -inset-4 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg relative z-10">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400"
                        alt="Processing"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-400/30 to-transparent animate-[scan_2s_ease-in-out_infinite]"></div>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    Updating Verification
                  </h3>
                  <p className="text-xs text-gray-500 mb-6">
                    Securing your new identity...
                  </p>
                  <div className="w-full max-w-[200px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-75 ease-linear"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {cameraStep === "success" && (
                <div className="p-10 flex flex-col items-center text-center min-h-[360px] justify-center bg-white">
                  <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-5 border border-green-100">
                    <CheckCircle2 size={40} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Selfie Updated
                  </h3>
                  <p className="text-sm text-gray-500 mb-8 max-w-[260px]">
                    Your secure verification selfie has been updated. New photos
                    will be matched against this image.
                  </p>
                  <button
                    onClick={closeCameraModal}
                    className="w-full px-6 py-3.5 bg-gray-900 text-white rounded-xl font-semibold hover:bg-black active:scale-[0.98] transition-all"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
            <style
              dangerouslySetInnerHTML={{
                __html: `@keyframes scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
