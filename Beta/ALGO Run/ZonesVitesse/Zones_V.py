import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from FCM.FCM import calculer_fcm
from VMA.Formule_de_Leger_et_Mercier.Formule_de_Leger_et_Mercier import calculer_formule_de_Leger_Mercier
from ZonesVitesse.Z1_V_50_60 import calculer_zone1_vitesse
from ZonesVitesse.Z2_V_60_70 import calculer_zone2_vitesse
from ZonesVitesse.Z3_V_70_80 import calculer_zone3_vitesse
from ZonesVitesse.Z4_V_80_90 import calculer_zone4_vitesse
from ZonesVitesse.Z5_V_90_100 import calculer_zone5_vitesse

def calculer_zones_vitesse(age, sexe, poids, FCRepos):
    FCM = calculer_fcm(age, sexe, poids)
    if FCM is None:
        print('entrez soit H soit F :')
    else:
        VMA = calculer_formule_de_Leger_Mercier(age, sexe, poids, FCRepos)
        Z1 = calculer_zone1_vitesse(VMA, FCM, FCRepos)
        Z2 = calculer_zone2_vitesse(VMA, FCM, FCRepos)
        Z3 = calculer_zone3_vitesse(VMA, FCM, FCRepos)
        Z4 = calculer_zone4_vitesse(VMA, FCM, FCRepos)
        Z5 = calculer_zone5_vitesse(VMA, FCM, FCRepos)
        return(Z1, Z2, Z3, Z4, Z5)

if __name__ == '__main__':
    age = int(input('votre age :'))
    sexe = input('entrez H si vous etes un homme et F si vous etes une femme :')
    poids = int(input('votre poids :'))
    FCRepos = int(input('votre FC au repos :'))    
    zones = calculer_zones_vitesse(age, sexe, poids, FCRepos)
    print(f"\nZones de vitesse :")
    print(f"Zone 1 (50-60%)  : {zones[0][0]:.2f} - {zones[0][1]:.2f} km/h")
    print(f"Zone 2 (60-70%)  : {zones[1][0]:.2f} - {zones[1][1]:.2f} km/h")
    print(f"Zone 3 (70-80%)  : {zones[2][0]:.2f} - {zones[2][1]:.2f} km/h")
    print(f"Zone 4 (80-90%)  : {zones[3][0]:.2f} - {zones[3][1]:.2f} km/h")
    print(f"Zone 5 (90-100%) : {zones[4][0]:.2f} - {zones[4][1]:.2f} km/h")