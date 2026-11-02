import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { Toaster } from 'sonner';

// Eager-load auth pages for fast initial load
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';

// Lazy-load everything else
const LandingPage = React.lazy(() => import('./pages/Landing'));
const DashboardPage = React.lazy(() => import('./pages/Dashboard'));
const LearningGraphPage = React.lazy(() => import('./pages/LearningGraph'));
const AIMentorPage = React.lazy(() => import('./pages/AIMentor'));
const ProblemListPage = React.lazy(() => import('./pages/ProblemList'));
const CodeWorkspacePage = React.lazy(() => import('./pages/CodeWorkspace'));
const LearningRoadmapPage = React.lazy(() => import('./pages/LearningRoadmap'));
const ProjectsPage = React.lazy(() => import('./pages/Projects'));
const ProjectEvolutionPage = React.lazy(() => import('./pages/ProjectEvolution'));
const ProgressPage = React.lazy(() => import('./pages/Progress'));
const SettingsPage = React.lazy(() => import('./pages/Settings'));

// Stub pages
const StubPage: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <AppLayout title={title} subtitle={subtitle}>
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-12 h-12 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-quaternary)] mb-4">
        ⚙️
      </div>
      <h3 className="text-[15px] font-medium text-[var(--text-primary)] mb-1">{title}</h3>
      <p className="text-[13px] text-[var(--text-tertiary)]">Coming soon in a future update.</p>
    </div>
  </AppLayout>
);

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-[var(--bg-base)]">
    <div className="w-6 h-6 border-2 border-[var(--border-default)] border-t-[var(--accent)] rounded-full animate-spin" />
  </div>
);

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
            fontSize: '13px',
          },
        }}
      />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/graph" element={<ProtectedRoute><LearningGraphPage /></ProtectedRoute>} />
          <Route path="/mentor" element={<ProtectedRoute><AIMentorPage /></ProtectedRoute>} />
          <Route path="/assessments" element={<ProtectedRoute><ProblemListPage /></ProtectedRoute>} />
          <Route path="/workspace/:id" element={<ProtectedRoute><CodeWorkspacePage /></ProtectedRoute>} />
          <Route path="/roadmap" element={<ProtectedRoute><LearningRoadmapPage /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute><ProjectEvolutionPage /></ProtectedRoute>} />
          <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />


          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
