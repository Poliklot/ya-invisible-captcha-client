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
