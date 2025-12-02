Prompts are written as if you paste each one into gemini-cli and run them in order.
They focus only on provider model implementations for the three stacks, piece-wise.

---

Section A — `ai-sdk-provider-gemini-cli`

1. Provider capabilities survey

`Use open-aware to: Inspect the ai-sdk-provider-gemini-cli code and list all exported provider/model factories and types (e.g. createGemini, model config types, streaming helpers). Focus only on what is required to instantiate a model and send a text (or chat) completion/streaming request. repositories = ["<ORG/ai-sdk-provider-gemini-cli>"]`

2. Minimal Gemini provider wiring

`Use open-aware to: Based on the exported APIs you just listed, design a minimal Gemini provider implementation module that exposes a single function createGeminiProvider({ apiKey }): Provider which returns an object with a run(modelId, messages, options) method that performs a streaming completion. Provide TypeScript code that compiles against ai-sdk-provider-gemini-cli. repositories = ["<ORG/ai-sdk-provider-gemini-cli>"]`

3. Model registry for Gemini

`Use open-aware to: In the same repository, add a Gemini-specific model registry file that maps logical model names (e.g. "gemini-1.5-flash", "gemini-1.5-pro") to the underlying ai-sdk-provider-gemini-cli model identifiers and default options. Generate a models.ts module that exports ModelId, ModelConfig, GEMINI_MODELS, and getGeminiModelConfig(modelId). repositories = ["<ORG/ai-sdk-provider-gemini-cli>"]`

4. Unified provider interface adaptation

`Use open-aware to: Given the existing provider interface in the repo (Provider, ProviderRequest, streamTranslate or equivalent), extend it with a GeminiProvider implementation that internally uses createGeminiProvider and the GEMINI_MODELS registry. The implementation must: 1) resolve modelId via getGeminiModelConfig, 2) attach the correct provider type "gemini-cli", 3) perform streaming in the same format as the other providers. Output a full TypeScript file for GeminiProvider. repositories = ["<ORG/ai-sdk-provider-gemini-cli>"]`

5. Provider registration

`Use open-aware to: Locate the provider registry/initializer (e.g. providers/index.ts or similar). Show the exact code changes required to: 1) import GeminiProvider, 2) register it under id "gemini-cli", and 3) ensure it is discoverable by the central model registry / factory. repositories = ["<ORG/ai-sdk-provider-gemini-cli>"]`

6. Open-Aware integration prompt for Gemini

`Use open-aware to: Using the GeminiProvider you just designed, show a concrete example of calling the provider to answer an open-aware get_context or deep_research style query. Include: model selection ("gemini-1.5-pro"), API key injection, streaming loop, and how the response is transformed into the same shape as other providers. repositories = ["<ORG/ai-sdk-provider-gemini-cli>"]`

---

Section B — `@ai-sdk/openai-compatible`

7. Inventory existing OpenAI-compatible provider

`Use open-aware to: Analyze the @ai-sdk/openai-compatible source and list all factory functions and types that wrap an OpenAI-style /v1/chat/completions endpoint (e.g. createOpenAICompatible). Focus on what’s necessary to: pass a baseUrl, apiKey, model, and messages; receive a streaming response; and parse tokens. repositories = ["<ORG/ai-sdk/openai-compatible>"]`

8. Generic OpenAI-compatible provider wrapper

`Use open-aware to: Design a generic OpenAICompatibleProvider abstraction with signature createOpenAICompatibleProvider({ id, baseUrlEnvVar, defaultHeadersEnvVar, apiKeyEnvVar }): Provider that uses @ai-sdk/openai-compatible under the hood. The Provider must expose run(modelId, messages, options) and support streaming. Target TypeScript and the existing provider interface. repositories = ["<ORG/ai-sdk/openai-compatible>"]`

9. Model registry for multiple OpenAI-compatible backends

`Use open-aware to: Create a models-openai-compatible.ts file that lists models for several OpenAI-compatible backends (e.g. "openai:gpt-4.1", "groq:llama-3-70b", "openrouter:gpt-4.1-mini") with: id, label, provider: "openai-compatible", baseUrl, and any special headers. Provide code that can be consumed by the generic OpenAICompatibleProvider to decide which baseUrl and headers to use for a given modelId. repositories = ["<ORG/ai-sdk/openai-compatible>"]`

10. Provider multiplexing by modelId

`Use open-aware to: Extend the generic OpenAICompatibleProvider so that run(modelId, messages, options) looks up model metadata from models-openai-compatible.ts, chooses the correct baseUrl and headers, and calls @ai-sdk/openai-compatible accordingly. Ensure streaming output is normalized to the same token-stream shape as other providers. Provide complete code for this extension. repositories = ["<ORG/ai-sdk/openai-compatible>"]`

11. Integration into central provider registry

`Use open-aware to: Modify the central provider registry in the host repo to register the OpenAICompatibleProvider under a stable id (e.g. "openai-compatible"). Show the diff that: 1) imports the provider, 2) registers it, 3) ensures that modelId lookups for any "openai-compatible" model route to this provider. repositories = ["<ORG/ai-sdk-provider-gemini-cli>", "<ORG/ai-sdk/openai-compatible>"]`

12. Example: switching between Gemini and OpenAI-compatible

`Use open-aware to: Produce a code example (TypeScript) that demonstrates selecting a model from a unified registry (e.g. "gemini-1.5-pro" vs "openai:gpt-4.1") and calling a single translate() function that internally routes to either the GeminiProvider or OpenAICompatibleProvider. Keep the function signature provider-agnostic. repositories = ["<ORG/ai-sdk-provider-gemini-cli>", "<ORG/ai-sdk/openai-compatible>"]`

---

Section C — `@lmstudio/sdk`

13. Capabilities survey for @lmstudio/sdk

`Use open-aware to: Inspect @lmstudio/sdk and list the main APIs used to: 1) connect to a local/remote LM Studio server, 2) list available models, 3) run text or chat completions with streaming, and 4) configure generation parameters. repositories = ["<ORG/lmstudio/sdk>"]`

14. LM Studio provider implementation

`Use open-aware to: Implement an LMStudioProvider that conforms to the same Provider interface used by the Gemini and OpenAI-compatible providers. The provider should: 1) accept a modelId that maps directly to LM Studio’s model identifiers, 2) connect via @lmstudio/sdk, 3) perform streaming completions, and 4) normalize output tokens to the shared stream format. Output a complete TypeScript module. repositories = ["<ORG/lmstudio/sdk>"]`

15. LM Studio model registry

`Use open-aware to: Create a models-lmstudio.ts file that can either: a) statically list common LM Studio models, or b) dynamically resolve models via @lmstudio/sdk’s model listing API. Provide a ModelConfig[] structure consistent with the other registries and a getLMStudioModelConfig(modelId) helper. repositories = ["<ORG/lmstudio/sdk>"]`

16. Provider registration and environment handling

`Use open-aware to: Show the changes required in the provider registry to register LMStudioProvider under id "lmstudio", including any environment-driven configuration (host, port, TLS). The code must default to sensible local settings but allow override via environment variables. repositories = ["<ORG/ai-sdk-provider-gemini-cli>", "<ORG/lmstudio/sdk>"]`

17. Unified provider + model selection example

`Use open-aware to: Generate a full TypeScript example that imports a unified model registry containing Gemini, OpenAI-compatible, and LM Studio models, exposes a selectModel(modelId) function, and a runModel({ modelId, messages }) function that dispatches to the correct provider. Ensure the example compiles against ai-sdk-provider-gemini-cli, @ai-sdk/openai-compatible, and @lmstudio/sdk. repositories = ["<ORG/ai-sdk-provider-gemini-cli>", "<ORG/ai-sdk/openai-compatible>", "<ORG/lmstudio/sdk>"]`

18. End-to-end smoke test prompt

`Use open-aware to: Design a minimal end-to-end smoke test script that: 1) iterates over a small set of models (one per provider: Gemini, OpenAI-compatible, LM Studio), 2) sends the same trivial prompt, 3) verifies that a non-empty streamed response is received from each, and 4) logs the provider/model id and first 50 characters of the response. Target Node.js + TypeScript. repositories = ["<ORG/ai-sdk-provider-gemini-cli>", "<ORG/ai-sdk/openai-compatible>", "<ORG/lmstudio/sdk>"]`
