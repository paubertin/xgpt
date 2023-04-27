import JSSoup, { SoupTag } from "jssoup";
import url from 'url';

export function extractHyperlinks (soup: JSSoup, baseUrl: string) {
  const links = soup.findAll<SoupTag>('a').filter((tag) => tag.attrs.href !== undefined);
  return links.map((link) => {
    return {
      text: link.getText(),
      url: new URL(link.attrs.href, baseUrl),
    };
  });
}

export function formatHyperlinks (hyperlinks: { text: string; url: URL}[]) {
  return hyperlinks.map((link) => {
    return `${link.text} (${link.url.toString()})`;
  });
}