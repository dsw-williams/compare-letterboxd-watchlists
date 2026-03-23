import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import { Check } from 'lucide-react';
import { Friend } from '@/lib/types';
import Card from '@/components/ui/Card';

interface FriendSelectorProps {
  friends: Friend[];
  selected: string[];
  onToggle: (username: string) => void;
}

export default function FriendSelector({ friends, selected, onToggle }: FriendSelectorProps) {
  if (friends.length === 0) {
    return (
      <Card className="p-5 text-center text-text-tertiary text-sm">
        No friends added yet.{' '}
        <Link href="/settings" className="text-accent-green no-underline">
          Add some in Settings →
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="mb-[18px]">
        <span className="text-xs font-bold text-text-secondary uppercase tracking-[0.12em]">
          Friends
        </span>
      </div>

      <div className="grid grid-cols-4 gap-x-2 gap-y-4 sm:flex sm:flex-wrap sm:gap-5">
        {friends.map((friend) => {
          const isSelected = selected.includes(friend.username);
          return (
            <div
              key={friend.username}
              onClick={() => onToggle(friend.username)}
              className="cursor-pointer flex flex-col items-center gap-2 sm:w-[72px]"
            >
              {/* Avatar with ring + badge */}
              <div className="relative w-16 h-16">
                <div
                  className={clsx(
                    'relative w-16 h-16 rounded-full p-[2px] transition-colors duration-150 border-2',
                    isSelected ? 'border-accent-green' : 'border-transparent'
                  )}
                >
                  {friend.avatar_url ? (
                    <Image
                      src={friend.avatar_url}
                      alt={friend.username}
                      fill
                      sizes="64px"
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-border-subtle flex items-center justify-center text-text-secondary font-bold text-xl">
                      {friend.username[0].toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Checkmark badge */}
                {isSelected && (
                  <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-accent-green border-2 border-bg-primary flex items-center justify-center">
                    <Check size={10} color="white" strokeWidth={2.5} />
                  </div>
                )}
              </div>

              {/* Display name */}
              <span className="text-xs text-text-secondary text-center overflow-hidden text-ellipsis whitespace-nowrap max-w-full sm:max-w-[72px] block">
                {friend.custom_name ?? friend.username}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
