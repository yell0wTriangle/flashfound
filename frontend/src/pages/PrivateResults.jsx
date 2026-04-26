import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PhotoGrid from "../components/PhotoGrid.jsx";
import { eventPeople, getEvent, getEventPhotos, getPerson, privateAccess } from "../data/demoData.js";
import { PeopleRow, ResultsLayout } from "./PublicResults.jsx";

export default function PrivateResults() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const event = getEvent(eventId);
  const eventPhotos = getEventPhotos(eventId);
  const accessIds = privateAccess[eventId] || ["user_me"];
  const [query, setQuery] = useState("");
  const [requested, setRequested] = useState([]);
  const [selectedPeople, setSelectedPeople] = useState(["everyone"]);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [added, setAdded] = useState(false);

  const people = (eventPeople[eventId] || []).map(getPerson).filter(Boolean);
  const filteredPeople = people.filter((person) => person.name.toLowerCase().includes(query.toLowerCase()));
  const accessiblePeople = people.filter((person) => accessIds.includes(person.id));

  const visiblePhotos = useMemo(() => {
    const allowedIds = selectedPeople.includes("everyone") ? accessiblePeople.map((person) => person.id) : selectedPeople;
    return eventPhotos.filter(
      (photo) => photo.people.some((id) => allowedIds.includes(id)) && photo.people.every((id) => accessIds.includes(id)),
    );
  }, [eventPhotos, selectedPeople, accessIds.join("|")]);

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
      eventType="Private"
      query={query}
      setQuery={setQuery}
      people={[]}
      selectedPeople={selectedPeople}
      togglePerson={togglePerson}
      onBack={() => navigate("/events")}
      peopleContent={
        <PrivatePeopleList
          people={filteredPeople}
          accessIds={accessIds}
          requested={requested}
          selectedPeople={selectedPeople}
          togglePerson={togglePerson}
          onRequest={(id) => setRequested((prev) => [...prev, id])}
        />
      }
    >
      <div className="hidden" />
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-xl font-bold">Private Gallery</h2>
          <p className="text-sm text-gray-500">{visiblePhotos.length} accessible photos visible</p>
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

function PrivatePeopleList({ people, accessIds, requested, selectedPeople, togglePerson, onRequest }) {
  return (
    <>
      <PeopleRow checked={selectedPeople.includes("everyone")} label="Everyone" onClick={() => togglePerson("everyone")} />
      {people.map((person) => {
        const hasAccess = accessIds.includes(person.id);
        return (
          <PeopleRow
            key={person.id}
            checked={selectedPeople.includes(person.id)}
            label={person.name}
            avatar={person.avatar}
            disabled={!hasAccess}
            onClick={() => togglePerson(person.id)}
            action={
              !hasAccess && (
                <button onClick={() => onRequest(person.id)} className="text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold">
                  {requested.includes(person.id) ? "Sent" : "Request"}
                </button>
              )
            }
          />
        );
      })}
    </>
  );
}
