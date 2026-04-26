import React, { useState, useMemo } from "react";
import {
  Download,
  CheckCircle2,
  Camera,
  Menu,
  Image as ImageIcon,
  Compass,
  User,
  Search,
  Filter,
  Users,
  Check,
  X,
  CheckSquare,
  CalendarPlus,
  Bell,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [peopleSearch, setPeopleSearch] = useState("");
  const [activeEventIds, setActiveEventIds] = useState(["all"]);
  const [checkedPeopleIds, setCheckedPeopleIds] = useState(["me"]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState([]);

  // Mock Attendees/People Data
  const allPeople = [
    {
      id: "me",
      name: "Me (Alex)",
      avatar: "https://picsum.photos/seed/selfie3/200/200",
      eventIds: ["e1", "e2", "e3"],
    },
    {
      id: "p1",
      name: "Sarah Jenkins",
      avatar: "https://i.pravatar.cc/150?u=sarah",
      eventIds: ["e1", "e2"],
    },
    {
      id: "p2",
      name: "David Chen",
      avatar: "https://i.pravatar.cc/150?u=david",
      eventIds: ["e1", "e3"],
    },
    {
      id: "p3",
      name: "Emily Rodriguez",
      avatar: "https://i.pravatar.cc/150?u=emily",
      eventIds: ["e2"],
    },
    {
      id: "p4",
      name: "Michael Chang",
      avatar: "https://i.pravatar.cc/150?u=michael",
      eventIds: ["e3"],
    },
  ];

  // Mock Events Data
  const myEvents = [
    { id: "all", name: "All Photos", count: 42 },
    { id: "e1", name: "TechNova Summit '26", count: 12 },
    { id: "e2", name: "Neon Nights Music Festival", count: 8 },
    { id: "e3", name: "City Marathon 2026", count: 22 },
  ];

  // Dummy Photos with relationships
  const matchedPhotos = useMemo(
    () =>
      Array.from({ length: 42 }).map((_, i) => {
        let eventId = "e1";
        let peopleInPhoto = ["me"];
        if (i > 11 && i <= 19) {
          eventId = "e2";
          if (i % 2 === 0) peopleInPhoto.push("p1", "p3");
        } else if (i > 19) {
          eventId = "e3";
          if (i % 3 === 0) peopleInPhoto.push("p2", "p4");
        } else {
          if (i % 2 === 0) peopleInPhoto.push("p1", "p2");
        }

        const heights = [300, 400, 500, 250, 450];
        return {
          id: i,
          eventId,
          people: peopleInPhoto,
          url: `https://picsum.photos/seed/flashfound${i + 200}/400/${heights[i % heights.length]}`,
        };
      }),
    [],
  );

  // Filter People based on Event Context
  const contextualPeople = useMemo(() => {
    if (activeEventIds.includes("all")) return allPeople;
    return allPeople.filter((p) =>
      p.eventIds.some((id) => activeEventIds.includes(id)),
    );
  }, [activeEventIds]);

  // Filter Photos based on Event AND People
  const displayPhotos = useMemo(() => {
    return matchedPhotos.filter((photo) => {
      const eventMatch =
        activeEventIds.includes("all") ||
        activeEventIds.includes(photo.eventId);
      const peopleMatch =
        checkedPeopleIds.includes("all") ||
        checkedPeopleIds.some((id) => photo.people.includes(id));
      return eventMatch && peopleMatch;
    });
  }, [activeEventIds, checkedPeopleIds, matchedPhotos]);

  const toggleEvent = (id) => {
    setActiveEventIds((prev) => {
      if (id === "all") return ["all"];
      const newIds = prev.includes(id)
        ? prev.filter((eId) => eId !== id)
        : [...prev.filter((eId) => eId !== "all"), id];
      return newIds.length === 0 ? ["all"] : newIds;
    });
  };

  const togglePerson = (id) => {
    setCheckedPeopleIds((prev) => {
      if (id === "all") return ["all"];
      const newIds = prev.includes(id)
        ? prev.filter((pId) => pId !== id)
        : [...prev.filter((pId) => pId !== "all"), id];
      return newIds.length === 0 ? ["all"] : newIds;
    });
  };

  // Selection Handlers
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
    if (
      selectedPhotoIds.length === displayPhotos.length &&
      displayPhotos.length > 0
    ) {
      setSelectedPhotoIds([]);
    } else {
      setSelectedPhotoIds(displayPhotos.map((p) => p.id));
    }
  };

  const handleDownload = () => {
    console.log(`Downloading ${selectedPhotoIds.length} selected photos...`);
    setIsSelectMode(false);
    setSelectedPhotoIds([]);
  };

  return (
    <div className="h-screen w-full bg-gray-50 flex font-sans text-gray-900 overflow-hidden">
      {/* Universal Left Navbar */}
      <NavBar activePage="my-photos" />

      {/* Main App Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Navbar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shrink-0 z-20">
          <div className="flex items-center gap-2 text-[#2563eb]">
            <Camera size={24} strokeWidth={2.5} />
            <span className="text-xl font-bold text-gray-900">FlashFound</span>
          </div>
          <button className="text-gray-500">
            <Menu size={24} />
          </button>
        </div>

        {/* Top Header - Unified Transition */}
        <header
          className={`flex items-center justify-between p-4 sm:px-6 sm:py-5 border-b shrink-0 z-10 transition-colors duration-300 ${isSelectMode ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"}`}
        >
          <div className="flex items-center gap-4">
            {isSelectMode && (
              <button
                onClick={toggleSelectMode}
                className="p-2 -ml-2 text-blue-700 hover:bg-blue-100 rounded-full transition-colors flex items-center justify-center"
              >
                <X size={20} />
              </button>
            )}
            <div>
              <h1
                className={`text-xl sm:text-2xl font-bold tracking-tight leading-tight ${isSelectMode ? "text-blue-800" : "text-gray-900"}`}
              >
                {isSelectMode
                  ? `${selectedPhotoIds.length} Selected`
                  : "My Photos"}
              </h1>
              {!isSelectMode && (
                <p className="text-sm text-gray-500">
                  Securely matched via your verification selfie.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isSelectMode ? (
              <button
                onClick={handleDownload}
                disabled={selectedPhotoIds.length === 0}
                className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-[#2563eb] text-white rounded-xl text-sm font-semibold shadow-md disabled:opacity-50 transition-all active:scale-95"
              >
                <Download size={18} /> Download Selected
              </button>
            ) : (
              <button
                onClick={() => setIsSelectMode(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 shadow-sm transition-all active:scale-95"
              >
                <CheckSquare size={18} /> Select Photos
              </button>
            )}
          </div>
        </header>

        {/* Main Body */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Sidebar Filter Panel */}
          <aside
            className={`w-full lg:w-80 flex-shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col overflow-hidden transition-opacity ${isSelectMode ? "opacity-50 pointer-events-none" : "opacity-100"}`}
          >
            {/* Event Filter */}
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Filter size={14} /> Filter by Event
              </h3>
              <div className="space-y-1">
                {myEvents.map((event) => {
                  const isActive = activeEventIds.includes(event.id);
                  return (
                    <button
                      key={event.id}
                      onClick={() => toggleEvent(event.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${
                        isActive
                          ? "bg-blue-50 text-blue-700 font-bold"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden pr-3">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            isActive
                              ? "bg-[#2563eb] border-[#2563eb] text-white"
                              : "bg-white border-gray-300"
                          }`}
                        >
                          {isActive && <Check size={12} strokeWidth={3} />}
                        </div>
                        <span className="truncate text-left">{event.name}</span>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                          isActive
                            ? "bg-blue-100 text-blue-700 font-bold"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {event.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* People Filter */}
            <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/30">
              <div className="p-6 pb-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Users size={14} /> Show pictures of
                </h3>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={14}
                  />
                  <input
                    type="text"
                    placeholder="Search people..."
                    value={peopleSearch}
                    onChange={(e) => setPeopleSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2">
                {/* Everyone / All Photos Toggle */}
                {!peopleSearch && (
                  <div
                    onClick={() => togglePerson("all")}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer border transition-all ${
                      checkedPeopleIds.includes("all")
                        ? "bg-white border-blue-200 shadow-sm"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center border border-gray-200 shrink-0">
                        <Users size={16} />
                      </div>
                      <span
                        className={`text-sm truncate ${
                          checkedPeopleIds.includes("all")
                            ? "font-semibold text-gray-900"
                            : "text-gray-600"
                        }`}
                      >
                        Everyone
                      </span>
                    </div>
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 ${
                        checkedPeopleIds.includes("all")
                          ? "bg-[#2563eb] border-[#2563eb] text-white"
                          : "bg-white border-gray-300"
                      }`}
                    >
                      {checkedPeopleIds.includes("all") && (
                        <Check size={14} strokeWidth={3} />
                      )}
                    </div>
                  </div>
                )}

                {/* Specific People */}
                {contextualPeople
                  .filter((p) =>
                    p.name.toLowerCase().includes(peopleSearch.toLowerCase()),
                  )
                  .map((person) => (
                    <div
                      key={person.id}
                      onClick={() => togglePerson(person.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer border transition-all ${checkedPeopleIds.includes(person.id) ? "bg-white border-blue-200 shadow-sm" : "border-transparent opacity-70 hover:opacity-100"}`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <img
                          src={person.avatar}
                          className={`w-8 h-8 rounded-full border border-gray-200 shrink-0 ${checkedPeopleIds.includes(person.id) ? "grayscale-0" : "grayscale opacity-60"}`}
                          alt={person.name}
                        />
                        <span
                          className={`text-sm truncate ${checkedPeopleIds.includes(person.id) ? "font-semibold text-gray-900" : "text-gray-600"}`}
                        >
                          {person.name}
                        </span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 ${checkedPeopleIds.includes(person.id) ? "bg-[#2563eb] border-[#2563eb] text-white" : "bg-white border-gray-300"}`}
                      >
                        {checkedPeopleIds.includes(person.id) && (
                          <Check size={14} strokeWidth={3} />
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </aside>

          {/* Gallery Content Area */}
          <main className="flex-1 flex flex-col bg-gray-50 overflow-hidden relative">
            {/* Gallery Toolbar - Unified Styling */}
            <div className="px-6 py-4 flex items-center justify-between bg-white/50 backdrop-blur-sm border-b border-gray-200 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-500">
                  Showing:
                </span>
                <span className="px-3 py-1 bg-white rounded-full text-xs font-bold border border-gray-200 shadow-sm flex items-center gap-1.5">
                  <Users size={12} className="text-[#2563eb]" />
                  {checkedPeopleIds.includes("all")
                    ? "Everyone"
                    : `${checkedPeopleIds.length} People`}
                </span>
                <span className="text-xs text-gray-400 font-medium">
                  • {displayPhotos.length} photos
                </span>
              </div>

              {isSelectMode && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    id="selectAllMyPhotos"
                    className="w-4 h-4 rounded border-gray-300 text-[#2563eb] focus:ring-[#2563eb] cursor-pointer"
                    checked={
                      selectedPhotoIds.length === displayPhotos.length &&
                      displayPhotos.length > 0
                    }
                    onChange={handleSelectAll}
                  />
                  <label
                    htmlFor="selectAllMyPhotos"
                    className="cursor-pointer font-medium"
                  >
                    Select all
                  </label>
                </div>
              )}
            </div>

            {/* Masonry Grid - Unified Card Selection */}
            <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
              {displayPhotos.length > 0 ? (
                <div className="columns-2 sm:columns-3 xl:columns-4 gap-4 space-y-4">
                  {displayPhotos.map((photo) => {
                    const isSelected = selectedPhotoIds.includes(photo.id);
                    return (
                      <div
                        key={photo.id}
                        onClick={() =>
                          isSelectMode && togglePhotoSelection(photo.id)
                        }
                        className={`break-inside-avoid relative group rounded-2xl overflow-hidden cursor-pointer transition-all border-2 ${
                          isSelectMode && isSelected
                            ? "border-[#2563eb] shadow-lg"
                            : isSelectMode
                              ? "border-transparent opacity-80"
                              : "border-transparent hover:border-gray-200 shadow-sm"
                        }`}
                      >
                        <img
                          src={photo.url}
                          className={`w-full h-auto object-cover transition-opacity ${isSelectMode && !isSelected ? "opacity-60 grayscale-[0.3]" : "opacity-100"}`}
                          alt="Matched moment"
                        />

                        {/* Unified Selection Indicator (Top Left) */}
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

                        {/* Hover Overlay Actions (Hidden in select mode) */}
                        {!isSelectMode && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                            <div className="flex gap-2 w-full justify-between items-center">
                              <div className="flex -space-x-2">
                                {photo.people.map((pid) => (
                                  <img
                                    key={pid}
                                    src={
                                      allPeople.find((p) => p.id === pid)
                                        ?.avatar
                                    }
                                    className="w-6 h-6 rounded-full border-2 border-white object-cover"
                                    alt="Person"
                                  />
                                ))}
                              </div>
                              <button className="p-2 bg-white rounded-full text-gray-900 shadow-lg hover:scale-110 transition-transform">
                                <Download size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                    <Users size={32} />
                  </div>
                  <h3 className="text-lg font-bold">No matches found</h3>
                  <p className="text-sm max-w-xs">
                    Try selecting different people or clearing your filters.
                  </p>
                </div>
              )}
            </div>

            {/* Unified Mobile Floating Bar */}
            <div className="sm:hidden absolute bottom-6 left-0 right-0 px-4 flex justify-center z-20">
              {isSelectMode ? (
                <div className="w-full max-w-sm pointer-events-auto flex flex-col gap-2 p-3 bg-white rounded-2xl shadow-2xl border border-gray-100">
                  <button
                    onClick={handleSelectAll}
                    className="w-full py-2 text-sm font-semibold text-[#2563eb] bg-blue-50 rounded-xl active:scale-95 transition-transform"
                  >
                    {selectedPhotoIds.length === displayPhotos.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={selectedPhotoIds.length === 0}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#2563eb] text-white rounded-xl text-sm font-bold active:scale-95 transition-transform disabled:opacity-50"
                  >
                    <Download size={18} />
                    Download Selected ({selectedPhotoIds.length})
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsSelectMode(true)}
                  className="pointer-events-auto flex items-center gap-2 px-6 py-3.5 bg-[#2563eb] text-white rounded-full text-sm font-bold shadow-xl shadow-blue-500/20 active:scale-95 transition-transform"
                >
                  <CheckSquare size={18} />
                  Select Photos
                </button>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;
