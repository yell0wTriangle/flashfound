import { Calendar, Globe, Lock, MapPin, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { events } from "../data/demoData.js";

export default function EventDiscovery() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        const filterMatch = activeFilter === "All" || event.type === activeFilter;
        const query = searchQuery.toLowerCase();
        const queryMatch = [event.name, event.location, event.organizer].some((value) =>
          value.toLowerCase().includes(query),
        );
        return filterMatch && queryMatch;
      }),
    [activeFilter, searchQuery],
  );

  return (
    <div className="min-h-full bg-gray-50 p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Event Discovery</h1>
        <p className="text-gray-500 mt-1">Find galleries where your email was added as an attendee.</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-3.5 text-gray-400" />
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search by event, organiser, or location" className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100" />
        </div>
        <div className="flex gap-2">
          {["All", "Public", "Private"].map((filter) => (
            <button key={filter} onClick={() => setActiveFilter(filter)} className={`px-4 py-3 rounded-xl font-semibold border ${activeFilter === filter ? "bg-[#2563eb] text-white border-[#2563eb]" : "bg-white text-gray-600 border-gray-200"}`}>
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredEvents.map((event) => (
          <button
            key={event.id}
            onClick={() => navigate(`/events/${event.id}/${event.type.toLowerCase()}`)}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm text-left hover:-translate-y-1 hover:shadow-lg transition-all"
          >
            <div className="aspect-[16/10] relative">
              <img src={event.imageUrl} alt="" className="h-full w-full object-cover" />
              <span className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-white/95 text-sm font-bold flex items-center gap-1.5">
                {event.type === "Private" ? <Lock size={14} /> : <Globe size={14} />} {event.type}
              </span>
            </div>
            <div className="p-5">
              <h2 className="font-bold text-lg text-gray-900">{event.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{event.organizer}</p>
              <div className="mt-4 space-y-2 text-sm text-gray-500">
                <p className="flex items-center gap-2"><Calendar size={15} /> {event.date}</p>
                <p className="flex items-center gap-2"><MapPin size={15} /> {event.location}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
