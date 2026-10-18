import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router';

const tickets = [
  { id: 'TK-014', title: 'Payment gateway error on checkout', category: 'Bug', priority: 'High', status: 'In Progress', dev: 'Yahya', estimated: '2h 00m', consumed: '1h 15m', date: 'Aug 28, 2024' },
  { id: 'TK-013', title: 'Mobile navigation menu not closing on iOS', category: 'Bug', priority: 'Normal', status: 'Completed', dev: 'Yahya', estimated: '45m', consumed: '40m', date: 'Aug 26, 2024' },
  { id: 'TK-012', title: 'Add CSV export to reports dashboard', category: 'Feature Request', priority: 'Low', status: 'Estimated', dev: 'Yahya', estimated: '3h 00m', consumed: '—', date: 'Aug 24, 2024' },
  { id: 'TK-011', title: 'WhatsApp API webhook not firing', category: 'Technical Support', priority: 'High', status: 'Waiting for Customer', dev: 'Yahya', estimated: '1h 00m', consumed: '30m', date: 'Aug 22, 2024' },
  { id: 'TK-010', title: 'Update server SSL certificate', category: 'Infrastructure', priority: 'Critical', status: 'Completed', dev: 'Yahya', estimated: '1h 30m', consumed: '1h 30m', date: 'Aug 19, 2024' },
  { id: 'TK-009', title: 'Schedule product roadmap review', category: 'Meeting Request', priority: 'Low', status: 'New', dev: '—', estimated: '—', consumed: '—', date: 'Aug 28, 2024' },
];

const statusColors: Record<string, string> = {
  'New': '#4285F4',
  'Waiting for Review': '#FBBC05',
  'Estimated': '#9b59b6',
  'Approved': '#34A853',
  'In Progress': '#4285F4',
  'Waiting for Customer': '#FBBC05',
  'Completed': '#34A853',
  'Cancelled': '#EA4335',
};

const priorityColors: Record<string, string> = {
  Critical: '#EA4335', High: '#FBBC05', Normal: '#4285F4', Low: '#6b7280',
};

const statuses = ['All', 'New', 'In Progress', 'Estimated', 'Waiting for Customer', 'Completed', 'Cancelled'];

export default function Tickets() {
  const [filter, setFilter] = useState('All');
  const navigate = useNavigate();

  const filtered = filter === 'All' ? tickets : tickets.filter((t) => t.status === filter);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Manrope' }}>Tickets</h1>
        <p className="text-[#6b7280] text-sm">All support requests and their current status.</p>
      </motion.div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className="px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{
              background: filter === s ? 'rgba(66,133,244,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${filter === s ? 'rgba(66,133,244,0.4)' : 'rgba(255,255,255,0.08)'}`,
              color: filter === s ? '#4285F4' : '#6b7280',
              fontFamily: 'Inter',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* Header */}
        <div className="hidden md:grid px-6 py-3 border-b text-xs uppercase tracking-wider text-[#4b4b60]"
          style={{ borderColor: 'rgba(255,255,255,0.06)', gridTemplateColumns: '80px 1fr 100px 80px 100px 90px 90px 100px' }}>
          <span>ID</span><span>Title</span><span>Category</span><span>Priority</span>
          <span>Status</span><span>Developer</span><span>Estimated</span><span>Date</span>
        </div>

        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          {filtered.map((ticket, i) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => navigate(`/portal/tickets/${ticket.id.replace('TK-', '')}`)}
              className="hidden md:grid px-6 py-4 hover:bg-white/2 cursor-pointer transition-colors items-center gap-2"
              style={{ gridTemplateColumns: '80px 1fr 100px 80px 100px 90px 90px 100px' }}
            >
              <span className="text-xs font-mono text-[#6b7280]">{ticket.id}</span>
              <span className="text-sm text-[#e8e8f0] truncate pr-4">{ticket.title}</span>
              <span className="text-xs text-[#6b7280] truncate">{ticket.category}</span>
              <span className="text-xs px-2 py-0.5 rounded-md w-fit"
                style={{ background: `${priorityColors[ticket.priority]}15`, color: priorityColors[ticket.priority] }}>
                {ticket.priority}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md w-fit"
                style={{ background: `${statusColors[ticket.status] ?? '#6b7280'}15`, color: statusColors[ticket.status] ?? '#6b7280' }}>
                {ticket.status}
              </span>
              <span className="text-xs text-[#6b7280]">{ticket.dev}</span>
              <span className="text-xs text-[#9898a8]">{ticket.estimated}</span>
              <span className="text-xs text-[#4b4b60]">{ticket.date}</span>
            </motion.div>
          ))}
          {/* Mobile cards */}
          {filtered.map((ticket, i) => (
            <motion.div
              key={`m-${ticket.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => navigate(`/portal/tickets/${ticket.id.replace('TK-', '')}`)}
              className="md:hidden p-5 hover:bg-white/2 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-mono text-[#6b7280]">{ticket.id}</span>
                <span className="text-xs px-2 py-0.5 rounded-md"
                  style={{ background: `${statusColors[ticket.status] ?? '#6b7280'}15`, color: statusColors[ticket.status] ?? '#6b7280' }}>
                  {ticket.status}
                </span>
              </div>
              <p className="text-sm text-[#e8e8f0] mb-2">{ticket.title}</p>
              <div className="flex items-center gap-3 text-xs text-[#6b7280]">
                <span>{ticket.category}</span>
                <span>·</span>
                <span style={{ color: priorityColors[ticket.priority] }}>{ticket.priority}</span>
                <span>·</span>
                <span>{ticket.date}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
