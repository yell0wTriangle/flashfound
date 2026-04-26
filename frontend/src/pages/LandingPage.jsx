import { ArrowRight, Camera, Images, ScanFace, ShieldCheck, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-white flex flex-col text-gray-900">
      <nav className="w-full border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#2563eb]">
            <Camera size={24} strokeWidth={2.5} />
            <span className="text-xl font-bold text-gray-900 tracking-tight">FlashFound</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How it works</a>
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/auth")} className="hidden sm:block text-sm font-medium text-gray-500 hover:text-gray-900">
              Log in
            </button>
            <button onClick={() => navigate("/auth")} className="px-4 py-2 bg-[#2563eb] text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <section className="pt-24 pb-20 px-6 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight mb-6">
          Find your event photos in <span className="text-[#2563eb]">seconds.</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          No more scrolling through endless albums. Verify your identity once, and let AI securely deliver every memory you appear in.
        </p>
        <button onClick={() => navigate("/auth")} className="px-8 py-4 bg-[#2563eb] text-white rounded-xl font-semibold hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 mx-auto">
          Create Free Account <ArrowRight size={18} />
        </button>

        <div className="mt-16 relative w-full max-w-3xl mx-auto">
          <div className="flex justify-center gap-4 items-center h-48 sm:h-64">
            <div className="w-1/3 h-36 sm:h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-md border border-gray-200 flex items-center justify-center opacity-80">
              <Images size={32} className="text-gray-300" />
            </div>
            <div className="w-2/5 h-48 sm:h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-xl z-10 -mt-6 border-4 border-white flex flex-col items-center justify-center relative overflow-hidden">
              <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 z-10">
                <Camera size={28} className="text-[#2563eb]" />
              </div>
              <div className="w-20 h-2.5 bg-blue-200/50 rounded-full mb-2 z-10" />
              <div className="w-12 h-2 bg-blue-200/50 rounded-full z-10" />
            </div>
            <div className="w-1/3 h-36 sm:h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-md border border-gray-200 flex items-center justify-center opacity-80">
              <Images size={32} className="text-gray-300" />
            </div>
          </div>
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl z-20 whitespace-nowrap">
            <ScanFace size={18} className="text-blue-400" />
            <span className="font-medium text-sm">Identity Verified - 12 Photos Found</span>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-24 bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-12 text-center">
          {[
            ["Secure Identity", "Take a one-time selfie during setup."],
            ["Smart Matching", "Find event photos without endless scrolling."],
            ["Private By Design", "Request access for private galleries."],
          ].map(([title, body]) => (
            <div key={title} className="flex flex-col items-center">
              <div className="w-14 h-14 bg-white text-[#2563eb] rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100">
                {title === "Smart Matching" ? <Zap size={24} /> : <ShieldCheck size={24} />}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
