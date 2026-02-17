import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getConfig, setConfig, isConfigured } from './config.js';
import {
  getLatestRates,
  convertCurrency,
  getPairRate,
  getHistoricalRates,
  getSupportedCodes,
  getQuota
} from './api.js';

const program = new Command();

// ============================================================
// Helpers
// ============================================================

function printSuccess(message) {
  console.log(chalk.green('✓') + ' ' + message);
}

function printError(message) {
  console.error(chalk.red('✗') + ' ' + message);
}

function printTable(data, columns) {
  if (!data || data.length === 0) {
    console.log(chalk.yellow('No results found.'));
    return;
  }

  const widths = {};
  columns.forEach(col => {
    widths[col.key] = col.label.length;
    data.forEach(row => {
      const val = String(col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''));
      if (val.length > widths[col.key]) widths[col.key] = val.length;
    });
    widths[col.key] = Math.min(widths[col.key], 40);
  });

  const header = columns.map(col => col.label.padEnd(widths[col.key])).join('  ');
  console.log(chalk.bold(chalk.cyan(header)));
  console.log(chalk.dim('─'.repeat(header.length)));

  data.forEach(row => {
    const line = columns.map(col => {
      const val = String(col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''));
      return val.substring(0, widths[col.key]).padEnd(widths[col.key]);
    }).join('  ');
    console.log(line);
  });

  console.log(chalk.dim(`\n${data.length} result(s)`));
}

function printJson(data) {
  console.log(JSON.stringify(data, null, 2));
}

async function withSpinner(message, fn) {
  const spinner = ora(message).start();
  try {
    const result = await fn();
    spinner.stop();
    return result;
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

function requireAuth() {
  if (!isConfigured()) {
    printError('API key not configured.');
    console.log('\nRun the following to configure:');
    console.log(chalk.cyan('  exchangerate config set --api-key YOUR_API_KEY'));
    console.log('\nGet a free API key at: https://www.exchangerate-api.com/');
    process.exit(1);
  }
}

// ============================================================
// Program metadata
// ============================================================

program
  .name('exchangerate')
  .description(chalk.bold('ExchangeRate CLI') + ' - Currency exchange rates from your terminal')
  .version('1.0.0');

// ============================================================
// CONFIG
// ============================================================

const configCmd = program.command('config').description('Manage CLI configuration');

configCmd
  .command('set')
  .description('Set configuration values')
  .option('--api-key <key>', 'ExchangeRate-API key')
  .action((options) => {
    if (options.apiKey) {
      setConfig('apiKey', options.apiKey);
      printSuccess('API key set');
    } else {
      printError('No options provided. Use --api-key');
    }
  });

configCmd
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const apiKey = getConfig('apiKey');
    console.log(chalk.bold('\nExchangeRate CLI Configuration\n'));
    console.log('API Key: ', apiKey ? chalk.green(apiKey.substring(0, 6) + '...' + apiKey.slice(-4)) : chalk.red('not set'));
    console.log('');
  });

// ============================================================
// RATES
// ============================================================

const ratesCmd = program.command('rates').description('Get exchange rates');

ratesCmd
  .command('latest [base]')
  .description('Get latest exchange rates (default base: USD)')
  .option('--currencies <list>', 'Comma-separated list of target currencies (e.g. EUR,GBP,JPY)')
  .option('--json', 'Output as JSON')
  .action(async (base, options) => {
    requireAuth();
    const baseCurrency = (base || 'USD').toUpperCase();

    try {
      const data = await withSpinner(`Fetching rates for ${baseCurrency}...`, () => getLatestRates(baseCurrency));

      if (options.json) {
        printJson(data);
        return;
      }

      console.log(chalk.bold(`\nExchange Rates — Base: ${chalk.cyan(data.base_code)}\n`));
      console.log(chalk.dim(`Last updated: ${data.time_last_update_utc}`));
      console.log('');

      let rates = Object.entries(data.conversion_rates);

      // Filter by requested currencies if specified
      if (options.currencies) {
        const filter = new Set(options.currencies.toUpperCase().split(',').map(c => c.trim()));
        rates = rates.filter(([code]) => filter.has(code));
      }

      // Show top 30 by default if no filter
      if (!options.currencies) {
        const commonCurrencies = ['EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'HKD', 'SGD', 'SEK',
          'NOK', 'DKK', 'NZD', 'MXN', 'BRL', 'INR', 'KRW', 'TRY', 'ZAR', 'AED',
          'SAR', 'THB', 'IDR', 'MYR', 'PLN', 'CZK', 'HUF', 'ILS', 'CLP', 'PHP'];
        rates = rates.filter(([code]) => commonCurrencies.includes(code));
        rates.sort(([a], [b]) => commonCurrencies.indexOf(a) - commonCurrencies.indexOf(b));
      }

      const tableData = rates.map(([code, rate]) => ({ code, rate }));
      printTable(tableData, [
        { key: 'code', label: 'Currency' },
        { key: 'rate', label: 'Rate', format: (v) => Number(v).toFixed(6) }
      ]);

      if (!options.currencies) {
        console.log(chalk.dim('\nUse --currencies EUR,GBP,JPY to filter specific currencies'));
        console.log(chalk.dim('Use --json for all currencies'));
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

ratesCmd
  .command('historical <base> <year> <month> <day>')
  .description('Get historical exchange rates for a specific date')
  .option('--currencies <list>', 'Comma-separated list of target currencies')
  .option('--json', 'Output as JSON')
  .action(async (base, year, month, day, options) => {
    requireAuth();

    try {
      const data = await withSpinner(`Fetching historical rates for ${base.toUpperCase()} on ${year}-${month}-${day}...`, () =>
        getHistoricalRates(base, year, month, day)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      console.log(chalk.bold(`\nHistorical Rates — ${chalk.cyan(data.base_code)} on ${year}-${month}-${day}\n`));

      let rates = Object.entries(data.conversion_rates);
      if (options.currencies) {
        const filter = new Set(options.currencies.toUpperCase().split(',').map(c => c.trim()));
        rates = rates.filter(([code]) => filter.has(code));
      } else {
        rates = rates.slice(0, 30);
      }

      const tableData = rates.map(([code, rate]) => ({ code, rate }));
      printTable(tableData, [
        { key: 'code', label: 'Currency' },
        { key: 'rate', label: 'Rate', format: (v) => Number(v).toFixed(6) }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// CONVERT
// ============================================================

const convertCmd = program.command('convert').description('Convert between currencies');

convertCmd
  .command('<from> <to> <amount>')
  .description('Convert an amount between two currencies')
  .option('--json', 'Output as JSON')
  .action(async (from, to, amount, options) => {
    requireAuth();
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) {
      printError('Invalid amount: ' + amount);
      process.exit(1);
    }

    try {
      const data = await withSpinner(`Converting ${amountNum} ${from.toUpperCase()} to ${to.toUpperCase()}...`, () =>
        convertCurrency(from, to, amountNum)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      console.log(chalk.bold('\nCurrency Conversion\n'));
      console.log(`${chalk.cyan(amountNum.toLocaleString())} ${chalk.bold(data.base_code)}`);
      console.log(`  = ${chalk.green(data.conversion_result?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }))} ${chalk.bold(data.target_code)}`);
      console.log('');
      console.log(chalk.dim(`Rate: 1 ${data.base_code} = ${data.conversion_rate} ${data.target_code}`));
      console.log(chalk.dim(`Last updated: ${data.time_last_update_utc}`));
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// Also support: exchangerate convert USD EUR 100
program
  .command('convert <from> <to> <amount>')
  .description('Convert an amount between two currencies')
  .option('--json', 'Output as JSON')
  .action(async (from, to, amount, options) => {
    requireAuth();
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) {
      printError('Invalid amount: ' + amount);
      process.exit(1);
    }

    try {
      const data = await withSpinner(`Converting ${amountNum} ${from.toUpperCase()} → ${to.toUpperCase()}...`, () =>
        convertCurrency(from, to, amountNum)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      console.log(chalk.bold('\nCurrency Conversion\n'));
      console.log(`  ${chalk.cyan(amountNum.toLocaleString())} ${chalk.bold(data.base_code)}`);
      console.log(`  = ${chalk.green((data.conversion_result ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }))} ${chalk.bold(data.target_code)}`);
      console.log('');
      console.log(chalk.dim(`Rate: 1 ${data.base_code} = ${data.conversion_rate} ${data.target_code}`));
      console.log(chalk.dim(`Updated: ${data.time_last_update_utc}`));
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// PAIR
// ============================================================

program
  .command('pair <from> <to>')
  .description('Get exchange rate between two currencies')
  .option('--json', 'Output as JSON')
  .action(async (from, to, options) => {
    requireAuth();

    try {
      const data = await withSpinner(`Fetching ${from.toUpperCase()}/${to.toUpperCase()} rate...`, () =>
        getPairRate(from, to)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      console.log(chalk.bold('\nCurrency Pair\n'));
      console.log(`1 ${chalk.cyan(data.base_code)} = ${chalk.green(data.conversion_rate)} ${chalk.bold(data.target_code)}`);
      console.log('');
      console.log(chalk.dim(`Updated: ${data.time_last_update_utc}`));
      console.log(chalk.dim(`Next update: ${data.time_next_update_utc}`));
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// CURRENCIES
// ============================================================

program
  .command('currencies')
  .description('List all supported currencies')
  .option('--search <term>', 'Search by code or name')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();

    try {
      const data = await withSpinner('Fetching supported currencies...', () => getSupportedCodes());

      if (options.json) {
        printJson(data);
        return;
      }

      let currencies = data.supported_codes || [];

      if (options.search) {
        const term = options.search.toUpperCase();
        currencies = currencies.filter(([code, name]) =>
          code.toUpperCase().includes(term) || name.toUpperCase().includes(term)
        );
      }

      const tableData = currencies.map(([code, name]) => ({ code, name }));
      printTable(tableData, [
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Currency Name' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// QUOTA
// ============================================================

program
  .command('quota')
  .description('Check API usage quota')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();

    try {
      const data = await withSpinner('Fetching quota info...', () => getQuota());

      if (options.json) {
        printJson(data);
        return;
      }

      console.log(chalk.bold('\nAPI Quota\n'));
      console.log('Plan:              ', chalk.cyan(data.plan_quota_reset || data.plan || 'N/A'));
      console.log('Requests today:    ', data.requests_remaining !== undefined ? chalk.yellow(data.requests_remaining) : 'N/A');
      console.log('Refresh day:       ', data.refresh_day_of_month || 'N/A');
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// Parse
// ============================================================

program.parse(process.argv);

if (process.argv.length <= 2) {
  program.help();
}
