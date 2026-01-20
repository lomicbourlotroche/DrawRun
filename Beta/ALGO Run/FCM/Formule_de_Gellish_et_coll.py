def calculer_fcm_gellish(age):
    FCM = 191.5 - 0.007 * age**2
    return(FCM)


if __name__ == '__main__':
    age = int(input('votre age :'))
    FCM = calculer_fcm_gellish(age)
    print(FCM)
