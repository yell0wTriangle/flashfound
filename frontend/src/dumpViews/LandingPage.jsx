import React from "react";
import {
  Camera,
  ShieldCheck,
  Zap,
  ArrowRight,
  ScanFace,
  Images,
  Lock,
} from "lucide-react";

const App = () => {
  return (
    <div className="min-h-screen w-full bg-white flex flex-col font-sans text-gray-900">
      {/* Minimal Navbar */}
      <nav className="w-full border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#2563eb]">
            <Camera size={24} strokeWidth={2.5} />
            <span className="text-xl font-bold text-gray-900 tracking-tight">
              FlashFound
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <a
              href="#how-it-works"
              className="hover:text-gray-900 transition-colors"
            >
              How it works
            </a>
            <a
              href="#features"
              className="hover:text-gray-900 transition-colors"
            >
              Features
            </a>
          </div>

          <div className="flex items-center gap-4">
            <button className="hidden sm:block text-sm font-medium text-gray-500 hover:text-gray-900">
              Log in
            </button>
            <button className="px-4 py-2 bg-[#2563eb] text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Centered Hero Section */}
      <section className="pt-24 pb-20 px-6 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight mb-6">
          Find your event photos in{" "}
          <span className="text-[#2563eb]">seconds.</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          No more scrolling through endless albums. Verify your identity once,
          and let AI securely deliver every memory you appear in.
        </p>

        <button className="px-8 py-4 bg-[#2563eb] text-white rounded-xl font-semibold hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 mx-auto">
          Create Free Account
          <ArrowRight size={18} />
        </button>

        {/* Simplified Hero Visual - Abstract UI Mockup */}
        <div className="mt-16 relative w-full max-w-3xl mx-auto">
          <div className="flex justify-center gap-4 items-center h-48 sm:h-64">
            <div className="w-1/3 h-36 sm:h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-md border border-gray-200 flex items-center justify-center opacity-80">
              <Images size={32} className="text-gray-300" />
            </div>

            <div className="w-2/5 h-48 sm:h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-xl z-10 -mt-6 border-4 border-white flex flex-col items-center justify-center relative overflow-hidden">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 z-10">
                <Camera size={28} className="text-[#2563eb]" />
              </div>
              <div className="w-20 h-2.5 bg-blue-200/50 rounded-full mb-2 z-10"></div>
              <div className="w-12 h-2 bg-blue-200/50 rounded-full z-10"></div>
            </div>

            <div className="w-1/3 h-36 sm:h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-md border border-gray-200 flex items-center justify-center opacity-80">
              <Images size={32} className="text-gray-300" />
            </div>
          </div>

          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl z-20 whitespace-nowrap">
            <ScanFace size={18} className="text-blue-400" />
            <span className="font-medium text-sm">
              Identity Verified • 12 Photos Found
            </span>
          </div>
        </div>
      </section>

      {/* Streamlined "How it Works" */}
      <section
        id="how-it-works"
        className="py-24 bg-gray-50 border-y border-gray-100"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-white text-[#2563eb] rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                1. Secure Identity
              </h3>
              <p className="text-sm text-gray-500">
                Take a one-time live selfie during setup. This becomes your
                secure "Source of Truth".
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-white text-[#2563eb] rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100">
                <ScanFace size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                2. Smart Matching
              </h3>
              <p className="text-sm text-gray-500">
                Our AI automatically scans event galleries against your verified
                identity.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-white text-[#2563eb] rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100">
                <Zap size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                3. Instant Delivery
              </h3>
              <p className="text-sm text-gray-500">
                Skip the scrolling. Instantly access a personalized gallery of
                just your photos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Clean Feature Blocks */}
      <section
        id="features"
        className="py-24 max-w-5xl mx-auto px-6 flex flex-col gap-24"
      >
        {/* Privacy Block */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="bg-gray-900 rounded-3xl p-10 text-white shadow-xl">
            <Lock size={40} className="text-blue-400 mb-6" strokeWidth={1.5} />
            <h3 className="text-2xl font-bold mb-4">Total Privacy Control.</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your face is your key, not a searchable public database. Private
              event photos are securely locked to your verified identity,
              ensuring absolute security and peace of mind.
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Designed to protect your memories.
            </h2>
            <p className="text-gray-500 mb-6">
              FlashFound converts photos into anonymous mathematical vectors.
              Your actual source photo is never exposed to organizers or other
              attendees.
            </p>
            <ul className="space-y-3 text-sm font-medium text-gray-700">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> No
                public face search
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>{" "}
                Encrypted vector storage
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>{" "}
                Strict liveness verification
              </li>
            </ul>
          </div>
        </div>

        {/* Organizer Block */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Powerful tools for event organizers.
            </h2>
            <p className="text-gray-500 mb-6">
              Host events your way. Upload photos in bulk, let AI process the
              faces, and instantly share galleries with your attendees.
            </p>
            <ul className="space-y-3 text-sm font-medium text-gray-700">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>{" "}
                Fast drag-and-drop uploads
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>{" "}
                Toggle Public/Private event modes
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>{" "}
                Automated attendee delivery
              </li>
            </ul>
          </div>
          <div className="order-1 md:order-2 bg-blue-50 border border-blue-100 rounded-3xl p-10 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
            <Images size={40} className="text-[#2563eb] mb-4" />
            <h3 className="font-bold text-gray-900">Media Manager</h3>
            <p className="text-sm text-gray-500 mt-2 max-w-[200px]">
              Drag and drop your event folders to process vectors automatically.
            </p>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="bg-gray-50 border-t border-gray-100 pt-16 pb-8">
        <div className="max-w-4xl mx-auto px-6 text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Ready to find your photos?
          </h2>
          <button className="px-8 py-3.5 bg-gray-900 text-white rounded-xl font-semibold hover:bg-black transition-all shadow-md">
            Create Your Identity
          </button>
        </div>

        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-gray-200 pt-8">
          <div className="flex items-center gap-2 text-[#2563eb]">
            <Camera size={18} strokeWidth={2.5} />
            <span className="font-bold text-gray-900">FlashFound</span>
          </div>
          <div className="text-xs text-gray-400 flex gap-4">
            <a href="#" className="hover:text-gray-600">
              Terms
            </a>
            <a href="#" className="hover:text-gray-600">
              Privacy
            </a>
            <span>© 2026 FlashFound</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
