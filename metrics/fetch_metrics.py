#!/usr/bin/env python3
"""
Candeia Tec - Coleta de metricas via Windsor.ai

Busca metricas de Instagram (nivel de conta e nivel de post) pela API
do Windsor.ai e salva um JSON em data/<persona>_metrics.json.

Uso:
    python metrics/fetch_metrics.py --persona tamara --days 30
    python metrics/fetch_metrics.py --persona tamara --days 7

A chave da API e lida da variavel de ambiente WINDSOR_API_KEY.
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen, Request
from urllib.error import HTTPError, URLError

WINDSOR_BASE_URL = "https://connectors.windsor.ai/all"

PERSONAS = {
    "tamara": {
        "label": "Tamara Cavalcante",
        "platform": "instagram",
        "account_id": "17841410001362576",
        "account_name": "tamaraorganiza",
    },
}

# Campos de nivel de conta (nomes validados no Windsor)
ACCOUNT_FIELDS = [
    "date",
    "datasource",
    "account_name",
    "source",
    "followers_count",
    "reach",
    "accounts_engaged",
    "likes",
    "comments",
]

# Campos de nivel de post / midia (nomes validados no Windsor)
POST_FIELDS = [
    "date",
    "datasource",
    "account_name",
    "media_type",
    "media_caption",
    "media_reach",
    "media_engagement",
    "media_saved",
    "media_shares",
    "media_comments_count",
    "media_like_count",
    "media_permalink",
]


def get_api_key():
    api_key = os.environ.get("WINDSOR_API_KEY")
    if not api_key:
        print(
            "ERRO: variavel de ambiente WINDSOR_API_KEY nao definida.",
            file=sys.stderr,
        )
        sys.exit(1)
    return api_key


def windsor_fetch(api_key, fields, days, account_name):
    params = {
        "api_key": api_key,
        "date_preset": "last_" + str(days) + "d",
        "fields": ",".join(fields),
    }
    url = WINDSOR_BASE_URL + "?" + urlencode(params)
    req = Request(url, headers={"User-Agent": "corujalabs-metrics/1.0"})
    try:
        with urlopen(req, timeout=60) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except HTTPError as exc:
        body = ""
        try:
            body = exc.read().decode("utf-8")[:300]
        except Exception:
            pass
        print("ERRO HTTP " + str(exc.code) + ": " + str(exc.reason) + " " + body, file=sys.stderr)
        sys.exit(1)
    except URLError as exc:
        print("ERRO de conexao: " + str(exc.reason), file=sys.stderr)
        sys.exit(1)

    if isinstance(payload, dict):
        rows = payload.get("data", [])
    elif isinstance(payload, list):
        rows = payload
    else:
        rows = []

    if account_name:
        rows = [
            r for r in rows
            if str(r.get("account_name", "")).lower() == account_name.lower()
        ]
    return rows


def is_post_row(row):
    """Linha de post tem algum campo de midia preenchido."""
    media_keys = ("media_type", "media_caption", "media_permalink",
                  "media_reach", "media_like_count")
    return any(row.get(k) not in (None, "", "null") for k in media_keys)


def collect(persona_key, days):
    if persona_key not in PERSONAS:
        print("ERRO: persona '" + persona_key + "' nao configurada.", file=sys.stderr)
        sys.exit(1)

    persona = PERSONAS[persona_key]
    api_key = get_api_key()
    account_name = persona["account_name"]

    print("Coletando " + persona["label"] + " (" + account_name + ") - ultimos " + str(days) + " dias...")

    account_rows = windsor_fetch(api_key, ACCOUNT_FIELDS, days, account_name)
    post_rows_raw = windsor_fetch(api_key, POST_FIELDS, days, account_name)
    post_rows = [r for r in post_rows_raw if is_post_row(r)]

    return {
        "persona": persona_key,
        "label": persona["label"],
        "platform": persona["platform"],
        "account_id": persona["account_id"],
        "account_name": account_name,
        "range_days": days,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "account_metrics": account_rows,
        "post_metrics": post_rows,
    }


def save(result, persona_key):
    repo_root = Path(__file__).resolve().parent.parent
    data_dir = repo_root / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    out_path = data_dir / (persona_key + "_metrics.json")
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(result, fh, ensure_ascii=False, indent=2)
    print("OK: " + str(len(result["account_metrics"])) + " linhas de conta e " +
          str(len(result["post_metrics"])) + " de post salvas em " + str(out_path))
    return out_path


def main():
    parser = argparse.ArgumentParser(
        description="Coleta metricas de redes sociais via Windsor.ai"
    )
    parser.add_argument("--persona", default="tamara", help="Chave da persona")
    parser.add_argument("--days", type=int, default=30, help="Janela de dias")
    args = parser.parse_args()

    result = collect(args.persona, args.days)
    save(result, args.persona)


if __name__ == "__main__":
    main()
