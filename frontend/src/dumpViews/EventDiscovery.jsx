import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  Menu,
  Search,
  Calendar,
  MapPin,
  Lock,
  Globe,
  ChevronRight,
  Filter,
  Image as ImageIcon,
  Compass,
  Bell,
  User,
  CalendarPlus,
} from "lucide-react";
import { apiRequest } from "../lib/api.js";
import { supabase } from "../lib/supabase.js";

const NavBar = ({ activePage }) => {
  return (
    <nav className="hidden md:flex flex-col items-center py-6 bg-white border-r border-gray-200 w-20 h-full shrink-0 z-30">
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-[#2563eb] mb-8 cursor-pointer transition-transform hover:scale-105">
        <Camera size={26} strokeWidth={2.5} />
      </div>

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

function mapPrivacyFilter(activeFilter) {
  if (activeFilter === "Public") return "public";
  if (activeFilter === "Private") return "private";
  return "all";
}

function formatDate(input) {
  if (!input) return "";
  try {
    return new Date(input).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return input;
  }
}

const App = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const filters = ["All", "Public", "Private"];

  const loadEvents = useCallback(async ({ query, filter }) => {
    setLoading(true);
    setError("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setEvents([]);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      params.set("privacy", mapPrivacyFilter(filter));

      const data = await apiRequest(`/events/discovery?${params.toString()}`, {
        token: session.access_token,
      });
      setEvents(data?.events || []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadEvents({ query: searchQuery, filter: activeFilter });
    }, 220);
    return () => clearTimeout(timeout);
  }, [activeFilter, loadEvents, searchQuery]);

  const renderedEvents = useMemo(() => {
    return events.map((event) => ({
      ...event,
      typeLabel: event.type === "private" ? "Private" : "Public",
      eventDate: formatDate(event.date),
      imageUrl:
        event.image_url ||
        "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=600",
    }));
  }, [events]);

  const openEvent = (event) => {
    const typePath = event.type === "private" ? "private" : "public";
    navigate(`/events/${event.id}/${typePath}`, { state: { from: "/events" } });
  };

  return (
    <div className="h-screen w-full bg-gray-50 flex font-sans text-gray-900 overflow-hidden">
      <NavBar activePage="discover" />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50">
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shrink-0 z-20">
          <div className="flex items-center gap-2 text-[#2563eb]">
            <Camera size={24} strokeWidth={2.5} />
            <span className="text-xl font-bold text-gray-900 tracking-tight">
              FlashFound
            </span>
          </div>
          <button className="text-gray-500 hover:text-gray-900 transition-colors">
            <Menu size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="bg-white border-b border-gray-200 px-4 sm:px-8 py-8 sm:py-10">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-2">
                Discover Events
              </h1>
              <p className="text-gray-500 mb-8">
                Find your event, verify your identity, and get your photos
                instantly.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search events by name, organizer, or location..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                  <div className="hidden sm:flex items-center justify-center p-3.5 border border-gray-200 rounded-xl text-gray-500 bg-white shadow-sm shrink-0">
                    <Filter size={18} />
                  </div>
                  {filters.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-5 py-3.5 rounded-xl text-sm font-medium transition-all shrink-0 whitespace-nowrap ${
                        activeFilter === filter
                          ? "bg-gray-900 text-white shadow-md"
                          : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-8 max-w-6xl mx-auto pb-24">
            {error ? (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="py-16 text-center text-sm text-gray-500">Loading events...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderedEvents.map((event) => (
                  <div
                    key={event.id}
                    className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 flex flex-col cursor-pointer"
                    onClick={() => openEvent(event)}
                  >
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100">
                      <img
                        src={event.imageUrl}
                        alt={event.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent"></div>

                      <div className="absolute top-4 right-4">
                        {event.type === "private" ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 backdrop-blur-md text-white rounded-full text-xs font-medium border border-white/10">
                            <Lock size={12} />
                            Private
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-md text-gray-900 rounded-full text-xs font-semibold shadow-sm">
                            <Globe size={12} className="text-[#2563eb]" />
                            Public
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-[#2563eb] transition-colors">
                          {event.name}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                          By {event.organizer || "Unknown organizer"}
                        </p>

                        <div className="space-y-2 mb-6">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar
                              size={16}
                              className="text-gray-400 shrink-0"
                            />
                            <span>{event.eventDate}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin
                              size={16}
                              className="text-gray-400 shrink-0"
                            />
                            <span className="line-clamp-1">{event.location}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100 mt-auto">
                        <button className="w-full flex items-center justify-between text-sm font-semibold text-gray-900 group-hover:text-[#2563eb] transition-colors">
                          {event.typeLabel === "Private"
                            ? "View Private Gallery"
                            : "View Public Gallery"}
                          <ChevronRight
                            size={18}
                            className="text-gray-400 group-hover:text-[#2563eb] transition-colors group-hover:translate-x-1"
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && !renderedEvents.length ? (
              <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
                No events found for this filter.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
