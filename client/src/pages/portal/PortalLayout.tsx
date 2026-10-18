import { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { path: '/portal/dashboard', label: 'Overview', icon: '⊞' },
  { path: '/portal/tickets', label: 'Tickets', icon: '◫' },
  { path: '/portal/support-time', label: 'Support Time', icon: '◷' },
  { path: '/portal/meetings', label: 'Meetings', icon: '⊙' },
  { path: '/portal/plan', label: 'Support Plan', icon: '◈' },
  { path: '/portal/account', label: 'Account', icon: '◉' },
];

const TOTAL_HOURS = 20;
const USED_HOURS = 7.42; // 7h 25m
const REMAINING = TOTAL_HOURS - USED_HOURS;
const PERCENT = (USED_HOURS / TOTAL_HOURS) * 100;

function getProgressColor(pct: number) {
  if (pct < 50) return '#34A853';
  if (pct < 80) return '#FBBC05';
  return '#EA4335';
}

function SupportTimeBar() {
  const color = getProgressColor(PERCENT);
  return (
    <div className="flex flex-col items-center">
      <p className="text-[10px] uppercase tracking-widest text-[#6b7280] mb-1">Support Time</p>
      <p className="text-white font-bold text-lg leading-none mb-0.5" style={{ fontFamily: 'Manrope' }}>
        12h 35m <span className="text-[#6b7280] font-normal text-sm">remaining</span>
      </p>
      <p className="text-[#6b7280] text-xs mb-2">7h 25m used of 20h</p>
      <div className="w-48 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${PERCENT}%`, background: color }} />
      </div>
    </div>
  );
}

export default function PortalLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#08080c' }}>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 bg-black/60 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : undefined }}
        className={`
          fixed md:static inset-y-0 left-0 z-30 w-64 flex flex-col
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          transition-transform duration-300 md:transition-none
        `}
        style={{ background: '#0d0d12', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Logo */}
        <div className="p-6 pb-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[#4285F4] via-[#EA4335] to-[#34A853]" />
              <div className="absolute inset-[2px] rounded-[6px] bg-[#0d0d12] flex items-center justify-center">
                <span className="text-white font-bold text-xs" style={{ fontFamily: 'Manrope' }}>P</span>
              </div>
            </div>
            <div>
              <span className="text-white font-semibold text-[14px] block" style={{ fontFamily: 'Manrope' }}>Pixelerion</span>
              <span className="text-[#6b7280] text-[10px]">Developer: Yahya</span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm mb-0.5 transition-all ${
                  isActive
                    ? 'text-white bg-white/8'
                    : 'text-[#6b7280] hover:text-[#9898a8] hover:bg-white/4'
                }`
              }
              style={{ fontFamily: 'Inter' }}
            >
              {({ isActive }) => (
                <>
                  <span className={`text-base ${isActive ? 'text-[#4285F4]' : ''}`}>{item.icon}</span>
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <a
            href="mailto:hello@pixelerion.com"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#6b7280] hover:text-[#9898a8] hover:bg-white/4 transition-all mb-1"
          >
            <span>◎</span> Contact Pixelerion
          </a>
          <button
            onClick={() => navigate('/portal/login')}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#EA4335]/70 hover:text-[#EA4335] hover:bg-[#EA4335]/8 transition-all"
          >
            <span>←</span> Logout
          </button>
        </div>
      </motion.aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 gap-4"
          style={{ background: '#0d0d12', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

          <button className="md:hidden text-[#9898a8] p-1" onClick={() => setSidebarOpen(true)}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>

          <div className="hidden md:block" />

          {/* Support time — center */}
          <SupportTimeBar />

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTicketOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #4285F4, #34A853)', fontFamily: 'Manrope' }}
            >
              <span className="text-base leading-none">+</span>
              <span className="hidden sm:inline">Request Ticket</span>
            </button>

            {/* Notification bell */}
            <button className="relative w-9 h-9 flex items-center justify-center rounded-xl text-[#6b7280] hover:text-white hover:bg-white/6 transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#EA4335]" />
            </button>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #4285F4, #34A853)', fontFamily: 'Manrope' }}>
              AC
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* Ticket Modal */}
      <AnimatePresence>
        {ticketOpen && <TicketModal onClose={() => setTicketOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

function TicketModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ title: '', category: 'Bug', priority: 'Normal', description: '' });

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 16 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg rounded-2xl p-8"
        style={{ background: '#131318', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-lg" style={{ fontFamily: 'Manrope' }}>Request a Ticket</h2>
          <button onClick={onClose} className="text-[#6b7280] hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/8 transition-all">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-[#6b7280] mb-2">Ticket Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Brief description of the issue"
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#4b4b60] outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', fontFamily: 'Inter' }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#6b7280] mb-2">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', fontFamily: 'Inter' }}
              >
                {['Bug','Feature Request','Technical Support','Infrastructure','Consultation','Meeting Request','Other'].map((c) => (
                  <option key={c} value={c} style={{ background: '#131318' }}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#6b7280] mb-2">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', fontFamily: 'Inter' }}
              >
                {['Low','Normal','High','Critical'].map((p) => (
                  <option key={p} value={p} style={{ background: '#131318' }}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-[#6b7280] mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              placeholder="Describe the issue in detail..."
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#4b4b60] outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', fontFamily: 'Inter' }}
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-[#6b7280] mb-2">Attachments</label>
            <div className="px-4 py-4 rounded-xl text-sm text-[#6b7280] text-center border-dashed cursor-pointer hover:text-[#9898a8] transition-colors"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.12)' }}>
              Drop files here or click to upload
              <span className="block text-xs mt-1 text-[#4b4b60]">Images, PDFs, screenshots, documents</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm text-[#9898a8] hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            Cancel
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #4285F4, #34A853)', fontFamily: 'Manrope' }}
          >
            Submit Ticket
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
