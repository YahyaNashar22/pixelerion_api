import { motion } from 'framer-motion';

const TOTAL = 20;
const USED = 7.42;
const REMAINING = TOTAL - USED;
const PERCENT = (USED / TOTAL) * 100;

const timeEntries = [
  { desc: 'Website bug investigation', dev: 'Yahya', duration: '1h 20m', date: 'Aug 28', color: '#4285F4' },
  { desc: 'WhatsApp consultation', dev: 'Yahya', duration: '20m', date: 'Aug 27', color: '#34A853' },
  { desc: 'Developer meeting', dev: 'Yahya', duration: '45m', date: 'Aug 26', color: '#FBBC05' },
  { desc: 'Payment integration fix', dev: 'Yahya', duration: '2h 10m', date: 'Aug 24', color: '#EA4335' },
  { desc: 'Server investigation', dev: 'Yahya', duration: '1h 30m', date: 'Aug 22', color: '#4285F4' },
  { desc: 'UI adjustment', dev: 'Yahya', duration: '1h 20m', date: 'Aug 21', color: '#34A853' },
];

const recentTickets = [
  { id: 'TK-014', title: 'Payment gateway error on checkout', priority: 'High', status: 'In Progress', statusColor: '#4285F4', date: 'Aug 28' },
  { id: 'TK-013', title: 'Mobile nav menu not closing', priority: 'Normal', status: 'Completed', statusColor: '#34A853', date: 'Aug 26' },
  { id: 'TK-012', title: 'Add CSV export to reports', priority: 'Low', status: 'Estimated', statusColor: '#9b59b6', date: 'Aug 24' },
];

const priorityColor: Record<string, string> = {
  Critical: '#EA4335', High: '#FBBC05', Normal: '#4285F4', Low: '#6b7280',
};

function StatCard({ label, value, sub, color, delay }: { label: string; value: string; sub?: string; color: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="rounded-2xl p-6 relative overflow-hidden"
      style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none" style={{ background: color, opacity: 0.06, filter: 'blur(30px)', transform: 'translate(30%, -30%)' }} />
      <p className="text-xs uppercase tracking-widest text-[#6b7280] mb-3">{label}</p>
      <p className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: 'Manrope', color }}>{value}</p>
      {sub && <p className="text-xs text-[#6b7280] mt-1.5">{sub}</p>}
    </motion.div>
  );
}

export default function Dashboard() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Manrope' }}>Good morning, Acme Co. 👋</h1>
        <p className="text-[#6b7280] text-sm">Here is your support overview for August 2024.</p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Remaining Hours" value="12h 35m" sub="of 20h purchased" color="#34A853" delay={0.05} />
        <StatCard label="Used This Month" value="7h 25m" color="#4285F4" delay={0.1} />
        <StatCard label="Open Tickets" value="3" sub="1 awaiting your action" color="#FBBC05" delay={0.15} />
        <StatCard label="Support Plan" value="Premium" sub="20h / month" color="#9b59b6" delay={0.2} />
      </div>

      {/* Support consumption */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.4 }}
        className="rounded-2xl p-7"
        style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white font-semibold text-base mb-1" style={{ fontFamily: 'Manrope' }}>Support Time Consumption</h2>
            <p className="text-[#6b7280] text-sm">August 1 – August 31, 2024</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Manrope' }}>
              {Math.round(PERCENT)}%
            </span>
            <p className="text-xs text-[#6b7280]">consumed</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative h-3 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${PERCENT}%` }}
            transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #4285F4, #34A853)' }}
          />
        </div>
        <div className="flex justify-between text-xs text-[#6b7280] mb-6">
          <span>0h</span>
          <span>{TOTAL}h</span>
        </div>

        {/* Breakdown */}
        <div className="space-y-3">
          {timeEntries.map((entry, i) => {
            const durationMin = entry.duration.includes('h')
              ? parseInt(entry.duration) * 60 + (parseInt(entry.duration.split('m')[0].split(' ').pop() || '0') || 0)
              : parseInt(entry.duration);
            const barWidth = Math.min((durationMin / (TOTAL * 60)) * 100 * 4, 100);
            return (
              <div key={i} className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-[#e8e8f0] truncate pr-4">{entry.desc}</span>
                    <span className="text-sm font-medium text-white flex-shrink-0" style={{ fontFamily: 'Manrope' }}>{entry.duration}</span>
                  </div>
                  <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.8, delay: 0.6 + i * 0.05 }}
                      className="h-full rounded-full"
                      style={{ background: entry.color, opacity: 0.7 }}
                    />
                  </div>
                </div>
                <span className="text-xs text-[#4b4b60] flex-shrink-0 w-16 text-right">{entry.date}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Recent tickets */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.4 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center justify-between px-7 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="text-white font-semibold text-base" style={{ fontFamily: 'Manrope' }}>Recent Tickets</h2>
          <a href="/portal/tickets" className="text-xs text-[#4285F4] hover:text-[#6a9ff5] transition-colors">View all →</a>
        </div>
        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          {recentTickets.map((ticket) => (
            <div key={ticket.id} className="flex items-center gap-4 px-7 py-4 hover:bg-white/2 transition-colors cursor-pointer">
              <span className="text-xs font-mono text-[#6b7280] w-16 flex-shrink-0">{ticket.id}</span>
              <span className="flex-1 text-sm text-[#e8e8f0] truncate">{ticket.title}</span>
              <span className="text-xs px-2.5 py-1 rounded-lg flex-shrink-0"
                style={{ background: `${priorityColor[ticket.priority]}15`, color: priorityColor[ticket.priority] }}>
                {ticket.priority}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-lg flex-shrink-0"
                style={{ background: `${ticket.statusColor}15`, color: ticket.statusColor }}>
                {ticket.status}
              </span>
              <span className="text-xs text-[#4b4b60] flex-shrink-0 hidden sm:block">{ticket.date}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
