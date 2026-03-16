'use client';
import { Friend } from '@/lib/types';

interface FriendSelectorProps {
  friends: Friend[];
  selected: string[];
  onToggle: (username: string) => void;
  onSelectAll: () => void;
}

export default function FriendSelector({ friends, selected, onToggle, onSelectAll }: FriendSelectorProps) {
  if (friends.length === 0) {
    return (
      <div style={{
        backgroundColor: '#1e2128',
        border: '1px solid #2a2d35',
        borderRadius: '16px',
        padding: '20px',
        textAlign: 'center',
        color: '#6b7280',
        fontSize: '14px',
      }}>
        No friends added yet.{' '}
        <a href="/settings" style={{ color: '#00c030', textDecoration: 'none' }}>
          Add some in Settings →
        </a>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#1e2128',
      border: '1px solid #2a2d35',
      borderRadius: '16px',
      padding: '20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#9ba3af', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          Friends
        </span>
        <button
          onClick={onSelectAll}
          style={{ fontSize: '14px', color: '#00c030', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          Select all
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {friends.map((friend) => {
          const isSelected = selected.includes(friend.username);
          return (
            <div
              key={friend.username}
              onClick={() => onToggle(friend.username)}
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '72px' }}
            >
              {/* Avatar with ring + badge */}
              <div style={{ position: 'relative', width: '64px', height: '64px' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  border: `2px solid ${isSelected ? '#00c030' : 'transparent'}`,
                  padding: '2px',
                  transition: 'border-color 0.15s',
                }}>
                  {friend.avatar_url ? (
                    <img
                      src={friend.avatar_url}
                      alt={friend.username}
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%', borderRadius: '50%',
                      backgroundColor: '#2a2d35',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#9ba3af', fontWeight: 700, fontSize: '20px',
                    }}>
                      {friend.username[0].toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Checkmark badge */}
                {isSelected && (
                  <div style={{
                    position: 'absolute', bottom: '0', right: '0',
                    width: '20px', height: '20px', borderRadius: '50%',
                    backgroundColor: '#00c030',
                    border: '2px solid #141414',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="white">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </svg>
                  </div>
                )}
              </div>

              {/* Username */}
              <span style={{
                fontSize: '12px', color: '#9ba3af',
                textAlign: 'center', overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                maxWidth: '72px', display: 'block',
              }}>
                {friend.username}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
