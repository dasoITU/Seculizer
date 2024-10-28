<script lang="ts">
  import type { Navigation, NextFrameNavigation } from "src/types/app";


  interface Props {
    navigation?: Navigation;
    nextFrame?: NextFrameNavigation;
  }

  let { navigation = {
    prev: null,
    next: null,
  }, nextFrame = () => {} }: Props = $props();
</script>

{#if navigation.next !== null}
  <button onclick={() => {if(navigation.next !== null) nextFrame(navigation.next)}}>Next</button>
{/if}
