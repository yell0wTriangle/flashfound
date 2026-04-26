import { Calendar, Images, MapPin, Plus, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { events, photos } from "../data/demoData.js";

export default function OrganiserDashboard() {
  const navigate = useNavigate();
  const totalPhotos = photos.length;

  return (
    <div className="min-h-full bg-gray-50 p-6 lg:p-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organiser Dashboard</h1>
          <p className="text-gray-500 mt-1">Create events, manage attendees, and upload galleries.</p>
        </div>
        <button onClick={() => navigate("/organiser/events/new")} className="px-4 py-2.5 rounded-xl bg-[#2563eb] text-white font-semibold flex items-center gap-2">
          <Plus size={18} /> Create Event
        </button>
      </header>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Metric label="Total Events" value={events.length} icon={<Calendar size={21} />} />
        <Metric label="Total Photos" value={totalPhotos} icon={<Images size={21} />} />
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {events.map((event) => {
          const eventPhotoCount = photos.filter((photo) => photo.eventId === event.id).length;
          return (
            <article key={event.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <img src={event.imageUrl} alt="" className="aspect-[16/9] w-full object-cover" />
              <div className="p-5">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h2 className="font-bold text-lg truncate">{event.name}</h2>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">{event.status}</span>
                </div>
                <p className="text-sm text-gray-500">{event.company}</p>
                <div className="mt-4 space-y-2 text-sm text-gray-500">
                  <p className="flex items-center gap-2"><MapPin size={15} /> {event.location}</p>
                  <p className="flex items-center gap-2"><Users size={15} /> {event.attendeesCount} attendees - {eventPhotoCount} photos</p>
                </div>
                <button onClick={() => navigate(`/organiser/events/${event.id}/edit`)} className="mt-5 w-full py-2.5 rounded-xl bg-gray-900 text-white font-semibold">
                  Manage Event
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ label, value, icon }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
      <div className="h-12 w-12 rounded-2xl bg-blue-50 text-[#2563eb] flex items-center justify-center">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}
