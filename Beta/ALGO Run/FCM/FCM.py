def calculer_fcm(age, sexe, poids):
    if sexe not in ['H', 'F']:
        return None
    
    if sexe == 'H':
        FCM = (-0.007*age**2 - 2.819*age - 0.11*poids + 1043.554) / 5
    else:
        FCM = (-0.007*age**2 - 2.819*age - 0.11*poids + 1042.554) / 5
    
    return FCM


if __name__ == '__main__':
    age = int(input('votre age :'))
    sexe = input('entrez H si vous etes un homme et F si vous etes une femme :')
    poids = int(input('votre poids :'))
    
    resultat = calculer_fcm(age, sexe, poids)
    if resultat is None:
        print('entrez soit H soit F :')
    else:
        print(resultat)
