import type { EventData } from '../components/ui/EventCard';

/**
 * Compiles dynamic event details into a standard RFC-5545 iCalendar (.ics) string
 * and triggers a client-side browser download instantly.
 */
export function generateICS(event: EventData) {
  if (!event.dateTime) return;

  // 1. Format dates to standard iCalendar UTC format: YYYYMMDDTHHMMSSZ
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const startUTC = formatDate(event.dateTime);
  const endUTC = event.endDateTime 
    ? formatDate(event.endDateTime) 
    : formatDate(new Date(new Date(event.dateTime).getTime() + 2 * 60 * 60 * 1000).toISOString());

  // Clean and escape standard iCalendar text strings
  const cleanStr = (str?: string) => {
    if (!str) return '';
    return str
      .replace(/\\/g, '\\\\')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;')
      .replace(/\n/g, '\\n');
  };

  const stampUTC = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  // 2. Map structured event tags into calendar strings
  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Campus Connect//KLH University//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:cc-event-${event.id}@campusconnect.edu`,
    `DTSTAMP:${stampUTC}`,
    `DTSTART:${startUTC}`,
    `DTEND:${endUTC}`,
    `SUMMARY:${cleanStr(event.title)}`,
    `DESCRIPTION:${cleanStr(event.description)}`,
    `LOCATION:${cleanStr(event.venue)}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  const icsString = icsLines.join('\r\n');

  try {
    // 3. Programmatic Blob conversion and immediate browser-level file trigger
    const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Clean file name
    const sanitizedTitle = event.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    a.download = `${sanitizedTitle}_calendar_pass.ics`;
    
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

  } catch (err) {
    console.error('Error generating client-side .ics calendar invitation:', err);
  }
}
