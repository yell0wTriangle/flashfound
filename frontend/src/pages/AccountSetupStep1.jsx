import { ArrowRight, Camera, Lock, ShieldCheck, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AccountSetupStep1() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col text-gray-900">
      <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shrink-0 z-20">
        <div className="flex items-center gap-2 text-[#2563eb]">
          <Camera size={24} strokeWidth={2.5} />
          <span className="text-xl font-bold text-gray-900 tracking-tight">FlashFound</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
          <Lock size={14} />
          <span>Secure Gateway</span>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-6 pb-12">
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
          <div className="flex flex-col gap-6 md:pr-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold w-fit">
              <Zap size={16} /> AI-Powered Memory Access
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 leading-tight">
              Welcome to the future of event galleries.
            </h1>
            <p className="text-lg text-gray-600">
              Sign in to access your photos or create a new account to establish your secure identity.
            </p>
            <div className="space-y-4 mt-4">
              <Feature icon={<Camera size={16} />} title="Instant Photo Delivery" body="Log in to see matched photos from your recent events." />
              <Feature icon={<ShieldCheck size={16} />} title="Privacy-First Identity" body="Your source selfie unlocks your own moments." />
            </div>
          </div>

          <div className="w-full bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden p-8 md:p-10 flex flex-col">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Get Started</h2>
              <p className="text-gray-500 mt-2 text-sm">Dummy auth routes to selfie setup.</p>
            </div>
            <div className="space-y-3">
              <input className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100" placeholder="Email address" defaultValue="aarav@flashfound.demo" />
              <button onClick={() => navigate("/setup/selfie")} className="w-full py-3.5 bg-[#2563eb] text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                Continue <ArrowRight size={18} />
              </button>
              <button onClick={() => navigate("/setup/selfie")} className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-semibold hover:bg-black transition-colors">
                Continue with Google
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Feature({ icon, title, body }) {
  return (
    <div className="flex gap-4">
      <div className="mt-1 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <p className="text-sm text-gray-500 mt-1">{body}</p>
      </div>
    </div>
  );
}
