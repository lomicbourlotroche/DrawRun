import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from VMA.Formule_de_Leger_et_Mercier.Formule_de_Leger_et_Mercier import calculer_formule_de_Leger_Mercier
from ZonesFC.Methode_de_Karvonen.Z3_FC_70_80 import calculer_zone3_karvonen
from FCM.FCM import calculer_fcm

def calculer_zone3_vitesse(VMA, FCM, FCRepos):
    FC70, FC80 = calculer_zone3_karvonen(FCM, FCRepos)
    V70 = VMA * ((FC70 - FCRepos) / (FCM - FCRepos))
    V80 = VMA * ((FC80 - FCRepos) / (FCM - FCRepos))
    return (V70, V80)


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
        zone3 = calculer_zone3_vitesse(VMA, FCM, FCRepos)
        print(f'Zone 3 (70-80%) : {zone3[0]:.2f} - {zone3[1]:.2f} km/h')
