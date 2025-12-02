// utils/providers/lmstudio.ts
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { streamText } from 'ai';
import { Provider, ProviderRequest } from './base';
import endent from 'endent';

const createPrompt = (
  inputLanguage: string,
  outputLanguage: string,
  inputCode: string,
) => {
    if (inputLanguage === 'Natural Language') {
    return endent`
    You are an expert programmer in all programming languages. Translate the natural language to "${outputLanguage}" code. Do not include

Example translating from natural language to JavaScript:

Natural language:
Print the numbers 0 to 9.

JavaScript code:
for (let i = 0; i < 10; i++) {
      console.log(i);
    }

Natural language:
${inputCode}

${outputLanguage} code (no ):
    `;
} else if (outputLanguage === 'Natural Language') {
    return endent`
    You are an expert programmer in all programming languages. Translate the "${inputLanguage}" code to natural language in plain English that the average adult could understand. Respond as bullet points starting with -.

Example translating from JavaScript to natural language:

JavaScript code:
for (let i = 0; i < 10; i++) {
        console.log(i);
    }

Natural language:
Print the numbers 0 to 9.

    ${inputLanguage} code:
    ${inputCode}

    Natural language:
    `;
} else {
    return endent`
    You are an expert programmer in all programming languages. Translate the "${inputLanguage}" code to "${outputLanguage}" code. Do not include

Example translating from JavaScript to Python:

JavaScript code:
for (let i = 0; i < 10; i++) {
        console.log(i);
    }

Python code:
for i in range(10):
        print(i)

    ${inputLanguage} code:
    ${inputCode}

    ${outputLanguage} code (no ):
    `;
}
};

const lmstudio = createOpenAICompatible({
    name: 'lm-studio',
    baseURL: 'http://localhost:1234/v1',
});

const streamTranslate: Provider['streamTranslate'] = async ({
    inputLanguage,
    outputLanguage,
    inputCode,
    model,
}) => {
    const prompt = createPrompt(inputLanguage, outputLanguage, inputCode);

    const result = await streamText({
        model: lmstudio(model),
        system: prompt,
        messages: [],
    });

    return result.toReadableStream();
};

export const LMStudioProvider: Provider = {
    id: 'lmstudio',
    streamTranslate,
};
