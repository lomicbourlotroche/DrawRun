import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from ZonesAllure.Zones_A import calculer_zones_allure

def calculer_Zones_TPS_Z2(age, sexe, poids, FCRepos, Distance):
    zonesAllure = calculer_zones_allure(age, sexe, poids, FCRepos)
    zonesTPSZ2Bas = zonesAllure[1][0]*Distance
    zonesTPSZ2Haut = zonesAllure[1][1]*Distance
    return(zonesTPSZ2Bas, zonesTPSZ2Haut)

if __name__ == '__main__':
    age = int(input('votre age :'))
    sexe = input('entrez H si vous etes un homme et F si vous etes une femme :')
    poids = int(input('votre poids :'))
    FCRepos = int(input('votre FC au repos :')) 
    Distance = int(input('la distance :'))   
    zonesTPSZ2 = calculer_Zones_TPS_Z2(age, sexe, poids, FCRepos, Distance)
    print(f"\nZones de TPS :")
    print(f"Zone 2 (60-70%)  : {zonesTPSZ2[0]:.2f} - {zonesTPSZ2[1]:.2f} minutes")