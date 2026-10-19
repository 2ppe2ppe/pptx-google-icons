"""公開URLを埋め込んだ manifest.xml を作り、Mac の PowerPoint に読み込ませる。

使い方:
  python3 make_manifest.py https://<GitHubユーザー名>.github.io/<リポジトリ名>
  python3 make_manifest.py https://... --install   # wef フォルダにも置く
"""
import pathlib
import shutil
import sys

HERE = pathlib.Path(__file__).parent
WEF = pathlib.Path.home() / "Library/Containers/com.microsoft.Powerpoint/Data/Documents/wef"

args = [a for a in sys.argv[1:] if not a.startswith("--")]
if len(args) != 1 or not args[0].startswith("https://"):
    sys.exit(__doc__)

base = args[0].rstrip("/")
xml = (HERE / "manifest.template.xml").read_text(encoding="utf-8").replace("{{BASE_URL}}", base)
out = HERE / "manifest.xml"
out.write_text(xml, encoding="utf-8")
print(f"作成: {out}")

if "--install" in sys.argv:
    WEF.mkdir(parents=True, exist_ok=True)
    shutil.copy(out, WEF / "google-icons-manifest.xml")
    print(f"配置: {WEF / 'google-icons-manifest.xml'}（PowerPoint を再起動してください）")
