import { defineConfig } from 'astro/config';

// 開発サーバーで /demos/xxx/ を index.html に解決する（本番の静的ホスティングと同じ挙動にする）
const demoIndex = {
  name: 'demo-index',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const [path, query = ''] = (req.url || '').split('?');
      if (path.startsWith('/demos/') && path.endsWith('/')) req.url = `${path}index.html${query ? '?' + query : ''}`;
      next();
    });
  },
};

export default defineConfig({ output: 'static', trailingSlash: 'always', vite: { plugins: [demoIndex] } });
