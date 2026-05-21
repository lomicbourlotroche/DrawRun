'use client';

import { useEffect } from 'react';
import {
  Navbar,
  HeroSection,
  WebAppSection,
  RacePlanningSection,
  WeatherSection,
  PWASection,
  FeaturesSection,
  VDOTSection,
  SocialSection,
  HowItWorksSection,
  Footer,
} from './_sections';

function isValidHashSelector(hash: string): boolean {
  return /^#[a-zA-Z][\w-]*$/.test(hash);
}

export default function Home() {
  useEffect(() => {
    if (window.location.hash && isValidHashSelector(window.location.hash)) {
      const element = document.querySelector(window.location.hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  return (
    <>
      <Navbar />
      <HeroSection />
      <WebAppSection />
      <RacePlanningSection />
      <WeatherSection />
      <PWASection />
      <FeaturesSection />
      <VDOTSection />
      <SocialSection />
      <HowItWorksSection />
      <Footer />
    </>
  );
}

