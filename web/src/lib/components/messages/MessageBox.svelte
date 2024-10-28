<script lang="ts">
  import ExpressionBox from "./ExpressionBox.svelte";
  import type { Expression as ExpressionAST, Id} from "$lang/types/parser/interfaces";
  interface Props {
    messageExpressions: ExpressionAST[];
    participants: {from:Id, to:Id};
    isSubmessage?: boolean;
  }

  let { messageExpressions, participants, isSubmessage = false }: Props = $props();
</script>

<div class="message" class:subMessage={isSubmessage}>
  {#each messageExpressions as messageExpression}
      <ExpressionBox expression={messageExpression} {participants} />
  {/each}
</div>

<style>
  .message, .message :global(.subMessage) {
    position: relative;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    align-items: stretch;
    background: var(--message-bg);
    width: fit-content;
    padding: 0rem 1rem;
    font-size: 1.2rem;
    border-radius: 15px;
    min-height: 2rem;
    max-width: 15rem;
  }
  .message:global(:has(.sign-icon)), .message:global(:has(.encrypt-icon)) {
    margin-bottom: 2rem;
  }
  .message :global(.innerExpression:has(.sign-icon)), .message :global(.innerExpression:has(.encrypt-icon)) {
    margin-bottom: 1.9rem;
  }

</style>
