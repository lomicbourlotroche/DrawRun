import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from ZonesVitesse.Z1_V_50_60 import calculer_zone1_vitesse
from FCM.FCM import calculer_fcm
from VMA.Formule_de_Leger_et_Mercier.Formule_de_Leger_et_Mercier import calculer_formule_de_Leger_Mercier

def calculer_zone1_allure(V50, V60):
    A50 = 60 / V50
    A60 = 60 / V60
    return (A60, A50)


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
        V50, V60 = calculer_zone1_vitesse(VMA, FCM, FCRepos)
        zone1 = calculer_zone1_allure(V50, V60)
        minutes_lent = int(zone1[1])
        secondes_lent = int((zone1[1] - minutes_lent) * 60)
        minutes_rapide = int(zone1[0])
        secondes_rapide = int((zone1[0] - minutes_rapide) * 60)
        print(f'Zone 1 (50-60%) : {minutes_lent}:{secondes_lent:02d} - {minutes_rapide}:{secondes_rapide:02d} min/km')
