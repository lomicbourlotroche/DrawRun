from ZonesFC.Methode_de_Karvonen.Zones_FC import calculer_zones_karvonen
from ZonesVitesse.Zones_V import calculer_zones_vitesse
from ZonesAllure.Zones_A import calculer_zones_allure
from ZonesTPS.Zones_TPS import calculer_Zones_TPS
from VolumePIC.VolumePIC import calculer_volume_pic
from DureePhases.DureePhases import calculer_Duree_Phases

def calculer(age, sexe, poids, FCRepos, Distance, VolumeHebdoMoyenDistance, DureeProgramme, ObjectifDistance, ObjectifTPS):
    zonesAllure = calculer_zones_allure(age, sexe, poids, FCRepos)
    zonesVitesse = calculer_zones_vitesse(age, sexe, poids, FCRepos)
    zonesFC = calculer_zones_karvonen(age, sexe, poids, FCRepos)
    zonesTPS = calculer_Zones_TPS(age, sexe, poids, FCRepos, Distance)
    VolumePIC = calculer_volume_pic(age, sexe, poids, FCRepos, VolumeHebdoMoyenDistance, DureeProgramme, ObjectifDistance, ObjectifTPS)
    DureePhases = calculer_Duree_Phases(ObjectifDistance, DureeProgramme)
    return (zonesAllure, zonesFC, zonesVitesse, zonesTPS, VolumePIC, DureePhases)

if __name__ == '__main__':
    age = int(input('votre age :'))
    sexe = input('entrez H si vous etes un homme et F si vous etes une femme :')
    poids = int(input('votre poids :'))
    FCRepos = int(input('votre FC au repos :'))
    Distance = float(input('la distance :'))
    VolumeHebdoMoyenDistance = float(input('votre volume hebdomadaire moyen de distance :'))
    ObjectifDistance = float(input('votre objectif de distance :'))
    ObjectifTPS = float(input('votre objectif de temps :'))
    DureeProgramme = float(input('votre duree de programme :'))

    zonesAllure, zonesFC, zonesVitesse, zonesTPS, VolumePIC, DureePhases = calculer(age, sexe, poids, FCRepos, Distance, VolumeHebdoMoyenDistance, DureeProgramme, ObjectifDistance, ObjectifTPS)
    
    print('\nVos zones de FC :')
    for i in range(5):
        print(f"Zone {i+1} : {zonesFC[i][0]:.0f} - {zonesFC[i][1]:.0f} bpm")
    
    print('\nVos zones de vitesse :')
    for i in range(5):
        print(f"Zone {i+1} : {zonesVitesse[i][0]:.2f} - {zonesVitesse[i][1]:.2f} km/h")
    
    print("\nVos zones d'allure :")
    for i, zone in enumerate(zonesAllure, 1):
        minutes_lent = int(zone[1])
        secondes_lent = int((zone[1] - minutes_lent) * 60)
        minutes_rapide = int(zone[0])
        secondes_rapide = int((zone[0] - minutes_rapide) * 60)
        print(f"Zone {i} : {minutes_lent}:{secondes_lent:02d} - {minutes_rapide}:{secondes_rapide:02d} min/km")
    
    print(f'\nVos zones de TPS pour {Distance}km :')
    for i in range(5):
        print(f"Zone {i+1} : {zonesTPS[i][0]:.2f} - {zonesTPS[i][1]:.2f} minutes")

    print(f'\nLa zone de volume pic :')
    print(f'Le volume pic de securité : {VolumePIC[0]:.2f}')
    print(f'Le volume pic de performance : {VolumePIC[1]:.2f}')

    print(f"\nLa duree des phases d'entrainement :")
    print(f'La duree de la phase generale : {DureePhases[0]:.2f} semaines')
    print(f'La duree de la phase specifique : {DureePhases[1]:.2f} semaines')
    print(f"La duree de la phase d'affutage : {DureePhases[2]:.2f} semaines")

    
    input("\nAppuyez sur Entrée pour fermer...")
