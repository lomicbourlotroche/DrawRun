#!/usr/bin/env python3
"""
Garmin API Script
=================
Interface Python pour l'API Garmin Connect.
Utilise le module garminconnect pour récupérer les activités et métriques.
"""

import sys
import json
import argparse
import os
from datetime import datetime, timedelta

try:
    from garminconnect import Garmin
except ImportError:
    print(
        json.dumps(
            {
                "error": "Module garminconnect not installed. Run: pip install garminconnect"
            }
        )
    )
    sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Garmin API Script")
    parser.add_argument("--creds", type=str, help="Read credentials from stdin")
    parser.add_argument(
        "--tokenstore",
        type=str,
        help="Token store directory (unused, kept for compatibility)",
    )
    parser.add_argument(
        "--mode",
        type=str,
        default="activities",
        choices=["activities", "health", "body", "all"],
    )
    parser.add_argument("--days", type=int, default=30)
    parser.add_argument("--limit", type=int, default=100)
    parser.add_argument("--start", type=str, help="Start date (YYYY-MM-DD)")
    parser.add_argument("--id", type=str, help="Activity ID")
    parser.add_argument("--format", type=str, default="json")

    args = parser.parse_args()

    # Read credentials from stdin
    if args.creds == "-":
        creds_data = json.loads(sys.stdin.read())
        username = creds_data.get("username")
        password = creds_data.get("password")
    else:
        print(json.dumps({"error": "Credentials required via stdin"}))
        sys.exit(1)

    if not username or not password:
        print(json.dumps({"error": "Username and password required"}))
        sys.exit(1)

    try:
        # Initialize Garmin client (token storage is handled automatically by garth module)
        garmin = Garmin(username, password)

        # Login
        garmin.login()

        result = {}

        if args.mode in ["activities", "all"]:
            # Get activities using date range (correct API method)
            start_date = args.start or (
                datetime.now() - timedelta(days=args.days)
            ).strftime("%Y-%m-%d")
            end_date = datetime.now().strftime("%Y-%m-%d")
            activities = garmin.get_activities_by_date(start_date, end_date)
            # Limit results if needed
            if args.limit and len(activities) > args.limit:
                activities = activities[: args.limit]
            result["activities"] = activities

        if args.mode in ["health", "all"]:
            # Get health metrics
            date = args.start or datetime.now().strftime("%Y-%m-%d")
            health = {}
            try:
                health["heart_rate"] = garmin.get_heart_rates(date)
            except Exception as e:
                print(
                    json.dumps({"warning": f"Heart rate data unavailable: {str(e)}"}),
                    file=sys.stderr,
                )
            try:
                health["sleep"] = garmin.get_sleep_data(date)
            except Exception as e:
                print(
                    json.dumps({"warning": f"Sleep data unavailable: {str(e)}"}),
                    file=sys.stderr,
                )
            try:
                health["steps"] = garmin.get_steps_data(date)
            except Exception as e:
                print(
                    json.dumps({"warning": f"Steps data unavailable: {str(e)}"}),
                    file=sys.stderr,
                )
            try:
                health["hrv"] = garmin.get_hrv_data(date)
            except Exception as e:
                print(
                    json.dumps({"warning": f"HRV data unavailable: {str(e)}"}),
                    file=sys.stderr,
                )
            try:
                health["spo2"] = garmin.get_sp_o2_data(date)
            except Exception as e:
                print(
                    json.dumps({"warning": f"SpO2 data unavailable: {str(e)}"}),
                    file=sys.stderr,
                )
            result["health"] = health

        if args.mode in ["body", "all"]:
            # Get body metrics
            body = {
                "weight": garmin.get_body_weight(),
                "body_fat": garmin.get_body_fat(),
            }
            result["body"] = body

        print(json.dumps(result))
        sys.exit(0)

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
