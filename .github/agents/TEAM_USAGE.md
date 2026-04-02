# Agent Team Usage

This repository now includes a team-based Copilot setup based on awesome-copilot's RUG workflow.

## Installed Agents

- `Team Leader` in `./.github/agents/team-leader.agent.md`
- `SWE` in `./.github/agents/swe-subagent.agent.md`
- `QA` in `./.github/agents/qa-subagent.agent.md`

## How It Works

1. Use `Team Leader` as your active agent for complex requests.
2. `Team Leader` decomposes tasks and delegates implementation to `SWE`.
3. `Team Leader` delegates verification and risk checks to `QA`.
4. `Team Leader` can instruct subagents to invoke installed skills via:
   - `SKILL TO USE: <skill-name>`

## Skill-Aware Workflow

The team is configured to use installed skills when relevant.
Examples:

- Implementation/refactor requests: `aider`, `refactor`, `quasi-coder`
- Test-heavy tasks: `polyglot-test-agent`, `breakdown-test`
- Evaluation/verification tasks: `agentic-eval`, `doublecheck`
- Documentation and planning: `create-readme`, `create-technical-spike`, `architecture-blueprint-generator`

## Example Prompt

Use this prompt with `Team Leader`:

"Analyze this request, split it into tasks, delegate coding to SWE and verification to QA, and use the most relevant installed skills for each task."

## Notes

- The team is workspace-scoped (stored under `.github/agents`).
- If you want a global team across all repositories, copy these `.agent.md` files into your user prompts folder when available.
