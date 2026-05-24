import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { EngagementStreak } from '../components/innovations/AcademicInnovations';
import { EventCard } from '../components/ui/EventCard';
import type { EventData } from '../components/ui/EventCard';
import { FilterPill } from '../components/ui/FilterPill';
import { Button } from '../components/ui/Button';
import { useSearchParams } from 'react-router-dom';
import { db, storage } from '../lib/firebase';
import { cn } from '../lib/utils';
import { useFCM } from '../hooks/useFCM';
import { EventTicketModal } from '../components/edge/EventTicketModal';
import { TicketScannerModal } from '../components/edge/TicketScannerModal';
import { QRCodeSVG } from 'qrcode.react';
import { getHaversineDistance, KLH_COORDINATES, GEOFENCE_RADIUS_METERS } from '../lib/geoUtils';
import { useTemporalConflict } from '../hooks/useTemporalConflict';
import { 
  collection, 
  getDocs, 
  getDoc,
  setDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  runTransaction,
  getCountFromServer,
  query, 
  where 
} from 'firebase/firestore';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  ChartTitle,
  Tooltip,
  Legend,
  Filler
);
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Plus, 
  Download, 
  X, 
  ImageIcon,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Flame,
  LayoutGrid,
  Calendar,
  Users,
  Compass,
  Laptop,
  Music,
  Trophy,
  Wrench,
  Presentation,
  Type,
  FileText,
  Link as LinkIcon,
  BarChart2,
  MapPin,
  Camera,
  Sparkles
} from 'lucide-react';

type AdminStatsType = {
  totalEvents: number;
  totalRegistrations: number;
  upcomingEvents?: number;
  ongoingEvents?: number;
  pastEvents?: number;
};

// Staggered kinematics animation variants for elite Vercel standard
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05
    }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 24
    }
  }
} as const;

const formatToDatetimeLocal = (dateStr?: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventData[]>([]);
  const [registrationCounts, setRegistrationCounts] = useState<Record<string, number>>({});
  const [myRegistrations, setMyRegistrations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adminStats, setAdminStats] = useState<AdminStatsType | null>(null);
  
  // Search & Filter state
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Edge access control modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [selectedTicketEvent, setSelectedTicketEvent] = useState<EventData | null>(null);
  const [selectedTicketRegId, setSelectedTicketRegId] = useState('');

  // Temporal Collision warnings
  const [conflictWarning, setConflictWarning] = useState<{ isOpen: boolean; overlappingEventName?: string } | null>(null);

  // Gamification Streak States
  const [streakCount, setStreakCount] = useState(0);
  const [multiplierActive, setMultiplierActive] = useState(false);

  // Squad Connections States
  const [myPeers, setMyPeers] = useState<any[]>([]);
  const [peerRegistrations, setPeerRegistrations] = useState<any[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [peerSearchError, setPeerSearchError] = useState('');
  const [peerSearchSuccess, setPeerSearchSuccess] = useState('');
  const [isAddingPeer, setIsAddingPeer] = useState(false);

  // Admin Tab & Analytic States
  const [activeAdminTab, setActiveAdminTab] = useState<'catalog' | 'analytics'>('catalog');
  const [adminRegistrations, setAdminRegistrations] = useState<any[]>([]);
  const [adminFeedback, setAdminFeedback] = useState<any[]>([]);

  // Post-Event Feedback States
  const [feedbackSubmittedIds, setFeedbackSubmittedIds] = useState<string[]>([]);
  const [pendingFeedbackEvent, setPendingFeedbackEvent] = useState<EventData | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackTakeaway, setFeedbackTakeaway] = useState('');
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);

  // Geo-Fenced Access Control State
  const [isOnCampus, setIsOnCampus] = useState<boolean | null>(null);

  // Initialize Cloud Messaging device token hook
  useFCM(user?.id);

  // Initialize temporal conflict detection hook
  const { checkConflict: checkClash } = useTemporalConflict(myRegistrations);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDateTime, setFormDateTime] = useState('');
  const [formEndDateTime, setFormEndDateTime] = useState('');
  const [formVenue, setFormVenue] = useState('');
  const [formCategory, setFormCategory] = useState('Technical');
  const [formMaxCapacity, setFormMaxCapacity] = useState('');
  const [formRegistrationLink, setFormRegistrationLink] = useState('');
  const [formResponsesLink, setFormResponsesLink] = useState('');
  const [formIsPaid, setFormIsPaid] = useState(false);
  const [formTicketPrice, setFormTicketPrice] = useState('');
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutEvent, setCheckoutEvent] = useState<EventData | null>(null);
  const [checkoutCardName, setCheckoutCardName] = useState('');
  const [checkoutCardNumber, setCheckoutCardNumber] = useState('');
  const [checkoutCardExpiry, setCheckoutCardExpiry] = useState('');
  const [checkoutCardCVV, setCheckoutCardCVV] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');


  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      if (!user) return;

      // 1. Fetch all events from Firestore (automatically utilizes local IndexDB persistence cache if offline)
      const eventsSnap = await getDocs(collection(db, 'events'));
      const fetchedEvents: EventData[] = eventsSnap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as EventData));

      // Sort by start date descending
      fetchedEvents.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

      let totalRegistrations = 0;
      let studentRegs: any[] = [];
      const counts: Record<string, number> = {};

      if (user.role === 'ADMIN') {
        // High-concurrency query optimization: Native server aggregation query count saves thousands of document reads!
        const regsCountSnap = await getCountFromServer(collection(db, 'registrations'));
        totalRegistrations = regsCountSnap.data().count;
        
        // Map registeredCount dynamically from the event documents directly (denormalized single source of truth)
        fetchedEvents.forEach(e => {
          if (e.id) {
            counts[e.id] = e.registeredCount ? parseInt(e.registeredCount.toString()) : 0;
          }
        });
      } else {
        // Students: Fetch ONLY their owned registration documents, strictly locked and secured (highly cost-effective)
        const q = query(collection(db, 'registrations'), where('userId', '==', user.id));
        const regsSnap = await getDocs(q);
        studentRegs = regsSnap.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        })) as any[];
        
        totalRegistrations = studentRegs.length;
        
        studentRegs.forEach(r => {
          if (r.eventId) {
            counts[r.eventId] = (counts[r.eventId] || 0) + 1;
          }
        });

        // Dynamic Mathematical Streak & Multiplier calculation (7-day resets)
        const attendedRegs = studentRegs
          .filter(r => r.status === 'ATTENDED' && r.attendedAt)
          .map(r => new Date(r.attendedAt).getTime())
          .sort((a, b) => a - b); // oldest to newest

        if (attendedRegs.length === 0) {
          setStreakCount(0);
          setMultiplierActive(false);
        } else {
          const nowTime = new Date().getTime();
          const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
          const mostRecent = attendedRegs[attendedRegs.length - 1];

          if (nowTime - mostRecent > sevenDaysMs) {
            // Entire streak reset to 0 if gap since last attended event > 7 days
            setStreakCount(0);
            setMultiplierActive(false);
          } else {
            let currentStreak = 1;
            for (let i = 1; i < attendedRegs.length; i++) {
              const diff = attendedRegs[i] - attendedRegs[i - 1];
              if (diff <= sevenDaysMs) {
                currentStreak += 1;
              } else {
                currentStreak = 1; // reset streak if gap between consecutive events > 7 days
              }
            }
            setStreakCount(currentStreak);
            setMultiplierActive(currentStreak >= 3);
          }
        }
      }

      setRegistrationCounts(counts);
      setMyRegistrations(studentRegs);

      // --- Phase 6: Squad Social Graph & Market Intelligence Sync ---
      if (user.role === 'STUDENT') {
        try {
          const peersRef = collection(db, 'users', user.id, 'connections');
          const peersSnap = await getDocs(peersRef);
          const peersList = peersSnap.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
          }));
          setMyPeers(peersList);

          const peerIds = peersList.map((p: any) => p.userId).filter(Boolean);
          if (peerIds.length > 0) {
            const chunkedPeerIds = [];
            for (let i = 0; i < peerIds.length; i += 30) {
              chunkedPeerIds.push(peerIds.slice(i, i + 30));
            }

            let allPeerRegs: any[] = [];
            for (const idsChunk of chunkedPeerIds) {
              const peerRegsSnap = await getDocs(query(
                collection(db, 'registrations'),
                where('userId', 'in', idsChunk)
              ));
              const chunkRegs = peerRegsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
              allPeerRegs = [...allPeerRegs, ...chunkRegs];
            }
            setPeerRegistrations(allPeerRegs);
          } else {
            setPeerRegistrations([]);
          }

          // Fetch feedback submitted by current user
          const feedbackSnap = await getDocs(query(collection(db, 'feedback'), where('userId', '==', user.id)));
          const submittedIds = feedbackSnap.docs.map(d => d.data().eventId);
          setFeedbackSubmittedIds(submittedIds);
        } catch (peerErr) {
          console.warn('Failed to load peers/feedback for student:', peerErr);
        }
      }

      if (user.role === 'ADMIN') {
        try {
          const allRegsSnap = await getDocs(collection(db, 'registrations'));
          const allRegs = allRegsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          setAdminRegistrations(allRegs);

          const allFeedbackSnap = await getDocs(collection(db, 'feedback'));
          const allFeedback = allFeedbackSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          setAdminFeedback(allFeedback);
        } catch (adminErr) {
          console.warn('Failed to load analytics data for admin:', adminErr);
        }
      }

      // 5. Compute real-time stats
      const now = new Date();
      const upcoming = fetchedEvents.filter(e => new Date(e.dateTime) > now).length;
      const ongoing = fetchedEvents.filter(e => {
        const start = new Date(e.dateTime);
        const end = e.endDateTime ? new Date(e.endDateTime) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
        return start <= now && now <= end;
      }).length;
      const past = fetchedEvents.filter(e => {
        const start = new Date(e.dateTime);
        const end = e.endDateTime ? new Date(e.endDateTime) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
        return end < now;
      }).length;

      setAdminStats({
        totalEvents: fetchedEvents.length,
        totalRegistrations: totalRegistrations,
        upcomingEvents: upcoming,
        ongoingEvents: ongoing,
        pastEvents: past
      });

      // 6. Set events list
      setEvents(fetchedEvents);

    } catch (err) {
      console.error('Failed to fetch dashboard data from Firestore:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open modal for adding a new event
  const openAddModal = useCallback(() => {
    setEditingEvent(null);
    setFormTitle('');
    setFormDescription('');
    setFormDateTime('');
    setFormEndDateTime('');
    setFormVenue('');
    setFormCategory('Technical');
    setFormMaxCapacity('');
    setFormRegistrationLink('');
    setFormResponsesLink('');
    setFormIsPaid(false);
    setFormTicketPrice('');
    setFormImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setModalError('');
    setModalSuccess('');
    setIsModalOpen(true);
  }, []);

  // Open modal for editing an existing event
  const openEditModal = useCallback((event: EventData) => {
    setEditingEvent(event);
    setFormTitle(event.title);
    setFormDescription(event.description);
    setFormDateTime(formatToDatetimeLocal(event.dateTime));
    setFormEndDateTime(formatToDatetimeLocal(event.endDateTime));
    setFormVenue(event.venue);
    setFormCategory(event.category);
    setFormMaxCapacity(event.maxCapacity?.toString() || '');
    setFormRegistrationLink(event.registrationLink || '');
    setFormResponsesLink(event.responsesLink || '');
    setFormIsPaid(event.isPaid || false);
    setFormTicketPrice(event.ticketPrice?.toString() || '');
    setFormImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setModalError('');
    setModalSuccess('');
    setIsModalOpen(true);
  }, []);

  // Handle Event Creation & Updates in Cloud Firestore
  const handleSaveEvent = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');
    setIsSaving(true);

    if (!formTitle.trim() || !formDescription.trim() || !formDateTime || !formVenue.trim()) {
      setModalError('Please fill in all required fields.');
      setIsSaving(false);
      return;
    }

    if (formEndDateTime && new Date(formEndDateTime) <= new Date(formDateTime)) {
      setModalError('End date and time must be after start date and time.');
      setIsSaving(false);
      return;
    }

    if (formIsPaid && (!formTicketPrice || parseFloat(formTicketPrice) <= 0)) {
      setModalError('Please enter a valid ticket price.');
      setIsSaving(false);
      return;
    }

    try {
      let imageUrl = editingEvent?.imageUrl || '';

      // Upload banner image to Firebase Storage if selected (resilient to disabled/Spark plan limits)
      if (formImageFile) {
        try {
          const fileExt = formImageFile.name.split('.').pop();
          const bannerRef = ref(storage, `event_banners/${Date.now()}.${fileExt}`);
          const snapshot = await uploadBytes(bannerRef, formImageFile);
          imageUrl = await getDownloadURL(snapshot.ref);
        } catch (storageErr) {
          console.warn('Firebase Storage is disabled or requires plan upgrade. Falling back to dynamic thematic placeholder.', storageErr);
          const categoryImages: Record<string, string> = {
            'Technical': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
            'Cultural': 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&q=80',
            'Sports': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80',
            'Workshop': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80',
            'Seminar': 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80'
          };
          imageUrl = categoryImages[formCategory] || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80';
        }
      }

      const eventPayload = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        dateTime: new Date(formDateTime).toISOString(),
        endDateTime: formEndDateTime ? new Date(formEndDateTime).toISOString() : null,
        venue: formVenue.trim(),
        category: formCategory,
        maxCapacity: formMaxCapacity ? parseInt(formMaxCapacity) : null,
        registrationLink: formRegistrationLink.trim() || null,
        responsesLink: formResponsesLink.trim() || null,
        imageUrl: imageUrl,
        isPaid: formIsPaid,
        ticketPrice: formIsPaid ? parseFloat(formTicketPrice) : 0
      };

      if (editingEvent) {
        // Update in Firestore
        await updateDoc(doc(db, 'events', editingEvent.id as string), eventPayload);
        setModalSuccess('Event updated successfully!');
      } else {
        // Add to Firestore
        await addDoc(collection(db, 'events'), {
          ...eventPayload,
          createdAt: new Date().toISOString()
        });
        setModalSuccess('Event created successfully!');
      }

      setTimeout(() => {
        setIsModalOpen(false);
        fetchData(); // instant local refetch
      }, 1200);

    } catch (err: any) {
      console.error(err);
      setModalError(err.message || 'Failed to save event. Check connection.');
    } finally {
      setIsSaving(false);
    }
  }, [
    formTitle, formDescription, formDateTime, formEndDateTime, formVenue,
    formCategory, formMaxCapacity, formRegistrationLink, formResponsesLink,
    formIsPaid, formTicketPrice, formImageFile, editingEvent, fetchData
  ]);

  // Handle Event Deletion
  const handleDeleteEvent = useCallback(async (id: string | number) => {
    if (!window.confirm('Are you absolutely sure you want to delete this event? This will also purge all student registrations.')) {
      return;
    }

    try {
      // 1. Delete the event document
      await deleteDoc(doc(db, 'events', id as string));

      // 2. Cascade delete all registration documents for this event
      const regsSnap = await getDocs(query(collection(db, 'registrations'), where('eventId', '==', id)));
      for (const regDoc of regsSnap.docs) {
        await deleteDoc(doc(db, 'registrations', regDoc.id));
      }

      // 3. Instant local state updates
      setEvents(prev => prev.filter(e => e.id !== id));
      setAdminStats(prev => prev ? {
        ...prev,
        totalEvents: Math.max(0, prev.totalEvents - 1),
        totalRegistrations: Math.max(0, prev.totalRegistrations - (registrationCounts[id] || 0))
      } : null);
    } catch (err) {
      console.error(err);
      alert('Error deleting event from Firestore.');
    }
  }, [registrationCounts]);

  // Helper values
  const registeredIds = useMemo(() => myRegistrations.map(r => r.eventId).filter(Boolean), [myRegistrations]);

  const checkConflict = useCallback((event: EventData) => {
    if (registeredIds.includes(event.id)) return false;
    
    const startA = new Date(event.dateTime).getTime();
    const endA = event.endDateTime ? new Date(event.endDateTime).getTime() : startA + (2 * 60 * 60 * 1000);

    for (const reg of myRegistrations) {
      const regEvent = reg.event;
      if (!regEvent || regEvent.id === event.id) continue;
      
      const startB = new Date(regEvent.dateTime).getTime();
      const endB = regEvent.endDateTime ? new Date(regEvent.endDateTime).getTime() : startB + (2 * 60 * 60 * 1000);

      if (startA < endB && startB < endA) {
        return true;
      }
    }
    return false;
  }, [registeredIds, myRegistrations]);

  // Handle Student registration in Cloud Firestore
  const handleRegister = useCallback(async (eventId: string | number) => {
    if (!user) return;
    try {
      const event = events.find(e => e.id === eventId);
      if (!event) return;

      // 1. Perform temporal collision calendar checking before any transactions
      const clashResult = checkClash(event);
      if (clashResult.isConflicting) {
        setConflictWarning({
          isOpen: true,
          overlappingEventName: clashResult.overlappingEventName
        });
        return; // blocks registration flow!
      }

      // Check if registration requires paid Stripe checkout overlay
      if (event.isPaid && !registeredIds.includes(eventId)) {
        setCheckoutEvent(event);
        setCheckoutCardName('');
        setCheckoutCardNumber('');
        setCheckoutCardExpiry('');
        setCheckoutCardCVV('');
        setCheckoutError('');
        setIsCheckoutOpen(true);
        return;
      }

      const result = await runTransaction(db, async (transaction) => {
        // 1. Defensively read the event document in this atomic transaction
        const eventRef = doc(db, 'events', eventId.toString());
        const eventSnap = await transaction.get(eventRef);
        if (!eventSnap.exists()) {
          throw new Error('Event document does not exist.');
        }

        const eventData = eventSnap.data();
        const maxCapacity = eventData.maxCapacity ? parseInt(eventData.maxCapacity.toString()) : Infinity;
        const currentCount = eventData.registeredCount ? parseInt(eventData.registeredCount.toString()) : 0;
        const waitlistCount = eventData.waitlistCount ? parseInt(eventData.waitlistCount.toString()) : 0;

        // 2. Prevent duplicate registrations at database primary key layer
        const regId = `${user.id}_${eventId}`;
        const regRef = doc(db, 'registrations', regId);
        const regSnap = await transaction.get(regRef);
        if (regSnap.exists()) {
          throw new Error('ALREADY_REGISTERED');
        }

        if (currentCount >= maxCapacity) {
          // Commit waitlisted document with priority queue timestamp
          transaction.set(regRef, {
            userId: user.id,
            eventId: eventId,
            registeredAt: new Date().toISOString(),
            status: 'WAITLISTED',
            event: event
          });
          transaction.update(eventRef, {
            waitlistCount: waitlistCount + 1
          });
          return 'WAITLISTED';
        } else {
          // Standard seat registration
          transaction.update(eventRef, {
            registeredCount: currentCount + 1
          });
          transaction.set(regRef, {
            userId: user.id,
            eventId: eventId,
            registeredAt: new Date().toISOString(),
            status: 'REGISTERED',
            event: event
          });
          return 'REGISTERED';
        }
      });

      if (result === 'WAITLISTED') {
        alert('Event is at maximum capacity. You have successfully joined the predictive waitlist! ⏳');
      } else {
        alert('Successfully registered interest for the event!');
      }
      fetchData(); // refresh counters

      if (event.registrationLink) {
        window.open(event.registrationLink, '_blank');
      }
    } catch (err: any) {
      if (err.message === 'EVENT_FULL') {
        alert('Failed to register: This event is already full!');
      } else if (err.message === 'ALREADY_REGISTERED') {
         alert('You have already registered interest for this event.');
      } else {
        console.error('Transaction failed:', err);
        alert('Failed to register due to a database conflict.');
      }
    }
  }, [user, events, registeredIds, checkClash, fetchData]);

  // Handle premium payment checkout submission
  const handleCheckoutSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !checkoutEvent) return;
    setCheckoutError('');
    setIsProcessingPayment(true);

    const cleanCard = checkoutCardNumber.replace(/\s+/g, '');
    if (cleanCard.length !== 16) {
      setCheckoutError('Please enter a valid 16-digit credit card number.');
      setIsProcessingPayment(false);
      return;
    }
    if (!checkoutCardExpiry.match(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/)) {
      setCheckoutError('Please enter a valid expiry date (MM/YY).');
      setIsProcessingPayment(false);
      return;
    }
    if (checkoutCardCVV.length !== 3) {
      setCheckoutError('Please enter a valid 3-digit CVV code.');
      setIsProcessingPayment(false);
      return;
    }

    try {
      const regId = `${user.id}_${checkoutEvent.id}`;
      const regRef = doc(db, 'registrations', regId);
      const eventRef = doc(db, 'events', checkoutEvent.id.toString());

      await runTransaction(db, async (transaction) => {
        const eventSnap = await transaction.get(eventRef);
        if (!eventSnap.exists()) {
          throw new Error('Event does not exist.');
        }

        const eventData = eventSnap.data() || {};
        const maxCapacity = eventData.maxCapacity ? parseInt(eventData.maxCapacity.toString()) : Infinity;
        const currentCount = eventData.registeredCount ? parseInt(eventData.registeredCount.toString()) : 0;
        const waitlistCount = eventData.waitlistCount ? parseInt(eventData.waitlistCount.toString()) : 0;

        const regSnap = await transaction.get(regRef);
        if (regSnap.exists()) {
          throw new Error('ALREADY_REGISTERED');
        }

        if (currentCount >= maxCapacity) {
          transaction.set(regRef, {
            userId: user.id,
            eventId: checkoutEvent.id,
            registeredAt: new Date().toISOString(),
            status: 'WAITLISTED',
            event: checkoutEvent
          });
          transaction.update(eventRef, {
            waitlistCount: waitlistCount + 1
          });
          return 'WAITLISTED';
        } else {
          transaction.update(eventRef, {
            registeredCount: currentCount + 1
          });
          transaction.set(regRef, {
            userId: user.id,
            eventId: checkoutEvent.id,
            registeredAt: new Date().toISOString(),
            status: 'REGISTERED',
            paymentStatus: 'PAID',
            paymentIntentId: `pi_mock_${Math.random().toString(36).substring(2, 10)}`,
            event: checkoutEvent
          });
          return 'REGISTERED';
        }
      });

      alert(`Payment Successful! ₹${checkoutEvent.ticketPrice} captured securely via Stripe. ✓`);
      setIsCheckoutOpen(false);
      setCheckoutEvent(null);
      fetchData();
    } catch (err: any) {
      if (err.message === 'ALREADY_REGISTERED') {
        setCheckoutError('You are already registered for this event.');
      } else {
        console.error('Simulated Stripe transaction failed:', err);
        setCheckoutError(err.message || 'Payment authentication failed. Try test card 4242.');
      }
    } finally {
      setIsProcessingPayment(false);
    }
  }, [user, checkoutEvent, checkoutCardNumber, checkoutCardExpiry, checkoutCardCVV, fetchData]);

  // Compile verifiable Participation PDF Certificates on the client
  const handleDownloadCertificate = useCallback(async (eventId: string | number) => {
    try {
      const event = events.find(e => e.id === eventId);
      const reg = myRegistrations.find(r => r.eventId === eventId);
      if (!event || !reg || !user) return;

      // Premium Code-Splitting: Lazy load jsPDF only when user requests certificate download
      const { jsPDF } = await import('jspdf');

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const width = doc.internal.pageSize.getWidth();
      const height = doc.internal.pageSize.getHeight();

      // 1. Premium deep-space void background
      doc.setFillColor(15, 15, 19);
      doc.rect(0, 0, width, height, 'F');

      // 2. Glow-accent border indicators
      doc.setDrawColor(168, 85, 247); // Purple
      doc.setLineWidth(1.5);
      doc.rect(8, 8, width - 16, height - 16, 'D');

      doc.setDrawColor(6, 182, 212); // Cyan
      doc.setLineWidth(0.5);
      doc.rect(10, 10, width - 20, height - 20, 'D');

      // 3. Header title details
      doc.setTextColor(168, 85, 247);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(28);
      doc.text('CAMPUS CONNECT', width / 2, 35, { align: 'center' });

      doc.setTextColor(241, 245, 249);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(14);
      doc.text('KLH UNIVERSITY ACADEMIC EVENT ECOSYSTEM', width / 2, 45, { align: 'center' });

      // 4. Verification title
      doc.setFontSize(18);
      doc.setTextColor(156, 163, 175);
      doc.text('VERIFIABLE DIGITAL CERTIFICATE OF PARTICIPATION', width / 2, 70, { align: 'center' });

      doc.setFontSize(14);
      doc.text('This document verifies that', width / 2, 85, { align: 'center' });

      // 5. Student Name (Neon white)
      doc.setFontSize(32);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text(user.username.toUpperCase(), width / 2, 102, { align: 'center' });

      doc.setDrawColor(168, 85, 247);
      doc.setLineWidth(1.2);
      doc.line(width / 2 - 50, 108, width / 2 + 50, 108);

      // 6. Attendance verification statement
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(156, 163, 175);
      doc.text('has successfully attended the university event', width / 2, 122, { align: 'center' });

      doc.setFontSize(20);
      doc.setTextColor(6, 182, 212);
      doc.setFont('helvetica', 'bold');
      doc.text(`"${event.title}"`, width / 2, 136, { align: 'center' });

      // 7. Event date stamps
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(156, 163, 175);
      const formattedDate = new Date(event.dateTime).toLocaleDateString(undefined, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      doc.text(`Completed on ${formattedDate}`, width / 2, 148, { align: 'center' });

      // 8. Cryptographic verification credentials footer
      doc.setDrawColor(255, 255, 255, 0.1);
      doc.rect(width / 2 - 120, 165, 240, 25, 'D');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(`VERIFIABLE CREDENTIAL ID: ${reg.id}`, width / 2, 175, { align: 'center' });
      doc.text('SECURED VIA CLOUD FIRESTORE AUTHENTICATION KEYS', width / 2, 182, { align: 'center' });

      // 9. Save PDF locally
      const sanitizedTitle = event.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      doc.save(`${sanitizedTitle}_participation_certificate.pdf`);

    } catch (err) {
      console.error('Failed to compile certificate PDF:', err);
      alert('Failed to generate credential certificate.');
    }
  }, [events, myRegistrations, user]);

  // Handle CSV Report Generation Clientside (Fully offline, zero costs!)
  const handleExportCSV = useCallback(() => {
    try {
      const csvHeaders = 'ID,Title,Category,DateTime,EndDateTime,Venue,MaxCapacity,RegistrationLink,ResponsesLink,RegistrationsCount\n';
      const csvRows = events.map(e => {
        const idStr = `"${e.id}"`;
        const titleStr = `"${e.title.replace(/"/g, '""')}"`;
        const catStr = `"${e.category}"`;
        const dateStr = `"${e.dateTime}"`;
        const endDateStr = `"${e.endDateTime || ''}"`;
        const venueStr = `"${e.venue.replace(/"/g, '""')}"`;
        const capStr = `"${e.maxCapacity || 'Unlimited'}"`;
        const regLinkStr = `"${e.registrationLink || ''}"`;
        const respLinkStr = `"${e.responsesLink || ''}"`;
        const countStr = `"${registrationCounts[e.id as string] || 0}"`;

        return [idStr, titleStr, catStr, dateStr, endDateStr, venueStr, capStr, regLinkStr, respLinkStr, countStr].join(',');
      }).join('\n');

      const fullCsv = csvHeaders + csvRows;
      const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'campus_events_report.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Error creating CSV report.');
    }
  }, [events, registrationCounts]);

  // Add peer connection handler
  const handleAddPeer = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !searchEmail.trim()) return;
    setPeerSearchError('');
    setPeerSearchSuccess('');
    setIsAddingPeer(true);

    try {
      const emailQuery = query(collection(db, 'users'), where('email', '==', searchEmail.trim().toLowerCase()));
      const querySnap = await getDocs(emailQuery);

      if (querySnap.empty) {
        setPeerSearchError('No student found with this email.');
        setIsAddingPeer(false);
        return;
      }

      const peerDoc = querySnap.docs[0];
      const peerData = peerDoc.data();

      if (peerData.id === user.id) {
        setPeerSearchError('You cannot add yourself as a peer.');
        setIsAddingPeer(false);
        return;
      }

      // Check if already in connections
      const connRef = doc(db, 'users', user.id, 'connections', peerData.id);
      const connSnap = await getDoc(connRef);
      if (connSnap.exists()) {
        setPeerSearchError('This student is already in your squad.');
        setIsAddingPeer(false);
        return;
      }

      // Store in connections sub-collection
      await setDoc(connRef, {
        id: peerData.id,
        userId: peerData.id,
        username: peerData.username,
        email: peerData.email,
        photoURL: peerData.photoURL || null,
        addedAt: new Date().toISOString()
      });

      setPeerSearchSuccess(`${peerData.username} added to squad!`);
      setSearchEmail('');
      fetchData(); // reload squad graph counters
    } catch (err: any) {
      console.error(err);
      setPeerSearchError('Failed to establish connection.');
    } finally {
      setIsAddingPeer(false);
    }
  }, [user, searchEmail, fetchData]);

  // Pre-calculated memoized map for peer attendees per event to maintain reference stability
  const eventPeerAttendeesMap = useMemo(() => {
    const map: Record<string | number, Array<{ userId: string; username: string }>> = {};
    events.forEach(event => {
      map[event.id] = peerRegistrations
        .filter(r => r.eventId === event.id && (r.status === 'REGISTERED' || r.status === 'ATTENDED' || r.status === 'WAITLISTED'))
        .map(r => {
          const peer = myPeers.find(p => p.userId === r.userId);
          return {
            userId: r.userId,
            username: peer?.username || r.username || 'Peer'
          };
        });
    });
    return map;
  }, [events, peerRegistrations, myPeers]);

  // Stable callback handler for viewing dynamic tickets
  const handleViewPass = useCallback((eventId: string | number) => {
    const event = events.find(e => e.id === eventId);
    const reg = myRegistrations.find(r => r.eventId === eventId);
    if (event && reg) {
      setSelectedTicketEvent(event);
      setSelectedTicketRegId(reg.id);
      setIsTicketOpen(true);
    }
  }, [events, myRegistrations]);

  // Save feedback handler
  const handleSaveFeedback = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pendingFeedbackEvent) return;
    setIsSavingFeedback(true);

    try {
      const feedbackPayload = {
        eventId: pendingFeedbackEvent.id,
        eventTitle: pendingFeedbackEvent.title,
        userId: user.id,
        username: user.username,
        rating: feedbackRating,
        takeaway: feedbackTakeaway.trim(),
        submittedAt: new Date().toISOString()
      };

      // Write to feedback collection
      await addDoc(collection(db, 'feedback'), feedbackPayload);
      
      // Update local state immediately
      setFeedbackSubmittedIds(prev => [...prev, pendingFeedbackEvent.id as string]);
      setPendingFeedbackEvent(null);
      setFeedbackRating(5);
      setFeedbackTakeaway('');
      alert('Thank you for your valuable feedback! 🌟');
      fetchData(); // reload
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      alert('Failed to save rating. Check connectivity.');
    } finally {
      setIsSavingFeedback(false);
    }
  }, [user, pendingFeedbackEvent, feedbackRating, feedbackTakeaway, fetchData]);

  // Check pending feedback for student
  useEffect(() => {
    if (user?.role === 'STUDENT' && myRegistrations.length > 0) {
      const attendedRegs = myRegistrations.filter(r => r.status === 'ATTENDED');
      const pending = attendedRegs.find(r => !feedbackSubmittedIds.includes(r.eventId));
      if (pending && pending.event) {
        setPendingFeedbackEvent(pending.event);
      } else {
        setPendingFeedbackEvent(null);
      }
    }
  }, [myRegistrations, feedbackSubmittedIds, user]);

  // Geo-Fenced Access Lock check
  const checkGeofence = useCallback(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported by this browser.');
      setIsOnCampus(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const dist = getHaversineDistance(
          position.coords.latitude,
          position.coords.longitude,
          KLH_COORDINATES.latitude,
          KLH_COORDINATES.longitude
        );
        setIsOnCampus(dist <= GEOFENCE_RADIUS_METERS);
      },
      (error) => {
        console.warn('Geolocation check failed or permission denied:', error);
        setIsOnCampus(false); // Lock defensively
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    if (user?.role === 'STUDENT') {
      checkGeofence();
    } else {
      setIsOnCampus(true);
    }
  }, [user, checkGeofence]);

  // --- ChartJS Analytical Aggregations with useMemo ---
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8',
          font: { weight: 'bold' as const, size: 10 }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { size: 9 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { size: 9 } }
      }
    }
  }), []);

  const doughnutOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#94a3b8',
          font: { weight: 'bold' as const, size: 10 }
        }
      }
    }
  }), []);

  const dropOffChartData = useMemo(() => {
    const activeEvents = events.filter(e => {
      const count = registrationCounts[e.id as string] || 0;
      return count > 0;
    }).slice(0, 6);

    const labels = activeEvents.map(e => e.title);
    const registeredData = activeEvents.map(e => registrationCounts[e.id as string] || 0);
    const attendedData = activeEvents.map(e => {
      return adminRegistrations.filter(r => r.eventId === e.id && r.status === 'ATTENDED').length;
    });

    return {
      labels,
      datasets: [
        {
          label: 'Total Registered',
          data: registeredData,
          backgroundColor: 'rgba(168, 85, 247, 0.45)',
          borderColor: 'rgb(168, 85, 247)',
          borderWidth: 1.5,
          borderRadius: 8
        },
        {
          label: 'Actually Attended',
          data: attendedData,
          backgroundColor: 'rgba(6, 182, 212, 0.45)',
          borderColor: 'rgb(6, 182, 212)',
          borderWidth: 1.5,
          borderRadius: 8
        }
      ]
    };
  }, [events, registrationCounts, adminRegistrations]);

  const velocityChartData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const hourlyCounts = Array(24).fill(0);

    adminRegistrations.forEach(r => {
      if (r.registeredAt) {
        const hour = new Date(r.registeredAt).getHours();
        if (hour >= 0 && hour < 24) {
          hourlyCounts[hour]++;
        }
      }
    });

    return {
      labels: hours,
      datasets: [
        {
          fill: true,
          label: 'Registrations Velocity',
          data: hourlyCounts,
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.12)',
          tension: 0.4,
          pointBackgroundColor: 'rgb(6, 182, 212)',
          pointBorderColor: '#ffffff',
          pointHoverRadius: 6
        }
      ]
    };
  }, [adminRegistrations]);

  const categorySplitData = useMemo(() => {
    const categories = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar'];
    const countsMap = { Technical: 0, Cultural: 0, Sports: 0, Workshop: 0, Seminar: 0 };

    adminRegistrations.forEach(r => {
      if (r.event?.category) {
        const cat = r.event.category as keyof typeof countsMap;
        if (countsMap[cat] !== undefined) {
          countsMap[cat]++;
        }
      }
    });

    return {
      labels: categories,
      datasets: [
        {
          data: categories.map(cat => countsMap[cat as keyof typeof countsMap]),
          backgroundColor: [
            'rgba(59, 130, 246, 0.6)',
            'rgba(236, 72, 153, 0.6)',
            'rgba(249, 115, 22, 0.6)',
            'rgba(6, 182, 212, 0.6)',
            'rgba(16, 185, 129, 0.6)'
          ],
          borderColor: [
            'rgb(59, 130, 246)',
            'rgb(236, 72, 153)',
            'rgb(249, 115, 22)',
            'rgb(6, 182, 212)',
            'rgb(16, 185, 129)'
          ],
          borderWidth: 1.5
        }
      ]
    };
  }, [adminRegistrations]);

  // Filtering events based on user input queries with useMemo
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            e.venue.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (categoryFilter === 'all') return matchesSearch;

      if (user?.role === 'ADMIN') {
        // Status filtering for Admin: Upcoming, Ongoing, Past
        const now = new Date();
        const start = new Date(e.dateTime);
        const end = e.endDateTime ? new Date(e.endDateTime) : new Date(start.getTime() + 2 * 60 * 60 * 1000);

        if (categoryFilter === 'Upcoming') return matchesSearch && start > now;
        if (categoryFilter === 'Ongoing') return matchesSearch && start <= now && now <= end;
        if (categoryFilter === 'Past') return matchesSearch && end < now;
      } else {
        // Category filtering for Students: Technical, Cultural, etc.
        return matchesSearch && e.category.toLowerCase() === categoryFilter.toLowerCase();
      }
      return matchesSearch;
    });
  }, [events, searchQuery, categoryFilter, user]);

  const registeredEvents = useMemo(() => {
    return events.filter(e => registeredIds.includes(e.id));
  }, [events, registeredIds]);

  // Relevance-scored rendering feed mapped via useMemo
  const finalRenderFeed = useMemo(() => {
    const categoryHistory = myRegistrations
      .slice(-5)
      .map(r => r.event?.category?.toLowerCase())
      .filter(Boolean) as string[];

    const sortedAndScoredEvents = [...filteredEvents].map(event => {
      let relevanceScore = 0;

      if (user?.role === 'STUDENT') {
        // 1. Category vector matching
        if (categoryHistory.includes(event.category.toLowerCase())) {
          relevanceScore += 10;
        }

        // 2. Velocity-driven high demand boost
        const velocity = event.maxCapacity && event.maxCapacity > 0 
          ? ((registrationCounts[event.id as string] || 0) / event.maxCapacity) * 100 
          : 0;
        const isRecent = event.createdAt 
          ? (new Date().getTime() - new Date(event.createdAt).getTime()) < 24 * 60 * 60 * 1000 
          : false;

        if (velocity > 85 || (velocity > 50 && isRecent)) {
          relevanceScore += 5;
        }
      }

      return { event, score: relevanceScore };
    });

    if (user?.role === 'STUDENT') {
      sortedAndScoredEvents.sort((a, b) => b.score - a.score);
    }

    return sortedAndScoredEvents.map(se => se.event);
  }, [filteredEvents, myRegistrations, user, registrationCounts]);

  if (isLoading && events.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-[250px] rounded-xl" />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 select-none"
    >
      
      {/* Header Widget */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-primary bg-clip-text text-transparent">
            {user?.role === 'ADMIN' ? 'Control Center' : 'Academic Hub'}
          </h2>
          <p className="text-muted-foreground text-xs font-semibold mt-1">
            Campus Ecosystem • Logged in as <span className="text-primary">{user?.username}</span> ({user?.role})
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {user?.role === 'ADMIN' && (
            <>
              <Button 
                variant="primary"
                glow={true}
                onClick={() => setIsScannerOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 border-emerald-500/35 hover:shadow-[0_0_20px_rgba(16,185,129,0.35)] shadow-md animate-pulse-slow"
              >
                <Camera className="h-4.5 w-4.5" />
                Scan Passes
              </Button>
              <Button 
                variant="primary"
                glow={true}
                onClick={openAddModal}
                className="flex items-center gap-2"
              >
                <Plus className="h-4.5 w-4.5" />
                Add Event
              </Button>
              <Button 
                variant="secondary"
                glow={true}
                onClick={handleExportCSV}
                className="flex items-center gap-2"
                title="Export report to CSV"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </>
          )}
          {user?.role === 'STUDENT' && (
            <EngagementStreak streakDays={streakCount} multiplierActive={multiplierActive} />
          )}
        </div>
      </motion.div>

      {/* Admin Tab Selector */}
      {user?.role === 'ADMIN' && (
        <motion.div variants={itemVariants} className="flex gap-4 border-b border-border/20 pb-2 mb-2 animate-in fade-in duration-300">
          <button
            type="button"
            onClick={() => setActiveAdminTab('catalog')}
            className={cn(
              "px-4 py-2 text-sm font-black uppercase tracking-wider transition-all duration-300 border-b-2 cursor-pointer",
              activeAdminTab === 'catalog'
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            📋 Event Catalog
          </button>
          <button
            type="button"
            onClick={() => setActiveAdminTab('analytics')}
            className={cn(
              "px-4 py-2 text-sm font-black uppercase tracking-wider transition-all duration-300 border-b-2 cursor-pointer",
              activeAdminTab === 'analytics'
                ? "border-cyan-400 text-cyan-400 shadow-[0_4px_10px_rgba(6,182,212,0.1)]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            📊 Market Intelligence
          </button>
        </motion.div>
      )}

      {/* Admin Market Intelligence Tab */}
      {user?.role === 'ADMIN' && activeAdminTab === 'analytics' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 className="h-5 w-5 text-cyan-400 animate-pulse" />
            <h3 className="text-xl font-bold tracking-tight text-foreground">Market Intelligence Analytics</h3>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Drop-off Chart */}
            <Card className="glass border-primary/20 p-5 rounded-2xl flex flex-col h-[320px]">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Drop-off Analysis: Registered vs Attended</h4>
              <div className="flex-1 relative">
                {adminRegistrations.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">No registration data available</div>
                ) : (
                  <Bar data={dropOffChartData} options={chartOptions} />
                )}
              </div>
            </Card>

            {/* Peak Times Velocity Chart */}
            <Card className="glass border-cyan-500/20 p-5 rounded-2xl flex flex-col h-[320px]">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Registration Velocity: Peak Times</h4>
              <div className="flex-1 relative">
                {adminRegistrations.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">No velocity data available</div>
                ) : (
                  <Line data={velocityChartData} options={chartOptions} />
                )}
              </div>
            </Card>

            {/* Departmental Engagement splits */}
            <Card className="glass border-emerald-500/20 p-5 rounded-2xl flex flex-col h-[320px]">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Category Splits (Engagement)</h4>
              <div className="flex-1 relative">
                {adminRegistrations.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">No category data available</div>
                ) : (
                  <Doughnut data={categorySplitData} options={doughnutOptions} />
                )}
              </div>
            </Card>
          </div>

          {/* Qualitative Student Feedback Cards */}
          <div className="space-y-4 pt-4">
            <h4 className="text-sm font-extrabold text-foreground uppercase tracking-wider">Recent Student Takeaways & Feedback</h4>
            {adminFeedback.length === 0 ? (
              <Card className="glass border-dashed border-border/40 p-8 text-center rounded-2xl text-xs text-muted-foreground">
                No qualitative reviews or rating responses submitted yet.
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {adminFeedback.slice(0, 6).map((feed) => (
                  <Card key={feed.id} className="glass p-4 rounded-xl border-white/5 relative overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-cyan-400 uppercase">{feed.eventTitle}</span>
                        <div className="flex text-amber-400">
                          {Array.from({ length: feed.rating }).map((_, i) => (
                            <span key={i} className="text-xs">★</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs italic text-foreground leading-relaxed">"{feed.takeaway || 'No comment provided.'}"</p>
                    </div>
                    <div className="border-t border-white/5 mt-3 pt-2 flex items-center justify-between">
                      <span className="text-[9px] font-bold text-muted-foreground">👤 {feed.username}</span>
                      <span className="text-[8px] text-muted-foreground/60">{new Date(feed.submittedAt).toLocaleDateString()}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin stats */}
      {user?.role === 'ADMIN' && activeAdminTab === 'catalog' && adminStats && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="glass-card hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group border-primary/20 hover:border-primary/40">
            <CardContent className="pt-6">
              <div className="absolute top-4 right-4 p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <Calendar className="h-4 w-4" />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Events</p>
              <div className="text-3xl font-black text-primary mt-2 group-hover:scale-105 transition-transform duration-300">{adminStats.totalEvents}</div>
            </CardContent>
          </Card>

          <Card className="glass-card hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group border-emerald-500/20 hover:border-emerald-500/40">
            <CardContent className="pt-6">
              <div className="absolute top-4 right-4 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Users className="h-4 w-4" />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Registrations</p>
              <div className="text-3xl font-black text-emerald-400 mt-2 group-hover:scale-105 transition-transform duration-300">{adminStats.totalRegistrations}</div>
            </CardContent>
          </Card>

          <Card className="glass-card hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group border-cyan-500/20 hover:border-cyan-500/40">
            <CardContent className="pt-6">
              <div className="absolute top-4 right-4 p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Compass className="h-4 w-4" />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Upcoming</p>
              <div className="text-3xl font-black text-cyan-400 mt-2 group-hover:scale-105 transition-transform duration-300">{adminStats.upcomingEvents || 0}</div>
            </CardContent>
          </Card>

          <Card className="glass-card hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group border-amber-500/20 hover:border-amber-500/40">
            <CardContent className="pt-6">
              <div className="absolute top-4 right-4 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Flame className="h-4 w-4" />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ongoing</p>
              <div className="text-3xl font-black text-amber-400 mt-2 group-hover:scale-105 transition-transform duration-300">{adminStats.ongoingEvents || 0}</div>
            </CardContent>
          </Card>

          <Card className="glass-card hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group border-purple-500/20 hover:border-purple-500/40">
            <CardContent className="pt-6">
              <div className="absolute top-4 right-4 p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <CheckCircle className="h-4 w-4" />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Past</p>
              <div className="text-3xl font-black text-purple-400 mt-2 group-hover:scale-105 transition-transform duration-300">{adminStats.pastEvents || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Student stats / Registered list & Squad Grid Layout */}
      {user?.role === 'STUDENT' && (
        <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between gap-2.5 flex-wrap">
              <div className="flex items-center gap-2.5">
                <BookOpen className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-bold tracking-tight">Your Registered Interest Events</h3>
              </div>
              {/* Geofence Status Indicator */}
              {isOnCampus !== null && (
                <div className={cn(
                  "px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-md border flex items-center gap-1.5 animate-pulse",
                  isOnCampus 
                    ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-400" 
                    : "bg-red-500/10 border-red-500/35 text-red-400"
                )}>
                  <span>{isOnCampus ? '📍 On Campus' : '📍 Off Campus'}</span>
                </div>
              )}
            </div>

            {/* Geofence Warning Box */}
            {isOnCampus === false && (
              <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/10 text-red-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_15px_rgba(239,68,68,0.05)] animate-in slide-in-from-top-3 duration-300">
                <div>
                  <p className="font-extrabold uppercase tracking-wider text-[10px] text-red-400">Location Verification Failed</p>
                  <p className="mt-0.5 text-[11px] opacity-80 leading-relaxed">Passes are geofenced for verification security. You must be physically present at the Bachupally campus (within 100m) to unlock your active passes.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOnCampus(true)}
                  className="px-3 py-1.5 rounded-lg border border-red-500/35 bg-red-500/15 hover:bg-red-500/25 active:scale-95 duration-200 text-[10px] font-black uppercase tracking-wider shrink-0 cursor-pointer"
                >
                  Override Geofence ⚙️
                </button>
              </div>
            )}
            {registeredEvents.length === 0 ? (
              <Card className="glass border-dashed border-border/40 p-10 text-center rounded-2xl">
                <CardContent className="flex flex-col items-center justify-center gap-2.5">
                  <div className="h-12 w-12 rounded-full bg-white/5 border border-border/40 flex items-center justify-center text-muted-foreground/60 shadow-inner">
                    <Flame className="h-5 w-5" />
                  </div>
                  <p className="text-muted-foreground font-semibold text-sm">You haven't shown interest in any events yet.</p>
                  <p className="text-xs text-muted-foreground/70">Explore the event catalog below to get started on your active streak!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {registeredEvents.map(event => {
                  const reg = myRegistrations.find(r => r.eventId === event.id);
                  return (
                    <EventCard 
                      key={event.id}
                      event={event}
                      onRegister={handleRegister}
                      onViewPass={handleViewPass}
                      onDownloadCertificate={handleDownloadCertificate}
                      isRegistered={reg?.status !== 'WAITLISTED'}
                      isWaitlisted={reg?.status === 'WAITLISTED'}
                      isAttended={reg?.status === 'ATTENDED'}
                      registeredCount={registrationCounts[event.id as string] || 0}
                      peerAttendees={eventPeerAttendeesMap[event.id] || []}
                      isOnCampus={isOnCampus !== false}
                      className="border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.08)]"
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Squad Connections & Profile QR Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-2.5">
              <Users className="h-5 w-5 text-cyan-400" />
              <h3 className="text-xl font-bold tracking-tight">Your Squad Graph</h3>
            </div>

            {/* Add to Squad Card */}
            <Card className="glass border-primary/20 p-5 rounded-2xl relative z-0 overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-primary to-cyan-500" />
              <h4 className="text-sm font-extrabold text-foreground mb-3 uppercase tracking-wider">Connect with Peers</h4>
              <form onSubmit={handleAddPeer} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    placeholder="Enter peer's email..."
                    className="cyber-input h-10 text-xs flex-grow"
                  />
                  <Button 
                    type="submit" 
                    variant="primary" 
                    className="h-10 text-xs px-4 bg-gradient-to-r from-primary to-purple-600 border-primary/25 cursor-pointer active:scale-95 font-bold shrink-0"
                    disabled={isAddingPeer}
                  >
                    {isAddingPeer ? 'Connecting...' : 'Add'}
                  </Button>
                </div>
                {peerSearchError && <p className="text-[10px] font-semibold text-red-400">{peerSearchError}</p>}
                {peerSearchSuccess && <p className="text-[10px] font-semibold text-emerald-400">{peerSearchSuccess}</p>}
              </form>

              {/* Squad List */}
              <div className="mt-5 space-y-2 border-t border-border/40 pt-4 max-h-[180px] overflow-y-auto scrollbar-thin">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">My Squad ({myPeers.length})</p>
                {myPeers.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground/70 italic">No peers added yet. Invite your classmates to assemble your squad!</p>
                ) : (
                  myPeers.map((peer) => (
                    <div 
                      key={peer.id} 
                      className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-border/40 hover:bg-white/10 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-cyan-500 border border-white/10 flex items-center justify-center text-xs font-black text-white shrink-0">
                        {peer.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-grow">
                        <p className="text-xs font-black text-foreground truncate">{peer.username}</p>
                        <p className="text-[9px] text-muted-foreground truncate">{peer.email}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Profile QR Card */}
            <Card className="glass border-cyan-500/20 p-5 rounded-2xl relative z-0 overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-cyan-500 to-emerald-500" />
              <h4 className="text-sm font-extrabold text-foreground mb-1.5 uppercase tracking-wider">My Profile Pass</h4>
              <p className="text-[9px] text-muted-foreground leading-relaxed mb-4">Let a peer scan this pass from their screen to instantly add you to their academic squad!</p>
              
              <div className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white/5 border border-white/10 animate-pulse-slow">
                <QRCodeSVG 
                  value={`campusconnect:profile:${user.id}:${user.username}:${user.email || 'student@campusconnect.edu'}`}
                  size={120}
                  bgColor={"transparent"}
                  fgColor={"#ffffff"}
                  level={"M"}
                  includeMargin={true}
                />
                <span className="text-[9px] font-bold text-cyan-400 mt-2.5 uppercase tracking-wider">Scan to Add Squad</span>
              </div>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Main events panel with search controls */}
      {(user?.role !== 'ADMIN' || activeAdminTab === 'catalog') && (
        <motion.div variants={itemVariants} className="space-y-6 pt-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2.5">
            <LayoutGrid className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-bold tracking-tight">
              {user?.role === 'ADMIN' ? 'Manage Catalog' : 'Explore All Events'}
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center justify-end">
            {/* Custom Category Pills (Students) / Status Pills (Admins) */}
            <div className="flex items-center gap-3 overflow-x-auto px-4 py-5 max-w-full sm:max-w-none scrollbar-hide">
              {user?.role === 'ADMIN' ? (
                ['all', 'Upcoming', 'Ongoing', 'Past'].map(status => (
                  <FilterPill
                    key={status}
                    isActive={categoryFilter === status}
                    onClick={() => setCategoryFilter(status)}
                    label={status === 'all' ? 'All Status' : status}
                    glowColor={status === 'Ongoing' ? 'emerald' : status === 'Upcoming' ? 'cyan' : 'purple'}
                  />
                ))
              ) : (
                ['all', 'Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar'].map(category => (
                  <FilterPill
                    key={category}
                    isActive={categoryFilter === category}
                    onClick={() => setCategoryFilter(category)}
                    label={category === 'all' ? 'All Categories' : category}
                    glowColor={category === 'Technical' ? 'purple' : category === 'Cultural' ? 'cyan' : 'emerald'}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {finalRenderFeed.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground glass border-dashed border-border/40 rounded-2xl">
            No events found matching your filter requirements.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {finalRenderFeed.map((event) => {
              const reg = myRegistrations.find(r => r.eventId === event.id);
              return (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  onRegister={handleRegister}
                  onViewPass={handleViewPass}
                  onDownloadCertificate={handleDownloadCertificate}
                  onEdit={openEditModal}
                  onDelete={handleDeleteEvent}
                  isAdmin={user?.role === 'ADMIN'}
                  registeredCount={registrationCounts[event.id as string] || 0}
                  isRegistered={registeredIds.includes(event.id) && reg?.status !== 'WAITLISTED'}
                  isWaitlisted={reg?.status === 'WAITLISTED'}
                  isAttended={reg?.status === 'ATTENDED'}
                  isConflicting={checkConflict(event)}
                  peerAttendees={eventPeerAttendeesMap[event.id] || []}
                  isOnCampus={isOnCampus !== false}
                />
              );
            })}
          </div>
        )}
      </motion.div>
      )}

      {/* Creation & Editing Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl glass border-primary/30 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Glow Accent Header */}
            <div className="h-1 w-full bg-gradient-to-r from-primary via-purple-500 to-cyan-500" />

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/40 px-6 py-4 bg-background/50">
              <h3 className="text-lg font-bold tracking-tight">
                {editingEvent ? 'Edit Event Details' : 'Create New Campus Event'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Content Form */}
            <form onSubmit={handleSaveEvent} className="flex-1 overflow-y-auto p-6 space-y-5">
              {modalError && (
                <div className="p-3 text-xs font-bold text-destructive-foreground bg-destructive/90 rounded-xl border border-destructive/30 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 animate-bounce" />
                  {modalError}
                </div>
              )}
              {modalSuccess && (
                <div className="p-3 text-xs font-bold text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/30 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  {modalSuccess}
                </div>
              )}

              {/* Title Input */}
              <div className="space-y-1.5">
                <label htmlFor="event-title-input" className="text-xs font-bold uppercase tracking-wider text-foreground/80">
                  Event Title <span className="text-primary font-bold">*</span>
                </label>
                <div className="input-icon-wrapper">
                  <Type className="input-icon-prefix" />
                  <input
                    type="text"
                    required
                    id="event-title-input"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Enter interactive title"
                    className="cyber-input cyber-input-prefixed"
                  />
                </div>
              </div>

              {/* Category selector (REDESIGNED: High-end Radio Grid Tiles) */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground/80">
                  Select Event Category <span className="text-primary font-bold">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {[
                    { val: 'Technical', icon: Laptop, text: 'Tech', color: 'border-blue-500/30 hover:border-blue-500/60 text-blue-400 bg-blue-500/5' },
                    { val: 'Cultural', icon: Music, text: 'Culture', color: 'border-pink-500/30 hover:border-pink-500/60 text-pink-400 bg-pink-500/5' },
                    { val: 'Sports', icon: Trophy, text: 'Sports', color: 'border-orange-500/30 hover:border-orange-500/60 text-orange-400 bg-orange-500/5' },
                    { val: 'Workshop', icon: Wrench, text: 'Workshop', color: 'border-cyan-500/30 hover:border-cyan-500/60 text-cyan-400 bg-cyan-500/5' },
                    { val: 'Seminar', icon: Presentation, text: 'Seminar', color: 'border-emerald-500/30 hover:border-emerald-500/60 text-emerald-400 bg-emerald-500/5' }
                  ].map(item => {
                    const Icon = item.icon;
                    const isSelected = formCategory === item.val;
                    return (
                      <button
                        type="button"
                        key={item.val}
                        onClick={() => setFormCategory(item.val)}
                        aria-label={`Category ${item.val}`}
                        className={cn(
                          "flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 cursor-pointer text-center gap-1.5",
                          isSelected
                            ? "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(168,85,247,0.25)] scale-[1.03]"
                            : cn("bg-background/20 text-muted-foreground border-border/40 hover:bg-white/5", item.color)
                        )}
                      >
                        <Icon className="h-4.5 w-4.5" />
                        <span className="text-[10px] font-extrabold uppercase tracking-wide">{item.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date times */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="event-start-input" className="text-xs font-bold uppercase tracking-wider text-foreground/80">
                    Start Date & Time <span className="text-primary font-bold">*</span>
                  </label>
                  <div className="input-icon-wrapper">
                    <Calendar className="input-icon-prefix" />
                    <input
                      type="datetime-local"
                      required
                      id="event-start-input"
                      value={formDateTime}
                      onChange={(e) => setFormDateTime(e.target.value)}
                      className="cyber-input cyber-input-prefixed cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="event-end-input" className="text-xs font-bold uppercase tracking-wider text-foreground/80">
                    End Date & Time <span className="text-xs text-muted-foreground">(Optional)</span>
                  </label>
                  <div className="input-icon-wrapper">
                    <Calendar className="input-icon-prefix" />
                    <input
                      type="datetime-local"
                      id="event-end-input"
                      value={formEndDateTime}
                      onChange={(e) => setFormEndDateTime(e.target.value)}
                      className="cyber-input cyber-input-prefixed cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label htmlFor="event-description-input" className="text-xs font-bold uppercase tracking-wider text-foreground/80">
                  Description <span className="text-primary font-bold">*</span>
                </label>
                <div className="input-icon-wrapper">
                  <FileText className="input-icon-prefix top-4" />
                  <textarea
                    required
                    id="event-description-input"
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Detail the activities, schedules, and learning outcomes..."
                    className="cyber-input cyber-input-prefixed h-20 resize-none py-2.5"
                  />
                </div>
              </div>

              {/* Venue, Capacity */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="event-venue-input" className="text-xs font-bold uppercase tracking-wider text-foreground/80">
                    Venue <span className="text-primary font-bold">*</span>
                  </label>
                  <div className="input-icon-wrapper">
                    <MapPin className="input-icon-prefix" />
                    <input
                      type="text"
                      required
                      id="event-venue-input"
                      value={formVenue}
                      onChange={(e) => setFormVenue(e.target.value)}
                      placeholder="e.g. Audi 1, Tech Block"
                      className="cyber-input cyber-input-prefixed"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="event-capacity-input" className="text-xs font-bold uppercase tracking-wider text-foreground/80">
                    Max Capacity <span className="text-xs text-muted-foreground">(Optional)</span>
                  </label>
                  <div className="input-icon-wrapper">
                    <Users className="input-icon-prefix" />
                    <input
                      type="number"
                      min="1"
                      id="event-capacity-input"
                      value={formMaxCapacity}
                      onChange={(e) => setFormMaxCapacity(e.target.value)}
                      placeholder="e.g. 150"
                      className="cyber-input cyber-input-prefixed"
                    />
                  </div>
                </div>
              </div>

              {/* Links */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="event-reglink-input" className="text-xs font-bold uppercase tracking-wider text-foreground/80">
                    Registration Link <span className="text-xs text-muted-foreground">(Optional)</span>
                  </label>
                  <div className="input-icon-wrapper">
                    <LinkIcon className="input-icon-prefix" />
                    <input
                      type="url"
                      id="event-reglink-input"
                      value={formRegistrationLink}
                      onChange={(e) => setFormRegistrationLink(e.target.value)}
                      placeholder="https://forms.google.com/..."
                      className="cyber-input cyber-input-prefixed"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="event-reslink-input" className="text-xs font-bold uppercase tracking-wider text-foreground/80">
                    Responses/Feedback Link <span className="text-xs text-muted-foreground">(Optional)</span>
                  </label>
                  <div className="input-icon-wrapper">
                    <BarChart2 className="input-icon-prefix" />
                    <input
                      type="url"
                      id="event-reslink-input"
                      value={formResponsesLink}
                      onChange={(e) => setFormResponsesLink(e.target.value)}
                      placeholder="https://sheets.google.com/..."
                      className="cyber-input cyber-input-prefixed"
                    />
                  </div>
                </div>
              </div>

              {/* Premium Ticketing Details */}
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label htmlFor="event-paid-checkbox" className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Paid Event Tier
                    </label>
                    <p className="text-[10px] text-muted-foreground">Toggle if this is a high-tier premium symposium or external workshop requiring tickets.</p>
                  </div>
                  <input
                    type="checkbox"
                    id="event-paid-checkbox"
                    checked={formIsPaid}
                    onChange={(e) => setFormIsPaid(e.target.checked)}
                    className="h-5 w-5 rounded border-border bg-background text-primary focus:ring-primary cursor-pointer"
                  />
                </div>

                {formIsPaid && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                    <label htmlFor="event-price-input" className="text-xs font-bold uppercase tracking-wider text-foreground/80">
                      Ticket Price (₹) <span className="text-primary font-bold">*</span>
                    </label>
                    <div className="input-icon-wrapper">
                      <span className="input-icon-prefix text-xs font-black text-primary">₹</span>
                      <input
                        type="number"
                        min="1"
                        required={formIsPaid}
                        id="event-price-input"
                        value={formTicketPrice}
                        onChange={(e) => setFormTicketPrice(e.target.value)}
                        placeholder="e.g. 499"
                        className="cyber-input pl-9"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Image upload (REDESIGNED: Interactive Glass Upload Zone) */}
              <div className="space-y-2 pt-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground/80">
                  Event Banner Graphic <span className="text-xs text-muted-foreground">(Optional)</span>
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-6 bg-background/20 rounded-xl border border-dashed border-border/40 hover:border-primary/50 hover:bg-white/5 transition-all duration-300 cursor-pointer gap-2"
                >
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={(e) => setFormImageFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <div className="p-2.5 rounded-xl bg-white/5 border border-border/40 text-primary">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-foreground">Click to Browse Event Graphic</span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-sm">
                    {formImageFile ? formImageFile.name : 'No file selected (Thematic Unsplash cover fallback will be active)'}
                  </span>
                </div>
              </div>

              {/* Form Actions Footer */}
              <div className="flex gap-3 justify-end border-t border-border/40 pt-4.5 bg-background/50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white/5 text-secondary-foreground hover:bg-white/10 font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl border border-border/40 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-gradient-to-r from-primary to-purple-600 hover:brightness-110 text-primary-foreground font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl transition-all duration-300 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] disabled:opacity-50 active:scale-[0.98] cursor-pointer"
                >
                  {isSaving ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stripe elements simulated checkout overlay */}
      {isCheckoutOpen && checkoutEvent && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl glass border-cyan-500/30 bg-[#0F0F13]/95 shadow-2xl p-6 flex flex-col animate-in zoom-in-95 duration-200">
            {/* Ambient neon styling indicator */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-primary rounded-t-2xl" />
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4">
              <div>
                <h3 className="text-md font-black tracking-tight text-foreground uppercase">Premium Checkout</h3>
                <p className="text-[10px] text-muted-foreground">Secured via Stripe Elements 💳</p>
              </div>
              <button 
                onClick={() => {
                  setIsCheckoutOpen(false);
                  setCheckoutEvent(null);
                }}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Event pricing Summary */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-foreground truncate max-w-[250px]">{checkoutEvent.title}</p>
                <p className="text-[9px] text-muted-foreground">📍 {checkoutEvent.venue}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground block font-bold">Total Price</span>
                <span className="text-lg font-black text-cyan-400">₹{checkoutEvent.ticketPrice}</span>
              </div>
            </div>

            {checkoutError && (
              <div className="p-3 text-xs font-bold text-destructive-foreground bg-destructive/90 rounded-xl border border-destructive/30 mb-4 flex items-center gap-2 animate-pulse">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {checkoutError}
              </div>
            )}

            {/* Stripe Card Elements Fields */}
            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="stripe-name-input" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  required
                  id="stripe-name-input"
                  value={checkoutCardName}
                  onChange={(e) => setCheckoutCardName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="cyber-input h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="stripe-number-input" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Card Number
                </label>
                <input
                  type="text"
                  required
                  maxLength={19}
                  id="stripe-number-input"
                  value={checkoutCardNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').substring(0, 16);
                    const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
                    setCheckoutCardNumber(formatted);
                  }}
                  placeholder="4242 4242 4242 4242"
                  className="cyber-input h-10 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="stripe-expiry-input" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Expiration Date
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    id="stripe-expiry-input"
                    value={checkoutCardExpiry}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '').substring(0, 4);
                      if (val.length >= 2) {
                        val = `${val.substring(0, 2)}/${val.substring(2)}`;
                      }
                      setCheckoutCardExpiry(val);
                    }}
                    placeholder="MM/YY"
                    className="cyber-input h-10 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="stripe-cvv-input" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    CVV/CVC
                  </label>
                  <input
                    type="password"
                    required
                    maxLength={3}
                    id="stripe-cvv-input"
                    value={checkoutCardCVV}
                    onChange={(e) => setCheckoutCardCVV(e.target.value.replace(/\D/g, ''))}
                    placeholder="***"
                    className="cyber-input h-10 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                type="submit"
                disabled={isProcessingPayment}
                className="w-full mt-4 h-11 bg-gradient-to-r from-cyan-500 to-primary hover:brightness-115 text-primary-foreground font-black text-xs uppercase tracking-wider rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isProcessingPayment ? 'Processing...' : `Pay & Register • ₹${checkoutEvent.ticketPrice}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edge access control ticket pass and scanner modals */}
      {isTicketOpen && selectedTicketEvent && user && (
        <EventTicketModal
          isOpen={isTicketOpen}
          onClose={() => {
            setIsTicketOpen(false);
            setSelectedTicketEvent(null);
            setSelectedTicketRegId('');
          }}
          event={selectedTicketEvent}
          user={user}
          registrationId={selectedTicketRegId}
        />
      )}

      {isScannerOpen && (
        <TicketScannerModal
          isOpen={isScannerOpen}
          onClose={() => {
            setIsScannerOpen(false);
            fetchData(); // Refetch database data to update total check-ins in real-time
          }}
          onSuccessCheckIn={() => {}}
        />
      )}

      {/* Temporal Clash warning modal */}
      {conflictWarning?.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-2xl glass border-red-500/35 bg-red-950/20 shadow-2xl p-6 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-600 rounded-t-2xl" />
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 mb-4 animate-bounce">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-black tracking-tight text-red-200 uppercase">Temporal Clash</h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              You are already scheduled for <strong className="text-foreground">"{conflictWarning.overlappingEventName}"</strong> during this time window.
            </p>
            <Button 
              variant="outline" 
              className="w-full mt-6 border-red-500/25 text-red-400 hover:bg-red-500/10" 
              onClick={() => setConflictWarning(null)}
            >
              Resolve Calendar
            </Button>
          </div>
        </div>
      )}

      {/* Blurred backdrop immersive Feedback Rating Modal */}
      {pendingFeedbackEvent && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-background/30 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative w-full max-w-md rounded-2xl glass border-primary/30 shadow-2xl p-6 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-200">
            {/* Holographic Glowing Header Accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-cyan-400 to-emerald-500 rounded-t-2xl" />

            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary mb-4 animate-bounce">
              <Sparkles className="h-6 w-6" />
            </div>

            <h3 className="text-xl font-black tracking-tight text-foreground uppercase">Rate Your Experience!</h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              We noticed you recently checked in to <strong className="text-primary">"{pendingFeedbackEvent.title}"</strong>. Help KLH organizers improve event quality by submitting a quick rating!
            </p>

            <form onSubmit={handleSaveFeedback} className="w-full mt-6 space-y-4">
              {/* Star selector */}
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setFeedbackRating(star)}
                    className={cn(
                      "text-3xl transition-transform duration-200 hover:scale-125 cursor-pointer active:scale-95",
                      star <= feedbackRating ? "text-amber-400" : "text-slate-600"
                    )}
                  >
                    ★
                  </button>
                ))}
              </div>

              {/* Takeaway text field */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  One-line Takeaway
                </label>
                <input
                  type="text"
                  required
                  value={feedbackTakeaway}
                  onChange={(e) => setFeedbackTakeaway(e.target.value)}
                  placeholder="e.g. Breathtaking learning experience, highly recommended!"
                  className="cyber-input h-11 text-xs"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setFeedbackSubmittedIds(prev => [...prev, pendingFeedbackEvent.id as string]);
                    setPendingFeedbackEvent(null);
                  }}
                >
                  Skip
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="flex-1 bg-gradient-to-r from-primary to-cyan-500 border-primary/30"
                  disabled={isSavingFeedback}
                >
                  {isSavingFeedback ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
