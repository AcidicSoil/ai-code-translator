
import { LMStudioClient } from "@lmstudio/sdk";

/**
 * Note: In order for this to work, you need to have the LM Studio app running
 */

// Create a new client
const client = new LMStudioClient();

async function main() {
  // List all the downloaded models
  const models = await client.system.listDownloadedModels();

  console.log("Downloaded models:", models);

  if (models.length === 0) {
    console.log("No models downloaded yet. Please download a model in the LM Studio app.");
    return;
  }

  // Pick the first model
  const selectedModel = models[0];

  console.log("Loading model:", selectedModel.path);

  // Load the model
  const model = await client.llm.load(selectedModel.path, {
    // You can optionally set configuration for the model here
  });

  console.log("Model loaded:", model.config);

  // Create a completion
  const completion = await model.complete("Once upon a time,");

  console.log("Completion:", completion.choices[0].text);
}

main();
