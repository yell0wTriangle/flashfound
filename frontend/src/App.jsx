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

const routesByTitle = {
  "My Photos": "/my-photos",
  "Find Events": "/events",
  "Organizer Access": "/organiser/dashboard",
  "Organizer Access (Create & Manage Events)": "/organiser/dashboard",
  Notifications: "/notifications",
  Profile: "/profile",
};

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

  const handleClickCapture = (event) => {
    const target = event.target;
    const clickable = target.closest("button, a, [role='button'], .group");
    if (!clickable) return;

    const title = clickable.getAttribute("title");
    const text = textOf(clickable);
    const pathname = location.pathname;

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
      const params = new URLSearchParams(location.search);
      const isLogin = location.state?.authMode === "login" || params.get("mode") === "login";
      stopAndGo(event, navigate, isLogin ? "/my-photos" : "/setup/selfie");
      return;
    }

    if (text.includes("Go to My Photos")) {
      stopAndGo(event, navigate, "/my-photos");
      return;
    }

    if (
      (pathname.includes("/events/") && (title === "Back to Events" || text.includes("Back to Events"))) ||
      (pathname.includes("/events/") &&
        clickable.tagName === "BUTTON" &&
        text === "" &&
        clickable.querySelector("svg") &&
        !textOf(clickable.closest("header")).includes("Selected"))
    ) {
      stopAndGo(event, navigate, location.state?.from || "/events");
      return;
    }

    if (text.includes("View Private Gallery")) {
      event.preventDefault();
      event.stopPropagation();
      navigate("/events/technova/private", { state: { from: pathname } });
      return;
    }

    if (text.includes("View Public Gallery")) {
      event.preventDefault();
      event.stopPropagation();
      navigate("/events/neon-nights/public", { state: { from: pathname } });
      return;
    }

    if (text.includes("View Event Gallery")) {
      event.preventDefault();
      event.stopPropagation();
      navigate("/events/neon-nights/public", { state: { from: "/notifications" } });
      return;
    }

    if (text.includes("Create Event")) {
      stopAndGo(event, navigate, "/organiser/events/new");
      return;
    }

    if (text.includes("Manage Event")) {
      stopAndGo(event, navigate, "/organiser/events/technova/edit");
      return;
    }

    if (text.includes("Save & Publish")) {
      stopAndGo(event, navigate, "/organiser/dashboard");
      return;
    }

    if (text.includes("Sign Out")) {
      stopAndGo(event, navigate, "/");
    }
  };

  return <div onClickCapture={handleClickCapture}>{children}</div>;
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
