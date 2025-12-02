
import { LMStudioClient } from "@lmstudio/sdk";
const client = new LMStudioClient();

async function main() {
    // Get the Current Model with .model()
    // If you already have a model loaded in LM Studio (either via the GUI or `lms load`), you can use it by calling `.model()` without any arguments.
    const model = await client.llm.model();
    console.log("Currently loaded model:", model.config);

    // Get a Specific Model with .model("model-key")
    // If you want to use a specific model, you can provide the model key as an argument to `.model()`.
    // Calling `.model("model-key")` will load the model if it's not already loaded, or return the existing instance if it is.
    const specificModel = await client.llm.model("Qwen/Qwen2-7B-Instruct-GGUF");
    console.log("Specific model:", specificModel.config);

    // Load a New Instance of a Model with .load()
    // Use `load()` to load a new instance of a model, even if one already exists. This allows you to have multiple instances of the same or different models loaded at the same time.
    const llama = await client.llm.load("Qwen/Qwen2-7B-Instruct-GGUF");
    const another_llama = await client.llm.load("Qwen/Qwen2-7B-Instruct-GGUF", {
        identifier: "second-llama"
    });

    console.log("First llama instance:", llama.config);
    console.log("Second llama instance:", another_llama.config);


    // Unload a Model from Memory with .unload()
    // Once you no longer need a model, you can unload it by simply calling `unload()` on its handle.
    await llama.unload();
    await another_llama.unload();
    console.log("Unloaded models");

}

main();
