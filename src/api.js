import axios from 'axios';
import { getConfig } from './config.js';

// ExchangeRate-API v6 base URL
// API key is part of the URL path
function getBaseURL() {
  const apiKey = getConfig('apiKey');
  if (!apiKey) {
    throw new Error('API key not configured. Run: exchangerate config set --api-key YOUR_KEY');
  }
  return `https://v6.exchangerate-api.com/v6/${apiKey}`;
}

async function request(endpoint) {
  const baseURL = getBaseURL();
  try {
    const response = await axios.get(`${baseURL}${endpoint}`);
    if (response.data.result === 'error') {
      throw new Error(response.data['error-type'] || 'API error');
    }
    return response.data;
  } catch (error) {
    if (error.response?.data?.['error-type']) {
      throw new Error(`API Error: ${error.response.data['error-type']}`);
    }
    if (error.message.startsWith('API Error')) throw error;
    throw new Error(`Request failed: ${error.message}`);
  }
}

// ============================================================
// Exchange Rates
// ============================================================

/**
 * Get latest exchange rates for a base currency
 */
export async function getLatestRates(baseCurrency = 'USD') {
  return await request(`/latest/${baseCurrency.toUpperCase()}`);
}

/**
 * Convert amount between two currencies
 */
export async function convertCurrency(from, to, amount) {
  const data = await request(`/pair/${from.toUpperCase()}/${to.toUpperCase()}/${amount}`);
  return data;
}

/**
 * Get enriched data for a currency pair (includes history info)
 */
export async function getPairRate(from, to) {
  return await request(`/pair/${from.toUpperCase()}/${to.toUpperCase()}`);
}

/**
 * Get historical rates for a base currency on a specific date
 */
export async function getHistoricalRates(baseCurrency, year, month, day) {
  return await request(`/history/${baseCurrency.toUpperCase()}/${year}/${month}/${day}`);
}

/**
 * Get list of all supported currencies
 */
export async function getSupportedCodes() {
  return await request('/codes');
}

/**
 * Get quota/usage information
 */
export async function getQuota() {
  return await request('/quota');
}
