def calculer_Volume_EF(VolumeDistance):
    VolumeDistanceEF = 0.8 * VolumeDistance
    return VolumeDistanceEF

if __name__=='__main__':
    VolumeDistance = float(input('votre volume de distance :'))
    VolumeDistanceEF = calculer_Volume_EF(VolumeDistance)
    print('Vous avez ' + str(VolumeDistanceEF) + " km d'endurance fondamentale.")