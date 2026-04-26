import { ArrowLeft, Check, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PhotoGrid from "../components/PhotoGrid.jsx";
import { eventPeople, getEvent, getEventPhotos, getPerson } from "../data/demoData.js";

export default function PublicResults() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const event = getEvent(eventId);
  const eventPhotos = getEventPhotos(eventId);
  const [query, setQuery] = useState("");
  const [selectedPeople, setSelectedPeople] = useState(["everyone"]);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [added, setAdded] = useState(false);

  const people = (eventPeople[eventId] || []).map(getPerson).filter(Boolean);
  const filteredPeople = people.filter((person) => person.name.toLowerCase().includes(query.toLowerCase()));
  const visiblePhotos = useMemo(
    () =>
      eventPhotos.filter(
        (photo) => selectedPeople.includes("everyone") || selectedPeople.some((id) => photo.people.includes(id)),
      ),
    [eventPhotos, selectedPeople],
  );

  const togglePerson = (id) => {
    if (id === "everyone") return setSelectedPeople(["everyone"]);
    const next = selectedPeople.includes(id)
      ? selectedPeople.filter((personId) => personId !== id && personId !== "everyone")
      : [...selectedPeople.filter((personId) => personId !== "everyone"), id];
    setSelectedPeople(next.length ? next : ["everyone"]);
  };

  const togglePhoto = (id) =>
    setSelectedPhotos((prev) => (prev.includes(id) ? prev.filter((photoId) => photoId !== id) : [...prev, id]));

  return (
    <ResultsLayout
      event={event}
      eventType="Public"
      query={query}
      setQuery={setQuery}
      people={filteredPeople}
      selectedPeople={selectedPeople}
      togglePerson={togglePerson}
      onBack={() => navigate("/events")}
    >
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-xl font-bold">Gallery</h2>
          <p className="text-sm text-gray-500">{visiblePhotos.length} photos visible</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setSelectMode((value) => !value)} className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white font-semibold">
            {selectMode ? "Cancel" : "Select Photos"}
          </button>
          {selectMode && (
            <button onClick={() => setAdded(true)} className="px-4 py-2.5 rounded-xl bg-[#2563eb] text-white font-semibold flex items-center gap-2">
              <Plus size={17} /> {added ? "Added" : "Add to My Photos"}
            </button>
          )}
        </div>
      </div>
      {selectMode && (
        <button onClick={() => setSelectedPhotos(selectedPhotos.length === visiblePhotos.length ? [] : visiblePhotos.map((photo) => photo.id))} className="mb-4 text-sm font-semibold text-[#2563eb]">
          {selectedPhotos.length === visiblePhotos.length ? "Deselect All" : "Select All"} ({selectedPhotos.length})
        </button>
      )}
      <PhotoGrid photos={visiblePhotos} selectMode={selectMode} selectedIds={selectedPhotos} onToggle={togglePhoto} action="add" />
    </ResultsLayout>
  );
}

export function ResultsLayout({ event, eventType, children, query, setQuery, people, selectedPeople, togglePerson, onBack, peopleContent }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 font-semibold text-gray-600 hover:text-gray-900">
          <ArrowLeft size={18} /> Back to events
        </button>
        <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 font-bold text-sm">{eventType} Event</span>
      </header>

      <main className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">{event?.name || "Event Gallery"}</h1>
          <p className="text-gray-500 mt-1">{event?.location} - {event?.date}</p>
        </div>
        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          <aside className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm h-fit">
            <h2 className="font-bold text-gray-900 mb-3">People</h2>
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-3 text-gray-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people" className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
            {peopleContent || (
              <>
                <PeopleRow checked={selectedPeople.includes("everyone")} label="Everyone" onClick={() => togglePerson("everyone")} />
                {people.map((person) => (
                  <PeopleRow key={person.id} checked={selectedPeople.includes(person.id)} label={person.name} avatar={person.avatar} onClick={() => togglePerson(person.id)} />
                ))}
              </>
            )}
          </aside>
          <section className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">{children}</section>
        </div>
      </main>
    </div>
  );
}

export function PeopleRow({ checked, label, avatar, onClick, disabled, action }) {
  return (
    <div className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl ${disabled ? "opacity-50" : "hover:bg-gray-50"}`}>
      <button disabled={disabled} onClick={onClick} className="flex flex-1 items-center gap-3 text-left disabled:cursor-not-allowed">
        <span className={`h-5 w-5 rounded-md border flex items-center justify-center ${checked ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"}`}>
          {checked && <Check size={13} className="text-white" />}
        </span>
        {avatar && <img src={avatar} alt="" className="h-7 w-7 rounded-full object-cover" />}
        <span className="text-sm font-medium text-gray-700 truncate">{label}</span>
      </button>
      {action}
    </div>
  );
}
