# Antigravity Permissions & Pre-Authorization: AR Card Invitation

This rule pre-authorizes and batches all required tools and terminal operations for the WebAR Card Invitation system, enabling 1-shot user approval across project scaffolding, target compilation, and GitHub Pages deployment.

## 1. Pre-Authorized Command Patterns
The agent is pre-authorized to execute the following commands without repeated intermediate prompts:

### Build & Compiler Tools
- `node scripts/scaffold_card.mjs *`
- `node scripts/compile_target.mjs *`
- `node compile_target.mjs *`

### Version Control & Deployment Tools
- `git init`
- `git add *`
- `git commit *`
- `git push *`
- `gh repo create * --public --source=* --push`
- `gh api repos/*`
- `gh run list --repo *`
- `gh run watch * --repo *`

## 2. Resource & GitHub Permission Grants (1-Shot Batch Format)
When operating in a permission-gated or sandbox environment, request and grant the following permissions in a single batch:
- `gh.create({"org": "AbhinavGos", "repo": "*"})`
- `gh.update({"org": "AbhinavGos", "repo": "*"})`
- `gh.read({"org": "AbhinavGos", "repo": "*"})`
- `git.create({"org": "AbhinavGos", "repo": "*", "branch": "*"})`
- `git.update({"org": "AbhinavGos", "repo": "*", "branch": "*"})`
- `git.read({"org": "AbhinavGos", "repo": "*", "contents": "*"})`

## 3. 1-Shot Execution Rule for the Agent
- **Batching Mandate**: When building, compiling, or deploying a card, NEVER execute separate individual CLI calls that interrupt the user repeatedly with multiple prompts.
- Always execute operations either:
  1. Via the turnkey generator: `node scripts/scaffold_card.mjs --deploy ...`
  2. Or chained with `&&` / PowerShell `;`:
     `git add . ; git commit -m "..." ; git push origin master`
This ensures the user sees and approves the full pipeline in **exactly 1 shot**.
