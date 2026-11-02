import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { Zap, Mail, Lock, Eye, EyeOff, User, AtSign } from 'lucide-react';
import { motion } from 'framer-motion';

const Register: React.FC = () => {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', username: '', password: '', password2: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const update = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const pwStrength = () => {
    const pw = form.password;
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 6) s++;
    if (pw.length >= 10) s++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
    if (/\d/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return Math.min(s, 4);
  };

  const strengthColors = ['#EB5757', '#EB5757', '#F2C94C', '#4CB782', '#4CB782'];
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.password2) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await register(form);
      navigate('/login');
    } catch (err: any) {
      const d = err.response?.data;
      let msg = 'Registration failed.';
      if (typeof d === 'string') {
        msg = d;
      } else if (d && typeof d === 'object') {
        const firstKey = Object.keys(d)[0];
        const val = d[firstKey];
        msg = Array.isArray(val) ? `${firstKey}: ${val[0]}` : (val || 'Registration failed.');
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full h-10 pl-10 pr-4 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-quaternary)] focus:outline-none focus:border-[rgba(94,106,210,0.5)] transition-colors';

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center px-4 py-10 relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-[var(--accent)] opacity-[0.06] blur-[100px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-[460px] glass rounded-xl p-8 relative z-10"
      >
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[15px] font-semibold text-[var(--text-primary)]">Code Sensei</span>
        </div>

        <h1 className="text-[20px] font-semibold text-center text-[var(--text-primary)] mb-1">Create your account</h1>
        <p className="text-[13px] text-center text-[var(--text-tertiary)] mb-6">Start your adaptive learning journey</p>

        {error && (
          <div className="bg-[rgba(235,87,87,0.1)] border border-[rgba(235,87,87,0.2)] rounded-lg px-3 py-2 mb-4 text-[13px] text-[var(--danger)]">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-quaternary)]" strokeWidth={1.5} />
              <input type="text" value={form.first_name} onChange={(e) => update('first_name', e.target.value)} placeholder="First name" required className={inputCls} />
            </div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-quaternary)]" strokeWidth={1.5} />
              <input type="text" value={form.last_name} onChange={(e) => update('last_name', e.target.value)} placeholder="Last name" className={inputCls} />
            </div>
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-quaternary)]" strokeWidth={1.5} />
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="Email address" required className={inputCls} />
          </div>

          <div className="relative">
            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-quaternary)]" strokeWidth={1.5} />
            <input type="text" value={form.username} onChange={(e) => update('username', e.target.value)} placeholder="Username" required className={inputCls} />
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-quaternary)]" strokeWidth={1.5} />
              <input type={showPw ? 'text' : 'password'} value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="Create password" required className={`${inputCls} pr-10`} />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-quaternary)]">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {form.password && (
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex gap-1 flex-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-1 flex-1 rounded-full" style={{ background: i <= pwStrength() ? strengthColors[pwStrength()] : 'var(--border-default)' }} />
                  ))}
                </div>
                <span className="text-[11px]" style={{ color: strengthColors[pwStrength()] }}>{strengthLabels[pwStrength()]}</span>
              </div>
            )}
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-quaternary)]" strokeWidth={1.5} />
            <input type="password" value={form.password2} onChange={(e) => update('password2', e.target.value)} placeholder="Confirm password" required className={inputCls} />
          </div>

          <Button type="submit" loading={loading} className="w-full h-10">Create Account</Button>
        </form>

        <p className="text-[13px] text-center text-[var(--text-tertiary)] mt-5">
          Already have an account? <Link to="/login" className="text-[var(--accent-light)] hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
