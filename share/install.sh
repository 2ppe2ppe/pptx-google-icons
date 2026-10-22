#!/bin/bash
# Google Icons for PowerPoint (Mac) の導入スクリプト
# このフォルダの中で実行する:  bash install.sh
# PowerPoint 専用フォルダにアドインの定義・起動用ファイル・設定を置き、
# GoogleIcons.ppam を ~/Documents/GoogleIcons/ に置く。最後の登録だけは PowerPoint の画面で行う。
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
PPT_DOCS="$HOME/Library/Containers/com.microsoft.Powerpoint/Data/Documents"
PPAM_DIR="$HOME/Documents/GoogleIcons"

for f in google-icons-manifest.xml GoogleIconsLauncher.pptx GoogleIconsLoader.txt GoogleIcons.ppam; do
  [ -f "$HERE/$f" ] || { echo "見つかりません: $f（zip を展開したフォルダで実行してください）"; exit 1; }
done

if [ ! -d "$HOME/Library/Containers/com.microsoft.Powerpoint" ]; then
  echo "PowerPoint for Mac を一度起動してから、もう一度実行してください。"
  exit 1
fi

mkdir -p "$PPT_DOCS/wef" "$PPAM_DIR"
cp "$HERE/google-icons-manifest.xml" "$PPT_DOCS/wef/google-icons-manifest.xml"
cp "$HERE/GoogleIconsLauncher.pptx" "$PPT_DOCS/GoogleIconsLauncher.pptx"
# 設定は、すでにあれば残す（各自で調整している場合があるため）
[ -f "$PPT_DOCS/GoogleIconsLoader.txt" ] || cp "$HERE/GoogleIconsLoader.txt" "$PPT_DOCS/GoogleIconsLoader.txt"
cp "$HERE/GoogleIcons.ppam" "$PPAM_DIR/GoogleIcons.ppam"

echo "配置しました:"
echo "  $PPT_DOCS/wef/google-icons-manifest.xml"
echo "  $PPT_DOCS/GoogleIconsLauncher.pptx"
echo "  $PPT_DOCS/GoogleIconsLoader.txt"
echo "  $PPAM_DIR/GoogleIcons.ppam"
echo
echo "残りは PowerPoint で1回だけ:"
echo "  1. ツール → PowerPoint アドイン → ＋ → 書類/GoogleIcons/GoogleIcons.ppam を選ぶ"
echo "  2. マクロを有効にするか聞かれたら「有効にする」→ チェックが入っていることを確認して OK"
echo "  3. PowerPoint を ⌘Q で終了して起動し、プレゼンテーションを開く"
echo "     → 起動用ファイルが数秒開いて閉じ、挿入タブに「Google Icons」が出れば完了"
