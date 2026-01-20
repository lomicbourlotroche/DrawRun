import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from FCM.FCM import calculer_fcm
from VMA.Formule_de_Leger_et_Mercier.Formule_de_Leger_et_Mercier import calculer_formule_de_Leger_Mercier
from ZonesAllure.Z1_A_50_60 import calculer_zone1_allure
from ZonesAllure.Z2_A_60_70 import calculer_zone2_allure
from ZonesAllure.Z3_A_70_80 import calculer_zone3_allure
from ZonesAllure.Z4_A_80_90 import calculer_zone4_allure
from ZonesAllure.Z5_A_90_100 import calculer_zone5_allure
from ZonesVitesse.Z1_V_50_60 import calculer_zone1_vitesse
from ZonesVitesse.Z2_V_60_70 import calculer_zone2_vitesse
from ZonesVitesse.Z3_V_70_80 import calculer_zone3_vitesse
from ZonesVitesse.Z4_V_80_90 import calculer_zone4_vitesse
from ZonesVitesse.Z5_V_90_100 import calculer_zone5_vitesse

def calculer_zones_allure(age, sexe, poids, FCRepos):
    FCM = calculer_fcm(age, sexe, poids)
    if FCM is None:
        print('entrez soit H soit F :')
        return None, None, None, None, None

    VMA = calculer_formule_de_Leger_Mercier(age, sexe, poids, FCRepos)
    
    if VMA is None or VMA <= 0:
        print("Avertissement : La VMA n'a pas pu être calculée ou est nulle. Impossible de déterminer les zones d'allure.")
        return ((0, 0), (0, 0), (0, 0), (0, 0), (0, 0))
        
    V50, V60 = calculer_zone1_vitesse(VMA, FCM, FCRepos)
    V70 = calculer_zone2_vitesse(VMA, FCM, FCRepos)[1]
    V80 = calculer_zone3_vitesse(VMA, FCM, FCRepos)[1]
    V90 = calculer_zone4_vitesse(VMA, FCM, FCRepos)[1]
    V100 = calculer_zone5_vitesse(VMA, FCM, FCRepos)[1]
    
    Z1 = calculer_zone1_allure(V50, V60)
    Z2 = calculer_zone2_allure(V60, V70)
    Z3 = calculer_zone3_allure(V70, V80)
    Z4 = calculer_zone4_allure(V80, V90)
    Z5 = calculer_zone5_allure(V90, V100)
    return Z1, Z2, Z3, Z4, Z5

if __name__ == '__main__':
    age = int(input('votre age :'))
    sexe = input('entrez H si vous etes un homme et F si vous etes une femme :')
    poids = int(input('votre poids :'))
    FCRepos = int(input('votre FC au repos :'))
    zones = calculer_zones_allure(age, sexe, poids, FCRepos) 
    print(f"\nZones d'allure :")
    for i, zone in enumerate(zones, 1):
        minutes_lent = int(zone[1])
        secondes_lent = int((zone[1] - minutes_lent) * 60)
        minutes_rapide = int(zone[0])
        secondes_rapide = int((zone[0] - minutes_rapide) * 60)
        print(f"Zone {i} : {minutes_lent}:{secondes_lent:02d} - {minutes_rapide}:{secondes_rapide:02d} min/km")
