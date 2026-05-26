import { useMemo } from 'react';
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
import { Card } from '../ui/Card';
import { BarChart2 } from 'lucide-react';

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

interface AdminAnalyticsPanelProps {
  events: any[];
  registrationCounts: Record<string, number>;
  adminRegistrations: any[];
  adminFeedback: any[];
}

export default function AdminAnalyticsPanel({
  events,
  registrationCounts,
  adminRegistrations,
  adminFeedback
}: AdminAnalyticsPanelProps) {

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { size: 9 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 9 } }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8',
          font: { weight: 'bold' as const, size: 9 }
        }
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

  return (
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
  );
}
