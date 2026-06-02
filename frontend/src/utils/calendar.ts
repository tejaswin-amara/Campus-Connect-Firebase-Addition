export function formatToICSDate(dateStr: string | Date): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = String(d.getUTCSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}T${hh}${min}${ss}Z`;
}

export function escapeICSText(text?: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

export interface ICSEventParams {
  title: string;
  description: string;
  dateTime: string;
  endDateTime?: string;
  venue: string;
  id: string | number;
}

export function generateICS(event: ICSEventParams): string {
  const startDate = formatToICSDate(event.dateTime);
  // Default end time to 2 hours after start if endDateTime is not present
  const endDate = event.endDateTime 
    ? formatToICSDate(event.endDateTime)
    : formatToICSDate(new Date(new Date(event.dateTime).getTime() + 2 * 60 * 60 * 1000));
  
  const createdDate = formatToICSDate(new Date());
  const uid = `event_${event.id}_${new Date(event.dateTime).getTime()}@campusconnect.com`;

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Campus Connect//KLH Event Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${createdDate}`,
    `CREATED:${createdDate}`,
    `LAST-MODIFIED:${createdDate}`,
    `DTSTART:${startDate}`,
    `DTEND:${endDate}`,
    `SUMMARY:${escapeICSText(event.title)}`,
    `DESCRIPTION:${escapeICSText(event.description)}`,
    `LOCATION:${escapeICSText(event.venue)}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  return icsLines.join('\r\n');
}

export function downloadICSEvent(event: ICSEventParams) {
  try {
    const icsString = generateICS(event);
    const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    const sanitizedTitle = event.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    a.href = url;
    a.download = `${sanitizedTitle}_event.ics`;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to trigger ICS download client-side:', err);
  }
}
