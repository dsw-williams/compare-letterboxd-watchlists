import { Metadata } from 'next';
import { getFriends, getLists } from '@/lib/storage';
import SettingsPageClient from '@/components/SettingsPageClient';

export const metadata: Metadata = { title: 'Settings — Watchlist' };

export default async function SettingsPage() {
  const [friends, lists] = await Promise.all([getFriends(), getLists()]);
  return <SettingsPageClient initialFriends={friends} initialLists={lists} />;
}
