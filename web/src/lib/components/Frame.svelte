<script lang="ts">
  import { getIconFromType } from "$lib/utils/stringUtil";
  import CommonKnowledge from "./CommonKnowledge.svelte";
  import Statement from "./messages/Statements/Statement.svelte";
  import type { Id, Statement as StatementAST, StmtComment } from "$lang/types/parser/interfaces";
  import Participants from "./Participants.svelte";
  import type { NextFrameNavigation } from "src/types/app";
  import type { ParticipantElements, VisualKnowledge } from "src/types/participant";
  import { program, currentFrame } from "$lib/stores/programStore.js";
  import History from "./History.svelte";

  interface Props {
    nextFrame?: NextFrameNavigation;
  }

  let { nextFrame = () => {} }: Props = $props();
  $effect(() => {
    console.log("Current frame:", currentFrame);
  });
  let { participants, commonKnowledge } = $derived.by(() => {
    const tmpParticipants: {
      Name: Id;
      Emoji: string;
      Comment?: StmtComment;
      Knowledge: VisualKnowledge[];
    }[] = [];
    let tmpCommonKnowledge: VisualKnowledge[] = [];
    if ($currentFrame && $program) {
      if ($currentFrame.getParticipantMap()) {
        for (const key in $currentFrame.getParticipantMap().getParticipants()) {
          const participant = $currentFrame.getParticipantMap().getParticipant(key);

          const obj: {
            Name: Id;
            Emoji: string;
            Comment?: StmtComment;
            Knowledge: VisualKnowledge[];
          } = {
            Name: { type: "id", value: participant.getName() },
            Emoji: $program.getIcon(participant.getName()), //participant.emoji
            Comment: participant.getComment(),
            Knowledge: participant
              .getKnowledgeList()
              .sort((a, b) => b.id - a.id)
              .map(({ item }) => {
                const emoji = item.type === "encryptedKnowledge" ? "🔒" : getIconFromType(item.knowledge, $program);
                return {
                  knowledge: item,
                  emoji: emoji,
                };
              }),
          };

          if (obj.Name.value === "Shared") tmpCommonKnowledge = obj.Knowledge;
          else tmpParticipants.push(obj);
        }
      }
    }
    return {participants: tmpParticipants, commonKnowledge: tmpCommonKnowledge};
  });
  let presentation: StatementAST | null = $derived($currentFrame.getPresentation());
  $effect(() => {});

  let participantElements: ParticipantElements = $state({ container: undefined, elements: {} });
</script>

<div class="frame">
  {#if commonKnowledge.length > 0}
    <CommonKnowledge knowledges={commonKnowledge} />
  {/if}
  <div class="participants" bind:this={participantElements.container}>
    <Participants bind:participantElements={participantElements.elements} {participants} />
  </div>
  {#if presentation !== null}
    {#key JSON.stringify(presentation)}
      <Statement {participantElements} {nextFrame} statement={presentation} />
    {/key}
  {/if}
  <History />
</div>

<style>
  .frame {
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
  }
  .participants {
    flex: 1;
  }
</style>
