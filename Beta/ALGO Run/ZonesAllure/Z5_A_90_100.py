import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from ZonesVitesse.Z5_V_90_100 import calculer_zone5_vitesse
from FCM.FCM import calculer_fcm
from VMA.Formule_de_Leger_et_Mercier.Formule_de_Leger_et_Mercier import calculer_formule_de_Leger_Mercier

def calculer_zone5_allure(V90, V100):
    A90 = 60 / V90
    A100 = 60 / V100
    return (A100, A90)


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
        V90, V100 = calculer_zone5_vitesse(VMA, FCM, FCRepos)
        zone5 = calculer_zone5_allure(V90, V100)
        minutes_lent = int(zone5[1])
        secondes_lent = int((zone5[1] - minutes_lent) * 60)
        minutes_rapide = int(zone5[0])
        secondes_rapide = int((zone5[0] - minutes_rapide) * 60)
        print(f'Zone 5 (90-100%) : {minutes_lent}:{secondes_lent:02d} - {minutes_rapide}:{secondes_rapide:02d} min/km')
