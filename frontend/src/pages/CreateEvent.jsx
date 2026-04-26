import { ArrowLeft, ImagePlus, Save, Trash2, Upload, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { events, getEventPhotos } from "../data/demoData.js";

export default function CreateEvent({ mode }) {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const existing = events.find((event) => event.id === eventId);
  const [tab, setTab] = useState("details");
  const [saved, setSaved] = useState(false);
  const [attendees, setAttendees] = useState(["friend@example.com", "aarav@flashfound.demo"]);
  const [newEmail, setNewEmail] = useState("");
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const gallery = useMemo(() => (eventId ? getEventPhotos(eventId) : []), [eventId]);

  const title = mode === "edit" && existing ? `Manage ${existing.name}` : "Create Event";

  return (
    <div className="min-h-full bg-gray-50 p-6 lg:p-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button onClick={() => navigate("/organiser/dashboard")} className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 mb-3">
            <ArrowLeft size={16} /> Back to dashboard
          </button>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-gray-500 mt-1">Details, attendees, and uploaded photos share one save flow.</p>
        </div>
        <button
          onClick={() => {
            setSaved(true);
            setTimeout(() => navigate("/organiser/dashboard"), 650);
          }}
          className="px-4 py-2.5 rounded-xl bg-[#2563eb] text-white font-semibold flex items-center gap-2"
        >
          <Save size={18} /> {saved ? "Saved" : "Save and Publish"}
        </button>
      </header>

      <div className="flex gap-2 mb-6 bg-white border border-gray-100 rounded-2xl p-1 w-fit">
        {["details", "attendees", "photos"].map((item) => (
          <button key={item} onClick={() => setTab(item)} className={`px-4 py-2 rounded-xl font-semibold capitalize ${tab === item ? "bg-[#2563eb] text-white" : "text-gray-500 hover:bg-gray-50"}`}>
            {item}
          </button>
        ))}
      </div>

      <section className="bg-white rounded-2xl border border-gray-100 p-5 lg:p-6 shadow-sm">
        {tab === "details" && <DetailsTab event={existing} />}
        {tab === "attendees" && (
          <AttendeesTab
            attendees={attendees}
            newEmail={newEmail}
            setNewEmail={setNewEmail}
            addEmail={() => {
              if (newEmail.trim()) setAttendees((prev) => [...prev, newEmail.trim()]);
              setNewEmail("");
            }}
            removeEmail={(email) => setAttendees((prev) => prev.filter((item) => item !== email))}
          />
        )}
        {tab === "photos" && (
          <PhotosTab
            gallery={gallery}
            selectedPhotos={selectedPhotos}
            setSelectedPhotos={setSelectedPhotos}
          />
        )}
      </section>
    </div>
  );
}

function DetailsTab({ event }) {
  return (
    <div className="grid md:grid-cols-2 gap-5">
      <Field label="Event name" defaultValue={event?.name || ""} required />
      <Field label="Date" defaultValue={event?.date || ""} required />
      <Field label="Location" defaultValue={event?.location || ""} required />
      <Field label="Organising company" defaultValue={event?.company || ""} />
      <label className="space-y-2">
        <span className="text-sm font-semibold text-gray-700">Event status</span>
        <select defaultValue={event?.status || "Draft"} className="w-full px-4 py-3 rounded-xl border border-gray-200">
          <option>Draft</option>
          <option>Upcoming</option>
          <option>Completed</option>
        </select>
      </label>
      <label className="space-y-2">
        <span className="text-sm font-semibold text-gray-700">Privacy type</span>
        <select defaultValue={event?.type || "Private"} className="w-full px-4 py-3 rounded-xl border border-gray-200">
          <option>Private</option>
          <option>Public</option>
        </select>
      </label>
      <div className="md:col-span-2 border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center text-gray-400">
        <ImagePlus className="mx-auto mb-2" />
        Cover image placeholder
      </div>
    </div>
  );
}

function Field({ label, defaultValue, required }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-gray-700">{label}{required ? " *" : ""}</span>
      <input defaultValue={defaultValue} className="w-full px-4 py-3 rounded-xl border border-gray-200" />
    </label>
  );
}

function AttendeesTab({ attendees, newEmail, setNewEmail, addEmail, removeEmail }) {
  return (
    <div>
      <div className="flex gap-2 mb-5">
        <input value={newEmail} onChange={(event) => setNewEmail(event.target.value)} placeholder="attendee@email.com" className="flex-1 px-4 py-3 rounded-xl border border-gray-200" />
        <button onClick={addEmail} className="px-4 py-3 rounded-xl bg-[#2563eb] text-white font-semibold flex items-center gap-2">
          <UserPlus size={18} /> Add
        </button>
      </div>
      <div className="divide-y divide-gray-100">
        {attendees.map((email) => (
          <div key={email} className="flex items-center justify-between py-3">
            <span className="font-medium text-gray-700">{email}</span>
            <button onClick={() => removeEmail(email)} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhotosTab({ gallery, selectedPhotos, setSelectedPhotos }) {
  const toggle = (id) =>
    setSelectedPhotos((prev) => (prev.includes(id) ? prev.filter((photoId) => photoId !== id) : [...prev, id]));

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-5">
        <button className="px-4 py-3 rounded-xl bg-[#2563eb] text-white font-semibold flex items-center gap-2">
          <Upload size={18} /> Upload Photos
        </button>
        <button className="px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold flex items-center gap-2">
          <Trash2 size={18} /> Delete Selected ({selectedPhotos.length})
        </button>
      </div>
      {gallery.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gallery.map((photo) => (
            <button key={photo.id} onClick={() => toggle(photo.id)} className={`relative aspect-[4/3] rounded-xl overflow-hidden border ${selectedPhotos.includes(photo.id) ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-100"}`}>
              <img src={photo.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center text-gray-400">No photos uploaded yet.</div>
      )}
    </div>
  );
}
