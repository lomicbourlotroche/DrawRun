import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from FCM.FCM import calculer_fcm
from VO2max.Formule_Niels_Uth.K_dynamique_équation_de_régression_de_Ari_Voutilainen.K_dynamique import calculer_K_dynamique

def calculer_VO2max_formule_Niels_Uth(age, sexe, poids, FCRepos):
    K = calculer_K_dynamique(age, sexe, poids, FCRepos)
    FCM = calculer_fcm(age, sexe, poids)
    if FCM is None:
        print('entrez soit H soit F :')
        FCM = calculer_fcm(age, sexe, poids)
    else:
        VO2max = K * (FCM/FCRepos)
        return (VO2max)

if __name__ == '__main__':
    age = int(input('votre age :'))
    sexe = input('entrez H si vous etes un homme et F si vous etes une femme :')
    poids = int(input('votre poids :'))
    FCRepos = int(input('votre FC au repos :'))
    VO2max = calculer_VO2max_formule_Niels_Uth(age, sexe, poids, FCRepos)
    print(VO2max)