<script lang="ts">
	let { class: className } = $props<{ class?: string }>();
	// let { children } = $props();
</script>

<div class={[className, 'container']}></div>

<style lang="sass">
.container
    display: flex
    width: 4rem
    height: 100%
    background: #3C3D36
    border-right: 1px solid #282824
    box-sizing: border-box
</style>
