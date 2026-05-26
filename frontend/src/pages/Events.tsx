import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { EventCard } from '../components/ui/EventCard';
import { Skeleton } from '../components/ui/Skeleton';
import type { EventData, Registration } from '../types';
import { db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  doc,
  runTransaction
} from 'firebase/firestore';
import { Compass, Sparkles } from 'lucide-react';

export default function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventData[]>([]);
  const [registrationCounts, setRegistrationCounts] = useState<Record<string, number>>({});
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // 1. Fetch all events from Firestore
      const eventsSnap = await getDocs(collection(db, 'events'));
      const fetchedEvents: EventData[] = eventsSnap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as EventData));

      // Sort by start date descending
      fetchedEvents.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
      setEvents(fetchedEvents);

      // 2. Fetch all registrations from Firestore
      const regsSnap = await getDocs(collection(db, 'registrations'));
      const fetchedRegistrations = regsSnap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as Registration[];

      // 3. Compute registration counts mapping
      const counts: Record<string, number> = {};
      fetchedRegistrations.forEach(r => {
        if (r.eventId) {
          counts[r.eventId] = (counts[r.eventId] || 0) + 1;
        }
      });
      setRegistrationCounts(counts);

      // 4. Map student specific registrations
      if (user) {
        const studentRegs = fetchedRegistrations.filter(r => r.userId === user.id);
        setMyRegistrations(studentRegs);
      }
    } catch (err) {
      console.error('Failed to fetch events data from Firestore:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleRegister = async (eventId: string | number) => {
    if (!user) return;
    try {
      const event = events.find(e => e.id === eventId);
      if (!event) return;

      await runTransaction(db, async (transaction) => {
        // 1. Defensively read the event document in this atomic transaction
        const eventRef = doc(db, 'events', eventId.toString());
        const eventSnap = await transaction.get(eventRef);
        if (!eventSnap.exists()) {
          throw new Error('Event document does not exist.');
        }

        const eventData = eventSnap.data();
        const maxCapacity = eventData.maxCapacity ? parseInt(eventData.maxCapacity.toString()) : Infinity;
        const currentCount = eventData.registeredCount ? parseInt(eventData.registeredCount.toString()) : 0;

        // 2. Prevent race condition capacity breach
        if (currentCount >= maxCapacity) {
          throw new Error('EVENT_FULL');
        }

        // 3. Prevent duplicate registrations at database primary key layer
        const regId = `${user.id}_${eventId}`;
        const regRef = doc(db, 'registrations', regId);
        const regSnap = await transaction.get(regRef);
        if (regSnap.exists()) {
          throw new Error('ALREADY_REGISTERED');
        }

        // 4. Update the event counter atomic increment
        transaction.update(eventRef, {
          registeredCount: currentCount + 1
        });

        // 5. Commit atomic registration document
        transaction.set(regRef, {
          userId: user.id,
          eventId: eventId,
          registeredAt: new Date().toISOString(),
          status: 'REGISTERED',
          event: event
        });
      });

      alert('Successfully registered interest!');
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
  };

  const registeredIds = myRegistrations.map(r => r.eventId).filter(Boolean);

  const checkConflict = (event: EventData) => {
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
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 select-none">
        <Skeleton className="h-10 w-[200px] rounded-xl" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-96 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 select-none">
      
      {/* Header Widget */}
      <div className="flex justify-between items-end border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1.5">
            <Compass className="h-4 w-4" />
            Discover Programs
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-primary bg-clip-text text-transparent">
            All Campus Events
          </h2>
          <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
            Discover, review details, and register interest instantly with real-time schedule conflict grids.
          </p>
        </div>
      </div>

      {/* Events Grid layout */}
      {events.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground glass border-dashed border-border/40 rounded-2xl flex flex-col items-center justify-center gap-2">
          <Sparkles className="h-10 w-10 text-muted-foreground/50 animate-pulse" />
          <p className="font-semibold text-sm">No campus events are currently scheduled.</p>
          <p className="text-xs text-muted-foreground/80">Check back later or contact your system administrator.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard 
              key={event.id} 
              event={event} 
              onRegister={handleRegister}
              isAdmin={user?.role === 'ADMIN'}
              registeredCount={registrationCounts[event.id as string] || 0}
              isRegistered={registeredIds.includes(event.id)}
              isConflicting={checkConflict(event)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
