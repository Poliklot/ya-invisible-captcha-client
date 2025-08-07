/**
 * Конфигурация для инициализации Yandex Smart Captcha.
 *
 * @interface
 */
interface YaCaptchaConfig {
	/** Ключ сайта, полученный в консоли Yandex Cloud. */
	sitekey: string;
	/** Функция обратного вызова, получающая токен капчи. */
	callback: (token: string) => void;
	/** Контейнер для виджета капчи: ID или DOM-элемент (опционально). */
	container?: string | HTMLElement;
	/** Использовать невидимую капчу (по умолчанию true). */
	invisible?: boolean;
	/** Включить отладочные сообщения в консоль (по умолчанию false). */
	debug?: boolean;
	/** Язык интерфейса капчи (например, 'ru', 'en'). */
	lang?: 'ru' | 'en' | 'be' | 'kk' | 'tt' | 'uk' | 'uz' | 'tr';
	/** Включить режим тестирования капчи (по умолчанию false). */
	test?: boolean;
	/** Запуск капчи в WebView (по умолчанию false). */
	webview?: boolean;
	/** Расположение блока с уведомлением об обработке данных. */
	shieldPosition?: 'top-left' | 'center-left' | 'bottom-left' | 'top-right' | 'center-right' | 'bottom-right';
	/** Скрыть блок с уведомлением об обработке данных (по умолчанию false). */
	hideShield?: boolean;
}

/**
 * Конфигурация для автоматической инициализации капчи на формах.
 *
 * @interface
 */
interface YaCaptchaAutoInitConfig {
	/** Ключ сайта, полученный в консоли Yandex Cloud. */
	sitekey: string;
	/** Имя скрытого поля для токена (по умолчанию 'token'). */
	tokenFieldName?: string;
	/** Включить отладку (по умолчанию false). */
	debug?: boolean;
	/** Язык капчи (например, 'ru', 'en'). */
	lang?: 'ru' | 'en' | 'be' | 'kk' | 'tt' | 'uk' | 'uz' | 'tr';
	/** Включить режим тестирования капчи (по умолчанию false). */
	test?: boolean;
	/** Запуск капчи в WebView (по умолчанию false). */
	webview?: boolean;
	/** Расположение блока с уведомлением об обработке данных. */
	shieldPosition?: 'top-left' | 'center-left' | 'bottom-left' | 'top-right' | 'center-right' | 'bottom-right';
	/** Скрыть блок с уведомлением об обработке данных (по умолчанию false). */
	hideShield?: boolean;
}

type SubscribeEvent =
	| 'challenge-visible'
	| 'challenge-hidden'
	| 'network-error'
	| 'javascript-error'
	| 'success'
	| 'token-expired';

/**
 * Интерфейс для объекта Yandex Smart Captcha, предоставляемого внешним скриптом.
 *
 * @interface
 */
interface SmartCaptcha {
	render: (
		container: string | HTMLElement,
		options: {
			sitekey: string;
			invisible: boolean;
			hl: string;
			callback: (token: string) => void;
			test?: boolean;
			webview?: boolean;
			shieldPosition?: 'top-left' | 'center-left' | 'bottom-left' | 'top-right' | 'center-right' | 'bottom-right';
			hideShield?: boolean;
		},
	) => number;
	execute: (widgetId: number) => void;
	reset: (widgetId: number) => void;
	getResponse: (widgetId: number) => string;
	subscribe: (widgetId: number, event: SubscribeEvent, callback: Function) => () => void;
}

/**
 * Глобальный объект window с добавленным smartCaptcha и YaInvisibleCaptcha.
 *
 * @interface
 */
interface WindowWithSmartCaptcha extends Window {
	smartCaptcha?: SmartCaptcha;
	onloadFunction?: () => void;
	YaInvisibleCaptcha?: typeof YaInvisibleCaptcha;
}

/**
 * Класс для упрощённой интеграции невидимой капчи Yandex Smart Captcha.
 *
 * @class
 */
class YaInvisibleCaptcha {
	private sitekey: string;
	private callback: (token: string) => void;
	private container: string | HTMLElement | null;
	private invisible: boolean;
	private debug: boolean;
	private lang: string;
	private test: boolean;
	private webview: boolean;
	private shieldPosition?: 'top-left' | 'center-left' | 'bottom-left' | 'top-right' | 'center-right' | 'bottom-right';
	private hideShield: boolean;
	private widgetId: number | null = null;
	private autoContainerId: string | null = null;
	private currentToken: string = '';
	private static readonly SUPPORTED_LANGS = ['ru', 'en', 'be', 'kk', 'tt', 'uk', 'uz', 'tr'];
	public static $currentForm: HTMLElement | null = null;

	/**
	 * Создаёт экземпляр капчи.
	 *
	 * @param config - Конфигурация капчи.
	 *
	 * @throws {Error} Если sitekey или callback не указаны.
	 */
	constructor(config: YaCaptchaConfig) {
		if (!config.sitekey) {
			throw new Error('sitekey обязателен');
		}
		if (!config.callback) {
			throw new Error('callback обязателен');
		}

		this.sitekey = config.sitekey;
		this.callback = config.callback;
		this.container = config.container ?? null;
		this.invisible = config.invisible !== false;
		this.debug = config.debug ?? false;
		this.lang = this.validateLang(config.lang ?? 'ru');
		this.test = config.test ?? false;
		this.webview = config.webview ?? false;
		this.shieldPosition = config.shieldPosition;
		this.hideShield = config.hideShield ?? false;

		this.loadScript()
			.then(() => {
				this.renderWidget();
			})
			.catch(error => {
				this.logError('Не удалось загрузить скрипт Yandex Smart Captcha:', error);
			});
	}

	/**
	 * Валидирует и возвращает код языка.
	 *
	 * @private
	 *
	 * @param lang - Код языка (например, 'ru', 'en').
	 *
	 * @returns Валидный код языка или 'ru' по умолчанию.
	 */
	private validateLang(lang: string): string {
		if (YaInvisibleCaptcha.SUPPORTED_LANGS.includes(lang)) {
			this.log('Язык установлен:', lang);
			return lang;
		}
		this.logError(`Язык "${lang}" не поддерживается, используется 'ru'`);
		return 'ru';
	}

	/**
	 * Выводит отладочные сообщения в консоль, если включён режим debug.
	 *
	 * @private
	 *
	 * @param args - Аргументы для вывода в консоль.
	 */
	private log(...args: unknown[]): void {
		if (this.debug) {
			console.log('[YaInvisibleCaptcha]', ...args);
		}
	}

	/**
	 * Выводит сообщения об ошибках в консоль, если включён режим debug.
	 *
	 * @private
	 *
	 * @param args - Аргументы для вывода в консоль.
	 */
	private logError(...args: unknown[]): void {
		if (this.debug) {
			console.error('[YaInvisibleCaptcha]', ...args);
		}
	}

	/**
	 * Загружает скрипт Yandex Smart Captcha асинхронно.
	 *
	 * @private
	 *
	 * @returns Промис, который разрешается при успешной загрузке скрипта.
	 */
	private loadScript(): Promise<void> {
		return new Promise((resolve, reject) => {
			const windowWithSmartCaptcha = window as WindowWithSmartCaptcha;
			if (windowWithSmartCaptcha.smartCaptcha) {
				this.log('Скрипт SmartCaptcha уже загружен');
				resolve();
				return;
			}

			const script = document.createElement('script');
			script.src = 'https://smartcaptcha.yandexcloud.net/captcha.js?render=onload&onload=onloadFunction';
			script.async = true;
			script.defer = true;
			script.onload = () => {
				this.log('Скрипт SmartCaptcha загружен');
				resolve();
			};
			script.onerror = () => {
				reject(new Error('Ошибка загрузки скрипта'));
			};
			document.head.appendChild(script);

			windowWithSmartCaptcha.onloadFunction = () => {
				this.log('onloadFunction сработал');
				resolve();
			};
		});
	}

	/**
	 * Создаёт временный контейнер для капчи, если он не указан.
	 *
	 * @private
	 *
	 * @returns ID созданного контейнера.
	 */
	private createAutoContainer(): string {
		this.autoContainerId = `ya-captcha-auto-${Math.random().toString(36).slice(2)}`;
		const container = document.createElement('div');
		container.id = this.autoContainerId;
		container.style.display = 'none';
		document.body.appendChild(container);
		this.log('Создан автоматический контейнер с ID:', this.autoContainerId);
		return this.autoContainerId;
	}

	/**
	 * Рендерит виджет капчи.
	 *
	 * @private
	 */
	private renderWidget(): void {
		const windowWithSmartCaptcha = window as WindowWithSmartCaptcha;
		if (!windowWithSmartCaptcha.smartCaptcha) {
			this.logError('Yandex Smart Captcha недоступен');
			return;
		}

		const container = typeof this.container === 'string' ? document.getElementById(this.container) : this.container;
		const containerId = typeof this.container === 'string' ? this.container : this.createAutoContainer();
		if (!container && !this.autoContainerId) {
			this.logError(`Контейнер с id "${containerId}" не найден`);
			return;
		}

		this.log('Рендеринг виджета SmartCaptcha');

		this.widgetId = windowWithSmartCaptcha.smartCaptcha.render(container ?? containerId, {
			sitekey: this.sitekey,
			invisible: this.invisible,
			hl: this.lang, // Передаём lang как hl для SmartCaptcha
			callback: (token: string) => {
				if (typeof token === 'string' && token.length > 0) {
					this.log('Токен получен:', token);
					this.currentToken = token;
					this.callback(token);
				} else {
					this.logError('Получен некорректный токен:', token);
				}
			},
			test: this.test,
			webview: this.webview,
			shieldPosition: this.shieldPosition,
			hideShield: this.hideShield,
		});

		windowWithSmartCaptcha.smartCaptcha.subscribe(this.widgetId, 'token-expired', () => {
			this.log('Токен прохождения проверки стал невалидным');
			this.currentToken = '';
		});
	}

	/** Запускает проверку капчи. */
	public execute(): void {
		const windowWithSmartCaptcha = window as WindowWithSmartCaptcha;
		if (!windowWithSmartCaptcha.smartCaptcha) {
			this.logError('SmartCaptcha недоступен');
			return;
		}
		if (this.widgetId === null) {
			this.logError('Виджет капчи не инициализирован');
			return;
		}
		this.log('Запуск SmartCaptcha');

		if (typeof this.currentToken === 'string' && this.currentToken.length > 0) {
			this.log('Отдан ранее полученный токен получен:', this.currentToken);
			this.callback(this.currentToken);
		} else {
			windowWithSmartCaptcha.smartCaptcha.execute(this.widgetId);
		}
	}

	/**
	 * Сбрасывает капчу.
	 *
	 * Нужно выполнять после отправки токена, так как 1 токен должен использоваться только 1 раз.
	 */
	public reset(): void {
		const windowWithSmartCaptcha = window as WindowWithSmartCaptcha;
		if (!windowWithSmartCaptcha.smartCaptcha) {
			this.logError('SmartCaptcha недоступен');
			return;
		}
		if (this.widgetId === null) {
			this.logError('Виджет капчи не инициализирован');
			return;
		}
		this.log('Сброс SmartCaptcha виджета');
		windowWithSmartCaptcha.smartCaptcha.reset(this.widgetId);
	}

	/** Удаляет автоматически созданный контейнер и очищает ресурсы. */
	public destroy(): void {
		if (this.autoContainerId) {
			const container = document.getElementById(this.autoContainerId);
			if (container) {
				container.remove();
				this.log('Автоматический контейнер удалён:', this.autoContainerId);
			}
		}
		this.widgetId = null;
	}

	/**
	 * Автоматически инициализирует капчу для всех форм с атрибутом data-ya-captcha-form. Добавляет скрытое поле для
	 * токена и обрабатывает отправку формы.
	 *
	 * @param config - Конфигурация капчи.
	 *
	 * @throws {Error} Если sitekey не указан.
	 */
	public static autoInit(config: YaCaptchaAutoInitConfig): void {
		if (!config.sitekey) {
			console.error('[YaInvisibleCaptcha] sitekey обязателен для autoInit');
			return;
		}

		const forms = document.querySelectorAll<HTMLFormElement>('form[data-ya-captcha-form]');
		if (forms.length === 0) {
			console.warn('[YaInvisibleCaptcha] Формы с data-ya-captcha-form не найдены');
			return;
		}

		let lastToken = '';
		let currentForm: HTMLFormElement | null = null;

		const captcha = new YaInvisibleCaptcha({
			sitekey: config.sitekey,
			lang: config.lang ?? 'ru',
			debug: config.debug ?? false,
			test: config.test,
			webview: config.webview,
			shieldPosition: config.shieldPosition,
			hideShield: config.hideShield,
			callback: (token: string) => {
				lastToken = token;
				if (currentForm) {
					const tokenInput = currentForm.querySelector('[data-ya-captcha-token-input]');
					if (tokenInput instanceof HTMLInputElement) {
						tokenInput.value = token;
						currentForm.submit();
					}
				}
			},
		});

		forms.forEach(form => {
			let tokenInput: HTMLInputElement | null = form.querySelector('[data-ya-captcha-token-input]');
			if (!tokenInput) {
				tokenInput = document.createElement('input');
				tokenInput.type = 'hidden';
				tokenInput.name = config.tokenFieldName ?? 'token';
				tokenInput.setAttribute('data-ya-captcha-token-input', '');
				form.appendChild(tokenInput);
			}

			form.addEventListener(
				'submit',
				(e: Event) => {
					currentForm = form;
					const currentToken = (tokenInput as HTMLInputElement).value;
					if (!currentToken || currentToken === lastToken) {
						e.preventDefault();
						captcha.execute();
					}
				},
				{ passive: false },
			);
		});
	}
}

// Регистрируем класс в глобальной области для использования через <script>
const windowWithSmartCaptcha = window as WindowWithSmartCaptcha;
windowWithSmartCaptcha.YaInvisibleCaptcha = YaInvisibleCaptcha;

export default YaInvisibleCaptcha;
