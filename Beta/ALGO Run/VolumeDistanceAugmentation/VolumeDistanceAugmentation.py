def calculer_volume_cyclyque(volume_precedent, semaine_dans_cycle):
    """
    Calcule le volume pour la semaine en cours en utilisant un cycle de progression.
    Cycle: 3 semaines d'augmentation de 10%, 1 semaine de réduction de 40%.

    :param volume_precedent: Le volume de la semaine précédente.
    :param semaine_dans_cycle: L'index de la semaine dans le cycle (1 à 4).
    :return: Le nouveau volume.
    """
    if semaine_dans_cycle >= 1 and semaine_dans_cycle <= 3:
        # Augmentation de 10% pour les 3 premières semaines
        return volume_precedent * 1.1
    elif semaine_dans_cycle == 4:
        # Réduction de 40% la 4ème semaine
        return volume_precedent * 0.6
    else:
        # Retourne la distance inchangée si l'index de semaine est invalide
        return volume_precedent

if __name__ == '__main__':
    volume_actuel = float(input("Entrez le volume de distance actuel (km) : "))
    print("\n--- Exemple de cycle de 4 semaines ---")
    for semaine in range(1, 5):
        volume_actuel = calculer_volume_cyclyque(volume_actuel, semaine)
        print(f"Semaine {semaine}: Volume cible = {volume_actuel:.2f} km")
