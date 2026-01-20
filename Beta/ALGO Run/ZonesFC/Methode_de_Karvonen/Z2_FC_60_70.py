import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent))

from FCM.FCM import calculer_fcm

def calculer_zone2_karvonen(FCM, FCRepos):
    FC60 = FCRepos + ((FCM - FCRepos) * 0.6)
    FC70 = FCRepos + ((FCM - FCRepos) * 0.7)
    return (FC60, FC70)


if __name__ == '__main__':
    age = int(input('votre age :'))
    sexe = input('entrez H si vous etes un homme et F si vous etes une femme :')
    poids = int(input('votre poids :'))
    FCRepos = int(input('votre FC au repos :'))
    
    FCM = calculer_fcm(age, sexe, poids)
    if FCM is None:
        print('entrez soit H soit F :')
    else:
        zone2 = calculer_zone2_karvonen(FCM, FCRepos)
        print('Zone2 : ', zone2[0], '-', zone2[1])
