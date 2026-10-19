"""開くと Google Icons のパネルが自動で開く pptx を作る。

PowerPoint のリボンに「アドイン」の入口が無い環境向け。
wef フォルダにマニフェストを置いた上で（make_manifest.py --install）、この pptx を開く。
ひな形は Microsoft の office-addin-dev-settings に同梱のもの。

使い方: python3 make_launcher.py
"""
import pathlib
import re
import zipfile

HERE = pathlib.Path(__file__).parent
TEMPLATE = HERE / "launcher-template.pptx"
OUT = HERE / "Google Icons 起動用.pptx"
EXT = "ppt/webextensions/webextension.xml"

manifest = (HERE / "manifest.template.xml").read_text(encoding="utf-8")
addin_id = re.search(r"<Id>(.*?)</Id>", manifest).group(1)
version = re.search(r"<Version>(.*?)</Version>", manifest).group(1)

with zipfile.ZipFile(TEMPLATE) as src, zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as dst:
    for item in src.infolist():
        data = src.read(item.filename)
        if item.filename == EXT:
            xml = data.decode("utf-8-sig")
            xml = xml.replace("00000000-0000-0000-0000-000000000000", addin_id).replace('version="1.0.0.0"', f'version="{version}"')
            data = xml.encode("utf-8")
        dst.writestr(item, data)

print(f"作成: {OUT}（id {addin_id}, version {version}）")
