# CLAUDE.md — Puchigraphics Motion Stock

クライアントへの動き提案用アニメーションストックサイト。仕様は `SPEC.md` を正とする。

## 基本ルール

- 回答・コメント・コミットメッセージは日本語
- 仕様と異なる判断が必要なとき、またはより良い方法があるときは、実装前に提案して確認を取る
- 分類（taxonomy）を増やす・変える場合は必ず確認を取る

## 他サイトの動きを追加するときのルール（重要）

- 参考サイトのコード・画像・テキスト・フォントを**コピーしない**。動きの考え方だけを参考に、ゼロから再現実装する
- 参考サイトのロゴ・社名・キャッチコピーはデモに入れない
- 参考元URLは meta の `reference` に記録する（社内のみ表示）
- 画像は `public/demos/_assets/` の共通ダミー素材を使う。新規素材はライセンスを確認し、`_assets/LICENSE.md` に出典を追記する

## デモ実装ルール

- 1デモ = `public/demos/[id]/` の1フォルダ。単体の `index.html` で動くこと
- 外部ライブラリはCDNの固定バージョンのみ（`@latest` や範囲指定は禁止）
- 優先順位：CSSのみ → CSS + 少量のJS → GSAP → Canvas/Three.js。必要以上に重くしない
- `?bg=light|dark` で背景を切り替えられるようにする
- `prefers-reduced-motion: reduce` 時は動きを抑えた表示にする
- スマホ幅（375px）でも崩れないこと。難しい場合は meta の `sp` を `limited` または `pc-only` にする
- スクロール系のデモは、iframe内で動作確認できる高さを確保する
- コードは実案件に流用しやすいよう、クラス名を分かりやすく、主要な値（時間・イージング・距離）はCSS変数またはJS冒頭の定数にまとめる
- ホバー系のデモ（きっかけが `hover`）は、`index.html` の `<head>` に `<meta name="preview-hover" content=".対象セレクタ">` を置く。プレビュー動画の録画時に、その要素へカーソルを乗せて外す動作が録画される（無いと動かない動画になる）
- スクロール系のデモは、録画スクリプトが自動で下までスクロールする。ポスターはスクロール55%付近で撮るため、見せ場がその位置に来る高さ構成にする

## meta JSON のルール

- 置き場所：`src/content/animations/[id].json`
- `id` は `{part}-{3桁連番}`。既存の最大番号 + 1
- 分類値は `src/data/taxonomy.ts` に定義されたslugのみ使用
- `title` は20文字以内で、動きが想像できる言葉にする
- `summary`・`useCases`・`proposalNote` はクライアントが読む前提で、専門用語を避ける
- 保存後に `npm run validate` でスキーマ検証を通す

## サイトUIのルール

- トンマナは「ニュートラル・ギャラリー型」：動きが主役、サイトUIは控えめ
- 色・余白・フォントは `src/styles/tokens.css` のCSS変数のみを使い、値を直書きしない
- サイトUIのアニメーションはフェード・色変化程度にとどめる

## よく使うコマンド

```
npm run dev        # ローカル確認
npm run validate   # meta JSON のスキーマ検証
npm run preview:record -- [id]   # プレビュー動画・ポスター生成（id省略で未生成分すべて）
npm run build
```

## カスタムコマンド

- `/add-animation` — アニメーション追加
- `/new-proposal` — 提案リスト作成
