# はじめに

Valenコンパイラをマシンにインストールしよう。2分もあれば終わる — コーヒーが冷める前にコンパイルできるようになる。

## 前提条件

- **JVM 21以降** — ValenはJVM 21をベースラインターゲットとしている。コンパイル結果を実行するにはJDKが必要。
- **ターミナル** — 当然だが。

## インストール

一番楽そうな方法を選ぼう:

### 方法1: インストールスクリプト（推奨）

```sh
curl -fsSL https://raw.githubusercontent.com/NaruseNia/valen-lang/main/install.sh | bash
```

最新リリースのバイナリをダウンロードしてPATHに配置する。macOSとLinuxで動作する。

::: warning Windows
インストールスクリプトはUnix系システム向け。Windowsでは下記のGitHub Releasesからダウンロードするか、Cargoでソースからビルドすること。
:::

### 方法2: ソースからビルド

RustとCargoがインストール済みなら（Rustスタイルのadtを持つ言語に興味があるなら、おそらくそうだろう）:

```sh
cargo install --path crates/valenc
```

または、GitHubリポジトリから直接:

```sh
git clone https://github.com/NaruseNia/valen-lang.git
cd valen-lang
cargo install --path crates/valenc
```

### 方法3: GitHub Releases

[Releasesページ](https://github.com/NaruseNia/valen-lang/releases)からプラットフォーム用のバイナリをダウンロード。PATH上のどこかに置けば完了。

## インストールの確認

```sh
valenc version
```

以下のような出力が表示されるはず:

```
valenc 0.1.0
```

`command not found` と表示される場合は、インストール先ディレクトリがPATHに含まれているか確認しよう。インストールスクリプトが正確な場所を表示するので、まずそこをチェック。

## 最初のValenプログラム

`hello.vln` というファイルを作成する:

```valen
package com.example.hello;

fn main() {
    println("Hello, Valen!");
}
```

::: tip .vlnであって.valではない
Valenのソースファイルは `.vln` 拡張子を使い、UTF-8でエンコードされている必要がある。`.val` も検討したが、すでに他の12個くらいのものに使われていた。
:::

コンパイル:

```sh
valenc hello.vln
```

`.class` ファイルが生成される。Javaで実行:

```sh
java -cp . com.example.hello.Main
```

以下が表示されるはず:

```
Hello, Valen!
```

おめでとう — 最初のValenプログラムをコンパイルして実行できた。そんなに大変じゃなかっただろう？

## エディタ設定

ValenにはLSPサーバー（`valen-lsp`）が同梱されており、補完、ホバー情報、診断を提供する。Language Server Protocolをサポートする任意のエディタで動作する。

### LSPサーバーのインストール

ソースからビルドした場合、LSPサーバーは同じリポジトリ内にある:

```sh
cargo install --path crates/valen-lsp
```

### エディタの設定

**VS Code:** マーケットプレイスからValen拡張機能をインストール（近日公開）、または汎用LSPクライアントで `valen-lsp` バイナリを指定。

**Neovim (nvim-lspconfig):**

```lua
require('lspconfig').valen_lsp.setup {
    cmd = { "valen-lsp" },
    filetypes = { "valen" },
    root_dir = require('lspconfig.util').root_pattern("valen.toml", ".git"),
}
```

**その他のLSP対応エディタ:** `valen-lsp` バイナリを指定するだけ。サーバーは標準LSPをstdio経由で通信する。

::: tip シンタックスハイライト
最良の体験のために、LSPとValen用のTextMate文法を組み合わせよう。このドキュメントサイト自体も使っている — [valen-docsリポジトリ](https://github.com/NaruseNia/valen-docs)で `valen.tmLanguage.json` を確認できる。
:::

## プロジェクト構成

典型的なValenプロジェクトは以下のような構成:

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

ソースファイルは `src/` 以下に、パッケージ階層をミラーして配置する（Javaと同じ）。各ファイル先頭の `package` 宣言はディレクトリパスと一致している必要がある。

## 次のステップ

セットアップが完了したので、「Hello, World」より面白いものを書いてみよう。[Hello, Valen](/ja/guide/hello-valen)でValenの主要機能を1つのプログラムで体験するガイドツアーへ進もう。
