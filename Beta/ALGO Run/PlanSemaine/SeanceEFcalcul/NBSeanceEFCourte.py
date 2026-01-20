import sys
import os
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from PlanSemaine.NBSeance import calculer_NB_Seance

def calculer_NB_Seance_EF_Courte(VolumeDistance):
    NBSeance = calculer_NB_Seance(VolumeDistance)
    NBSeanceEFCourte = NBSeance - 2
    return NBSeanceEFCourte
    
if __name__=='__main__':
    VolumeDistance = float(input('votre volume de distance :'))
    NBSeanceEFCourte = calculer_NB_Seance_EF_Courte(VolumeDistance)
    print(f"Le nombre de seance d'endurance fondamentale courte :{NBSeanceEFCourte}")

