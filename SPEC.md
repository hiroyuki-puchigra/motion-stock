# Puchigraphics Motion Stock 仕様書

## 1. 目的

Webサイト制作時に、クライアントへ「動き」を提案するための社内向けアニメーションストックサイト。
他サイトで見つけた気になる動きを、Claude Codeで再現実装して随時追加していく。

- 主な利用者：社内メンバー（ディレクター・デザイナー・コーダー）、提案先クライアント
- 主な利用場面：提案打合せでの画面共有、提案リストURLの共有、実装時のコード参照
- 参考：TANE-be Animation Stock（https://tane-be.co.jp/animation/）

## 2. 技術構成

| 項目 | 採用 |
|---|---|
| フレームワーク | Astro（静的サイト生成） |
| データ管理 | Astro Content Collections（JSON + zodスキーマで型検証） |
| スタイル | 素のCSS（CSSカスタムプロパティでデザイントークン管理） |
| アニメーション | CSS / GSAP（ScrollTrigger等）/ 必要に応じてSVG・Canvas・Three.js |
| プレビュー動画生成 | Playwright（デモを自動録画しwebm/mp4とポスター画像を出力） |
| リポジトリ | GitHub |
| ホスティング | Cloudflare Pages（mainへのpushで自動デプロイ） |
| 認証 | Cloudflare Access |

DB・CMS・管理画面は持たない。追加・更新はすべてClaude Code経由でファイルを編集し、pushする。

## 3. アクセス制御

| パス | 閲覧できる人 | Accessポリシー |
|---|---|---|
| `/*`（一覧・詳細・デモ・提案） | 社内 + 登録クライアント | 社内ドメインのメール + 許可リストのメール（ワンタイムPIN） |
| `/internal/*`（コード表示） | 社内のみ | 社内ドメインのメールのみ |

- 全ページ `noindex, nofollow`、`robots.txt` で全拒否
- コード表示は `/internal/code/[id]/` に分離し、Accessで保護する
- 注意：デモ自体はブラウザで動くため、開発者ツールからコードは閲覧可能。`/internal` の分離は「見せ方の区別」であり、厳密な秘匿ではない
- 【未決】未登録クライアントにURLだけで見せたい場合は、`/p/*` と `/demos/*` をAccessのBypass対象にする案を検討

## 4. 分類（タクソノミー）

分類は `src/data/taxonomy.ts` で一元管理する。表示名とスラッグを持たせる。

### 部品（part）※必須・1つ

| slug | 表示名 | 含むもの |
|---|---|---|
| `mv` | MV・ファーストビュー | メインビジュアル演出、キャッチコピーの登場 |
| `text` | テキスト表示 | 見出し・本文の出現、1文字ずつ、マーキー |
| `photo` | 写真表示 | マスク、ズーム、パララックス、画像切り替え |
| `content` | コンテンツ表示 | カード・リスト・セクションの出現、カウントアップ |
| `button` | ボタン・リンク | ホバー、クリック、矢印 |
| `nav` | ナビゲーション | ヘッダー、ハンバーガー、メニュー開閉 |
| `slider` | スライダー・ギャラリー | カルーセル、施工事例一覧 |
| `loading` | ローディング・遷移 | 読み込み画面、ページ切り替え |
| `decoration` | 装飾・アクセント | 背景、ライン、マウスストーカー |

### きっかけ（trigger）※必須・複数可

| slug | 表示名 |
|---|---|
| `load` | 読み込み時 |
| `scroll-in` | スクロールで出現 |
| `scroll-scrub` | スクロール連動 |
| `hover` | ホバー |
| `click` | クリック・タップ |
| `loop` | 常時ループ |

### 印象（mood）※必須・1〜3個

| slug | 表示名 |
|---|---|
| `natural` | ナチュラル |
| `premium` | 上質・高級感 |
| `warm` | やさしい・あたたかい |
| `minimal` | シンプル・ミニマル |
| `dynamic` | 力強い・ダイナミック |
| `pop` | ポップ・楽しい |
| `tech` | 先進的 |

### 補助情報

- `tech`（技術）：`css` / `gsap` / `scrolltrigger` / `svg` / `canvas` / `threejs` / `lottie` / `js` など（自由追加可、taxonomy.tsに登録）
- `cost`（工数目安）：`S`（〜1時間）/ `M`（半日程度）/ `L`（1日以上）
- `weight`（負荷）：`light` / `medium` / `heavy`
- `sp`（スマホ対応）：`ok` / `limited`（簡易版で代替）/ `pc-only`

## 5. データ構造

### アニメーション：`src/content/animations/[id].json`

`id` は `{part}-{3桁連番}`（例：`photo-001`）。

```json
{
  "id": "photo-001",
  "title": "写真がマスクで広がる",
  "summary": "スクロールに合わせて、中央から写真が矩形マスクで広がる",
  "part": "photo",
  "trigger": ["scroll-in"],
  "mood": ["premium", "natural"],
  "tech": ["gsap", "scrolltrigger", "clip-path"],
  "cost": "M",
  "weight": "light",
  "sp": "ok",
  "useCases": ["施工事例のメイン写真", "会社概要の代表写真"],
  "proposalNote": "写真の質を引き立てたい高価格帯の住宅サイト向け",
  "reference": {
    "url": "https://example.com/",
    "note": "トップページ中盤の施工写真"
  },
  "addedAt": "2026-11-06",
  "addedBy": "hiro"
}
```

- `useCases`・`proposalNote` はクライアントにも表示する（提案用の言葉で書く）
- `reference` は社内のみ表示（`/internal` 側でのみ出力）

### デモ本体：`public/demos/[id]/`

```
public/demos/photo-001/
├ index.html     単体で動くデモ（外部依存はCDNの固定バージョンのみ）
├ style.css
├ main.js
├ preview.webm   一覧用ループ動画（自動生成）
├ preview.mp4    Safari用（自動生成）
└ poster.jpg     動画読み込み前の静止画（自動生成）
```

- 画像はダミー素材（Unsplash等のライセンス確認済み素材、または生成画像）を `public/demos/_assets/` に共通配置
- デモはURLパラメータ `?bg=light|dark` で背景を切り替えられるようにする

### 提案リスト：`src/content/proposals/[slug].json`

`slug` は `{案件名}-{ランダム6文字}`（例：`ichikawa-k7f3qa`）。推測されにくくする。

```json
{
  "slug": "ichikawa-k7f3qa",
  "title": "市川工務店様 サイトリニューアル 動きのご提案",
  "client": "市川工務店",
  "createdAt": "2026-11-06",
  "intro": "上質さとあたたかみを両立する動きを中心に選びました。",
  "items": [
    { "id": "mv-002", "place": "トップMV", "comment": "写真が順番に切り替わり、ブランドの世界観を伝えます" },
    { "id": "photo-001", "place": "施工事例", "comment": "" }
  ]
}
```

## 6. ページ構成

| パス | ページ | 内容 |
|---|---|---|
| `/` | 一覧 | 絞り込み（部品・きっかけ・印象）、キーワード検索、件数表示、カードグリッド |
| `/a/[id]/` | 詳細 | デモ表示、概要、使いどころ、印象・工数・負荷・SP対応、関連アニメーション |
| `/p/[slug]/` | 提案リスト | 表紙（タイトル・イントロ）、提案項目を順に表示、各デモとコメント |
| `/present/[id]/` | プレゼン表示 | デモを全画面で表示、UIは最小限（戻る・リプレイ・背景切替） |
| `/internal/code/[id]/` | コード表示 | HTML/CSS/JSをタブで表示しコピー、参考元URL、技術メモ |
| `/internal/` | 社内トップ | 全件一覧（参考元URL付き）、提案リスト一覧 |

### 一覧ページ

- カードは `preview.webm` をミュート・ループで自動再生（画面外は一時停止、`prefers-reduced-motion` 時は poster のみ）
- 絞り込みはクライアントサイドで即時反映、状態をURLクエリに保持（`?part=photo&mood=premium`）
- カード表示：タイトル、部品、印象タグ、工数

### 詳細ページ

- デモは iframe で表示
- デモ操作：リプレイ / 背景切替（白・黒）/ 表示幅切替（PC・SP幅 375px）/ プレゼン表示へ
- 社内ユーザー向けに「コードを見る」リンク（`/internal/code/[id]/`）。クライアントがクリックしてもAccessで弾かれる
- お気に入り（localStorage）：社内メンバーが提案候補を一時的に集めるためのもの。一覧から「候補リスト」として表示し、IDをコピーしてClaude Codeでの提案リスト作成に使う

## 7. デザイン方針（トンマナ）

**A. ニュートラル・ギャラリー型**：サイト自体は控えめにし、動きを主役にする。

- ベース：白〜薄いグレー（#FFFFFF / #F5F5F3）、文字は墨色（#1A1A1A）
- アクセントカラー：1色のみ（絞り込みのアクティブ状態、リンク等）※色は後日決定、仮に落ち着いた緑系
- 余白を多めに取り、カードは角丸小・影なし・細い罫線
- フォント：和文 Noto Sans JP、欧文 Inter（Google Fonts）、見出しは欧文主体で静かに
- サイト側のUIアニメーションは最小限（フェード・色変化程度）。デモの動きと競合させない
- ダークモード：サイトUIは対応、デモ背景は個別に切替可能
- レスポンシブ対応（打合せではPC、クライアントの確認はスマホも想定）

## 8. 運用フロー

### アニメーション追加

Claude Codeのカスタムコマンド `/add-animation` を使う（`.claude/commands/add-animation.md`）。

```
/add-animation https://参考サイトURL 「MVの写真がマスクで広がる動き」
```

1. 参考URLと説明から動きを把握する
2. コードを流用せず、デモを再現実装する
3. 分類（部品・きっかけ・印象・工数等）を提案し、ユーザーの確認を得る
4. meta JSON を作成し、スキーマ検証を通す
5. Playwrightでプレビュー動画・ポスターを生成する
6. ローカルで表示確認後、commit・push

### 提案リスト作成

カスタムコマンド `/new-proposal` を使う（`.claude/commands/new-proposal.md`）。

```
/new-proposal 市川工務店 リニューアル。上質＋あたたかみ。MV・写真表示・テキスト表示から5つ
```

## 9. 初回リリース（MVP）範囲

- [ ] Astroプロジェクト初期構築、taxonomy・スキーマ定義
- [ ] 一覧ページ（絞り込み・検索・動画サムネイル）
- [ ] 詳細ページ（デモ操作UI・関連アニメーション）
- [ ] プレゼン表示
- [ ] 提案リストページ
- [ ] `/internal` コード表示・社内トップ
- [ ] プレビュー動画自動生成スクリプト
- [ ] カスタムコマンド2種
- [ ] 初期サンプル：9部品 × 1〜2件（計10〜15件）
- [ ] Cloudflare Pages・Access設定手順書（`docs/deploy.md`）

### 次フェーズ候補

- 提案リストのPDF書き出し（打合せ資料用）
- 提案リストへのクライアントからの「いいね」フィードバック
- 実案件での採用実績の記録（どの案件で使ったか）

## 10. 未決事項

- アクセントカラーの決定
- 未登録クライアントへの共有方式（全面Access か、`/p/` と `/demos/` をBypassか）
- 社内メールドメイン・クライアント許可リストの管理方法
- ドメイン（例：`motion.puchigraphics.com`）
