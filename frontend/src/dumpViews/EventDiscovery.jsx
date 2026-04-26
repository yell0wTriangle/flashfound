import React, { useState } from "react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const filters = ["All", "Public", "Private"];

  // Dummy data for events
  const events = [
    {
      id: 1,
      name: "TechNova Summit '26",
      date: "Oct 12, 2026",
      location: "San Francisco, CA",
      organizer: "TechNova Inc.",
      type: "Private",
      imageUrl:
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=600",
    },
    {
      id: 2,
      name: "Neon Nights Music Festival",
      date: "Nov 05, 2026",
      location: "Austin, TX",
      organizer: "LiveNation",
      type: "Public",
      imageUrl:
        "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=600",
    },
    {
      id: 3,
      name: "Global Founders Conference",
      date: "Nov 18, 2026",
      location: "London, UK",
      organizer: "StartupGrind",
      type: "Private",
      imageUrl:
        "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=600",
    },
    {
      id: 4,
      name: "City Marathon 2026",
      date: "Dec 02, 2026",
      location: "New York, NY",
      organizer: "NYRR",
      type: "Public",
      imageUrl:
        "https://images.unsplash.com/photo-1530143311094-34d807799e8f?auto=format&fit=crop&q=80&w=600",
    },
    {
      id: 5,
      name: "Design Leadership Retreat",
      date: "Dec 10, 2026",
      location: "Palm Springs, CA",
      organizer: "AIGA",
      type: "Private",
      imageUrl:
        "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=600",
    },
    {
      id: 6,
      name: "Winter Charity Gala",
      date: "Dec 20, 2026",
      location: "Chicago, IL",
      organizer: "Hope Foundation",
      type: "Private",
      imageUrl:
        "https://images.unsplash.com/photo-1519671482749-fd098f392a56?auto=format&fit=crop&q=80&w=600",
    },
  ];

  return (
    <div className="h-screen w-full bg-gray-50 flex font-sans text-gray-900 overflow-hidden">
      {/* Universal Left Navbar (Desktop) */}
      <NavBar activePage="discover" />

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
        <div className="flex-1 overflow-y-auto">
          {/* Page Header & Search Bar */}
          <div className="bg-white border-b border-gray-200 px-4 sm:px-8 py-8 sm:py-10">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-2">
                Discover Events
              </h1>
              <p className="text-gray-500 mb-8">
                Find your event, verify your identity, and get your photos
                instantly.
              </p>

              {/* Search and Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search events by name, organizer, or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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

          {/* Events Grid Area */}
          <div className="p-4 sm:p-8 max-w-6xl mx-auto pb-24">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 flex flex-col cursor-pointer"
                >
                  {/* Event Image & Badge */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100">
                    <img
                      src={event.imageUrl}
                      alt={event.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent"></div>

                    {/* Privacy Badge */}
                    <div className="absolute top-4 right-4">
                      {event.type === "Private" ? (
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

                  {/* Event Details */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-[#2563eb] transition-colors">
                        {event.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        By {event.organizer}
                      </p>

                      <div className="space-y-2 mb-6">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar
                            size={16}
                            className="text-gray-400 shrink-0"
                          />
                          <span>{event.date}</span>
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
                        {event.type === "Private"
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
