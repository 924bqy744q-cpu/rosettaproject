import { useState } from 'react';
import Session from './pages/Session';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { useAuth } from './hooks/useAuth';

function App() {
  const { user, isLoading } = useAuth();
  const [view, setView] = useState('dashboard'); // 'dashboard' or 'session'

  if (isLoading) {
    return <div className="container" style={{ justifyContent: 'center', alignItems: 'center' }}><p style={{ color: 'var(--ink-soft)' }}>Loading Rosetta...</p></div>;
  }

  if (!user) {
    return <Login />;
  }

  if (view === 'session') {
    return <Session onBack={() => setView('dashboard')} />;
  }

  return <Dashboard onStartSession={() => setView('session')} />;
}

export default App;
