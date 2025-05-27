export class SecurityManager {
  constructor() {}

  validateCommand(command, projectConfig) {
    if (!command || typeof command !== 'string' || command.trim() === '') {
      throw new Error('Invalid command: must be a non-empty string');
    }

    if (!projectConfig || typeof projectConfig !== 'object') {
      throw new Error('Invalid project configuration');
    }

    // Command validation can be extended if needed

    return true;
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

  /**
   * Get default security settings
   * @returns {Object} Default security configuration
   */
  getDefaultSecuritySettings() {
    return {
      max_execution_time: 300,
    };
  }
}
