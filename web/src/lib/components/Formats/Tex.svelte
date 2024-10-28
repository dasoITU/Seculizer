<script lang="ts">
  export let input: string;
  import katex from "katex";
  import "./Tex.css"
  let TexOutput: string = "";
  $: {
    if(input.startsWith("$")) input = input.slice(1);
    if(input.endsWith("$")) input = input.slice(0, -1);
    TexOutput = katex.renderToString(input, {
      throwOnError: false,
      displayMode: true,
    });
  }
</script>

{@html TexOutput}
