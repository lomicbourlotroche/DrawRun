import Image from 'next/image';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Image src="/logo.svg" alt="DrawRun" width={120} height={30} className="brightness-0 invert" priority />
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="/" className="text-foreground/80 hover:text-foreground transition-colors">
              Accueil
            </a>
            <a href="/garmin" className="text-foreground/80 hover:text-foreground transition-colors">
              Garmin
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
