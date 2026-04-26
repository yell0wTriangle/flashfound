import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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
import { apiRequest } from "../lib/api.js";
import { supabase } from "../lib/supabase.js";
import { DEFAULT_AVATAR_PLACEHOLDER } from "../lib/avatarPlaceholder.js";

function fallbackImage(index) {
  return `https://images.unsplash.com/photo-1515169067865-5387ec356754?auto=format&fit=crop&q=80&w=${760 + (index % 4) * 60}`;
}

const App = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState("");
  const [requestedAccess, setRequestedAccess] = useState([]);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [checkedAttendeeIds, setCheckedAttendeeIds] = useState(["all"]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [addedCount, setAddedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [eventData, setEventData] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [allMatchedPhotos, setAllMatchedPhotos] = useState([]);
  const [viewerId, setViewerId] = useState("");

  const selectedPersonIds = useMemo(() => {
    if (checkedAttendeeIds.includes("all")) return [];
    return checkedAttendeeIds;
  }, [checkedAttendeeIds]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) {
          if (cancelled) return;
          setEventData(null);
          setAttendees([]);
          setAllMatchedPhotos([]);
          setViewerId("");
          return;
        }

        setViewerId(session.user.id);

        const params = new URLSearchParams();
        if (selectedPersonIds.length) {
          params.set("person_ids", selectedPersonIds.join(","));
        }
        const suffix = params.toString() ? `?${params.toString()}` : "";
        const data = await apiRequest(`/events/${eventId}/results${suffix}`, {
          token: session.access_token,
        });

        if (cancelled) return;
        setEventData(data?.event || null);
        setAttendees(data?.people || []);
        setAllMatchedPhotos(
          (data?.photos || []).map((photo, index) => ({
            id: photo.id,
            subjects: photo.people || [],
            url: photo.image_url || fallbackImage(index),
          })),
        );
      } catch (requestError) {
        if (cancelled) return;
        setError(requestError instanceof Error ? requestError.message : String(requestError));
        setEventData(null);
        setAttendees([]);
        setAllMatchedPhotos([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [eventId, selectedPersonIds]);

  const approvedAccessIds = useMemo(
    () => attendees.filter((person) => person.accessible).map((person) => person.id),
    [attendees],
  );

  const displayPhotos = useMemo(() => {
    if (checkedAttendeeIds.includes("all")) {
      return allMatchedPhotos;
    }
    return allMatchedPhotos.filter((photo) =>
      photo.subjects.some((id) => checkedAttendeeIds.includes(id)),
    );
  }, [allMatchedPhotos, checkedAttendeeIds]);

  const filteredAttendees = useMemo(() => {
    return attendees.filter((user) =>
      (user.name || "").toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [attendees, searchQuery]);

  const toggleAttendeeCheck = (id) => {
    setSelectedPhotoIds([]);
    setAddedCount(0);
    setCheckedAttendeeIds((previous) => {
      if (id === "all") return ["all"];
      const next = previous.includes(id)
        ? previous.filter((attendeeId) => attendeeId !== id && attendeeId !== "all")
        : [...previous.filter((attendeeId) => attendeeId !== "all"), id];
      return next.length ? next : [viewerId].filter(Boolean);
    });
  };

  const handleRequestAccess = async (targetUserId) => {
    if (requestedAccess.includes(targetUserId)) return;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Session expired. Please login again.");
      }

      await apiRequest("/private-access/requests", {
        method: "POST",
        token: session.access_token,
        body: {
          event_id: eventId,
          target_user_id: targetUserId,
        },
      });

      setRequestedAccess((previous) => [...previous, targetUserId]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    }
  };

  const toggleSelectMode = () => {
    setIsSelectMode((previous) => !previous);
    setSelectedPhotoIds([]);
    setAddedCount(0);
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

  const handleAddToGallery = async () => {
    if (!selectedPhotoIds.length || isAdding) return;
    setIsAdding(true);
    setError("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Session expired. Please login again.");
      }

      const result = await apiRequest("/my-photos", {
        method: "POST",
        token: session.access_token,
        body: { photo_ids: selectedPhotoIds },
      });
      setAddedCount(result?.added_count || 0);
      setSelectedPhotoIds([]);
      setIsSelectMode(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally {
      setIsAdding(false);
    }
  };

  const getViewingText = () => {
    if (checkedAttendeeIds.includes("all")) return "Everyone (Authorized)";
    if (checkedAttendeeIds.length === 0) return "No one selected";
    const selectedNames = checkedAttendeeIds
      .map((id) => attendees.find((a) => a.id === id)?.name || "Me")
      .filter(Boolean);
    if (selectedNames.length <= 2) return selectedNames.join(" & ");
    return `${selectedNames[0]} & ${selectedNames.length - 1} others`;
  };

  return (
    <div className="h-screen w-full bg-gray-50 flex flex-col font-sans text-gray-900 overflow-hidden">
      <header
        className={`flex items-center justify-between px-4 sm:px-6 py-4 border-b shrink-0 z-20 shadow-sm transition-colors ${isSelectMode ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"}`}
      >
        <div className="flex items-center gap-4">
          <button
            className={`p-2 -ml-2 rounded-full transition-colors flex items-center justify-center ${isSelectMode ? "text-blue-700 hover:bg-blue-100" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`}
            onClick={
              isSelectMode
                ? toggleSelectMode
                : () => navigate(location.state?.from || "/events", { replace: true })
            }
          >
            {isSelectMode ? <X size={20} /> : <ArrowLeft size={20} />}
          </button>
          <div>
            {!isSelectMode ? (
              <>
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight leading-none">
                    {eventData?.name || "Private Event"}
                  </h1>
                  <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    <Lock size={10} /> Private
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-500">
                  {eventData?.date || "Date unavailable"} • {eventData?.location || "Location unavailable"}
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
            disabled={isSelectMode && (selectedPhotoIds.length === 0 || isAdding)}
            className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {isSelectMode ? <LibrarySquare size={16} /> : <CheckSquare size={16} />}
            {isSelectMode ? (isAdding ? "Adding..." : "Add to My Photos") : "Select Photos"}
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
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 outline-none transition-all"
                disabled={isSelectMode}
              />
            </div>
          </div>

          <div
            className={`flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar ${isSelectMode ? "opacity-50 pointer-events-none" : ""}`}
          >
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
              const isApproved = user.accessible;
              const hasRequested = requestedAccess.includes(user.id);

              if (user.id === viewerId || isApproved) {
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
                      src={user.avatar_url || DEFAULT_AVATAR_PLACEHOLDER}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                      alt={user.name}
                    />
                      <div className="flex flex-col">
                        <span
                          className={`text-sm ${isChecked ? "font-bold text-gray-900" : "font-medium text-gray-600"}`}
                        >
                          {user.id === viewerId ? "Me" : user.name}
                        </span>
                        {user.id !== viewerId && (
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
                      src={user.avatar_url || DEFAULT_AVATAR_PLACEHOLDER}
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
            {error ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                Loading gallery...
              </div>
            ) : (
              <div className="columns-2 sm:columns-3 xl:columns-4 gap-4 space-y-4">
                {displayPhotos.map((photo) => {
                  const isSelected = selectedPhotoIds.includes(photo.id);
                  return (
                    <div
                      key={photo.id}
                      onClick={() => isSelectMode && togglePhotoSelection(photo.id)}
                      className={`break-inside-avoid relative group rounded-xl overflow-hidden bg-white shadow-sm transition-all border-2 ${isSelected ? "border-[#2563eb]" : "border-transparent"} ${isSelectMode ? "cursor-pointer" : ""}`}
                    >
                      <img
                        src={photo.url}
                        className="w-full h-auto object-cover"
                        alt="Matched memory"
                      />

                      {isSelectMode && (
                        <div className="absolute top-3 left-3">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected
                                ? "bg-[#2563eb] border-[#2563eb] text-white"
                                : "bg-white/80 border-white text-transparent"
                            }`}
                          >
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {addedCount > 0 ? (
        <div className="fixed bottom-5 right-5 rounded-xl bg-green-600 text-white px-4 py-3 text-sm shadow-lg z-50">
          Added {addedCount} photo{addedCount > 1 ? "s" : ""} to My Photos
        </div>
      ) : null}
    </div>
  );
};

export default App;
