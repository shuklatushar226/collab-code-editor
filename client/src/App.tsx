import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/Home';
import RoomPage from './pages/Room';
import LoginPage from './pages/Login';
import { useUserStore } from './store/userStore';

export default function App() {
  const user = useUserStore((s) => s.user);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/room/:roomId" element={<RoomPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
