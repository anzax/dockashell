import { SecurityManager } from '../src/security.js';

describe('SecurityManager', () => {
  let securityManager;
  
  beforeEach(() => {
    securityManager = new SecurityManager();
  });

  test('should initialize successfully', () => {
    expect(securityManager).toBeDefined();
  });

  describe('Command validation', () => {
    const basicConfig = {
      security: {
        restricted_mode: false,
        blocked_commands: [],
        max_execution_time: 300
      }
    };

    test('should allow safe commands in unrestricted mode', () => {
      expect(() => securityManager.validateCommand('ls -la', basicConfig)).not.toThrow();
      expect(() => securityManager.validateCommand('npm install', basicConfig)).not.toThrow();
      expect(() => securityManager.validateCommand('git status', basicConfig)).not.toThrow();
    });

    test('should reject empty commands', () => {
      expect(() => securityManager.validateCommand('', basicConfig)).toThrow('Invalid command: must be a non-empty string');
      expect(() => securityManager.validateCommand('   ', basicConfig)).toThrow('Invalid command: must be a non-empty string');
    });

    test('should reject null or undefined commands', () => {
      expect(() => securityManager.validateCommand(null, basicConfig)).toThrow('Invalid command: must be a non-empty string');
      expect(() => securityManager.validateCommand(undefined, basicConfig)).toThrow('Invalid command: must be a non-empty string');
    });

    test('should reject invalid config', () => {
      expect(() => securityManager.validateCommand('ls -la', null)).toThrow('Invalid project configuration');
      expect(() => securityManager.validateCommand('ls -la', undefined)).toThrow('Invalid project configuration');
    });
  });

  describe('Restricted mode', () => {
    const restrictedConfig = {
      security: {
        restricted_mode: true,
        blocked_commands: ['rm -rf /', ':(){ :|:& };:', 'sudo rm -rf'],
        max_execution_time: 300
      }
    };

    test('should block dangerous commands', () => {
      expect(() => securityManager.validateCommand('rm -rf /', restrictedConfig))
        .toThrow('Command blocked by security policy: rm -rf /');
      expect(() => securityManager.validateCommand(':(){ :|:& };:', restrictedConfig))
        .toThrow('Command blocked by security policy');
      expect(() => securityManager.validateCommand('sudo rm -rf', restrictedConfig))
        .toThrow('Command blocked by security policy');
    });

    test('should allow safe commands in restricted mode', () => {
      expect(() => securityManager.validateCommand('ls -la', restrictedConfig)).not.toThrow();
      expect(() => securityManager.validateCommand('npm install', restrictedConfig)).not.toThrow();
      expect(() => securityManager.validateCommand('git status', restrictedConfig)).not.toThrow();
    });

    test('should handle partial matches correctly', () => {
      // Should not block commands that contain blocked strings as substrings
      expect(() => securityManager.validateCommand('echo "rm -rf /" # this is safe', restrictedConfig)).not.toThrow();
      expect(() => securityManager.validateCommand('ls -la /usr/bin/rm', restrictedConfig)).not.toThrow();
    });
  });

  describe('Command blocking logic', () => {
    const testConfig = {
      security: {
        restricted_mode: true,
        blocked_commands: ['dangerous-cmd', 'rm -rf'],
        max_execution_time: 300
      }
    };

    test('should identify blocked commands correctly', () => {
      expect(securityManager.isBlocked('dangerous-cmd', testConfig.security.blocked_commands)).toBe(true);
      expect(securityManager.isBlocked('rm -rf', testConfig.security.blocked_commands)).toBe(true);
      expect(securityManager.isBlocked('safe-cmd', testConfig.security.blocked_commands)).toBe(false);
    });

    test('should handle case sensitivity', () => {
      expect(securityManager.isBlocked('DANGEROUS-CMD', testConfig.security.blocked_commands)).toBe(false);
      expect(securityManager.isBlocked('Dangerous-Cmd', testConfig.security.blocked_commands)).toBe(false);
    });

    test('should handle empty blocked commands list', () => {
      const emptyConfig = {
        security: {
          restricted_mode: true,
          blocked_commands: [],
          max_execution_time: 300
        }
      };
      expect(() => securityManager.validateCommand('any command', emptyConfig)).not.toThrow();
    });
  });

  describe('Default security settings', () => {
    test('should have sensible defaults', () => {
      const defaults = securityManager.getDefaultSecuritySettings();
      expect(defaults).toBeDefined();
      expect(defaults.restricted_mode).toBe(false);
      expect(Array.isArray(defaults.blocked_commands)).toBe(true);
      expect(defaults.max_execution_time).toBeGreaterThan(0);
    });

    test('should block common dangerous commands by default', () => {
      const defaults = securityManager.getDefaultSecuritySettings();
      expect(defaults.blocked_commands).toContain('rm -rf /');
      expect(defaults.blocked_commands.length).toBeGreaterThan(0);
    });
  });
});
