import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent))

from FCM.FCM import calculer_fcm

def calculer_zone5_karvonen(FCM, FCRepos):
    FC90 = FCRepos + ((FCM - FCRepos) * 0.9)
    FC100 = FCRepos + ((FCM - FCRepos) * 1)
    return (FC90, FC100)


if __name__ == '__main__':
    age = int(input('votre age :'))
    sexe = input('entrez H si vous etes un homme et F si vous etes une femme :')
    poids = int(input('votre poids :'))
    FCRepos = int(input('votre FC au repos :'))
    
    FCM = calculer_fcm(age, sexe, poids)
    if FCM is None:
        print('entrez soit H soit F :')
    else:
        zone5 = calculer_zone5_karvonen(FCM, FCRepos)
        print('Zone5 : ', zone5[0], '-', zone5[1])
