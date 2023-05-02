import { google } from 'googleapis';
import { Config } from '../config';
import { Command, command } from './command';

const cse = google.customsearch('v1').cse;

/**
 * @command(
    "google",
    "Google Search",
    '"query": "<query>"',
    bool(CFG.google_api_key),
    "Configure google_api_key.",
)
 */

export async function googleSearch (query: string, numResults: number = 8) {
  try {
    const googleApiKey = Config.googleApiKey;
    const customSearchEngineId = Config.customSearchEngineId;

    const result = await cse.list({
      q: query,
      key: googleApiKey,
      num: numResults,
      cx: customSearchEngineId,
    });

    const searchResults = result.data.items ?? [];

    const searchResultsLinks = searchResults.map((r) => r.link).filter(Boolean);

    return JSON.stringify(searchResultsLinks as string[]);
  }
  catch (err: any) {
    return `Error: ${err}`;
  }
}

/*
export const decoratedGoogleSearch = fnDecorator(command({
  name: 'google',
  description: 'Google search',
}), googleSearch);
*/