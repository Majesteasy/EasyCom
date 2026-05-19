import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuthStore } from '@/store/authStore';

export default function AppLayout() {
  const navigate = useNavigate();
  const { isAuthenticated, isSessionExpired, logout, updateActivity } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated() || isSessionExpired()) {
      logout();
      navigate('/login');
    }
  }, []);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handler = () => {
      if (isSessionExpired()) { logout(); navigate('/login'); return; }
      updateActivity();
    };
    events.forEach(e => window.addEventListener(e, handler));
    return () => events.forEach(e => window.removeEventListener(e, handler));
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-gray-50 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
