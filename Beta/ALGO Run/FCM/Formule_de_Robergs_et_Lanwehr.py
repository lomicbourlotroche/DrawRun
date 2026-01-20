def calculer_fcm_robergs(age):
    FCM = 208.754 - 0.734 * age
    return FCM


if __name__ == '__main__':
    age = int(input('votre age :'))
    FCM = calculer_fcm_robergs(age)
    print(FCM)
