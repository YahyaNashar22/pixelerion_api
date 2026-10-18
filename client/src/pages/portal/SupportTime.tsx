import { motion } from 'framer-motion';

const activities = [
  { date: 'August 28', entries: [
    { desc: 'Payment gateway debugging', dev: 'Yahya', duration: '1h 15m', start: '09:30', ticket: 'TK-014', color: '#EA4335' },
    { desc: 'Client meeting — monthly review', dev: 'Yahya', duration: '45m', start: '14:00', ticket: '—', color: '#4285F4' },
    { desc: 'WhatsApp support session', dev: 'Yahya', duration: '15m', start: '16:30', ticket: '—', color: '#34A853' },
  ]},
  { date: 'August 26', entries: [
    { desc: 'Mobile iOS navigation fix', dev: 'Yahya', duration: '40m', start: '10:00', ticket: 'TK-013', color: '#34A853' },
  ]},
  { date: 'August 24', entries: [
    { desc: 'WhatsApp API webhook debugging', dev: 'Yahya', duration: '30m', start: '11:15', ticket: 'TK-011', color: '#FBBC05' },
    { desc: 'Server configuration review', dev: 'Yahya', duration: '40m', start: '14:45', ticket: '—', color: '#4285F4' },
  ]},
  { date: 'August 19', entries: [
    { desc: 'SSL certificate renewal and configuration', dev: 'Yahya', duration: '1h 30m', start: '09:00', ticket: 'TK-010', color: '#EA4335' },
  ]},
];

const totalMinutes = 7 * 60 + 25;
const totalHours = 20;
const pct = (totalMinutes / (totalHours * 60)) * 100;

export default function SupportTime() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Manrope' }}>Support Time</h1>
        <p className="text-[#6b7280] text-sm">Complete breakdown of every support minute spent this billing period.</p>
      </motion.div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4"
      >
        {[
          { label: 'Purchased', value: '20h 00m', color: '#9898a8' },
          { label: 'Consumed', value: '7h 25m', color: '#FBBC05' },
          { label: 'Remaining', value: '12h 35m', color: '#34A853' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-5 text-center" style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs uppercase tracking-widest text-[#6b7280] mb-2">{s.label}</p>
            <p className="text-xl font-bold" style={{ fontFamily: 'Manrope', color: s.color }}>{s.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Big progress */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="rounded-2xl p-6" style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex justify-between text-xs text-[#6b7280] mb-3">
          <span>0h used</span>
          <span className="text-white font-medium" style={{ fontFamily: 'Manrope' }}>{Math.round(pct)}% consumed</span>
          <span>20h total</span>
        </div>
        <div className="h-4 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #4285F4, #FBBC05)' }}
          />
        </div>
        <p className="text-xs text-[#6b7280] mt-3">Billing period: August 1 – August 31, 2024</p>
      </motion.div>

      {/* Activity log */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-base font-semibold text-white mb-4" style={{ fontFamily: 'Manrope' }}>Activity Log</h2>
        <div className="space-y-6">
          {activities.map((group, gi) => (
            <div key={group.date}>
              <p className="text-xs uppercase tracking-widest text-[#4b4b60] mb-3">{group.date}</p>
              <div className="rounded-2xl overflow-hidden" style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.07)' }}>
                {group.entries.map((entry, ei) => (
                  <div
                    key={ei}
                    className="flex items-center gap-4 px-6 py-4 border-b last:border-b-0"
                    style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#e8e8f0]">{entry.desc}</p>
                      <p className="text-xs text-[#6b7280] mt-0.5">{entry.dev} · Start: {entry.start} · {entry.ticket !== '—' ? `Ref: ${entry.ticket}` : 'No ticket'}</p>
                    </div>
                    <span className="text-sm font-semibold text-white flex-shrink-0" style={{ fontFamily: 'Manrope' }}>{entry.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
