import type { RefObject } from 'react';
import { X, Download } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { EventData, Registration } from '../../types';

export interface AttendeePanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAttendeesEvent: EventData | null;
  attendeeSearchQuery: string;
  setAttendeeSearchQuery: (val: string) => void;
  isBulkProcessing: boolean;
  adminRegistrations: Registration[];
  handleBulkDownloadCertificates: (eventId: string | number) => void;
  handleDownloadStudentCertificate: (studentId: string, studentName: string, eventId: string | number) => void;
  modalRef: RefObject<HTMLDivElement | null>;
}

export function AttendeePanelModal({
  isOpen,
  onClose,
  selectedAttendeesEvent,
  attendeeSearchQuery,
  setAttendeeSearchQuery,
  isBulkProcessing,
  adminRegistrations,
  handleBulkDownloadCertificates,
  handleDownloadStudentCertificate,
  modalRef
}: AttendeePanelModalProps) {
  if (!isOpen || !selectedAttendeesEvent) return null;

  return (
    <div 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="attendee-panel-title"
      aria-describedby="attendee-panel-desc"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md overflow-y-auto"
    >
      <div 
        ref={modalRef} 
        tabIndex={-1} 
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl glass border-primary/30 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 outline-none"
      >
        {/* Glow Accent Header */}
        <div className="h-1 w-full bg-gradient-to-r from-primary via-purple-500 to-cyan-500" aria-hidden="true" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border/40 px-6 py-4 bg-background/50">
          <div>
            <h3 id="attendee-panel-title" className="text-lg font-bold tracking-tight text-foreground">
              Attendee Control Panel 👥
            </h3>
            <p id="attendee-panel-desc" className="text-xs text-muted-foreground mt-0.5">
              Event: <span className="text-primary font-bold">{selectedAttendeesEvent.title}</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close attendee panel"
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Toolbar */}
        <div className="p-6 pb-2 border-b border-border/20 flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Search Bar */}
          <div className="relative w-full sm:max-w-xs">
            <input
              type="text"
              id="attendee-search-input"
              value={attendeeSearchQuery}
              onChange={(e) => setAttendeeSearchQuery(e.target.value)}
              placeholder="Search by ID, Username or Status..."
              aria-label="Search attendees by name, ID or attendance status"
              className="cyber-input h-10 pl-3 pr-8 text-xs w-full"
            />
            {attendeeSearchQuery && (
              <button
                onClick={() => setAttendeeSearchQuery('')}
                aria-label="Clear search input"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer text-xs"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Bulk action buttons */}
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={isBulkProcessing || adminRegistrations.filter(r => r.eventId === selectedAttendeesEvent.id && r.status === 'ATTENDED').length === 0}
              onClick={() => handleBulkDownloadCertificates(selectedAttendeesEvent.id)}
              aria-label={isBulkProcessing ? 'Currently generating credentials' : 'Download participation certificates in bulk for all checked-in attendees'}
              className="flex-1 sm:flex-initial bg-gradient-to-r from-purple-500 to-primary hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100 text-primary-foreground font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all duration-300 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {isBulkProcessing ? 'Processing PDF...' : 'Bulk Generate Certificates'}
            </button>
          </div>
        </div>

        {/* Modal Content / Table */}
        <div className="flex-1 overflow-y-auto p-6">
          {(() => {
            const eventRegs = adminRegistrations.filter(r => r.eventId === selectedAttendeesEvent.id);
            const filteredRegs = eventRegs.filter(r => {
              const studentName = (r.username || r.userId || '').toLowerCase();
              const status = (r.status || '').toLowerCase();
              const query = attendeeSearchQuery.toLowerCase();
              return studentName.includes(query) || status.includes(query);
            });

            if (filteredRegs.length === 0) {
              return (
                <div className="text-center py-12 text-muted-foreground border-dashed border border-border/40 rounded-xl">
                  {eventRegs.length === 0 
                    ? 'No registrations found for this event yet.'
                    : 'No attendees match your search filters.'}
                </div>
              );
            }

            return (
              <div className="overflow-x-auto rounded-xl border border-border/20">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border/20 bg-muted/40 font-extrabold uppercase tracking-widest text-muted-foreground/80">
                      <th className="p-3">Student Name / ID</th>
                      <th className="p-3">Registration Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10">
                    {filteredRegs.map((reg) => {
                      const studentName = reg.username || reg.userId;
                      const regDate = reg.registeredAt 
                        ? new Date(reg.registeredAt).toLocaleDateString(undefined, {
                            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })
                        : 'N/A';
                      
                      // Style helper for status badges
                      const getStatusStyles = (stat: string) => {
                        const s = stat.toUpperCase();
                        if (s === 'ATTENDED') return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
                        if (s === 'WAITLISTED') return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
                        return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
                      };

                      return (
                        <tr key={reg.id} className="hover:bg-white/5 transition-colors duration-150">
                          <td className="p-3 font-bold text-foreground/90">{studentName}</td>
                          <td className="p-3 text-muted-foreground mono-premium">{regDate}</td>
                          <td className="p-3">
                            <span className={cn(
                              "px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md border",
                              getStatusStyles(reg.status || 'REGISTERED')
                            )}>
                              {reg.status || 'REGISTERED'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {reg.status === 'ATTENDED' ? (
                              <button
                                onClick={() => handleDownloadStudentCertificate(reg.userId, studentName, selectedAttendeesEvent.id)}
                                className="px-2.5 py-1 rounded-lg border border-cyan-500/35 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500/15 text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer hover:shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                              >
                                Certificate 🎓
                              </button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground/45 italic font-semibold">Not checked in</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>

        {/* Modal Actions Footer */}
        <div className="flex gap-3 justify-end border-t border-border/40 px-6 py-4 bg-background/50">
          <button
            type="button"
            onClick={onClose}
            className="bg-white/5 text-secondary-foreground hover:bg-white/10 font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl border border-border/40 transition-colors cursor-pointer"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
}
