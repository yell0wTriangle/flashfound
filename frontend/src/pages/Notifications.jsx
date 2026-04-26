import { Bell, Check, Eye, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEvent, notifications as initialNotifications } from "../data/demoData.js";

export default function Notifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState(initialNotifications);

  const markRead = (id) => setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
  const markAll = () => setItems((prev) => prev.map((item) => ({ ...item, read: true })));

  return (
    <div className="min-h-full bg-gray-50 p-6 lg:p-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-gray-500 mt-1">Event invites and private gallery access requests.</p>
        </div>
        <button onClick={markAll} className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 font-semibold text-gray-700">
          Mark all as read
        </button>
      </header>

      <div className="max-w-4xl space-y-3">
        {items.map((item) => {
          const event = getEvent(item.eventId);
          const route = `/events/${event?.id}/${event?.type.toLowerCase()}`;
          return (
            <article key={item.id} className={`rounded-2xl border p-5 shadow-sm ${item.read ? "bg-gray-100 border-gray-200 opacity-70" : "bg-white border-blue-100"}`}>
              <div className="flex gap-4">
                <div className="h-11 w-11 rounded-full bg-blue-50 text-[#2563eb] flex items-center justify-center shrink-0">
                  <Bell size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-gray-900">{item.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">{item.body}</p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {item.type === "added_to_event" ? (
                      <button onClick={() => { markRead(item.id); navigate(route); }} className="px-3 py-2 rounded-xl bg-[#2563eb] text-white text-sm font-semibold flex items-center gap-2">
                        <Eye size={15} /> View Event Gallery
                      </button>
                    ) : (
                      <>
                        <button onClick={() => markRead(item.id)} className="px-3 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold flex items-center gap-2">
                          <Check size={15} /> Approve
                        </button>
                        <button onClick={() => markRead(item.id)} className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-semibold flex items-center gap-2">
                          <X size={15} /> Deny
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
