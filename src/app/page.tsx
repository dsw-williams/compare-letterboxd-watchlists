import { getFriends, getLists } from '@/lib/storage';
import LandingPage from '@/components/LandingPage';
import HomePageClient from '@/components/HomePageClient';

export default async function HomePage() {
  const [friends, lists] = await Promise.all([getFriends(), getLists()]);

  if (friends.length === 0 && lists.length === 0) {
    return <LandingPage />;
  }

  return <HomePageClient initialFriends={friends} initialLists={lists} />;
}
