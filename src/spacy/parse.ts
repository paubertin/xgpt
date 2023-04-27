import { addCache, findCache } from "./cache";
import Type from './type';
import fs from "fs";
export default async (
  ProcessEmitter,
  pyshell,
  { TAG = "Unknown", query = "", timeoutLimit = 30000 },
  i
) => {
  if (!query || query.length <= 0) return Type;

  const cacheItem = findCache(query);

  if (cacheItem) return { tag: TAG, results: cacheItem };

  return new Promise<any>(async (resolve, reject) => {
    let isSent = false;

    pyshell.send(
      JSON.stringify({ query: query.replace(/'|"/gim, ""), tag: TAG })
    );

    pyshell.on('message', (message) => {
      if (!isSent) {
        const { results, tag } = JSON.parse(message);

        addCache(query, results);

        resolve({ tag: tag, results: results });
        isSent = true;
      }
    });

    setTimeout(() => {
      if (!isSent) {
        isSent = true;
        // pyshell.removeAllListeners();
        resolve({ error: "No response received, Time out" });
      }
    }, timeoutLimit);
  });
};
