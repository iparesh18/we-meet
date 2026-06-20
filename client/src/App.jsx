import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import HostRoom from './pages/HostRoom.jsx';
import CaptainRoom from './pages/CaptainRoom.jsx';
import JoinPage from './pages/JoinPage.jsx';
import WaitingRoom from './pages/WaitingRoom.jsx';
import StudentRoom from './pages/StudentRoom.jsx';
import LockedPage from './pages/LockedPage.jsx';
import RemovedPage from './pages/RemovedPage.jsx';
import RejectedPage from './pages/RejectedPage.jsx';
import EndedPage from './pages/EndedPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/host/:classCode" element={<HostRoom />} />
      <Route path="/captain/:classCode" element={<CaptainRoom />} />
      <Route path="/join/:classCode" element={<JoinPage />} />
      <Route path="/waiting/:classCode" element={<WaitingRoom />} />
      <Route path="/student/:classCode" element={<StudentRoom />} />
      <Route path="/locked" element={<LockedPage />} />
      <Route path="/removed" element={<RemovedPage />} />
      <Route path="/rejected" element={<RejectedPage />} />
      <Route path="/ended" element={<EndedPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
