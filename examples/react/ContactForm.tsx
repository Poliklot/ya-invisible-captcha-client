import { FormEvent, useEffect, useRef } from 'react';
import YaInvisibleCaptcha from 'ya-invisible-captcha-client';

export function ContactForm() {
	const formRef = useRef<HTMLFormElement>(null);
	const tokenRef = useRef<HTMLInputElement>(null);
	const captchaRef = useRef<YaInvisibleCaptcha | null>(null);

	useEffect(() => {
		captchaRef.current = new YaInvisibleCaptcha({
			sitekey: import.meta.env.VITE_YANDEX_SMARTCAPTCHA_SITEKEY,
			callback: token => {
				if (!formRef.current || !tokenRef.current) return;
				tokenRef.current.value = token;
				formRef.current.requestSubmit();
			},
		});
		return () => captchaRef.current?.destroy();
	}, []);

	function onSubmit(event: FormEvent<HTMLFormElement>) {
		if (tokenRef.current?.value) return;
		event.preventDefault();
		captchaRef.current?.execute();
	}

	return (
		<form ref={formRef} action="/api/contact" method="post" onSubmit={onSubmit}>
			<input name="email" type="email" required />
			<input ref={tokenRef} name="smart-token" type="hidden" />
			<button type="submit">Send</button>
		</form>
	);
}
