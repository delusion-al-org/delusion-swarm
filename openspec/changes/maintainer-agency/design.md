# Architecture Critique: The Intelligence Layer (Programming Team)

## 1. The Bottleneck of a Single "Maintainer" Agent
**Current thought**: A single `maintainer` agent handles iteration.
**Critique**: This clashes with the vision of a "Professional AI Agency". A single agent trying to plan, write code, run tests, and commit will hit context limits and loop infinitely (as seen in previous historical trading swarm issues).
**Solution**: The "Maintainer" should actually be a **Mastra Workflow** that coordinates a Swarm, or a **Lead Agent** that delegates to specialized roles:
- **Planner Agent**: Analyzes the request, reads context, creates a checklist.
- **Coder Agent**: Executes edits on specific files.
- **Verifier/Reviewer Agent (The 'Judgment Day' Protocol)**: Acts as an adversarial judge. If code fails, it bounces back to Coder. **Crucially**, this phase runs multiple parallel reviewers:
  - *Judge A (Logic & Correctness)*: Validates tests, syntax, and specs.
  - *Judge B (Condensation & Generalization)*: Analyzes the new code against the **Global Engram Brain**. If it detects a repeated pattern (e.g., this is the 3rd time we build a specialized "calendar booking" section), it extracts it into a generalized `@delusion/blocks` component, registers it in the Engram, and condenses the local client's code to use the new block.

## 2. Memory: Engram vs `.delusion/context.md` per Project
**Current thought**: Give each client project its own SQLite `.engram` database to communicate between projects.
**Critique**: 
1. SQLite requires an active server process per DB. Managing 100 SQLite processes at scale is an infrastructure nightmare.
2. Git already tracks history perfectly. A binary `.db` file in a git repo causes massive merge conflicts and bloat.
**Solution**: 
- **Central Engram**: The Orchestrator uses the global Engram to learn *cross-project* skills (e.g. "We always get asked to add WhatsApp buttons, let's make a generic tool for it").
- **Local Markdown Context (`.delusion/context.md`)**: The truth of the *client's project* lives in plain text. It is git-versioned, human-readable, and easily injected into prompts.

## 3. Tool Ecosystem & Self-Improvement
**Current thought**: The swarm writes its own tools dynamically.
**Critique**: Hot-reloading Mastra TypeScript tools dynamically in the middle of a run is dangerous and unstable.
**Solution**: 
Instead of modifying Mastra internals, agents employ **Golden Action Recipes**:
1. When Judge A and Judge B find that the `Coder` agent solved a problem brilliantly (e.g., modifying specific lines in `tailwind.config.mjs` to apply a brand new color scheme via `multi_replace`), Judge B abstracts not just the code, but the **editing pattern itself**.
2. This pattern is saved into the Engram Brain (or as a YAML schema in `.delusion/recipes/`).
3. Future Planner Agents query Engram for "How to change tailwind themes", discover the successful "Action Recipe", and pass the exact diff template to the Coder. This bypasses the LLM's "thinking/reasoning" phase almost entirely for known operations, dropping token cost near zero.

## 4. Claude Code-Style Prompting
**Implementation**: We will adopt the "Plan -> Search -> Edit -> Verify" loop. 
This requires giving the Programming Team very specific tools:
- `semantic_grep`: To find code without reading whole files.
- `ast_edit`: Instead of re-writing full files, edit specific lines.
- `warn_admins`: A tool that pauses the workflow and sends an alert (Slack/Discord/Stdout) if the Planner determines the request requires restructuring > 5 files or modifying the core seeds.

## 5. Supabase State Machine
**Workflow**: 
1. `Supabase` triggers a webhook when a client requests a feature.
2. Orchestrator reads Supabase. 
3. Looks up the repo, pulls late commits.
4. Reads `.delusion/context.md` (which knows exactly where it left off).
5. Kicks off the Programming Team Workflow.
6. Team finishes, pushes to Git, updates `context.md`, updates Supabase status to `completed`.
