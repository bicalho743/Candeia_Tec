"""Gera apps/STATUS_APLICATIVOS.xlsx a partir de apps/catalogo.json.

Uso:  python apps/gerar_planilha.py
Requer: pip install openpyxl

As regras de validação são as mesmas da página "Apps nas lojas" do Hub (assets/lojas.js).
"""
import json
import re
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

AQUI = Path(__file__).resolve().parent
CAT = json.loads((AQUI / "catalogo.json").read_text(encoding="utf-8"))
P = CAT["padrao"]

LOJA = {"play": "Google Play", "apple": "App Store", "geral": "Ambas"}
COR = {
    "ok": "DCFCE7", "warn": "FEF3C7", "falta": "FEE2E2", "vazio": "FFFFFF", "na": "F1F5F9",
    "sec": "F5F0E7", "head": "1F1A14",
}


def vazio(v):
    s = "" if v is None else str(v).strip()
    return s == "" or re.fullmatch(r"x{3,}", s, re.I) is not None


def na(v):
    return re.fullmatch(r"n/?a", str(v or "").strip(), re.I) is not None


def tem_ios(app):
    p = str(app.get("plataformas", ""))
    return re.search(r"ios", p, re.I) and not re.search(r"ios planejad", p, re.I)


def base(app):
    d = "" if vazio(app.get("dominio")) else app["dominio"]
    return d or P["urlBaseSemDominio"].replace("{slug}", app.get("slug") or "app")


def esperado(campo, app):
    r = campo.get("regra", "")
    if r.startswith("url:"):
        return P["urls"][r[4:]].replace("{base}", base(app))
    if r == "emailSuporte":
        e = P["emailSuporte"]
        if "{dominio}" not in e:
            return e
        return "" if vazio(app.get("dominio")) else e.replace("{dominio}", app["dominio"])
    if r == "copyright":
        return P["copyright"]
    if r == "desenvolvedor":
        return P["desenvolvedor"]
    return ""


def avaliar(campo, app):
    """Retorna (estado, motivo, esperado). estado: ok | warn | falta | vazio | na"""
    if campo["loja"] == "apple" and not tem_ios(app):
        return "na", "Sem iOS por enquanto", ""
    v = app.get(campo["id"])
    s = "" if v is None else str(v).strip()
    if na(s):
        return "na", "Não se aplica", ""
    esp = esperado(campo, app)
    if vazio(s):
        return ("falta" if campo.get("obrig") else "vazio"), ("Obrigatório" if campo.get("obrig") else "Opcional"), esp
    mx = campo.get("max")
    if mx and len(s) > mx:
        return "warn", f"{len(s)} caracteres (máx. {mx})", ""
    if campo.get("tipo") == "url" and not re.match(r"^https://\S+\.\S+", s):
        return "warn", "Use o link completo com https://", ""
    if campo.get("tipo") == "email" and not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", s):
        return "warn", "E-mail inválido", ""
    r = campo.get("regra", "")
    if r == "copyright" and not re.fullmatch(r"© \d{4} Candeia Tec", s):
        return "warn", "Fora do padrão", esp
    if r == "desenvolvedor" and s != esp:
        return "warn", "Fora do padrão", esp
    if r.startswith("url:") and s.rstrip("/") + "/" != esp:
        return "warn", "Fora do padrão", esp
    if r == "emailSuporte" and esp and s.lower() != esp:
        return "warn", "Fora do padrão", esp
    if r == "targetSdk" and int(re.sub(r"\D", "", s) or 0) < 36:
        return "warn", "Google Play exige API 36 desde 31/08/2026", ""
    return "ok", "", ""


def texto(campo, app, st, motivo, esp):
    v = app.get(campo["id"])
    if st == "ok":
        return str(v)
    if st == "warn":
        return f"{v}\n⚠ {motivo}" + (f" — padrão: {esp}" if esp else "")
    if st == "falta":
        return "FALTA" + (f"\npadrão: {esp}" if esp else "")
    if st == "vazio":
        return f"(opcional) padrão: {esp}" if esp else ""
    return "n/a" if motivo == "Não se aplica" else "— (sem iOS)"


fino = Side(style="thin", color="E2D9C8")
borda = Border(left=fino, right=fino, top=fino, bottom=fino)
quebra = Alignment(wrap_text=True, vertical="top")

wb = Workbook()

# ---- Aba 1: matriz dos apps ----
ws = wb.active
ws.title = "Apps"
apps = CAT["apps"]
ws.append(["Campo", "Loja"] + [a["nome"] for a in apps])
for c in ws[1]:
    c.font = Font(bold=True, color="FFFFFF")
    c.fill = PatternFill("solid", fgColor=COR["head"])
    c.alignment = Alignment(vertical="center", wrap_text=True)
for sec in CAT["secoes"]:
    ws.append([sec["nome"].upper()])
    r = ws.max_row
    for col in range(1, len(apps) + 3):
        ws.cell(r, col).fill = PatternFill("solid", fgColor=COR["sec"])
    ws.cell(r, 1).font = Font(bold=True, color="9C5F08")
    for campo in [c for c in CAT["campos"] if c["secao"] == sec["id"]]:
        rot = campo["rotulo"] + ("" if campo.get("obrig") else " (opcional)")
        linha = [rot, LOJA[campo["loja"]]]
        estados = []
        for app in apps:
            st, motivo, esp = avaliar(campo, app)
            estados.append(st)
            linha.append(texto(campo, app, st, motivo, esp))
        ws.append(linha)
        r = ws.max_row
        for i, st in enumerate(estados):
            cell = ws.cell(r, i + 3)
            cell.fill = PatternFill("solid", fgColor=COR[st])
            if st == "falta":
                cell.font = Font(bold=True, color="B91C1C")
            elif st == "na":
                cell.font = Font(color="94A3B8")
# placar
ws.append([])
ws.append(["% obrigatórios ok", ""])
r = ws.max_row
ws.cell(r, 1).font = Font(bold=True)
for i, app in enumerate(apps):
    tot = ok = 0
    for campo in CAT["campos"]:
        if not campo.get("obrig"):
            continue
        st = avaliar(campo, app)[0]
        if st == "na":
            continue
        tot += 1
        ok += st == "ok"
    ws.cell(r, i + 3, f"{round(ok / tot * 100) if tot else 100}%  ({ok}/{tot})").font = Font(bold=True)

for row in ws.iter_rows(min_row=1, max_row=ws.max_row):
    for c in row:
        c.border = borda
        if c.row > 1:
            c.alignment = quebra
ws.column_dimensions["A"].width = 44
ws.column_dimensions["B"].width = 13
for i in range(len(apps)):
    ws.column_dimensions[get_column_letter(i + 3)].width = 34
ws.freeze_panes = "C2"

# ---- Aba 2: marcas e perfis ----
wm = wb.create_sheet("Marcas e perfis")
cols = ["nome", "papel", "site", "privacidade", "termos", "email", "instagram", "obs"]
wm.append(["Marca", "Papel", "Site", "Privacidade", "Termos", "E-mail", "Instagram", "Observação"])
for m in CAT["marcas"]:
    wm.append([m.get(k, "") for k in cols])
for c in wm[1]:
    c.font = Font(bold=True, color="FFFFFF")
    c.fill = PatternFill("solid", fgColor=COR["head"])
for i, w in enumerate([24, 34, 34, 40, 34, 28, 40, 24]):
    wm.column_dimensions[get_column_letter(i + 1)].width = w

# ---- Aba 3: padrão e legenda ----
wp = wb.create_sheet("Padrão")
linhas = [
    ("Padrão Candeia Tec", ""),
    ("Copyright", P["copyright"]),
    ("Desenvolvedor exibido nas lojas", P["desenvolvedor"]),
    ("Desenvolvedor (futuro)", P["desenvolvedorFuturo"]),
    ("E-mail de suporte", P["emailSuporte"].replace("{dominio}", "<domínio do app>")),
    ("Privacidade", P["urls"]["privacidade"].replace("{base}", "<domínio>")),
    ("Termos", P["urls"]["termos"].replace("{base}", "<domínio>")),
    ("Excluir conta", P["urls"]["excluirConta"].replace("{base}", "<domínio>")),
    ("Suporte", P["urls"]["suporte"].replace("{base}", "<domínio>")),
    ("App sem domínio próprio", P["urlBaseSemDominio"].replace("{slug}", "<slug>") + "/..."),
    ("Pacote de apps novos", P["pacoteNovosApps"].replace("{slug}", "<app>")),
    ("", ""),
    ("Legenda", ""),
    ("Verde", "ok"),
    ("Amarelo", "fora do padrão ou acima do limite de caracteres"),
    ("Vermelho", "obrigatório faltando (vazio ou xxxx)"),
    ("Cinza", "não se aplica (n/a ou app sem iOS)"),
    ("", ""),
    ("Fonte", "apps/catalogo.json — gerado por apps/gerar_planilha.py em " + CAT["atualizado"]),
    ("Atenção", "Não coloque senhas neste arquivo nem no catálogo: o repositório é público."),
]
for a, b in linhas:
    wp.append([a, b])
for r, cor in [(14, "ok"), (15, "warn"), (16, "falta"), (17, "na")]:
    wp.cell(r, 1).fill = PatternFill("solid", fgColor=COR[cor])
for r in (1, 13):
    wp.cell(r, 1).font = Font(bold=True, size=12)
wp.column_dimensions["A"].width = 34
wp.column_dimensions["B"].width = 80

wb.save(AQUI / "STATUS_APLICATIVOS.xlsx")
print("ok:", AQUI / "STATUS_APLICATIVOS.xlsx")
