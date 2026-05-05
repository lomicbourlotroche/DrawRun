'use client';

import Image from 'next/image';
import { Activity, Github, Twitter, Mail } from 'lucide-react';

const footerLinks = {
  produit: [
    { label: 'Fonctionnalités', href: '#features' },
    { label: 'App Garmin', href: '#garmin' },
    { label: 'VDOT', href: '#vdot' },
    { label: 'Télécharger l\'App', href: '/drawrun-debug.apk', download: true },
  ],
  compte: [
    { label: 'S\'inscrire', href: '/login?mode=register' },
    { label: 'Connexion', href: '/login' },
  ],
  communaute: [
    { label: 'GitHub', href: 'https://github.com/lomicbourlotroche/DrawRun', external: true },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-neutral-900 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                DRAW<span className="text-primary-400">RUN</span>
              </span>
            </div>
            <p className="text-neutral-400 mb-6 max-w-sm">
              L&apos;application de performance ultime intégrant le moteur Jack Daniels VDOT V6.4 
              et 15+ métriques avancées.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3">
              {[
                { icon: Github, href: 'https://github.com/lomicbourlotroche/DrawRun', label: 'GitHub' },
                { icon: Twitter, href: '#', label: 'Twitter' },
                { icon: Mail, href: 'mailto:contact@drawrun.app', label: 'Email' },
              ].map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    target={social.href.startsWith('http') ? '_blank' : undefined}
                    rel={social.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="w-10 h-10 bg-neutral-800 hover:bg-neutral-700 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Produit</h4>
            <ul className="space-y-3">
              {footerLinks.produit.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    download={link.download}
                    className="text-neutral-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Compte</h4>
            <ul className="space-y-3">
              {footerLinks.compte.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-neutral-400 hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Communauté</h4>
            <ul className="space-y-3">
              {footerLinks.communaute.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-neutral-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-neutral-500">
              © 2026 DrawRun • Powered by <span className="text-primary-400">ScienceEngine™</span>
            </p>
            <div className="flex items-center gap-6 text-sm text-neutral-500">
              <a href="#" className="hover:text-white transition-colors">Confidentialité</a>
              <a href="#" className="hover:text-white transition-colors">Conditions</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
