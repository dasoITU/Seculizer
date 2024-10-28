<script lang="ts">
  import type { Type } from "$lang/types/parser/interfaces";
  import Emoji from "./Emoji.svelte";
  import Format from "./Formats/Format.svelte";
  interface Props {
    emoji: string;
    value: Type;
    children?: import('svelte').Snippet;
    hover?: import('svelte').Snippet;
  }

  let {
    emoji,
    value,
    children,
    hover
  }: Props = $props();
  let item = $state<HTMLElement>();
  let hoverValues = $state({ left: "0px", top: "100%" });
  function handleMouse(e: MouseEvent) {
    if(!item) return;
    const { clientX, clientY } = e;
    const { left, top } = item.getBoundingClientRect();
    hoverValues.left = `${clientX - left + 10}px`;
    hoverValues.top = `${clientY - top + 10}px`;
  }
</script>

<div class="item" bind:this={item} onmousemove={handleMouse} role="presentation">
  <Emoji content={emoji} />
  <Format input={value} />
  {@render children?.()}
  {#if hover}
    <div class="item-hover" style:left={hoverValues.left} style:top={hoverValues.top}>
      {@render hover?.()}
    </div>
  {/if}
</div>

<style>
  .item :global(.emoji i) {
    font-size: 3rem;
  }

  .item {
    padding: 0.1rem;
    text-align: center;
    position: relative;
  }

  .item .item-hover {
    position: absolute;
    top: 100%;
    left: 0;
    display: none;
    min-width: 100px;
    text-align: center;
    width: max-content;
    max-width: 300px;
    background-color: var(--message-bg);
    text-align: center;
    box-shadow: var(--shadow);
    padding: 0.5rem;
    z-index: 10;
    font-size: 1rem;
  }

  .item:hover .item-hover {
    display: block;
  }
  .item .item-hover:empty {
    display: none;
  }

</style>
