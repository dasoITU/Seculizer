<script lang="ts">
  import ExpressionBox from './ExpressionBox.svelte';
  import type {
    EncryptExpression,
    Expression as ExpressionAST,
    ExpressionNode,
    FunctionCall,
    Id,
    SignExpression,
    Type,
  } from "$lang/types/parser/interfaces";
  import { getIconFromType } from "$lib/utils/stringUtil.js";
  import Item from "$lib/components/Item.svelte";
  import EncryptIcon from "$lib/components/Icons/EncryptIcon.svelte";
  import SignIcon from "$lib/components/Icons/SignIcon.svelte";

  import { currentFrame, program } from "$lib/stores/programStore.js";
  import Comment from "../Comment.svelte";
  import Format from "../Formats/Format.svelte";
  interface Props {
    isSubmessage?: boolean;
    participants: { from: Id; to: Id };
    expression: ExpressionAST;
  }

  let { isSubmessage = false, participants, expression }: Props = $props();
  let child = expression.child;

  const castToEncryptExpression = (x: ExpressionNode) => x as EncryptExpression;
  const castToSignExpression = (x: ExpressionNode) => x as SignExpression;
  const castToType = (x: ExpressionNode) => x as Type;
  const castToId = (x: ExpressionNode) => x as Id;
  const castToFunctionCall = (x: ExpressionNode) => x as FunctionCall;
</script>

{#if currentFrame !== undefined && program !== undefined}
{#if !child}
  <p>Invalid statement</p>
{:else if child.type === "encryptExpression"}
  {@const encryptExpression = castToEncryptExpression(child)}
  {@const inner = encryptExpression.inner}
  {@const outer = encryptExpression.outer}
  {@const encryptComment = outer.type === "id" ? $currentFrame.getParticipantKnowledgeComment(participants.from.value, outer) : undefined}
  {#if isSubmessage}
    <div class="subMessage">
      {#each inner as innerExpression}
        <div class:innerExpression={inner.length > 1}>
          <ExpressionBox isSubmessage={true} expression={innerExpression} {participants} />
        </div>
      {/each}
      <EncryptIcon encryptType={outer} comment={encryptComment} />
    </div>
  {:else}
    {#each inner as innerExpression}
    <div class:innerExpression={inner.length > 1}>
        <ExpressionBox isSubmessage={true} expression={innerExpression} {participants} />
      </div>
    {/each}
    <EncryptIcon encryptType={outer} comment={encryptComment} />
  {/if}
{:else if child.type === "signExpression"}
  {@const signExpression = castToSignExpression(child)}
  {@const inner = signExpression.inner}
  {@const outer = signExpression.outer}
  {@const signComment = outer.type === "id" ? $currentFrame.getParticipantKnowledgeComment(participants.from.value, outer) : undefined}
  {#if isSubmessage}
    <div class="subMessage">
      {#each inner as innerExpression}
      <div class:innerExpression={inner.length > 1}>
          <ExpressionBox isSubmessage={true} expression={innerExpression} {participants} />
        </div>
      {/each}
      <SignIcon signType={outer} signieIcon={getIconFromType(outer, $program)} comment={signComment} />
    </div>
  {:else}
    {#each inner as innerExpression}
    <div class:innerExpression={inner.length > 1}>
        <ExpressionBox isSubmessage={true} expression={innerExpression} {participants} />
      </div>
    {/each}
    <SignIcon signType={outer} signieIcon={getIconFromType(outer, $program)} comment={signComment} />
  {/if}
{:else if child.type === "string" || child.type === "number"}
  {@const type = castToType(child)}
  <p>
    <Format input={type} />
  </p>
{:else if child.type === "id"}
  {@const id = castToId(child)}
  {@const comment = $currentFrame.getParticipantKnowledgeComment(participants.from.value, id)}
  {#if comment}
    <Item value={id} emoji={$program.getIcon(id.value)}>
      {#snippet hover()}
                            <Comment {comment}  />
                          {/snippet}
    </Item>
  {:else}
    <Item value={id} emoji={$program.getIcon(id.value)} />
  {/if}
{:else if child.type === "function"}
  {@const functionCall = castToFunctionCall(child)}
  {@const icon = $program.getIcon(functionCall.id)}
  {#if icon === "red-question-mark"}
    <Item value={functionCall} emoji={"gear"} />
    {:else}
    <Item value={functionCall} emoji={icon} />
  {/if}
{/if}
{/if}

<style>
  p {
    margin: 0;
    padding: 0.5rem;
    text-align: center;
    font-size: 1rem;
  }

  .innerExpression {
    border: var(--sub-message-border);
    margin: .4rem;
    border-radius: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
