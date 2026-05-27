# はじめに

Valenコンパイラをマシンにインストールしましょう。2分もあれば終わります — コーヒーが冷める前にコンパイルできるようになりますよ。

## 前提条件

- **JVM 21以降** — ValenはJVM 21をベースラインターゲットとしています。コンパイル結果を実行するにはJDKが必要です。
- **ターミナル** — 当然ですね。

## インストール

一番楽そうな方法を選んでください。

### 方法1: インストールスクリプト（推奨）

```sh
curl -fsSL https://raw.githubusercontent.com/NaruseNia/valen-lang/main/install.sh | bash
```

最新リリースのバイナリをダウンロードしてPATHに配置します。macOSとLinuxで動作します。

::: warning Windows
インストールスクリプトはUnix系システム向けです。Windowsでは下記のGitHub Releasesからダウンロードするか、Cargoでソースからビルドしてください。
:::

### 方法2: ソースからビルド

RustとCargoがインストール済みなら（Rustスタイルのadtを持つ言語に興味があるなら、きっとそうですよね）:

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

[Releasesページ](https://github.com/NaruseNia/valen-lang/releases)からプラットフォーム用のバイナリをダウンロード。PATH上のどこかに置けば完了です。

## インストールの確認

```sh
valenc version
```

こんな出力が表示されるはずです:

```
valenc 0.1.0
```

`command not found` と表示される場合は、インストール先ディレクトリがPATHに含まれているか確認してください。インストールスクリプトが正確な場所を表示するので、まずそこをチェック。

## 最初のValenプログラム

`hello.vln` というファイルを作りましょう。

```valen
package com.example.hello;

fn main() {
    println("Hello, Valen!");
}
```

::: tip .vlnであって.valではない
Valenのソースファイルは `.vln` 拡張子を使い、UTF-8でエンコードされている必要があります。`.val` も検討したんですが、すでに他の12個くらいのものに使われていました。
:::

コンパイル:

```sh
valenc hello.vln
```

`.class` ファイルが生成されます。Javaで実行:

```sh
java -cp . com.example.hello.Main
```

こう表示されるはずです:

```
Hello, Valen!
```

おめでとうございます — 最初のValenプログラムをコンパイルして実行できました。そんなに大変じゃなかったですよね？

## エディタ設定

ValenにはLSPサーバー（`valen-lsp`）が同梱されていて、補完、ホバー情報、診断を提供します。Language Server Protocolをサポートする任意のエディタで動作します。

### LSPサーバーのインストール

ソースからビルドした場合、LSPサーバーは同じリポジトリ内にあります:

```sh
cargo install --path crates/valen-lsp
```

### エディタの設定

**VS Code:** マーケットプレイスからValen拡張機能をインストール（近日公開）、または汎用LSPクライアントで `valen-lsp` バイナリを指定してください。

**Neovim (nvim-lspconfig):**

```lua
require('lspconfig').valen_lsp.setup {
    cmd = { "valen-lsp" },
    filetypes = { "valen" },
    root_dir = require('lspconfig.util').root_pattern("valen.toml", ".git"),
}
```

**その他のLSP対応エディタ:** `valen-lsp` バイナリを指定するだけでOKです。サーバーは標準LSPをstdio経由で通信します。

::: tip シンタックスハイライト
最良の体験のために、LSPとValen用のTextMate文法を組み合わせましょう。このドキュメントサイト自体も使っています — [valen-docsリポジトリ](https://github.com/NaruseNia/valen-docs)で `valen.tmLanguage.json` を確認できます。
:::

## プロジェクト構成

典型的なValenプロジェクトはこんな構成です:

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

ソースファイルは `src/` 以下に、パッケージ階層をミラーして配置します（Javaと同じ）。各ファイル先頭の `package` 宣言はディレクトリパスと一致している必要があります。

## 次のステップ

セットアップが完了したので、「Hello, World」よりもうちょっと面白いものを書いてみましょう。[Hello, Valen](/ja/guide/hello-valen)でValenの主要機能を1つのプログラムで体験するガイドツアーへ進みましょう。
