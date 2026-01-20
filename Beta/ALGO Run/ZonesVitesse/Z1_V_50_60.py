import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from VMA.Formule_de_Leger_et_Mercier.Formule_de_Leger_et_Mercier import calculer_formule_de_Leger_Mercier
from ZonesFC.Methode_de_Karvonen.Z1_FC_50_60 import calculer_zone1_karvonen
from FCM.FCM import calculer_fcm

def calculer_zone1_vitesse(VMA, FCM, FCRepos):
    FC50, FC60 = calculer_zone1_karvonen(FCM, FCRepos)
    V50 = VMA * ((FC50 - FCRepos) / (FCM - FCRepos))
    V60 = VMA * ((FC60 - FCRepos) / (FCM - FCRepos))
    return (V50, V60)


if __name__ == '__main__':
    age = int(input('votre age :'))
    sexe = input('entrez H si vous etes un homme et F si vous etes une femme :')
    poids = int(input('votre poids :'))
    FCRepos = int(input('votre FC au repos :'))
    
    FCM = calculer_fcm(age, sexe, poids)
    if FCM is None:
        print('entrez soit H soit F :')
    else:
        VMA = calculer_formule_de_Leger_Mercier(age, sexe, poids, FCRepos)
        zone1 = calculer_zone1_vitesse(VMA, FCM, FCRepos)
        print(f'Zone 1 (50-60%) : {zone1[0]:.2f} - {zone1[1]:.2f} km/h')
