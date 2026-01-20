def calculer_h_and_min_to_min(H, MIN):
    MINs = H*60 + MIN
    return(MINs)

if __name__=='__main__':
    H = int(input('entrez les heures :'))
    MIN = int(input('entrez les minutes :'))
    MINs = calculer_h_and_min_to_min(H, MIN)
    print(str(H) + 'h' + str(MIN) + 'min = ' + str(MINs) + ' minutes')