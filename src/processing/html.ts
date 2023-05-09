import JSSoup, { SoupTag } from "jssoup";
import _ from 'lodash';

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
  return _.uniqBy(hyperlinks, 'url').map((link) => {
    return {
      text: link.text.replaceAll('\n', '').replaceAll('\t', ''),
      url: link.url,
    };
  })
  .filter((link) => link.text !== '').map((link) => {
    return `${link.text} (${link.url.toString()})`;
  });
}