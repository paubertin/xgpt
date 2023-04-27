import url from 'url';

export async function makeRequest(api: string, endpoint: string, opts: any, method = 'POST') {
  const headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
  const credentials = 'same-origin';
  const body = JSON.stringify(opts);
  const apiUrl = url.resolve(api, endpoint);
  try {
      const res = await fetch(apiUrl, { method, headers, credentials, body });
      return await res.json();
  }
  catch(err) {
      console.log(`Error fetching data from API: ${api}`)
  }
}

export async function getSimilarity(api: string, model: string, text1: string, text2: string) {
  const json = await makeRequest(api, '/similarity', { model, text1, text2 });
  return json.similarity;
}