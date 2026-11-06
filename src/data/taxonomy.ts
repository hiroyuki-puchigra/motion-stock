// 分類の一元管理。変更時は必ず確認を取ること（CLAUDE.md参照）
export const parts = [
  { slug: 'mv', label: 'MV・ファーストビュー' },
  { slug: 'text', label: 'テキスト表示' },
  { slug: 'photo', label: '写真表示' },
  { slug: 'content', label: 'コンテンツ表示' },
  { slug: 'button', label: 'ボタン・リンク' },
  { slug: 'nav', label: 'ナビゲーション' },
  { slug: 'slider', label: 'スライダー・ギャラリー' },
  { slug: 'loading', label: 'ローディング・遷移' },
  { slug: 'decoration', label: '装飾・アクセント' },
] as const;

export const triggers = [
  { slug: 'load', label: '読み込み時' },
  { slug: 'scroll-in', label: 'スクロールで出現' },
  { slug: 'scroll-scrub', label: 'スクロール連動' },
  { slug: 'hover', label: 'ホバー' },
  { slug: 'click', label: 'クリック・タップ' },
  { slug: 'loop', label: '常時ループ' },
] as const;

export const moods = [
  { slug: 'natural', label: 'ナチュラル' },
  { slug: 'premium', label: '上質・高級感' },
  { slug: 'warm', label: 'やさしい・あたたかい' },
  { slug: 'minimal', label: 'シンプル・ミニマル' },
  { slug: 'dynamic', label: '力強い・ダイナミック' },
  { slug: 'pop', label: 'ポップ・楽しい' },
  { slug: 'tech', label: '先進的' },
] as const;

export const techs = ['css', 'gsap', 'scrolltrigger', 'svg', 'canvas', 'threejs', 'lottie', 'js', 'clip-path'] as const;

export const costs = [
  { slug: 'S', label: 'S（〜1時間）' },
  { slug: 'M', label: 'M（半日程度）' },
  { slug: 'L', label: 'L（1日以上）' },
] as const;

export const weights = [
  { slug: 'light', label: '軽い' },
  { slug: 'medium', label: '標準' },
  { slug: 'heavy', label: '重い' },
] as const;

export const sps = [
  { slug: 'ok', label: 'スマホ対応' },
  { slug: 'limited', label: 'スマホは簡易版' },
  { slug: 'pc-only', label: 'PCのみ' },
] as const;

export const slugs = <T extends readonly { slug: string }[]>(list: T) =>
  list.map((x) => x.slug) as unknown as [T[number]['slug'], ...T[number]['slug'][]];

export const labelOf = (list: readonly { slug: string; label: string }[], slug: string) =>
  list.find((x) => x.slug === slug)?.label ?? slug;
