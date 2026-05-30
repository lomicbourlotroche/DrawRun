'use client';

import { PreferencesSection } from './PreferencesSection';
import { NotificationSection } from './NotificationSection';
import { SecuritySection } from './SecuritySection';

export function SettingsTab() {
  return (
    <div className="space-y-4">
      <PreferencesSection />
      <NotificationSection />
      <SecuritySection />
    </div>
  );
}
