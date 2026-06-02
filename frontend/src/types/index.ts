export type UserRole = 'STUDENT' | 'ADMIN';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  streakCount?: number;
  multiplierActive?: boolean;
  createdAt?: string;
}

export interface EventData {
  id: string | number;
  title: string;
  description: string;
  dateTime: string;
  endDateTime?: string;
  venue: string;
  category: string;
  maxCapacity?: number;
  registeredCount?: number;
  waitlistCount?: number;
  imageUrl?: string;
  imageMimeType?: string;
  registrationLink?: string;
  responsesLink?: string;
  createdAt?: string;
  isPaid?: boolean;
  ticketPrice?: number;
}

export interface Registration {
  id: string;
  userId: string;
  username: string;
  eventId: string | number;
  eventTitle: string;
  registeredAt: string | any; // Supports ISO strings or Firestore ServerTimestamp
  status: 'REGISTERED' | 'WAITLISTED' | 'ATTENDED';
  paymentStatus: 'FREE' | 'PENDING' | 'PAID';
  paymentIntentId?: string;
  event?: EventData;
  attendedAt?: string;
}

export interface PeerRelation {
  id: string;
  userId?: string;
  username?: string;
  email?: string;
  photoURL?: string | null;
  addedAt?: string;
  // Legacy or P2P bidirectional options:
  requesterId?: string;
  receiverId?: string;
  status?: 'PENDING' | 'ACCEPTED';
  connectedAt?: string | any;
}

export interface FeedbackRating {
  id: string;
  eventId: string | number;
  eventTitle: string;
  userId: string;
  username: string;
  rating: number;
  takeaway: string;
  submittedAt: string;
}
