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

## 使い方

- 検索は英語（arrow, chart, people など）。複数語は AND
- Outlined / Rounded / Sharp、塗り、太さを選んでからアイコンをクリック
- 色は右の色見本から。「＋登録」で案件の色を保存、右クリックで削除
- 「選択中と差し替え」をオンにして図形を1つ選んでおくと、その位置・大きさで入れ替える
- 挿入した図形には `gicon:<アイコン名>` という名前が付く

## 一覧の更新

Google 側でアイコンが増えたら `python3 build_index.py` を実行して push する。

## 注意

- Dropbox 内に `.git` があるため、別の Mac で同時に git 操作をしない
- アイコンのライセンスは Apache 2.0
