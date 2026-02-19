import Session from './pages/Session';
import Login from './pages/Login';
import { useAuth } from './hooks/useAuth';

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Loading Rosetta...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Session />
  )
}

export default App;
