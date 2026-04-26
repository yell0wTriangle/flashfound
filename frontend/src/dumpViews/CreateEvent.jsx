import React, { useState, useRef, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Camera,
  Menu,
  Calendar,
  MapPin,
  Lock,
  Globe,
  Image as ImageIcon,
  Compass,
  User,
  CalendarPlus,
  ArrowLeft,
  Building,
  UploadCloud,
  Mail,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Images,
  Info,
  CheckSquare,
  X,
  Check,
  ChevronDown,
  Bell,
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
  const { eventId } = useParams();
  const isManageMode = Boolean(eventId);
  const [activeTab, setActiveTab] = useState("Details");
  const tabs = ["Details", "Attendees", "Photos"];

  const [eventDetails, setEventDetails] = useState({
    name: isManageMode ? "TechNova Summit '26" : "",
    company: isManageMode ? "TechNova Inc." : "",
    date: isManageMode ? "2026-10-12" : "",
    location: isManageMode ? "San Francisco, CA" : "",
    type: "Private",
    status: isManageMode ? "Upcoming" : "Draft",
    thumbnailUrl: isManageMode
      ? "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=400"
      : null,
  });

  // Mandatory Field Validation
  const isFormValid = useMemo(() => {
    return (
      eventDetails.name.trim() !== "" &&
      eventDetails.date !== "" &&
      eventDetails.location.trim() !== ""
    );
  }, [eventDetails]);

  const fileInputRef = useRef(null);
  const statusDropdownRef = useRef(null);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      ) {
        setIsStatusOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [inviteEmail, setInviteEmail] = useState("");
  const [attendees, setAttendees] = useState([
    { id: "1", email: "alex.morgan@example.com", status: "Registered" },
    { id: "2", email: "sam.taylor@company.co", status: "Pending" },
  ]);

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState([]);
  const [photos, setPhotos] = useState([
    {
      id: "p1",
      url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=400",
    },
    {
      id: "p2",
      url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=400",
    },
    {
      id: "p3",
      url: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=400",
    },
  ]);

  const handleAddEmail = (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    const newStatus = Math.random() > 0.5 ? "Registered" : "Pending";
    setAttendees([
      { id: Date.now().toString(), email: inviteEmail, status: newStatus },
      ...attendees,
    ]);
    setInviteEmail("");
  };

  const handleRemoveAttendee = (id) => {
    setAttendees(attendees.filter((a) => a.id !== id));
  };

  const handleToggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedPhotoIds([]);
  };

  const togglePhotoSelection = (id) => {
    if (selectedPhotoIds.includes(id)) {
      setSelectedPhotoIds(selectedPhotoIds.filter((pid) => pid !== id));
    } else {
      setSelectedPhotoIds([...selectedPhotoIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedPhotoIds.length === photos.length && photos.length > 0) {
      setSelectedPhotoIds([]);
    } else {
      setSelectedPhotoIds(photos.map((p) => p.id));
    }
  };

  const handleDeleteSelectedPhotos = () => {
    setPhotos(photos.filter((p) => !selectedPhotoIds.includes(p.id)));
    setIsSelectMode(false);
    setSelectedPhotoIds([]);
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newPhotos = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      url: URL.createObjectURL(file),
    }));

    setPhotos((prev) => [...newPhotos, ...prev]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="h-screen w-full bg-gray-50 flex font-sans text-gray-900 overflow-hidden">
      <NavBar activePage="manage-events" />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50">
        {/* Mobile Nav */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shrink-0 z-20">
          <div className="flex items-center gap-2 text-[#2563eb]">
            <Camera size={24} strokeWidth={2.5} />
            <span className="text-xl font-bold text-gray-900">FlashFound</span>
          </div>
          <button className="text-gray-500 hover:text-gray-900">
            <Menu size={24} />
          </button>
        </div>

        {/* Page Header */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-8 py-8 shrink-0 z-10">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="flex items-start gap-4">
              <button className="mt-1 p-2 -ml-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-1.5 line-clamp-1">
                  {isManageMode ? "Manage Event" : eventDetails.name || "Create New Event"}
                </h1>
                <p className="text-gray-500">Organizer Dashboard</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              {!isFormValid && (
                <div className="flex items-center gap-1.5 text-amber-600 text-xs font-semibold bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
                  <AlertCircle size={14} />
                  Required fields missing
                </div>
              )}
              <button
                disabled={!isFormValid}
                className="w-full sm:w-auto px-6 py-3 bg-[#2563eb] text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale-[0.5]"
              >
                Save & Publish
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto">
            {/* Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mb-6">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 rounded-xl text-sm font-medium transition-all shrink-0 whitespace-nowrap ${
                    activeTab === tab
                      ? "bg-gray-900 text-white shadow-sm"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* TAB 1: EVENT DETAILS */}
            {activeTab === "Details" && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 flex flex-col gap-8 shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Basic Info Form */}
                  <div className="flex flex-col gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Event Name{" "}
                        <span className="text-red-500 font-bold ml-0.5">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Neon Nights Festival"
                        value={eventDetails.name}
                        onChange={(e) =>
                          setEventDetails({
                            ...eventDetails,
                            name: e.target.value,
                          })
                        }
                        className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm ${!eventDetails.name && "border-gray-200"}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Organizing Company{" "}
                        <span className="text-gray-400 font-normal text-xs ml-1">
                          (Optional)
                        </span>
                      </label>
                      <div className="relative">
                        <Building
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          type="text"
                          placeholder="Host name"
                          value={eventDetails.company}
                          onChange={(e) =>
                            setEventDetails({
                              ...eventDetails,
                              company: e.target.value,
                            })
                          }
                          className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Date{" "}
                          <span className="text-red-500 font-bold ml-0.5">
                            *
                          </span>
                        </label>
                        <div className="relative">
                          <Calendar
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                          />
                          <input
                            type="date"
                            value={eventDetails.date}
                            onChange={(e) =>
                              setEventDetails({
                                ...eventDetails,
                                date: e.target.value,
                              })
                            }
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm text-gray-600 appearance-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Location{" "}
                          <span className="text-red-500 font-bold ml-0.5">
                            *
                          </span>
                        </label>
                        <div className="relative">
                          <MapPin
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                          />
                          <input
                            type="text"
                            placeholder="City, Venue"
                            value={eventDetails.location}
                            onChange={(e) =>
                              setEventDetails({
                                ...eventDetails,
                                location: e.target.value,
                              })
                            }
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Event Status
                      </label>
                      <div className="relative" ref={statusDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsStatusOpen(!isStatusOpen)}
                          className={`w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none transition-all text-sm flex items-center justify-between ${
                            isStatusOpen
                              ? "bg-white ring-2 ring-blue-500/20 border-blue-500"
                              : "border-gray-200"
                          } text-gray-700`}
                        >
                          <span className="flex items-center gap-2.5 font-medium">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                eventDetails.status === "Completed"
                                  ? "bg-green-500"
                                  : eventDetails.status === "Upcoming"
                                    ? "bg-[#2563eb]"
                                    : "bg-gray-400"
                              }`}
                            ></span>
                            {eventDetails.status}
                          </span>
                          <ChevronDown
                            size={18}
                            className={`text-gray-400 transition-transform ${isStatusOpen ? "rotate-180" : ""}`}
                          />
                        </button>

                        {isStatusOpen && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                            {["Draft", "Upcoming", "Completed"].map(
                              (status) => (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => {
                                    setEventDetails({
                                      ...eventDetails,
                                      status,
                                    });
                                    setIsStatusOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center gap-2.5 ${
                                    eventDetails.status === status
                                      ? "bg-blue-50/50 text-[#2563eb] font-bold"
                                      : "text-gray-700 hover:bg-gray-50 font-medium"
                                  }`}
                                >
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      status === "Completed"
                                        ? "bg-green-500"
                                        : status === "Upcoming"
                                          ? "bg-[#2563eb]"
                                          : "bg-gray-400"
                                    }`}
                                  ></span>
                                  {status}
                                </button>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Thumbnail Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Event Thumbnail{" "}
                      <span className="text-gray-400 font-normal text-xs ml-1">
                        (Optional)
                      </span>
                    </label>
                    <div className="w-full h-full min-h-[220px] border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 hover:bg-blue-50/30 hover:border-blue-200 transition-all cursor-pointer flex flex-col items-center justify-center text-center p-6 group">
                      <div className="w-14 h-14 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4 shadow-sm group-hover:text-[#2563eb] group-hover:scale-110 transition-all">
                        <UploadCloud size={24} />
                      </div>
                      <h4 className="text-sm font-bold text-gray-900">
                        Upload Cover Image
                      </h4>
                      <p className="text-xs text-gray-500 mt-2 max-w-[180px] leading-relaxed">
                        Drag and drop or click to browse. <br />
                        16:9 ratio recommended.
                      </p>
                    </div>
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Privacy Toggle */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-4">
                    Privacy Type
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                      onClick={() =>
                        setEventDetails({ ...eventDetails, type: "Private" })
                      }
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                        eventDetails.type === "Private"
                          ? "border-gray-900 bg-gray-900 text-white shadow-lg"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <Lock
                          size={18}
                          className={
                            eventDetails.type === "Private"
                              ? "text-blue-400"
                              : "text-gray-400"
                          }
                        />
                        <h4 className="font-bold">Private (Face-Gated)</h4>
                      </div>
                      <p
                        className={`text-sm leading-relaxed ${eventDetails.type === "Private" ? "text-gray-300" : "text-gray-500"}`}
                      >
                        Strict access control. Attendees must pass a live
                        identity check to see photos.
                      </p>
                    </div>

                    <div
                      onClick={() =>
                        setEventDetails({ ...eventDetails, type: "Public" })
                      }
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                        eventDetails.type === "Public"
                          ? "border-gray-900 bg-gray-900 text-white shadow-lg"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <Globe
                          size={18}
                          className={
                            eventDetails.type === "Public"
                              ? "text-blue-400"
                              : "text-gray-400"
                          }
                        />
                        <h4 className="font-bold">Public Gallery</h4>
                      </div>
                      <p
                        className={`text-sm leading-relaxed ${eventDetails.type === "Public" ? "text-gray-300" : "text-gray-500"}`}
                      >
                        Open gallery access. Anyone with the link can view all
                        processed photos.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ATTENDEES */}
            {activeTab === "Attendees" && (
              <div className="bg-white border border-gray-200 rounded-2xl flex flex-col min-h-[500px] shadow-sm overflow-hidden">
                <div className="p-6 sm:p-8 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900 mb-1">
                    Manage Attendees
                  </h2>
                  <p className="text-sm text-gray-500 mb-6">
                    Add emails to grant gallery access. These are never
                    mandatory to publish the event.
                  </p>

                  <form
                    onSubmit={handleAddEmail}
                    className="flex flex-col sm:flex-row gap-3"
                  >
                    <div className="relative flex-1">
                      <Mail
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="email"
                        placeholder="Enter attendee email address"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!inviteEmail}
                      className="px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={18} /> Add Attendee
                    </button>
                  </form>
                </div>

                <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-gray-50/30">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      Access List
                      <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-[10px] font-mono">
                        {attendees.length}
                      </span>
                    </h3>
                  </div>

                  {attendees.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-white/50">
                      <Mail size={32} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-sm font-medium text-gray-400">
                        No attendees invited yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {attendees.map((attendee) => (
                        <div
                          key={attendee.id}
                          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-gray-300 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <span className="font-bold text-sm text-gray-900">
                              {attendee.email}
                            </span>

                            {attendee.status === "Registered" ? (
                              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50 border border-green-100 px-2.5 py-1 rounded-md">
                                <CheckCircle2 size={12} /> Registered
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-md">
                                <Clock size={12} /> Pending Identity Setup
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => handleRemoveAttendee(attendee.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Revoke Access"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: PHOTOS */}
            {activeTab === "Photos" && (
              <div className="bg-white border border-gray-200 rounded-2xl flex flex-col min-h-[500px] shadow-sm overflow-hidden">
                {/* Header & Bulk Actions */}
                <div className="p-6 sm:p-8 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">
                      Event Gallery
                    </h2>
                    <p className="text-sm text-gray-500">
                      Upload your high-res photos. AI will automatically sort
                      them for attendees.
                    </p>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    multiple
                    accept="image/*"
                    className="hidden"
                  />

                  <div className="flex items-center gap-3">
                    {isSelectMode && photos.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-700 mr-2">
                        <input
                          type="checkbox"
                          id="selectAllPhotos"
                          className="w-4 h-4 rounded border-gray-300 text-[#2563eb] focus:ring-[#2563eb] cursor-pointer"
                          checked={
                            selectedPhotoIds.length === photos.length &&
                            photos.length > 0
                          }
                          onChange={handleSelectAll}
                        />
                        <label
                          htmlFor="selectAllPhotos"
                          className="cursor-pointer font-bold text-xs uppercase tracking-wider text-gray-500"
                        >
                          Select all
                        </label>
                      </div>
                    )}
                    {isSelectMode ? (
                      <>
                        <button
                          onClick={handleToggleSelectMode}
                          className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDeleteSelectedPhotos}
                          disabled={selectedPhotoIds.length === 0}
                          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-bold disabled:opacity-50 transition-all hover:bg-red-600 hover:text-white"
                        >
                          <Trash2 size={16} /> Delete ({selectedPhotoIds.length}
                          )
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleToggleSelectMode}
                          disabled={photos.length === 0}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all disabled:opacity-40"
                        >
                          <CheckSquare size={16} /> Select
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2 px-5 py-2 bg-[#2563eb] text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-600/20 active:scale-95 transition-all"
                        >
                          <UploadCloud size={18} /> Upload Media
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-gray-50/30">
                  {photos.length === 0 ? (
                    <div className="text-center py-20 px-4 border-2 border-dashed border-gray-200 rounded-2xl bg-white/50">
                      <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-[#2563eb] shadow-inner">
                        <Images size={28} />
                      </div>
                      <h3 className="text-base font-bold text-gray-900 mb-2">
                        Start populating your gallery
                      </h3>
                      <p className="text-sm text-gray-500 max-w-sm mx-auto mb-8 leading-relaxed">
                        Photos you upload here are processed by our AI vectors
                        for instant attendee matching.
                      </p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 py-3 bg-white border border-gray-200 text-gray-900 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 inline-flex items-center gap-2 transition-all active:scale-95"
                      >
                        <UploadCloud size={20} /> Choose Files
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {photos.map((photo) => {
                        const isSelected = selectedPhotoIds.includes(photo.id);
                        return (
                          <div
                            key={photo.id}
                            onClick={() =>
                              isSelectMode && togglePhotoSelection(photo.id)
                            }
                            className={`relative aspect-square rounded-2xl overflow-hidden bg-gray-200 border-2 transition-all ${
                              isSelectMode ? "cursor-pointer" : ""
                            } ${
                              isSelected
                                ? "border-[#2563eb] scale-[0.98] shadow-inner"
                                : "border-transparent hover:border-gray-300"
                            }`}
                          >
                            <img
                              src={photo.url}
                              alt="Gallery Item"
                              className={`w-full h-full object-cover transition-opacity duration-300 ${isSelectMode && !isSelected ? "opacity-40 grayscale-[0.5]" : "opacity-100"}`}
                            />

                            {!isSelectMode && (
                              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                  className="w-10 h-10 rounded-full bg-white text-red-600 flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-95"
                                  title="Delete Photo"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            )}

                            {isSelectMode && (
                              <div className="absolute top-3 left-3 z-10">
                                <div
                                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                    isSelected
                                      ? "bg-[#2563eb] border-[#2563eb] text-white"
                                      : "bg-black/20 border-white/80 backdrop-blur-sm"
                                  }`}
                                >
                                  {isSelected && (
                                    <Check size={14} strokeWidth={3} />
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-white border-t border-gray-100 flex items-center justify-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {photos.length} Media items in storage
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
