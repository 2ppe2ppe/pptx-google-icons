"""PowerPoint で保存した .pptm（GoogleIconsLoader.bas 入り）から GoogleIcons.ppam を作る。

Mac の PowerPoint は .ppam で保存できないため、.pptm の中身の種類を書き換えて .ppam にする。
あわせてリボン定義（customUI14.xml）を埋め込む。起動時はリボンの onLoad でマクロが動き、
挿入タブには手動で読み込み直す「Icons 読込」ボタンが付く。

使い方: python3 ppam/make_ppam.py ~/Desktop/GoogleIcons.pptm ~/Desktop/GoogleIcons.ppam
"""
import pathlib
import sys
import zipfile

HERE = pathlib.Path(__file__).parent
ICON = HERE.parent / "docs" / "assets" / "icon-64.png"

PRES_TYPE = "application/vnd.ms-powerpoint.presentation.macroEnabled.main+xml"
ADDIN_TYPE = "application/vnd.ms-powerpoint.addin.macroEnabled.main+xml"
UI_REL = "http://schemas.microsoft.com/office/2007/relationships/ui/extensibility"
IMG_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"

CUSTOM_UI = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<customUI xmlns="http://schemas.microsoft.com/office/2009/07/customui" onLoad="GoogleIcons_OnRibbonLoad">
  <ribbon>
    <tabs>
      <tab idMso="TabInsert">
        <group id="GIconsLoaderGroup" label="Google Icons">
          <button id="GIconsLoad" label="Icons 読込" size="large" image="gicons"
                  screentip="Google Icons を読み込む"
                  supertip="パネルのボタンが見当たらないときに押すと、Google Icons アドインを読み込み直します。"
                  onAction="GoogleIcons_OnButton"/>
        </group>
      </tab>
    </tabs>
  </ribbon>
</customUI>
"""

UI_RELS = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="gicons" Type="{IMG_REL}" Target="images/gicons.png"/></Relationships>
"""


def main(src, dst):
    with zipfile.ZipFile(src) as z:
        names = z.namelist()
        if "ppt/vbaProject.bin" not in names:
            sys.exit("マクロが入っていません。VBA を貼り付けてから .pptm で保存してください。")
        out = {}
        for item in z.infolist():
            if item.filename.startswith("customUI/"):
                continue  # 作り直す
            out[item.filename] = z.read(item.filename)

    ct = out["[Content_Types].xml"].decode("utf-8")
    if PRES_TYPE not in ct and ADDIN_TYPE not in ct:
        sys.exit("想定外の形式です（.pptm ではない）。")
    ct = ct.replace(PRES_TYPE, ADDIN_TYPE)
    if 'Extension="png"' not in ct:
        ct = ct.replace("<Default ", '<Default Extension="png" ContentType="image/png"/><Default ', 1)
    out["[Content_Types].xml"] = ct.encode("utf-8")

    rels = out["_rels/.rels"].decode("utf-8")
    if UI_REL not in rels:
        rels = rels.replace(
            "</Relationships>",
            f'<Relationship Id="rGIconsUI" Type="{UI_REL}" Target="customUI/customUI14.xml"/></Relationships>',
        )
    out["_rels/.rels"] = rels.encode("utf-8")

    out["customUI/customUI14.xml"] = CUSTOM_UI.encode("utf-8")
    out["customUI/_rels/customUI14.xml.rels"] = UI_RELS.encode("utf-8")
    out["customUI/images/gicons.png"] = ICON.read_bytes()

    with zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED) as o:
        # [Content_Types].xml を先頭に置く
        o.writestr("[Content_Types].xml", out.pop("[Content_Types].xml"))
        for name, data in out.items():
            o.writestr(name, data)
    print(f"作成: {dst}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(*sys.argv[1:])
