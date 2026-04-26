import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Globe, Check, Search, Plus } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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
  const [checkedAttendees, setCheckedAttendees] = useState(["all"]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [addedCount, setAddedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [eventData, setEventData] = useState(null);
  const [people, setPeople] = useState([]);
  const [photos, setPhotos] = useState([]);

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
          setPeople([]);
          setPhotos([]);
          setEventData(null);
          return;
        }

        const data = await apiRequest(`/events/${eventId}/results`, {
          token: session.access_token,
        });
        if (cancelled) return;
        setEventData(data?.event || null);
        setPeople(data?.people || []);
        setPhotos(data?.photos || []);
      } catch (requestError) {
        if (cancelled) return;
        setError(requestError instanceof Error ? requestError.message : String(requestError));
        setEventData(null);
        setPeople([]);
        setPhotos([]);
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
  }, [eventId]);

  const filteredAttendees = useMemo(
    () =>
      people.filter((person) =>
        (person.name || "").toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [people, searchQuery],
  );

  const mappedPhotos = useMemo(
    () =>
      photos.map((photo, index) => ({
        id: photo.id,
        url: photo.image_url || fallbackImage(index),
        subjects: photo.people || [],
      })),
    [photos],
  );

  const displayPhotos = useMemo(() => {
    if (checkedAttendees.includes("all")) return mappedPhotos;
    return mappedPhotos.filter((photo) =>
      photo.subjects.some((subject) => checkedAttendees.includes(subject)),
    );
  }, [checkedAttendees, mappedPhotos]);

  const toggleAttendeeCheck = (id) => {
    setSelectedPhotoIds([]);
    setAddedCount(0);
    setCheckedAttendees((previous) => {
      if (id === "all") return ["all"];
      const next = previous.includes(id)
        ? previous.filter((attendeeId) => attendeeId !== id && attendeeId !== "all")
        : [...previous.filter((attendeeId) => attendeeId !== "all"), id];
      return next.length ? next : ["all"];
    });
  };

  const toggleSelectMode = () => {
    setIsSelectMode((previous) => !previous);
    setSelectedPhotoIds([]);
    setAddedCount(0);
  };

  const togglePhotoSelection = (id) => {
    setSelectedPhotoIds((previous) =>
      previous.includes(id)
        ? previous.filter((photoId) => photoId !== id)
        : [...previous, id],
    );
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
        body: {
          photo_ids: selectedPhotoIds,
        },
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
    if (checkedAttendees.includes("all")) return "Everyone";
    if (!checkedAttendees.length) return "No one selected";
    const selectedNames = checkedAttendees
      .map((id) => filteredAttendees.find((person) => person.id === id)?.name)
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
            title={isSelectMode ? "Cancel Selection" : "Back to Events"}
            onClick={
              isSelectMode
                ? toggleSelectMode
                : () => navigate(location.state?.from || "/events", { replace: true })
            }
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            {!isSelectMode ? (
              <>
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight leading-none">
                    {eventData?.name || "Event Gallery"}
                  </h1>
                  <span className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 bg-[#2563eb]/10 text-[#2563eb] rounded-md text-[10px] font-bold uppercase tracking-wider">
                    <Globe size={10} /> Public
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
          {!isSelectMode ? (
            <button
              onClick={toggleSelectMode}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              Select Photos
            </button>
          ) : (
            <button
              onClick={handleAddToGallery}
              disabled={selectedPhotoIds.length === 0 || isAdding}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
            >
              <Plus size={16} />
              {isAdding ? "Adding..." : "Add to My Photos"}
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
        <aside className="w-full md:w-80 h-full flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-1 flex items-center gap-2">
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
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
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
                  checkedAttendees.includes("all")
                    ? "border-[#2563eb] bg-blue-50 shadow-sm"
                    : "border-transparent bg-gray-50/50 hover:bg-gray-100 hover:border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="relative shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 border border-gray-200 text-gray-600">
                    Everyone
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
                        src={user.avatar_url || DEFAULT_AVATAR_PLACEHOLDER}
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

            {!loading && !filteredAttendees.length ? (
              <div className="text-center py-6 text-sm text-gray-500">
                No attendees found.
              </div>
            ) : null}
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-gray-50 overflow-hidden relative">
          <div className="px-4 sm:px-6 py-5 flex items-center justify-between shrink-0 bg-gray-50/80 backdrop-blur-sm z-10 sticky top-0">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                Showing photos of:{" "}
                <span className="text-[#2563eb]">{getViewingText()}</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {displayPhotos.length} matches found
              </p>
            </div>

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
                        alt="Matched event memory"
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

export const PeopleRow = ({ checked, label, avatar, onClick, disabled, action }) => {
  return (
    <div className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl ${disabled ? "opacity-50" : "hover:bg-gray-50"}`}>
      <button disabled={disabled} onClick={onClick} className="flex flex-1 items-center gap-3 text-left disabled:cursor-not-allowed">
        <span className={`h-5 w-5 rounded-md border flex items-center justify-center ${checked ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"}`}>
          {checked && <Check size={13} className="text-white" />}
        </span>
        {avatar ? <img src={avatar} alt="" className="h-7 w-7 rounded-full object-cover" /> : null}
        <span className="text-sm font-medium text-gray-700 truncate">{label}</span>
      </button>
      {action}
    </div>
  );
};

export default App;
