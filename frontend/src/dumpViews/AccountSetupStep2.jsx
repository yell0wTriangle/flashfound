import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  ShieldCheck,
  CheckCircle2,
  Info,
  Lock,
  ArrowRight,
  ScanFace,
  X,
  Focus,
  RefreshCcw,
  AlertCircle,
} from "lucide-react";

const App = () => {
  // Steps: 'intro' | 'camera' | 'analyzing' | 'success'
  const [step, setStep] = useState("intro");
  const [progress, setProgress] = useState(0);
  const [image, setImage] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false); // Mock validation state

  // Simulate face detection logic when camera is open
  useEffect(() => {
    let detectionInterval;
    if (step === "camera") {
      detectionInterval = setInterval(() => {
        // Randomly toggle detection for demo purposes
        setFaceDetected(Math.random() > 0.3);
      }, 2000);
    } else {
      setFaceDetected(false);
    }
    return () => clearInterval(detectionInterval);
  }, [step]);

  // Simulate the embedding generation process
  useEffect(() => {
    let interval;
    if (step === "analyzing") {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setStep("success"), 400);
            return 100;
          }
          return prev + 2;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [step]);

  const handleCapture = () => {
    if (!faceDetected) return; // Prevent capture if validation fails
    // Mock captured image
    setImage(
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
    );
    setStep("analyzing");
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col font-sans text-gray-900">
      {/* Minimal Onboarding Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shrink-0 z-20">
        <div className="flex items-center gap-2 text-[#2563eb]">
          <Camera size={24} strokeWidth={2.5} />
          <span className="text-xl font-bold text-gray-900 tracking-tight">
            FlashFound
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
          <span>Step 2 of 2</span>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-6 pb-12">
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
          {/* Left Column: Education & Trust */}
          <div className="flex flex-col gap-6 md:pr-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold w-fit">
              <ShieldCheck size={16} />
              Identity Verification
            </div>

            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 leading-tight">
              Create your secure <br className="hidden md:block" /> FlashFound
              Identity.
            </h1>

            <p className="text-lg text-gray-600">
              Establishing your identity requires a <strong>Live Selfie</strong>
              . This ensures your profile is authentic and secure.
            </p>

            <div className="space-y-4 mt-4">
              <div className="flex gap-4">
                <div className="mt-1 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Lock size={16} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Strict Liveness Check
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    We don't allow gallery uploads for identity setup to prevent
                    spoofing and ensure high-quality AI matching.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1 w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                  <ScanFace size={16} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    One Face Policy
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Our system validates that only you are in the frame,
                    creating a unique "Source of Truth" vector.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Camera / Interaction Card */}
          <div className="w-full bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden relative min-h-[500px] flex flex-col">
            {/* STEP 1: INTRO TO CAMERA */}
            {step === "intro" && (
              <div className="p-8 md:p-10 flex flex-col items-center text-center flex-1 justify-center">
                <div className="w-20 h-20 bg-blue-50 text-[#2563eb] rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                  <ScanFace size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Ready for your selfie?
                </h3>
                <p className="text-sm text-gray-500 max-w-[280px] mb-8">
                  Find a well-lit area and ensure you are the only person in the
                  frame.
                </p>

                <button
                  onClick={() => setStep("camera")}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-900 text-white rounded-2xl font-semibold hover:bg-black active:scale-[0.98] transition-all shadow-lg"
                >
                  <Camera size={20} />
                  Open Camera
                </button>

                <div className="mt-8 flex items-start gap-2 text-left bg-blue-50/50 p-4 rounded-xl w-full">
                  <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Identity setup is a one-time process. This photo will be
                    used to unlock your private photos at all future events.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 2: ACTIVE CAMERA FEED */}
            {step === "camera" && (
              <div className="flex-1 flex flex-col bg-gray-900 relative">
                <div className="relative flex-1 w-full overflow-hidden flex items-center justify-center bg-gray-800">
                  {/* Simulated Camera Feed */}
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600"
                    alt="Camera feed"
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                  />

                  {/* Validation Overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                    <div
                      className={`w-64 h-80 border-2 rounded-[60px] transition-colors duration-500 flex items-center justify-center ${faceDetected ? "border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.4)]" : "border-white/30"}`}
                    >
                      {!faceDetected && (
                        <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 text-white text-xs font-medium border border-white/10">
                          <AlertCircle size={14} className="text-yellow-400" />
                          Position face in frame
                        </div>
                      )}
                      {faceDetected && (
                        <div className="bg-green-500/80 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 text-white text-xs font-bold animate-pulse">
                          <CheckCircle2 size={14} />
                          Ready to capture
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Bar */}
                  <div className="absolute top-4 left-0 right-0 flex justify-center">
                    <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[10px] text-white font-bold uppercase tracking-widest flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${faceDetected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                      ></div>
                      {faceDetected ? "1 Face Detected" : "Scanning..."}
                    </div>
                  </div>
                </div>

                {/* Camera Controls */}
                <div className="p-8 bg-white flex items-center justify-between">
                  <button
                    onClick={() => setStep("intro")}
                    className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>

                  <button
                    onClick={handleCapture}
                    disabled={!faceDetected}
                    className={`w-20 h-20 rounded-full border-4 p-1 transition-all active:scale-90 ${faceDetected ? "border-blue-600 cursor-pointer" : "border-gray-200 cursor-not-allowed opacity-50"}`}
                  >
                    <div
                      className={`w-full h-full rounded-full transition-colors ${faceDetected ? "bg-blue-600" : "bg-gray-100"}`}
                    ></div>
                  </button>

                  <button className="p-3 text-gray-400 hover:text-gray-600">
                    <RefreshCcw size={24} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: ANALYZING / VECTORIZING */}
            {step === "analyzing" && (
              <div className="p-8 md:p-10 flex flex-col items-center text-center min-h-[440px] justify-center flex-1">
                <div className="relative mb-8">
                  <div className="absolute -inset-4 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg relative z-10">
                    <img
                      src={image}
                      alt="Processing"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-400/30 to-transparent animate-[scan_2s_ease-in-out_infinite]"></div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Validating Selfie
                </h3>
                <p className="text-sm text-gray-500 mb-8">
                  Ensuring identity integrity...
                </p>
                <div className="w-full max-w-[240px]">
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-75 ease-linear"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: SUCCESS */}
            {step === "success" && (
              <div className="p-8 md:p-10 flex flex-col items-center text-center min-h-[440px] justify-center flex-1">
                <div className="relative mb-6">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg relative z-10">
                    <img
                      src={image}
                      alt="Verified"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-2 rounded-full border-4 border-white shadow-md z-20">
                    <CheckCircle2 size={24} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Identity Verified!
                </h3>
                <p className="text-sm text-gray-500 mb-8 max-w-[280px]">
                  Your Source of Truth is set. You can now securely access event
                  galleries.
                </p>
                <button className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gray-900 text-white rounded-xl font-semibold hover:bg-black active:scale-[0.98] transition-all shadow-md">
                  Go to My Photos <ArrowRight size={18} />
                </button>
              </div>
            )}

            <style
              dangerouslySetInnerHTML={{
                __html: `@keyframes scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }`,
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
