import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from ZonesVitesse.Z4_V_80_90 import calculer_zone4_vitesse
from FCM.FCM import calculer_fcm
from VMA.Formule_de_Leger_et_Mercier.Formule_de_Leger_et_Mercier import calculer_formule_de_Leger_Mercier

def calculer_zone4_allure(V80, V90):
    A80 = 60 / V80
    A90 = 60 / V90
    return (A90, A80)


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
        V80, V90 = calculer_zone4_vitesse(VMA, FCM, FCRepos)
        zone4 = calculer_zone4_allure(V80, V90)
        minutes_lent = int(zone4[1])
        secondes_lent = int((zone4[1] - minutes_lent) * 60)
        minutes_rapide = int(zone4[0])
        secondes_rapide = int((zone4[0] - minutes_rapide) * 60)
        print(f'Zone 4 (80-90%) : {minutes_lent}:{secondes_lent:02d} - {minutes_rapide}:{secondes_rapide:02d} min/km')
