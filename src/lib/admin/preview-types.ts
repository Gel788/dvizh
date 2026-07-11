export type AdminPreviewKind =
  | "post"
  | "user"
  | "media"
  | "wishlist"
  | "report"
  | "duel"
  | "sharedGoal"
  | "friendship"
  | "joinRequest"
  | "event"
  | "calendarEvent"
  | "challenge"
  | "club";

export type AdminPreviewAuthor = {
  name: string;
  username: string;
  avatar?: string | null;
};

export type AdminPreviewPost = {
  kind: "post";
  id: string;
  type: string;
  title: string | null;
  content: string;
  city: string;
  district: string | null;
  images: string[];
  tags: string;
  featuredInFeed: boolean;
  featuredBoost: number;
  hiddenFromFeed: boolean;
  createdAt: string;
  author: AdminPreviewAuthor;
  likes: number;
  comments: number;
  going: number;
};

export type AdminPreviewUser = {
  kind: "user";
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string | null;
  coverImage: string | null;
  bio: string | null;
  city: string;
  district: string | null;
  verified: boolean;
  reputation: number;
  role: string;
  createdAt: string;
  xp: number | null;
  level: number | null;
  posts: number;
  followers: number;
  following: number;
};

export type AdminPreviewMedia = {
  kind: "media";
  id: string;
  type: string;
  title: string;
  status: string;
  rating: number | null;
  review: string | null;
  coverUrl: string | null;
  pinned: boolean;
  visibility: string;
  createdAt: string;
  author: AdminPreviewAuthor;
};

export type AdminPreviewWishlistItem = {
  id: string;
  title: string;
  imageUrl: string | null;
  price: string | null;
  reserved: boolean;
  reservationStatus: string | null;
};

export type AdminPreviewWishlist = {
  kind: "wishlist";
  id: string;
  title: string;
  occasion: string | null;
  visibility: string;
  surpriseMode: boolean;
  shareToken: string | null;
  createdAt: string;
  author: AdminPreviewAuthor;
  items: AdminPreviewWishlistItem[];
};

export type AdminPreviewReport = {
  kind: "report";
  id: string;
  targetKind: string;
  targetId: string;
  reason: string;
  details: string | null;
  createdAt: string;
  reporter: AdminPreviewAuthor;
  targetLabel: string;
  targetSnippet: string | null;
  targetImage: string | null;
  targetHref: string | null;
};

export type AdminPreviewDuel = {
  kind: "duel";
  id: string;
  title: string;
  description: string | null;
  emoji: string | null;
  visibility: string;
  period: string;
  participants: number;
  createdAt: string;
  author: AdminPreviewAuthor;
};

export type AdminPreviewSharedGoal = {
  kind: "sharedGoal";
  id: string;
  title: string;
  description: string | null;
  eventAt: string | null;
  members: number;
  items: number;
  createdAt: string;
  author: AdminPreviewAuthor;
};

export type AdminPreviewFriendship = {
  kind: "friendship";
  id: string;
  requester: AdminPreviewAuthor;
  addressee: AdminPreviewAuthor;
  status: string;
  createdAt: string;
};

export type AdminPreviewJoinRequest = {
  kind: "joinRequest";
  id: string;
  activityKind: string;
  activityId: string;
  status: string;
  createdAt: string;
  user: AdminPreviewAuthor;
  activityTitle: string | null;
};

export type AdminPreviewEvent = {
  kind: "event";
  id: string;
  title: string;
  description: string;
  city: string;
  district: string | null;
  coverImage: string | null;
  startAt: string;
  endAt: string | null;
  attendees: number;
  clubName: string | null;
  author: AdminPreviewAuthor;
};

export type AdminPreviewCalendarEvent = {
  kind: "calendarEvent";
  id: string;
  title: string;
  note: string | null;
  eventType: string;
  visibility: string;
  sourceKind: string | null;
  sourceId: string | null;
  eventDate: string;
  author: AdminPreviewAuthor;
};

export type AdminPreviewChallenge = {
  kind: "challenge";
  id: string;
  postId: string;
  title: string;
  content: string;
  city: string;
  goalCount: number;
  deadline: string | null;
  rules: string | null;
  participants: number;
  reports: number;
  flags: string[];
  author: AdminPreviewAuthor;
};

export type AdminPreviewClub = {
  kind: "club";
  id: string;
  name: string;
  description: string;
  city: string;
  coverImage: string | null;
  isPrivate: boolean;
  members: number;
  events: number;
  author: AdminPreviewAuthor;
};

export type AdminPreviewPayload =
  | AdminPreviewPost
  | AdminPreviewUser
  | AdminPreviewMedia
  | AdminPreviewWishlist
  | AdminPreviewReport
  | AdminPreviewDuel
  | AdminPreviewSharedGoal
  | AdminPreviewFriendship
  | AdminPreviewJoinRequest
  | AdminPreviewEvent
  | AdminPreviewCalendarEvent
  | AdminPreviewChallenge
  | AdminPreviewClub;

export type AdminPreviewMap = Record<string, AdminPreviewPayload>;
