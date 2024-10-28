<script lang="ts">
  import katex from "katex";
  import "./Tex.css";
  interface Props {
    input: string;
  }

  let { input = $bindable() }: Props = $props();
  let TexOutput: string = $derived.by(() => {
    let snapshotInput = $state.snapshot(input);
    if (snapshotInput.startsWith("$")) snapshotInput = snapshotInput.slice(1);
    if (snapshotInput.endsWith("$")) snapshotInput = snapshotInput.slice(0, -1);
    return katex.renderToString(snapshotInput, {
      throwOnError: false,
      displayMode: true,
    });
  });
</script>

{@html TexOutput}
