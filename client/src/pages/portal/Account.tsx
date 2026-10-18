import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Account() {
  const [name, setName] = useState('Acme Corporation');
  const [email, setEmail] = useState('admin@acme.com');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    fontFamily: 'Inter',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Manrope' }}>Account</h1>
        <p className="text-[#6b7280] text-sm">Manage your account details and preferences.</p>
      </motion.div>

      {/* Profile */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-2xl p-8"
        style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-5 mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #4285F4, #34A853)', fontFamily: 'Manrope' }}>
            AC
          </div>
          <div>
            <p className="text-white font-semibold text-lg" style={{ fontFamily: 'Manrope' }}>{name}</p>
            <p className="text-[#6b7280] text-sm">{email}</p>
            <p className="text-xs text-[#4b4b60] mt-1">Premium Support Plan · Client since August 2024</p>
          </div>
        </div>

        {saved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 rounded-lg px-4 py-3 mb-6 text-sm"
            style={{ background: 'rgba(52,168,83,0.1)', border: '1px solid rgba(52,168,83,0.3)', color: '#34A853' }}
          >
            <span>✓</span> Account details saved.
          </motion.div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#6b7280] mb-2">Company Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#6b7280] mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                style={inputStyle}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-[#6b7280] mb-2">New Password</label>
            <input
              type="password"
              placeholder="Leave blank to keep current password"
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#4b4b60] outline-none"
              style={inputStyle}
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #4285F4, #34A853)', fontFamily: 'Manrope' }}
          >
            Save Changes
          </button>
        </form>
      </motion.div>

      {/* Assigned developer */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="rounded-2xl p-6"
        style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <h2 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: 'Manrope' }}>Your Pixelerion Contact</h2>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white"
            style={{ background: 'rgba(52,168,83,0.2)', color: '#34A853', fontFamily: 'Manrope' }}>Y</div>
          <div>
            <p className="text-white font-medium" style={{ fontFamily: 'Manrope' }}>Yahya</p>
            <p className="text-[#6b7280] text-sm">Lead Developer</p>
          </div>
          <a href="mailto:yahya@pixelerion.com" className="ml-auto text-xs text-[#4285F4] hover:underline">
            yahya@pixelerion.com
          </a>
        </div>
      </motion.div>
    </div>
  );
}
