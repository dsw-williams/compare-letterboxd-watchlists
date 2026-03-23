import { getFriends, getLists } from '@/lib/storage';
import SettingsPageClient from '@/components/SettingsPageClient';

export default async function SettingsPage() {
  const [friends, lists] = await Promise.all([getFriends(), getLists()]);
  return <SettingsPageClient initialFriends={friends} initialLists={lists} />;
}
