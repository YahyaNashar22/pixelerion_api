import { motion } from 'framer-motion';

const plans = [
  { name: 'Starter', hours: 5, price: '$299', response: '2 business days', current: false },
  { name: 'Growth', hours: 10, price: '$549', response: '1 business day', current: false },
  { name: 'Premium', hours: 20, price: '$999', response: '4 business hours', current: true },
  { name: 'Enterprise', hours: 40, price: '$1,799', response: '2 business hours', current: false },
];

export default function Plan() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Manrope' }}>Support Plan</h1>
        <p className="text-[#6b7280] text-sm">Manage your current plan, purchase additional hours, or upgrade.</p>
      </motion.div>

      {/* Current plan card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="relative rounded-2xl p-8 overflow-hidden"
        style={{ background: '#0d0d14', border: '1px solid rgba(66,133,244,0.3)' }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none" style={{ background: '#4285F4', opacity: 0.05, filter: 'blur(60px)', transform: 'translate(30%,-30%)' }} />

        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2.5 py-0.5 rounded-lg font-medium" style={{ background: 'rgba(52,168,83,0.15)', color: '#34A853' }}>Active</span>
              <span className="text-xs text-[#6b7280]">Renews Sep 1, 2024</span>
            </div>
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Manrope' }}>Premium Support</h2>
            <p className="text-[#9898a8] mt-1">20 development hours / month</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white" style={{ fontFamily: 'Manrope' }}>$999</p>
            <p className="text-xs text-[#6b7280]">per month</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Remaining', value: '12h 35m', color: '#34A853' },
            { label: 'Used', value: '7h 25m', color: '#FBBC05' },
            { label: 'Response Time', value: '4 biz hrs', color: '#4285F4' },
            { label: 'Billing Period', value: 'Aug 1–31', color: '#9898a8' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-xs uppercase tracking-widest text-[#6b7280] mb-1.5">{s.label}</p>
              <p className="text-base font-semibold" style={{ fontFamily: 'Manrope', color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-[#6b7280] mb-2">
            <span>7h 25m used</span>
            <span>12h 35m remaining</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '37%' }}
              transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #4285F4, #FBBC05)' }}
            />
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #4285F4, #34A853)', fontFamily: 'Manrope' }}>
            Purchase Additional Hours
          </button>
          <button className="px-5 py-2.5 rounded-xl text-sm font-medium text-[#9898a8] transition-all hover:text-white"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Manrope' }}>
            Upgrade Plan
          </button>
        </div>
      </motion.div>

      {/* Plans comparison */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-base font-semibold text-white mb-4" style={{ fontFamily: 'Manrope' }}>Available Plans</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="rounded-2xl p-6 relative"
              style={{
                background: plan.current ? 'rgba(66,133,244,0.08)' : '#0d0d14',
                border: `1px solid ${plan.current ? 'rgba(66,133,244,0.4)' : 'rgba(255,255,255,0.07)'}`,
              }}
            >
              {plan.current && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs px-3 py-0.5 rounded-full font-medium whitespace-nowrap"
                  style={{ background: '#4285F4', color: '#fff', fontFamily: 'Manrope' }}>Current Plan</span>
              )}
              <h3 className="text-white font-semibold mb-1" style={{ fontFamily: 'Manrope' }}>{plan.name}</h3>
              <p className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Manrope' }}>{plan.price}</p>
              <p className="text-xs text-[#6b7280] mb-3">per month</p>
              <div className="space-y-1.5 text-xs text-[#9898a8]">
                <div className="flex items-center gap-2"><span className="text-[#34A853]">✓</span>{plan.hours}h / month</div>
                <div className="flex items-center gap-2"><span className="text-[#34A853]">✓</span>Response: {plan.response}</div>
              </div>
              {!plan.current && (
                <button className="mt-4 w-full py-2 rounded-lg text-xs font-medium text-[#9898a8] hover:text-white transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'Manrope' }}>
                  Switch Plan
                </button>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
