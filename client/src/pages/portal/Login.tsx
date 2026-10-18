import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

function LoginBg() {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.elapsedTime * 0.12;
      meshRef.current.rotation.x = clock.elapsedTime * 0.07;
    }
  });

  return (
    <>
      <ambientLight intensity={0.1} />
      <pointLight position={[4, 4, 4]} color="#4285F4" intensity={3} />
      <pointLight position={[-4, -4, 4]} color="#EA4335" intensity={2} />
      <pointLight position={[0, 4, -4]} color="#FBBC05" intensity={1.5} />
      <pointLight position={[-4, 2, -4]} color="#34A853" intensity={1.5} />
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[2, 1]} />
        <meshStandardMaterial
          color="#1a1a2e"
          emissive="#4285F4"
          emissiveIntensity={0.08}
          wireframe
          transparent
          opacity={0.4}
        />
      </mesh>
    </>
  );
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => navigate('/portal/dashboard'), 900);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden" style={{ background: '#08080c' }}>
      {/* 3D background */}
      <div className="absolute inset-0 opacity-40">
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }} gl={{ alpha: true }}>
          <LoginBg />
        </Canvas>
      </div>

      {/* Color glow spots */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full" style={{ background: '#4285F4', opacity: 0.05, filter: 'blur(80px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full" style={{ background: '#EA4335', opacity: 0.05, filter: 'blur(80px)' }} />
        <div className="absolute top-1/2 right-1/3 w-48 h-48 rounded-full" style={{ background: '#34A853', opacity: 0.04, filter: 'blur(60px)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="glass rounded-3xl p-10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-10">
            <div className="relative w-12 h-12 mb-4">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#4285F4] via-[#EA4335] to-[#34A853]" />
              <div className="absolute inset-[2px] rounded-[14px] bg-[#0f0f14] flex items-center justify-center">
                <span className="text-white font-bold text-lg" style={{ fontFamily: 'Manrope' }}>P</span>
              </div>
            </div>
            <span className="text-white font-bold text-xl tracking-tight" style={{ fontFamily: 'Manrope' }}>Pixelerion</span>
            <span className="text-[#6b7280] text-sm mt-1">Customer Portal</span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#9898a8] mb-2 uppercase tracking-widest">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#4b4b60] outline-none focus:ring-1 transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  fontFamily: 'Inter',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#4285F4'; e.currentTarget.style.boxShadow = '0 0 0 1px #4285F440'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#9898a8] mb-2 uppercase tracking-widest">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#4b4b60] outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  fontFamily: 'Inter',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#4285F4'; e.currentTarget.style.boxShadow = '0 0 0 1px #4285F440'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            <div className="flex justify-end">
              <button type="button" className="text-xs text-[#4285F4] hover:text-[#6a9ff5] transition-colors">Forgot password?</button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 disabled:opacity-60 mt-2"
              style={{ background: 'linear-gradient(135deg, #4285F4, #34A853)', fontFamily: 'Manrope' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Login'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t text-center" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#9898a8] transition-colors">
              ← Back to Pixelerion
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
