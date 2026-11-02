import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { Zap, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center px-4 relative">
      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-[var(--accent)] opacity-[0.06] blur-[100px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-[400px] glass rounded-xl p-8 relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[15px] font-semibold text-[var(--text-primary)]">Code Sensei</span>
        </div>

        <h1 className="text-[20px] font-semibold text-center text-[var(--text-primary)] mb-1">Welcome back</h1>
        <p className="text-[13px] text-center text-[var(--text-tertiary)] mb-6">Sign in to your account</p>

        {error && (
          <div className="bg-[rgba(235,87,87,0.1)] border border-[rgba(235,87,87,0.2)] rounded-lg px-3 py-2 mb-4 text-[13px] text-[var(--danger)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-quaternary)]" strokeWidth={1.5} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="w-full h-10 pl-10 pr-4 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-quaternary)] focus:outline-none focus:border-[rgba(94,106,210,0.5)] transition-colors"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-quaternary)]" strokeWidth={1.5} />
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full h-10 pl-10 pr-10 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-quaternary)] focus:outline-none focus:border-[rgba(94,106,210,0.5)] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-quaternary)] hover:text-[var(--text-tertiary)]"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <Button type="submit" loading={loading} className="w-full h-10">
            Sign in
          </Button>
        </form>

        <p className="text-[13px] text-center text-[var(--text-tertiary)] mt-5">
          Don't have an account?{' '}
          <Link to="/register" className="text-[var(--accent-light)] hover:underline">Sign up</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
