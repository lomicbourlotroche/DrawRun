/**
 * ============================================================
 * DRAWRUN DEVELOPER ASSISTANT - CLI Interactif (Version Pro)
 * ============================================================
 * Outil d'assistance complet rédigé en français pour aider un
 * développeur humain à configurer, comprendre, tester et
 * modifier le projet DrawRun.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const readline = require('readline');
const crypto = require('crypto');

// Charger les variables d'environnement si possibles
const backendDir = path.join(__dirname, '../backend');
require('dotenv').config({ path: path.join(backendDir, '.env') });

// Charger les algorithmes du backend pour le bac à sable scientifique
let RunningPerformance, TrainingLoad;
try {
    const rpModule = require('../backend/src/algorithms/running_performance');
    RunningPerformance = rpModule.RunningPerformance;
    const tlModule = require('../backend/src/algorithms/training_load');
    TrainingLoad = tlModule.TrainingLoad;
} catch (e) {
    // Si les dépendances ne sont pas prêtes ou si on est hors contexte
}

// Couleurs ANSI pour le terminal
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    underscore: '\x1b[4m',
    blink: '\x1b[5m',
    reverse: '\x1b[7m',
    hidden: '\x1b[8m',
    
    fgBlack: '\x1b[30m',
    fgRed: '\x1b[31m',
    fgGreen: '\x1b[32m',
    fgYellow: '\x1b[33m',
    fgBlue: '\x1b[34m',
    fgMagenta: '\x1b[35m',
    fgCyan: '\x1b[36m',
    fgWhite: '\x1b[37m',
    
    bgBlack: '\x1b[40m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
    bgMagenta: '\x1b[45m',
    bgCyan: '\x1b[46m',
    bgWhite: '\x1b[47m'
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

function printBanner() {
    console.clear();
    console.log(`${colors.fgCyan}${colors.bright}`);
    console.log('    ____                     ____               ');
    console.log('   / __ \\_______ ___  __  __/ __ \\__  ______  __');
    console.log('  / / / / ___/ __ `/ |/_/ / /_/ / / / / __ \\/ /');
    console.log(' / /_/ / /  / /_/ />  <  / _, _/ /_/ / / / /_/ ');
    console.log('/_____/_/   \\__,_/_/|_| /_/ |_|\\__,_/_/ /_(_/  ');
    console.log('                                                ');
    console.log(`         ASSISTANT DEVELOPPEUR HUMAIN v2.0.0${colors.reset}\n`);
}

// Option 1 : Diagnostic & Configuration
async function runDiagnostic() {
    printBanner();
    console.log(`${colors.bright}🔍 DIAGNOSTIC DE L'ENVIRONNEMENT...${colors.reset}\n`);
    
    let isOk = true;

    // Node.js
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion >= 18) {
        console.log(`✅ ${colors.fgGreen}Node.js${colors.reset} : ${nodeVersion} (Requis >= 18)`);
    } else {
        console.log(`❌ ${colors.fgRed}Node.js${colors.reset} : ${nodeVersion} (Requis >= 18 - Veuillez mettre à jour)`);
        isOk = false;
    }

    // Fichiers .env
    const backendEnvPath = path.join(__dirname, '../backend/.env');
    const backendEnvExamplePath = path.join(__dirname, '../backend/.env.example');
    
    if (fs.existsSync(backendEnvPath)) {
        console.log(`✅ ${colors.fgGreen}Configuration Backend (.env)${colors.reset} : Présente`);
    } else {
        console.log(`⚠️  ${colors.fgYellow}Configuration Backend (.env)${colors.reset} : Absente`);
        console.log(`   Copie de .env.example en cours...`);
        try {
            if (fs.existsSync(backendEnvExamplePath)) {
                let envContent = fs.readFileSync(backendEnvExamplePath, 'utf8');
                const jwtSecret = crypto.randomBytes(48).toString('base64');
                const credSecret = crypto.randomBytes(24).toString('base64');
                envContent = envContent.replace(/JWT_SECRET=.*/g, `JWT_SECRET=${jwtSecret}`);
                envContent = envContent.replace(/CREDENTIALS_SECRET=.*/g, `CREDENTIALS_SECRET=${credSecret}`);
                fs.writeFileSync(backendEnvPath, envContent);
                console.log(`   🎉 ${colors.fgGreen}.env créé avec des clés secrètes générées !${colors.reset}`);
            } else {
                console.log(`   ❌ Fichier .env.example introuvable.`);
                isOk = false;
            }
        } catch (e) {
            console.log(`   ❌ Erreur de copie: ${e.message}`);
            isOk = false;
        }
    }

    const frontendEnvPath = path.join(__dirname, '../frontend/.env.local');
    if (fs.existsSync(frontendEnvPath)) {
        console.log(`✅ ${colors.fgGreen}Configuration Frontend (.env.local)${colors.reset} : Présente`);
    } else {
        console.log(`⚠️  ${colors.fgYellow}Configuration Frontend (.env.local)${colors.reset} : Absente`);
        try {
            fs.writeFileSync(frontendEnvPath, 'NEXT_PUBLIC_API_URL=http://localhost:3000\n');
            console.log(`   🎉 ${colors.fgGreen}.env.local créé !${colors.reset}`);
        } catch (e) {
            console.log(`   ❌ Erreur: ${e.message}`);
            isOk = false;
        }
    }

    // Modules
    const backendModulesExist = fs.existsSync(path.join(__dirname, '../backend/node_modules'));
    const frontendModulesExist = fs.existsSync(path.join(__dirname, '../frontend/node_modules'));
    if (backendModulesExist && frontendModulesExist) {
        console.log(`✅ ${colors.fgGreen}Dépendances (node_modules)${colors.reset} : Installées`);
    } else {
        console.log(`⚠️  ${colors.fgYellow}Dépendances (node_modules)${colors.reset} : Manquantes`);
        console.log('   Lancez `npm run install:all` pour installer.');
        isOk = false;
    }

    // Base de données
    const dataDir = process.env.DATA_DIR || path.join(__dirname, '../../DrawRun-Data');
    if (fs.existsSync(dataDir)) {
        console.log(`✅ ${colors.fgGreen}Dossier Base de Données${colors.reset} : Prêt (${dataDir})`);
    }

    console.log('\n------------------------------------------------');
    if (isOk) {
        console.log(`${colors.fgGreen}${colors.bright}Tout est prêt pour travailler ! 🚀${colors.reset}`);
    } else {
        console.log(`${colors.fgYellow}Veuillez régler les avertissements ci-dessus.${colors.reset}`);
    }
    console.log('------------------------------------------------');
    await askQuestion('\nAppuyez sur Entrée pour continuer...');
}

// Option 2 : Générer l'utilisateur de test
async function generateMockData() {
    printBanner();
    console.log(`${colors.bright}🔄 GÉNÉRATION DU COMPTE DE TEST DEVELOPPEUR...${colors.reset}\n`);
    const confirm = await askQuestion('Voulez-vous générer le compte testeur@drawrun.local ? (o/n) : ');
    if (confirm.toLowerCase() === 'o') {
        try {
            console.log('\n⏳ Génération en cours...');
            execSync('node scripts/generate-mock.js', { cwd: backendDir, stdio: 'inherit' });
        } catch (e) {
            console.log(`\n❌ Erreur lors de la génération : ${e.message}`);
        }
    }
    await askQuestion('\nAppuyez sur Entrée pour continuer...');
}

// Option 3 : Lancer l'application
async function startApplication() {
    printBanner();
    console.log(`${colors.fgGreen}${colors.bright}🚀 DÉMARRAGE DES SERVEURS DEV...${colors.reset}\n`);
    const answer = await askQuestion('Voulez-vous lancer l\'application ? (o/n) : ');
    if (answer.toLowerCase() === 'o') {
        rl.close();
        spawn('npm', ['run', 'dev'], { cwd: path.join(__dirname, '..'), stdio: 'inherit', shell: true });
    }
}

// Option 4 : Éditeur de Base de Données (Database Editor)
async function databaseEditorMenu() {
    while (true) {
        printBanner();
        console.log(`${colors.bright}📁 ÉDITEUR DE BASE DE DONNÉES INTERACTIF${colors.reset}\n`);
        console.log('[1] Modifier le profil utilisateur (VMA, VDOT, Poids...)');
        console.log('[2] Ajouter une activité personnalisée');
        console.log('[3] Lister les activités récentes');
        console.log('[4] Supprimer une activité par son ID');
        console.log('[5] Retour au menu principal');
        
        console.log();
        const choice = await askQuestion('Faites votre choix (1-5) : ');
        
        if (choice === '5') break;
        
        if (choice === '1') {
            printBanner();
            console.log(`${colors.bright}👤 MODIFICATION DU PROFIL UTILISATEUR${colors.reset}\n`);
            try {
                // Charger le profil de testeur
                const profileRaw = execSync(
                    `node -e "const db = require('./src/database'); (async () => { await db.initMainDb(); const u = await db.dbGetMain('SELECT id, email, profile_data FROM users WHERE email = ?', ['testeur@drawrun.local']); console.log(JSON.stringify(u)); process.exit(0); })()"`,
                    { cwd: backendDir }
                ).toString();
                const user = JSON.parse(profileRaw);
                
                if (!user) {
                    console.log('❌ Utilisateur testeur@drawrun.local introuvable. Veuillez le générer (Option 2).');
                    await askQuestion('\nEntrée pour continuer...');
                    continue;
                }
                
                const profile = JSON.parse(user.profile_data || '{}');
                console.log(`Profil actuel pour ${user.email} :`);
                console.log(`- Nom: ${profile.name || 'N/A'}`);
                console.log(`- VMA: ${profile.vma || 'N/A'} km/h`);
                console.log(`- VDOT: ${profile.vdot || 'N/A'}`);
                console.log(`- Poids: ${profile.weight || 'N/A'} kg`);
                console.log(`- FC Max: ${profile.max_heart_rate || 'N/A'} bpm`);
                console.log(`- FC Repos: ${profile.resting_heart_rate || 'N/A'} bpm`);
                console.log(`- Âge: ${profile.age || 'N/A'} ans\n`);
                
                const name = await askQuestion(`Nouveau nom (${profile.name || ''}) : `) || profile.name;
                const vma = parseFloat(await askQuestion(`Nouvelle VMA (${profile.vma || ''}) : `)) || profile.vma;
                const vdot = parseFloat(await askQuestion(`Nouveau VDOT (${profile.vdot || ''}) : `)) || profile.vdot;
                const weight = parseFloat(await askQuestion(`Nouveau poids (${profile.weight || ''}) : `)) || profile.weight;
                const maxHR = parseInt(await askQuestion(`Nouvelle FC Max (${profile.max_heart_rate || ''}) : `)) || profile.max_heart_rate;
                const restingHR = parseInt(await askQuestion(`Nouvelle FC Repos (${profile.resting_heart_rate || ''}) : `)) || profile.resting_heart_rate;
                const age = parseInt(await askQuestion(`Nouvel âge (${profile.age || ''}) : `)) || profile.age;
                
                const newProfile = { name, vma, vdot, weight, max_heart_rate: maxHR, resting_heart_rate: restingHR, age };
                
                // Mettre à jour main.db et le userDb correspondant
                execSync(
                    `node -e "const db = require('./src/database'); (async () => { await db.initMainDb(); const u = await db.dbGetMain('SELECT id FROM users WHERE email = ?', ['testeur@drawrun.local']); await db.dbRunMain('UPDATE users SET profile_data = ? WHERE id = ?', [JSON.stringify(${JSON.stringify(newProfile)}), u.id]); const uDb = await db.getUserDb(u.id); await db.dbRunUser(uDb, 'INSERT OR REPLACE INTO user_profiles (user_id, vma, vdot, weight, resting_hr, max_hr, age) VALUES (?, ?, ?, ?, ?, ?, ?)', [u.id, ${vma}, ${vdot}, ${weight}, ${restingHR}, ${maxHR}, ${age}]); console.log('OK'); process.exit(0); })()"`,
                    { cwd: backendDir }
                );
                
                console.log(`\n✅ ${colors.fgGreen}Profil mis à jour avec succès !${colors.reset}`);
            } catch(e) {
                console.log('❌ Erreur lors de la mise à jour :', e.message);
            }
            await askQuestion('\nEntrée pour continuer...');
        }
        
        else if (choice === '2') {
            printBanner();
            console.log(`${colors.bright}🏃 AJOUT D'UNE ACTIVITÉ MANUELLE${colors.reset}\n`);
            
            try {
                const sport = await askQuestion('Type de sport (Run / Ride / TrailRun) [Run] : ') || 'Run';
                const name = await askQuestion('Nom de l\'activité [Footing matinal] : ') || 'Footing matinal';
                const distance = parseFloat(await askQuestion('Distance en km : ')) || 5;
                const timeMin = parseFloat(await askQuestion('Durée en minutes : ')) || 25;
                const hr = parseInt(await askQuestion('FC Moyenne (optionnel) [140] : ')) || 140;
                
                // Calculer automatiquement le TSS d'après les formules existantes
                let tss = 50; 
                if (RunningPerformance && TrainingLoad) {
                    const IF = TrainingLoad.estimateIFFromHR(hr / 188); // FCMax par défaut 188
                    tss = Math.round(TrainingLoad.calculateSportTSS(timeMin * 60, IF, sport));
                }
                
                const timeSec = timeMin * 60;
                const dateStr = new Date().toISOString();
                
                execSync(
                    `node -e "const db = require('./src/database'); (async () => { await db.initMainDb(); const u = await db.dbGetMain('SELECT id FROM users WHERE email = ?', ['testeur@drawrun.local']); const uDb = await db.getUserDb(u.id); await db.dbRunUser(uDb, 'INSERT INTO activities (source, source_id, name, type, start_date, distance, moving_time, elapsed_time, average_speed, average_heartrate, tss, is_manual) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)', ['manual', 'man_' + Date.now(), '${name}', '${sport}', '${dateStr}', ${distance}, ${timeSec}, ${timeSec}, ${distance*1000/timeSec}, ${hr}, ${tss}]); process.exit(0); })()"`,
                    { cwd: backendDir }
                );
                
                console.log(`\n✅ ${colors.fgGreen}Activité ajoutée avec succès ! (TSS estimé : ${tss})${colors.reset}`);
            } catch(e) {
                console.log('❌ Erreur de création :', e.message);
            }
            await askQuestion('\nEntrée pour continuer...');
        }
        
        else if (choice === '3') {
            printBanner();
            console.log(`${colors.bright}📊 LISTE DES 10 DERNIÈRES ACTIVITÉS${colors.reset}\n`);
            try {
                const actsRaw = execSync(
                    `node -e "const db = require('./src/database'); (async () => { await db.initMainDb(); const u = await db.dbGetMain('SELECT id FROM users WHERE email = ?', ['testeur@drawrun.local']); const uDb = await db.getUserDb(u.id); const acts = await db.dbAllUser(uDb, 'SELECT id, name, type, distance, moving_time, tss, start_date FROM activities ORDER BY start_date DESC LIMIT 10'); console.log(JSON.stringify(acts)); process.exit(0); })()"`,
                    { cwd: backendDir }
                ).toString();
                const acts = JSON.parse(actsRaw);
                
                if (acts.length === 0) {
                    console.log('Aucune activité trouvée.');
                } else {
                    acts.forEach(a => {
                        const m = Math.floor(a.moving_time / 60);
                        const s = a.moving_time % 60;
                        console.log(`ID: ${a.id} | [${colors.fgGreen}${a.type}${colors.reset}] ${a.name} | Dist: ${a.distance}km | Temps: ${m}m ${s}s | TSS: ${a.tss} | Date: ${a.start_date.split('T')[0]}`);
                    });
                }
            } catch(e) {
                console.log('❌ Erreur de lecture :', e.message);
            }
            await askQuestion('\nEntrée pour continuer...');
        }
        
        else if (choice === '4') {
            printBanner();
            console.log(`${colors.bright}🗑️ SUPPRESSION D'UNE ACTIVITÉ${colors.reset}\n`);
            const actId = await askQuestion('ID de l\'activité à supprimer : ');
            if (actId) {
                try {
                    execSync(
                        `node -e "const db = require('./src/database'); (async () => { await db.initMainDb(); const u = await db.dbGetMain('SELECT id FROM users WHERE email = ?', ['testeur@drawrun.local']); const uDb = await db.getUserDb(u.id); await db.dbRunUser(uDb, 'DELETE FROM activities WHERE id = ?', [${actId}]); process.exit(0); })()"`,
                        { cwd: backendDir }
                    );
                    console.log(`\n✅ ${colors.fgGreen}Activité supprimée avec succès (si elle existait).${colors.reset}`);
                } catch(e) {
                    console.log('❌ Erreur de suppression :', e.message);
                }
            }
            await askQuestion('\nEntrée pour continuer...');
        }
    }
}

// Option 5 : Bac à Sable Scientifique
async function scientificSandboxMenu() {
    while (true) {
        printBanner();
        console.log(`${colors.bright}🧪 BAC À SABLE SCIENTIFIQUE (Formules de performance)${colors.reset}\n`);
        console.log('[1] Estimer le VDOT et calculer les allures d\'entraînement');
        console.log('[2] Calculer la charge cardiaque (TSS & TRIMP)');
        console.log('[3] Retour au menu principal');
        
        console.log();
        const choice = await askQuestion('Faites votre choix (1-3) : ');
        
        if (choice === '3') break;
        
        if (choice === '1') {
            printBanner();
            console.log(`${colors.bright}📈 ESTIMATION VDOT & ALLURES (Jack Daniels)${colors.reset}\n`);
            
            if (!RunningPerformance) {
                console.log('❌ Impossible de charger le module scientifique RunningPerformance.');
                console.log('   Veuillez exécuter les diagnostics pour configurer l\'environnement.');
                await askQuestion('\nEntrée pour continuer...');
                continue;
            }
            
            const distance = parseFloat(await askQuestion('Distance parcourue en mètres (ex: 10000) : '));
            const timeStr = await askQuestion('Temps de course (MM:SS ou minutes décimales, ex: 45:00 ou 45) : ');
            
            let timeMinutes = parseFloat(timeStr);
            if (timeStr.includes(':')) {
                const parts = timeStr.split(':');
                timeMinutes = parseInt(parts[0]) + (parseInt(parts[1]) / 60);
            }
            
            if (distance > 0 && timeMinutes > 0) {
                const vdot = RunningPerformance.calculateVDOT(distance, timeMinutes);
                const vma = RunningPerformance.estimateVMA(vdot);
                const paces = RunningPerformance.getTrainingPaces(vdot);
                
                console.log(`\n📊 ${colors.bright}Résultats du calcul VDOT :${colors.reset}`);
                console.log('------------------------------------------------');
                console.log(`• VDOT Estimé : ${colors.fgCyan}${vdot.toFixed(1)}${colors.reset}`);
                console.log(`• VMA Estimée : ${colors.fgCyan}${vma.toFixed(1)} km/h${colors.reset} (VO2max: ${(vma * 3.5 + 2.209).toFixed(1)} ml/kg/min)`);
                console.log(`• Niveau Perf : ${colors.fgMagenta}${RunningPerformance.getPerformanceLevel('VDOT', vdot).level}${colors.reset}`);
                console.log('------------------------------------------------');
                console.log(`${colors.bright}Allures d'Entraînement Recommandées :${colors.reset}`);
                console.log(`- Easy (Endurance)   : ${paces.E.min} - ${paces.E.max} / km`);
                console.log(`- Marathon (Allure M) : ${paces.M.pace} / km`);
                console.log(`- Threshold (Seuil)  : ${paces.T.pace} / km`);
                console.log(`- Interval (VMA 100%): ${paces.I.pace} / km`);
                console.log(`- Repetition (Sprint): ${paces.R.pace} / km`);
                console.log('------------------------------------------------');
            } else {
                console.log('Valeurs incorrectes.');
            }
            await askQuestion('\nEntrée pour continuer...');
        }
        
        else if (choice === '2') {
            printBanner();
            console.log(`${colors.bright}💓 CALCUL DE LA CHARGE CARDIAQUE (TSS & TRIMP)${colors.reset}\n`);
            
            if (!TrainingLoad) {
                console.log('❌ Impossible de charger le module de Charge Cardiaque.');
                await askQuestion('\nEntrée pour continuer...');
                continue;
            }
            
            const minutes = parseInt(await askQuestion('Durée en minutes (ex: 50) : ')) || 50;
            const avgHR = parseInt(await askQuestion('FC Moyenne du footing (ex: 145) : ')) || 145;
            const maxHR = parseInt(await askQuestion('Votre FC Max (ex: 188) : ')) || 188;
            const restingHR = parseInt(await askQuestion('Votre FC de Repos (ex: 54) : ')) || 54;
            const sex = await askQuestion('Sexe (M / F) [M] : ') || 'M';
            
            const trimp = TrainingLoad.calculateTRIMPBanister(minutes, avgHR, maxHR, restingHR, sex);
            const IF = TrainingLoad.estimateIFFromHR(avgHR / maxHR);
            const tss = TrainingLoad.calculateSportTSS(minutes * 60, IF, 'Run');
            
            console.log(`\n📊 ${colors.bright}Résultats du calcul de charge :${colors.reset}`);
            console.log('------------------------------------------------');
            console.log(`• TRIMP (Modèle Banister) : ${colors.fgCyan}${Math.round(trimp)}${colors.reset} points`);
            console.log(`• Facteur d'Intensité (IF) : ${colors.fgCyan}${IF.toFixed(2)}${colors.reset}`);
            console.log(`• TSS Coggan (Running)     : ${colors.fgCyan}${Math.round(tss)}${colors.reset} points`);
            console.log('------------------------------------------------');
            console.log('Note : Un TSS < 50 est une charge légère, de 50 à 150 modérée, > 150 élevée.');
            await askQuestion('\nEntrée pour continuer...');
        }
    }
}

// Option 6 : Lecteur de Logs
async function logViewerMenu() {
    const logsDir = path.join(backendDir, 'logs');
    
    while (true) {
        printBanner();
        console.log(`${colors.bright}📝 LECTEUR DE LOGS DU SERVEUR (WINSTON)${colors.reset}\n`);
        console.log('[1] Voir le log combiné complet (combined.log)');
        console.log('[2] Voir uniquement les erreurs (error.log)');
        console.log('[3] Voir les alertes de sécurité (security.log)');
        console.log('[4] Retour au menu principal');
        
        console.log();
        const choice = await askQuestion('Faites votre choix (1-4) : ');
        
        if (choice === '4') break;
        
        let filename = 'combined.log';
        if (choice === '2') filename = 'error.log';
        else if (choice === '3') filename = 'security.log';
        
        const logFilePath = path.join(logsDir, filename);
        
        printBanner();
        console.log(`${colors.bright}Lecteur de Logs : ${filename}${colors.reset}\n`);
        
        if (!fs.existsSync(logFilePath)) {
            console.log('⚠️ Aucun fichier de log trouvé pour le moment.');
            console.log('Note : Le serveur backend doit avoir démarré au moins une fois en mode dev pour générer des logs.');
            await askQuestion('\nEntrée pour continuer...');
            continue;
        }
        
        try {
            const logsContent = fs.readFileSync(logFilePath, 'utf8');
            const lines = logsContent.trim().split('\n').slice(-30); // Lire les 30 dernières lignes
            
            console.log('------------------------------------------------');
            lines.forEach(line => {
                // Colorer les lignes selon le niveau
                if (line.toLowerCase().includes('error')) {
                    console.log(`${colors.fgRed}${line}${colors.reset}`);
                } else if (line.toLowerCase().includes('warn')) {
                    console.log(`${colors.fgYellow}${line}${colors.reset}`);
                } else if (line.toLowerCase().includes('info')) {
                    console.log(`${colors.fgCyan}${line}${colors.reset}`);
                } else {
                    console.log(line);
                }
            });
            console.log('------------------------------------------------');
            console.log(`${colors.dim}Affichage des 30 dernières lignes.${colors.reset}`);
        } catch(e) {
            console.log('❌ Impossible de lire les logs :', e.message);
        }
        await askQuestion('\nEntrée pour continuer...');
    }
}

// Option 7 : Exécuter des tests
async function runTestsMenu() {
    while (true) {
        printBanner();
        console.log(`${colors.bright}🧪 LANCEUR DE TESTS UNITAIRES ET DE QUALITÉ${colors.reset}\n`);
        console.log('[1] Lancer les tests Backend (Jest)');
        console.log('[2] Lancer une suite backend spécifique (ex: auth, database...)');
        console.log('[3] Lancer les tests Frontend (Vitest)');
        console.log('[4] Exécuter le Linter & Formatter (Qualité de code)');
        console.log('[5] Retour au menu principal');
        
        console.log();
        const choice = await askQuestion('Faites votre choix (1-5) : ');
        
        if (choice === '5') break;
        
        try {
            if (choice === '1') {
                console.log('\n⏳ Lancement de Jest...');
                execSync('npm test', { cwd: backendDir, stdio: 'inherit' });
            } 
            else if (choice === '2') {
                const pattern = await askQuestion('Nom de la suite (ex: auth, crypto, database, algorithms) : ');
                if (pattern) {
                    console.log(`\n⏳ Lancement des tests pour: ${pattern}...`);
                    execSync(`npm test -- --testPathPattern=${pattern}`, { cwd: backendDir, stdio: 'inherit' });
                }
            } 
            else if (choice === '3') {
                console.log('\n⏳ Lancement de Vitest...');
                execSync('npm run test', { cwd: path.join(__dirname, '../frontend'), stdio: 'inherit' });
            } 
            else if (choice === '4') {
                console.log('\n⏳ Analyse ESLint + Formatage Prettier...');
                execSync('npm run lint && npm run format', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
                console.log(`\n✅ ${colors.fgGreen}Code analysé et formaté !${colors.reset}`);
            }
        } catch (e) {
            console.log('\n❌ Échec de l\'exécution.');
        }
        await askQuestion('\nEntrée pour continuer...');
    }
}

// Option 8 : Git Commit Helper
async function gitCommitHelper() {
    printBanner();
    console.log(`${colors.bright}🐙 ASSISTANT DE COMMIT GIT INTERACTIF${colors.reset}\n`);
    
    // Vérifier si c'est un repo Git
    try {
        execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
    } catch(e) {
        console.log('❌ Vous n\'êtes pas dans un dépôt Git valide.');
        await askQuestion('\nEntrée pour continuer...');
        return;
    }
    
    console.log('Sélectionnez le type de modification :');
    console.log('1. feat     : Nouvelle fonctionnalité');
    console.log('2. fix      : Correction de bug');
    console.log('3. chore    : Maintenance, outils ou dépendances');
    console.log('4. refactor : Restructuration de code sans modification fonctionnelle');
    console.log('5. test     : Ajout ou correction de tests unitaires');
    console.log('6. docs     : Documentation uniquement');
    
    const typeChoice = await askQuestion('\nVotre choix (1-6) : ');
    let type = 'feat';
    if (typeChoice === '2') type = 'fix';
    else if (typeChoice === '3') type = 'chore';
    else if (typeChoice === '4') type = 'refactor';
    else if (typeChoice === '5') type = 'test';
    else if (typeChoice === '6') type = 'docs';
    
    console.log('\nSélectionnez le module concerné (Scope) :');
    console.log('1. backend  : Modifications côté API');
    console.log('2. frontend : Modifications côté interface');
    console.log('3. db       : Changements dans les modèles ou bases SQLite');
    console.log('4. auth     : Sécurité, Login, JWT');
    console.log('5. algo     : Calculs scientifiques sportifs');
    console.log('6. global   : Tout le projet');
    
    const scopeChoice = await askQuestion('\nVotre choix (1-6) : ');
    let scope = 'global';
    if (scopeChoice === '1') scope = 'backend';
    else if (scopeChoice === '2') scope = 'frontend';
    else if (scopeChoice === '3') scope = 'db';
    else if (scopeChoice === '4') scope = 'auth';
    else if (scopeChoice === '5') scope = 'algo';
    
    const desc = await askQuestion('\nDescription courte en anglais/français (ex: add nickname field) : ');
    
    if (!desc) {
        console.log('❌ Description manquante. Commit annulé.');
        await askQuestion('\nEntrée pour continuer...');
        return;
    }
    
    const commitMsg = `${type}(${scope}): ${desc.toLowerCase().trim()}`;
    
    console.log(`\nCommit message généré : \x1b[36m${commitMsg}\x1b[0m\n`);
    console.log('[1] Ajouter tous les fichiers modifiés et faire le commit (git commit -a -m)');
    console.log('[2] Faire le commit uniquement (pour les fichiers déjà indexés dans git add)');
    console.log('[3] Annuler');
    
    const execChoice = await askQuestion('\nVotre choix (1-3) : ');
    
    if (execChoice === '1') {
        try {
            console.log('\n⏳ Indexation et commit...');
            execSync(`git add . && git commit -m "${commitMsg}"`, { stdio: 'inherit' });
            console.log(`\n✅ ${colors.fgGreen}Fichiers indexés et commit enregistré !${colors.reset}`);
        } catch (e) {
            console.log('\n❌ Une erreur est survenue lors du commit.');
        }
    } 
    else if (execChoice === '2') {
        try {
            console.log('\n⏳ Enregistrement du commit...');
            execSync(`git commit -m "${commitMsg}"`, { stdio: 'inherit' });
            console.log(`\n✅ ${colors.fgGreen}Commit enregistré !${colors.reset}`);
        } catch (e) {
            console.log('\n❌ Une erreur est survenue lors du commit. Assurez-vous d\'avoir fait "git add".');
        }
    } else {
        console.log('\nCommit annulé.');
    }
    await askQuestion('\nEntrée pour continuer...');
}

// Menu principal de l'application
async function mainLoop() {
    while (true) {
        printBanner();
        console.log(`${colors.bright}MENU PRINCIPAL :${colors.reset}`);
        console.log(`[1] Diagnostic & Configuration automatique (.env)`);
        console.log(`[2] Générer le compte de test complet (activités, PMC...)`);
        console.log(`[3] ${colors.fgGreen}${colors.bright}Démarrer l'application DrawRun (Backend + Frontend)${colors.reset}`);
        console.log('------------------------------------------------');
        console.log(`[4] ${colors.fgBlue}${colors.bright}Éditeur de Base de Données interactif${colors.reset} (Profil, activités...)`);
        console.log(`[5] ${colors.fgBlue}${colors.bright}Bac à sable scientifique${colors.reset} (Simuler VDOT, Paces, TSS)`);
        console.log(`[6] ${colors.bright}Visualiseur de Logs du serveur${colors.reset}`);
        console.log(`[7] Lanceur de Tests & Qualité de code`);
        console.log(`[8] Assistant de Commit Git standardisé`);
        console.log('------------------------------------------------');
        console.log(`[9] Quitter l'assistant`);
        
        console.log();
        const choice = await askQuestion('Faites votre choix (1-9) : ');
        
        if (choice === '1') {
            await runDiagnostic();
        } else if (choice === '2') {
            await generateMockData();
        } else if (choice === '3') {
            await startApplication();
            break; 
        } else if (choice === '4') {
            await databaseEditorMenu();
        } else if (choice === '5') {
            await scientificSandboxMenu();
        } else if (choice === '6') {
            await logViewerMenu();
        } else if (choice === '7') {
            await runTestsMenu();
        } else if (choice === '8') {
            await gitCommitHelper();
        } else if (choice === '9') {
            console.log('\nBon code ! 👋');
            rl.close();
            break;
        }
    }
}

// Démarrer l'assistant
mainLoop();
