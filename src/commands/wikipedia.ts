const HTML_TAG_CLEANER = /<.*?>|&([a-z0-9]+|#[0-9]{1,6}|#x[0-9a-f]{1,6});/g;

export async function wikipediaSearch (query: string, numResults: number = 5) {
  try {
    const results = await fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&utf8=1&formatversion=2&srsearch=%${query}%27`);
    const response = await results.json();
    const items: { title: string; summary: string; url: string }[] = [];
    for (const item of (response.query?.search ?? [])) {
      items.push({
        title: item.title,
        summary: item.snippet.replaceAll(HTML_TAG_CLEANER, ''),
        url: `https://en.wikipedia.org/?curid=${item.pageid}`,
      });
      if (items.length === numResults) {
        break;
      }
    }

    return JSON.stringify(items);
  }
  catch (err: any) {
    return `wikipediaSearch on query: ${query} raised error: ${err.message}"`;
  }
}
