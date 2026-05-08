#!/usr/bin/env python3
"""
Garmin API Script
=================
Interface Python pour l'API Garmin Connect.

Stratégie d'authentification (évite le rate-limit Garmin) :
  1. Si un tokenstore garth existe et est valide → réutilise les tokens (pas de login réseau)
  2. Sinon → login avec email/password, sauvegarde les tokens dans le tokenstore
  3. Les tokens garth sont des OAuth2 tokens valides ~1 an → un seul login suffit

Usage:
  echo '{"username":"...", "password":"..."}' | python3 garmin_api.py \
      --creds - --tokenstore /path/to/dir --mode activities
"""

import sys
import json
import argparse
import os
from datetime import datetime, timedelta

# ── garminconnect ──────────────────────────────────────────────────────────
try:
    from garminconnect import Garmin
except ImportError:
    print(json.dumps({"error": "Module garminconnect not installed. Run: pip install garminconnect"}))
    sys.exit(1)

# ── garth (token persistence) ──────────────────────────────────────────────
try:
    import garth
    GARTH_AVAILABLE = True
except ImportError:
    GARTH_AVAILABLE = False


def load_garmin_with_tokens(tokenstore: str, username: str, password: str) -> "Garmin":
    """
    Tente de charger les tokens garth depuis le tokenstore.
    Si les tokens sont valides → retourne un client Garmin sans faire de login réseau.
    Si les tokens sont absents/expirés → fait un login complet et sauvegarde les tokens.
    """
    garmin = Garmin(email=username, password=password, is_cn=False)

    if GARTH_AVAILABLE and tokenstore:
        os.makedirs(tokenstore, exist_ok=True)
        token_file = os.path.join(tokenstore, "oauth2_token.json")

        # Essayer de charger les tokens existants
        if os.path.exists(token_file):
            try:
                garmin.garth.load(tokenstore)
                # Vérifier que les tokens sont encore valides avec un appel léger
                garmin.display_name  # accès à la propriété qui force le refresh si besoin
                print(f"[garth] Tokens loaded from {tokenstore}", file=sys.stderr)
                return garmin
            except Exception as e:
                print(f"[garth] Tokens invalid ({e}), re-logging in...", file=sys.stderr)

        # Login complet + sauvegarde des tokens
        garmin.login()
        try:
            garmin.garth.dump(tokenstore)
            print(f"[garth] Tokens saved to {tokenstore}", file=sys.stderr)
        except Exception as e:
            print(f"[garth] Could not save tokens: {e}", file=sys.stderr)
    else:
        # Pas de garth disponible → login classique
        garmin.login()

    return garmin


def main():
    parser = argparse.ArgumentParser(description="Garmin API Script")
    parser.add_argument("--creds", type=str, help="Read credentials from stdin (use '-')")
    parser.add_argument("--tokenstore", type=str, default="", help="Directory to persist garth OAuth tokens")
    parser.add_argument(
        "--mode", type=str, default="activities",
        choices=["activities", "details", "health", "body", "metrics", "all", "gpx", "streams"],
    )
    parser.add_argument("--days", type=int, default=30)
    parser.add_argument("--limit", type=int, default=100)
    parser.add_argument("--start", type=str, help="Start date (YYYY-MM-DD)")
    parser.add_argument("--start_date", type=str, help="Start date alias (YYYY-MM-DD)")
    parser.add_argument("--id", type=str, help="Activity ID for details mode")
    parser.add_argument("--format", type=str, default="json")

    args = parser.parse_args()

    # ── Lecture des credentials ────────────────────────────────────────────
    if args.creds == "-":
        try:
            creds_data = json.loads(sys.stdin.read())
            username = creds_data.get("username", "")
            password = creds_data.get("password", "")
        except Exception as e:
            print(json.dumps({"error": f"Failed to parse credentials: {e}"}))
            sys.exit(1)
    else:
        print(json.dumps({"error": "Credentials required via stdin (--creds -)"}))
        sys.exit(1)

    if not username or not password:
        print(json.dumps({"error": "Username and password required"}))
        sys.exit(1)

    # ── Connexion avec persistance des tokens ──────────────────────────────
    try:
        garmin = load_garmin_with_tokens(args.tokenstore, username, password)
    except Exception as e:
        err_msg = str(e)
        is_rate_limited = "429" in err_msg or "rate limit" in err_msg.lower()
        is_blocked = "403" in err_msg or "cloudflare" in err_msg.lower()
        print(json.dumps({
            "error": err_msg,
            "rate_limited": is_rate_limited,
            "blocked": is_blocked,
            "auth_failed": "401" in err_msg or "invalid" in err_msg.lower(),
        }))
        sys.exit(1)

    # ── Exécution selon le mode ────────────────────────────────────────────
    try:
        if args.mode == "activities":
            effective_start = args.start_date or args.start
            start_date = effective_start or (datetime.now() - timedelta(days=args.days)).strftime("%Y-%m-%d")
            end_date = datetime.now().strftime("%Y-%m-%d")
            activities = garmin.get_activities_by_date(start_date, end_date)
            if args.limit and len(activities) > args.limit:
                activities = activities[:args.limit]
            print(json.dumps(activities))

        elif args.mode == "details":
            if not args.id:
                print(json.dumps({"error": "Activity ID required for details mode"}))
                sys.exit(1)
            detail = garmin.get_activity_details(args.id)
            print(json.dumps(detail))

        elif args.mode == "gpx":
            if not args.id:
                print(json.dumps({"error": "Activity ID required for gpx mode"}))
                sys.exit(1)
            try:
                gpx_data = garmin.download_activity(args.id, dl_fmt=garmin.ActivityDownloadFormat.GPX)
                # Return as base64 string so JSON transport works
                import base64
                print(json.dumps({"gpx": base64.b64encode(gpx_data).decode("utf-8")}))
            except Exception as e:
                print(json.dumps({"error": f"GPX download failed: {e}"}))
                sys.exit(1)

        elif args.mode == "streams":
            if not args.id:
                print(json.dumps({"error": "Activity ID required for streams mode"}))
                sys.exit(1)
            # get_activity_details already contains the full metric streams
            detail = garmin.get_activity_details(args.id)
            # Also try to get the GPS track separately
            result = {"detail": detail}
            try:
                splits = garmin.get_activity_splits(args.id)
                result["splits"] = splits
            except Exception:
                pass
            try:
                hr_zones = garmin.get_activity_hr_in_timezones(args.id)
                result["hr_zones"] = hr_zones
            except Exception:
                pass
            print(json.dumps(result))

        elif args.mode == "health":
            effective_start = args.start_date or args.start
            date = effective_start or datetime.now().strftime("%Y-%m-%d")
            health = {}
            for key, fn in [
                ("heart_rate", lambda: garmin.get_heart_rates(date)),
                ("sleep",      lambda: garmin.get_sleep_data(date)),
                ("steps",      lambda: garmin.get_steps_data(date)),
                ("hrv",        lambda: garmin.get_hrv_data(date)),
                ("spo2",       lambda: garmin.get_sp_o2_data(date)),
                ("stress",     lambda: garmin.get_stress_data(date)),
            ]:
                try:
                    health[key] = fn()
                except Exception as e:
                    print(json.dumps({"warning": f"{key} unavailable: {e}"}), file=sys.stderr)
            print(json.dumps(health))

        elif args.mode == "body":
            body = {}
            try:
                body["weight"] = garmin.get_body_weight()
            except Exception:
                pass
            try:
                body["body_fat"] = garmin.get_body_fat()
            except Exception:
                pass
            print(json.dumps(body))

        elif args.mode == "metrics":
            try:
                metrics = garmin.get_max_metrics()
                print(json.dumps(metrics))
            except Exception as e:
                print(json.dumps({"error": str(e)}))
                sys.exit(1)

        elif args.mode == "all":
            result = {}
            effective_start = args.start_date or args.start
            start_date = effective_start or (datetime.now() - timedelta(days=args.days)).strftime("%Y-%m-%d")
            end_date = datetime.now().strftime("%Y-%m-%d")
            activities = garmin.get_activities_by_date(start_date, end_date)
            if args.limit and len(activities) > args.limit:
                activities = activities[:args.limit]
            result["activities"] = activities
            print(json.dumps(result))

        sys.exit(0)

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
