import { useParams, useNavigate } from 'react-router';
import { motion } from 'framer-motion';

const tickets: Record<string, { id: string; title: string; category: string; priority: string; status: string; dev: string; estimated: string; consumed: string; date: string; desc: string }> = {
  '014': {
    id: 'TK-014', title: 'Payment gateway error on checkout', category: 'Bug', priority: 'High',
    status: 'In Progress', dev: 'Yahya', estimated: '2h 00m', consumed: '1h 15m', date: 'Aug 28, 2024',
    desc: 'When customers complete the checkout process and reach the payment step, the Stripe payment form throws a "card_error" even with valid test cards. The issue appeared after the last deployment.',
  },
  '013': {
    id: 'TK-013', title: 'Mobile navigation menu not closing on iOS', category: 'Bug', priority: 'Normal',
    status: 'Completed', dev: 'Yahya', estimated: '45m', consumed: '40m', date: 'Aug 26, 2024',
    desc: 'On iOS 17+ Safari, tapping outside the navigation drawer does not close the menu. Android and desktop are unaffected.',
  },
};

const timeline = [
  { from: 'You', time: 'Aug 28 · 09:14', msg: 'Customers are getting an error at checkout. This is happening on all orders. Very urgent.', isClient: true },
  { from: 'Yahya · Pixelerion', time: 'Aug 28 · 09:32', msg: "I've reproduced the issue. It's a Stripe API version mismatch introduced in the last deployment. Working on a fix now.", isClient: false },
  { from: 'Yahya · Pixelerion', time: 'Aug 28 · 10:45', msg: "Fix deployed to staging. Can you confirm it works on your end before I push to production?", isClient: false },
  { from: 'You', time: 'Aug 28 · 11:02', msg: "Tested on staging — payments are going through correctly now. Please push to production.", isClient: true },
];

const statusColors: Record<string, string> = {
  'In Progress': '#4285F4', 'Completed': '#34A853', 'New': '#4285F4', 'Estimated': '#9b59b6',
};

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const ticket = tickets[id ?? ''] ?? tickets['014'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <button onClick={() => navigate('/portal/tickets')} className="flex items-center gap-2 text-sm text-[#6b7280] hover:text-[#9898a8] transition-colors mb-4">
          ← Back to Tickets
        </button>
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-mono text-[#6b7280]">{ticket.id}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-lg" style={{ background: `${statusColors[ticket.status] ?? '#6b7280'}18`, color: statusColors[ticket.status] ?? '#6b7280' }}>
                {ticket.status}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'Manrope' }}>{ticket.title}</h1>
            <p className="text-sm text-[#6b7280]">{ticket.date} · {ticket.category} · {ticket.priority} priority · Developer: {ticket.dev}</p>
          </div>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: 'Estimated', value: ticket.estimated, color: '#FBBC05' },
          { label: 'Consumed', value: ticket.consumed, color: '#4285F4' },
          { label: 'Developer', value: ticket.dev, color: '#34A853' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl p-5" style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs uppercase tracking-widest text-[#6b7280] mb-2">{stat.label}</p>
            <p className="text-lg font-bold" style={{ fontFamily: 'Manrope', color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Description */}
      <div className="rounded-2xl p-6" style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.07)' }}>
        <h2 className="text-sm font-semibold text-white mb-3" style={{ fontFamily: 'Manrope' }}>Description</h2>
        <p className="text-sm text-[#9898a8] leading-relaxed">{ticket.desc}</p>
      </div>

      {/* Estimate approval (if estimated) */}
      {ticket.status === 'Estimated' && (
        <div className="rounded-2xl p-6" style={{ background: 'rgba(155,89,182,0.08)', border: '1px solid rgba(155,89,182,0.25)' }}>
          <h2 className="text-sm font-semibold text-white mb-2" style={{ fontFamily: 'Manrope' }}>Developer Estimate</h2>
          <p className="text-sm text-[#9898a8] mb-4">Estimated effort: <span className="text-white font-medium">{ticket.estimated}</span>. This will consume from your support hours upon approval.</p>
          <div className="flex gap-3">
            <button className="px-5 py-2 rounded-lg text-sm font-medium text-white" style={{ background: '#34A853', fontFamily: 'Manrope' }}>Approve</button>
            <button className="px-5 py-2 rounded-lg text-sm font-medium text-[#EA4335]" style={{ background: 'rgba(234,67,53,0.1)', border: '1px solid rgba(234,67,53,0.3)' }}>Decline</button>
          </div>
        </div>
      )}

      {/* Conversation */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="text-sm font-semibold text-white" style={{ fontFamily: 'Manrope' }}>Conversation</h2>
        </div>
        <div className="p-6 space-y-5">
          {timeline.map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.isClient ? 'flex-row-reverse' : ''}`}>
              <div
                className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold"
                style={{ background: msg.isClient ? 'rgba(66,133,244,0.2)' : 'rgba(52,168,83,0.2)', color: msg.isClient ? '#4285F4' : '#34A853', fontFamily: 'Manrope' }}
              >
                {msg.isClient ? 'AC' : 'Y'}
              </div>
              <div className={`flex-1 max-w-[80%] ${msg.isClient ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-medium text-[#9898a8]">{msg.from}</span>
                  <span className="text-xs text-[#4b4b60]">{msg.time}</span>
                </div>
                <div
                  className="px-4 py-3 rounded-xl text-sm text-[#e8e8f0] leading-relaxed"
                  style={{
                    background: msg.isClient ? 'rgba(66,133,244,0.1)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${msg.isClient ? 'rgba(66,133,244,0.2)' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  {msg.msg}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 pb-6">
          <div className="flex gap-3">
            <input
              placeholder="Write a reply..."
              className="flex-1 px-4 py-3 rounded-xl text-sm text-white placeholder-[#4b4b60] outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', fontFamily: 'Inter' }}
            />
            <button className="px-4 py-3 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #4285F4, #34A853)', fontFamily: 'Manrope' }}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
