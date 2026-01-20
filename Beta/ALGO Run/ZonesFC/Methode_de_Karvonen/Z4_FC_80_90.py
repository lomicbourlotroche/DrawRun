import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent))

from FCM.FCM import calculer_fcm

def calculer_zone4_karvonen(FCM, FCRepos):
    FC80 = FCRepos + ((FCM - FCRepos) * 0.8)
    FC90 = FCRepos + ((FCM - FCRepos) * 0.9)
    return (FC80, FC90)


if __name__ == '__main__':
    age = int(input('votre age :'))
    sexe = input('entrez H si vous etes un homme et F si vous etes une femme :')
    poids = int(input('votre poids :'))
    FCRepos = int(input('votre FC au repos :'))
    
    FCM = calculer_fcm(age, sexe, poids)
    if FCM is None:
        print('entrez soit H soit F :')
    else:
        zone4 = calculer_zone4_karvonen(FCM, FCRepos)
        print('Zone4 : ', zone4[0], '-', zone4[1])
