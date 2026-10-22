# PowerPoint 用 Google Icons アドイン

Google の Material Symbols（約3,900種）を PowerPoint の作業ウィンドウで検索し、クリックで SVG としてスライドに挿入する。

## 構成

| ファイル | 役割 |
|---|---|
| `docs/` | GitHub Pages で公開する中身（作業ウィンドウ本体） |
| `docs/data/icons.json` | 検索用のアイコン一覧。`build_index.py` で作る |
| `manifest.template.xml` | アドインの定義。公開URLは `{{BASE_URL}}` |
| `make_manifest.py` | 公開URLを埋めた `manifest.xml` を作り、PowerPoint に読み込ませる |

## 公開の手順（初回のみ）

1. GitHub で空のリポジトリを作る（例: `pptx-google-icons`、Public）
2. このフォルダを push する
   ```
   git remote add origin https://github.com/<ユーザー名>/pptx-google-icons.git
   git push -u origin main
   ```
3. リポジトリの Settings → Pages → Branch を `main` / `/docs` にして保存
4. 数分後に `https://<ユーザー名>.github.io/pptx-google-icons/taskpane.html` が開けることを確認

## PowerPoint への読み込み（Mac）

```
python3 make_manifest.py https://<ユーザー名>.github.io/pptx-google-icons --install
```

PowerPoint を再起動し、「挿入」タブの「Google Icons」、または「ホーム」→「アドイン」から開く。

リボンに「アドイン」の入口が無い環境（会社の設定で隠れている場合）は、`Google Icons 起動用.pptx` を開くとパネルが自動で開く。作り直しは `python3 make_launcher.py`（マニフェストの Version を上げたときも再生成する）。

### 起動時に自動で読み込む（入口が無い環境向け）

会社の設定で、追加したアドインが PowerPoint 終了後に残らない。そのため、マクロ用アドイン `GoogleIcons.ppam` が起動時に起動用ファイルを数秒開いて閉じ、アドインを読み込ませる（閉じてもボタンは残る）。

- 読み込むのは `~/Library/Containers/com.microsoft.Powerpoint/Data/Documents/GoogleIconsLauncher.pptx`（起動用ファイルのコピー。PowerPoint 専用フォルダなのでアクセス確認が出ない）
- 登録済みの ppam は `~/Desktop/App/GoogleIcons.ppam`（ツール → PowerPoint アドイン）。移動・削除しない
- Mac では Auto_Open が動かないため、リボンの onLoad で動かしている（ボタンは付けていない）
- 作り直し: PowerPoint で `ppam/GoogleIconsLoader.bas` を標準モジュールに貼って .pptm で保存 → PowerPoint を終了 → `python3 ppam/make_ppam.py ~/Desktop/App/GoogleIcons.pptm ~/Desktop/App/GoogleIcons.ppam`（Mac の PowerPoint は .ppam で保存できないため変換する）
- 起動用ファイルを作り直したら、上のコピーも置き換える
- 待ち時間などは同じフォルダの `GoogleIconsLoader.txt`（delay=開くまでの秒数、wait=開いておく秒数、window=1表示/0非表示、activate=1で手前に出す、close=0で閉じずに最小化）。PC再起動直後は会社のアドイン情報の取り直しで遅く、4秒では間に合わなかった
- 起動のたびの記録は同じフォルダの `GoogleIconsLoader.log`
- 起動直後のスタート画面ではファイルを開けず1回目はエラーになる（記録に error が残るが正常）。プレゼンテーションを開いたときの2回目で読み込まれる

## 他の人への配布

`python3 share/make_share.py` で `dist/GoogleIcons-PowerPoint-Mac.zip` を作って渡す（中身は install.sh・導入手順.md・マニフェスト・起動用ファイル・設定・ppam）。ppam は `~/Desktop/App/GoogleIcons.ppam` を作成者名を消して同梱する。受け取った人は install.sh を実行し、ppam を PowerPoint で登録するだけ（VBA の貼り付けは不要）。手順は `share/導入手順.md`。

## 使い方

- 検索は日本語・英語どちらでも（矢印、家、グラフ、chart など）。複数語は AND。「上矢印」のような続け書きも分けて探す
- 日本語の訳語は `ja/*.txt`（英単語 → 訳語）。足したら `python3 build_ja.py` で `docs/data/ja.json` を作り直す
- Outlined / Rounded / Sharp、塗り、太さを選んでからアイコンをクリック
- 色は右の色見本から。「＋登録」で案件の色を保存、右クリックで削除
- 「選択中と差し替え」をオンにして図形を1つ選んでおくと、その位置・大きさで入れ替える
- 挿入した図形には `gicon:<アイコン名>` という名前が付く

## 一覧の更新

Google 側でアイコンが増えたら `python3 build_index.py` を実行して push する。

## 注意

- Dropbox 内に `.git` があるため、別の Mac で同時に git 操作をしない
- アイコンのライセンスは Apache 2.0
