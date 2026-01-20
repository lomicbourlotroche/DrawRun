import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent))

from FCM.FCM import calculer_fcm
from ZonesFC.Methode_de_Karvonen.Z1_FC_50_60 import calculer_zone1_karvonen
from ZonesFC.Methode_de_Karvonen.Z2_FC_60_70 import calculer_zone2_karvonen
from ZonesFC.Methode_de_Karvonen.Z3_FC_70_80 import calculer_zone3_karvonen
from ZonesFC.Methode_de_Karvonen.Z4_FC_80_90 import calculer_zone4_karvonen
from ZonesFC.Methode_de_Karvonen.Z5_FC_90_100 import calculer_zone5_karvonen

def calculer_zones_karvonen(age, sexe, poids, FCRepos):
    FCM = calculer_fcm(age, sexe, poids)
    if FCM is None:
        print('entrez soit H soit F :')
    else:
        Z1 = calculer_zone1_karvonen(FCM, FCRepos)
        Z2 = calculer_zone2_karvonen(FCM, FCRepos)
        Z3 = calculer_zone3_karvonen(FCM, FCRepos)
        Z4 = calculer_zone4_karvonen(FCM, FCRepos)
        Z5 = calculer_zone5_karvonen(FCM, FCRepos)
        return(Z1, Z2, Z3, Z4, Z5)

if __name__ == '__main__':
    age = int(input('votre age :'))
    sexe = input('entrez H si vous etes un homme et F si vous etes une femme :')
    poids = int(input('votre poids :'))
    FCRepos = int(input('votre FC au repos :'))
    zones = calculer_zones_karvonen(age, sexe, poids, FCRepos)
    print(f"\nZones d'entraînement (méthode de Karvonen) :")
    print(f"Zone 1 (50-60%)  : {zones[0][0]:.0f} - {zones[0][1]:.0f} bpm")
    print(f"Zone 2 (60-70%)  : {zones[1][0]:.0f} - {zones[1][1]:.0f} bpm")
    print(f"Zone 3 (70-80%)  : {zones[2][0]:.0f} - {zones[2][1]:.0f} bpm")
    print(f"Zone 4 (80-90%)  : {zones[3][0]:.0f} - {zones[3][1]:.0f} bpm")
    print(f"Zone 5 (90-100%) : {zones[4][0]:.0f} - {zones[4][1]:.0f} bpm")