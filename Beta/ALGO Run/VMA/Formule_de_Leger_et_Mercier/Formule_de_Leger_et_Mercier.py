import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from VO2max.Formule_Niels_Uth.Formule_Niels_Uth import calculer_VO2max_formule_Niels_Uth

def calculer_formule_de_Leger_Mercier(age, sexe, poids, FCRepos):
    VO2max = calculer_VO2max_formule_Niels_Uth(age, sexe, poids, FCRepos)
    VMA = (VO2max - 2.209)/3.163
    return VMA

if __name__ == '__main__':
    age = int(input('votre age :'))
    sexe = input('entrez H si vous etes un homme et F si vous etes une femme :')
    poids = int(input('votre poids :'))
    FCRepos = int(input('votre FC au repos :'))
    VMA = calculer_formule_de_Leger_Mercier(age, sexe, poids, FCRepos)
    print(VMA)