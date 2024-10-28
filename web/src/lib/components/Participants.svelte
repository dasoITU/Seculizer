<script lang="ts">
  import type { Id, StmtComment } from "$lang/types/parser/interfaces";
  import { calcPositions } from "$lib/utils/PositionUtil";
  import type { VisualKnowledge } from "src/types/participant";
  import Participant from "./Participant.svelte";

  let container = $state<HTMLElement>();
  let containerWidth = $state<number>();
  let containerHeight = $state<number>();
    interface Props {
      participants?: {
        Name: Id;
        Emoji: string;
        Comment?: StmtComment
        Knowledge: VisualKnowledge[];
      }[];
      participantElements?: { [key: string]: HTMLElement };
    }
    
    let { participants = [], participantElements = $bindable({}) }: Props = $props();
    
  let positions: { x: number; y: number }[] = $derived.by(() => {
      if (container && participants.length > 0) return calcPositions(participants.length, container);
      return [];
  });
</script>

<div class="container" bind:this={container} bind:offsetWidth={containerWidth} bind:offsetHeight={containerHeight}>
  {#if positions.length > 0}
    {#each participants as parti, index}
      <Participant
        bind:element={participantElements[parti.Name.value]}
        pos={{ left: positions[index].x, top: positions[index].y }}
        name={parti.Name}
        comment={parti.Comment}
        emoji={parti.Emoji}
        knowledge={parti.Knowledge}
      />
    {/each}
  {/if}
</div>

<style>
  div.container {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: flex-start;
    height: 100%;
    position: relative;
  }
</style>
