import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  ShieldCheck,
  CheckCircle2,
  Info,
  Lock,
  ArrowRight,
  ScanFace,
  X,
  RefreshCcw,
  AlertCircle,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api.js";
import { supabase } from "../lib/supabase.js";

const selfieBucket = import.meta.env.VITE_SUPABASE_SELFIE_BUCKET || "verification-selfies";
const mediapipeWasmBaseUrl =
  import.meta.env.VITE_MEDIAPIPE_WASM_BASE_URL ||
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm";
const mediapipeModelUrl =
  import.meta.env.VITE_MEDIAPIPE_FACE_DETECTOR_MODEL_URL ||
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";
const minFaceRatio = Number(import.meta.env.VITE_MIN_SELFIE_FACE_RATIO || 0.06);

function sanitizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function failureMessage(failureCode) {
  switch (failureCode) {
    case "NO_FACE_DETECTED":
      return "No face detected. Please retake in better light.";
    case "MULTIPLE_FACES_DETECTED":
      return "Only one face is allowed in the frame.";
    case "FACE_TOO_SMALL":
      return "Move closer to the camera and retake.";
    case "LOW_FACE_CONFIDENCE":
      return "Face confidence was low. Try a sharper image.";
    case "IMAGE_FETCH_FAILED":
      return "Could not read uploaded selfie URL.";
    case "IMAGE_TOO_LARGE":
      return "Image is too large. Use a smaller selfie file.";
    case "INVALID_IMAGE_CONTENT_TYPE":
      return "Unsupported selfie format. Use JPG or PNG.";
    case "MEDIAPIPE_DETECTOR_FAILED":
      return "Face detection failed. Please retake and retry.";
    default:
      return "Verification failed. Please retry.";
  }
}

function detectionFeedback(status) {
  switch (status) {
    case "ready":
      return {
        banner: "Ready to capture",
        statusText: "1 Face Detected",
        borderClass: "border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.4)]",
        dotClass: "bg-green-500 animate-pulse",
        chipClass: "bg-green-500/80",
      };
    case "multiple":
      return {
        banner: "Multiple faces detected",
        statusText: "Multiple Faces",
        borderClass: "border-yellow-300 shadow-[0_0_16px_rgba(251,191,36,0.35)]",
        dotClass: "bg-yellow-400",
        chipClass: "bg-yellow-500/85",
      };
    case "too_small":
      return {
        banner: "Move closer to camera",
        statusText: "Face Too Small",
        borderClass: "border-yellow-300 shadow-[0_0_16px_rgba(251,191,36,0.35)]",
        dotClass: "bg-yellow-400",
        chipClass: "bg-yellow-500/85",
      };
    case "off_center":
      return {
        banner: "Center your face in frame",
        statusText: "Adjust Position",
        borderClass: "border-yellow-300 shadow-[0_0_16px_rgba(251,191,36,0.35)]",
        dotClass: "bg-yellow-400",
        chipClass: "bg-yellow-500/85",
      };
    case "camera_loading":
      return {
        banner: "Starting camera...",
        statusText: "Camera Loading",
        borderClass: "border-blue-200",
        dotClass: "bg-blue-300 animate-pulse",
        chipClass: "bg-blue-500/80",
      };
    case "camera_error":
      return {
        banner: "Camera access blocked",
        statusText: "Camera Error",
        borderClass: "border-red-300 shadow-[0_0_16px_rgba(248,113,113,0.35)]",
        dotClass: "bg-red-500",
        chipClass: "bg-red-500/85",
      };
    case "detector_loading":
      return {
        banner: "Loading face detector...",
        statusText: "Initializing AI",
        borderClass: "border-blue-200",
        dotClass: "bg-blue-300 animate-pulse",
        chipClass: "bg-blue-500/80",
      };
    case "detector_error":
      return {
        banner: "Face detector unavailable",
        statusText: "Detector Error",
        borderClass: "border-red-300 shadow-[0_0_16px_rgba(248,113,113,0.35)]",
        dotClass: "bg-red-500",
        chipClass: "bg-red-500/85",
      };
    default:
      return {
        banner: "Position face in frame",
        statusText: "Scanning...",
        borderClass: "border-white/30",
        dotClass: "bg-red-500",
        chipClass: "bg-black/45",
      };
  }
}

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isUpdateMode = new URLSearchParams(location.search).get("mode") === "update";
  const [step, setStep] = useState("intro");
  const [progress, setProgress] = useState(0);
  const [image, setImage] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [verificationError, setVerificationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState("no_face");

  const videoRef = useRef(null);
  const captureCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const detectorRef = useRef(null);
  const detectorPromiseRef = useRef(null);

  const feedback = detectionFeedback(detectionStatus);
  const canCapture = detectionStatus === "ready" && !isSubmitting;

  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const ensureDetector = useCallback(async () => {
    if (detectorRef.current) {
      return detectorRef.current;
    }
    if (detectorPromiseRef.current) {
      return detectorPromiseRef.current;
    }

    detectorPromiseRef.current = (async () => {
      const { FilesetResolver, FaceDetector } = await import("@mediapipe/tasks-vision");
      const vision = await FilesetResolver.forVisionTasks(mediapipeWasmBaseUrl);
      const detector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: mediapipeModelUrl,
        },
        runningMode: "VIDEO",
        minDetectionConfidence: 0.6,
      });
      detectorRef.current = detector;
      return detector;
    })();

    return detectorPromiseRef.current;
  }, []);

  const evaluateDetection = useCallback((detections, videoWidth, videoHeight) => {
    if (!Array.isArray(detections) || detections.length === 0) {
      setDetectionStatus("no_face");
      return;
    }

    if (detections.length > 1) {
      setDetectionStatus("multiple");
      return;
    }

    const box = detections[0]?.boundingBox;
    if (!box) {
      setDetectionStatus("no_face");
      return;
    }

    const originX = Number(box.originX || 0);
    const originY = Number(box.originY || 0);
    const boxWidth = Number(box.width || 0);
    const boxHeight = Number(box.height || 0);
    const faceRatio = (boxWidth * boxHeight) / (videoWidth * videoHeight);
    if (!Number.isFinite(faceRatio) || faceRatio < minFaceRatio) {
      setDetectionStatus("too_small");
      return;
    }

    const centerX = originX + boxWidth / 2;
    const centerY = originY + boxHeight / 2;
    const centeredX = centerX >= videoWidth * 0.28 && centerX <= videoWidth * 0.72;
    const centeredY = centerY >= videoHeight * 0.22 && centerY <= videoHeight * 0.78;
    if (!centeredX || !centeredY) {
      setDetectionStatus("off_center");
      return;
    }

    setDetectionStatus("ready");
  }, []);

  const startDetectionLoop = useCallback(async () => {
    try {
      setDetectionStatus("detector_loading");
      const detector = await ensureDetector();

      const detectFrame = () => {
        const videoElement = videoRef.current;
        if (!videoElement || step !== "camera") {
          return;
        }

        if (videoElement.readyState >= 2 && videoElement.videoWidth && videoElement.videoHeight) {
          try {
            const result = detector.detectForVideo
              ? detector.detectForVideo(videoElement, performance.now())
              : detector.detect(videoElement);
            evaluateDetection(
              result?.detections || [],
              videoElement.videoWidth,
              videoElement.videoHeight,
            );
          } catch {
            setDetectionStatus("detector_error");
          }
        }

        animationRef.current = requestAnimationFrame(detectFrame);
      };

      detectFrame();
    } catch {
      setDetectionStatus("detector_error");
      setVerificationError("Unable to load face detector. Refresh and try again.");
    }
  }, [ensureDetector, evaluateDetection, step]);

  const startCamera = useCallback(async () => {
    setVerificationError("");
    setDetectionStatus("camera_loading");
    stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 720 },
          height: { ideal: 960 },
        },
        audio: false,
      });
      streamRef.current = stream;
      const videoElement = videoRef.current;
      if (!videoElement) {
        throw new Error("Video element unavailable");
      }
      videoElement.srcObject = stream;
      await videoElement.play();
      await startDetectionLoop();
    } catch (error) {
      setDetectionStatus("camera_error");
      setVerificationError(
        error instanceof Error
          ? error.message
          : "Camera access failed. Allow camera permission and retry.",
      );
    }
  }, [startDetectionLoop, stopCamera]);

  useEffect(() => {
    let active = true;
    const init = async () => {
      if (!supabase) {
        setVerificationError(
          "Supabase frontend keys are missing. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
        );
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        navigate("/auth", { replace: true });
        return;
      }

      setAuthToken(session.access_token);
      setUserId(session.user.id);

      try {
        await apiRequest("/profile/bootstrap", {
          method: "POST",
          token: session.access_token,
        });
        const started = await apiRequest("/verification/session/start", {
          method: "POST",
          token: session.access_token,
        });
        if (!active) return;
        setSessionId(started.session.id);
      } catch (error) {
        if (!active) return;
        setVerificationError(error instanceof Error ? error.message : String(error));
      }
    };

    init();
    return () => {
      active = false;
    };
  }, [navigate]);

  useEffect(() => {
    let interval;
    if (step === "analyzing" && isSubmitting) {
      interval = setInterval(() => {
        setProgress((previous) => {
          if (previous >= 90) return previous;
          return previous + 2;
        });
      }, 110);
    }
    return () => clearInterval(interval);
  }, [isSubmitting, step]);

  useEffect(() => {
    if (step === "camera") {
      startCamera();
      return;
    }
    stopCamera();
    if (!isSubmitting) {
      setDetectionStatus("no_face");
    }
  }, [isSubmitting, startCamera, step, stopCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
      if (detectorRef.current?.close) {
        detectorRef.current.close();
      }
      if (image?.startsWith("blob:")) {
        URL.revokeObjectURL(image);
      }
    };
  }, [image, stopCamera]);

  const uploadSelfieToStorage = async ({ file, activeSessionId, activeUserId }) => {
    if (!supabase) {
      throw new Error("Supabase client not configured on frontend.");
    }
    const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
    const baseName = (file.name || "selfie").replace(/\.[^/.]+$/, "");
    const storagePath = `${activeUserId}/${activeSessionId}/${Date.now()}-${sanitizeFileName(
      baseName,
    )}.${extension}`;
    const storage = supabase.storage.from(selfieBucket);

    const { error: uploadError } = await storage.upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "image/jpeg",
    });

    if (uploadError) {
      throw new Error(
        `Selfie upload failed (${uploadError.message}). Ensure bucket "${selfieBucket}" exists and upload policy allows this user.`,
      );
    }

    const signedResult = await storage.createSignedUrl(storagePath, 60 * 30);
    if (signedResult.error || !signedResult.data?.signedUrl) {
      throw new Error(
        signedResult.error?.message ||
          "Could not create signed selfie URL. Check storage SELECT policy for this bucket.",
      );
    }
    return signedResult.data.signedUrl;
  };

  const captureLiveSelfie = async () => {
    const videoElement = videoRef.current;
    const canvasElement = captureCanvasRef.current;
    if (!videoElement || !canvasElement) {
      throw new Error("Camera capture surface unavailable.");
    }
    if (!videoElement.videoWidth || !videoElement.videoHeight) {
      throw new Error("Camera frame unavailable. Please retry.");
    }

    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
    const context = canvasElement.getContext("2d");
    if (!context) {
      throw new Error("Camera capture context unavailable.");
    }
    context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

    const blob = await new Promise((resolve) => {
      canvasElement.toBlob(resolve, "image/jpeg", 0.92);
    });
    if (!blob) {
      throw new Error("Could not encode selfie image.");
    }

    if (image?.startsWith("blob:")) {
      URL.revokeObjectURL(image);
    }
    const previewUrl = URL.createObjectURL(blob);
    setImage(previewUrl);

    return new File([blob], `live-selfie-${Date.now()}.jpg`, {
      type: "image/jpeg",
    });
  };

  const handleCapture = () => {
    if (!canCapture || !authToken || !userId) return;

    const submit = async () => {
      setIsSubmitting(true);
      setProgress(8);
      setStep("analyzing");
      setVerificationError("");

      try {
        let activeSessionId = sessionId;
        if (!activeSessionId) {
          const started = await apiRequest("/verification/session/start", {
            method: "POST",
            token: authToken,
          });
          activeSessionId = started.session.id;
          setSessionId(activeSessionId);
        }

        const capturedFile = await captureLiveSelfie();
        stopCamera();

        const selfieUrl = await uploadSelfieToStorage({
          file: capturedFile,
          activeSessionId,
          activeUserId: userId,
        });
        setProgress(45);

        const submitted = await apiRequest(`/verification/session/${activeSessionId}/submit`, {
          method: "POST",
          token: authToken,
          body: {
            selfie_url: selfieUrl,
          },
        });
        setProgress(75);

        if (!submitted?.result?.passed) {
          setVerificationError(failureMessage(submitted?.result?.failure_code));
          setStep("camera");
          return;
        }

        await apiRequest(`/verification/session/${activeSessionId}/finalize`, {
          method: "POST",
          token: authToken,
        });
        window.dispatchEvent(new Event("flashfound:onboarding-updated"));
        setProgress(100);
        setStep("success");
      } catch (error) {
        setVerificationError(error instanceof Error ? error.message : String(error));
        setStep("camera");
      } finally {
        setIsSubmitting(false);
      }
    };

    submit();
  };

  const handleOpenCamera = () => {
    setVerificationError("");
    setStep("camera");
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col font-sans text-gray-900">
      <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shrink-0 z-20">
        <div className="flex items-center gap-2 text-[#2563eb]">
          <Camera size={24} strokeWidth={2.5} />
          <span className="text-xl font-bold text-gray-900 tracking-tight">FlashFound</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
          <span>Step 2 of 2</span>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-6 pb-12">
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
          <div className="flex flex-col gap-6 md:pr-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold w-fit">
              <ShieldCheck size={16} />
              Identity Verification
            </div>

            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 leading-tight">
              Create your secure <br className="hidden md:block" /> FlashFound Identity.
            </h1>

            <p className="text-lg text-gray-600">
              Establishing your identity requires a <strong>Live Selfie</strong>. This ensures your profile is authentic and secure.
            </p>

            <div className="space-y-4 mt-4">
              <div className="flex gap-4">
                <div className="mt-1 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Lock size={16} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Strict Liveness Check</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Camera-only capture keeps the identity source trustworthy and consistent.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1 w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                  <ScanFace size={16} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Live Face Feedback</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    You get real-time guidance for one face, centered frame, and proper distance.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden relative min-h-[500px] flex flex-col">
            {step === "intro" && (
              <div className="p-8 md:p-10 flex flex-col items-center text-center flex-1 justify-center">
                <div className="w-20 h-20 bg-blue-50 text-[#2563eb] rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                  <ScanFace size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {isUpdateMode ? "Update your verification selfie?" : "Ready for your selfie?"}
                </h3>
                <p className="text-sm text-gray-500 max-w-[280px] mb-8">
                  Find a well-lit area and ensure you are the only person in the frame.
                </p>

                <button
                  onClick={handleOpenCamera}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-900 text-white rounded-2xl font-semibold hover:bg-black active:scale-[0.98] transition-all shadow-lg"
                >
                  <Camera size={20} />
                  Open Camera
                </button>

                <div className="mt-8 flex items-start gap-2 text-left bg-blue-50/50 p-4 rounded-xl w-full">
                  <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {isUpdateMode
                      ? "Your updated source selfie will be used for all upcoming photo matches."
                      : "Identity setup is a one-time process. This photo will be used to unlock your private photos at all future events."}
                  </p>
                </div>
              </div>
            )}

            {step === "camera" && (
              <div className="flex-1 flex flex-col bg-gray-900 relative">
                <div className="relative flex-1 w-full overflow-hidden flex items-center justify-center bg-gray-800">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 pointer-events-none">
                    <div
                      className={`w-64 h-80 border-2 rounded-[60px] transition-colors duration-500 flex items-center justify-center ${feedback.borderClass}`}
                    >
                      <div className="backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 text-white text-xs font-semibold border border-white/10 bg-black/40">
                        {detectionStatus === "ready" ? (
                          <CheckCircle2 size={14} />
                        ) : (
                          <AlertCircle size={14} className="text-yellow-300" />
                        )}
                        {feedback.banner}
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-4 left-0 right-0 flex justify-center">
                    <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[10px] text-white font-bold uppercase tracking-widest flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${feedback.dotClass}`}></div>
                      {feedback.statusText}
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-white flex items-center justify-between">
                  <button
                    onClick={() => setStep("intro")}
                    className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>

                  <button
                    onClick={handleCapture}
                    disabled={!canCapture}
                    className={`w-20 h-20 rounded-full border-4 p-1 transition-all active:scale-90 ${
                      canCapture ? "border-blue-600 cursor-pointer" : "border-gray-200 cursor-not-allowed opacity-50"
                    }`}
                  >
                    <div
                      className={`w-full h-full rounded-full transition-colors ${canCapture ? "bg-blue-600" : "bg-gray-100"}`}
                    ></div>
                  </button>

                  <button
                    onClick={startCamera}
                    className="p-3 text-gray-400 hover:text-gray-600"
                  >
                    <RefreshCcw size={24} />
                  </button>
                </div>
              </div>
            )}

            {step === "analyzing" && (
              <div className="p-8 md:p-10 flex flex-col items-center text-center min-h-[440px] justify-center flex-1">
                <div className="relative mb-8">
                  <div className="absolute -inset-4 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg relative z-10">
                    <img src={image} alt="Processing" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-400/30 to-transparent animate-[scan_2s_ease-in-out_infinite]"></div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Validating Selfie</h3>
                <p className="text-sm text-gray-500 mb-8">Ensuring identity integrity...</p>
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

            {step === "success" && (
              <div className="p-8 md:p-10 flex flex-col items-center text-center min-h-[440px] justify-center flex-1">
                <div className="relative mb-6">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg relative z-10">
                    <img src={image} alt="Verified" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-2 rounded-full border-4 border-white shadow-md z-20">
                    <CheckCircle2 size={24} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Identity Verified!</h3>
                <p className="text-sm text-gray-500 mb-8 max-w-[280px]">
                  Your Source of Truth is set. You can now securely access event galleries.
                </p>
                <button
                  onClick={() => navigate(isUpdateMode ? "/profile" : "/my-photos")}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gray-900 text-white rounded-xl font-semibold hover:bg-black active:scale-[0.98] transition-all shadow-md"
                >
                  {isUpdateMode ? "Back to Profile" : "Go to My Photos"} <ArrowRight size={18} />
                </button>
              </div>
            )}

            {verificationError ? (
              <div className="absolute left-4 right-4 bottom-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 z-30">
                {verificationError}
              </div>
            ) : null}

            <canvas ref={captureCanvasRef} className="hidden" />

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
