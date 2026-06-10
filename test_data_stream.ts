import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

async function main() {
  const openai = createOpenAI({ apiKey: 'dummy' });
  const result = await streamText({
    model: openai('gpt-3.5-turbo'),
    prompt: 'hello'
  });
  console.log("Does toDataStreamResponse exist?", typeof result.toDataStreamResponse);
  if (result.toDataStreamResponse) {
    const res = result.toDataStreamResponse();
    console.log("Headers:", res.headers);
  }
}

main().catch(console.error);
