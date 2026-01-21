import React, { useState, useEffect } from 'react';
import {
  Zap,
  Activity,
  TrendingUp,
  Timer,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  Github,
  Download,
  Sparkles,
  Target,
  Brain,
  Gauge
} from 'lucide-react';
import './App.css';

function App() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-6 flex justify-between items-center bg-black/80 backdrop-blur-2xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Zap size={22} className="text-black fill-black" />
          </div>
          <span className="text-2xl font-black tracking-tighter">
            DRAW<span className="text-amber-500">RUN</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://github.com/lomicbourlotroche/DrawRun"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-bold"
          >
            <Github size={18} />
            <span>GitHub</span>
          </a>
          <button className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-sm hover:shadow-lg hover:shadow-amber-500/30 transition-all flex items-center gap-2">
            <Download size={16} />
            Télécharger
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 md:pt-40 pb-20 px-6 md:px-12 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-black tracking-widest uppercase mb-8">
              <Sparkles size={14} />
              Version v3.42 Elite
            </div>

            {/* Title */}
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-8 leading-[0.85] tracking-tighter">
              DOMINEZ VOS<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 animate-gradient">
                LIMITES
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-white/50 max-w-3xl mx-auto mb-12 font-medium leading-relaxed">
              L'application de performance ultime intégrant le moteur <span className="text-amber-500 font-bold">Jack Daniels VDOT V6.4</span>.
              Une précision chirurgicale pour vos entraînements.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
              <button className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-base hover:shadow-2xl hover:shadow-amber-500/40 transition-all flex items-center gap-3">
                Lancer la session
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 font-bold hover:bg-white/10 transition-all">
                Explorer l'algorithme
              </button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-white/40">
              <div className="flex flex-col items-center">
                <span className="text-3xl md:text-4xl font-black text-white mb-2">3:1</span>
                <span className="text-xs uppercase tracking-widest font-bold">Step Loading</span>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="flex flex-col items-center">
                <span className="text-3xl md:text-4xl font-black text-white mb-2">99%</span>
                <span className="text-xs uppercase tracking-widest font-bold">Précision VDOT</span>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="flex flex-col items-center">
                <span className="text-3xl md:text-4xl font-black text-white mb-2">5</span>
                <span className="text-xs uppercase tracking-widest font-bold">Zones Training</span>
              </div>
            </div>
          </div>

          {/* App Preview */}
          <div className="relative max-w-sm mx-auto">
            <div className="relative z-10 rounded-[3rem] overflow-hidden border-8 border-zinc-900 shadow-2xl shadow-black/50">
              <div className="bg-gradient-to-br from-zinc-900 to-black p-6 aspect-[9/19]">
                {/* Status Bar */}
                <div className="flex justify-between items-center mb-6 text-xs">
                  <span className="font-bold">9:41</span>
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-full bg-white/20" />
                    <div className="w-4 h-4 rounded-full bg-white/20" />
                  </div>
                </div>

                {/* Header */}
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <p className="text-[10px] text-white/40 tracking-widest uppercase mb-1">Tableau de bord</p>
                    <h2 className="text-2xl font-black">DRAW<span className="text-amber-500">RUN</span></h2>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Zap className="text-amber-500" size={20} />
                  </div>
                </div>

                {/* Readiness Card */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-6 backdrop-blur-xl">
                  <div className="flex justify-between mb-4">
                    <span className="text-[10px] text-white/40 tracking-widest uppercase">Disponibilité</span>
                    <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded-lg">OPTIMAL</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="relative w-20 h-20">
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                        <circle cx="40" cy="40" r="32" fill="none" stroke="#f59e0b" strokeWidth="6" strokeDasharray="200" strokeDashoffset="30" strokeLinecap="round" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xl font-black">85</span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                        <p className="text-[8px] text-white/40">HRV (VRC)</p>
                        <p className="text-xs font-bold">64 <span className="text-[8px] text-white/40">ms</span></p>
                      </div>
                      <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                        <p className="text-[8px] text-white/40">Sommeil</p>
                        <p className="text-xs font-bold">8h12 <span className="text-[8px] text-white/40">score 92</span></p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Suggestion */}
                <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-3xl p-5 backdrop-blur-xl">
                  <h3 className="text-[10px] text-amber-500 font-bold tracking-widest uppercase mb-3 flex items-center gap-2">
                    <Activity size={12} /> Suggestion du coach
                  </h3>
                  <p className="text-sm font-black mb-1">FRACTIONNÉ TYPE I</p>
                  <p className="text-[10px] text-white/60">5 x 800m à 3:45 min/km</p>
                </div>
              </div>
            </div>

            {/* Glow effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-amber-500/20 blur-[100px] -z-10" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-6 md:px-12 bg-gradient-to-b from-zinc-950/50 to-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-amber-500 text-sm font-black tracking-[0.3em] uppercase mb-4">Ingénierie de pointe</p>
            <h2 className="text-4xl md:text-6xl font-black mb-6">
              UN ÉCOSYSTÈME<br />SANS COMPROMIS
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={Brain}
              title="Moteur VDOT V6.4"
              desc="Algorithme Jack Daniels pour calcul précis de vos allures E, M, T, I, R."
              color="from-amber-500/20 to-amber-600/20"
            />
            <FeatureCard
              icon={Target}
              title="Périodisation 3:1"
              desc="Gestion automatisée avec 3 semaines de progression et 1 de décharge."
              color="from-purple-500/20 to-purple-600/20"
            />
            <FeatureCard
              icon={Gauge}
              title="Health Connect"
              desc="HRV, sommeil et pouls au repos pour analyse de disponibilité temps réel."
              color="from-emerald-500/20 to-emerald-600/20"
            />
            <FeatureCard
              icon={TrendingUp}
              title="Sync Strava"
              desc="Synchronisation automatique de vos activités et statistiques."
              color="from-blue-500/20 to-blue-600/20"
            />
          </div>
        </div>
      </section>

      {/* VDOT Section */}
      <section className="py-32 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
              LA SCIENCE<br />DERRIÈRE LA<br />
              <span className="text-amber-500">VITESSE</span>
            </h2>
            <p className="text-lg text-white/50 mb-10 leading-relaxed">
              Le VDOT n'est pas qu'un chiffre. C'est l'essence de votre efficacité running.
              DrawRun analyse chaque foulée pour affiner votre profil physiologique.
            </p>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <CheckCircle2 size={24} className="text-amber-500 shrink-0 mt-1" />
                <div>
                  <p className="font-bold text-lg mb-1">Adaptation Lymphatique</p>
                  <p className="text-sm text-white/40">Optimisation du retour veineux post-effort.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <CheckCircle2 size={24} className="text-amber-500 shrink-0 mt-1" />
                <div>
                  <p className="font-bold text-lg mb-1">Calcul du Dual-Stress</p>
                  <p className="text-sm text-white/40">Équilibre entre charge mécanique et stress cardiaque.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <CheckCircle2 size={24} className="text-amber-500 shrink-0 mt-1" />
                <div>
                  <p className="font-bold text-lg mb-1">Zones Personnalisées</p>
                  <p className="text-sm text-white/40">5 zones d'entraînement calculées sur votre VDOT unique.</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
            <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
              <TrendingUp className="text-amber-500" />
              TABLEAU DE RYTHMES VDOT
            </h3>
            <div className="space-y-4">
              <VdotRow label="EASY (E)" value="4:45 - 5:15" color="#22C55E" />
              <VdotRow label="MARATHON (M)" value="4:15" color="#3B82F6" />
              <VdotRow label="THRESHOLD (T)" value="3:58" color="#A855F7" />
              <VdotRow label="INTERVAL (I)" value="3:42" color="#EF4444" />
              <VdotRow label="REPETITION (R)" value="3:25" color="#F59E0B" />
            </div>
            <div className="mt-8 p-4 bg-white/5 rounded-2xl text-xs text-white/40 italic border border-white/5">
              *Basé sur une performance récente au 10km en 39:00.
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 md:px-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Zap size={22} className="text-black fill-black" />
              </div>
              <span className="text-2xl font-black tracking-tighter">
                DRAW<span className="text-amber-500">RUN</span>
              </span>
            </div>

            <div className="flex items-center gap-6">
              <a
                href="https://github.com/lomicbourlotroche/DrawRun"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-white/60 hover:text-amber-500 transition-colors"
              >
                <Github size={20} />
                <span className="text-sm font-bold">GitHub</span>
              </a>
              <a href="#" className="text-white/60 hover:text-amber-500 transition-colors text-sm font-bold">
                Confidentialité
              </a>
              <a href="#" className="text-white/60 hover:text-amber-500 transition-colors text-sm font-bold">
                Terms
              </a>
            </div>
          </div>

          <div className="text-center text-white/30 text-xs font-bold tracking-widest">
            © 2026 DrawRun • Powered by Jack Daniels VDOT V6.4
          </div>
        </div>
      </footer>
    </div>
  );
}

const FeatureCard = ({ icon: Icon, title, desc, color }) => (
  <div className={`group relative bg-gradient-to-br ${color} border border-white/10 rounded-3xl p-8 hover:border-amber-500/30 transition-all overflow-hidden`}>
    <div className="relative z-10">
      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-black transition-all">
        <Icon size={28} />
      </div>
      <h3 className="text-xl font-black mb-3">{title}</h3>
      <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
    </div>
    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
  </div>
);

const VdotRow = ({ label, value, color }) => (
  <div className="flex justify-between items-center py-4 border-b border-white/5 last:border-0">
    <div className="flex items-center gap-3">
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-sm font-bold text-white/80">{label}</span>
    </div>
    <span className="text-sm font-black font-mono tracking-wider">{value}</span>
  </div>
);

export default App;
