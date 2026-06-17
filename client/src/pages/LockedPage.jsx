import { Lock } from 'lucide-react';
import StatusScreen from '../components/ui/StatusScreen.jsx';

export default function LockedPage() {
  return (
    <StatusScreen
      icon={Lock}
      tone="amber"
      title="This class is locked"
      message="The host has locked this class, so new students can't join right now. Please reach out to your teacher if you think this is a mistake."
    />
  );
}
