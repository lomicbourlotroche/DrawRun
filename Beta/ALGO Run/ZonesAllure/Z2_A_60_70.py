import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from ZonesVitesse.Z2_V_60_70 import calculer_zone2_vitesse
from FCM.FCM import calculer_fcm
from VMA.Formule_de_Leger_et_Mercier.Formule_de_Leger_et_Mercier import calculer_formule_de_Leger_Mercier

def calculer_zone2_allure(V60, V70):
    A60 = 60 / V60
    A70 = 60 / V70
    return (A70, A60)


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
        V60, V70 = calculer_zone2_vitesse(VMA, FCM, FCRepos)
        zone2 = calculer_zone2_allure(V60, V70)
        minutes_lent = int(zone2[1])
        secondes_lent = int((zone2[1] - minutes_lent) * 60)
        minutes_rapide = int(zone2[0])
        secondes_rapide = int((zone2[0] - minutes_rapide) * 60)
        print(f'Zone 2 (60-70%) : {minutes_lent}:{secondes_lent:02d} - {minutes_rapide}:{secondes_rapide:02d} min/km')
