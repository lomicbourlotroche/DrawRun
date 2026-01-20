import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent))

from FCM.FCM import calculer_fcm

def calculer_zone1_karvonen(FCM, FCRepos):
    FC50 = FCRepos + ((FCM - FCRepos) * 0.5)
    FC60 = FCRepos + ((FCM - FCRepos) * 0.6)
    return (FC50, FC60)


if __name__ == '__main__':
    age = int(input('votre age :'))
    sexe = input('entrez H si vous etes un homme et F si vous etes une femme :')
    poids = int(input('votre poids :'))
    FCM = calculer_fcm(age, sexe, poids)
    if FCM is None:
        print('entrez soit H soit F :')
    else:
        FCRepos = int(input('votre FC au repos :'))
        zone1 = calculer_zone1_karvonen(FCM, FCRepos)
        print('Zone1 : ', zone1[0], '-', zone1[1])
