import { atom } from 'nanostores';

export const $activeProject = atom(null);

export function setActiveProject(name) {
  $activeProject.set(name);
}
