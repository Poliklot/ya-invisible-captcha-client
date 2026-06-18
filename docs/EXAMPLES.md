# Examples

Во всех примерах `YANDEX_SMARTCAPTCHA_SITEKEY` — публичный sitekey из Yandex Cloud.
Token обязательно проверяйте на backend перед выполнением защищённого действия.

## Vanilla ESM

```ts
import YaInvisibleCaptcha from 'ya-invisible-captcha-client';

const form = document.querySelector<HTMLFormElement>('#contact-form');
const tokenInput = document.querySelector<HTMLInputElement>('[name="smart-token"]');

const captcha = new YaInvisibleCaptcha({
	sitekey: 'YANDEX_SMARTCAPTCHA_SITEKEY',
	callback: token => {
		if (!form || !tokenInput) return;
		tokenInput.value = token;
		form.requestSubmit ? form.requestSubmit() : form.submit();
	},
});

form?.addEventListener('submit', event => {
	if (tokenInput?.value) return;
	event.preventDefault();
	captcha.execute();
});
```

## CDN / UMD

```html
<form id="contact-form" action="/api/contact" method="post">
	<input name="email" type="email" required />
	<input name="smart-token" type="hidden" />
	<button type="submit">Send</button>
</form>

<script src="https://unpkg.com/ya-invisible-captcha-client@latest/ya-invisible-captcha-client.umd.js"></script>
<script>
	const form = document.querySelector('#contact-form');
	const tokenInput = form.querySelector('[name="smart-token"]');

	const captcha = new window.YaInvisibleCaptcha({
		sitekey: 'YANDEX_SMARTCAPTCHA_SITEKEY',
		callback: token => {
			tokenInput.value = token;
			form.submit();
		},
	});

	form.addEventListener('submit', event => {
		if (tokenInput.value) return;
		event.preventDefault();
		captcha.execute();
	});
</script>
```

## Vite

```ts
// src/main.ts
import YaInvisibleCaptcha from 'ya-invisible-captcha-client';

YaInvisibleCaptcha.autoInit({
	sitekey: import.meta.env.VITE_YANDEX_SMARTCAPTCHA_SITEKEY,
	tokenFieldName: 'smart-token',
	lang: 'ru',
});
```

```html
<form action="/api/contact" method="post" data-ya-captcha-form>
	<input name="email" type="email" required />
	<button type="submit">Send</button>
</form>
```

## React

```tsx
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
```

## Next.js App Router

```tsx
'use client';

import { FormEvent, useEffect, useRef } from 'react';
import YaInvisibleCaptcha from 'ya-invisible-captcha-client';

export function ContactForm() {
	const formRef = useRef<HTMLFormElement>(null);
	const tokenRef = useRef<HTMLInputElement>(null);
	const captchaRef = useRef<YaInvisibleCaptcha | null>(null);

	useEffect(() => {
		captchaRef.current = new YaInvisibleCaptcha({
			sitekey: process.env.NEXT_PUBLIC_YANDEX_SMARTCAPTCHA_SITEKEY!,
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
```

## Vue 3

```vue
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import YaInvisibleCaptcha from 'ya-invisible-captcha-client';

const formRef = ref<HTMLFormElement | null>(null);
const tokenRef = ref<HTMLInputElement | null>(null);
let captcha: YaInvisibleCaptcha | null = null;

onMounted(() => {
	captcha = new YaInvisibleCaptcha({
		sitekey: import.meta.env.VITE_YANDEX_SMARTCAPTCHA_SITEKEY,
		callback: token => {
			if (!formRef.value || !tokenRef.value) return;
			tokenRef.value.value = token;
			formRef.value.requestSubmit();
		},
	});
});

onBeforeUnmount(() => captcha?.destroy());

function onSubmit(event: Event) {
	if (tokenRef.value?.value) return;
	event.preventDefault();
	captcha?.execute();
}
</script>

<template>
	<form ref="formRef" action="/api/contact" method="post" @submit="onSubmit">
		<input name="email" type="email" required />
		<input ref="tokenRef" name="smart-token" type="hidden" />
		<button type="submit">Send</button>
	</form>
</template>
```

## Nuxt 3

```vue
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import YaInvisibleCaptcha from 'ya-invisible-captcha-client';

const config = useRuntimeConfig();
const formRef = ref<HTMLFormElement | null>(null);
const tokenRef = ref<HTMLInputElement | null>(null);
let captcha: YaInvisibleCaptcha | null = null;

onMounted(() => {
	captcha = new YaInvisibleCaptcha({
		sitekey: config.public.yandexSmartCaptchaSitekey,
		callback: token => {
			if (!formRef.value || !tokenRef.value) return;
			tokenRef.value.value = token;
			formRef.value.requestSubmit();
		},
	});
});

onBeforeUnmount(() => captcha?.destroy());

function onSubmit(event: Event) {
	if (tokenRef.value?.value) return;
	event.preventDefault();
	captcha?.execute();
}
</script>

<template>
	<form ref="formRef" action="/api/contact" method="post" @submit="onSubmit">
		<input name="email" type="email" required />
		<input ref="tokenRef" name="smart-token" type="hidden" />
		<button type="submit">Send</button>
	</form>
</template>
```

## Svelte / SvelteKit

```svelte
<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import YaInvisibleCaptcha from 'ya-invisible-captcha-client';

	let form: HTMLFormElement;
	let tokenInput: HTMLInputElement;
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

	onDestroy(() => captcha?.destroy());

	function onSubmit(event: SubmitEvent) {
		if (tokenInput.value) return;
		event.preventDefault();
		captcha?.execute();
	}
</script>

<form bind:this={form} action="/api/contact" method="post" on:submit={onSubmit}>
	<input name="email" type="email" required />
	<input bind:this={tokenInput} name="smart-token" type="hidden" />
	<button type="submit">Send</button>
</form>
```

## Astro

```astro
---
// ContactForm.astro
---

<form id="contact-form" action="/api/contact" method="post">
	<input name="email" type="email" required />
	<input name="smart-token" type="hidden" />
	<button type="submit">Send</button>
</form>

<script>
	import YaInvisibleCaptcha from 'ya-invisible-captcha-client';

	const form = document.querySelector<HTMLFormElement>('#contact-form');
	const tokenInput = form?.querySelector<HTMLInputElement>('[name="smart-token"]');

	const captcha = new YaInvisibleCaptcha({
		sitekey: import.meta.env.PUBLIC_YANDEX_SMARTCAPTCHA_SITEKEY,
		callback: token => {
			if (!form || !tokenInput) return;
			tokenInput.value = token;
			form.requestSubmit();
		},
	});

	form?.addEventListener('submit', event => {
		if (tokenInput?.value) return;
		event.preventDefault();
		captcha.execute();
	});
</script>
```

## Angular

```ts
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
```

## Solid

```tsx
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
```

## Alpine.js

```html
<form
	action="/api/contact"
	method="post"
	x-data="captchaForm('YANDEX_SMARTCAPTCHA_SITEKEY')"
	x-init="init()"
	@submit="submit"
>
	<input name="email" type="email" required />
	<input x-ref="token" name="smart-token" type="hidden" />
	<button type="submit">Send</button>
</form>

<script type="module">
	import YaInvisibleCaptcha from 'ya-invisible-captcha-client';

	window.captchaForm = sitekey => ({
		captcha: null,
		init() {
			this.captcha = new YaInvisibleCaptcha({
				sitekey,
				callback: token => {
					this.$refs.token.value = token;
					this.$root.submit();
				},
			});
		},
		submit(event) {
			if (this.$refs.token.value) return;
			event.preventDefault();
			this.captcha.execute();
		},
	});
</script>
```

## Web Components

```ts
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
```
