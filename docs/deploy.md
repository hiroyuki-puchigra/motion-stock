# デプロイ手順書（Cloudflare Pages + Access）

SPEC.md「3. アクセス制御」「2. 技術構成」に沿った手順。`main` への push で自動デプロイし、全ページを Cloudflare Access で保護する。

> 管理画面の表示名は Cloudflare 側の更新で変わることがある。名称が違う場合は近い項目を探すこと。

## 0. 先に決めておくこと（SPEC.md「未決事項」）

| 項目 | 決める内容 | 手順への影響 |
|---|---|---|
| 社内メールドメイン | 例：`puchigraphics.com` | 手順3のポリシーで使う |
| クライアント許可リスト | 閲覧を許可するクライアントのメールアドレス | 手順3で登録。増減のたびに更新が必要 |
| 独自ドメイン | 例：`motion.puchigraphics.com`。決まるまでは `*.pages.dev` で進めてよい | 手順2。ドメイン確定後に Access の対象も差し替える |
| 未登録クライアントへの共有方式 | 全面 Access か、`/p/*` と `/demos/*` を Bypass にするか | 手順4 |

## 1. Cloudflare Pages にプロジェクトを作る

1. Cloudflare ダッシュボード → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. GitHub と連携し、リポジトリ `hiroyuki-puchigra/motion-stock` を選ぶ
3. ビルド設定

   | 項目 | 値 |
   |---|---|
   | Production branch | `main` |
   | Framework preset | Astro |
   | Build command | `npm run build` |
   | Build output directory | `dist` |

4. **Environment variables**（Production / Preview 両方）に `NODE_VERSION` = `22` を追加する（ローカルの `.nvmrc` と揃える）
5. **Save and Deploy**。初回ビルドが通り、`https://<プロジェクト名>.pages.dev/` で表示できることを確認する

### ビルドが失敗したら

- Node のバージョン：環境変数 `NODE_VERSION` が `22` になっているか
- `npm run build` がローカルで通るか（先に `npm run validate` も通す）
- ビルドログの先頭付近でエラーが出ていないか

### 補足

- 動画・ポスター（`public/demos/*/preview.*`, `poster.jpg`）はリポジトリにコミットして配信する。Cloudflare 側で録画はしない
- 開発用の依存（Playwright・ffmpeg-static）もビルド時にインストールされるが、ビルド自体には使わない。インストールが遅い場合は、ビルド環境変数 `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` = `1` を追加する

## 2. 独自ドメインを設定する（任意・ドメイン確定後）

1. Pages プロジェクト → **Custom domains** → **Set up a custom domain**
2. `motion.puchigraphics.com` などを入力する
3. DNS が Cloudflare 管理ならそのまま自動設定される。外部 DNS の場合は、表示される CNAME を設定する
4. 証明書の発行が終わると、`https://` でアクセスできる

## 3. Cloudflare Access で保護する

1. ダッシュボード → **Zero Trust**（初回はチーム名の設定とプラン選択。小規模ならFreeプランで足りるが、利用人数の上限は最新の料金表で確認すること）
2. **Settings → Authentication → Login methods** で **One-time PIN** が有効なことを確認する（デフォルトで有効）
3. **Access → Applications → Add an application → Self-hosted** で、次の **2つ** を作る。

### 3-1. サイト全体（社内 + 登録クライアント）

| 項目 | 値 |
|---|---|
| Application name | `Motion Stock` |
| Application domain | `motion.puchigraphics.com`（Path は空 = 全体） |
| Session duration | 24 hours 程度 |

Policy：

| 項目 | 値 |
|---|---|
| Policy name | `Staff and clients` |
| Action | Allow |
| Include | **Emails ending in** `@puchigraphics.com` |
| Include（追加） | **Emails**：許可するクライアントのメールアドレスを列挙 |

### 3-2. 社内専用（`/internal/*`）

| 項目 | 値 |
|---|---|
| Application name | `Motion Stock Internal` |
| Application domain | `motion.puchigraphics.com` / Path `internal/*` |

Policy：

| 項目 | 値 |
|---|---|
| Policy name | `Staff only` |
| Action | Allow |
| Include | **Emails ending in** `@puchigraphics.com` のみ |

> パスが具体的な Application が優先される。`/internal/*` はクライアントのメールでは入れない。

### 3-3. `*.pages.dev` も必ず保護する

独自ドメインだけ保護しても、`<プロジェクト名>.pages.dev` と各ブランチのプレビュー URL は **公開のまま残る**。次のどちらかで塞ぐ。

- Pages プロジェクト → **Settings → General → Access policy** → **Enable access policy**（`*.pages.dev` のプレビューを Access で保護する。作成される Application のポリシーは、3-1 と同じ内容に直す）
- または 3-1 と 3-2 と同じ設定で、`<プロジェクト名>.pages.dev` を対象とする Application を追加する

独自ドメインを使わない間は、`pages.dev` のドメインに対して 3-1・3-2 を設定する。

## 4. 未登録クライアントへURLだけで見せたい場合（未決・任意）

SPEC.md の案：`/p/*` と `/demos/*` を **Bypass** にする。

1. **Access → Applications → Add an application → Self-hosted**
2. Application domain：`motion.puchigraphics.com` / Path `p/*`（`demos/*` も同様に追加）
3. Policy の Action を **Bypass**、Include を **Everyone** にする

注意点：

- Bypass にした範囲は、**URLを知っている人なら誰でも見られる**。提案リストの slug は推測されにくい文字列にしているが、URLが転送されれば誰でも見られる
- 提案リストが読み込む `/demos/*` も Bypass にしないと、クライアントの画面でデモが表示されない
- `/p/*` のページ内の「全画面で見る」リンク先は `/present/*` で、これは Access 保護のままなので、Bypass の対象に `present/*` を含めるかも合わせて決める
- デモのコードは、開発者ツールから誰でも読める。`/internal/*` の分離は見せ方の区別であって、厳密な秘匿ではない（SPEC.md 参照）
- 運用で都度ブロックしたくなった場合は、Bypass をやめて 3-1 の許可リストに追加する方式に戻せる

## 5. 動作確認チェックリスト

デプロイ後、**シークレットウィンドウ**で確認する。

- [ ] `https://motion.puchigraphics.com/` を開くと、Cloudflare Access のログイン画面が出る
- [ ] 社内ドメインのメールで PIN が届き、ログインできる
- [ ] 一覧・詳細・デモ・プレゼン・提案リストが表示され、デモの動画サムネイルが再生される
- [ ] 社内ドメインのメールで `/internal/` と `/internal/code/photo-001/` が開ける
- [ ] **クライアント許可リストのメール**でログインし、`/internal/` が **拒否される**
- [ ] 許可リストにないメールでは、PIN が届かない（またはログインできない）
- [ ] `https://<プロジェクト名>.pages.dev/` も Access のログイン画面になる（公開のままではない）
- [ ] `https://motion.puchigraphics.com/robots.txt` が全拒否になっている（Access の認証前は、ログイン画面にリダイレクトされる場合がある）
- [ ] ページのソースに `noindex, nofollow` が入っている
- [ ] スマホ（実機）でも一覧・詳細・デモが崩れない
- [ ] Safari で一覧の動画サムネイルが再生される（`preview.mp4`）

## 6. 日常の運用

### 更新のデプロイ

`/add-animation` や `/new-proposal` の最後で `main` に push すると、自動でビルド・デプロイされる。デプロイ状況は Pages プロジェクトの **Deployments** で確認できる。

### クライアントの追加・削除

Zero Trust → **Access → Applications** → `Motion Stock` → **Policies** で、許可リストのメールアドレスを増減する。

### 案件終了後のアクセス停止

許可リストから該当メールアドレスを削除する。提案リストのJSONを残すかどうかは別途判断する。

### ロールバック

Pages プロジェクト → **Deployments** → 戻したいデプロイの **Rollback**。

## 7. 設定を決めたら更新すること

- 本書の `motion.puchigraphics.com` と `@puchigraphics.com` を、実際の値に置き換える
- SPEC.md「10. 未決事項」の該当項目を更新する（ドメイン、共有方式、許可リストの管理方法）
