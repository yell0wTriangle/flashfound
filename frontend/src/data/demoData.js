export const currentUser = {
  id: "user_me",
  name: "Aarav Mehta",
  email: "aarav@flashfound.demo",
  avatar:
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
};

export const people = [
  currentUser,
  {
    id: "user_maya",
    name: "Maya Singh",
    email: "maya@example.com",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
  },
  {
    id: "user_kabir",
    name: "Kabir Rao",
    email: "kabir@example.com",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200",
  },
  {
    id: "user_isha",
    name: "Isha Kapoor",
    email: "isha@example.com",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
  },
  {
    id: "user_ryan",
    name: "Ryan Cole",
    email: "ryan@example.com",
    avatar:
      "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&q=80&w=200",
  },
];

export const events = [
  {
    id: "technova",
    name: "TechNova Summit '26",
    date: "Oct 12, 2026",
    location: "San Francisco, CA",
    organizer: "TechNova Inc.",
    company: "TechNova Inc.",
    type: "Private",
    status: "Upcoming",
    attendeesCount: 145,
    imageUrl:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=900",
  },
  {
    id: "neon-nights",
    name: "Neon Nights Music Festival",
    date: "Nov 05, 2026",
    location: "Austin, TX",
    organizer: "LiveNation",
    company: "LiveNation",
    type: "Public",
    status: "Completed",
    attendeesCount: 420,
    imageUrl:
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=900",
  },
  {
    id: "wedding",
    name: "Anaya & Dev Wedding",
    date: "Dec 14, 2026",
    location: "Jaipur, India",
    organizer: "Moonlit Weddings",
    company: "Moonlit Weddings",
    type: "Private",
    status: "Draft",
    attendeesCount: 86,
    imageUrl:
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=900",
  },
  {
    id: "founders",
    name: "Global Founders Conference",
    date: "Nov 18, 2026",
    location: "London, UK",
    organizer: "FounderHouse",
    company: "FounderHouse",
    type: "Public",
    status: "Upcoming",
    attendeesCount: 210,
    imageUrl:
      "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=900",
  },
];

export const eventPeople = {
  technova: ["user_me", "user_maya", "user_kabir", "user_isha"],
  "neon-nights": ["user_me", "user_maya", "user_ryan", "user_kabir"],
  wedding: ["user_me", "user_isha", "user_maya"],
  founders: ["user_me", "user_kabir", "user_ryan"],
};

export const privateAccess = {
  technova: ["user_me", "user_maya"],
  wedding: ["user_me"],
};

export const photos = [
  {
    id: "p1",
    eventId: "technova",
    url: "https://images.unsplash.com/photo-1515169067865-5387ec356754?auto=format&fit=crop&q=80&w=900",
    people: ["user_me", "user_maya"],
  },
  {
    id: "p2",
    eventId: "technova",
    url: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&q=80&w=900",
    people: ["user_kabir", "user_isha"],
  },
  {
    id: "p3",
    eventId: "technova",
    url: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=900",
    people: ["user_me", "user_kabir", "user_isha"],
  },
  {
    id: "p4",
    eventId: "neon-nights",
    url: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=900",
    people: ["user_me", "user_ryan"],
  },
  {
    id: "p5",
    eventId: "neon-nights",
    url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=900",
    people: ["user_maya", "user_kabir", "user_ryan"],
  },
  {
    id: "p6",
    eventId: "wedding",
    url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=900",
    people: ["user_me", "user_isha"],
  },
  {
    id: "p7",
    eventId: "wedding",
    url: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&q=80&w=900",
    people: ["user_maya", "user_isha"],
  },
  {
    id: "p8",
    eventId: "founders",
    url: "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&q=80&w=900",
    people: ["user_me", "user_kabir", "user_ryan"],
  },
];

export const myPhotoIds = ["p1", "p3", "p4", "p6", "p8"];

export const notifications = [
  {
    id: "n1",
    type: "added_to_event",
    title: "You were added to Neon Nights",
    body: "LiveNation added you as an attendee. Your public gallery is ready.",
    eventId: "neon-nights",
    read: false,
  },
  {
    id: "n2",
    type: "private_access_request",
    title: "Maya requested private access",
    body: "Maya Singh wants to view photos you appear in from TechNova Summit '26.",
    eventId: "technova",
    requesterId: "user_maya",
    read: false,
  },
  {
    id: "n3",
    type: "added_to_event",
    title: "Wedding gallery invite",
    body: "Moonlit Weddings added your email to Anaya & Dev Wedding.",
    eventId: "wedding",
    read: true,
  },
];

export const getPerson = (id) => people.find((person) => person.id === id);
export const getEvent = (id) => events.find((event) => event.id === id);
export const getEventPhotos = (eventId) =>
  photos.filter((photo) => photo.eventId === eventId);
