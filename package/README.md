# ya-invisible-captcha-client

Лёгкий TypeScript-клиент для невидимой [Yandex SmartCaptcha](https://yandex.cloud/ru/services/smartcaptcha):
автоматически загружает скрипт капчи, рендерит invisible-widget, возвращает токен в callback и умеет
подключаться к обычным HTML-формам через `data-*` атрибуты.

## Возможности

- invisible captcha по умолчанию;
- автоинициализация форм через `data-ya-captcha-form`;
- ручной контроль через `execute()`, `reset()` и `destroy()`;
- ESM, CommonJS, UMD/CDN и TypeScript-типы;
- поддержка `test`, `webview`, `shieldPosition`, `hideShield` и языков Yandex SmartCaptcha;
- примеры для Vanilla, Vite, React, Next.js, Vue, Nuxt, Svelte, Astro, Angular, Solid, Alpine.js и Web Components.

## Установка

```bash
npm install ya-invisible-captcha-client
```

```ts
import YaInvisibleCaptcha from 'ya-invisible-captcha-client';
```

Для CDN/UMD:

```html
<script src="https://unpkg.com/ya-invisible-captcha-client@latest/ya-invisible-captcha-client.umd.js"></script>
```

## Быстрый старт: автоматическая форма

```html
<form action="/api/contact" method="post" data-ya-captcha-form>
	<input name="email" type="email" required />
	<button type="submit">Отправить</button>
</form>

<script type="module">
	import YaInvisibleCaptcha from 'ya-invisible-captcha-client';

	YaInvisibleCaptcha.autoInit({
		sitekey: 'YANDEX_SMARTCAPTCHA_SITEKEY',
		tokenFieldName: 'smart-token',
		lang: 'ru',
	});
</script>
```

При первом submit пакет:

1. создаст hidden input, если его нет;
2. выполнит invisible captcha;
3. положит токен в hidden input;
4. отправит форму повторно через native `form.submit()`.

## Быстрый старт: ручной контроль

```ts
import YaInvisibleCaptcha from 'ya-invisible-captcha-client';

const form = document.querySelector<HTMLFormElement>('#contact-form');
const tokenInput = document.querySelector<HTMLInputElement>('[name="smart-token"]');

const captcha = new YaInvisibleCaptcha({
	sitekey: 'YANDEX_SMARTCAPTCHA_SITEKEY',
	lang: 'ru',
	callback: token => {
		if (!form || !tokenInput) return;
		tokenInput.value = token;
		form.submit();
	},
});

form?.addEventListener('submit', event => {
	event.preventDefault();
	captcha.execute();
});
```

## API

### `new YaInvisibleCaptcha(config)`

Создаёт invisible captcha widget и автоматически загружает Yandex SmartCaptcha script, если `window.smartCaptcha` ещё нет.

```ts
import YaInvisibleCaptcha, { type YaCaptchaConfig } from 'ya-invisible-captcha-client';

const config: YaCaptchaConfig = {
	sitekey: 'YANDEX_SMARTCAPTCHA_SITEKEY',
	callback: token => console.log(token),
	container: 'captcha-container',
	invisible: true,
	lang: 'ru',
	test: false,
	webview: false,
	shieldPosition: 'bottom-right',
	hideShield: false,
};

const captcha = new YaInvisibleCaptcha(config);
```

### Методы инстанса

| Метод | Что делает |
| --- | --- |
| `execute()` | Запускает проверку. Если валидный токен уже получен и ещё не сброшен, повторно отдаёт cached token в `callback`. |
| `reset()` | Очищает cached token и вызывает `smartCaptcha.reset(widgetId)`. Используйте после отправки токена на backend. |
| `destroy()` | Удаляет автоматически созданный hidden container и очищает внутренний `widgetId`. |

### `YaInvisibleCaptcha.autoInit(config)`

Подключает captcha ко всем формам `form[data-ya-captcha-form]`.

```ts
import YaInvisibleCaptcha, { type YaCaptchaAutoInitConfig } from 'ya-invisible-captcha-client';

const config: YaCaptchaAutoInitConfig = {
	sitekey: 'YANDEX_SMARTCAPTCHA_SITEKEY',
	tokenFieldName: 'smart-token',
	lang: 'ru',
	test: false,
};

YaInvisibleCaptcha.autoInit(config);
```

## Конфигурация

| Поле | Тип | По умолчанию | Описание |
| --- | --- | --- | --- |
| `sitekey` | `string` | — | Ключ сайта из Yandex Cloud. |
| `callback` | `(token: string) => void` | — | Только для ручного режима. Получает token. |
| `container` | `string \| HTMLElement` | auto hidden div | Контейнер widget. Для invisible mode можно не задавать. |
| `invisible` | `boolean` | `true` | Режим invisible captcha. |
| `debug` | `boolean` | `false` | Логи диагностики. |
| `lang` | `'ru' \| 'en' \| 'be' \| 'kk' \| 'tt' \| 'uk' \| 'uz' \| 'tr'` | `'ru'` | Язык widget. |
| `test` | `boolean` | `false` | Тестовый режим Yandex SmartCaptcha. |
| `webview` | `boolean` | `false` | Режим WebView. |
| `shieldPosition` | `top-left` / `center-left` / `bottom-left` / `top-right` / `center-right` / `bottom-right` | Yandex default | Положение блока обработки данных. |
| `hideShield` | `boolean` | `false` | Скрыть shield block, если это разрешено настройками Yandex. |
| `tokenFieldName` | `string` | `'token'` | Только для `autoInit`: name hidden input. |

## Примеры для современных инструментов

См. [docs/EXAMPLES.md](https://github.com/Poliklot/ya-invisible-captcha-client/blob/master/docs/EXAMPLES.md):

- Vanilla ESM и CDN/UMD;
- Vite;
- React;
- Next.js App Router;
- Vue 3;
- Nuxt 3;
- Svelte / SvelteKit;
- Astro;
- Angular;
- Solid;
- Alpine.js;
- Web Components.

Готовые snippets лежат в [`examples/`](https://github.com/Poliklot/ya-invisible-captcha-client/tree/master/examples).

## Backend-проверка токена

Frontend только получает token. Проверять token нужно на backend через Yandex SmartCaptcha API, до выполнения
защищённого действия.

Общий поток:

1. frontend получает token;
2. frontend отправляет token вместе с формой/API-запросом;
3. backend валидирует token в Yandex;
4. backend выполняет действие только при успешной проверке.

## Разработка

```bash
npm install
npm test
npm run check
npm run build
npm run demos
```

`npm run check` запускает unit-тесты, сборку, подготовку `package/` и `npm pack --dry-run`.

## Лицензия

MIT
