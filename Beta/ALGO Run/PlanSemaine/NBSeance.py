def calculer_NB_Seance(VolumeDistance):
    NBSeance = round(2 + VolumeDistance/23)
    return NBSeance

if __name__=='__main__':
    VolumeDistance = float(input('votre volume de distance :'))
    NBSeance = calculer_NB_Seance(VolumeDistance)
    print(f'nombre de seance :{NBSeance}')