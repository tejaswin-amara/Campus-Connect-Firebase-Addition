import { useCallback } from 'react';
import type { EventData } from '../components/ui/EventCard';

interface RegistrationItem {
  id: string;
  eventId: string | number;
  userId: string;
  status: string;
  event?: EventData;
}

export function useTemporalConflict(myRegistrations: RegistrationItem[]) {
  const checkConflict = useCallback((newEvent: EventData): { isConflicting: boolean; overlappingEventName?: string } => {
    if (!newEvent.dateTime) return { isConflicting: false };

    // 1. Convert new event times to Unix timestamps
    const newStart = new Date(newEvent.dateTime).getTime();
    if (isNaN(newStart)) return { isConflicting: false };

    const newEnd = newEvent.endDateTime 
      ? new Date(newEvent.endDateTime).getTime() 
      : newStart + 2 * 60 * 60 * 1000; // Default 2 hours if endDateTime is missing

    // 2. Iterate through user's active registrations (skip waitlisted or cancelled registrations)
    for (const reg of myRegistrations) {
      if (reg.status === 'WAITLISTED') continue; // Waitlisted tickets don't block schedule

      const regEvent = reg.event;
      if (!regEvent || !regEvent.dateTime) continue;

      // Skip checking if it is the exact same event
      if (String(regEvent.id) === String(newEvent.id)) continue;

      const existingStart = new Date(regEvent.dateTime).getTime();
      if (isNaN(existingStart)) continue;

      const existingEnd = regEvent.endDateTime 
        ? new Date(regEvent.endDateTime).getTime() 
        : existingStart + 2 * 60 * 60 * 1000;

      // Bounding box temporal collision formula:
      // Overlap exists if: newStart < existingEnd AND existingStart < newEnd
      if (newStart < existingEnd && existingStart < newEnd) {
        return {
          isConflicting: true,
          overlappingEventName: regEvent.title
        };
      }
    }

    return { isConflicting: false };
  }, [myRegistrations]);

  return { checkConflict };
}
