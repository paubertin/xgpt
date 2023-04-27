import fs from 'fs';
import path from 'path';
import { Config } from './config';
import { ValueError } from '@d4c/numjs/build/main/lib/errors';

export const workspacePath = path.join(process.cwd(), 'xgpt-workspace');

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

 function isRelativeTo (pathName: string, root: string) {
  if (pathName === root) return true;
  const relative = path.relative(root, pathName);
  return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative);
 }

 export class Workspace {
  private _root: string;
  private _restricted: boolean;

  public constructor (rootPath: string, restrictToWorkspace: boolean = true) {
    this._root = rootPath;
    this._restricted = restrictToWorkspace;
  }

  public get root () {
    return this._root;
  }

  public get restricted () {
    return this._restricted;
  }

  /**
   * Get the full path for an item in the workspace.
   */
  public getPath(relativePath: string) {
    return Workspace.sanitizePath(relativePath, this._root, this._restricted);
  }

  /**
   * Create a workspace directory and return the path to it
   */
  public static makeWorkspace (dir: string) {
    const directory = this.sanitizePath(dir);
    fs.mkdirSync(directory, { recursive: true });
    return directory;
  }

  /**
   * Resolve the relative path within the given root if possible.
   */
  private static sanitizePath (relativePath: string, root: string | undefined = undefined, restrictToRoot: boolean = true) {
    if (!root) {
      return path.resolve(relativePath);
    }

    if (path.isAbsolute(relativePath)) {
      throw new Error(`Attempted to access absolute path '${relativePath}' in workspace '${root}'`);
    }

    const fullPath = path.resolve(path.join(root, relativePath));

    if (restrictToRoot && !isRelativeTo(fullPath, root)) {
      throw new Error(`Attempted to access absolute path '${fullPath}' in workspace '${root}'`);
    }

    return fullPath;
  }

 }