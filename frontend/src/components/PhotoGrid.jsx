import { Check, Download, MoreHorizontal, Plus } from "lucide-react";
import { getPerson } from "../data/demoData.js";

export default function PhotoGrid({
  photos,
  selectedIds = [],
  onToggle,
  selectMode = false,
  action = "download",
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {photos.map((photo) => {
        const selected = selectedIds.includes(photo.id);
        const visiblePeople = photo.people.slice(0, 3).map(getPerson).filter(Boolean);
        const overflow = Math.max(photo.people.length - visiblePeople.length, 0);

        return (
          <button
            key={photo.id}
            onClick={() => selectMode && onToggle?.(photo.id)}
            className={`group relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-100 text-left shadow-sm border ${
              selected ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-100"
            }`}
          >
            <img src={photo.url} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            {selectMode && (
              <span
                className={`absolute top-3 right-3 h-7 w-7 rounded-full border-2 flex items-center justify-center ${
                  selected ? "bg-blue-600 border-blue-600 text-white" : "bg-white/80 border-white text-transparent"
                }`}
              >
                <Check size={16} />
              </span>
            )}

            <div className="absolute left-3 right-3 bottom-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex -space-x-2">
                {visiblePeople.map((person) => (
                  <img
                    key={person.id}
                    src={person.avatar}
                    alt={person.name}
                    title={person.name}
                    className="h-8 w-8 rounded-full border-2 border-white object-cover"
                  />
                ))}
                {overflow > 0 && (
                  <span className="h-8 w-8 rounded-full border-2 border-white bg-gray-900 text-white flex items-center justify-center">
                    <MoreHorizontal size={15} />
                  </span>
                )}
              </div>
              <span className="h-9 w-9 rounded-full bg-white text-gray-900 flex items-center justify-center shadow-lg">
                {action === "add" ? <Plus size={17} /> : <Download size={17} />}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
