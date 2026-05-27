# Getting Started

Let's get the Valen compiler on your machine. This should take about two minutes — we'll have you compiling code before your coffee gets cold.

## Prerequisites

- **JVM 21 or later** — Valen targets JVM 21 as its baseline. You'll need a JDK to run the compiled output.
- **A terminal** — shocking, we know.

## Installation

Pick whichever method sounds least painful:

### Option 1: Install Script (Recommended)

```sh
curl -fsSL https://raw.githubusercontent.com/NaruseNia/valen-lang/main/install.sh | bash
```

This downloads the latest release binary and drops it into your PATH. Works on macOS and Linux.

::: warning Windows
The install script targets Unix-like systems. On Windows, use the GitHub Releases method below, or build from source with Cargo.
:::

### Option 2: Build from Source

If you have Rust and Cargo installed (and honestly, you probably do if you're interested in a language with Rust-style ADTs):

```sh
cargo install --path crates/valenc
```

Or from the GitHub repository directly:

```sh
git clone https://github.com/NaruseNia/valen-lang.git
cd valen-lang
cargo install --path crates/valenc
```

### Option 3: GitHub Releases

Head to the [Releases page](https://github.com/NaruseNia/valen-lang/releases) and download the binary for your platform. Put it somewhere on your PATH and you're done.

## Verify the Installation

```sh
valenc version
```

You should see something like:

```
valenc 0.1.0
```

If you see `command not found`, make sure the install directory is on your PATH. The install script prints the exact location — check there first.

## Your First Valen Program

Create a file called `hello.vln`:

```valen
package com.example.hello;

fn main() {
    println("Hello, Valen!");
}
```

::: tip .vln, not .val
Valen source files use the `.vln` extension. We considered `.val`, but that was already taken by about twelve other things.
:::

Compile it:

```sh
valenc hello.vln
```

This produces a `.class` file. Run it with Java:

```sh
java -cp . com.example.hello.MainKt
```

You should see:

```
Hello, Valen!
```

Congratulations — you've just compiled and run your first Valen program. That wasn't so bad, was it?

## Editor Setup

Valen ships with an LSP server (`valen-lsp`) that provides completions, hover information, and diagnostics. It works with any editor that supports the Language Server Protocol.

### Install the LSP Server

If you built from source, the LSP server is in the same repository:

```sh
cargo install --path crates/valen-lsp
```

### Editor Configuration

**VS Code:** Install the Valen extension from the marketplace (coming soon), or point a generic LSP client at the `valen-lsp` binary.

**Neovim (nvim-lspconfig):**

```lua
require('lspconfig').valen_lsp.setup {
    cmd = { "valen-lsp" },
    filetypes = { "valen" },
    root_dir = require('lspconfig.util').root_pattern("valen.toml", ".git"),
}
```

**Any LSP-compatible editor:** Just point it at the `valen-lsp` binary. The server speaks standard LSP over stdio.

::: tip Syntax Highlighting
For the best experience, pair the LSP with a TextMate grammar for Valen. The docs site itself uses one — check the [valen-docs repository](https://github.com/NaruseNia/valen-docs) for `valen.tmLanguage.json`.
:::

## Project Structure

A typical Valen project looks like this:

```
my-project/
├── src/
│   └── com/
│       └── example/
│           └── app/
│               ├── main.vln
│               └── models.vln
└── build/
```

Source files live under `src/`, mirroring the package hierarchy (just like Java). The `package` declaration at the top of each file must match its directory path.

## What's Next?

Now that you're set up, let's write something more interesting than "Hello, World." Head to [Hello, Valen](./hello-valen) for a guided tour of Valen's key features in a single program.
