import { Bell, CalendarPlus, Camera, Compass, Image, User } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItemClass = ({ isActive }) =>
  `p-3 rounded-xl transition-all ${
    isActive
      ? "text-[#2563eb] bg-blue-50 shadow-sm border border-blue-100"
      : "text-gray-400 hover:text-[#2563eb] hover:bg-blue-50"
  }`;

export default function NavBar({ activePage }) {
  return (
    <nav className="hidden md:flex flex-col items-center py-6 bg-white border-r border-gray-200 w-20 shrink-0 z-30">
      <div
        className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-[#2563eb] mb-8 transition-transform hover:scale-105"
        title="FlashFound"
      >
        <Camera size={26} strokeWidth={2.5} />
      </div>

      <div className="flex flex-col gap-6 w-full items-center">
        <NavLink to="/my-photos" className={navItemClass} title="My Photos">
          <Image size={24} />
        </NavLink>
        <NavLink to="/events" className={navItemClass} title="Find Events">
          <Compass size={24} />
        </NavLink>
        <NavLink
          to="/organiser/dashboard"
          className={() =>
            `p-3 rounded-xl transition-all ${
              activePage === "manage-events"
                ? "text-[#2563eb] bg-blue-50 shadow-sm border border-blue-100"
                : "text-gray-400 hover:text-[#2563eb] hover:bg-blue-50"
            }`
          }
          title="Organizer Access"
        >
          <CalendarPlus size={24} />
        </NavLink>
      </div>

      <div className="mt-auto flex flex-col gap-4 w-full items-center">
        <NavLink to="/notifications" className={navItemClass} title="Notifications">
          <span className="relative block">
            <Bell size={24} />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
          </span>
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `p-3 rounded-xl transition-all ${
              isActive
                ? "text-[#2563eb] bg-blue-50 shadow-sm border border-blue-100"
                : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
            }`
          }
          title="Profile"
        >
          <User size={24} />
        </NavLink>
      </div>
    </nav>
  );
}
