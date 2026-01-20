def calculer_fcm_inbar(age):
    FCM = 205.8 - 0.685 * age
    return FCM


if __name__ == '__main__':
    age = int(input('votre age :'))
    FCM = calculer_fcm_inbar(age)
    print(FCM)
