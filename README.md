# SignalForce

A visual sales-learning and call-preparation guide. Independent of Salesforce; not a Salesforce product or an account propensity score.

## Open it

Double-click **SignalForce.app** on the Desktop. The launcher starts a small local server and opens your browser. No build step is needed. A backup `Open SignalForce.command` is inside the project folder. Keep the `SignalGraph` folder on the Desktop; the launchers use its files and this Mac's installed Node runtime.

**Play demo** runs a fixed, source-reviewed Target example without API calls or an API key. It advances at a reading pace, with pause/back/next controls. It is dated 16 September 2026 and is not live research. The map supports a full-screen focus mode. Details open one step at a time. Comparison is a separate tab.

`Open Offline Map.html` in this folder also opens the general map and demo without a server. Live research requires the Desktop launcher. Browser notes in the offline file and local-server app are separate because they have different browser origins.

## One-time company research setup

Double-click **Set Up SignalForce Research.command** on the Desktop. Paste your OpenAI or Anthropic API key at the hidden Terminal prompt. The app detects the key issuer. Defaults are OpenAI `gpt-5-mini` and Anthropic `claude-sonnet-4-6`; a different compatible model can be configured through `SIGNALGRAPH_MODEL` when running setup. Model access depends on your API project. Then open Company research and enter a company name or website. No key is entered in the browser.

The key is stored in `~/Library/Application Support/SignalGraph/credentials.json`, permissions 0600, inside a 0700 directory. It is an owner-only local file, not encrypted Keychain storage. It is never bundled into the frontend, included in exports, or logged. Setup checks the provider’s model-list endpoint without a paid generation call. Research uses API billing; set project usage limits in your API account. The server reads the saved credentials for each new request, so key changes do not require a restart.

Each explicit research run has two stages: bounded web research, then strict structured synthesis. OpenAI uses Responses; Anthropic uses Messages with search/fetch tools. Up to two paused Anthropic tool turns can be continued, within a ten-minute job timeout. Provider responses are streamed to avoid dropping a long generation while waiting for its first result. Completed source gathering is checkpointed locally for 30 minutes: an explicit retry of the same company can reuse that evidence if final synthesis was interrupted. There are no automatic paid refreshes or retries. Cancellation aborts local requests; already-incurred provider usage may still be charged. A successful report is saved on this Mac and can be reopened without a new API call. The app does not send call notes to the provider; only the requested company identifier, research instructions, generic mapping vocabulary, and gathered public evidence are used.

## What the research means

Research checks identity, filings, earnings, hiring, strategy, leadership, operations, customer experience, and financial context. It distinguishes incomplete coverage from a verified absence. A job listing is not treated as proof of a hiring trend. Sources may be unavailable, paywalled, old, or only partially accessible.

Findings reference URLs returned by the search tool. Suggested paths reference those findings and known map/persona IDs. Invalid references are rejected. This checks traceability, **not whether a source actually entails every claim**; AI synthesis can still be wrong. Inspect the source and test the hypothesis on the call. Budgets, installed vendors, buying intent, and exact contact ownership are not assumed. No purchase probabilities are generated.

The old propensity catalog contributed product/signal vocabulary. Its weights, account records, ACV estimates, and propensity formulas do not drive company recommendations.

## Local data

- Call notes/settings: browser localStorage, separated by company name or general context. Export notes for backup. Company names are labels, not verified CRM identifiers; identically named businesses should be distinguished in research.
- Reports: `~/Library/Application Support/SignalGraph/reports/`, owner-only files. Delete reports from Company research.
- Active company lens: browser localStorage; remove it to return to general guidance.
- Server: bound only to `127.0.0.1:43187`. Host/origin checks and a per-process token protect mutations. No CORS access or arbitrary URL-fetch endpoint.
- Credentials and reports are not part of Desktop packaging. Do not share your Application Support credentials file.

## Development and validation

`npm install`, `npm run validate`, `npm test`, `npm run build`, `npm run desktop`.

`npm run dev -- --port 5178` starts frontend development; use the packaged local server for research. `npm run test:e2e` is the real-browser suite. Browser launch in the coding sandbox was blocked by macOS Mach-port permissions, so visual layout has not been screenshot-verified there. DOM interaction, domain, mocked provider, packaging, and local HTTP checks are separate checks; live research is tested separately using the configured provider.

## Documentation used

- Anthropic [web search](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool) and [structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs).
- OpenAI Responses [web search](https://developers.openai.com/api/docs/guides/tools-web-search) and [structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs).
- Salesforce product and training sources are linked inside the Product guide and Comparison tab.
- Target demo sources are linked next to findings and coverage notes.

## Scope

Ten authored pathways, seven persona families, eight broad company contexts, and 53 product references (reviewed entries distinguished from historical vocabulary). This is a useful initial map, not an exhaustive catalog of every industry, persona, Salesforce product, or potential business pain. Live research maps to these supported pathways and can return no match. Expand authored pathways to grow coverage rather than forcing a product recommendation.
