import { onCleanup, onMount } from 'solid-js';
import YaInvisibleCaptcha from 'ya-invisible-captcha-client';

export function ContactForm() {
	let form!: HTMLFormElement;
	let tokenInput!: HTMLInputElement;
	let captcha: YaInvisibleCaptcha | null = null;

	onMount(() => {
		captcha = new YaInvisibleCaptcha({
			sitekey: import.meta.env.VITE_YANDEX_SMARTCAPTCHA_SITEKEY,
			callback: token => {
				tokenInput.value = token;
				form.requestSubmit();
			},
		});
	});

	onCleanup(() => captcha?.destroy());

	function onSubmit(event: SubmitEvent) {
		if (tokenInput.value) return;
		event.preventDefault();
		captcha?.execute();
	}

	return (
		<form ref={form} action="/api/contact" method="post" onSubmit={onSubmit}>
			<input name="email" type="email" required />
			<input ref={tokenInput} name="smart-token" type="hidden" />
			<button type="submit">Send</button>
		</form>
	);
}
