import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Button } from '../components/ui/Button';
import { Brain, Bot, Target, Code2, ArrowRight, Zap, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  { icon: Brain, title: 'Memory Graph', desc: 'Dynamic knowledge graph that tracks your mastery across every programming concept in real-time.', large: true },
  { icon: Bot, title: 'AI Mentors', desc: 'Specialized AI personas that guide you with Socratic hints instead of direct answers.', large: true },
  { icon: Target, title: 'Adaptive Assessments', desc: 'Problems that adjust difficulty based on your real performance history.', large: false },
  { icon: Code2, title: 'Code Workspace', desc: 'Built-in IDE with instant feedback and AI-powered code analysis.', large: false },
];

const steps = [
  { num: '01', title: 'Assess your skills', desc: 'Complete initial assessments to map your current knowledge across programming concepts.' },
  { num: '02', title: 'Learn adaptively', desc: 'Your AI mentors craft personalized guidance based on your evolving skill profile.' },
  { num: '03', title: 'Master concepts', desc: 'Track your progress on the Memory Graph as you build deep, lasting understanding.' },
];

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4">
        {/* Accent glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[var(--accent)] opacity-[0.08] blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] text-[12px] text-[var(--text-tertiary)] mb-6">
              <Sparkles className="w-3 h-3 text-[var(--accent)]" />
              AI-powered adaptive learning
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-[56px] md:text-[64px] font-semibold leading-[1.05] tracking-[-0.04em] text-gradient-white mb-5"
          >
            Master programming with adaptive AI guidance
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-[16px] text-[var(--text-tertiary)] leading-relaxed max-w-xl mx-auto mb-8"
          >
            Code Sensei builds a living map of your programming knowledge and provides personalized mentorship through specialized AI tutors.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center justify-center gap-3"
          >
            <Link to="/register">
              <Button size="lg" icon={<ArrowRight className="w-4 h-4" />}>Get Started</Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg">Login</Button>
            </Link>
          </motion.div>
        </div>

        {/* Product mockup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="max-w-4xl mx-auto mt-16"
        >
          <div className="relative rounded-xl border border-[var(--border-default)] bg-[var(--bg-panel)] p-1 overflow-hidden"
               style={{ transform: 'perspective(1200px) rotateX(2deg)' }}>
            <div className="rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] p-6 h-[320px] flex items-center justify-center">
              <div className="text-center">
                <div className="flex justify-center gap-4 mb-6">
                  {['#4CB782', '#4EA7FC', '#F2C94C', '#EB5757', '#62666D'].map((c) => (
                    <div key={c} className="w-10 h-10 rounded-full border-2" style={{ borderColor: c, background: `${c}20` }} />
                  ))}
                </div>
                <p className="text-[var(--text-quaternary)] text-sm">Interactive Learning Memory Graph</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features bento grid */}
      <section id="features" className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <p className="text-[12px] uppercase tracking-[0.08em] text-[var(--text-quaternary)] mb-2">Features</p>
          <h2 className="text-[32px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
            Everything you need to grow
          </h2>
        </div>
        <div className="grid md:grid-cols-12 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className={`bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-6 hover:border-[var(--border-default)] transition-colors ${
                f.large ? 'md:col-span-7' : 'md:col-span-5'
              } ${i === 1 ? 'md:col-span-5' : ''} ${i === 2 ? 'md:col-span-5' : ''} ${i === 3 ? 'md:col-span-7' : ''}`}
            >
              <div className="w-9 h-9 rounded-lg bg-[var(--accent-tint)] flex items-center justify-center mb-4">
                <f.icon className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.5} />
              </div>
              <h3 className="text-[16px] font-medium text-[var(--text-primary)] mb-2">{f.title}</h3>
              <p className="text-[14px] text-[var(--text-tertiary)] leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-3xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <p className="text-[12px] uppercase tracking-[0.08em] text-[var(--text-quaternary)] mb-2">Process</p>
          <h2 className="text-[32px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
            How it works
          </h2>
        </div>
        <div className="space-y-0">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex gap-5 py-6 border-t border-[var(--border-subtle)]"
            >
              <span className="text-[13px] font-medium text-[var(--accent)] mt-0.5">{s.num}</span>
              <div>
                <h3 className="text-[15px] font-medium text-[var(--text-primary)] mb-1">{s.title}</h3>
                <p className="text-[14px] text-[var(--text-tertiary)] leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 pb-20">
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-[var(--accent)] opacity-[0.08] blur-[80px] pointer-events-none" />
          <h2 className="text-[24px] font-semibold text-[var(--text-primary)] mb-3 relative z-10">
            Start learning smarter today
          </h2>
          <p className="text-[14px] text-[var(--text-tertiary)] mb-6 relative z-10">
            Join Code Sensei and experience adaptive, AI-guided programming education.
          </p>
          <Link to="/register" className="relative z-10">
            <Button size="lg" icon={<ArrowRight className="w-4 h-4" />}>Get Started Free</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] py-6 text-center">
        <p className="text-[12px] text-[var(--text-quaternary)]">© 2026 Code Sensei. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;
