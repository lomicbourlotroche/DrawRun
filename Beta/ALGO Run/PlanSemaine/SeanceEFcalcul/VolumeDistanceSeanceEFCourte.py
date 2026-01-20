import sys
import os
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from PlanSemaine.SeanceEFcalcul.VolumeDistanceSeanceEFCourteTotal import calculer_Volume_Seance_EF_Courte_Total
from PlanSemaine.SeanceEFcalcul.NBSeanceEFCourte import calculer_NB_Seance_EF_Courte

def calculer_Volume_Seance_EF_Courte(VolumeDistance):
    NBSeanceEFCourte = calculer_NB_Seance_EF_Courte(VolumeDistance)
    if NBSeanceEFCourte <= 0:
        return 0
    VolumeDistanceEFCourte = calculer_Volume_Seance_EF_Courte_Total(VolumeDistance) / NBSeanceEFCourte
    return VolumeDistanceEFCourte
    


if __name__=='__main__':
    VolumeDistance = float(input('votre volume de distance :'))
    VolumeDistanceEFCourte = calculer_Volume_Seance_EF_Courte(VolumeDistance)
    print(f"Le volume en distance de seance d'endurance fondamentale courte est:{VolumeDistanceEFCourte}")
