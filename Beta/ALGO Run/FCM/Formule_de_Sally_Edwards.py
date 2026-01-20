def calculer_fcm_sally_edwards(age, sexe, poids):
    if sexe not in ['H', 'F']:
        return None
    
    if sexe == 'H':
        FCM = 214 - 0.5 * age - 0.11 * poids
    else:
        FCM = 210 - 0.5 * age - 0.11 * poids
    
    return FCM


if __name__ == '__main__':
    age = int(input('votre age :'))
    sexe = input('entrez H si vous etes un homme et F si vous etes une femme :')
    poids = int(input('votre poids :'))
    
    resultat = calculer_fcm_sally_edwards(age, sexe, poids)
    if resultat is None:
        print('entrez soit H soit F :')
    else:
        print(resultat)
