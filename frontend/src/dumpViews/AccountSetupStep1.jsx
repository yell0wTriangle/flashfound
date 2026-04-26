import React from "react";
import { Camera, ShieldCheck, Zap, Lock, ArrowRight } from "lucide-react";

// Custom SVG Icons for OAuth providers
const GoogleIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const AppleIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
  >
    <path d="M16.365 1.43c0 0-2.01.155-3.875 1.775-1.78 1.545-2.035 3.555-2.035 3.555s1.84-.13 3.655-1.63c1.71-1.415 2.255-3.7 2.255-3.7zM17.435 7.695c-1.895-.145-3.62 1.09-4.53 1.09-.895 0-2.31-1.045-3.83-1.01-1.99.04-3.83 1.155-4.855 2.945-2.07 3.595-.53 8.92 1.49 11.835.98 1.42 2.14 3.01 3.67 2.955 1.48-.055 2.05-1.045 3.92-1.045 1.845 0 2.36 1.045 3.945 1.01 1.63-.035 2.63-1.465 3.6-2.88.13-.19.245-.39.35-.595-2.58-1.09-2.91-4.705-.62-6.195-1.22-1.785-3.13-1.97-3.14-1.98z" />
  </svg>
);

const App = () => {
  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col font-sans text-gray-900">
      {/* Minimal Unified Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shrink-0 z-20">
        <div className="flex items-center gap-2 text-[#2563eb]">
          <Camera size={24} strokeWidth={2.5} />
          <span className="text-xl font-bold text-gray-900 tracking-tight">
            FlashFound
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
          <Lock size={14} />
          <span>Secure Gateway</span>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-6 pb-12">
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
          {/* Left Column: Contextual Value Prop */}
          <div className="flex flex-col gap-6 md:pr-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold w-fit">
              <Zap size={16} />
              AI-Powered Memory Access
            </div>

            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 leading-tight">
              Welcome to the <br className="hidden md:block" /> future of event
              galleries.
            </h1>

            <p className="text-lg text-gray-600">
              Sign in to access your photos or create a new account to establish
              your secure identity. One tap to find every memory.
            </p>

            <div className="space-y-4 mt-4">
              <div className="flex gap-4">
                <div className="mt-1 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Camera size={16} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Instant Photo Delivery
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Log in to see matched photos from your recent events
                    instantly.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Privacy-First Identity
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Your biometric data is encrypted and used only to unlock
                    your own moments.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Unified Auth Card */}
          <div className="w-full bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden p-8 md:p-10 flex flex-col relative">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                Get Started
              </h2>
              <p className="text-gray-500 mt-2 text-sm">
                Sign in or create an account in one click.
              </p>
            </div>

            {/* Unified OAuth Buttons */}
            <div className="flex flex-col gap-4 w-full">
              <button className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 active:scale-[0.98] transition-all shadow-sm">
                <GoogleIcon />
                Continue with Google
              </button>

              <button className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-black border border-black text-white rounded-xl font-medium hover:bg-gray-900 active:scale-[0.98] transition-all shadow-sm">
                <AppleIcon />
                Continue with Apple
              </button>
            </div>

            {/* Hint for New Users */}
            <div className="mt-6 p-4 bg-gray-50 rounded-xl flex items-start gap-3">
              <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center shrink-0 mt-0.5">
                <ArrowRight size={12} className="text-blue-600" />
              </div>
              <p className="text-[11px] text-gray-500 leading-tight">
                New users will be guided through a quick 30-second identity
                verification setup after signing in.
              </p>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-100 text-center">
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-4">
                <Lock size={14} />
                <span>Passwordless & Secure Authentication</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                By continuing, you agree to FlashFound's{" "}
                <a href="#" className="text-[#2563eb] hover:underline">
                  Terms
                </a>{" "}
                and{" "}
                <a href="#" className="text-[#2563eb] hover:underline">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
