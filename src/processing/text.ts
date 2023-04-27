import { Builder, By, Key, ThenableWebDriver, until } from 'selenium-webdriver';
import { Message } from '../openai';
import { Config } from '../config';
import spacy from 'spacy-nlp';
import { Python } from '../spacy';
import { countMessageTokens } from '../token-counter';
import { TiktokenModel } from '@dqbd/tiktoken';
import { getMemory } from '../memory';
import { createChatCompletion } from '../llm.utils';
import { Logger } from '../log/logger';

async function scrollToPercentage (driver: ThenableWebDriver, ratio: number) {
  try {

    if (ratio < 0 || ratio > 1) {
      throw new Error('Percentage should be between 0 and 1');
    }
    await driver.executeScript(`window.scrollTo(0, document.body.scrollHeight * ${ratio})`);
  }
  catch (e) {
    Logger.error(e);
  }
}

function createMessage (chunk: string, question: string): Message {
  return {
    role: 'user',
    content: `"""${chunk}""" Using the above text, answer the following question: "${question}" -- if the question cannot be answered using the text, summarize the text.`,
  };
}

async function splitText (text: string, maxLength: number = Config.browseChunkMaxLength, model = Config.fastLLMModel, question: string = '') {
  const flattenedParagraphs = text.split('\n').join(' ');
  const sentences = await Python.parseSentences(flattenedParagraphs);

  const chunks: string[] = [];
  let current: string = '';

  let i = 0;
  for (const sentence of sentences) {
    i++;
    // console.log(`Processing sentence ${i}/${sentences.length}, current length: ${current.length}`);
    const messageWithAdditionalSentence = [
      createMessage(`${current ? current + ' ' : ''}${sentence}`, question),
    ];

    try {
      let expectedTokenUsage = await tokenUsageOfChunk(messageWithAdditionalSentence, model) + 1;
      // console.log(`Expected tokens usage: ${expectedTokenUsage} (max = ${maxLength})`);

      if (expectedTokenUsage <= maxLength) {
        // chunks.push(sentence);
        current = (current ? (current + ' ') : '') + sentence;
      }
      else {
        // console.log('pushing chunk');
        chunks.push(current);
        current = '';
        const messageThisSentenceOnly = [
          createMessage(sentence, question),
        ];
        expectedTokenUsage = await tokenUsageOfChunk(messageThisSentenceOnly, model) + 1;

        if (expectedTokenUsage > maxLength) {
          throw new Error(`Sentence is too long in webpage: ${expectedTokenUsage} tokens`);
        }
      }
    }
    catch (err: any) {
      // console.error('Error splitting text...', err);
      throw new Error(err);
    }
  }
  if (current !== '') {
    chunks.push(current);
  }

  return chunks;
}

/*
function* splitTextGenerator (sentences: string[], maxLength: number = Config.browseChunkMaxLength, model = Config.fastLLMModel, question: string = ''): Generator<string> {
  let currentChunk: string[] = [];

  for (const sentence in sentences) {
    const messageWithAdditionalSentence = [
      createMessage(`${currentChunk.join(' ')} ${sentence}`, question),
    ];

    let expectedTokenUsage = tokenUsageOfChunk(messageWithAdditionalSentence, model) + 1;

    if (expectedTokenUsage <= maxLength) {
      currentChunk.push(sentence);
    }
    else {
      yield currentChunk.join(' ');
      currentChunk = [ sentence ];
      const messageThisSentenceOnly = [
        createMessage(currentChunk.join(' '), question),
      ];
      expectedTokenUsage = tokenUsageOfChunk(messageThisSentenceOnly, model) + 1;

      if (expectedTokenUsage > maxLength) {
        throw new Error(`Sentence is too long in webpage: ${expectedTokenUsage} tokens`);
      }
    }
  }

  if (currentChunk) {
    yield currentChunk.join(' ');
  }
}
*/

async function tokenUsageOfChunk (messages: Message[], model: TiktokenModel) {
  return countMessageTokens(messages, model);
}

export async function summarizeText (url: string, text: string, question: string, driver?: ThenableWebDriver) {
  if (!text) {
    return 'Error: no text to summarize';
  }

  const model = Config.fastLLMModel;
  const textLength = text.length;
  console.log(`Text length: ${textLength} chartacters.`);

  const summaries: string[] = [];
  // const flattenedParagraphs = text.split('\n').join(' ');
  // const sentences = await Python.parseSentences(flattenedParagraphs);
  // Logger.log('sentences', sentences);
  const chunks = await splitText(text, Config.browseChunkMaxLength, model, question);

  const scrollRatio = 1 / chunks.length;

  let i: number = 0;
  for (const chunk of chunks) {
    if (driver) {
      await scrollToPercentage(driver, scrollRatio * i);
    }
    console.log(`Adding chunk ${i+1} / ${chunks.length} to memory`);
    let memoryToAdd = `Source: ${url}\n Raw content part#${i+1}: ${chunk}`;
    const memory = getMemory();
    await memory.add(memoryToAdd);

    const messages = [ createMessage(chunk, question) ];
    const tokens = await tokenUsageOfChunk(messages, model);
    console.log(`Summarizing chunk ${i+1} / ${chunks.length} of length ${chunk.length} characters, or ${tokens} tokens`);

    console.log('messages', messages);
    const summary = await createChatCompletion(messages, model);
    summaries.push(summary);
    console.log(`Adding chunk ${i+1} summary to memory, of length ${summary.length} characters`);
    memoryToAdd = `Source: ${url}\n Content summary part#${i+1}: ${summary}`;
    await memory.add(memoryToAdd);
    i += 1;
  }

  console.log(`Summarized ${chunks.length} chunks`);

  const combinedSummary = summaries.join('\n');
  const messages = [ createMessage(combinedSummary, question) ];

  return await createChatCompletion(messages, model);
}