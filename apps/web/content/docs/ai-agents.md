# AI and agents

Let a coding agent such as Claude Code, Cursor, GitHub Copilot or Codex write, check and fix your emails with ng-email.

There are three ways to give an agent ng-email, and they work together:

| | What the agent gets | Set up with |
|---|---|---|
| [MCP server](#mcp-server) | Tools to find and add blocks, render emails, check them for inbox problems and read the docs | `npx -y @ng-email/cli mcp` |
| [Agent skill](#agent-skill) | Instructions: the workflow, the rules emails must follow and the component reference | `npx skills add yshashi/ng-email` |
| [Docs for LLMs](#docs-for-llms) | These docs as plain Markdown | `llms.txt` |

> The MCP server and `ng-email check` ship in `@ng-email/cli` 0.3.0.

## MCP server

The [Model Context Protocol](https://modelcontextprotocol.io) lets an agent call tools. `ng-email mcp` runs an MCP server on stdio, in your project's folder. Add it to your agent once:

### Claude Code

```bash
claude mcp add ng-email -- npx -y @ng-email/cli mcp
```

To share it with your team, add `--scope project`. That writes the server to `.mcp.json` in the project.

### Cursor

Add the server to `.cursor/mcp.json` in the project:

```json
{
  "mcpServers": {
    "ng-email": { "command": "npx", "args": ["-y", "@ng-email/cli", "mcp"] }
  }
}
```

### VS Code (GitHub Copilot)

Add it to `.vscode/mcp.json`:

```json
{
  "servers": {
    "ng-email": { "type": "stdio", "command": "npx", "args": ["-y", "@ng-email/cli", "mcp"] }
  }
}
```

### Codex

Add it to `~/.codex/config.toml`:

```text
[mcp_servers.ng-email]
command = "npx"
args = ["-y", "@ng-email/cli", "mcp"]
```

### Other agents

Any MCP client works. Use the command `npx` with the arguments `-y @ng-email/cli mcp`, and start it in the project's root folder. If `@ng-email/cli` is already a dev dependency, `npx` uses that version.

### Tools

| Tool | What it does |
|---|---|
| `list_blocks` | Lists the blocks and templates, optionally filtered by kind or words |
| `get_block` | Returns a block's Angular source and how to use it, without changing anything |
| `add_blocks` | Copies blocks into the project, like [`ng-email add`](/docs/blocks#add-them-with-the-cli) |
| `list_emails` | Compiles your entry file and lists its emails and their inputs |
| `render_email` | Renders an email with its preview inputs, or inputs you pass, and returns the plain text or HTML with the check results |
| `check_email` | Renders the entry's emails and reports only the problems |
| `get_docs` | Returns a docs page as Markdown, or the index |
| `search_docs` | Finds the docs sections that mention a phrase |

The server also tells the agent how ng-email works: tables for layout, `ngeStyle` for styles, signal inputs for data. The agent then checks its own work with `render_email` before it hands back.

Try it with a prompt such as: *"Add a password reset email to src/emails based on the ng-email template, in our brand color #0f766e, and make sure it passes the checks."*

### Options

| | |
|---|---|
| `--registry <url\|folder>` | Use another block registry, such as a fork. `NG_EMAIL_REGISTRY` does the same. |
| `NG_EMAIL_SITE` | Read docs from another copy of this site, or a local folder |

The block and docs tools fetch from this website. Rendering and checking run locally, on your code.

## Agent skill

A skill is a folder of instructions an agent loads when a task needs it. The ng-email skill teaches the workflow (add, write, check, preview, build), the rules an email has to follow and the components at a glance. It works with or without the MCP server.

Install it with the open [skills CLI](https://github.com/vercel-labs/skills), which supports Claude Code, Cursor, Codex, GitHub Copilot and other agents:

```bash
npx skills add yshashi/ng-email
```

Or copy [`skills/ng-email/SKILL.md`](https://github.com/yshashi/ng-email/blob/main/skills/ng-email/SKILL.md) into your agent's skills folder yourself, for example `.claude/skills/ng-email/SKILL.md` for Claude Code.

## Check emails

`ng-email check` is the same check the agent runs, from the terminal or CI:

```bash
npx ng-email check src/emails/index.ts
```

It compiles the entry, renders every email with its preview inputs and reports:

| Level | Problem |
|---|---|
| Error | HTML over 102 kB, which Gmail clips |
| Error | Images without `alt`, or with a relative `src` |
| Error | Links with an empty, `#`, `javascript:` or relative `href` |
| Error | `<script>` tags or Angular leftovers in the output |
| Warning | Missing `<title>` or preview text |
| Warning | Flexbox, grid or positioning in inline styles |
| Warning | Images over `http://` or without a `width` |
| Warning | Background images without a `background-color`, forms, embedded media, external stylesheets |

It exits with 1 when any email has an error, so it can gate a pull request. Use `--name <email>` to check one.

## Docs for LLMs

These docs are published as Markdown for agents and chat assistants, following [llmstxt.org](https://llmstxt.org):

| File | |
|---|---|
| [`llms.txt`](https://yshashi.github.io/ng-email/llms.txt) | Index of every docs page, block and template |
| [`llms-full.txt`](https://yshashi.github.io/ng-email/llms-full.txt) | Every docs page in one file |
| `docs/<page>.md` | One page, for example [`docs/styling.md`](https://yshashi.github.io/ng-email/docs/styling.md) |

Paste a link into a chat, or point your agent's docs feature at `llms.txt`.
