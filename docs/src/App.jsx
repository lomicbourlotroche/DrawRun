import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Activity, 
  Calendar, 
  Settings, 
  User, 
  TrendingUp, 
  History, 
  Timer, 
  Map as MapIcon, 
  Speedometer, 
  ArrowRight,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import './App.css';

// --- Sub-components ---

const StatCard = ({ title, value, unit, icon: Icon, color }) => (
  <div className="glass p-6 flex flex-col gap-2">
    <div className="flex justify-between items-center">
      <span className="text-xs font-bold text-white/40 tracking-widest">{title}</span>
      {Icon && <Icon size={16} style={{ color }} />}
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-2xl font-black">{value}</span>
      <span className="text-xs text-white/40">{unit}</span>
    </div>
  </div>
);

const AppMockup = () => {
  return (
    <div className="mockup-container floating">
      <div className="phone-frame shadow-2xl">
        <div className="status-bar flex justify-between px-6 pt-4">
          <span className="text-[10px] font-bold">9:41</span>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full border border-white/20"></div>
            <div className="w-3 h-2 rounded-sm border border-white/20"></div>
          </div>
        </div>
        
        {/* App Content Simulation */}
        <div className="app-screen p-6 overflow-y-auto">
          <header className="flex justify-between items-end mb-8">
            <div>
              <p className="text-[10px] text-white/40 tracking-widest uppercase">Tableau de bord</p>
              <h2 className="text-2xl font-black">DRAW<span className="text-amber-500">RUN</span></h2>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Zap className="text-amber-500" size={18} />
            </div>
          </header>

          <div className="glass p-6 mb-6">
            <div className="flex justify-between mb-4">
              <span className="text-[10px] text-white/40 tracking-widest uppercase">Disponibilité</span>
              <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">OPTIMAL</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle cx="48" cy="48" r="40" fill="none" stroke="#f59e0b" strokeWidth="8" strokeDasharray="251" strokeDashoffset="37" strokeLinecap="round" />
                </svg>
                <span className="absolute text-xl font-black">85</span>
              </div>
              <div className="flex flex-col gap-2 flex-1">
                 <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                    <p className="text-[8px] text-white/40">HRV (VRC)</p>
                    <p className="text-xs font-bold">64 <span className="text-[8px] text-white/40 font-normal">ms</span></p>
                 </div>
                 <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                    <p className="text-[8px] text-white/40">Sommeil</p>
                    <p className="text-xs font-bold">8h12 <span className="text-[8px] text-white/40 font-normal">score 92</span></p>
                 </div>
              </div>
            </div>
          </div>

          <div className="suggestion mb-6">
            <h3 className="text-[10px] text-amber-500 font-bold tracking-widest uppercase mb-3 flex items-center gap-2">
              <Activity size={12} /> Suggestion du coach
            </h3>
            <div className="glass p-4 border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent">
              <p className="text-sm font-black mb-1">FRACTIONNÉ TYPE I</p>
              <p className="text-[10px] text-white/60">5 x 800m à 3:45 min/km</p>
            </div>
          </div>

          <div className="recent-activity">
            <p className="text-[10px] text-white/40 tracking-widest uppercase mb-3">Dernière séance</p>
            <div className="glass h-40 relative overflow-hidden group">
               <div className="absolute inset-0 bg-slate-900">
                  <svg className="w-full h-full opacity-30" viewBox="0 0 200 100">
                    <path d="M20,80 C50,40 100,90 150,30 L180,60" fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
                  </svg>
               </div>
               <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
                  <p className="text-[10px] font-black uppercase text-amber-500">Course Urbaine Matinale</p>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex gap-4">
                      <div>
                        <p className="text-[8px] text-white/40">DIST</p>
                        <p className="text-[10px] font-bold">12.4 km</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-white/40">PACE</p>
                        <p className="text-[10px] font-bold">4:12</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-white/40" />
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Navbar */}
        <div className="navbar absolute bottom-0 left-0 right-0 h-20 bg-black/80 backdrop-blur-md border-t border-white/5 flex justify-around items-center px-4 pb-4">
            <div className="flex flex-col items-center gap-1 text-amber-500">
              <Activity size={18} />
              <span className="text-[8px] font-black">DASH</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-white/30">
              <History size={18} />
              <span className="text-[8px] font-black">JOURNAL</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-white/30">
              <TrendingUp size={18} />
              <span className="text-[8px] font-black">VDOT</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-white/30">
              <User size={18} />
              <span className="text-[8px] font-black">PROFIL</span>
            </div>
        </div>
      </div>
    </div>
  );
};


function App() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-6 flex justify-between items-center bg-black/50 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center">
            <Zap size={20} className="text-black fill-black" />
          </div>
          <span className="text-xl font-black tracking-tighter">DRAW<span className="text-amber-500">RUN</span></span>
        </div>
        <div className="hidden md:flex gap-12 text-sm font-bold text-white/60">
          <a href="#vdot" className="hover:text-amber-500 transition-colors">V6.4 VDOT</a>
          <a href="#features" className="hover:text-amber-500 transition-colors">FONCTIONNALITÉS</a>
          <a href="#tech" className="hover:text-amber-500 transition-colors">LYRA ENGINE</a>
        </div>
        <button className="btn-primary flex items-center gap-2 text-xs">
          Télécharger <Smartphone size={14} />
        </button>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-40 pb-20 px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black tracking-widest uppercase mb-6 border border-amber-500/20">
              <Zap size={12} /> Version v3.42 Elite
            </div>
            <h1 className="text-6xl md:text-8xl mb-8 leading-[0.9]">
              DOMINEZ VOS <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-amber-200 to-amber-600">LIMITES</span>
            </h1>
            <p className="text-xl text-white/50 max-w-xl mb-12 font-medium">
              L'application de performance ultime intégrant le moteur Jack Daniels VDOT V6.4. Une précision chirurgicale pour vos entraînements, synchronisée avec Strava & Health Connect.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button className="btn-primary py-4 px-10 text-base flex items-center justify-center gap-3 shadow-xl shadow-amber-500/20">
                Lancer la session <ArrowRight size={20} />
              </button>
              <button className="glass py-4 px-10 border-white/10 text-base font-bold hover:bg-white/5 transition-colors">
                Explorer l'algorithme
              </button>
            </div>
            
            <div className="mt-16 flex items-center justify-center lg:justify-start gap-8 opacity-40">
              <div className="flex flex-col">
                <span className="text-2xl font-black">3:1</span>
                <span className="text-[10px] uppercase tracking-widest font-bold">Step Loading</span>
              </div>
              <div className="w-px h-8 bg-white/20"></div>
              <div className="flex flex-col">
                <span className="text-2xl font-black">99%</span>
                <span className="text-[10px] uppercase tracking-widest font-bold">Précision VDOT</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 relative w-full flex justify-center">
             <AppMockup />
             {/* Decorative glows */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/20 blur-[120px] rounded-full -z-10"></div>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section id="features" className="py-40 px-8 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-amber-500 text-sm font-black tracking-[0.3em] uppercase mb-4">Ingénierie de pointe</p>
            <h2 className="text-4xl md:text-6xl">UN ÉCOSYSTÈME <br /> SANS COMPROMIS</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Zap} 
              title="Moteur VDOT V6.4" 
              desc="L'algorithme de Jack Daniels porté à la perfection numérique. Calcul précis de vos allures Easy, M, T, I, R."
            />
            <FeatureCard 
              icon={ShieldCheck} 
              title="Health Connect 3.0" 
              desc="Récupération instantanée du HRV, sommeil et pouls au repos pour une analyse de disponibilité temps réel."
            />
            <FeatureCard 
              icon={TrendingUp} 
              title="Périodisation 3:1" 
              desc="Gestion automatisée de la charge avec 3 semaines de progression et 1 semaine de décharge spécifique."
            />
          </div>
        </div>
      </section>

      {/* VDOT Section */}
      <section id="vdot" className="py-40 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-20 items-center">
           <div className="flex-1 order-2 md:order-1">
              <div className="glass p-8 border-amber-500/10 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <TrendingUp size={200} strokeWidth={8} />
                 </div>
                 <h3 className="text-3xl font-black mb-6">TABLEAU DE RYTHMES VDOT</h3>
                 <div className="space-y-4">
                    <VdotRow label="EASY (E)" value="4:45 - 5:15" color="#22C55E" />
                    <VdotRow label="MARATHON (M)" value="4:15" color="#3B82F6" />
                    <VdotRow label="THRESHOLD (T)" value="3:58" color="#A855F7" />
                    <VdotRow label="INTERVAL (I)" value="3:42" color="#EF4444" />
                    <VdotRow label="REPETITION (R)" value="3:25" color="#F59E0B" />
                 </div>
                 <div className="mt-8 p-4 bg-white/5 rounded-xl text-[10px] text-white/50 italic border border-white/5">
                    *Basé sur une performance récente au 10km en 39:00.
                 </div>
              </div>
           </div>
           
           <div className="flex-1 order-1 md:order-2">
              <h2 className="text-4xl md:text-6xl mb-8">LA SCIENCE <br /> DERRIÈRE LA VITESSE</h2>
              <p className="text-lg text-white/50 mb-10 leading-relaxed">
                Le VDOT n'est pas qu'un chiffre. C'est l'essence de votre efficacité running. DrawRun analyse chaque foulée pour affiner votre profil physiologique et vous garantir que chaque séance vous rapproche de votre sommet.
              </p>
              <ul className="space-y-4">
                 <li className="flex items-start gap-3">
                    <CheckCircle2 size={24} className="text-amber-500 shrink-0" />
                    <div>
                      <p className="font-bold">Adaptation Lymphatique</p>
                      <p className="text-sm text-white/40">Optimisation du retour veineux post-effort.</p>
                    </div>
                 </li>
                 <li className="flex items-start gap-3">
                    <CheckCircle2 size={24} className="text-amber-500 shrink-0" />
                    <div>
                      <p className="font-bold">Calcul du Dual-Stress</p>
                      <p className="text-sm text-white/40">Équilibre entre charge mécanique et stress cardiaque.</p>
                    </div>
                 </li>
              </ul>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
           <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center">
              <Zap size={20} className="text-black fill-black" />
            </div>
            <span className="text-xl font-black tracking-tighter">DRAW<span className="text-amber-500">RUN</span></span>
          </div>
          <div className="flex gap-8 text-white/40 text-xs font-bold uppercase tracking-widest">
            <span>© 2026 Antigravity Systems</span>
            <span>Confidentialité</span>
            <span>Terms</span>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full glass flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
              <Activity size={18} />
            </div>
             <div className="w-10 h-10 rounded-full glass flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
              <ShieldCheck size={18} />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const FeatureCard = ({ icon: Icon, title, desc }) => (
  <div className="glass p-10 hover:border-amber-500/30 transition-all group">
    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-black transition-all">
      <Icon size={28} />
    </div>
    <h3 className="text-xl mb-4 font-black">{title}</h3>
    <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
  </div>
);

const VdotRow = ({ label, value, color }) => (
  <div className="flex justify-between items-center py-3 border-b border-white/5">
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
      <span className="text-sm font-bold text-white/80">{label}</span>
    </div>
    <span className="text-sm font-black font-mono tracking-wider">{value}</span>
  </div>
);

export default App;
