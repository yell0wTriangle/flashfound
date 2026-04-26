import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  Lock,
  Check,
  Search,
  Filter,
  Users,
  Clock,
  CheckSquare,
  X,
  LibrarySquare,
  ShieldCheck,
} from "lucide-react";

const App = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [requestedAccess, setRequestedAccess] = useState([]);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Attendees you already have access to (Simulated approved list)
  const [approvedAccessIds] = useState(["u2", "u3"]); // Sarah and David gave access

  // Selection State for Attendees
  const [checkedAttendeeIds, setCheckedAttendeeIds] = useState(["me"]);

  // Photo Selection State (for adding to gallery)
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState([]);

  // Event Context
  const eventDetails = {
    name: "TechNova Summit '26",
    date: "October 12, 2026",
    location: "San Francisco, CA",
    type: "Private Event",
    totalPhotos: 842,
  };

  const attendees = [
    {
      id: "me",
      name: "Me",
      avatar: "https://picsum.photos/seed/selfie3/200/200",
      isMe: true,
    },
    {
      id: "u2",
      name: "Sarah Jenkins",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
      isMe: false,
    },
    {
      id: "u3",
      name: "David Chen",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
      isMe: false,
    },
    {
      id: "u4",
      name: "Emily Rodriguez",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150",
      isMe: false,
    },
    {
      id: "u5",
      name: "Michael Chang",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
      isMe: false,
    },
  ];

  // Dummy logic: Me is in all photos, Sarah/David appear in some
  const allMatchedPhotos = useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => {
      const heights = [300, 400, 500, 250, 450];
      const subjects = ["me"];
      if (i % 3 === 0) subjects.push("u2"); // Sarah
      if (i % 4 === 0) subjects.push("u3"); // David
      if (i % 5 === 0) subjects.push("u4"); // Emily (Locked)

      return {
        id: i,
        subjects,
        url: `https://picsum.photos/seed/technova${i + 10}/400/${heights[i % heights.length]}`,
      };
    });
  }, []);

  // Filter Photos based on checked attendees
  const displayPhotos = useMemo(() => {
    return allMatchedPhotos.filter((photo) => {
      if (checkedAttendeeIds.includes("all")) {
        // "Everyone" filter: Show photos of Me OR anyone I have approved access to
        const allowedIds = ["me", ...approvedAccessIds];
        return photo.subjects.some((id) => allowedIds.includes(id));
      }
      return photo.subjects.some((id) => checkedAttendeeIds.includes(id));
    });
  }, [checkedAttendeeIds, approvedAccessIds, allMatchedPhotos]);

  const filteredAttendees = attendees.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const toggleAttendeeCheck = (id) => {
    setCheckedAttendeeIds((prev) => {
      if (id === "all") return ["all"];
      const newIds = prev.includes(id)
        ? prev.filter((aId) => aId !== id)
        : [...prev.filter((aId) => aId !== "all"), id];
      return newIds.length === 0 ? ["me"] : newIds;
    });
  };

  const handleRequestAccess = (id) => {
    setRequestedAccess((prev) => [...prev, id]);
  };

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedPhotoIds([]);
  };

  const togglePhotoSelection = (id) => {
    if (selectedPhotoIds.includes(id)) {
      setSelectedPhotoIds(selectedPhotoIds.filter((photoId) => photoId !== id));
    } else {
      setSelectedPhotoIds([...selectedPhotoIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedPhotoIds.length === displayPhotos.length) {
      setSelectedPhotoIds([]);
    } else {
      setSelectedPhotoIds(displayPhotos.map((photo) => photo.id));
    }
  };

  const handleAddToGallery = () => {
    console.log(`Added ${selectedPhotoIds.length} photos to My Photos!`);
    toggleSelectMode();
  };

  const getViewingText = () => {
    if (checkedAttendeeIds.includes("all")) return "Everyone (Authorized)";
    if (checkedAttendeeIds.length === 0) return "No one selected";
    const selectedNames = checkedAttendeeIds.map(
      (id) => attendees.find((a) => a.id === id)?.name || "Me",
    );
    if (checkedAttendeeIds.length <= 2) return selectedNames.join(" & ");
    return `${selectedNames[0]} & ${checkedAttendeeIds.length - 1} others`;
  };

  return (
    <div className="h-screen w-full bg-gray-50 flex flex-col font-sans text-gray-900 overflow-hidden">
      {/* Header */}
      <header
        className={`flex items-center justify-between px-4 sm:px-6 py-4 border-b shrink-0 z-20 shadow-sm transition-colors ${isSelectMode ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"}`}
      >
        <div className="flex items-center gap-4">
          <button
            className={`p-2 -ml-2 rounded-full transition-colors flex items-center justify-center ${isSelectMode ? "text-blue-700 hover:bg-blue-100" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`}
            onClick={isSelectMode ? toggleSelectMode : undefined}
          >
            {isSelectMode ? <X size={20} /> : <ArrowLeft size={20} />}
          </button>
          <div>
            {!isSelectMode ? (
              <>
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight leading-none">
                    {eventDetails.name}
                  </h1>
                  <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    <Lock size={10} /> Private
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-500">
                  {eventDetails.date} • {eventDetails.location}
                </p>
              </>
            ) : (
              <h1 className="text-lg sm:text-xl font-bold text-blue-800 tracking-tight">
                {selectedPhotoIds.length} Selected
              </h1>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={isSelectMode ? handleAddToGallery : toggleSelectMode}
            disabled={isSelectMode && selectedPhotoIds.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {isSelectMode ? (
              <LibrarySquare size={16} />
            ) : (
              <CheckSquare size={16} />
            )}
            {isSelectMode ? "Add to My Photos" : "Select Photos"}
          </button>
          {!isSelectMode && (
            <button
              className="sm:hidden p-2 text-gray-600 bg-gray-100 rounded-lg"
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            >
              <Filter size={20} />
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <aside
          className={`${isMobileFilterOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} absolute md:relative z-10 md:z-0 w-full md:w-80 h-full flex-shrink-0 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out`}
        >
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-1 flex items-center gap-2">
              <Users size={16} className="text-[#2563eb]" /> Show pictures of
            </h2>
            <p className="text-xs text-gray-500">
              Private event. Access requests are required for other attendees.
            </p>
          </div>

          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search attendees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none transition-all"
                disabled={isSelectMode}
              />
            </div>
          </div>

          <div
            className={`flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar ${isSelectMode ? "opacity-50 pointer-events-none" : ""}`}
          >
            {/* Everyone Toggle (Authorized only) */}
            {!searchQuery && (
              <div
                onClick={() => toggleAttendeeCheck("all")}
                className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  checkedAttendeeIds.includes("all")
                    ? "border-[#2563eb] bg-blue-50 shadow-sm"
                    : "border-transparent bg-gray-50/50 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 border border-gray-200">
                    <Users size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={`text-sm ${checkedAttendeeIds.includes("all") ? "font-bold text-gray-900" : "font-medium text-gray-600"}`}
                    >
                      Everyone
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      Authorized Only
                    </span>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${checkedAttendeeIds.includes("all") ? "bg-[#2563eb] text-white" : "bg-white border border-gray-300"}`}
                >
                  {checkedAttendeeIds.includes("all") && (
                    <Check size={14} strokeWidth={3} />
                  )}
                </div>
              </div>
            )}

            {filteredAttendees.map((user) => {
              const isChecked = checkedAttendeeIds.includes(user.id);
              const isApproved = approvedAccessIds.includes(user.id);
              const hasRequested = requestedAccess.includes(user.id);

              if (user.isMe || isApproved) {
                return (
                  <div
                    key={user.id}
                    onClick={() => toggleAttendeeCheck(user.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      isChecked
                        ? "border-[#2563eb] bg-blue-50 shadow-sm"
                        : "border-transparent bg-gray-50/50 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                        alt={user.name}
                      />
                      <div className="flex flex-col">
                        <span
                          className={`text-sm ${isChecked ? "font-bold text-gray-900" : "font-medium text-gray-600"}`}
                        >
                          {user.isMe ? "Me" : user.name}
                        </span>
                        {!user.isMe && (
                          <span className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                            <ShieldCheck size={10} /> Access Granted
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${isChecked ? "bg-[#2563eb] text-white" : "bg-white border border-gray-300"}`}
                    >
                      {isChecked && <Check size={14} strokeWidth={3} />}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50/50 opacity-80"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img
                      src={user.avatar}
                      className="w-10 h-10 rounded-full object-cover grayscale opacity-50"
                      alt={user.name}
                    />
                    <span className="text-sm font-medium text-gray-400 truncate">
                      {user.name}
                    </span>
                  </div>
                  {hasRequested ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-200 px-2 py-1 rounded-full">
                      <Clock size={10} /> Requested
                    </span>
                  ) : (
                    <button
                      onClick={() => handleRequestAccess(user.id)}
                      className="text-[10px] font-bold text-[#2563eb] bg-blue-50 px-2 py-1 rounded-full border border-blue-100 hover:bg-blue-100"
                    >
                      <Lock size={10} className="inline mr-1" /> Request
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="md:hidden p-4 border-t border-gray-200 bg-white">
            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-medium"
            >
              View Photos
            </button>
          </div>
        </aside>

        {/* Gallery Area */}
        <main className="flex-1 flex flex-col bg-gray-50 overflow-hidden relative">
          <div className="px-4 sm:px-6 py-5 flex items-center justify-between shrink-0 bg-gray-50/80 backdrop-blur-sm z-10 sticky top-0">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                Showing photos of:{" "}
                <span className="text-[#2563eb]">{getViewingText()}</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {displayPhotos.length} matches found
              </p>
            </div>
            {isSelectMode && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  id="selectAll"
                  checked={
                    selectedPhotoIds.length === displayPhotos.length &&
                    displayPhotos.length > 0
                  }
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                <label
                  htmlFor="selectAll"
                  className="cursor-pointer font-medium"
                >
                  Select all
                </label>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-24 sm:pb-6 custom-scrollbar">
            <div className="columns-2 sm:columns-3 xl:columns-4 gap-4 space-y-4">
              {displayPhotos.map((photo) => {
                const isSelected = selectedPhotoIds.includes(photo.id);
                return (
                  <div
                    key={photo.id}
                    onClick={() =>
                      isSelectMode && togglePhotoSelection(photo.id)
                    }
                    className={`break-inside-avoid relative group rounded-xl overflow-hidden bg-white shadow-sm transition-all border-2 ${isSelected ? "border-[#2563eb]" : "border-transparent"} ${isSelectMode ? "cursor-pointer" : ""}`}
                  >
                    <img
                      src={photo.url}
                      className={`w-full h-auto object-cover transition-opacity ${isSelected ? "opacity-80" : "opacity-100"}`}
                      loading="lazy"
                      alt="Moment"
                    />
                    {isSelectMode && (
                      <div className="absolute top-3 left-3 z-10">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? "bg-[#2563eb] border-[#2563eb] text-white" : "bg-black/20 border-white/80"}`}
                        >
                          {isSelected && <Check size={14} strokeWidth={3} />}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
