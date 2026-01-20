import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from ZonesTPS.Zones_TPS_Z1 import calculer_Zones_TPS_Z1
from ZonesTPS.Zones_TPS_Z2 import calculer_Zones_TPS_Z2
from ZonesTPS.Zones_TPS_Z3 import calculer_Zones_TPS_Z3
from ZonesTPS.Zones_TPS_Z4 import calculer_Zones_TPS_Z4
from ZonesTPS.Zones_TPS_Z5 import calculer_Zones_TPS_Z5

def calculer_Zones_TPS(age, sexe, poids, FCRepos, Distance):
    zonesTPSZ1 = calculer_Zones_TPS_Z1(age, sexe, poids, FCRepos, Distance)
    zonesTPSZ2 = calculer_Zones_TPS_Z2(age, sexe, poids, FCRepos, Distance)
    zonesTPSZ3 = calculer_Zones_TPS_Z3(age, sexe, poids, FCRepos, Distance)
    zonesTPSZ4 = calculer_Zones_TPS_Z4(age, sexe, poids, FCRepos, Distance)
    zonesTPSZ5 = calculer_Zones_TPS_Z5(age, sexe, poids, FCRepos, Distance)
    return(zonesTPSZ1, zonesTPSZ2, zonesTPSZ3, zonesTPSZ4, zonesTPSZ5)

if __name__ == '__main__':
    age = int(input('votre age :'))
    sexe = input('entrez H si vous etes un homme et F si vous etes une femme :')
    poids = int(input('votre poids :'))
    FCRepos = int(input('votre FC au repos :')) 
    Distance = float(input('la distance :'))   
    zonesTPS = calculer_Zones_TPS(age, sexe, poids, FCRepos, Distance)
    print(f"\nZones de TPS pour {Distance}km :")
    print(f"Zone 1 (50-60%)  : {zonesTPS[0][0]:.2f} - {zonesTPS[0][1]:.2f} minutes")
    print(f"Zone 2 (60-70%)  : {zonesTPS[1][0]:.2f} - {zonesTPS[1][1]:.2f} minutes")
    print(f"Zone 3 (70-80%)  : {zonesTPS[2][0]:.2f} - {zonesTPS[2][1]:.2f} minutes")
    print(f"Zone 4 (80-90%)  : {zonesTPS[3][0]:.2f} - {zonesTPS[3][1]:.2f} minutes")
    print(f"Zone 5 (90-100%)  : {zonesTPS[4][0]:.2f} - {zonesTPS[4][1]:.2f} minutes")