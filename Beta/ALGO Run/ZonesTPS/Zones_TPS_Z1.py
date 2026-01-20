import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from ZonesAllure.Zones_A import calculer_zones_allure

def calculer_Zones_TPS_Z1(age, sexe, poids, FCRepos, Distance):
    zonesAllure = calculer_zones_allure(age, sexe, poids, FCRepos)
    zonesTPSZ1Bas = zonesAllure[0][0]*Distance
    zonesTPSZ1Haut = zonesAllure[0][1]*Distance
    return(zonesTPSZ1Bas, zonesTPSZ1Haut)

if __name__ == '__main__':
    age = int(input('votre age :'))
    sexe = input('entrez H si vous etes un homme et F si vous etes une femme :')
    poids = int(input('votre poids :'))
    FCRepos = int(input('votre FC au repos :')) 
    Distance = int(input('la distance :'))   
    zonesTPSZ1 = calculer_Zones_TPS_Z1(age, sexe, poids, FCRepos, Distance)
    print(f"\nZones de TPS :")
    print(f"Zone 1 (50-60%)  : {zonesTPSZ1[0]:.2f} - {zonesTPSZ1[1]:.2f} minutes")