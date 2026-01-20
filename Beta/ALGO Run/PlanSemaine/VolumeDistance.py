from PlanSemaine.VolumeDistanceEF.VolumeEF import calculer_Volume_EF
from PlanSemaine.VolumeDistanceQualite.VolumeQualite import calculer_Volume_Q

def calculer_Volume_Distance_Type(VolumeDistance):
    VolumeEF = calculer_Volume_EF(VolumeDistance)
    VolumeQ = calculer_Volume_Q(VolumeDistance)
    return (VolumeEF, VolumeQ)

if __name__=='__main__':
    VolumeDistance = float(input('votre volume de distance :'))
    VolumeType = calculer_Volume_Distance_Type(VolumeDistance)
    print('Vous avez ' + str(VolumeType[0]) + " km d'endurance fondamentale.")
    print('Vous avez ' + str(VolumeType[1]) + " km de qualité.")