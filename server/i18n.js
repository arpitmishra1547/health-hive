// Backend i18n bootstrap (for future API responses)
// Can be used in custom Express server OR per-route in Next.js APIs.

const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const middleware = require('i18next-http-middleware');
const path = require('path');

if (!i18next.isInitialized) {
  i18next
    .use(Backend)
    .use(middleware.LanguageDetector)
    .init({
      fallbackLng: 'en',
      supportedLngs: ['en', 'hi'],
      backend: {
        loadPath: path.join(__dirname, 'locales/{{lng}}.json')
      },
      detection: {
        order: ['header', 'querystring', 'cookie'],
        caches: false
      }
    });
}

module.exports = { i18next, middleware };


