import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from FCM.FCM import calculer_fcm

def calculer_K_dynamique(age, sexe, poids, FCRepos):
    FCM = calculer_fcm(age, sexe, poids)
    if FCM is None:
        print('entrez soit H soit F :')
    else:
        K = 9.2 + (1.9 * (FCM/FCRepos))
        return(K)

if __name__ == '__main__':
    age = int(input('votre age :'))
    sexe = input('entrez H si vous etes un homme et F si vous etes une femme :')
    poids = int(input('votre poids :'))
    FCRepos = int(input('votre FC de repos :'))
    K = calculer_K_dynamique(age, sexe, poids, FCRepos)
    print(K)