import React, { useState } from "react";
import {
  ArrowLeft,
  Globe,
  Check,
  Search,
  Filter,
  Users,
  CheckSquare,
  X,
  LibrarySquare,
} from "lucide-react";

const App = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Attendee Selection State for Context Filtering
  const [checkedAttendees, setCheckedAttendees] = useState(["me"]);

  // Photo Selection State (for adding to gallery)
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState([]);

  // Event Context
  const eventDetails = {
    name: "Neon Nights Music Festival",
    date: "November 05, 2026",
    location: "Austin, TX",
    type: "Public Event",
    totalPhotos: 3105,
  };

  // Attendees list
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

  // Dummy data simulating AI matched photos based on selections
  const displayPhotos = Array.from({ length: 24 }).map((_, i) => {
    const heights = [300, 400, 500, 250, 450];
    const height = heights[i % heights.length];
    return {
      id: i,
      url: `https://picsum.photos/seed/neonnights${i + 50}/400/${height}`,
    };
  });

  const filteredAttendees = attendees.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Toggle Context Filter
  const toggleAttendeeCheck = (id) => {
    setCheckedAttendees((prev) => {
      if (id === "all") return ["all"];
      const newIds = prev.includes(id)
        ? prev.filter((aId) => aId !== id)
        : [...prev.filter((aId) => aId !== "all"), id];
      return newIds.length === 0 ? ["all"] : newIds;
    });
  };

  // Selection Handlers for Gallery Add
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

  // Dynamic text helper for header
  const getViewingText = () => {
    if (checkedAttendees.includes("all")) return "Everyone";
    if (checkedAttendees.length === 0) return "No one selected";
    const selectedNames = checkedAttendees.map(
      (id) => attendees.find((a) => a.id === id)?.name,
    );
    if (checkedAttendees.length <= 2) return selectedNames.join(" & ");
    if (checkedAttendees.includes("me"))
      return `Me & ${checkedAttendees.length - 1} others`;
    return `${selectedNames[0]} & ${checkedAttendees.length - 1} others`;
  };

  return (
    <div className="h-screen w-full bg-gray-50 flex flex-col font-sans text-gray-900 overflow-hidden">
      {/* Top Header Navigation (Event Context) */}
      <header
        className={`flex items-center justify-between px-4 sm:px-6 py-4 border-b shrink-0 z-20 shadow-sm transition-colors ${isSelectMode ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"}`}
      >
        <div className="flex items-center gap-4">
          <button
            className={`p-2 -ml-2 rounded-full transition-colors flex items-center justify-center ${isSelectMode ? "text-blue-700 hover:bg-blue-100" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`}
            title={isSelectMode ? "Cancel Selection" : "Back to Events"}
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
                  <span className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 bg-[#2563eb]/10 text-[#2563eb] rounded-md text-[10px] font-bold uppercase tracking-wider">
                    <Globe size={10} /> Public
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
          {!isSelectMode ? (
            <>
              <button
                onClick={toggleSelectMode}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
              >
                <CheckSquare size={16} />
                Select Photos
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleAddToGallery}
                disabled={selectedPhotoIds.length === 0}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:hover:bg-[#2563eb]"
              >
                <LibrarySquare size={16} />
                Add to My Photos
              </button>
            </>
          )}

          {/* Mobile filter toggle */}
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

      {/* Main Body Layout */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
        {/* Left Filter Panel: "Show pictures of" */}
        <aside
          className={`
          ${isMobileFilterOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          absolute md:relative z-10 md:z-0
          w-full md:w-80 h-full flex-shrink-0 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out
        `}
        >
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-1 flex items-center gap-2">
              <Users size={16} className="text-[#2563eb]" />
              Show pictures of
            </h2>
            <p className="text-xs text-gray-500">
              This is a public event. You can select any attendee to view their
              matched photos.
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
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                disabled={isSelectMode}
              />
            </div>
          </div>

          {/* Attendees Checklist */}
          <div
            className={`flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar ${isSelectMode ? "opacity-50 pointer-events-none" : ""}`}
          >
            {/* Everyone Toggle */}
            {!searchQuery && (
              <div
                onClick={() => toggleAttendeeCheck("all")}
                className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  checkedAttendees.includes("all")
                    ? "border-[#2563eb] bg-blue-50 shadow-sm"
                    : "border-transparent bg-gray-50/50 hover:bg-gray-100 hover:border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="relative shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 border border-gray-200 text-gray-600">
                    <Users size={20} />
                  </div>
                  <span
                    className={`text-sm truncate pr-2 ${
                      checkedAttendees.includes("all")
                        ? "font-bold text-gray-900"
                        : "font-medium text-gray-600"
                    }`}
                  >
                    Everyone
                  </span>
                </div>
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                    checkedAttendees.includes("all")
                      ? "bg-[#2563eb] text-white shadow-sm"
                      : "bg-white border border-gray-300 text-transparent"
                  }`}
                >
                  <Check size={14} strokeWidth={3} />
                </div>
              </div>
            )}

            {filteredAttendees.map((user) => {
              const isChecked = checkedAttendees.includes(user.id);

              return (
                <div
                  key={user.id}
                  onClick={() => toggleAttendeeCheck(user.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    isChecked
                      ? "border-[#2563eb] bg-blue-50 shadow-sm"
                      : "border-transparent bg-gray-50/50 hover:bg-gray-100 hover:border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="relative shrink-0">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className={`w-10 h-10 rounded-full object-cover border-2 transition-all ${
                          isChecked
                            ? "border-white shadow-sm"
                            : "border-transparent grayscale opacity-80"
                        }`}
                      />
                    </div>
                    <span
                      className={`text-sm truncate pr-2 ${isChecked ? "font-bold text-gray-900" : "font-medium text-gray-600"}`}
                    >
                      {user.name}
                    </span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                      isChecked
                        ? "bg-[#2563eb] text-white shadow-sm"
                        : "bg-white border border-gray-300 text-transparent"
                    }`}
                  >
                    <Check size={14} strokeWidth={3} />
                  </div>
                </div>
              );
            })}

            {filteredAttendees.length === 0 && (
              <div className="text-center py-6 text-sm text-gray-500">
                No attendees found.
              </div>
            )}
          </div>

          {/* Mobile-only close button */}
          <div className="md:hidden p-4 border-t border-gray-200 bg-white">
            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-medium"
            >
              View Photos
            </button>
          </div>
        </aside>

        {/* Gallery Content Area */}
        <main className="flex-1 flex flex-col bg-gray-50 overflow-hidden relative">
          {/* Active Filter Context Header */}
          <div className="px-4 sm:px-6 py-5 flex items-center justify-between shrink-0 bg-gray-50/80 backdrop-blur-sm z-10 sticky top-0">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                Showing photos of:{" "}
                <span className="text-[#2563eb]">{getViewingText()}</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {checkedAttendees.length > 0
                  ? `${displayPhotos.length} matches found out of ${eventDetails.totalPhotos} total event photos`
                  : "Select attendees from the panel to view their photos."}
              </p>
            </div>

            {/* Select All Toggle (Desktop - when in select mode) */}
            {isSelectMode && checkedAttendees.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  id="selectAllContext"
                  checked={
                    selectedPhotoIds.length === displayPhotos.length &&
                    displayPhotos.length > 0
                  }
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label
                  htmlFor="selectAllContext"
                  className="cursor-pointer font-medium"
                >
                  Select all
                </label>
              </div>
            )}
          </div>

          {/* Masonry Image Grid */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-24 sm:pb-6 custom-scrollbar">
            {checkedAttendees.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-60">
                <Users size={48} className="text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">
                  No attendees selected
                </h3>
                <p className="text-sm text-gray-500 mt-2 max-w-sm">
                  Use the sidebar panel to select attendees and see their
                  matched photos from the event.
                </p>
              </div>
            ) : (
              <div className="columns-2 sm:columns-3 xl:columns-4 gap-4 space-y-4">
                {displayPhotos.map((photo) => {
                  const isSelected = selectedPhotoIds.includes(photo.id);

                  return (
                    <div
                      key={photo.id}
                      onClick={() =>
                        isSelectMode && togglePhotoSelection(photo.id)
                      }
                      className={`break-inside-avoid relative group rounded-xl overflow-hidden bg-white shadow-sm transition-all border-2 ${
                        isSelected
                          ? "border-[#2563eb]"
                          : "border-transparent hover:border-gray-200"
                      } ${isSelectMode ? "cursor-pointer" : "cursor-default"}`}
                    >
                      <img
                        src={photo.url}
                        alt={`Matched moment ${photo.id}`}
                        className={`w-full h-auto object-cover transition-opacity duration-200 ${isSelected ? "opacity-80" : "opacity-100"}`}
                        loading="lazy"
                      />

                      {/* Selection Indicator */}
                      {isSelectMode && (
                        <div className="absolute top-3 left-3 z-10">
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                              isSelected
                                ? "bg-[#2563eb] border-[#2563eb] text-white"
                                : "bg-black/20 border-white/80 backdrop-blur-sm"
                            }`}
                          >
                            {isSelected && <Check size={14} strokeWidth={3} />}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mobile floating action bar */}
          <div className="sm:hidden absolute bottom-6 left-0 right-0 px-4 flex justify-center z-20">
            {isSelectMode ? (
              <div className="w-full max-w-sm pointer-events-auto flex flex-col gap-2 p-3 bg-white rounded-2xl shadow-xl shadow-blue-900/10 border border-gray-100">
                <button
                  onClick={handleSelectAll}
                  className="w-full py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl"
                >
                  {selectedPhotoIds.length === displayPhotos.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
                <button
                  onClick={handleAddToGallery}
                  disabled={selectedPhotoIds.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#2563eb] text-white rounded-xl text-sm font-semibold active:scale-95 transition-transform disabled:opacity-50"
                >
                  <LibrarySquare size={16} />
                  Add to My Photos ({selectedPhotoIds.length})
                </button>
              </div>
            ) : (
              <div className="pointer-events-auto flex items-center gap-3 p-1.5 bg-white rounded-full shadow-xl shadow-blue-900/10 border border-gray-100">
                <button
                  onClick={toggleSelectMode}
                  disabled={checkedAttendees.length === 0}
                  className="flex items-center gap-2 px-5 py-3 bg-[#2563eb] text-white rounded-full text-sm font-semibold active:scale-95 transition-transform disabled:opacity-50"
                >
                  <CheckSquare size={16} />
                  Select Photos
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
