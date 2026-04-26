import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Mail,
  Save,
  LogOut,
  ScanFace,
  CheckCircle2,
  RefreshCcw,
} from "lucide-react";
import { apiRequest } from "../lib/api.js";
import { supabase } from "../lib/supabase.js";
import { DEFAULT_AVATAR_PLACEHOLDER } from "../lib/avatarPlaceholder.js";

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
  const navigate = useNavigate();
  const avatarInputRef = useRef(null);
  const avatarBucket = import.meta.env.VITE_SUPABASE_PROFILE_AVATAR_BUCKET || "profile-avatars";

  // Profile State
  const [profileData, setProfileData] = useState({
    displayName: "",
    email: "",
    publicAvatar: DEFAULT_AVATAR_PLACEHOLDER,
    verificationSelfieUrl: "",
    verificationVerified: false,
    verificationUpdatedAt: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showSavedMsg, setShowSavedMsg] = useState(false);
  const [error, setError] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadProfile = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        const data = await apiRequest("/profile/me", {
          token: session.access_token,
        });

        if (cancelled) return;
        setProfileData({
          displayName: data?.profile?.display_name || "",
          email: data?.profile?.email || session.user.email || "",
          publicAvatar: data?.profile?.display_avatar_url || DEFAULT_AVATAR_PLACEHOLDER,
          verificationSelfieUrl: data?.profile?.verification_selfie_url || "",
          verificationVerified: Boolean(data?.profile?.face_verification_completed),
          verificationUpdatedAt: data?.profile?.updated_at || "",
        });
      } catch (requestError) {
        if (cancelled) return;
        setError(requestError instanceof Error ? requestError.message : String(requestError));
      }
    };
    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveProfile = () => {
    const submit = async () => {
      setIsSaving(true);
      setError("");
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error("Session expired. Please login again.");
        }
        await apiRequest("/profile/me", {
          method: "PATCH",
          token: session.access_token,
          body: {
            display_name: profileData.displayName,
            display_avatar_url: profileData.publicAvatar,
          },
        });
        setShowSavedMsg(true);
        setTimeout(() => setShowSavedMsg(false), 2500);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : String(requestError));
      } finally {
        setIsSaving(false);
      }
    };
    submit();
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const upload = async () => {
      setIsUploadingAvatar(true);
      setError("");
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error("Session expired. Please login again.");
        }
        const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
        const path = `${session.user.id}/avatar-${Date.now()}.${ext}`;
        const storage = supabase.storage.from(avatarBucket);
        const uploaded = await storage.upload(path, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type || "image/jpeg",
        });
        if (uploaded.error) {
          throw new Error(uploaded.error.message);
        }

        const publicUrl = storage.getPublicUrl(path).data?.publicUrl;
        const avatarUrl = publicUrl || profileData.publicAvatar;

        setProfileData((previous) => ({
          ...previous,
          publicAvatar: avatarUrl,
        }));
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Avatar upload failed. Check storage bucket policies.",
        );
      } finally {
        setIsUploadingAvatar(false);
        if (event.target) {
          event.target.value = "";
        }
      }
    };
    upload();
  };

  const handleSignOut = () => {
    const signout = async () => {
      await supabase.auth.signOut();
      navigate("/");
    };
    signout();
  };

  const handleUpdateSelfie = () => {
    navigate("/setup/selfie?mode=update");
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
            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

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
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="absolute bottom-0 right-0 bg-gray-900 text-white p-2.5 rounded-full shadow-lg hover:bg-black transition-transform active:scale-95 group-hover:scale-110 disabled:opacity-60"
                    >
                      <Camera size={16} />
                    </button>
                  </div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <p className="text-xs text-gray-500 text-center max-w-[140px]">
                    {isUploadingAvatar
                      ? "Uploading avatar..."
                      : "Visible to organizers and on shared gallery filters."}
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
                      src={
                        profileData.verificationSelfieUrl ||
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
                      }
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
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${profileData.verificationVerified ? "bg-green-500 animate-pulse" : "bg-amber-500"}`}
                      ></span>
                      <h4 className="font-bold text-gray-900 text-sm">
                        {profileData.verificationVerified ? "Verification Active" : "Verification Needed"}
                      </h4>
                    </div>
                    <p className="text-xs text-gray-500">
                      {profileData.verificationUpdatedAt
                        ? `Last updated on ${new Date(profileData.verificationUpdatedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}`
                        : "No verification selfie on file"}
                    </p>
                  </div>

                  <button
                    onClick={handleUpdateSelfie}
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
                  <button
                    onClick={handleSignOut}
                    className="flex items-center justify-center gap-2 px-5 py-3 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors w-fit"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;
