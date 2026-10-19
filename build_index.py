"""Googleのアイコン一覧から、アドイン用の軽い検索ファイル docs/data/icons.json を作る。

使い方: python3 build_index.py
"""
import json
import pathlib
import urllib.request

SRC = "https://fonts.google.com/metadata/icons?key=material_symbols&incomplete=true"
OUT = pathlib.Path(__file__).parent / "docs" / "data" / "icons.json"

raw = urllib.request.urlopen(SRC).read().decode("utf-8")
meta = json.loads(raw[raw.index("{"):])

icons = []
cats = []
for ic in meta["icons"]:
    if any(f.startswith("Material Symbols") for f in ic.get("unsupported_families", [])):
        continue
    cat = (ic.get("categories") or [""])[0]
    if cat not in cats:
        cats.append(cat)
    # 名前に含まれる語はタグから省いて容量を減らす
    name_words = set(ic["name"].split("_"))
    tags = sorted({t.lower() for t in ic.get("tags", []) if t.lower() not in name_words})
    icons.append([ic["name"], cats.index(cat), ic.get("popularity", 0), " ".join(tags)])

icons.sort(key=lambda r: -r[2])
OUT.write_text(json.dumps({"categories": cats, "icons": icons}, ensure_ascii=False, separators=(",", ":")))
print(f"{len(icons)} icons, {len(cats)} categories, {OUT.stat().st_size // 1024} KB -> {OUT}")
