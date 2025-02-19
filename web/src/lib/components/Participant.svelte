<script lang="ts">
  import { fly } from "svelte/transition";
  import type { Id, StmtComment, Type } from "$lang/types/parser/interfaces";
  import type { ParticipantKnowledge, RawParticipantKnowledge, VisualKnowledge } from "src/types/participant";
  import Item from "./Item.svelte";
  import Comment from "./Comment.svelte";
  import Format from "./Formats/Format.svelte";

  interface Props {
    name: Id;
    emoji: string;
    comment: StmtComment | undefined;
    knowledge?: VisualKnowledge[];
    pos?: any;
    element: HTMLElement;
  }

  let {
    name,
    emoji,
    comment,
    knowledge = [],
    pos = { left: 0, top: 0 },
    element = $bindable()
  }: Props = $props();
  let showKnowledge = $state(false);

  function nodeContains(event: MouseEvent, container: HTMLElement) {
    let node = event.relatedTarget as Node;
    return container.contains(node);
  }
  function flatKnowledgeTypes(knowledges: ParticipantKnowledge[]): { type: Type; value?: Type }[] {
    let flat: { type: Type; value?: Type }[] = [];
    for (const knowledge of knowledges) {
      if (knowledge.type === "encryptedKnowledge") {
        flat.concat(flatKnowledgeTypes(knowledge.knowledge));
      } else {
        flat.push({ type: knowledge.knowledge, value: knowledge.value });
      }
    }
    return flat;
  }
  let endHover = $state(false);
</script>

<div
  role="presentation"
  class="participantContainer"
  style:left={pos.left + "px"}
  style:top={pos.top + "px"}
  bind:this={element}
  onfocus={() => {
    showKnowledge = true;
  }}
  onblur={() => {
    showKnowledge = false;
  }}
  onmouseover={() => {
    showKnowledge = true;
    endHover = false;
  }}
  onmouseout={(e) => {
    if (nodeContains(e, element)) return;
    endHover = true;
    setTimeout(() => {
      if (endHover) showKnowledge = false;
    }, 750);
  }}
>
  <div class="participantInnerContainer">
    <div class="participant-item">
      <Item value={name} {emoji}>
        {#snippet hover()}
              
            {#if comment}
              <Comment {comment} />
            {/if}
          
              {/snippet}
      </Item>
    </div>
  </div>
  {#key knowledge.length}
    {#if showKnowledge}
      <div class="knowledges" in:fly|global={{ y: -100, duration: 500 }} out:fly|global={{ y: -50, duration: 350 }}>
        {#if knowledge.length === 0}
          <p class="emptyText">Empty</p>
        {:else}
          {#each knowledge as visualKnowledge}
            <div class="knowledge">
              {#if visualKnowledge.knowledge.type === "encryptedKnowledge"}
                {#each flatKnowledgeTypes(visualKnowledge.knowledge.knowledge) as { type, value }}
                  <Item value={type} emoji={visualKnowledge.emoji}>
                    {#if value}
                      <small class="knowledgeValue">
                        <Format input={value} />
                      </small>
                      <!--Should this value be available if encrypted?-->
                    {/if}
                  </Item>
                {/each}
              {:else if visualKnowledge.knowledge.type === "rawKnowledge"}
                {@const value = visualKnowledge.knowledge.value}
                <Item value={visualKnowledge.knowledge.knowledge} emoji={visualKnowledge.emoji}>
                  {#if value}
                    <small class="knowledgeValue">
                      <Format input={value} />
                    </small>
                  {/if}
                  {#snippet hover()}
                    {@const rawKnowledge = visualKnowledge.knowledge as RawParticipantKnowledge}
                      {#if rawKnowledge.comment}
                        <Comment comment={rawKnowledge.comment} />
                      {/if}
                    
                  {/snippet}
                </Item>
              {/if}
            </div>
          {/each}
        {/if}
      </div>
    {/if}
  {/key}
</div>

<style>
  div.participantContainer {
    position: absolute;
    z-index: 1;
    transform: translate(-50%, -50%);
  }
  div.participantContainer:hover {
    z-index: 3;
  }
  div.participantInnerContainer,
  .knowledges {
    background-color: var(--message-bg);
    text-align: center;
    box-shadow: var(--shadow);
  }
  div.participantInnerContainer {
    align-items: center;
    font-size: 1.5rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 125px;
    height: 125px;
    border-radius: 125px;
  }
  .knowledges {
    min-width: 125px;
    max-width: 400px;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 1rem;
    border-radius: 15px;
    padding: 0.5rem;
    font-size: 1rem;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
    align-items: center;
  }
  .knowledge {
    flex-basis: 50%;
  }
  .emptyText {
    font-size: 1rem;
    font-style: italic;
    color: var(--knowledge-empty-color);
  }
  .knowledgeValue {
    font-size: 0.75rem;
    display: block;
  }
</style>
