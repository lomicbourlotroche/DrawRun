'use client';

import { useState, useEffect } from 'react';
import { Activity, Menu, X } from 'lucide-react';
import { LanguageToggle } from '@/components/providers/LanguageToggle';

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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-xl border-b border-neutral-200 shadow-sm py-3' 
          : 'bg-neutral-900/80 backdrop-blur-md py-3'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              scrolled ? 'bg-primary-600' : 'bg-primary-600'
            }`}>
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className={`text-lg font-bold tracking-tight transition-colors ${
              scrolled ? 'text-neutral-900' : 'text-white'
            }`}>
              DRAW<span className={scrolled ? 'text-primary-600' : 'text-primary-400'}>RUN</span>
            </span>
          </a>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  scrolled 
                    ? 'text-neutral-600 hover:text-neutral-900' 
                    : 'text-white/90 hover:text-white'
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageToggle variant={scrolled ? 'scrolled' : 'default'} />
            <div className={`w-px h-6 ${scrolled ? 'bg-neutral-200' : 'bg-white/20'}`} />
            <a
              href="/login"
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                scrolled 
                  ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100' 
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              Connexion
            </a>
            <a
              href="/login?mode=register"
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                scrolled
                  ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-button-primary'
                  : 'bg-white text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              S&apos;inscrire
            </a>
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            className={`md:hidden p-2 rounded-lg transition-colors ${
              scrolled 
                ? 'text-neutral-600 hover:bg-neutral-100' 
                : 'text-white hover:bg-white/10'
            }`}
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
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg p-4 space-y-2">
            {navLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-neutral-700 font-medium hover:bg-neutral-50 rounded-xl transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="border-t border-neutral-100 pt-2 mt-2">
              {/* Mobile Language Toggle */}
              <div className="px-4 py-3">
                <LanguageToggle variant="scrolled" />
              </div>
              <a
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-neutral-700 font-medium hover:bg-neutral-50 rounded-xl transition-colors"
              >
                Connexion
              </a>
              <a
                href="/login?mode=register"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 bg-primary-600 text-white font-semibold text-center rounded-xl hover:bg-primary-700 transition-colors"
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
