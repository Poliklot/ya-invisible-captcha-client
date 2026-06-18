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
