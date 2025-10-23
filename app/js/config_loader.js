// app/js/config_loader.js

/**
 * @file Manages loading and caching of the application configuration.
 */

let config = null;

/**
 * Fetches the configuration from the policy file and caches it.
 * @returns {Promise<object>} A promise that resolves to the configuration object.
 */
export async function getConfig() {
  if (config) {
    return config;
  }

  try {
    const response = await fetch('../config/policy_config.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    config = await response.json();
    console.log('ConfigLoader: Configuration loaded and cached.', config);
    return config;
  } catch (error) {
    console.error('ConfigLoader: Failed to load configuration:', error);
    // Return null or default config if loading fails
    return null;
  }
}
