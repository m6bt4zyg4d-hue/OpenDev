import { EditProfileForm } from '../../../components/EditProfileForm';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { Shell } from '../../../components/Shell';
export default function EditProfilePage() { return <Shell title="Edit profile"><header className="topbar"><h1>Edit profile</h1><p className="muted">Update avatar, banner, bio, username, and display name.</p></header><ProtectedRoute><EditProfileForm /></ProtectedRoute></Shell>; }
