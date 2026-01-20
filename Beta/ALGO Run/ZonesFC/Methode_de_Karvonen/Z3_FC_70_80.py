import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent))

from FCM.FCM import calculer_fcm

def calculer_zone3_karvonen(FCM, FCRepos):
    FC70 = FCRepos + ((FCM - FCRepos) * 0.7)
    FC80 = FCRepos + ((FCM - FCRepos) * 0.8)
    return (FC70, FC80)


if __name__ == '__main__':
    age = int(input('votre age :'))
    sexe = input('entrez H si vous etes un homme et F si vous etes une femme :')
    poids = int(input('votre poids :'))
    FCRepos = int(input('votre FC au repos :'))
    
    FCM = calculer_fcm(age, sexe, poids)
    if FCM is None:
        print('entrez soit H soit F :')
    else:
        zone3 = calculer_zone3_karvonen(FCM, FCRepos)
        print('Zone3 : ', zone3[0], '-', zone3[1])
