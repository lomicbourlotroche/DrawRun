'use client';

import { useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface NavTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface NavTabsProps {
  tabs: readonly NavTab[];
  activeTab: string;
  onChange: (_tabId: string) => void;
  className?: string;
}

export function NavTabs({ tabs, activeTab, onChange, className }: NavTabsProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      let nextIndex: number | null = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        nextIndex = (index + 1) % tabs.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      }
      if (nextIndex !== null) {
        e.preventDefault();
        onChange(tabs[nextIndex].id);
      }
    },
    [tabs, onChange],
  );

  return (
    <div className={cn('flex items-center gap-1 overflow-x-auto', className)} role="tablist">
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onChange(tab.id)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200',
            activeTab === tab.id
              ? 'bg-primary-500 text-white shadow-sm'
              : 'text-muted hover:text-foreground hover:bg-muted/20',
          )}
        >
          {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
