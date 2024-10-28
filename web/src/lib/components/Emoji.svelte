<script lang="ts">
  import { getEmoji } from "$lib/utils/EmojiUtil";

  interface Props {
    content?: string;
    classes?: string;
  }

  let { content = "red-question-mark", classes = "" }: Props = $props();
  let omaEmoji = $derived<{
    type: "class" | "background";
    value: string;
  }>(getEmoji(content));
</script>

<div class="emoji {classes}">
  {#if omaEmoji.type === "class"}
    <i class="oma oma-{omaEmoji.value}"></i>
  {:else if omaEmoji.type === "background"}
    <i class="oma" style="background-image: url({omaEmoji.value})"></i>
  {/if}
</div>
