import { PartyPopper } from 'lucide-react';
import StatusScreen from '../components/ui/StatusScreen.jsx';

export default function EndedPage() {
  return (
    <StatusScreen
      icon={PartyPopper}
      tone="brand"
      title="Class has ended"
      message="Thanks for attending! The host has ended this class. See you in the next session."
    />
  );
}
