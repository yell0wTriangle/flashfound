import { Download, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import PhotoGrid from "../components/PhotoGrid.jsx";
import { currentUser, events, getPerson, myPhotoIds, photos } from "../data/demoData.js";

export default function MyPhotos() {
  const savedPhotos = photos.filter((photo) => myPhotoIds.includes(photo.id));
  const [selectedEvents, setSelectedEvents] = useState(["all"]);
  const [selectedPeople, setSelectedPeople] = useState([currentUser.id]);
  const [peopleQuery, setPeopleQuery] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);

  const activeEventIds = selectedEvents.includes("all")
    ? [...new Set(savedPhotos.map((photo) => photo.eventId))]
    : selectedEvents;

  const availablePeople = useMemo(() => {
    const ids = new Set();
    savedPhotos.forEach((photo) => {
      if (activeEventIds.includes(photo.eventId)) photo.people.forEach((id) => ids.add(id));
    });
    return [...ids].map(getPerson).filter(Boolean);
  }, [activeEventIds.join("|")]);

  const filteredPeople = availablePeople.filter((person) =>
    person.name.toLowerCase().includes(peopleQuery.toLowerCase()),
  );

  const visiblePhotos = savedPhotos.filter((photo) => {
    const eventMatch = activeEventIds.includes(photo.eventId);
    const peopleMatch =
      selectedPeople.includes("everyone") ||
      selectedPeople.some((personId) => photo.people.includes(personId));
    return eventMatch && peopleMatch;
  });

  const toggleEvent = (id) => {
    setSelectedPhotos([]);
    if (id === "all") {
      setSelectedEvents(["all"]);
      return;
    }
    const next = selectedEvents.includes(id)
      ? selectedEvents.filter((eventId) => eventId !== id && eventId !== "all")
      : [...selectedEvents.filter((eventId) => eventId !== "all"), id];
    setSelectedEvents(next.length ? next : ["all"]);
  };

  const togglePerson = (id) => {
    setSelectedPhotos([]);
    if (id === "everyone") {
      setSelectedPeople(["everyone"]);
      return;
    }
    const next = selectedPeople.includes(id)
      ? selectedPeople.filter((personId) => personId !== id && personId !== "everyone")
      : [...selectedPeople.filter((personId) => personId !== "everyone"), id];
    setSelectedPeople(next.length ? next : [currentUser.id]);
  };

  const togglePhoto = (id) =>
    setSelectedPhotos((prev) => (prev.includes(id) ? prev.filter((photoId) => photoId !== id) : [...prev, id]));

  return (
    <div className="min-h-full bg-gray-50 p-6 lg:p-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Photos</h1>
          <p className="text-gray-500 mt-1">Photos you added from event galleries.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setSelectMode((value) => !value)} className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 font-semibold text-gray-700 hover:border-blue-200">
            {selectMode ? "Cancel Select" : "Select Photos"}
          </button>
          {selectMode && (
            <button className="px-4 py-2.5 rounded-xl bg-[#2563eb] text-white font-semibold flex items-center gap-2">
              <Download size={17} /> Download
            </button>
          )}
        </div>
      </header>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        <aside className="space-y-5">
          <FilterPanel title="Events">
            <CheckRow checked={selectedEvents.includes("all")} label="All Photos" onClick={() => toggleEvent("all")} />
            {events
              .filter((event) => savedPhotos.some((photo) => photo.eventId === event.id))
              .map((event) => (
                <CheckRow key={event.id} checked={selectedEvents.includes(event.id)} label={event.name} onClick={() => toggleEvent(event.id)} />
              ))}
          </FilterPanel>

          <FilterPanel title="People">
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-3 text-gray-400" />
              <input value={peopleQuery} onChange={(event) => setPeopleQuery(event.target.value)} placeholder="Search people" className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
            <CheckRow checked={selectedPeople.includes("everyone")} label="Everyone" onClick={() => togglePerson("everyone")} />
            {filteredPeople.map((person) => (
              <CheckRow key={person.id} checked={selectedPeople.includes(person.id)} label={person.id === currentUser.id ? "Me" : person.name} avatar={person.avatar} onClick={() => togglePerson(person.id)} />
            ))}
          </FilterPanel>
        </aside>

        <section className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-sm">
          {selectMode && (
            <div className="flex justify-between items-center mb-4 text-sm">
              <button
                onClick={() => setSelectedPhotos(selectedPhotos.length === visiblePhotos.length ? [] : visiblePhotos.map((photo) => photo.id))}
                className="font-semibold text-[#2563eb]"
              >
                {selectedPhotos.length === visiblePhotos.length ? "Deselect All" : "Select All"}
              </button>
              <span className="text-gray-500">{selectedPhotos.length} selected</span>
            </div>
          )}
          <PhotoGrid photos={visiblePhotos} selectMode={selectMode} selectedIds={selectedPhotos} onToggle={togglePhoto} />
          {!visiblePhotos.length && <EmptyState />}
        </section>
      </div>
    </div>
  );
}

function FilterPanel({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <h2 className="font-bold text-gray-900 mb-3">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function CheckRow({ checked, label, avatar, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 text-left">
      <span className={`h-5 w-5 rounded-md border flex items-center justify-center ${checked ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}>
        {checked && <X size={12} className="text-white rotate-45" />}
      </span>
      {avatar && <img src={avatar} alt="" className="h-7 w-7 rounded-full object-cover" />}
      <span className="text-sm font-medium text-gray-700 truncate">{label}</span>
    </button>
  );
}

function EmptyState() {
  return <div className="py-20 text-center text-gray-400 font-medium">No photos match these filters.</div>;
}
