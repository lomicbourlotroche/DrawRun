def calculer_Volume_Q(VolumeDistance):
    VolumeDistanceQ = 0.2 * VolumeDistance
    return VolumeDistanceQ

if __name__=='__main__':
    VolumeDistance = float(input('votre volume de distance :'))
    VolumeDistanceQ = calculer_Volume_Q(VolumeDistance)
    print('Vous avez ' + str(VolumeDistanceQ) + " km de qualité.")