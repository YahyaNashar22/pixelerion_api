import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Meetings() {
  const [form, setForm] = useState({ subject: '', desc: '', date: '', time: '', duration: '30' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setForm({ subject: '', desc: '', date: '', time: '', duration: '30' });
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    fontFamily: 'Inter',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Manrope' }}>Request a Meeting</h1>
        <p className="text-[#6b7280] text-sm">Schedule a call or video meeting with your Pixelerion developer.</p>
      </motion.div>

      {/* Notice */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex items-start gap-3 rounded-xl p-4"
        style={{ background: 'rgba(251,188,5,0.08)', border: '1px solid rgba(251,188,5,0.2)' }}
      >
        <span className="text-[#FBBC05] text-base flex-shrink-0 mt-0.5">⚠</span>
        <p className="text-sm text-[#FBBC05]/80 leading-relaxed">
          Meetings and technical consultations may consume support hours according to your support plan.
        </p>
      </motion.div>

      {submitted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 rounded-xl p-4"
          style={{ background: 'rgba(52,168,83,0.1)', border: '1px solid rgba(52,168,83,0.3)' }}
        >
          <span className="text-[#34A853]">✓</span>
          <p className="text-sm text-[#34A853]">Meeting request submitted. Yahya will confirm within one business day.</p>
        </motion.div>
      )}

      <motion.form
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        onSubmit={handleSubmit}
        className="rounded-2xl p-8 space-y-5"
        style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div>
          <label className="block text-xs uppercase tracking-widest text-[#6b7280] mb-2">Subject</label>
          <input
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="e.g. Monthly progress review"
            required
            className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#4b4b60] outline-none"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-[#6b7280] mb-2">Description</label>
          <textarea
            value={form.desc}
            onChange={(e) => setForm({ ...form, desc: e.target.value })}
            rows={3}
            placeholder="What would you like to discuss?"
            className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#4b4b60] outline-none resize-none"
            style={inputStyle}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-[#6b7280] mb-2">Requested Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
              className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
              style={{ ...inputStyle, colorScheme: 'dark' }}
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-[#6b7280] mb-2">Requested Time</label>
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              required
              className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
              style={{ ...inputStyle, colorScheme: 'dark' }}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-[#6b7280] mb-2">Expected Duration</label>
          <select
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
            className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
            style={{ ...inputStyle }}
          >
            {['15','30','45','60','90','120'].map((d) => (
              <option key={d} value={d} style={{ background: '#0d0d14' }}>{d} minutes</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #4285F4, #34A853)', fontFamily: 'Manrope' }}
        >
          Submit Meeting Request
        </button>
      </motion.form>
    </div>
  );
}
