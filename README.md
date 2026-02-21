![Banner](https://raw.githubusercontent.com/ktmcp-cli/exchangerate/main/banner.svg)

> "Six months ago, everyone was talking about MCPs. And I was like, screw MCPs. Every MCP would be better as a CLI."
>
> — [Peter Steinberger](https://twitter.com/steipete), Founder of OpenClaw
> [Watch on YouTube (~2:39:00)](https://www.youtube.com/@lexfridman) | [Lex Fridman Podcast #491](https://lexfridman.com/peter-steinberger/)

# ExchangeRate CLI

> **⚠️ Unofficial CLI** - Not officially sponsored or affiliated with ExchangeRate-API.

A production-ready command-line interface for [ExchangeRate-API](https://www.exchangerate-api.com/) — real-time and historical currency exchange rates for 161+ currencies. Convert currencies, check rates, and query historical data directly from your terminal.

## Features

- **Real-time Rates** — Latest exchange rates for any base currency
- **Currency Conversion** — Convert amounts between any pair of currencies
- **Historical Rates** — Query rates for any past date
- **Currency Pairs** — Get direct rate for any two currencies
- **161+ Currencies** — Full list of supported currency codes
- **Quota Tracking** — Monitor your API usage
- **JSON output** — All commands support `--json` for scripting
- **Colorized output** — Clean terminal output with chalk

## Installation

```bash
npm install -g @ktmcp-cli/exchangerate
```

## Quick Start

```bash
# Get a free API key at https://www.exchangerate-api.com/
exchangerate config set --api-key YOUR_API_KEY

# Convert 100 USD to EUR
exchangerate convert USD EUR 100

# Get latest rates (base: USD)
exchangerate rates latest

# Get rates for GBP base
exchangerate rates latest GBP
```

## Commands

### Config

```bash
exchangerate config set --api-key <key>
exchangerate config show
```

### Convert

```bash
exchangerate convert USD EUR 100
exchangerate convert GBP JPY 500 --json
```

### Rates

```bash
exchangerate rates latest           # USD base, common currencies
exchangerate rates latest EUR       # EUR base
exchangerate rates latest USD --currencies EUR,GBP,JPY,CAD
exchangerate rates latest USD --json  # All rates as JSON

exchangerate rates historical USD 2024 1 15
exchangerate rates historical EUR 2023 12 31 --currencies GBP,JPY
```

### Pair

```bash
exchangerate pair USD EUR
exchangerate pair GBP JPY --json
```

### Currencies

```bash
exchangerate currencies              # All supported currencies
exchangerate currencies --search EUR
exchangerate currencies --search "dollar"
```

### Quota

```bash
exchangerate quota
```

## JSON Output

All commands support `--json` for structured output:

```bash
exchangerate rates latest --json | jq '.conversion_rates.EUR'
exchangerate convert USD EUR 1000 --json | jq '.conversion_result'
exchangerate currencies --json | jq '.supported_codes[] | select(.[0] | startswith("E"))'
```

## Why CLI > MCP?

No server to run. No protocol overhead. Just install and go.

- **Simpler** — Just a binary you call directly
- **Composable** — Pipe to `jq`, `grep`, `awk`
- **Scriptable** — Works in cron jobs, CI/CD, shell scripts

## License

MIT — Part of the [Kill The MCP](https://killthemcp.com) project.


---

## Support KTMCP

If you find this CLI useful, we'd greatly appreciate your support! Share your experience on:
- Reddit
- Twitter/X
- Hacker News

**Incentive:** Users who can demonstrate that their support/advocacy helped advance KTMCP will have their feature requests and issues prioritized.

Just be mindful - these are real accounts and real communities. Authentic mentions and genuine recommendations go a long way!

## Support This Project

If you find this CLI useful, we'd appreciate support across Reddit, Twitter, Hacker News, or Moltbook. Please be mindful - these are real community accounts. Contributors who can demonstrate their support helped advance KTMCP will have their PRs and feature requests prioritized.
