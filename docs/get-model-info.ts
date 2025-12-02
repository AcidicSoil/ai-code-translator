
import { LMStudioClient } from "@lmstudio/sdk";

const client = new LMStudioClient();

async function getLlmInfo() {
    const model = await client.llm.model();
    const modelInfo = await model.getInfo();

    console.info("LLM Model Key", modelInfo.modelKey);
    console.info("LLM Current Context Length", model.contextLength);
    console.info("LLM Model Trained for Tool Use", modelInfo.trainedForToolUse);
}

async function getEmbeddingInfo() {
    const model = await client.embedding.model();
    const modelInfo = await model.getInfo();

    console.info("Embedding Model Key", modelInfo.modelKey);
    console.info("Embedding Current Context Length", modelInfo.contextLength);
}

async function main() {
    await getLlmInfo();
    await getEmbeddingInfo();
}

main();
