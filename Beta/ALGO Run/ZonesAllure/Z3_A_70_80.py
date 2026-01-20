import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from ZonesVitesse.Z3_V_70_80 import calculer_zone3_vitesse
from FCM.FCM import calculer_fcm
from VMA.Formule_de_Leger_et_Mercier.Formule_de_Leger_et_Mercier import calculer_formule_de_Leger_Mercier

def calculer_zone3_allure(V70, V80):
    A70 = 60 / V70
    A80 = 60 / V80
    return (A80, A70)


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
        V70, V80 = calculer_zone3_vitesse(VMA, FCM, FCRepos)
        zone3 = calculer_zone3_allure(V70, V80)
        minutes_lent = int(zone3[1])
        secondes_lent = int((zone3[1] - minutes_lent) * 60)
        minutes_rapide = int(zone3[0])
        secondes_rapide = int((zone3[0] - minutes_rapide) * 60)
        print(f'Zone 3 (70-80%) : {minutes_lent}:{secondes_lent:02d} - {minutes_rapide}:{secondes_rapide:02d} min/km')
