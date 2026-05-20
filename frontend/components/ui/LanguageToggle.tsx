'use client';

import { useLanguage } from '../providers/LanguageProvider';
import { Globe, Check } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { Language } from '@/lib/i18n';

const languages: { code: Language; label: string; flag: string }[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
];

export function LanguageToggle({ variant = 'default' }: { variant?: 'default' | 'scrolled' }) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentLang = languages.find(l => l.code === language) || languages[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200",
          variant === 'scrolled'
            ? 'text-muted hover:text-foreground hover:bg-background'
            : 'text-foreground/80 hover:text-foreground hover:bg-surface/80'
        )}
        title="Changer de langue"
      >
        <Globe className="w-4 h-4" />
        <span className="uppercase text-xs font-bold tracking-wide">{currentLang.code}</span>
      </button>

      {/* Dropdown */}
      <div className={cn(
        "absolute right-0 mt-2 w-48 bg-surface border border-border rounded-xl shadow-xl z-dropdown overflow-hidden transition-all duration-200 origin-top-right",
        isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
      )}>
        <div className="py-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => { setLanguage(lang.code); setIsOpen(false); }}
              className={cn(
                "w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors",
                language === lang.code
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-foreground hover:bg-background'
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{lang.flag}</span>
                <span className="font-medium">{lang.label}</span>
              </div>
              {language === lang.code && (
                <Check className="w-4 h-4 text-primary-600" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
