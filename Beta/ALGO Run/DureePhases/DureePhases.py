def calculer_Duree_Phases(ObjectifDistance, DureeProgramme):
    Kbase = 10
    K = Kbase + (ObjectifDistance * 0.5)
    Sd = ObjectifDistance / (21 + K)
    phaseGenerale = round(((40 + (30 * Sd))/100) * DureeProgramme)
    phaseAffutage = round(0.1 * DureeProgramme)
    phaseSpecifique = DureeProgramme - phaseGenerale - phaseAffutage
    return(phaseGenerale, phaseSpecifique, phaseAffutage)

if __name__ == '__main__':
    ObjectifDistance = float(input('votre objectif de distance :'))
    DureeProgramme = float(input('votre duree de programme :'))
    DureePhases = calculer_Duree_Phases(ObjectifDistance, DureeProgramme)
    print(f"\nLa duree des phases d'entrainement :")
    print(f'La duree de la phase generale : {DureePhases[0]:.2f} semaines')
    print(f'La duree de la phase specifique : {DureePhases[1]:.2f} semaines')
    print(f"La duree de la phase d'affutage : {DureePhases[2]:.2f} semaines")
