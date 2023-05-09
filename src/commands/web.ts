import JSSoup from 'jssoup';
const Soup = JSSoup.default;
import fs from 'fs';

import { Builder, By, Key, ThenableWebDriver, until } from 'selenium-webdriver';
import chrome, { Options as ChromeOptions } from 'selenium-webdriver/chrome.js';
import { summarizeText } from '../processing/text.js';
import { extractHyperlinks, formatHyperlinks } from '../processing/html.js';
import { Logger } from '../logs.js';
import { Message } from '../openai.js';
import { createChatCompletion } from '../llm.utils.js';
import { Config } from '../config/index.js';

const invalidProtocolRegex = /^([^\w]*)(javascript|data|vbscript)/im;
const htmlEntitiesRegex = /&#(\w+)(^\w|;)?/g;
const htmlCtrlEntityRegex = /&(newline|tab);/gi;
const ctrlCharactersRegex =
  /[\u0000-\u001F\u007F-\u009F\u2000-\u200D\uFEFF]/gim;
const urlSchemeRegex = /^.+(:|&colon;)/gim;
const relativeFirstCharacters = [".", "/"];

function isRelativeUrlWithoutProtocol(url: string): boolean {
  return relativeFirstCharacters.indexOf(url[0]) > -1;
}

// adapted from https://stackoverflow.com/a/29824550/2601552
function decodeHtmlCharacters(str: string) {
  return str.replace(htmlEntitiesRegex, (match, dec) => {
    return String.fromCharCode(dec);
  });
}

function sanitizeUrl(url: string) {
  const sanitizedUrl = decodeHtmlCharacters(url || "")
    .replace(htmlCtrlEntityRegex, "")
    .replace(ctrlCharactersRegex, "")
    .trim();

  if (!sanitizedUrl) {
    return "about:blank";
  }

  if (isRelativeUrlWithoutProtocol(sanitizedUrl)) {
    return sanitizedUrl;
  }

  const urlSchemeParseResults = sanitizedUrl.match(urlSchemeRegex);

  if (!urlSchemeParseResults) {
    return sanitizedUrl;
  }

  const urlScheme = urlSchemeParseResults[0];

  if (invalidProtocolRegex.test(urlScheme)) {
    return "about:blank";
  }

  return sanitizedUrl;
}

function checkLocalFileAccess (url: string) {
  const localPrefixes = [
    "file:///",
    "file://localhost/",
    "file://localhost",
    "http://localhost",
    "http://localhost/",
    "https://localhost",
    "https://localhost/",
    "http://2130706433",
    "http://2130706433/",
    "https://2130706433",
    "https://2130706433/",
    "http://127.0.0.1/",
    "http://127.0.0.1",
    "https://127.0.0.1/",
    "https://127.0.0.1",
    "https://0.0.0.0/",
    "https://0.0.0.0",
    "http://0.0.0.0/",
    "http://0.0.0.0",
    "http://0000",
    "http://0000/",
    "https://0000",
    "https://0000/",
  ];
  return localPrefixes.some((prefix) => url.startsWith(prefix));
}

async function fetchWithTimeout(resource: RequestInfo | URL, options?: RequestInit & { timeout?: number }) {
  const timeout = options?.timeout ?? 10000;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const response = await fetch(resource, {
    ...options,
    signal: controller.signal  
  });
  clearTimeout(id);

  return response;
}

async function getResponse (url: string, timeout: number = 10000) {
  try {
    if (checkLocalFileAccess(url)) {
      throw new Error('Access to local files is restricted');
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new Error('Invalid URL format');
    }

    const sanitizedUrl = sanitizeUrl(url);

    const response = await fetchWithTimeout(sanitizedUrl, { timeout });

    if (response.status >= 400) {
      return {
        response: undefined,
        error: `Error: HTTP ${response.status} error`,
      }
    }

    return {
      response,
      error: undefined,
    }
  }
  catch (err: any) {
    return {
      response: undefined,
      error: `Error: ${err.toString()}`,
    }
  }
}

export async function scrapeText (url: string) {
  const { response, error } = await getResponse(url);
  if (error) {
    return error;
  }
  if (!response) {
    return 'Could not get response';
  }

  const soup = new Soup(await response.text());

  const text = soup.getText();
  const lines = text.split('\n').map((line) => line.trim());
}

/**
 * Browse a website and return the answer and links to the user
 */
export async function browseWebsite (url: string, question: string) {
  const { driver, text } = await scrapeTextWithSelenium(url);
  await addHeader(driver);
  const summaryText = await summarizeText(url, text, question, driver);
  let links = await scrapeLinksWithSelenium(driver, url);
  
  let selectedLinks: string[] = [];
  if (links.length > 5) {
    if (Config.smartLinksParsing) {
      let total = [ ...links ];
      let i = 1;
      while (total.length) {
        console.log('iteration', i);
        console.log('length remaining', total.length);
        i++;
        const part = total.slice(0, 50);
        const message: Message = {
          role: 'user',
          content: `"""${part.map((link) => `- ${link}`).join('\n')}""" Using the above list of url links (short description and link), select at most 5 items that most likely answer or correspond to this question: "${question}" and to this summary: "${summaryText}".
  If you think there are none, pick 5.
  Only respond with a JSON array of string (short description and link), no explanations or any comment.`,
        };
        const link5 = await createChatCompletion([ message ], Config.fastLLMModel);
        try {
          selectedLinks.push(JSON.parse(link5));
        }
        catch {
          Logger.info('Failed to parse json links... skipping this batch');
        }
        total.splice(0, 50);
      }
      if (selectedLinks.length) {
        const message: Message = {
          role: 'user',
          content: `"""${selectedLinks.map((link) => `- ${link}`).join('\n')}""" Using the above list of url links (short description and link), select at most 5 items that most likely answer or correspond to this question: "${question}" and to this summary: "${summaryText}".
  If you think there are none, pick 5.
  Only respond with a JSON array of string (short description and link), no explanations or any comment.`,
        };
        const link5 = await createChatCompletion([ message ], Config.fastLLMModel);
        try {
          selectedLinks.push(JSON.parse(link5));
        }
        catch {
          Logger.info('Failed to parse json links... skipping this batch');
        }
      }
      if (selectedLinks.length === 0) {
        selectedLinks = links.slice(0, 5);
      }
    }
    else {
      selectedLinks = links.slice(0, 5);
    }
  }
  else {
    selectedLinks = links;
  }

  await closeBrowser(driver);

  // Logger.log('summary', summaryText);
  // Logger.log('links', links);

  return `Answer gathered from website: ${summaryText} \n\n Links: ${selectedLinks}`;
}

/**
 * Scrape text from a website using selenium
 */
export async function scrapeTextWithSelenium (url: string) {
  const options = new ChromeOptions();
  options.addArguments('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.5615.49 Safari/537.36');
  options.addArguments('--disable-dev-shm-usage', '--remote-debugging-port=9222', '--no-sandbox');
  options.addArguments('--headless', '--disable-gpu');

  const driver = new Builder().forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  await driver.get(url);

  await driver.wait(until.elementLocated(By.css('body')), 10000);

  const pageSource = await driver.executeScript<string>('return document.body.outerHTML');
  // console.log('pageSource', pageSource);

  const soup = new Soup(pageSource);
  soup.findAll('script').forEach((script) => script.extract());
  soup.findAll('style').forEach((style) => style.extract());

  const rawText = soup.getText();

  const lines = rawText.split('\n').map((line) => line.trim());
  const chunks: string[] = [];
  for (const line of lines) {
    for (const phrase of line.split('  ')) {
      chunks.push(phrase.trim());
    }
  }
  const text = chunks.filter(Boolean).join('\n');

  return {
    driver,
    text,
  };
}

export async function scrapeLinksWithSelenium (driver: ThenableWebDriver, url: string) {
  const pageSource = await driver.getPageSource();
  const soup = new Soup(pageSource);
  soup.findAll('script').forEach((script) => script.extract());
  soup.findAll('style').forEach((style) => style.extract());

  const hyperlinks = extractHyperlinks(soup, url);

  return formatHyperlinks(hyperlinks);
}

async function addHeader (driver: ThenableWebDriver) {
  const overlay = (await fs.promises.readFile('./src/utils/overlay.js')).toString();
  await driver.executeScript(overlay);
}

async function closeBrowser (driver: ThenableWebDriver) {
  await driver.quit();
}