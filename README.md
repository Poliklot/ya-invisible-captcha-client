# ya-invisible-captcha-client

Лёгкий клиент для интеграции невидимой Яндекс Smart Captcha с поддержкой автоматической инициализации форм и кастомных
сценариев. Написан на TypeScript, поддерживает UMD и ESM модули, подходит для использования в браузере и с современными
фреймворками.

## Особенности

- **Невидимая капча**: Интеграция Yandex Smart Captcha с минимальным вмешательством в интерфейс.
- **Автоматическая инициализация**: Поддержка форм с атрибутом `data-ya-captcha-form` для автоматической обработки
  токенов.
- **Гибкость**: Кастомная инициализация для сложных сценариев, включая работу с библиотеками валидации форм (например,
  FormFather).
- **TypeScript**: Полная типизация для удобной разработки и автодополнения.
- **Лёгкость**: Минимальный размер бандла, оптимизированный для браузера.
- **Многоязычность**: Поддержка языков: `ru`, `en`, `be`, `kk`, `tt`, `uk`, `uz`, `tr`.
- **Отладка**: Режим debug для упрощения диагностики.

## Установка

Установите пакет через npm:

```bash
npm install ya-invisible-captcha-client
```

Или используйте CDN (UMD):

```html
<script src="https://unpkg.com/ya-invisible-captcha-client@1.0.0/dist/ya-invisible-captcha-client.umd.js"></script>
```

## Использование

### 1. Автоматическая инициализация форм

Добавьте атрибут `data-ya-captcha-form` к вашим формам и настройте капчу:

```html
<form action="/submit" data-ya-captcha-form>
	<input type="text" name="name" placeholder="Имя" required />
	<input type="hidden" name="token" data-ya-captcha-token-input />
	<button type="submit">Отправить</button>
</form>

<script src="https://unpkg.com/ya-invisible-captcha-client@1.0.0/dist/ya-invisible-captcha-client.umd.js"></script>
<script>
	window.YaInvisibleCaptcha.autoInit({
		sitekey: 'ВАШ_SITEKEY',
		lang: 'ru',
		debug: true,
		test: true,
		shieldPosition: 'bottom-right',
		hideShield: false,
	});
</script>
```

При отправке формы капча автоматически выполнится, токен будет добавлен в скрытое поле `token`, и форма отправится.

### 2. Кастомная инициализация

Для более сложных сценариев используйте класс `YaInvisibleCaptcha` напрямую:

```html
<form id="myForm" action="/submit">
	<input type="text" name="name" placeholder="Имя" required />
	<input type="hidden" name="token" id="captchaToken" />
	<button type="submit">Отправить</button>
</form>

<script src="https://unpkg.com/ya-invisible-captcha-client@1.0.0/dist/ya-invisible-captcha-client.umd.js"></script>
<script>
	const captcha = new window.YaInvisibleCaptcha({
		sitekey: 'ВАШ_SITEKEY',
		container: 'captchaToken',
		callback: token => {
			document.getElementById('captchaToken').value = token;
			document.getElementById('myForm').submit();
		},
		lang: 'ru',
		debug: true,
		test: true,
	});

	document.getElementById('myForm').addEventListener('submit', e => {
		e.preventDefault();
		captcha.execute();
	});
</script>
```

### 3. Интеграция с FormFather

Для форм с валидацией через FormFather:

```html
<form id="form1" data-form-father action="/submit">
	<div data-ya-captcha-token-input-wrapper>
		<input type="hidden" name="token" data-ya-captcha-token-input required />
	</div>
	<input type="text" name="name" placeholder="Имя" required data-validate="not-numbers" />
	<div class="error-message" data-form-father-error="name"></div>
	<button type="submit">Отправить</button>
</form>

<script src="https://unpkg.com/form-father@0.1.3/FormFather.min.js"></script>
<script src="https://unpkg.com/ya-invisible-captcha-client@1.0.0/dist/ya-invisible-captcha-client.umd.js"></script>
<script type="module">
	import FormFather from 'form-father';

	let $currentForm = null;

	FormFather.setDefaultParams({
		inputSelector: '.input, [data-ya-captcha-token-input]',
		inputWrapperSelector: '[data-ya-captcha-token-input-wrapper]',
	});

	const captcha = new window.YaInvisibleCaptcha({
		sitekey: 'ВАШ_SITEKEY',
		callback: token => {
			if ($currentForm) {
				const $tokenInput = $currentForm.querySelector('[data-ya-captcha-token-input]');
				if ($tokenInput) {
					$tokenInput.value = token;
					$currentForm.dispatchEvent(new Event('submit'));
				}
			}
		},
		lang: 'ru',
		debug: true,
		test: true,
	});

	document.querySelectorAll('[data-ya-captcha-token-input-wrapper]').forEach($inputToken => {
		$inputToken.showError = () => captcha.execute();
	});

	document.querySelectorAll('[data-form-father]').forEach(form => {
		new FormFather(form, {
			onResponseSuccess: (_, form) => {
				form.clearInputs();
				$currentForm = null;
			},
		});
	});
</script>
```

## Конфигурация

### YaCaptchaConfig

- `sitekey` (обязательный): Ключ сайта из консоли Yandex Cloud.
- `callback` (обязательный): Функция, вызываемая с токеном капчи.
- `container`: ID или DOM-элемент контейнера (опционально).
- `invisible`: Использовать невидимую капчу (по умолчанию `true`).
- `debug`: Включить отладочные сообщения (по умолчанию `false`).
- `lang`: Язык интерфейса (`ru`, `en`, `be`, `kk`, `tt`, `uk`, `uz`, `tr`, по умолчанию `ru`).
- `test`: Режим тестирования (по умолчанию `false`).
- `webview`: Запуск в WebView (по умолчанию `false`).
- `shieldPosition`: Расположение уведомления (`top-left`, `center-left`, `bottom-left`, `top-right`, `center-right`,
  `bottom-right`).
- `hideShield`: Скрыть уведомление (по умолчанию `false`).

### YaCaptchaAutoInitConfig

- `sitekey` (обязательный): Ключ сайта.
- `tokenFieldName`: Имя скрытого поля для токена (по умолчанию `token`).
- `debug`, `lang`, `test`, `webview`, `shieldPosition`, `hideShield`: Аналогично `YaCaptchaConfig`.

## Зависимости

- Яндекс Smart Captcha (загружается автоматически с `https://smartcaptcha.yandexcloud.net`).
- Для интеграции с FormFather: `form-father@0.1.3` (опционально).

## Совместимость

- Поддерживаемые браузеры: `> 0.5%`, `last 2 versions`, `not dead`, `not ie <= 11`.
- Работает с ESM и UMD модулями.

## Разработка

Для локальной разработки:

```bash
npm install
npm run build
npm run demos
```

Запустите `npm run demos` для тестирования демо-примеров.

## Поддержка

Если у вас есть вопросы или проблемы, создайте issue в
[репозитории](https://github.com/Poliklot/ya-invisible-captcha-client/issues).

## Лицензия

MIT License

!!!

- Описать методы инстанса
- Поменять весь пример и $currentForm
