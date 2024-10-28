<script lang="ts">
  import type { ParticipantStatement, ParticipantStatementNode, NewStatement, SetStatement } from "$lang/types/parser/interfaces";
  import ActionBox from "../ActionBox.svelte";
  import Item from "$lib/components/Item.svelte";
  import { onMount } from "svelte";
  import SetItem from "$lib/components/SetItem.svelte";
  import type { ParticipantElements } from "src/types/participant";

  import { currentFrame, program } from "$lib/stores/programStore.js";
  import Comment from "$lib/components/Comment.svelte";
    import { fade } from "svelte/transition";

  interface Props {
    stmnt: ParticipantStatement;
    participantElements?: ParticipantElements;
  }

  let { stmnt, participantElements = {
    container: undefined,
    elements: {},
  } }: Props = $props();
  const child = stmnt.child;
  let statement = $state<HTMLElement | undefined>();
  function update() {
    let container = participantElements.container;
    let participant = participantElements.elements[stmnt.id.value];

    if (participant && statement) {
      let x = participant.offsetLeft + (container?.offsetLeft || 0) - statement.offsetWidth/2;
      let y = participant.offsetTop + (container?.offsetTop || 0) + participant.offsetHeight/2;
      statement.style.left = x + "px";
      statement.style.top = y + "px";
    }
  }
  onMount(() => {
    let container = participantElements.container;
    if (!container) return;
    const resizeObserver = new ResizeObserver((_) => {
      update();
    });

    resizeObserver.observe(container);
    update();
    // This callback cleans up the observer
    return () => {
      if (container) resizeObserver.unobserve(container);
    };
  });

  const castToNewStatement = (x: ParticipantStatementNode) => x as NewStatement;
  const castToSetStatement = (x: ParticipantStatementNode) => x as SetStatement;
</script>

<div class="statement" transition:fade|global bind:this={statement}>
  {#if !child}
    <p>Invalid participant statement</p>
  {:else if child.type === "newStatement"}
    {@const newStmnt = castToNewStatement(child)}
    {@const value = newStmnt.value}
    {@const icon = value.type === "id" ? $program.getIcon(value.value) : "gear"}
    <ActionBox title="new">
      {#if newStmnt.comment}
        <Item emoji={icon} value={value}>
          {#snippet hover()}
          {#if newStmnt.comment !== undefined}
                        <Comment comment={newStmnt.comment}  />
                        {/if}
          {/snippet}
        </Item>
      {:else}
        <Item emoji={icon} value={value} />
      {/if}
    </ActionBox>
  {:else if child.type === "setStatement"}
    {@const setStmnt = castToSetStatement(child)}
    {@const id = setStmnt.id}
    {@const icon = $program.getIcon(id.value)}
    {@const value = setStmnt.value}
    {@const comment = $currentFrame?.getParticipantKnowledgeComment(stmnt.id.value, id)}
    <ActionBox title="Update"><SetItem emoji={icon} value={id} newValue={value} {comment}/></ActionBox>
  {/if}
</div>

<style>
  .statement {
    position: absolute;
    z-index: 1;
  }
</style>
