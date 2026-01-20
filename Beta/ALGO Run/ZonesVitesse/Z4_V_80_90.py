import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from VMA.Formule_de_Leger_et_Mercier.Formule_de_Leger_et_Mercier import calculer_formule_de_Leger_Mercier
from ZonesFC.Methode_de_Karvonen.Z4_FC_80_90 import calculer_zone4_karvonen
from FCM.FCM import calculer_fcm

def calculer_zone4_vitesse(VMA, FCM, FCRepos):
    FC80, FC90 = calculer_zone4_karvonen(FCM, FCRepos)
    V80 = VMA * ((FC80 - FCRepos) / (FCM - FCRepos))
    V90 = VMA * ((FC90 - FCRepos) / (FCM - FCRepos))
    return (V80, V90)


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
        zone4 = calculer_zone4_vitesse(VMA, FCM, FCRepos)
        print(f'Zone 4 (80-90%) : {zone4[0]:.2f} - {zone4[1]:.2f} km/h')
