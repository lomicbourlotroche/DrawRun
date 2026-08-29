/* eslint-disable no-console, security/detect-object-injection, no-process-exit */
/**
 * ============================================================
 * GENERATE MOCK USER - Script de génération de données de test
 * ============================================================
 * Crée un utilisateur de test 'testeur@drawrun.local' (mdp: Password123)
 * avec un historique complet d'activités, de métriques PMC (CTL/ATL/TSB)
 * et un plan d'entraînement actif pour tester l'interface.
 */

'use strict';

const path = require('path');

// Charger les variables d'environnement du backend
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { 
    initMainDb, 
    dbGetMain, 
    dbRunMain, 
    getUserDb, 
    dbRunUser, 
    dbGetUser
} = require('../src/database');

const bcrypt = require('bcryptjs');

// Configuration du compte de test
const TEST_EMAIL = 'testeur@drawrun.local';
const TEST_PASS = 'Password123';
const TEST_NAME = 'Dev Testeur';

async function main() {
    console.log('🔄 Initialisation de la base de données principale...');
    await initMainDb();

    console.log(`🔍 Vérification de l'existence de l'utilisateur ${TEST_EMAIL}...`);
    let user = await dbGetMain('SELECT id FROM users WHERE email = ?', [TEST_EMAIL]);
    let userId;

    const profileData = {
        name: TEST_NAME,
        weight: 72.5,
        height: 180,
        resting_heart_rate: 54,
        max_heart_rate: 188,
        vma: 15.5,
        vdot: 48.2,
        gender: 'M',
        age: 29
    };

    if (user) {
        console.log('👤 L\'utilisateur existe déjà. Mise à jour du profil...');
        userId = user.id;
        await dbRunMain(
            'UPDATE users SET profile_data = ? WHERE id = ?', 
            [JSON.stringify(profileData), userId]
        );
    } else {
        console.log('➕ Création du nouvel utilisateur de test...');
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(TEST_PASS, salt);
        
        const result = await dbRunMain(
            'INSERT INTO users (email, password_hash, profile_data) VALUES (?, ?, ?)',
            [TEST_EMAIL, passwordHash, JSON.stringify(profileData)]
        );
        userId = result.lastID;
        console.log(`✅ Utilisateur créé avec l'ID: ${userId}`);
    }

    console.log('🔄 Connexion à la base de données spécifique de l\'utilisateur...');
    const userDb = await getUserDb(userId);
    console.log('✅ Base de données utilisateur connectée.');

    // Nettoyer les anciennes données pour repartir sur de bonnes bases
    console.log('🧹 Nettoyage des anciennes données utilisateur de test...');
    userDb.run('DELETE FROM activities');
    userDb.run('DELETE FROM daily_health');
    userDb.run('DELETE FROM pmc_history');
    userDb.run('DELETE FROM training_plans');
    userDb.run('DELETE FROM training_sessions');
    userDb.run('DELETE FROM performance_metrics');

    console.log('⚙️ Génération de 30 jours de données d\'entraînement et de santé...');
    
    const now = new Date();
    const mockActivities = [];
    const mockHealth = [];
    const mockPmc = [];

    // Paramètres pour simuler le PMC
    let ctl = 15.0; // Fitness initiale
    let atl = 15.0; // Fatigue initiale

    // On parcourt les 30 derniers jours, du plus ancien au plus récent
    for (let i = 29; i >= 0; i--) {
        const currentDate = new Date(now);
        currentDate.setDate(now.getDate() - i);
        const dateStr = currentDate.toISOString().split('T')[0];

        // 1. Déterminer s'il y a un entraînement aujourd'hui (environ 4 fois par semaine)
        // Jours d'entraînement types : Mardi, Jeudi, Samedi, Dimanche
        const dayOfWeek = currentDate.getDay();
        const hasActivity = [2, 4, 6, 0].includes(dayOfWeek);
        let tss = 0;

        if (hasActivity) {
            let type = 'Run';
            let distance = 8000; // mètres
            let movingTime = 2600; // secondes
            let avgHR = 145;
            let maxHR = 168;
            let name = 'Footing Matinal';
            let elevation = 45;
            tss = 45; // Training Stress Score

            if (dayOfWeek === 0) {
                // Sortie longue le dimanche
                type = 'Run';
                distance = 15000;
                movingTime = 5100;
                avgHR = 140;
                maxHR = 160;
                name = 'Sortie Longue Dominicale';
                elevation = 120;
                tss = 85;
            } else if (dayOfWeek === 4) {
                // Fractionné le jeudi
                type = 'Run';
                distance = 9500;
                movingTime = 2900;
                avgHR = 158;
                maxHR = 182;
                name = 'Séance de VMA (Fractionné)';
                elevation = 20;
                tss = 65;
            } else if (dayOfWeek === 6) {
                // Sortie Vélo de récupération le samedi
                type = 'Ride';
                distance = 32000;
                movingTime = 4200;
                avgHR = 125;
                maxHR = 148;
                name = 'Sortie Vélo Route Récup';
                elevation = 310;
                tss = 50;
            }

            // Fluctuation aléatoire
            const factor = 0.9 + Math.random() * 0.2;
            distance = Math.round(distance * factor);
            movingTime = Math.round(movingTime * factor);
            tss = Math.round(tss * factor);
            avgHR = Math.round(avgHR * factor);

            mockActivities.push({
                source: 'manual',
                source_id: `mock_${dateStr}`,
                name,
                type,
                start_date: `${dateStr}T08:30:00Z`,
                timezone: 'Europe/Paris',
                distance: distance / 1000, // stocké en km
                moving_time: movingTime,
                elapsed_time: movingTime + 120,
                average_speed: distance / movingTime, // m/s
                max_speed: (distance / movingTime) * 1.35,
                average_heartrate: avgHR,
                max_heartrate: maxHR,
                calories: Math.round(distance * 0.065),
                total_elevation_gain: elevation,
                tss,
                trimp: tss * 0.9,
                is_manual: 1,
                description: `Footing simulé pour le développement local. Météo clémente.`
            });
        }

        // 2. Calcul du PMC (Banister Model)
        // CTL_n = CTL_n-1 + (TSS - CTL_n-1) / 42
        // ATL_n = ATL_n-1 + (TSS - ATL_n-1) / 7
        ctl = ctl + (tss - ctl) / 42;
        atl = atl + (tss - atl) / 7;
        const tsb = ctl - atl;
        const acwr = ctl > 0 ? (atl / ctl) : 1.0;

        mockPmc.push({
            date: dateStr,
            ctl: Math.round(ctl * 10) / 10,
            atl: Math.round(atl * 10) / 10,
            tsb: Math.round(tsb * 10) / 10,
            acwr: Math.round(acwr * 100) / 100
        });

        // 3. Données de santé quotidiennes (HRV, sommeil, FC repos)
        // L'HRV baisse si la fatigue (ATL) augmente trop
        const baseHRV = 65;
        const fatigueImpact = (atl > 40) ? -(atl - 40) * 0.4 : 0;
        const randomFluct = (Math.random() - 0.5) * 8;
        const hrv = Math.round(Math.max(35, baseHRV + fatigueImpact + randomFluct));

        const restingHR = Math.round(54 + (atl > 40 ? (atl - 40) * 0.15 : 0) + (Math.random() - 0.5) * 4);
        const sleepDuration = Math.round(450 + (Math.random() - 0.5) * 80); // ~7.5h en moyenne
        const sleepScore = Math.round(Math.max(50, 85 + fatigueImpact * 0.2 + (Math.random() - 0.5) * 15));

        mockHealth.push({
            date: dateStr,
            source: 'garmin',
            hrv_rmssd: hrv,
            resting_hr: restingHR,
            sleep_duration_minutes: sleepDuration,
            sleep_score: sleepScore,
            weight: 72.5 + (Math.random() - 0.5) * 0.8
        });
    }

    // Insérer les activités de test
    console.log(`📥 Insertion de ${mockActivities.length} activités dans la base...`);
    for (const act of mockActivities) {
        await dbRunUser(userDb, `
            INSERT INTO activities (
                source, source_id, name, type, start_date, timezone, distance, 
                moving_time, elapsed_time, average_speed, max_speed, 
                average_heartrate, max_heartrate, calories, total_elevation_gain, 
                tss, trimp, is_manual, description
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            act.source, act.source_id, act.name, act.type, act.start_date, act.timezone, act.distance,
            act.moving_time, act.elapsed_time, act.average_speed, act.max_speed,
            act.average_heartrate, act.max_heartrate, act.calories, act.total_elevation_gain,
            act.tss, act.trimp, act.is_manual, act.description
        ]);
    }

    // Insérer l'historique PMC
    console.log(`📥 Insertion de ${mockPmc.length} jours d'historique PMC...`);
    for (const pmc of mockPmc) {
        await dbRunUser(userDb, `
            INSERT OR REPLACE INTO pmc_history (
                user_id, date, ctl, atl, tsb, sb, acute_load, chronic_load, acwr, weekly_tss
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            userId, pmc.date, pmc.ctl, pmc.atl, pmc.tsb, pmc.tsb, pmc.atl, pmc.ctl, pmc.acwr, pmc.ctl * 7
        ]);
    }

    // Insérer les données de santé
    console.log(`📥 Insertion de ${mockHealth.length} jours de données de santé (HRV, sommeil)...`);
    for (const h of mockHealth) {
        await dbRunUser(userDb, `
            INSERT OR REPLACE INTO daily_health (
                user_id, date, source, hrv_rmssd, resting_hr, sleep_duration_minutes, sleep_score, weight
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            userId, h.date, h.source, h.hrv_rmssd, h.resting_hr, h.sleep_duration_minutes, h.sleep_score, h.weight
        ]);
    }

    // 4. Générer un plan d'entraînement de 4 semaines (actif et en cours)
    console.log('📋 Création d\'un plan d\'entraînement de test...');
    const planStartDate = new Date(now);
    planStartDate.setDate(now.getDate() - 14); // démarré il y a 2 semaines
    const planEndDate = new Date(planStartDate);
    planEndDate.setDate(planStartDate.getDate() + 28); // finit dans 2 semaines

    const planResult = await dbRunUser(userDb, `
        INSERT INTO training_plans (
            user_id, name, description, target_type, target_value, target_unit,
            start_date, end_date, weeks, vdot, is_active, is_completed, plan_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?)
    `, [
        userId, 
        'Préparation Route 10 km', 
        'Plan interactif de test pour développeur humain', 
        'distance', 
        10.0, 
        'km', 
        planStartDate.toISOString().split('T')[0], 
        planEndDate.toISOString().split('T')[0], 
        4, 
        48.2,
        'custom'
    ]);
    const planId = planResult.lastID;

    // Créer des séances de plan (3 par semaine, total 12 séances)
    // Séances des semaines 1 et 2 (passées) : marquées comme terminées
    // Séances des semaines 3 et 4 (futures) : en attente
    console.log('📋 Création des séances du plan...');
    const sessionTypes = [
        { type: 'Run', title: 'Footing Fondamental', desc: 'Courir en endurance fondamentale. Aisance respiratoire.', dist: 8.0, time: 2700, tss: 40 },
        { type: 'Run', title: 'Fractionné Court', desc: 'Échauffement + 8x 30"-30" rapide/lent + Retour au calme.', dist: 6.5, time: 2100, tss: 55 },
        { type: 'Run', title: 'Sortie Longue Active', desc: 'Sortie longue avec 2 blocs de 10 min allure cible 10km.', dist: 12.0, time: 4200, tss: 75 }
    ];

    for (let w = 1; w <= 4; w++) {
        for (let d = 0; d < 3; d++) {
            const sessType = sessionTypes[d];
            const sessionNum = (w - 1) * 3 + d + 1;
            
            // Calculer la date de la séance
            const sessDate = new Date(planStartDate);
            sessDate.setDate(planStartDate.getDate() + (w - 1) * 7 + (d * 2 + 1)); // Mardi, Jeudi, Samedi
            const sessDateStr = sessDate.toISOString().split('T')[0];

            const isPast = sessDate < now;

            await dbRunUser(userDb, `
                INSERT INTO training_sessions (
                    plan_id, user_id, week_number, day_number, session_number,
                    type, title, description, target_distance, target_time, expected_tss,
                    scheduled_date, status, completed, actual_distance, actual_time, actual_rpe, difficulty_rating
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                planId,
                userId,
                w,
                d * 2 + 1, // Jour (Mardi/Jeudi/Samedi)
                sessionNum,
                sessType.type,
                sessType.title,
                sessType.desc,
                sessType.dist,
                sessType.time,
                sessType.tss,
                sessDateStr,
                isPast ? 'completed' : 'scheduled',
                isPast ? 1 : 0,
                isPast ? sessType.dist * (0.95 + Math.random() * 0.1) : null,
                isPast ? Math.round(sessType.time * (0.95 + Math.random() * 0.1)) : null,
                isPast ? Math.round(4 + Math.random() * 3) : null, // RPE (effort ressenti de 1 à 10)
                isPast ? Math.round(2 + Math.random() * 2) : null  // Difficulték (1 à 5)
            ]);
        }
    }

    console.log('\n🌟 ============================================================ 🌟');
    console.log('    DONNÉES DE TEST GÉNÉRÉES AVEC SUCCÈS !');
    console.log('🌟 ============================================================ 🌟');
    console.log(`📧 E-mail de connexion : \x1b[36m${TEST_EMAIL}\x1b[0m`);
    console.log(`🔑 Mot de passe       : \x1b[36m${TEST_PASS}\x1b[0m`);
    console.log(`👤 Nom de l'utilisateur: ${TEST_NAME}`);
    console.log(`📊 Statistiques injectées :`);
    console.log(`   - ${mockActivities.length} Activités (Endurance, Fractionné, Vélo)`);
    console.log(`   - 30 Jours d'historique de charge d'entraînement (Fitness/Fatigue)`);
    console.log(`   - 30 Jours d'historique de santé (HRV, Sommeil, Poids)`);
    console.log(`   - 1 Plan d'entraînement de 4 semaines avec séances passées et futures`);
    console.log('================================================================');
    console.log('Vous pouvez maintenant démarrer l\'application, vous connecter');
    console.log('et explorer toutes les fonctionnalités avec des graphiques complets.');
    console.log('================================================================\n');
}

main().catch(err => {
    console.error('❌ Une erreur est survenue lors de la génération :', err);
    process.exit(1);
});
