import { Camera, LogOut, Save, ScanFace, Upload } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { currentUser } from "../data/demoData.js";

export default function ProfileAndSettings() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);

  return (
    <div className="min-h-full bg-gray-50 p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Profile And Settings</h1>
        <p className="text-gray-500 mt-1">Manage your display identity and source selfie.</p>
      </header>

      <div className="max-w-3xl bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <img src={currentUser.avatar} alt="" className="h-20 w-20 rounded-full object-cover" />
          <div>
            <h2 className="font-bold text-xl">{currentUser.name}</h2>
            <p className="text-gray-500">{currentUser.email}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-gray-700">Display name</span>
            <input defaultValue={currentUser.name} className="w-full px-4 py-3 rounded-xl border border-gray-200" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-gray-700">Registered email</span>
            <input value={currentUser.email} readOnly className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500" />
          </label>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          <button className="p-5 rounded-2xl border border-gray-100 bg-gray-50 text-left">
            <Upload className="text-[#2563eb] mb-3" />
            <h3 className="font-bold">Update display picture</h3>
            <p className="text-sm text-gray-500 mt-1">Dummy upload action.</p>
          </button>
          <button className="p-5 rounded-2xl border border-gray-100 bg-gray-50 text-left">
            <ScanFace className="text-[#2563eb] mb-3" />
            <h3 className="font-bold">Update verification selfie</h3>
            <p className="text-sm text-gray-500 mt-1">Uses the same future face validation flow.</p>
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-6">
          <button onClick={() => setSaved(true)} className="px-4 py-2.5 rounded-xl bg-[#2563eb] text-white font-semibold flex items-center gap-2">
            <Save size={18} /> {saved ? "Saved" : "Save Changes"}
          </button>
          <button onClick={() => navigate("/")} className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold flex items-center gap-2">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
