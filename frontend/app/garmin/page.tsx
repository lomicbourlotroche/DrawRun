'use client';

import Navbar from '@/components/layout/NavBar';
import Link from 'next/link';

export default function GarminPage() {
  return (
    <>
      <Navbar />
      <main className="garmin-doc-page">
        <div className="garmin-doc-container">
          <div className="garmin-doc-header">
            <div className="garmin-badge">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
              Connect IQ App
            </div>
            <h1>DrawRun Training<br/><span className="gradient-text">Pour Garmin</span></h1>
            <p className="subtitle">
              Accédez à votre plan d&apos;entraînement DrawRun directement sur votre montre Garmin.
              Consultez vos séances, zones et PMC sans sortir votre téléphone.
            </p>
          </div>

          <div className="garmin-doc-content">
            <section className="doc-section">
              <h2> Fonctionnalités</h2>
              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-icon">📊</div>
                  <h3>PMC en Temps Réel</h3>
                  <p>Consultez votre CTL (forme), ATL (fatigue) et TSB (balance) directement sur la montre.</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">🎯</div>
                  <h3>Zones Cibles</h3>
                  <p>Vos 5 zones de fréquence cardiaque et d&apos;allure, personnalisées selon votre VDOT.</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">📅</div>
                  <h3>Séance du Jour</h3>
                  <p>Découvrez chaque jour la séance recommandée basée sur votre charge d&apos;entraînement.</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">📱</div>
                  <h3>Plan d&apos;Entraînement</h3>
                  <p>Visualisez votre programme complet directement sur votre poignet.</p>
                </div>
              </div>
            </section>

            <section className="doc-section">
              <h2>Installation</h2>
              
              <div className="install-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Prérequis</h3>
                  <ul>
                    <li>Montre Garmin compatible (Forerunner, Fenix, Epix, Instinct, Vivoactive)</li>
                    <li>Garmin Connect Mobile installé sur votre smartphone</li>
                    <li>VS Code avec extension Monkey C (pour développement)</li>
                  </ul>
                </div>
              </div>

              <div className="install-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Installer le SDK Connect IQ</h3>
                  <ol>
                    <li>Télécharger le SDK Manager depuis <a href="https://developer.garmin.com/connect-iq/sdk/" target="_blank" rel="noopener">developer.garmin.com</a></li>
                    <li>Installer le SDK et sélectionner les appareils cibles</li>
                    <li>Installer l&apos;extension VS Code &quot;Monkey C&quot;</li>
                  </ol>
                </div>
              </div>

              <div className="install-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Compiler l&apos;App</h3>
                  <pre><code>{`cd garmin-app
monkeyc -o DrawRunTraining.prg -d forerunner955`}</code></pre>
                  <p className="note">Remplacez <code>forerunner955</code> par votre modèle de montre.</p>
                </div>
              </div>

              <div className="install-step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3>Installer sur la Montre</h3>
                  <ul>
                    <li>Connecter la montre en USB</li>
                    <li>Transférer le fichier <code>.iq</code> ou <code>.prg</code></li>
                    <li>Ou utiliser Garmin Connect Mobile pour installer</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="doc-section">
              <h2>Compatibilité</h2>
              <div className="device-table">
                <div className="device-row header">
                  <span>Gamme</span>
                  <span>Modèles Supportés</span>
                </div>
                <div className="device-row">
                  <span className="device-brand">Forerunner</span>
                  <span>55, 55 Music, 255, 255 Music, 955, 965</span>
                </div>
                <div className="device-row">
                  <span className="device-brand">Fenix</span>
                  <span>6, 6 Pro, 6X, 7, 7X, 7X Pro, 8, 8 Pro, 8X</span>
                </div>
                <div className="device-row">
                  <span className="device-brand">Epix</span>
                  <span>Gen 1, Gen 2, Pro</span>
                </div>
                <div className="device-row">
                  <span className="device-brand">Instinct</span>
                  <span>2, 2S, 2X, Crossover</span>
                </div>
                <div className="device-row">
                  <span className="device-brand">Vivoactive</span>
                  <span>4, 4S, 5</span>
                </div>
              </div>
            </section>

            <section className="doc-section">
              <h2>API Backend</h2>
              <p>L&apos;app communique avec le backend DrawRun via les endpoints suivants :</p>
              <div className="api-endpoints">
                <div className="endpoint">
                  <span className="method get">GET</span>
                  <code>/api/garmin/workout</code>
                  <span className="desc">Séance du jour</span>
                </div>
                <div className="endpoint">
                  <span className="method get">GET</span>
                  <code>/api/garmin/plan</code>
                  <span className="desc">Plan d&apos;entraînement</span>
                </div>
                <div className="endpoint">
                  <span className="method get">GET</span>
                  <code>/api/garmin/zones</code>
                  <span className="desc">Zones d&apos;entraînement</span>
                </div>
                <div className="endpoint">
                  <span className="method get">GET</span>
                  <code>/api/garmin/pmc</code>
                  <span className="desc">Données PMC</span>
                </div>
              </div>
            </section>

            <section className="doc-section">
              <h2>Code Source</h2>
              <p>Le code source de l&apos;app Garmin est disponible dans le dossier <code>garmin-app/</code> du projet.</p>
              <div className="code-structure">
                <pre><code>{`garmin-app/
├── manifest.xml           # Manifeste de l'app
├── resources/
│   └── app.xml           # Métadonnées
├── source/
│   ├── App.mc            # Point d'entrée
│   ├── ApiClient.mc      # Client API
│   ├── MainView.mc        # Vue principale
│   ├── SyncView.mc        # Synchronisation
│   └── WorkoutManager.mc   # Stockage local
└── README.md`}</code></pre>
              </div>
            </section>

            <section className="doc-section cta-section">
              <h2>Prochaine Étape</h2>
              <p>Prêt à installer l&apos;app sur votre montre Garmin ?</p>
              <div className="cta-buttons">
                <a href="https://apps.garmin.com" target="_blank" rel="noopener" className="btn-garmin-primary">
                  Bientôt sur Connect IQ Store
                </a>
                <Link href="/app" className="btn-garmin-outline">
                  Accéder à DrawRun
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
