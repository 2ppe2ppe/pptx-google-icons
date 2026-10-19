"""ja/*.txt（英単語 → 日本語の訳語）から、検索用の docs/data/ja.json を作る。

ja.json は「日本語の語 → 英単語の一覧」。パネルは日本語の検索語をこれで英単語に置き換えて探す。
使い方: python3 build_ja.py
"""
import json
import pathlib

HERE = pathlib.Path(__file__).parent
OUT = HERE / "docs" / "data" / "ja.json"

index = {}
for path in sorted((HERE / "ja").glob("*.txt")):
    for line in path.read_text(encoding="utf-8").splitlines():
        parts = line.split()
        if len(parts) < 2 or line.startswith("#"):
            continue
        en, terms = parts[0], parts[1:]
        for t in terms:
            words = index.setdefault(t, [])
            if en not in words:
                words.append(en)

OUT.write_text(json.dumps(index, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"{len(index)} 語 -> {OUT}（{OUT.stat().st_size // 1024} KB）")
