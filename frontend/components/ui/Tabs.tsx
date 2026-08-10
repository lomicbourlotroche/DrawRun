import { cn } from '@/lib/utils';
import { createContext, useContext, useState, ReactNode } from 'react';

// ============================================================================
// Radix UI-compatible Tabs API
// ============================================================================

interface TabsContextValue {
  value: string;
  onValueChange: (_value: string) => void;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

function useTabs() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
}

interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (_value: string) => void;
  children: ReactNode;
  className?: string;
}

export function Tabs({ defaultValue, value, onValueChange, children, className }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const handleValueChange = (newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div className={cn('flex gap-1 p-1 bg-background rounded-lg', className)}>
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const { value: selectedValue, onValueChange } = useTabs();
  const isActive = selectedValue === value;

    return (
      <button
        onClick={() => onValueChange(value)}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 px-3 py-3 min-h-[44px] rounded-md text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-surface text-foreground'
            : 'text-muted hover:text-foreground hover:bg-surface/50',
          className
        )}
      >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { value: selectedValue } = useTabs();

  if (selectedValue !== value) return null;

  return <div className={cn('animate-fade-in', className)}>{children}</div>;
}

// ============================================================================
// Legacy Tabs API (keep for backwards compatibility)
// ============================================================================

interface LegacyTabsProps {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  activeTab: string;
  onTabChange: (_tabId: string) => void;
  className?: string;
}

export function LegacyTabs({ tabs, activeTab, onTabChange, className }: LegacyTabsProps) {
  return (
    <div className={cn('flex gap-1 p-1 bg-background rounded-lg', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
            activeTab === tab.id
              ? 'bg-surface text-foreground'
              : 'text-muted hover:text-foreground hover:bg-surface/50'
          )}
        >
          {tab.icon}
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

interface TabPanelProps {
  children: React.ReactNode;
  isActive: boolean;
}

export function TabPanel({ children, isActive }: TabPanelProps) {
  if (!isActive) return null;
  return <div className="animate-fade-in">{children}</div>;
}

interface FilterChipProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  count?: number;
}

export function FilterChip({ label, isActive, onClick, count }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'bg-surface text-muted hover:text-foreground border border-border'
      )}
    >
      {label}
      {count !== undefined && (
        <span
          className={cn(
            'px-1.5 py-0.5 rounded-full text-xs',
            isActive ? 'bg-surface/20' : 'bg-background'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

interface FilterChipGroupProps {
  options: { id: string; label: string; count?: number }[];
  activeFilter: string;
  onFilterChange: (_filterId: string) => void;
  className?: string;
}

export function FilterChipGroup({
  options,
  activeFilter,
  onFilterChange,
  className,
}: FilterChipGroupProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {options.map((option) => (
        <FilterChip
          key={option.id}
          label={option.label}
          count={option.count}
          isActive={activeFilter === option.id}
          onClick={() => onFilterChange(option.id)}
        />
      ))}
    </div>
  );
}
