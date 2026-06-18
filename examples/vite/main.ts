import YaInvisibleCaptcha from 'ya-invisible-captcha-client';

YaInvisibleCaptcha.autoInit({
	sitekey: import.meta.env.VITE_YANDEX_SMARTCAPTCHA_SITEKEY,
	tokenFieldName: 'smart-token',
	lang: 'ru',
});
