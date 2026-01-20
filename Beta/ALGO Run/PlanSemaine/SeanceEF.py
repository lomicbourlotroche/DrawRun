from PlanSemaine.VolumeDistanceEF.VolumeEF import calculer_Volume_EF
from PlanSemaine.SeanceEFcalcul.VolumeDistanceSeanceEFLongue import calculer_Volume_Seance_EF_Longue
from PlanSemaine.SeanceEFcalcul.VolumeDistanceSeanceEFCourte import calculer_Volume_Seance_EF_Courte
from PlanSemaine.SeanceEFcalcul.NBSeanceEFCourte import calculer_NB_Seance_EF_Courte

def generer_Seance_EF(VolumeDistance):
    VolumeDistanceEF = calculer_Volume_EF(VolumeDistance)
    VolumeDistanceEFLongue = calculer_Volume_Seance_EF_Longue(VolumeDistance)
    VolumeDistanceEFCourte = calculer_Volume_Seance_EF_Courte(VolumeDistance)
    NBSeanceEFCourte = calculer_NB_Seance_EF_Courte(VolumeDistance)
    return (VolumeDistanceEF, VolumeDistanceEFLongue, VolumeDistanceEFCourte, NBSeanceEFCourte)


if __name__=='__main__':
    VolumeDistance = float(input('votre volume de distance :'))
    VolumeDistanceEF, VolumeDistanceEFLongue, VolumeDistanceEFCourte, NBSeanceEFCourte = generer_Seance_EF(VolumeDistance)
    print(f"\nVos Seance d'endurance fondamentale d'un totale de {VolumeDistanceEF} km :")
    print(f"Vous avez une seance d'endurance fondamentale longue de {VolumeDistanceEFLongue} km")
    print(f"Vous avez {NBSeanceEFCourte} seance d'endurance fondamentale courte de {VolumeDistanceEFCourte} km")
    