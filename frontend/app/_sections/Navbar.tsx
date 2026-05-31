'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from '@/components/ui/icons';
import Image from 'next/image';
import { LanguageToggle } from '@/components/ui/LanguageToggle';

const navLinks = [
  { label: 'Race Planning', href: '#race-planning' },
  { label: 'Météo', href: '#weather' },
  { label: 'Fonctionnalités', href: '#features' },
  { label: 'VDOT', href: '#vdot' },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-surface/95 backdrop-blur-xl border-b border-surface shadow-sm py-3' 
          : 'bg-transparent py-3'
      }`}
    >
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5">
            <Image src="/logo-icon.svg" alt="DrawRun" width={36} height={36} className="rounded-lg" />
            <span className="text-lg font-bold tracking-tight text-foreground transition-colors">
              DRAW<span className="text-primary">RUN</span>
            </span>
          </a>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className="text-sm font-medium transition-colors text-muted hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageToggle variant={scrolled ? 'scrolled' : 'default'} />
            <div className="w-px h-6 bg-border" />
            <a
              href="/login"
              className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors text-muted hover:text-foreground hover:bg-surface"
            >
              Connexion
            </a>
            <a
              href="/login?mode=register"
              className="px-4 py-2 text-sm font-semibold rounded-lg transition-all bg-primary text-white hover:bg-primary/90 shadow-button-primary"
            >
              S&apos;inscrire
            </a>
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 rounded-lg transition-colors text-muted hover:bg-surface"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        
        {/* Mobile Menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${
          mobileMenuOpen ? 'max-h-[500px] mt-4' : 'max-h-0'
        }`}>
          <div className="bg-surface rounded-2xl border border-surface shadow-lg p-4 space-y-2">
            {navLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-muted font-medium hover:bg-background rounded-xl transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="border-t border-surface pt-2 mt-2">
              {/* Mobile Language Toggle */}
              <div className="px-4 py-3">
                <LanguageToggle variant="scrolled" />
              </div>
              <a
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-muted font-medium hover:bg-background rounded-xl transition-colors"
              >
                Connexion
              </a>
              <a
                href="/login?mode=register"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 bg-primary text-white font-semibold text-center rounded-xl hover:bg-primary/90 transition-colors"
              >
                S&apos;inscrire
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
