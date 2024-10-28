<script lang="ts">
  import type { StmtComment } from "$lang/types/parser/interfaces";
  import Tex from "./Formats/Tex.svelte";

  interface Props {
    comment: StmtComment;
  }

  let { comment }: Props = $props();
</script>

{#if comment.value.type === "string"}
  {comment.value.value}
{:else if comment.value.type === "Tex"}
  <Tex input={comment.value.value} />
{/if}
