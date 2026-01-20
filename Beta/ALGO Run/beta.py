# Fichier programme principal consolidé pour ALGO Run
# Génère un plan d'entraînement hebdomadaire détaillé.

# --- Manipulation du Path Système ---
import sys
from pathlib import Path
project_root = Path(__file__).resolve().parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

# --- Imports de tous les modules du projet ---
from DureePhases.DureePhases import calculer_Duree_Phases
from FCM.FCM import calculer_fcm
from VMA.Formule_de_Leger_et_Mercier.Formule_de_Leger_et_Mercier import calculer_formule_de_Leger_Mercier
from VO2max.Formule_Niels_Uth.Formule_Niels_Uth import calculer_VO2max_formule_Niels_Uth
from VO2max.Formule_Niels_Uth.K_dynamique_équation_de_régression_de_Ari_Voutilainen.K_dynamique import calculer_K_dynamique
from VolumePIC.VolumePIC import calculer_volume_pic
from PlanSemaine.NBSeance import calculer_NB_Seance
from PlanSemaine.SeanceEF import generer_Seance_EF
from PlanSemaine.VolumeDistance import calculer_Volume_Distance_Type
from ZonesAllure.Zones_A import calculer_zones_allure
from ZonesFC.Methode_de_Karvonen.Zones_FC import calculer_zones_karvonen
from ZonesTPS.Zones_TPS import calculer_Zones_TPS
from ZonesVitesse.Zones_V import calculer_zones_vitesse

# --- Fonctions de Génération du Plan Détaillé ---

def get_allure_string(allure_minutes):
    """Convertit une allure décimale en chaîne min:sec."""
    minutes = int(allure_minutes)
    secondes = int((allure_minutes - minutes) * 60)
    return f"{minutes}:{secondes:02d}"

def generer_plan_entrainement_complet(profil):
    """
    Génère le plan d'entraînement détaillé semaine par semaine avec une progression cyclique.
    """
    duree_totale = int(profil['DureeProgramme'])
    volume_initial = profil['VolumeHebdoMoyenDistance']

    plan_complet_str = ""
    volume_semaine_precedente = volume_initial
    volume_pic_cycle_precedent = volume_initial

    # Logique de progression par cycles de 4 semaines (3 d'augmentation, 1 de récupération)
    for semaine in range(1, duree_totale + 1):
        plan_complet_str += f"\n--- SEMAINE {semaine}/{duree_totale} ---\n"

        semaine_dans_cycle = (semaine - 1) % 4

        if semaine_dans_cycle == 0:  # Semaine 1 du cycle
            if semaine == 1:
                volume_semaine = volume_initial
            else:
                # Le nouveau cycle commence au pic du cycle précédent pour une surcharge progressive
                volume_semaine = volume_pic_cycle_precedent
        elif semaine_dans_cycle < 3:  # Semaines 2 et 3: augmentation
            volume_semaine = volume_semaine_precedente * 1.10
        else:  # Semaine 4: récupération
            volume_semaine = volume_semaine_precedente * 0.60  # Réduction de 40%

        # Mettre à jour le pic si nécessaire (fin de la 3ème semaine)
        if semaine_dans_cycle == 2:
            volume_pic_cycle_precedent = volume_semaine
        
        volume_semaine_precedente = volume_semaine
        volume_semaine = max(0, volume_semaine)
        
        nb_seances = calculer_NB_Seance(volume_semaine)
        volume_ef, volume_q = calculer_Volume_Distance_Type(volume_semaine)
        _, vol_ef_longue, vol_ef_courte, nb_ef_courtes = generer_Seance_EF(volume_semaine)
        nb_seances_qualite = nb_seances - (1 + nb_ef_courtes)
        if nb_seances_qualite < 0: nb_seances_qualite = 0
        
        plan_complet_str += f"Volume total cible : {volume_semaine:.1f} km en {nb_seances} séances.\n"
        
        # Détail des séances
        allure_z2_min, allure_z2_max = profil['zonesAllure'][1]
        allure_z2_moyenne = (allure_z2_min + allure_z2_max) / 2
        
        # Séance 1: EF Longue
        temps_estime_efl = vol_ef_longue * allure_z2_moyenne
        plan_complet_str += (
            f"  1. Endurance Fondamentale (Longue) :\n"
            f"     - Distance : {vol_ef_longue:.1f} km\n"
            f"     - Zone de travail : Zone 2 (Endurance)\n"
            f"     - Allure cible : {get_allure_string(allure_z2_max)}-{get_allure_string(allure_z2_min)} min/km\n"
            f"     - FC cible : {profil['zonesFC'][1][0]:.0f}-{profil['zonesFC'][1][1]:.0f} bpm\n"
            f"     - Temps estimé : ~{int(temps_estime_efl)} minutes\n"
        )

        # Séances EF Courtes
        for i in range(nb_ef_courtes):
             temps_estime_efc = vol_ef_courte * allure_z2_moyenne
             plan_complet_str += (
                f"  {2+i}. Endurance Fondamentale (Courte) :\n"
                f"     - Distance : {vol_ef_courte:.1f} km\n"
                f"     - Zone de travail : Zone 2 (Endurance)\n"
                f"     - Allure / FC : Mêmes que la sortie longue\n"
                f"     - Temps estimé : ~{int(temps_estime_efc)} minutes\n"
            )

        # Séances de Qualité
        if nb_seances_qualite > 0:
            volume_par_seance_q = volume_q / nb_seances_qualite
            allure_z4_min, allure_z4_max = profil['zonesAllure'][3]
            allure_z4_moyenne = (allure_z4_min + allure_z4_max) / 2

            # Estimation du temps pour une séance de qualité type
            # (Ex: 2km échauffement/calme en Z2 + reste du volume en Z4)
            vol_travail_z4 = max(0, volume_par_seance_q - 2)
            temps_estime_q = (2 * allure_z2_moyenne) + (vol_travail_z4 * allure_z4_moyenne)

            plan_complet_str += (
                f"  - {nb_seances_qualite} séance(s) de Qualité (Total: {volume_q:.1f} km) :\n"
                f"     - NOTE : La logique pour le contenu (ex: 6x400m) n'est pas définie. Ceci est une suggestion.\n"
                f"     - Suggestion : Alterner des séances de VMA (Zone 5) et de Seuil (Zone 4).\n"
                f"     - Ex. pour une séance au seuil de {volume_par_seance_q:.1f}km :\n"
                f"       - Allure travail : {get_allure_string(allure_z4_max)}-{get_allure_string(allure_z4_min)} min/km (Zone 4).\n"
                f"       - Temps estimé total (avec échauffement/calme) : ~{int(temps_estime_q)} minutes.\n"
            )
            
    return plan_complet_str

# --- Bloc d'Exécution Principal ---
if __name__ == '__main__':
    try:
        print("--- Générateur de Plan d'Entraînement ALGO Run ---")
        # Collecte des données utilisateur
        age = int(input('Votre age : '))
        sexe = input('Entrez H (Homme) ou F (Femme) : ').upper()
        poids = int(input('Votre poids (en kg) : '))
        FCRepos = int(input('Votre FC au repos (bpm) : '))
        VolumeHebdoMoyenDistance = float(input('Votre volume hebdomadaire moyen de course (en km) : '))
        print("\n--- Objectifs de votre Plan ---")
        ObjectifDistance = float(input('Votre objectif de distance de course (en km) : '))
        ObjectifTPS = float(input('Votre objectif de temps pour cette distance (en minutes) : '))
        DureeProgramme = float(input('Durée totale de votre programme (en semaines) : '))
        
        # --- Calcul du Profil Complet ---
        profil = {}
        profil['zonesAllure'] = calculer_zones_allure(age, sexe, poids, FCRepos)
        profil['zonesVitesse'] = calculer_zones_vitesse(age, sexe, poids, FCRepos)
        profil['zonesFC'] = calculer_zones_karvonen(age, sexe, poids, FCRepos)
        profil['VolumePIC'] = calculer_volume_pic(age, sexe, poids, FCRepos, VolumeHebdoMoyenDistance, DureeProgramme, ObjectifDistance, ObjectifTPS)
        profil['DureePhases'] = calculer_Duree_Phases(ObjectifDistance, DureeProgramme)
        profil['DureeProgramme'] = DureeProgramme
        profil['VolumeHebdoMoyenDistance'] = VolumeHebdoMoyenDistance

        # --- Génération et Affichage du Plan ---
        print('\n\n--- VOTRE PLAN D\'ENTRAÎNEMENT DÉTAILLÉ ---')
        plan_detaille = generer_plan_entrainement_complet(profil)
        print(plan_detaille)
        
        print("\nNOTE: Ce plan est une proposition générée automatiquement.")
        print("Les séances de 'Qualité' sont à structurer (ex: intervalles, fartlek, seuil).")

    except (ValueError, TypeError):
        print("\nErreur : Donnée invalide. Veuillez vérifier que toutes les valeurs numériques sont correctes.")
    except Exception as e:
        print(f"\nUne erreur inattendue est survenue : {e}")
    finally:
        input("\nAppuyez sur Entrée pour fermer...")