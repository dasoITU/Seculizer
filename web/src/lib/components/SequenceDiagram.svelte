<script lang="ts">
  import mermaid from "mermaid";
  import { onMount } from "svelte";
  import { currentFrame } from "$lib/stores/programStore.js";
  let graph = $state<HTMLElement>();
  let content = $derived.by(() => {
    let tmpContent = "sequenceDiagram\n";
    if (!$currentFrame) return;
    $currentFrame
      .getParticipantMap()
      .getParticipantsNames()
      .forEach((name) => {
        if (name === "Shared") return;
        tmpContent += `participant ${name}\n`;
      });
    $currentFrame.getHistory().forEach((event) => {
      if (event.mermaid.trim() !== "") tmpContent += event.mermaid + "\n";
    });
    return tmpContent;
  });
  let isInitialized = false;
  onMount(async () => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "neutral",
      flowchart: {
        useMaxWidth: false,
        htmlLabels: true,
      },
    });
    isInitialized = true;
    if (!graph) return;
    const { svg } = await mermaid.render("graphDiv", content || '');
    graph.innerHTML = svg;
  });

  function rerender() {
    {
      if (isInitialized) {

        mermaid.render("graphDiv", content || '').then(({ svg }) => {
          if (!graph) return;
          graph.innerHTML = svg;
        });
      }
    }
  }

  $effect(() => {
    $currentFrame && $currentFrame.getHistory() && rerender();
  });
</script>

{#if $currentFrame && $currentFrame.getHistory().length > 0 && content && content.trim() !== ""}
  <pre bind:this={graph}></pre>
{:else}
  <p class="no-history">No history yet</p>
{/if}

<style>
  pre,
  .no-history {
    max-height: 100%;
    max-height: calc(100% - 75px);
    overflow-y: auto;
    margin: 1rem;
    background: var(--sequence-bg);
    box-shadow: var(--shadow);
    padding: 1rem;
    resize: both;
  }
  pre :global(#graphDiv .actor) {
    stroke: var(--sequence-note-stroke);
    fill: var(--message-bg);
  }
  pre :global(#graphDiv text.actor) {
    font-weight: bold !important;
  }

  pre :global(#graphDiv .note) {
    stroke: var(--sequence-note-stroke);
    fill: var(--action-header-bg);
  }

  pre :global(#graphDiv .noteText),
  pre :global(#graphDiv .noteText > tspan) {
    fill: var(--sequence-text);
  }
</style>
