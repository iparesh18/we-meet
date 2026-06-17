import { UserX } from 'lucide-react';
import StatusScreen from '../components/ui/StatusScreen.jsx';

export default function RemovedPage() {
  return (
    <StatusScreen
      icon={UserX}
      tone="red"
      title="You were removed"
      message="The host has removed you from this class. You won't be able to rejoin this session."
    />
  );
}
