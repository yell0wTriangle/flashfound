import { ArrowRight, Camera, CheckCircle2, ScanFace, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AccountSetupStep2() {
  const navigate = useNavigate();
  const [verified, setVerified] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2 text-[#2563eb]">
          <Camera size={24} strokeWidth={2.5} />
          <span className="text-xl font-bold text-gray-900">FlashFound</span>
        </div>
        <span className="text-sm font-medium text-gray-400">Identity setup</span>
      </nav>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-sm mb-6">
              <ShieldCheck size={16} /> Source-of-truth selfie
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">Verify your face once.</h1>
            <p className="text-gray-600 text-lg max-w-xl">
              This dummy step represents the future faceapi or MediaPipe validation flow. Click scan to unlock the app routing demo.
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xl shadow-gray-200/60">
            <div className="aspect-[4/5] rounded-2xl bg-gray-950 overflow-hidden relative flex items-center justify-center">
              <div className="absolute inset-6 border-2 border-dashed border-blue-300/60 rounded-[40%]" />
              <ScanFace size={96} className={verified ? "text-green-400" : "text-blue-300"} />
              {verified && (
                <div className="absolute bottom-5 left-5 right-5 bg-white rounded-2xl p-4 flex items-center gap-3 shadow-lg">
                  <CheckCircle2 className="text-green-500" />
                  <span className="font-semibold text-gray-900">Face validated</span>
                </div>
              )}
            </div>
            <button
              onClick={() => (verified ? navigate("/my-photos") : setVerified(true))}
              className="mt-5 w-full py-3.5 bg-[#2563eb] text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              {verified ? "Enter My Photos" : "Run Dummy Face Scan"} <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
