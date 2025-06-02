import ProjectManager from '../../core/project-manager.js';

export function validateProjectNameWithSuggestions(name) {
  const pm = new ProjectManager();
  try {
    pm.validateProjectName(name);
    return { valid: true };
  } catch (error) {
    const suggestions = [];
    if (/[A-Z]/.test(name)) {
      suggestions.push(`Try: ${name.toLowerCase()}`);
    }
    if (/[^a-z0-9_-]/.test(name)) {
      const fixed = name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      suggestions.push(`Try: ${fixed}`);
    }
    return { valid: false, error: error.message, suggestions };
  }
}
