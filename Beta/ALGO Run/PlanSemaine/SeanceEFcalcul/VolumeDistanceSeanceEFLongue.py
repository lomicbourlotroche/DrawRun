import sys
import os
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from PlanSemaine.VolumeDistanceEF.VolumeEF import calculer_Volume_EF

def calculer_Volume_Seance_EF_Longue(VolumeDistance):
    VolumeEF = calculer_Volume_EF(VolumeDistance)
    VolumeEFLongue = 3 * VolumeEF**(1/2)
    return VolumeEFLongue

if __name__=='__main__':
    VolumeDistance = float(input('votre volume de distance :'))
    VolumeDistanceEFLongue = calculer_Volume_Seance_EF_Longue(VolumeDistance)
    print('Vous avez ' + str(VolumeDistanceEFLongue) + " km d'endurance fondamentale longue.")
