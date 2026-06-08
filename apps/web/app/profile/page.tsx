import { MyProfileView } from '../../components/ProfileView';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { Shell } from '../../components/Shell';

export default function ProfilePage() {
  return <Shell title="Profile"><ProtectedRoute><MyProfileView /></ProtectedRoute></Shell>;
}
