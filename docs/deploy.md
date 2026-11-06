# デプロイ手順書（Cloudflare Pages + Access）

SPEC.md「3. アクセス制御」「2. 技術構成」に沿った手順。`main` への push で自動デプロイし、全ページを Cloudflare Access で保護する。

**方針：まず `<プロジェクト名>.pages.dev` で運用する。独自ドメインは使わない。**
理由：ドメイン `puchigraphics.com` は Value-Domain の DNS で管理しており、Cloudflare Access は「Cloudflare のゾーンになっているドメイン」に対して設定する仕組みのため、Value-Domain の DNS のままではサブドメインに Access をかけられない可能性が高い（Pages 側の CNAME 設定だけなら可能）。詳しくは「付録：独自ドメインについて」を参照。

> 管理画面の表示名は Cloudflare 側の更新で変わることがある。名称が違う場合は近い項目を探すこと。本書で「要確認」と書いた箇所は、公式資料で確認できていない部分。実際の画面で確かめること。

## 0. 先に決めておくこと（SPEC.md「未決事項」）

| 項目 | 決める内容 | 手順への影響 |
|---|---|---|
| 社内メールドメイン | 例：`puchigraphics.com` | 手順3のポリシーで使う |
| クライアント許可リスト | 閲覧を許可するクライアントのメールアドレス | 手順3で登録。増減のたびに更新が必要。**手順5の確認が終わるまでは登録しない** |
| 未登録クライアントへの共有方式 | 全面 Access か、`/p/*` と `/demos/*` を Bypass にするか | 手順4 |

独自ドメインは当面使わないので、決める必要はない。

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
6. この時点では **誰でも見られる状態**。手順3が終わるまで、URL を他の人に共有しない

### ビルドが失敗したら

- Node のバージョン：環境変数 `NODE_VERSION` が `22` になっているか
- `npm run build` がローカルで通るか（先に `npm run validate` も通す）
- ビルドログの先頭付近でエラーが出ていないか

### 補足

- 動画・ポスター（`public/demos/*/preview.*`, `poster.jpg`）はリポジトリにコミットして配信する。Cloudflare 側で録画はしない
- 開発用の依存（Playwright・ffmpeg-static）もビルド時にインストールされるが、ビルド自体には使わない。インストールが遅い場合は、ビルド環境変数 `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` = `1` を追加する

## 2. （欠番）独自ドメインの設定

当面行わない。将来使う場合は「付録」を参照。

## 3. Cloudflare Access で保護する

1. ダッシュボード → **Zero Trust**（初回はチーム名の設定とプラン選択。小規模ならFreeプランで足りるが、利用人数の上限は最新の料金表で確認すること）
2. **Settings → Authentication → Login methods** で **One-time PIN** が有効なことを確認する（デフォルトで有効）

### 3-1. サイト全体（社内 + 登録クライアント）

Pages プロジェクト → **Settings → General → Access policy** → **Enable access policy** を押す。
`<プロジェクト名>.pages.dev` と、ブランチごとのプレビュー URL（`*.<プロジェクト名>.pages.dev`）を保護する Access Application が自動で作られる。

作成された Application を **Zero Trust → Access → Applications** で開き、ポリシーを次のように直す。

| 項目 | 値 |
|---|---|
| Policy name | `Staff and clients` |
| Action | Allow |
| Include | **Emails ending in** `@puchigraphics.com` |
| Include（追加・**手順5の確認後に登録**） | **Emails**：許可するクライアントのメールアドレスを列挙 |
| Session duration | 24 hours 程度 |

> 自動作成されるポリシーは、既定では広めの条件になっていることがある。必ず上の内容に直し、**「Everyone」や広すぎる条件が残っていないか**確認すること。

### 3-2. 社内専用（`/internal/*`）

同じく **Access → Applications → Add an application → Self-hosted** で追加する。

| 項目 | 値 |
|---|---|
| Application name | `Motion Stock Internal` |
| Application domain | `<プロジェクト名>.pages.dev` / Path `internal/*` |

Policy：

| 項目 | 値 |
|---|---|
| Policy name | `Staff only` |
| Action | Allow |
| Include | **Emails ending in** `@puchigraphics.com` のみ |

> パスが具体的な Application が優先される。`/internal/*` は、クライアントのメールでは入れない。
>
> **要確認**：`pages.dev` はこちらのゾーンではないため、自分のアカウントで `<プロジェクト名>.pages.dev` を対象とする Application を追加できるかを、公式資料では確認できていない。追加できない場合は、次の **フォールバック** で運用する。

**フォールバック（3-2 が作れない場合）**
- クライアント許可リストを **登録しない**（社内メンバーだけが見られる状態にする）
- クライアントには、社内メンバーが画面共有で見せる、または PDF・動画で共有する
- クライアントに直接見せたくなったら、「付録」の B・C 案（ドメインを Cloudflare のゾーンにする）を検討する

## 4. 未登録クライアントへURLだけで見せたい場合（未決・任意）

SPEC.md の案：`/p/*` と `/demos/*` を **Bypass** にする。ただし、`pages.dev` のホスト名に対してパス単位の Bypass を作れるかは、3-2 と同じ理由で要確認。作れない場合は、この案は使えない。

作れる場合の手順：

1. **Access → Applications → Add an application → Self-hosted**
2. Application domain：`<プロジェクト名>.pages.dev` / Path `p/*`（`demos/*` も同様に追加）
3. Policy の Action を **Bypass**、Include を **Everyone** にする

注意点：

- Bypass にした範囲は、**URLを知っている人なら誰でも見られる**。提案リストの slug は推測されにくい文字列にしているが、URLが転送されれば誰でも見られる
- 提案リストが読み込む `/demos/*` も Bypass にしないと、クライアントの画面でデモが表示されない
- `/p/*` のページ内の「全画面で見る」リンク先は `/present/*` で、これは Access 保護のままなので、Bypass の対象に `present/*` を含めるかも合わせて決める
- デモのコードは、開発者ツールから誰でも読める。`/internal/*` の分離は見せ方の区別であって、厳密な秘匿ではない（SPEC.md 参照）
- 運用で都度ブロックしたくなった場合は、Bypass をやめて 3-1 の許可リストに追加する方式に戻せる

## 5. 動作確認チェックリスト

デプロイ後、**シークレットウィンドウ**で確認する。`https://<プロジェクト名>.pages.dev/` を使う。

- [ ] 開くと、Cloudflare Access のログイン画面が出る（**ログインなしで中身が見えたら、保護できていない。すぐに手順3をやり直す**）
- [ ] 社内ドメインのメールで PIN が届き、ログインできる
- [ ] 一覧・詳細・デモ・プレゼン・提案リストが表示され、デモの動画サムネイルが再生される
- [ ] 社内ドメインのメールで `/internal/` と `/internal/code/photo-001/` が開ける
- [ ] **社内ドメイン以外のメール**（テスト用の別アドレス）でログインを試み、PIN が届かない、またはログインできない
- [ ] 社内ドメイン以外のメールを一時的に許可リストへ入れて、`/internal/` が **拒否される**ことを確認する（3-2 が作れた場合のみ。確認後、不要なら許可リストから外す）
- [ ] ブランチのプレビュー URL（`<ブランチ名>.<プロジェクト名>.pages.dev`）も、Access のログイン画面になる
- [ ] `/robots.txt` が全拒否になっている（Access の認証前は、ログイン画面にリダイレクトされる場合がある）
- [ ] ページのソースに `noindex, nofollow` が入っている
- [ ] スマホ（実機）でも一覧・詳細・デモが崩れない
- [ ] Safari で一覧の動画サムネイルが再生される（`preview.mp4`）

**この確認がすべて通ってから**、クライアントのメールアドレスを許可リストに登録する。

## 6. 日常の運用

### 更新のデプロイ

`/add-animation` や `/new-proposal` の最後で `main` に push すると、自動でビルド・デプロイされる。デプロイ状況は Pages プロジェクトの **Deployments** で確認できる。

### クライアントの追加・削除

Zero Trust → **Access → Applications** → 3-1 で直した Application → **Policies** で、許可リストのメールアドレスを増減する。

### 案件終了後のアクセス停止

許可リストから該当メールアドレスを削除する。提案リストのJSONを残すかどうかは別途判断する。

### ロールバック

Pages プロジェクト → **Deployments** → 戻したいデプロイの **Rollback**。

## 7. 設定を決めたら更新すること

- 本書の `<プロジェクト名>` と `@puchigraphics.com` を、実際の値に置き換える
- SPEC.md「10. 未決事項」の該当項目を更新する（ドメイン、共有方式、許可リストの管理方法）

## 付録：独自ドメインについて

Value-Domain で管理している `puchigraphics.com` のサブドメイン（例：`motion.puchigraphics.com`）を使う場合の整理。

| できること | 可否 |
|---|---|
| Pages にサブドメインを設定する（Value-Domain に `CNAME`：`motion` → `<プロジェクト名>.pages.dev` を追加） | 可能。ダッシュボードで先にドメインを追加してから `CNAME` を作る（順序を逆にすると 522 エラー） |
| そのサブドメインを Cloudflare Access で保護する | **要確認（難しい可能性が高い）**。Access はアカウント内のゾーンに対して設定する仕組み。ゾーン化せずに使う「部分セットアップ（CNAME）」は Business プラン以上 |

独自ドメインにして Access で保護したい場合の選択肢：

- **B. `puchigraphics.com` を Cloudflare に移す**：ネームサーバーを Value-Domain から Cloudflare に変更する。既存サイトやメールの DNS レコードをすべて写す必要があり、漏れると既存サイトやメールが止まる恐れがある。**おすすめしない**
- **C. この用途専用の別ドメインを取る**：Cloudflare で新しいドメインを取得または移管する。既存の `puchigraphics.com` に影響しない

参考：
- Pages のカスタムドメイン：https://developers.cloudflare.com/pages/configuration/custom-domains/
- Access の公開アプリ設定：https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/
- 部分セットアップ（CNAME）：https://developers.cloudflare.com/dns/zone-setups/partial-setup/setup/
