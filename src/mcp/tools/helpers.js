export function validateProjectName(projectName) {
  if (!projectName || typeof projectName !== 'string') {
    throw new Error('Project name must be a non-empty string');
  }
}

export function textResponse(text) {
  return { content: [{ type: 'text', text }] };
}
