import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from ZonesAllure.Zones_A import calculer_zones_allure

def calculer_Zones_TPS_Z4(age, sexe, poids, FCRepos, Distance):
    zonesAllure = calculer_zones_allure(age, sexe, poids, FCRepos)
    zonesTPSZ4Bas = zonesAllure[3][0]*Distance
    zonesTPSZ4Haut = zonesAllure[3][1]*Distance
    return(zonesTPSZ4Bas, zonesTPSZ4Haut)

if __name__ == '__main__':
    age = int(input('votre age :'))
    sexe = input('entrez H si vous etes un homme et F si vous etes une femme :')
    poids = int(input('votre poids :'))
    FCRepos = int(input('votre FC au repos :')) 
    Distance = int(input('la distance :'))   
    zonesTPSZ4 = calculer_Zones_TPS_Z4(age, sexe, poids, FCRepos, Distance)
    print(f"\nZones de TPS :")
    print(f"Zone 4 (80-90%)  : {zonesTPSZ4[0]:.2f} - {zonesTPSZ4[1]:.2f} minutes")