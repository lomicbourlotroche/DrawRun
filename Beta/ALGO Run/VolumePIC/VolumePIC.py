import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from VMA.Formule_de_Leger_et_Mercier.Formule_de_Leger_et_Mercier import calculer_formule_de_Leger_Mercier

def calculer_volume_pic(age, sexe, poids, FCRepos, VolumeHebdoMoyenDistance, DureeProgramme, ObjectifDistance, ObjectifTPS):
    DureeProgramme = DureeProgramme-3
    VolumePICSecurise = VolumeHebdoMoyenDistance * 1.10**DureeProgramme
    Vcible = ObjectifDistance / ObjectifTPS
    VMA = calculer_formule_de_Leger_Mercier(age, sexe, poids, FCRepos)
    A = 10 * (Vcible / VMA) - 5
    VolumePIC = ObjectifDistance * (1 + (A / ObjectifTPS))
    return(VolumePICSecurise, VolumePIC)

##DureeProgramme a revoir en fonction des pourcentages de phase##

if __name__=='__main__':
    age = int(input('votre age :'))
    sexe = input('entrez H si vous etes un homme et F si vous etes une femme :')
    poids = int(input('votre poids :'))
    FCRepos = int(input('votre FC au repos :')) 
    VolumeHebdoMoyenDistance = float(input('votre volume hebdomadaire moyen de distance :'))
    ObjectifDistance = float(input('votre objectif de distance :'))
    ObjectifTPS = float(input('votre objectif de temps :'))
    DureeProgramme = float(input('votre duree de programme :'))
    VolumePIC = calculer_volume_pic(age, sexe, poids, FCRepos, VolumeHebdoMoyenDistance, DureeProgramme, ObjectifDistance, ObjectifTPS)
    print(f'\nLa zone de volume pic :')
    print(f'Le volume pic de securité : {VolumePIC[0]:.2f}')
    print(f'Le volume pic de performance : {VolumePIC[1]:.2f}')