import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

async function main() {
  const openai = createOpenAI({ apiKey: 'dummy' });
  const result = await streamText({
    model: openai('gpt-3.5-turbo'),
    prompt: 'hello'
  });
  console.log("Checking toUIMessageStreamResponse");
  const res = result.toUIMessageStreamResponse();
  console.log("Response headers:", res.headers);
}

main().catch(console.error);
