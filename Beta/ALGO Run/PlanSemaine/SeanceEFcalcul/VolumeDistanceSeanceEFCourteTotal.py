import sys
import os
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from PlanSemaine.VolumeDistanceEF.VolumeEF import calculer_Volume_EF
from PlanSemaine.SeanceEFcalcul.VolumeDistanceSeanceEFLongue import calculer_Volume_Seance_EF_Longue

def calculer_Volume_Seance_EF_Courte_Total(VolumeDistance):
    VolumeEF = calculer_Volume_EF(VolumeDistance)
    VolumeEFLongue = calculer_Volume_Seance_EF_Longue(VolumeDistance)
    VolumeEFCourte = VolumeEF - VolumeEFLongue
    return VolumeEFCourte

if __name__=='__main__':
    VolumeDistance = float(input('votre volume de distance :'))
    VolumeDistanceEFCourte = calculer_Volume_Seance_EF_Courte_Total(VolumeDistance)
    print('Vous avez ' + str(VolumeDistanceEFCourte) + " km d'endurance fondamentale Courte.")