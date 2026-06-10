import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

async function main() {
  const openai = createOpenAI({ apiKey: 'dummy' });
  const result = await streamText({
    model: openai('gpt-3.5-turbo'),
    prompt: 'hello'
  });
  let obj = result;
  do {
    console.log(Object.getOwnPropertyNames(obj));
    obj = Object.getPrototypeOf(obj);
  } while (obj);
}

main().catch(console.error);
