import fs from 'fs';
import path from 'path';
import { Config } from './config';
import { ValueError } from '@d4c/numjs/build/main/lib/errors';
import { formatWithOptions } from 'util';

export const workspacePath = path.join(process.cwd(), 'xpgt-workspace');

if (!fs.existsSync(workspacePath)) {
  fs.mkdirSync(workspacePath);
}

export function pathInWorkspace (relativePath: string) {
  return safePathJoin(workspacePath, relativePath);
}

export function safePathJoin (base: string, paths: string) {
  const basePath = path.resolve(base);
  const joinedPath = path.resolve(path.join(basePath, paths));

  if (Config.restrictToWorkspace && !isSubDir(base, joinedPath)) {
    throw new ValueError(`Attempted to access path '${joinedPath}' outside of workspace '${base}'.`)
  }
  return joinedPath;
}

function isSubDir (parent: string, dir: string) {
  if (parent === dir) return true;
  const relative = path.relative(parent, dir);
  return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative);
 }