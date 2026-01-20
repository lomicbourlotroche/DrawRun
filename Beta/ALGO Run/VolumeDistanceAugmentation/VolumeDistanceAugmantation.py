def calculer_Volume_Distance_Augmentation(VolumeDistance, nbaugmentation):
    VolumeDistanceStock = 0
    if (nbaugmentation<=2):
        VolumeDistance = VolumeDistance * 1.1
        nbaugmentation += 1
        if (nbaugmentation==2):
            VolumeDistanceStock = VolumeDistance
    else:
        VolumeDistance = VolumeDistance * 0.6
        nbaugmentation = 0
    return VolumeDistance, VolumeDistanceStock, nbaugmentation

if __name__=='__main__':
    VolumeDistance = float(input('votre volume de distance :'))
    nbaugmentation = int(input('votre nombre d augmentation :'))
    VolumeDistance, VolumeDistanceStock, nbaugmentation = calculer_Volume_Distance_Augmentation(VolumeDistance, nbaugmentation)
    print(f"Vous avez {VolumeDistance} km")