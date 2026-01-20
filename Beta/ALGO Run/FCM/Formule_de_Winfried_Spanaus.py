def calculer_fcm_spanaus(age, sexe):
    if sexe not in ['H', 'F']:
        return None
    
    if sexe == 'H':
        FCM = 223 - 0.9 * age
    else:
        FCM = 226 - 0.9 * age
    
    return FCM


if __name__ == '__main__':
    age = int(input('votre age :'))
    sexe = input('entrez H si vous etes un homme et F si vous etes une femme :')
    
    resultat = calculer_fcm_spanaus(age, sexe)
    if resultat is None:
        print('entrez soit H soit F :')
    else:
        print(resultat)
