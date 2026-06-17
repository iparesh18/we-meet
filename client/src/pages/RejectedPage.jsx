import { Ban } from 'lucide-react';
import StatusScreen from '../components/ui/StatusScreen.jsx';

export default function RejectedPage() {
  return (
    <StatusScreen
      icon={Ban}
      tone="slate"
      title="Request not accepted"
      message="The host didn't admit you to this class. If you think this is a mistake, please contact your teacher."
    />
  );
}
