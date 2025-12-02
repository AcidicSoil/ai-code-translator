
import { LMStudioClient } from "@lmstudio/sdk";

const client = new LMStudioClient();

async function main() {
    const llmOnly = await client.llm.listLoaded();
    const embeddingOnly = await client.embedding.listLoaded();

    console.log("Loaded LLM models:", llmOnly);
    console.log("Loaded embedding models:", embeddingOnly);
}

main();
