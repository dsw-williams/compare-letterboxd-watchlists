'use client';
import clsx from 'clsx';
import { Friend } from '@/lib/types';
import Card from '@/components/ui/Card';

interface FriendSelectorProps {
  friends: Friend[];
  selected: string[];
  onToggle: (username: string) => void;
  onSelectAll: () => void;
}

export default function FriendSelector({ friends, selected, onToggle, onSelectAll }: FriendSelectorProps) {
  if (friends.length === 0) {
    return (
      <Card className="p-5 text-center text-text-tertiary text-sm">
        No friends added yet.{' '}
        <a href="/settings" className="text-accent-green no-underline">
          Add some in Settings →
        </a>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex justify-between items-center mb-[18px]">
        <span className="text-xs font-bold text-text-secondary uppercase tracking-[0.12em]">
          Friends
        </span>
        <button
          onClick={onSelectAll}
          className="text-sm text-accent-green bg-transparent border-none cursor-pointer p-0"
        >
          Select all
        </button>
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
                    'w-16 h-16 rounded-full p-[2px] transition-colors duration-150 border-2',
                    isSelected ? 'border-accent-green' : 'border-transparent'
                  )}
                >
                  {friend.avatar_url ? (
                    <img
                      src={friend.avatar_url}
                      alt={friend.username}
                      className="w-full h-full rounded-full object-cover block"
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
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="white">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </svg>
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
