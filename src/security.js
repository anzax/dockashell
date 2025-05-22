export class SecurityManager {
  constructor() {
    this.DEFAULT_BLOCKED_COMMANDS = [
      "rm -rf /",
      ":(){ :|:& };:",  // fork bomb
      "sudo rm -rf",
      "mkfs",
      "dd if=/dev/zero",
      "sudo passwd"
    ];
  }

  validateCommand(command, projectConfig) {
    if (!command || typeof command !== 'string' || command.trim() === '') {
      throw new Error('Invalid command: must be a non-empty string');
    }

    if (!projectConfig || typeof projectConfig !== 'object') {
      throw new Error('Invalid project configuration');
    }

    // If restricted mode is enabled, apply security checks
    if (projectConfig.security?.restricted_mode) {
      const blockedCommands = Array.isArray(projectConfig.security.blocked_commands) 
        ? projectConfig.security.blocked_commands 
        : this.DEFAULT_BLOCKED_COMMANDS;
      
      if (this.isBlocked(command, blockedCommands)) {
        throw new Error(`Command blocked by security policy: ${command}`);
      }
    }

    return true;
  }

  isBlocked(command, blockedCommands) {
    if (!Array.isArray(blockedCommands)) {
      return false;
    }

    const normalizedCommand = command.trim().toLowerCase();
    
    return blockedCommands.some(blocked => {
      if (!blocked || typeof blocked !== 'string') {
        return false;
      }
      
      const normalizedBlocked = blocked.toLowerCase();
      
      // Exact match
      if (normalizedCommand === normalizedBlocked) {
        return true;
      }
      
      // Check if command starts with blocked pattern
      if (normalizedCommand.startsWith(normalizedBlocked)) {
        return true;
      }
      
      // Check for pattern within command (with word boundaries)
      try {
        const regex = new RegExp(`\\b${normalizedBlocked.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
        return regex.test(normalizedCommand);
      } catch (error) {
        // If regex fails, fall back to simple string matching
        return normalizedCommand.includes(normalizedBlocked);
      }
    });
  }

  getMaxExecutionTime(projectConfig) {
    if (!projectConfig || typeof projectConfig !== 'object') {
      return 300; // 5 minutes default
    }
    
    const maxTime = projectConfig.security?.max_execution_time;
    
    // Validate timeout value
    if (typeof maxTime === 'number' && maxTime > 0 && maxTime <= 3600) {
      return maxTime;
    }
    
    return 300; // 5 minutes default
  }
}
