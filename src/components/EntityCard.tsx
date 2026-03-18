import React from 'react';
import { cn } from '@/lib/utils';
import Card from '@/components/ui/Card';
import IconButton from '@/components/ui/IconButton';
import InputField from '@/components/ui/InputField';

interface EntityCardProps {
  avatarNode: React.ReactNode;
  displayName: string;
  subtitle?: string;
  nameEllipsis?: boolean;
  showSpacerWhenNoSubtitle?: boolean;
  chips: Array<{ label: string; dimmed?: boolean }>;
  lastSynced: string | null;
  tmdbEnriched: boolean;
  timeAgo: (iso: string | null) => string;
  isRenaming: boolean;
  renameValue: string;
  renamePlaceholder: string;
  onRenameChange: (v: string) => void;
  onRenameKeyDown: (e: React.KeyboardEvent) => void;
  onRenameConfirm: () => void;
  onRenameCancel: () => void;
  onRenameStart: () => void;
  isSyncing: boolean;
  syncProgress?: number;
  onSync: () => void;
  isDeleting: boolean;
  onDelete: () => void;
}

export default function EntityCard({
  avatarNode,
  displayName,
  subtitle,
  nameEllipsis,
  showSpacerWhenNoSubtitle,
  chips,
  lastSynced,
  tmdbEnriched,
  timeAgo,
  isRenaming,
  renameValue,
  renamePlaceholder,
  onRenameChange,
  onRenameKeyDown,
  onRenameConfirm,
  onRenameCancel,
  onRenameStart,
  isSyncing,
  syncProgress,
  onSync,
  isDeleting,
  onDelete,
}: EntityCardProps) {
  return (
    <Card className="px-5 py-4 flex items-center gap-3">
      {/* Avatar */}
      <div className="shrink-0">{avatarNode}</div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {isRenaming ? (
          <div className="flex gap-[6px] mb-[6px]">
            <InputField
              autoFocus
              value={renameValue}
              onChange={(e) => onRenameChange(e.target.value)}
              onKeyDown={onRenameKeyDown}
              placeholder={renamePlaceholder}
              className="flex-1 min-w-0 rounded-[6px] px-2 py-1"
            />
            <button
              onClick={onRenameConfirm}
              className="px-[10px] py-1 rounded-[6px] text-13 font-semibold cursor-pointer border-none bg-accent-green text-text-primary"
            >
              Save
            </button>
            <button
              onClick={onRenameCancel}
              className="px-[10px] py-1 rounded-[6px] text-13 cursor-pointer border border-border-subtle bg-transparent text-text-secondary"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="mb-[6px]">
            <div
              className={cn(
                'font-bold text-text-primary text-base',
                nameEllipsis ? 'overflow-hidden text-ellipsis whitespace-nowrap' : 'mb-[2px]'
              )}
            >
              {displayName}
            </div>
            {subtitle && (
              <div className="text-xs text-text-tertiary mt-[2px]">
                {subtitle}
              </div>
            )}
            {!subtitle && showSpacerWhenNoSubtitle && (
              <div className="mb-[6px]" />
            )}
          </div>
        )}
        <div className="flex gap-2 flex-wrap">
          {chips.map((chip) => (
            <span
              key={chip.label}
              className={cn(
                'text-13 bg-bg-card-hover rounded-[6px] px-2 py-[2px] whitespace-nowrap',
                chip.dimmed ? 'text-text-tertiary' : 'text-text-secondary'
              )}
            >
              {chip.label}
            </span>
          ))}
        </div>
        <div className="text-text-tertiary text-xs mt-[6px] flex items-center gap-2">
          synced {timeAgo(lastSynced)}
          {!tmdbEnriched && (
            <span className="text-11 text-text-tertiary bg-bg-card-hover border border-border-subtle rounded-[4px] px-[6px] py-[1px]">
              Enriching…
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-[2px] shrink-0">
        {/* Rename */}
        <IconButton onClick={onRenameStart} title="Rename" className="hover:bg-bg-card-hover">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </IconButton>

        {/* Sync */}
        <div className="relative w-8 h-8 shrink-0">
          {syncProgress !== undefined && isSyncing && (
            <svg
              width="40" height="40"
              className="absolute -top-1 -left-1 pointer-events-none"
              viewBox="0 0 40 40"
            >
              <circle cx="20" cy="20" r="16" fill="none" stroke="#2a2d35" strokeWidth="2" />
              <circle
                cx="20" cy="20" r="16" fill="none"
                stroke="#00c030" strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="100.5"
                strokeDashoffset={100.5 * (1 - syncProgress / 100)}
                style={{ transform: 'rotate(-90deg)', transformOrigin: '20px 20px', transition: 'stroke-dashoffset 0.3s ease' }}
              />
            </svg>
          )}
          <IconButton
            onClick={onSync}
            disabled={isSyncing}
            title="Sync"
            className={cn(
              'transition-[background-color,color]',
              isSyncing ? 'cursor-default' : 'cursor-pointer hover:bg-bg-card-hover',
              syncProgress !== undefined && isSyncing ? 'text-accent-green' : 'text-text-secondary',
              syncProgress === undefined && isSyncing && 'opacity-50'
            )}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={isSyncing ? { animation: 'spin 1s linear infinite' } : undefined}>
              <path d="M23 4v6h-6M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
          </IconButton>
        </div>

        {/* Delete */}
        <IconButton
          onClick={onDelete}
          disabled={isDeleting}
          title="Remove"
          className={cn('hover:bg-bg-danger', isDeleting && 'opacity-50')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
          </svg>
        </IconButton>
      </div>
    </Card>
  );
}
