import YaInvisibleCaptcha from '../src/index';

type CaptchaRenderOptions = {
	callback: (token: string) => void;
	sitekey: string;
	invisible: boolean;
	hl: string;
	test?: boolean;
	webview?: boolean;
	shieldPosition?: string;
	hideShield?: boolean;
};

type SmartCaptchaMock = {
	execute: jest.Mock<void, [number]>;
	getResponse: jest.Mock<string, [number]>;
	render: jest.Mock<number, [string | HTMLElement, CaptchaRenderOptions]>;
	reset: jest.Mock<void, [number]>;
	subscribe: jest.Mock<() => void, [number, string, () => void]>;
	subscriptions: Record<string, () => void>;
};

const flushPromises = async () => {
	await Promise.resolve();
	await Promise.resolve();
};

function installSmartCaptcha(widgetId = 42): SmartCaptchaMock {
	const subscriptions: Record<string, () => void> = {};
	const smartCaptcha: SmartCaptchaMock = {
		execute: jest.fn(),
		getResponse: jest.fn((_: number) => ''),
		render: jest.fn((_: string | HTMLElement, __: CaptchaRenderOptions) => widgetId),
		reset: jest.fn(),
		subscribe: jest.fn((_, event, callback) => {
			subscriptions[event] = callback;
			return jest.fn();
		}),
		subscriptions,
	};

	(window as typeof window & { smartCaptcha: SmartCaptchaMock }).smartCaptcha = smartCaptcha;
	return smartCaptcha;
}

describe('YaInvisibleCaptcha', () => {
	beforeEach(() => {
		document.body.innerHTML = '';
		document.head.innerHTML = '';
		delete (window as typeof window & { smartCaptcha?: unknown }).smartCaptcha;
		delete (window as typeof window & { onloadFunction?: unknown }).onloadFunction;
		jest.restoreAllMocks();
	});

	test('exposes the constructor on window for UMD/browser usage', () => {
		expect((window as typeof window & { YaInvisibleCaptcha?: unknown }).YaInvisibleCaptcha).toBe(YaInvisibleCaptcha);
	});

	test('requires sitekey and callback', () => {
		expect(() => new YaInvisibleCaptcha({ sitekey: '', callback: jest.fn() })).toThrow('sitekey обязателен');
		expect(() => new YaInvisibleCaptcha({ sitekey: 'site-key' } as never)).toThrow('callback обязателен');
	});

	test('renders SmartCaptcha with explicit container and normalized options', async () => {
		document.body.innerHTML = '<div id="captcha"></div>';
		const smartCaptcha = installSmartCaptcha(1001);
		const callback = jest.fn();

		new YaInvisibleCaptcha({
			sitekey: 'site-key',
			callback,
			container: 'captcha',
			invisible: false,
			lang: 'en',
			test: true,
			webview: true,
			shieldPosition: 'bottom-right',
			hideShield: true,
		});

		await flushPromises();

		expect(smartCaptcha.render).toHaveBeenCalledTimes(1);
		expect(smartCaptcha.render).toHaveBeenCalledWith(
			document.getElementById('captcha'),
			expect.objectContaining({
				sitekey: 'site-key',
				invisible: false,
				hl: 'en',
				test: true,
				webview: true,
				shieldPosition: 'bottom-right',
				hideShield: true,
			}),
		);
		expect(smartCaptcha.subscribe).toHaveBeenCalledWith(1001, 'token-expired', expect.any(Function));
	});

	test('loads SmartCaptcha script when it is not available yet', () => {
		new YaInvisibleCaptcha({ sitekey: 'site-key', callback: jest.fn() });

		const script = document.head.querySelector<HTMLScriptElement>('script[src^="https://smartcaptcha.yandexcloud.net"]');
		expect(script).not.toBeNull();
		expect(script?.src).toContain('render=onload');
		expect(script?.src).toContain('onload=onloadFunction');
		expect(script?.async).toBe(true);
		expect(script?.defer).toBe(true);
		expect(typeof (window as typeof window & { onloadFunction?: unknown }).onloadFunction).toBe('function');
	});

	test('executes captcha and reuses a cached token until reset', async () => {
		const smartCaptcha = installSmartCaptcha(7);
		const callback = jest.fn();
		const captcha = new YaInvisibleCaptcha({ sitekey: 'site-key', callback });

		await flushPromises();
		captcha.execute();

		expect(smartCaptcha.execute).toHaveBeenCalledWith(7);

		const renderOptions = smartCaptcha.render.mock.calls[0][1];
		renderOptions.callback('token-1');
		expect(callback).toHaveBeenCalledWith('token-1');

		callback.mockClear();
		smartCaptcha.execute.mockClear();
		captcha.execute();

		expect(callback).toHaveBeenCalledWith('token-1');
		expect(smartCaptcha.execute).not.toHaveBeenCalled();

		captcha.reset();
		expect(smartCaptcha.reset).toHaveBeenCalledWith(7);

		callback.mockClear();
		captcha.execute();
		expect(smartCaptcha.execute).toHaveBeenCalledWith(7);
		expect(callback).not.toHaveBeenCalled();
	});

	test('resets cached token when SmartCaptcha reports token expiration', async () => {
		const smartCaptcha = installSmartCaptcha(11);
		const callback = jest.fn();
		const captcha = new YaInvisibleCaptcha({ sitekey: 'site-key', callback });

		await flushPromises();
		smartCaptcha.render.mock.calls[0][1].callback('token-before-expiration');
		smartCaptcha.reset.mockClear();

		smartCaptcha.subscriptions['token-expired']();

		expect(smartCaptcha.reset).toHaveBeenCalledWith(11);
		callback.mockClear();
		captcha.execute();
		expect(smartCaptcha.execute).toHaveBeenCalledWith(11);
		expect(callback).not.toHaveBeenCalled();
	});

	test('creates and destroys an automatic hidden container', async () => {
		const smartCaptcha = installSmartCaptcha(15);
		const captcha = new YaInvisibleCaptcha({ sitekey: 'site-key', callback: jest.fn() });

		await flushPromises();

		const renderTarget = smartCaptcha.render.mock.calls[0][0];
		expect(typeof renderTarget).toBe('string');

		const container = document.getElementById(renderTarget as string);
		expect(container).not.toBeNull();
		expect(container?.style.display).toBe('none');

		captcha.destroy();
		expect(document.getElementById(renderTarget as string)).toBeNull();
	});

	test('autoInit wires forms, token input, captcha execution, and form submit', async () => {
		const smartCaptcha = installSmartCaptcha(99);
		const submit = jest.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => undefined);
		document.body.innerHTML = `
			<form data-ya-captcha-form action="/contact">
				<input name="email" value="hello@example.com" />
				<button type="submit">Send</button>
			</form>
		`;

		YaInvisibleCaptcha.autoInit({ sitekey: 'site-key', tokenFieldName: 'captcha_token', test: true });
		await flushPromises();

		const form = document.querySelector<HTMLFormElement>('form[data-ya-captcha-form]');
		const tokenInput = form?.querySelector<HTMLInputElement>('[data-ya-captcha-token-input]');

		expect(tokenInput).toBeInstanceOf(HTMLInputElement);
		expect(tokenInput?.name).toBe('captcha_token');

		const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
		form?.dispatchEvent(submitEvent);

		expect(submitEvent.defaultPrevented).toBe(true);
		expect(smartCaptcha.execute).toHaveBeenCalledWith(99);

		smartCaptcha.render.mock.calls[0][1].callback('form-token');

		expect(tokenInput?.value).toBe('form-token');
		expect(submit).toHaveBeenCalledTimes(1);
	});
});
