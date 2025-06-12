import { storageService } from './storage.service.js';

/**
 * @typedef {object} AdoConfig
 * @property {string} organization
 * @property {string} project
 * @property {string} pat
 * @property {string} apiVersion
 * @property {string} baseUrl
 */

/**
 * @typedef {object} AppConfig
 * @property {AdoConfig} ado
 * @property {{duration: number}} cache
 * @property {{timeout: number, retryAttempts: number}} api
 * @property {boolean} debug
 */

const ADO_CONFIG_STORAGE_KEY = 'adoConfig';

class ConfigService {
  /** @type {AppConfig} */
  #config;
  #isUsingStoredConfig = false;

  constructor() {
    this.#config = this.#loadConfig();
    this.#validateConfig();
  }

  #loadConfig() {
    const storedAdoConfig = storageService.getItem(ADO_CONFIG_STORAGE_KEY);

    if (storedAdoConfig) {
      this.#isUsingStoredConfig = true;
      return this.#createConfigFromAdo(storedAdoConfig);
    }
    
    this.#isUsingStoredConfig = false;
    const organization = process.env.REACT_APP_ADO_ORGANIZATION;
    const project = process.env.REACT_APP_ADO_PROJECT;
    const pat = process.env.REACT_APP_ADO_PAT;
    
    if (!organization || !project) {
      return this.#createConfigFromAdo({
        organization: '',
        project: '',
        pat: '',
        apiVersion: '7.1',
        baseUrl: ''
      });
    }

    return this.#createConfigFromAdo({
      organization,
      project,
      pat: pat || '',
      apiVersion: process.env.REACT_APP_API_VERSION || '7.1',
      baseUrl: `https://dev.azure.com/${organization}`,
    });
  }

  /**
   * @param {AdoConfig} adoConfig
   * @returns {AppConfig}
   */
  #createConfigFromAdo(adoConfig) {
    return {
      ado: adoConfig,
      cache: {
        duration: parseInt(process.env.REACT_APP_CACHE_DURATION || '300000', 10),
      },
      api: {
        timeout: parseInt(process.env.REACT_APP_API_TIMEOUT || '30000', 10),
        retryAttempts: parseInt(process.env.REACT_APP_RETRY_ATTEMPTS || '3', 10),
      },
      debug: process.env.REACT_APP_DEBUG_MODE === 'true',
    };
  }

  #validateConfig() {
    if (!this.#config.ado.organization && !this.#config.ado.project) {
      return;
    }

    const { ado } = this.#config;
    
    if (!ado.organization.trim()) {
      throw new Error('ADO organization cannot be empty');
    }
    
    if (!ado.project.trim()) {
      throw new Error('ADO project cannot be empty');
    }
    
    if (this.#config.cache.duration < 0) {
      throw new Error('Cache duration must be non-negative');
    }
    
    if (this.#config.api.timeout <= 0) {
      throw new Error('API timeout must be positive');
    }
    
    if (this.#config.api.retryAttempts < 0) {
      throw new Error('Retry attempts must be non-negative');
    }
  }

  getConfig() {
    return { ...this.#config };
  }

  getAdoConfig() {
    return { ...this.#config.ado };
  }

  /** @param {Partial<AdoConfig>} newAdoConfig */
  updateAdoConfig(newAdoConfig) {
    this.#config.ado = { ...this.#config.ado, ...newAdoConfig };
    if(this.#config.ado.organization) {
        this.#config.ado.baseUrl = `https://dev.azure.com/${this.#config.ado.organization}`;
    }
    this.#validateConfig();
  }

  /** @param {AdoConfig} adoConfig */
  saveAdoConfig(adoConfig) {
    storageService.setItem(ADO_CONFIG_STORAGE_KEY, adoConfig);
    this.#isUsingStoredConfig = true;
  }

  clearAdoConfig() {
    storageService.removeItem(ADO_CONFIG_STORAGE_KEY);
    this.#isUsingStoredConfig = false;
  }
  
  wasConfigLoadedFromStorage() {
    return this.#isUsingStoredConfig;
  }
  
  isPatConfigured() {
    return !!this.#config.ado.pat && this.#config.ado.pat.trim().length > 0;
  }
}

export const configService = new ConfigService();
export default configService; 