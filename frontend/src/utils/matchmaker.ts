import type { EventData, Registration, PeerRelation } from '../types';

export interface RecommendedEvent extends EventData {
  matchScore: number;
  matchReasons: string[];
}

export function getRecommendations(
  events: EventData[],
  myRegistrations: Registration[],
  myPeers: PeerRelation[],
  peerRegistrations: Registration[]
): RecommendedEvent[] {
  // 1. Exclude events the student is already registered for
  const registeredEventIds = new Set(
    myRegistrations.map((r) => String(r.eventId))
  );

  // Focus only on upcoming events
  const now = new Date();
  const availableEvents = events.filter(
    (e) => !registeredEventIds.has(String(e.id)) && new Date(e.dateTime) > now
  );

  // 2. Count category affinity weights (ATTENDED has higher priority/weight)
  const categoryWeights: Record<string, number> = {};
  myRegistrations.forEach((r) => {
    const category = r.event?.category;
    if (category) {
      const weight = r.status === 'ATTENDED' ? 3 : 1;
      categoryWeights[category] = (categoryWeights[category] || 0) + weight;
    }
  });

  // 3. Compute matching scores
  const scoredEvents: RecommendedEvent[] = availableEvents.map((event) => {
    let score = 0;
    const reasons: string[] = [];

    // Category affinity matches
    const catWeight = categoryWeights[event.category] || 0;
    if (catWeight > 0) {
      score += catWeight * 6;
      reasons.push(`Based on your interest in ${event.category} events`);
    }

    // Squad dynamics matches
    const squadAttendeeIds = new Set(myPeers.map((p) => p.userId));
    const peerRegistrationsForEvent = peerRegistrations.filter(
      (pr) => String(pr.eventId) === String(event.id) && squadAttendeeIds.has(pr.userId)
    );
    const squadCount = peerRegistrationsForEvent.length;

    if (squadCount > 0) {
      score += squadCount * 12;
      reasons.push(
        squadCount === 1
          ? `1 member of your peer squad is attending`
          : `${squadCount} members of your peer squad are attending`
      );
    }

    // Popularity velocity checks
    if (event.maxCapacity && event.maxCapacity > 0) {
      const registeredCount = event.registeredCount || 0;
      const fillRate = registeredCount / event.maxCapacity;
      if (fillRate > 0.8) {
        score += 8;
        reasons.push('Popular choice: seats filling up quickly');
      }
    }

    return {
      ...event,
      matchScore: score,
      matchReasons: reasons.length > 0 ? reasons : ['Recommended for you']
    };
  });

  // 4. Sort and return top 3 relevant suggestions
  return scoredEvents
    .filter((se) => se.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);
}
