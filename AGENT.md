# AGENT.md — ExchangeRate CLI for AI Agents

This document explains how to use the ExchangeRate CLI as an AI agent.

## Overview

The `exchangerate` CLI provides real-time and historical currency exchange rates via ExchangeRate-API. Use it for currency conversions, rate lookups, and forex data.

## Prerequisites

```bash
exchangerate config set --api-key <key>
```

## All Commands

### Config

```bash
exchangerate config set --api-key <key>
exchangerate config show
```

### Convert

```bash
exchangerate convert USD EUR 100          # Convert 100 USD to EUR
exchangerate convert GBP JPY 1000 --json  # JSON output
```

### Rates

```bash
exchangerate rates latest                          # USD base rates
exchangerate rates latest EUR                      # EUR base
exchangerate rates latest USD --currencies EUR,GBP,JPY
exchangerate rates latest USD --json               # Full rate table

exchangerate rates historical USD 2024 1 15        # Historical date
```

### Pair

```bash
exchangerate pair USD EUR           # Rate for pair
exchangerate pair USD EUR --json
```

### Currencies

```bash
exchangerate currencies             # All 161+ currencies
exchangerate currencies --search dollar
```

### Quota

```bash
exchangerate quota
```

## Tips for Agents

1. Always use `--json` when parsing results programmatically
2. Use `exchangerate convert` for simple one-off conversions
3. Use `exchangerate rates latest --json` to get all rates at once
4. The `conversion_result` field in convert response has the converted amount
5. Historical rates need year/month/day as separate arguments
