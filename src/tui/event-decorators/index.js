/**
 * @typedef {{type: string, text: string, color?: string, icon?: string, bold?: boolean}} RenderLine
 */

/**
 * @typedef {Object} EventDecorator
 * @property {string} kind
 * @property {(entry: any, width: number) => RenderLine} headerLine
 * @property {(entry: any, width: number) => RenderLine} contentCompact
 * @property {(entry: any, width: number) => RenderLine[]} contentFull
 */

import { command } from './command.js';
import { applyPatch } from './applyPatch.js';
import { writeFile } from './writeFile.js';
import { note } from './note.js';
import { unknown } from './unknown.js';

/** @type {Map<string, EventDecorator>} */
const decorators = new Map([
  [command.kind, command],
  [applyPatch.kind, applyPatch],
  [writeFile.kind, writeFile],
  [note.kind, note],
  [unknown.kind, unknown],
]);

/**
 * Lookup decorator by trace "kind".
 * @param {string} kind
 * @returns {EventDecorator}
 */
export function getDecorator(kind) {
  return decorators.get(kind) || decorators.get('unknown');
}

/**
 * Register or override a decorator at runtime.
 * @param {EventDecorator} deco
 */
export function registerDecorator(deco) {
  decorators.set(deco.kind, deco);
}
