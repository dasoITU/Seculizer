<script lang="ts">
  import type { Navigation } from "src/types/app";


  interface Props {
    navigation?: Navigation;
    prevFrame?: () => void;
  }

  let { navigation = {
    prev: null,
    next: null,
  }, prevFrame = () => {} }: Props = $props();
</script>

{#if navigation.prev !== null}
  <button onclick={() => prevFrame()}>Back</button>
{/if}
