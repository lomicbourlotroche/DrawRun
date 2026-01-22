import React from 'react';
import {
  Zap,
  TrendingUp,
  Download,
  Github,
  ArrowRight,
  Sparkles,
  Target,
  Brain,
  Gauge,
  CheckCircle2
} from 'lucide-react';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-4 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
              <Zap size={20} className="text-black" />
            </div>
            <span className="text-xl font-black tracking-tight">
              DRAW<span className="text-amber-500">RUN</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/lomicbourlotroche/DrawRun"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
            >
              <Github size={16} />
              <span className="text-sm font-bold">GitHub</span>
            </a>
            <a
              href="./DrawRun.apk"
              download="DrawRun.apk"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-sm hover:shadow-lg hover:shadow-amber-500/30 transition-all flex items-center gap-2"
            >
              <Download size={16} />
              APK
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 md:px-12">
        {/* Background Effects */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl opacity-30"></div>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Sparkles size={14} className="text-amber-500" />
              <span className="text-amber-500 text-xs font-black tracking-widest uppercase">
                v3.42 Elite • ScienceEngine™
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-center text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight">
            DOMINEZ VOS<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600">
              LIMITES
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-center text-lg md:text-xl text-white/60 max-w-3xl mx-auto mb-12 leading-relaxed">
            L'application de performance ultime intégrant le moteur{' '}
            <span className="text-amber-500 font-bold">Jack Daniels VDOT V6.4</span> et{' '}
            <span className="text-amber-500 font-bold">15+ métriques avancées</span>.
            Une précision chirurgicale pour vos entraînements.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <a
              href="./DrawRun.apk"
              download="DrawRun.apk"
              className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black hover:shadow-2xl hover:shadow-amber-500/40 transition-all flex items-center gap-3"
            >
              <Download size={20} />
              Télécharger DrawRun
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="https://github.com/lomicbourlotroche/DrawRun"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 font-bold hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <Github size={20} />
              Code Source
            </a>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 text-white/40 mb-16">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-white mb-1">15+</div>
              <div className="text-xs uppercase tracking-widest font-bold">Métriques</div>
            </div>
            <div className="w-px h-12 bg-white/10"></div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-white mb-1">99%</div>
              <div className="text-xs uppercase tracking-widest font-bold">Précision</div>
            </div>
            <div className="w-px h-12 bg-white/10"></div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-white mb-1">TSS</div>
              <div className="text-xs uppercase tracking-widest font-bold">Temps Réel</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 md:px-12 bg-zinc-950/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber-500 text-sm font-black tracking-widest uppercase mb-4">Ingénierie de pointe</p>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              UN ÉCOSYSTÈME<br />SANS COMPROMIS
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={Brain}
              title="ScienceEngine™"
              desc="15+ métriques avancées : TSS, TRIMP, NP, Age Grading, W', RAI, profils athlétiques."
            />
            <FeatureCard
              icon={Target}
              title="Périodisation 3:1"
              desc="Gestion automatisée avec 3 semaines de progression et 1 de décharge."
            />
            <FeatureCard
              icon={Gauge}
              title="Health Connect"
              desc="HRV, sommeil et pouls au repos pour analyse de disponibilité temps réel."
            />
            <FeatureCard
              icon={TrendingUp}
              title="Prédictions"
              desc="Marathon, Age Grading WMA, Classification profil (Sprinter/Grimpeur/etc.)."
            />
          </div>
        </div>
      </section>

      {/* VDOT Section */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">
              LA SCIENCE<br />DERRIÈRE LA<br />
              <span className="text-amber-500">VITESSE</span>
            </h2>
            <p className="text-lg text-white/50 mb-8 leading-relaxed">
              Le VDOT n'est pas qu'un chiffre. C'est l'essence de votre efficacité running.
              DrawRun analyse chaque foulée pour affiner votre profil physiologique.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-amber-500 shrink-0 mt-1" />
                <div>
                  <p className="font-bold mb-1">Zones Personnalisées</p>
                  <p className="text-sm text-white/40">5 zones d'entraînement calculées sur votre VDOT unique.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-amber-500 shrink-0 mt-1" />
                <div>
                  <p className="font-bold mb-1">TSS en Temps Réel</p>
                  <p className="text-sm text-white/40">Charge d'entraînement calculée dynamiquement.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-amber-500 shrink-0 mt-1" />
                <div>
                  <p className="font-bold mb-1">15+ Métriques Avancées</p>
                  <p className="text-sm text-white/40">Age Grading, W', RAI, Marathon Prediction et plus.</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <h3 className="text-xl font-black mb-6 flex items-center gap-3">
              <TrendingUp className="text-amber-500" />
              ZONES VDOT
            </h3>
            <div className="space-y-3">
              <ZoneRow label="EASY (E)" value="4:45 - 5:15" color="#22C55E" />
              <ZoneRow label="MARATHON (M)" value="4:15" color="#3B82F6" />
              <ZoneRow label="THRESHOLD (T)" value="3:58" color="#A855F7" />
              <ZoneRow label="INTERVAL (I)" value="3:42" color="#EF4444" />
              <ZoneRow label="REPETITION (R)" value="3:25" color="#F59E0B" />
            </div>
            <div className="mt-6 p-4 bg-white/5 rounded-2xl text-xs text-white/40 italic">
              *Basé sur une performance récente au 10km en 39:00.
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 md:px-12 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                <Zap size={20} className="text-black" />
              </div>
              <span className="text-xl font-black">
                DRAW<span className="text-amber-500">RUN</span>
              </span>
            </div>

            <div className="flex items-center gap-6">
              <a
                href="https://github.com/lomicbourlotroche/DrawRun"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-amber-500 transition-colors text-sm font-bold"
              >
                GitHub
              </a>
            </div>
          </div>

          <div className="text-center text-white/30 text-xs font-bold">
            © 2026 DrawRun • Powered by ScienceEngine™
          </div>
        </div>
      </footer>
    </div>
  );
}

const FeatureCard = ({ icon: Icon, title, desc }) => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-amber-500/30 transition-all">
    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
      <Icon size={24} className="text-amber-500" />
    </div>
    <h3 className="text-lg font-black mb-2">{title}</h3>
    <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
  </div>
);

const ZoneRow = ({ label, value, color }) => (
  <div className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
    <div className="flex items-center gap-3">
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
      <span className="text-sm font-bold text-white/80">{label}</span>
    </div>
    <span className="text-sm font-black font-mono">{value}</span>
  </div>
);

export default App;
