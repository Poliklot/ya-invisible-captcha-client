import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import YaInvisibleCaptcha from 'ya-invisible-captcha-client';

@Component({
	selector: 'app-contact-form',
	template: `
		<form #form action="/api/contact" method="post" (submit)="onSubmit($event)">
			<input name="email" type="email" required />
			<input #tokenInput name="smart-token" type="hidden" />
			<button type="submit">Send</button>
		</form>
	`,
})
export class ContactFormComponent implements AfterViewInit, OnDestroy {
	@ViewChild('form') form!: ElementRef<HTMLFormElement>;
	@ViewChild('tokenInput') tokenInput!: ElementRef<HTMLInputElement>;
	private captcha: YaInvisibleCaptcha | null = null;

	ngAfterViewInit() {
		this.captcha = new YaInvisibleCaptcha({
			sitekey: 'YANDEX_SMARTCAPTCHA_SITEKEY',
			callback: token => {
				this.tokenInput.nativeElement.value = token;
				this.form.nativeElement.requestSubmit();
			},
		});
	}

	onSubmit(event: SubmitEvent) {
		if (this.tokenInput.nativeElement.value) return;
		event.preventDefault();
		this.captcha?.execute();
	}

	ngOnDestroy() {
		this.captcha?.destroy();
	}
}
