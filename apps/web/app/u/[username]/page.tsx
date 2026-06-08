import { PublicProfileView } from '../../../components/ProfileView';
import { Shell } from '../../../components/Shell';

export default function PublicProfilePage({ params }: { params: { username: string } }) {
  return <Shell title={params.username}><PublicProfileView username={params.username} /></Shell>;
}
