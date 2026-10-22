"""他の人に渡す配布用 zip（dist/GoogleIcons-PowerPoint-Mac.zip）を作る。

中身: install.sh、導入手順.md、マニフェスト、起動用ファイル、設定、GoogleIcons.ppam
.ppam は自分の PowerPoint で作った ~/Desktop/App/GoogleIcons.ppam を使い、作成者名だけ消す。

使い方: python3 share/make_share.py
"""
import pathlib
import re
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
SHARE = ROOT / "share"
DIST = ROOT / "dist"
BASE_URL = "https://2ppe2ppe.github.io/pptx-google-icons"
PPAM = pathlib.Path.home() / "Desktop/App/GoogleIcons.ppam"
FOLDER = "GoogleIcons-PowerPoint-Mac"

SETTINGS = "delay=0\nwait=8\nwindow=1\nactivate=1\nclose=1\n"


def manifest():
    return (ROOT / "manifest.template.xml").read_text(encoding="utf-8").replace("{{BASE_URL}}", BASE_URL)


def anonymized_ppam():
    """docProps/core.xml の作成者・更新者を空にした ppam のバイト列"""
    import io
    buf = io.BytesIO()
    with zipfile.ZipFile(PPAM) as src, zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as dst:
        for item in src.infolist():
            data = src.read(item.filename)
            if item.filename == "docProps/core.xml":
                xml = data.decode("utf-8")
                xml = re.sub(r"<dc:creator>.*?</dc:creator>", "<dc:creator></dc:creator>", xml)
                xml = re.sub(r"<cp:lastModifiedBy>.*?</cp:lastModifiedBy>", "<cp:lastModifiedBy></cp:lastModifiedBy>", xml)
                data = xml.encode("utf-8")
            dst.writestr(item, data)
    return buf.getvalue()


def main():
    launcher = ROOT / "Google Icons 起動用.pptx"
    for p in (PPAM, launcher):
        if not p.exists():
            raise SystemExit(f"見つかりません: {p}")
    DIST.mkdir(exist_ok=True)
    out = DIST / f"{FOLDER}.zip"
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        def add(name, data, mode=0o644):
            info = zipfile.ZipInfo(f"{FOLDER}/{name}")
            info.external_attr = (0o100000 | mode) << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            z.writestr(info, data)
        add("導入手順.md", (SHARE / "導入手順.md").read_bytes())
        add("install.sh", (SHARE / "install.sh").read_bytes(), 0o755)
        add("google-icons-manifest.xml", manifest().encode("utf-8"))
        add("GoogleIconsLauncher.pptx", launcher.read_bytes())
        add("GoogleIconsLoader.txt", SETTINGS.encode("utf-8"))
        add("GoogleIcons.ppam", anonymized_ppam())
    print(f"作成: {out}（{out.stat().st_size // 1024} KB）")


if __name__ == "__main__":
    main()
