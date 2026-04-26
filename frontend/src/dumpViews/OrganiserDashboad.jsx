import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  Menu,
  Search,
  Calendar,
  MapPin,
  Lock,
  Globe,
  Image as ImageIcon,
  Compass,
  Bell,
  User,
  CalendarPlus,
  Plus,
  Users,
  Images,
  MoreVertical,
  Settings,
} from "lucide-react";
import { apiRequest } from "../lib/api.js";
import { supabase } from "../lib/supabase.js";

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
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [managedEvents, setManagedEvents] = useState([]);
  const [totals, setTotals] = useState({ events: 0, photos: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          setManagedEvents([]);
          setTotals({ events: 0, photos: 0 });
          return;
        }

        const data = await apiRequest("/organiser/dashboard", {
          token: session.access_token,
        });
        if (cancelled) return;
        const mappedEvents = (data?.events || []).map((event, index) => ({
          id: event.id,
          name: event.name || "Untitled Event",
          company: event.organizing_company || event.organiser_name || "Organizer",
          date: event.date || "",
          location: event.location || "",
          type: event.type === "private" ? "Private" : "Public",
          status: event.status ? `${event.status[0].toUpperCase()}${event.status.slice(1)}` : "Draft",
          attendeesCount: 0,
          photosCount: event.photos_count || 0,
          imageUrl:
            event.image_url ||
            `https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=${620 + (index % 4) * 60}`,
        }));
        setManagedEvents(mappedEvents);
        setTotals({
          events: data?.totals?.events || mappedEvents.length,
          photos: data?.totals?.photos || mappedEvents.reduce((sum, event) => sum + event.photosCount, 0),
        });
      } catch (requestError) {
        if (cancelled) return;
        const message = requestError instanceof Error ? requestError.message : String(requestError);
        if (message.toLowerCase().includes("organiser access required")) {
          navigate("/organiser/request", { replace: true });
          return;
        }
        setError(message);
        setManagedEvents([]);
        setTotals({ events: 0, photos: 0 });
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
  }, []);

  const filteredEvents = useMemo(
    () =>
      managedEvents.filter((event) =>
        event.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [managedEvents, searchQuery],
  );

  return (
    <div className="h-screen w-full bg-gray-50 flex font-sans text-gray-900 overflow-hidden">
      {/* Universal Left Navbar */}
      <NavBar activePage="manage-events" />

      {/* Main App Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50">
        {/* Mobile Top Navbar */}
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

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Dashboard Header */}
          <div className="bg-white border-b border-gray-200 px-4 sm:px-8 py-8">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-2">
                  Organizer Dashboard
                </h1>
                <p className="text-gray-500">
                  Manage your events, attendees, and photo galleries.
                </p>
              </div>

              {/* Dummy Add Event Button */}
              <button
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[#2563eb] text-white rounded-xl font-semibold shadow-md hover:bg-blue-700 hover:shadow-lg active:scale-95 transition-all w-full sm:w-auto"
                onClick={() => navigate("/organiser/events/new")}
              >
                <Plus size={20} />
                Create Event
              </button>
            </div>
          </div>

          {/* Quick Stats & Search */}
          <div className="p-4 sm:px-8 pt-8 pb-4 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
              {/* Quick Summary Cards */}
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="bg-white border border-gray-200 px-5 py-3 rounded-xl flex items-center gap-4 flex-1 md:flex-none shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-[#2563eb] flex items-center justify-center">
                    <CalendarPlus size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Events
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      {totals.events}
                    </p>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 px-5 py-3 rounded-xl flex items-center gap-4 flex-1 md:flex-none shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                    <Images size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Photos
                    </p>
                    <p className="text-xl font-bold text-gray-900">{totals.photos}</p>
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="relative w-full md:w-80 shrink-0">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search managed events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Events Grid */}
            {error ? (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="py-16 text-center text-sm text-gray-500">Loading organiser dashboard...</div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col relative"
                >
                  {/* Status Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <span
                      className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full backdrop-blur-md border ${
                        event.status === "Completed"
                          ? "bg-green-500/90 text-white border-green-400"
                          : event.status === "Draft"
                            ? "bg-gray-800/80 text-white border-gray-600"
                            : "bg-blue-500/90 text-white border-blue-400"
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>

                  {/* Settings Dropdown Placeholder */}
                  <div className="absolute top-4 right-4 z-10">
                    <button className="w-8 h-8 flex items-center justify-center bg-black/40 hover:bg-black/60 backdrop-blur-md text-white rounded-full transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </div>

                  {/* Event Thumbnail */}
                  <div className="relative aspect-[16/9] w-full bg-gray-100">
                    <img
                      src={event.imageUrl}
                      alt={event.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent"></div>

                    <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/50 backdrop-blur-md text-white rounded-md text-[10px] font-medium border border-white/10">
                      {event.type === "Private" ? (
                        <Lock size={12} />
                      ) : (
                        <Globe size={12} />
                      )}
                      {event.type}
                    </div>
                  </div>

                  {/* Event Info */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                        {event.name}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium">
                        Hosted by {event.company}
                      </p>
                    </div>

                    <div className="space-y-2.5 mb-6">
                      <div className="flex items-center gap-2.5 text-sm text-gray-600">
                        <Calendar
                          size={16}
                          className="text-[#2563eb] shrink-0"
                        />
                        <span className="font-medium">{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-sm text-gray-600">
                        <MapPin size={16} className="text-[#2563eb] shrink-0" />
                        <span className="line-clamp-1 font-medium">
                          {event.location}
                        </span>
                      </div>
                    </div>

                    {/* Management Action Buttons */}
                    <div className="mt-auto grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                      <button className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg hover:bg-blue-50 text-gray-600 hover:text-blue-700 transition-colors border border-transparent hover:border-blue-100">
                        <Users size={18} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {event.attendeesCount} Invites
                        </span>
                      </button>
                      <button className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg hover:bg-blue-50 text-gray-600 hover:text-blue-700 transition-colors border border-transparent hover:border-blue-100">
                        <Images size={18} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {event.photosCount} Photos
                        </span>
                      </button>
                    </div>

                    {/* Primary Action */}
                    <button
                      onClick={() => navigate(`/organiser/events/${event.id}/edit`)}
                      className="w-full mt-3 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <Settings size={16} /> Manage Event
                    </button>
                  </div>
                </div>
              ))}

              {filteredEvents.length === 0 && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-dashed border-gray-300">
                  <CalendarPlus size={48} className="text-gray-300 mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    No events found
                  </h3>
                  <p className="text-gray-500 max-w-sm">
                    You haven't created any events matching this search, or your
                    dashboard is empty.
                  </p>
                </div>
              )}
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
