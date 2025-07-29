import type { Environment } from '../types';

class EnvironmentService {
  private environment: Environment = 'Dev';
  private listeners: Array<(env: Environment) => void> = [];

  setEnvironment(env: Environment): void {
    this.environment = env;
    // Notify all listeners
    this.listeners.forEach(listener => listener(env));
  }

  getEnvironment(): Environment {
    return this.environment;
  }

  getBaseUrl(): string {
    const environmentMap: Record<Environment, string> = {
      'Dev': 'https://na1.dev.nice-incontact.com',
      'test': 'https://na1.test.nice-incontact.com',
      'perf-wcx': 'https://na1.perf-wcx.nice-incontact.com',
    };

    return environmentMap[this.environment] || environmentMap['Dev'];
  }

  // For services that need to react to environment changes
  addListener(listener: (env: Environment) => void): void {
    this.listeners.push(listener);
  }

  removeListener(listener: (env: Environment) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }
}

export const environmentService = new EnvironmentService();
