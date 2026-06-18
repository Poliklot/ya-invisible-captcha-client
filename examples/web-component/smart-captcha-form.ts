import YaInvisibleCaptcha from 'ya-invisible-captcha-client';

class SmartCaptchaForm extends HTMLElement {
	private captcha: YaInvisibleCaptcha | null = null;

	connectedCallback() {
		const form = this.querySelector<HTMLFormElement>('form');
		const tokenInput = this.querySelector<HTMLInputElement>('[name="smart-token"]');
		const sitekey = this.getAttribute('sitekey');

		if (!form || !tokenInput || !sitekey) return;

		this.captcha = new YaInvisibleCaptcha({
			sitekey,
			callback: token => {
				tokenInput.value = token;
				form.requestSubmit();
			},
		});

		form.addEventListener('submit', event => {
			if (tokenInput.value) return;
			event.preventDefault();
			this.captcha?.execute();
		});
	}

	disconnectedCallback() {
		this.captcha?.destroy();
	}
}

customElements.define('smart-captcha-form', SmartCaptchaForm);
