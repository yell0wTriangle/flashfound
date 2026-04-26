import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import LandingPage from "./dumpViews/LandingPage.jsx";
import AccountSetupStep1 from "./dumpViews/AccountSetupStep1.jsx";
import AccountSetupStep2 from "./dumpViews/AccountSetupStep2.jsx";
import MyPhotos from "./dumpViews/MyPhotos.jsx";
import EventDiscovery from "./dumpViews/EventDiscovery.jsx";
import PublicResults from "./dumpViews/PublicResults.jsx";
import PrivateResults from "./dumpViews/PrivateResults.jsx";
import Notifications from "./dumpViews/Notifications.jsx";
import RequestOrganiserAccess from "./dumpViews/RequestOrganiserAccess.jsx";
import OrganiserDashboard from "./dumpViews/OrganiserDashboad.jsx";
import CreateEvent from "./dumpViews/CreateEvent.jsx";
import ProfileAndSettings from "./dumpViews/ProfileAndSettings.jsx";
import Admin from "./dumpViews/Admin.jsx";
import { apiRequest } from "./lib/api.js";
import { isSupabaseConfigured, supabase } from "./lib/supabase.js";

const routesByTitle = {
  "My Photos": "/my-photos",
  "Find Events": "/events",
  "Organizer Access (Create & Manage Events)": "/organiser/dashboard",
  Notifications: "/notifications",
  Profile: "/profile",
};

const ROUTES_REQUIRING_AUTH = ["/my-photos", "/events", "/notifications", "/organiser", "/profile"];

function textOf(element) {
  return element?.textContent?.replace(/\s+/g, " ").trim() || "";
}

function stopAndGo(event, navigate, route) {
  event.preventDefault();
  event.stopPropagation();
  navigate(route);
}

function RoutingAdapter({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState(null);
  const [syncNonce, setSyncNonce] = useState(0);
  const [didInitialSync, setDidInitialSync] = useState(!isSupabaseConfigured);
  const [authResolved, setAuthResolved] = useState(!isSupabaseConfigured);
  const [oauthInFlight, setOauthInFlight] = useState(false);
  const syncInFlightRef = useRef(null);
  const [userState, setUserState] = useState({
    loading: isSupabaseConfigured,
    onboardingStatus: null,
    role: "attendee",
  });
  const [appError, setAppError] = useState("");

  const syncBackendUser = useCallback(async (accessToken) => {
    const bootstrap = await apiRequest("/profile/bootstrap", {
      method: "POST",
      token: accessToken,
    });
    const onboarding = await apiRequest("/profile/onboarding-status", {
      token: accessToken,
    });

    return {
      profile: bootstrap.profile,
      onboardingStatus: onboarding.status,
      role: onboarding.role || "attendee",
      verificationSession: onboarding.verification_session,
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setUserState((previous) => ({
        ...previous,
        loading: false,
        onboardingStatus: "ready",
      }));
      setAuthResolved(true);
      setDidInitialSync(true);
      return undefined;
    }

    let active = true;
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setAppError(error.message);
        }
        setSession(data.session || null);
        setAuthResolved(true);
      })
      .catch((error) => {
        if (!active) return;
        setAppError(error instanceof Error ? error.message : String(error));
        setAuthResolved(true);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((eventName, nextSession) => {
      setSession(nextSession || null);
      setAuthResolved(true);
      if (eventName === "INITIAL_SESSION" || eventName === "SIGNED_IN" || eventName === "TOKEN_REFRESHED") {
        setOauthInFlight(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    const handleOnboardingUpdate = () => {
      setSyncNonce((previous) => previous + 1);
    };

    window.addEventListener("flashfound:onboarding-updated", handleOnboardingUpdate);
    return () => {
      window.removeEventListener("flashfound:onboarding-updated", handleOnboardingUpdate);
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    const maybeRefreshSession = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      if (!currentSession?.expires_at) {
        return;
      }

      const expiresInMs = currentSession.expires_at * 1000 - Date.now();
      if (expiresInMs > 5 * 60 * 1000) {
        return;
      }

      await supabase.auth.refreshSession();
    };

    const handleVisible = () => {
      if (document.visibilityState !== "visible") {
        return;
      }
      maybeRefreshSession().catch(() => {});
    };

    window.addEventListener("focus", handleVisible);
    document.addEventListener("visibilitychange", handleVisible);
    return () => {
      window.removeEventListener("focus", handleVisible);
      document.removeEventListener("visibilitychange", handleVisible);
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return;
    }
    if (!authResolved) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      setAppError("");

      if (!session?.access_token) {
        syncInFlightRef.current = null;
        if (cancelled) return;
        setUserState({
          loading: false,
          onboardingStatus: null,
          role: "attendee",
        });
        setDidInitialSync(true);
        return;
      }

      const accessToken = session.access_token;
      if (syncInFlightRef.current?.token === accessToken && syncInFlightRef.current.promise) {
        try {
          const synced = await syncInFlightRef.current.promise;
          if (cancelled) return;
          setUserState({
            loading: false,
            onboardingStatus: synced.onboardingStatus,
            role: synced.role,
          });
          setDidInitialSync(true);
        } catch (error) {
          if (cancelled) return;
          setUserState({
            loading: false,
            onboardingStatus: null,
            role: "attendee",
          });
          setAppError(error instanceof Error ? error.message : String(error));
          setDidInitialSync(true);
        }
        return;
      }

      if (!cancelled) {
        setUserState((previous) => ({
          ...previous,
          loading: true,
          onboardingStatus: null,
        }));
      }

      try {
        const pendingSync = syncBackendUser(accessToken);
        const trackedSync = pendingSync.finally(() => {
          if (syncInFlightRef.current?.promise === trackedSync) {
            syncInFlightRef.current = null;
          }
        });
        syncInFlightRef.current = {
          token: accessToken,
          promise: trackedSync,
        };

        const synced = await trackedSync;
        if (cancelled) return;
        setUserState({
          loading: false,
          onboardingStatus: synced.onboardingStatus,
          role: synced.role,
        });
        setDidInitialSync(true);
      } catch (error) {
        if (cancelled) return;
        setUserState({
          loading: false,
          onboardingStatus: null,
          role: "attendee",
        });
        setAppError(error instanceof Error ? error.message : String(error));
        setDidInitialSync(true);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [authResolved, session, syncBackendUser, syncNonce]);

  const pathRequiresAuth = useMemo(
    () => ROUTES_REQUIRING_AUTH.some((prefix) => location.pathname.startsWith(prefix)),
    [location.pathname],
  );
  const isSelfieUpdateMode = useMemo(() => {
    if (location.pathname !== "/setup/selfie") {
      return false;
    }
    const params = new URLSearchParams(location.search);
    return params.get("mode") === "update";
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }
    if (!authResolved) {
      return;
    }
    if (userState.loading) {
      return;
    }

    const pathname = location.pathname;
    const isAdminPath = pathname.startsWith("/admin");

    if (isAdminPath) {
      return;
    }

    if (!session?.access_token) {
      if (pathRequiresAuth || pathname === "/setup/selfie") {
        navigate("/auth", { replace: true, state: { authMode: "login" } });
      }
      return;
    }

    if (userState.onboardingStatus == null) {
      return;
    }

    if (userState.onboardingStatus !== "ready") {
      if (pathname !== "/setup/selfie") {
        navigate("/setup/selfie", { replace: true });
      }
      return;
    }

    if (pathname === "/auth" || (pathname === "/setup/selfie" && !isSelfieUpdateMode)) {
      navigate("/my-photos", { replace: true });
    }
  }, [
    isSelfieUpdateMode,
    location.pathname,
    navigate,
    pathRequiresAuth,
    session,
    authResolved,
    userState.loading,
    userState.onboardingStatus,
  ]);

  const handleClickCapture = (event) => {
    const target = event.target;
    const clickable = target.closest("button, a, [role='button'], .group");
    if (!clickable) return;

    const title = clickable.getAttribute("title");
    const text = textOf(clickable);
    const pathname = location.pathname;

    if (title && /organi[sz]er access/i.test(title)) {
      stopAndGo(
        event,
        navigate,
        userState.role === "organiser" ? "/organiser/dashboard" : "/organiser/request",
      );
      return;
    }

    if (title && routesByTitle[title]) {
      stopAndGo(event, navigate, routesByTitle[title]);
      return;
    }

    if (
      pathname.startsWith("/organiser/events/") &&
      clickable.tagName === "BUTTON" &&
      text === "" &&
      clickable.className.includes("-ml-2") &&
      clickable.querySelector("svg")
    ) {
      stopAndGo(event, navigate, "/organiser/dashboard");
      return;
    }

    if (text === "Log in") {
      event.preventDefault();
      event.stopPropagation();
      navigate("/auth?mode=login", { state: { authMode: "login" } });
      return;
    }

    if (text === "Get Started" || text === "Create Free Account" || text === "Create Your Identity") {
      stopAndGo(event, navigate, "/auth");
      return;
    }

    if (text === "Continue with Google" || text === "Continue with Apple") {
      event.preventDefault();
      event.stopPropagation();
      if (oauthInFlight) {
        return;
      }

      const params = new URLSearchParams(location.search);
      const isLogin = location.state?.authMode === "login" || params.get("mode") === "login";

      if (!isSupabaseConfigured || !supabase) {
        setOauthInFlight(false);
        navigate(isLogin ? "/my-photos" : "/setup/selfie");
        return;
      }

      setOauthInFlight(true);
      const unlockTimer = window.setTimeout(() => {
        setOauthInFlight(false);
      }, 8000);
      const provider = text.includes("Google") ? "google" : "apple";
      supabase.auth
        .signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/auth`,
          },
        })
        .then(({ error }) => {
          if (error) {
            window.clearTimeout(unlockTimer);
            setOauthInFlight(false);
            setAppError(error.message);
            navigate(isLogin ? "/my-photos" : "/setup/selfie");
          }
        })
        .catch((error) => {
          window.clearTimeout(unlockTimer);
          setOauthInFlight(false);
          setAppError(error instanceof Error ? error.message : String(error));
          navigate(isLogin ? "/my-photos" : "/setup/selfie");
        });
      return;
    }

    if (text.includes("Go to My Photos")) {
      stopAndGo(event, navigate, "/my-photos");
      return;
    }

    if (text.includes("Sign Out")) {
      event.preventDefault();
      event.stopPropagation();

      if (!isSupabaseConfigured || !supabase) {
        navigate("/");
        return;
      }

      supabase.auth
        .signOut()
        .catch((error) => {
          setAppError(error instanceof Error ? error.message : String(error));
        })
        .finally(() => {
          syncInFlightRef.current = null;
          setOauthInFlight(false);
          navigate("/");
        });
    }
  };

  if (isSupabaseConfigured && (!authResolved || (userState.loading && !didInitialSync))) {
    return (
      <div className="min-h-screen w-full bg-gray-50 p-6 sm:p-10">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="mb-8 h-16 w-56 rounded-2xl bg-gray-200" />
          <div className="grid gap-6 md:grid-cols-3">
            <div className="h-48 rounded-3xl bg-gray-200" />
            <div className="h-48 rounded-3xl bg-gray-200" />
            <div className="h-48 rounded-3xl bg-gray-200" />
          </div>
          <div className="mt-8 h-96 rounded-3xl bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div onClickCapture={handleClickCapture}>
      {children}
      {appError ? (
        <div className="fixed bottom-4 right-4 max-w-sm rounded-lg bg-red-600 text-white px-4 py-3 text-sm shadow-lg z-[120]">
          {appError}
        </div>
      ) : null}
    </div>
  );
}

export default function App() {
  return (
    <RoutingAdapter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AccountSetupStep1 />} />
        <Route path="/setup/selfie" element={<AccountSetupStep2 />} />
        <Route path="/my-photos" element={<MyPhotos />} />
        <Route path="/events" element={<EventDiscovery />} />
        <Route path="/events/:eventId/public" element={<PublicResults />} />
        <Route path="/events/:eventId/private" element={<PrivateResults />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/organiser/request" element={<RequestOrganiserAccess />} />
        <Route path="/organiser/dashboard" element={<OrganiserDashboard />} />
        <Route path="/organiser/events/new" element={<CreateEvent />} />
        <Route path="/organiser/events/:eventId/edit" element={<CreateEvent />} />
        <Route path="/profile" element={<ProfileAndSettings />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </RoutingAdapter>
  );
}
