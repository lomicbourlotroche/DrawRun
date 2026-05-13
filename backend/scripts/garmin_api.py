#!/usr/bin/env python3
"""
Garmin API Script - Version Ultra-Complète
==========================================
Récupère l'intégralité des données disponibles sur Garmin Connect.
"""

import sys
import json
import argparse
import os
from datetime import datetime, timedelta

try:
    from garminconnect import Garmin
except ImportError:
    print(json.dumps({"error": "Module garminconnect non installé. Exécutez : pip install garminconnect"}), file=sys.stderr)
    sys.exit(1)

try:
    import garth
    GARTH_AVAILABLE = True
except ImportError:
    GARTH_AVAILABLE = False

def get_date_range(args):
    """Calcule la plage de dates et génère une liste de jours individuels."""
    effective_start = args.start_date or args.start
    if effective_start:
        start_dt = datetime.strptime(effective_start, "%Y-%m-%d")
    else:
        start_dt = datetime.now() - timedelta(days=args.days)
    
    end_dt = datetime.now()
    
    # Liste de chaque date formatée entre start et end pour les appels quotidiens
    delta = end_dt - start_dt
    days_list = [(start_dt + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(delta.days + 1)]
    
    return start_dt.strftime("%Y-%m-%d"), end_dt.strftime("%Y-%m-%d"), days_list

def load_garmin_with_tokens(tokenstore: str, username: str, password: str) -> "Garmin":
    garmin = Garmin(email=username, password=password, is_cn=False)

    if GARTH_AVAILABLE and tokenstore:
        os.makedirs(tokenstore, exist_ok=True)
        token_file = os.path.join(tokenstore, "oauth2_token.json")

        if os.path.exists(token_file):
            try:
                garmin.garth.load(tokenstore)
                garmin.display_name  # Test de validité
                print(f"[garth] Session restaurée depuis {tokenstore}", file=sys.stderr)
                return garmin
            except Exception as e:
                print(f"[garth] Session expirée ({e}), reconnexion...", file=sys.stderr)

        garmin.login()
        try:
            garmin.garth.dump(tokenstore)
            print(f"[garth] Nouvelle session sauvegardée", file=sys.stderr)
        except Exception as e:
            print(f"[garth] Erreur sauvegarde tokens : {e}", file=sys.stderr)
    else:
        garmin.login()

    return garmin

def fetch_full_data(garmin, start_date, end_date, days_list, limit):
    """Récupère absolument toutes les catégories de données possibles."""
    all_data = {
        "metadata": {
            "extracted_at": datetime.now().isoformat(),
            "range": {"start": start_date, "end": end_date}
        },
        "user_profile": {},
        "metrics": {},
        "activities": [],
        "daily_health": {},
        "body_composition": {}
    }

    print(f"[info] Extraction globale lancée ({start_date} -> {end_date})", file=sys.stderr)

    # 1. Profil et Records
    try:
        all_data["user_profile"] = garmin.get_user_summary(end_date)
        all_data["metrics"] = garmin.get_max_metrics()
    except Exception as e:
        print(f"[warn] Profil non récupéré: {e}", file=sys.stderr)

    # 2. Activités
    try:
        activities = garmin.get_activities_by_date(start_date, end_date)
        all_data["activities"] = activities[:limit] if limit else activities
    except Exception as e:
        print(f"[warn] Activités non récupérées: {e}", file=sys.stderr)

    # 3. Données de santé quotidiennes (itération sur chaque jour)
    for day in days_list:
        print(f"[info] Récupération santé : {day}", file=sys.stderr)
        day_stats = {}
        endpoints = [
            ("heart_rate", lambda d: garmin.get_heart_rates(d)),
            ("sleep",      lambda d: garmin.get_sleep_data(d)),
            ("steps",      lambda d: garmin.get_steps_data(d)),
            ("hrv",        lambda d: garmin.get_hrv_data(d)),
            ("spo2",       lambda d: garmin.get_sp_o2_data(d)),
            ("stress",     lambda d: garmin.get_stress_data(d)),
            ("respiration",lambda d: garmin.get_respiration_data(d)),
            ("body_battery", lambda d: garmin.get_body_battery(d)),
        ]
        
        for key, fn in endpoints:
            try:
                day_stats[key] = fn(day)
            except Exception:
                day_stats[key] = None
        
        all_data["daily_health"][day] = day_stats

    # 4. Composition Corporelle
    try:
        all_data["body_composition"] = {
            "weight": garmin.get_body_weight(start_date, end_date),
            "composition": garmin.get_body_composition(start_date, end_date)
        }
    except Exception:
        pass

    return all_data

def main():
    parser = argparse.ArgumentParser(description="Garmin Data Harvester")
    parser.add_argument("--creds", type=str, required=True, help="'-' pour lire le JSON via stdin")
    parser.add_argument("--tokenstore", type=str, default="~/.garmin_tokens")
    parser.add_argument("--mode", type=str, default="all", choices=["activities", "health", "all", "metrics"])
    parser.add_argument("--days", type=int, default=7, help="Nombre de jours à récupérer")
    parser.add_argument("--start", type=str, help="Date de début YYYY-MM-DD")
    parser.add_argument("--start_date", type=str, help="Alias date de début")
    parser.add_argument("--limit", type=int, default=100)

    args = parser.parse_args()

    # Lecture des credentials
    if args.creds == "-":
        creds_data = json.loads(sys.stdin.read())
        username, password = creds_data.get("username"), creds_data.get("password")
    else:
        print(json.dumps({"error": "Identifiants requis via stdin"}), file=sys.stderr)
        sys.exit(1)

    try:
        garmin = load_garmin_with_tokens(os.path.expanduser(args.tokenstore), username, password)
        start_date, end_date, days_list = get_date_range(args)

        if args.mode == "all":
            result = fetch_full_data(garmin, start_date, end_date, days_list, args.limit)
        elif args.mode == "activities":
            result = garmin.get_activities_by_date(start_date, end_date)
        elif args.mode == "metrics":
            result = garmin.get_max_metrics()
        else:
            # Mode santé simplifié pour une seule date
            result = fetch_full_data(garmin, start_date, end_date, [start_date], 1)

        print(json.dumps(result, indent=2))
        sys.exit(0)

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
