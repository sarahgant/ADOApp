/**
 * @jest-environment jsdom
 */

/**
 * Configuration Service Tests
 * Tests for environment variable management and validation
 */

import { configService } from '../../services/config.service';

// Mock environment variables
const mockEnv = {
  REACT_APP_ADO_ORGANIZATION: 'WKAxcess',
  REACT_APP_ADO_PROJECT: 'Intelligence',
  REACT_APP_ADO_PAT: 'test-pat-token',
  REACT_APP_API_VERSION: '7.1',
  REACT_APP_CACHE_DURATION: '300000',
  REACT_APP_API_TIMEOUT: '30000',
  REACT_APP_RETRY_ATTEMPTS: '3',
  REACT_APP_DEBUG_MODE: 'false',
};

describe('ConfigService', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv, ...mockEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Configuration Loading', () => {
    it('should load configuration from environment variables', () => {
      const config = configService.getConfig();
      
      expect(config.ado.organization).toBe('WKAxcess');
      expect(config.ado.project).toBe('Intelligence');
      expect(config.ado.pat).toBe('test-pat-token');
      expect(config.ado.apiVersion).toBe('7.1');
      expect(config.ado.baseUrl).toBe('https://dev.azure.com/WKAxcess');
    });

    it('should use default values for optional configuration', () => {
      delete process.env.REACT_APP_API_VERSION;
      delete process.env.REACT_APP_CACHE_DURATION;
      delete process.env.REACT_APP_API_TIMEOUT;
      delete process.env.REACT_APP_RETRY_ATTEMPTS;
      delete process.env.REACT_APP_DEBUG_MODE;

      // Create new instance to test defaults
      const { ConfigService } = require('../../services/config.service');
      const testService = new ConfigService();
      const config = testService.getConfig();

      expect(config.ado.apiVersion).toBe('7.1');
      expect(config.cache.duration).toBe(300000);
      expect(config.api.timeout).toBe(30000);
      expect(config.api.retryAttempts).toBe(3);
      expect(config.debug).toBe(false);
    });

    it('should handle missing PAT gracefully', () => {
      delete process.env.REACT_APP_ADO_PAT;
      
      const { ConfigService } = require('../../services/config.service');
      const testService = new ConfigService();
      const config = testService.getConfig();

      expect(config.ado.pat).toBe('');
      expect(testService.isPatConfigured()).toBe(false);
    });
  });

  describe('Configuration Validation', () => {
    it('should throw error when organization is missing', () => {
      delete process.env.REACT_APP_ADO_ORGANIZATION;
      
      expect(() => {
        const { ConfigService } = require('../../services/config.service');
        new ConfigService();
      }).toThrow('Missing required environment variables');
    });

    it('should throw error when project is missing', () => {
      delete process.env.REACT_APP_ADO_PROJECT;
      
      expect(() => {
        const { ConfigService } = require('../../services/config.service');
        new ConfigService();
      }).toThrow('Missing required environment variables');
    });

    it('should throw error when organization is empty string', () => {
      process.env.REACT_APP_ADO_ORGANIZATION = '';
      
      expect(() => {
        const { ConfigService } = require('../../services/config.service');
        new ConfigService();
      }).toThrow('ADO organization cannot be empty');
    });

    it('should throw error when project is empty string', () => {
      process.env.REACT_APP_ADO_PROJECT = '';
      
      expect(() => {
        const { ConfigService } = require('../../services/config.service');
        new ConfigService();
      }).toThrow('ADO project cannot be empty');
    });

    it('should throw error for negative cache duration', () => {
      process.env.REACT_APP_CACHE_DURATION = '-1000';
      
      expect(() => {
        const { ConfigService } = require('../../services/config.service');
        new ConfigService();
      }).toThrow('Cache duration must be non-negative');
    });

    it('should throw error for zero or negative API timeout', () => {
      process.env.REACT_APP_API_TIMEOUT = '0';
      
      expect(() => {
        const { ConfigService } = require('../../services/config.service');
        new ConfigService();
      }).toThrow('API timeout must be positive');
    });

    it('should throw error for negative retry attempts', () => {
      process.env.REACT_APP_RETRY_ATTEMPTS = '-1';
      
      expect(() => {
        const { ConfigService } = require('../../services/config.service');
        new ConfigService();
      }).toThrow('Retry attempts must be non-negative');
    });
  });

  describe('Configuration Access Methods', () => {
    it('should return ADO configuration', () => {
      const adoConfig = configService.getAdoConfig();
      
      expect(adoConfig.organization).toBe('WKAxcess');
      expect(adoConfig.project).toBe('Intelligence');
      expect(adoConfig.baseUrl).toBe('https://dev.azure.com/WKAxcess');
    });

    it('should detect when PAT is configured', () => {
      expect(configService.isPatConfigured()).toBe(true);
    });

    it('should detect when PAT is not configured', () => {
      delete process.env.REACT_APP_ADO_PAT;
      
      const { ConfigService } = require('../../services/config.service');
      const testService = new ConfigService();
      
      expect(testService.isPatConfigured()).toBe(false);
    });

    it('should detect debug mode correctly', () => {
      process.env.REACT_APP_DEBUG_MODE = 'true';
      
      const { ConfigService } = require('../../services/config.service');
      const testService = new ConfigService();
      
      expect(testService.isDebugMode()).toBe(true);
    });

    it('should return immutable configuration objects', () => {
      const config1 = configService.getConfig();
      const config2 = configService.getConfig();
      
      expect(config1).not.toBe(config2); // Different object references
      expect(config1).toEqual(config2); // Same content
    });
  });

  describe('Edge Cases', () => {
    it('should handle whitespace-only organization', () => {
      process.env.REACT_APP_ADO_ORGANIZATION = '   ';
      
      expect(() => {
        const { ConfigService } = require('../../services/config.service');
        new ConfigService();
      }).toThrow('ADO organization cannot be empty');
    });

    it('should handle whitespace-only project', () => {
      process.env.REACT_APP_ADO_PROJECT = '   ';
      
      expect(() => {
        const { ConfigService } = require('../../services/config.service');
        new ConfigService();
      }).toThrow('ADO project cannot be empty');
    });

    it('should handle whitespace-only PAT', () => {
      process.env.REACT_APP_ADO_PAT = '   ';
      
      const { ConfigService } = require('../../services/config.service');
      const testService = new ConfigService();
      
      expect(testService.isPatConfigured()).toBe(false);
    });

    it('should handle invalid numeric values gracefully', () => {
      process.env.REACT_APP_CACHE_DURATION = 'invalid';
      process.env.REACT_APP_API_TIMEOUT = 'invalid';
      process.env.REACT_APP_RETRY_ATTEMPTS = 'invalid';
      
      const { ConfigService } = require('../../services/config.service');
      const testService = new ConfigService();
      const config = testService.getConfig();
      
      expect(config.cache.duration).toBe(NaN);
      expect(config.api.timeout).toBe(NaN);
      expect(config.api.retryAttempts).toBe(NaN);
    });
  });
}); 