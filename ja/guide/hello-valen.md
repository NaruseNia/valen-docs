# Hello, Valen

実際のプログラムを書いてみましょう。data class、enum、trait、パターンマッチ、失敗モデルなど、Valenの特徴を見せる小さなタスクトラッカーを作ります。最後には、Valenのコードがどう構成されるか、動くメンタルモデルが手に入るはずです。

## プログラム全体

まず全体を見てみましょう。心配いりません — 各パーツは後でひとつずつ解説します。

```valen
package com.example.tasks;

import java.util.List;

// -- データモデリング --

enum Priority {
    Low,
    Medium,
    High,
    Critical(reason: String),
}

data class Task(
    pub title: String,
    pub priority: Priority,
    pub done: Bool,
);

// -- traitの定義 --

trait Summarize {
    fn summary(self) -> String;
}

// -- traitの実装 --

impl Summarize for Task {
    fn summary(self) -> String {
        let status = if self.done { "done" } else { "todo" };
        let prio = match self.priority {
            Priority::Low => "low",
            Priority::Medium => "med",
            Priority::High => "HIGH",
            Priority::Critical(reason) => f"CRITICAL: {reason}",
        };
        f"[{status}] {self.title} ({prio})"
    }
}

// -- Resultを返すヘルパー関数 --

fn find_critical(tasks: List<Task>) -> Result<Task, String> {
    for task in tasks {
        if let Priority::Critical(_) = task.priority {
            return Result::Ok(task);
        }
    }
    Result::Err("no critical tasks found")
}

// -- エントリーポイント --

fn main() {
    let tasks = List.of(
        Task(title = "Write docs", priority = Priority::Low, done = true),
        Task(title = "Fix bug #42", priority = Priority::High, done = false),
        Task(title = "Deploy to prod", priority = Priority::Critical(reason = "deadline Friday"), done = false),
    );

    for task in tasks {
        println(task.summary());
    }

    match find_critical(tasks) {
        Result::Ok(t) => println(f"\nAlert: {t.title} needs attention!"),
        Result::Err(msg) => println(f"\nAll clear: {msg}"),
    }
}
```

## 各パーツの解説

### パッケージ宣言

```valen
package com.example.tasks;
```

すべてのValenファイルは `package` 宣言から始まります。これは必須です — パッケージがなければコンパイルできません。パッケージはJavaと同じくディレクトリ構造にマッピングされます。ソースファイルの拡張子は `.vln`、エンコーディングはUTF-8です。

### インポート

```valen
import java.util.List;
```

そう、Javaのインポートです。そのまま動きます。`List.of(...)` は内部で実際の `java.util.List.of()` を呼んでいます。ラッパーもアダプターもボイラープレートもなし。これが「Javaエコシステムに乗る」ということの実際の姿です。

### enum（ADT）

```valen
enum Priority {
    Low,
    Medium,
    High,
    Critical(reason: String),
}
```

おじいちゃんのJava enumとは**違います**。各バリアントはデータを持てます — `Critical` は `reason` 文字列を保持し、`Low`、`Medium`、`High` は何も持ちません。これはちゃんとした直和型で、コンパイラは `Priority` が取りうるすべての形を正確に把握して、それらをすべて処理しているか確認してくれます。

### data class

```valen
data class Task(
    pub title: String,
    pub priority: Priority,
    pub done: Bool,
);
```

`data class` は `equals`、`hashCode`、`toString`、`copy` を自動生成します。暗黙的に `Eq`、`Hash`、`Display`、`Clone` traitも満たします。`pub` キーワードはフィールドを外部から読み取り可能にするもの。なければフィールドはクラスに対してprivateです。

getterもsetterもありません。`val` vs `var` の議論もなし。`pub` で公開、何もなければprivate、可変性が必要なら `pub mut`。シンプル。

### trait

```valen
trait Summarize {
    fn summary(self) -> String;
}
```

traitは共有の振る舞いを定義します。Rustのtraitやhaskellの型クラスを知っているなら、同じ概念ですね。Java/Kotlinから来た人は、インターフェースだと思ってください — ただし、誰が何に対して実装できるかについて、より厳格なルールがあります。

### traitの実装

```valen
impl Summarize for Task {
    fn summary(self) -> String {
        let status = if self.done { "done" } else { "todo" };
        let prio = match self.priority {
            Priority::Low => "low",
            Priority::Medium => "med",
            Priority::High => "HIGH",
            Priority::Critical(reason) => f"CRITICAL: {reason}",
        };
        f"[{status}] {self.title} ({prio})"
    }
}
```

いくつか注目ポイントがあります:

- `impl Trait for Type` はクラス/data classの本体の*外側*に書きます。データ定義と振る舞いの分離ですね。
- `if` は式です — 値を返すので、`let status` に直接代入できます。
- `match` は網羅的 — 4つのアームが `Priority` の4つのバリアントすべてをカバーしています。1つ削除するとコンパイラが文句を言います。
- `f"..."` はフォーマット文字列。`{...}` 内の式が展開されます。

### 関数とResult型

```valen
fn find_critical(tasks: List<Task>) -> Result<Task, String> {
    for task in tasks {
        if let Priority::Critical(_) = task.priority {
            return Result::Ok(task);
        }
    }
    Result::Err("no critical tasks found")
}
```

この関数は `Result<Task, String>` を返します — タスクを含む `Ok` か、メッセージを含む `Err` のどちらか。例外もnullもなし。

`if let` はフル `match` を書かずに単一パターンを分解するやり方です。`_` は「reasonフィールドは今は気にしない」という意味。

最後の行に `return` がないことに気づきましたか？ Valenは式指向なので、ブロックの最後の式がその値になります。

### main関数

```valen
fn main() {
    let tasks = List.of(
        Task(title = "Write docs", priority = Priority::Low, done = true),
        Task(title = "Fix bug #42", priority = Priority::High, done = false),
        Task(title = "Deploy to prod", priority = Priority::Critical(reason = "deadline Friday"), done = false),
    );

    for task in tasks {
        println(task.summary());
    }

    match find_critical(tasks) {
        Result::Ok(t) => println(f"\nAlert: {t.title} needs attention!"),
        Result::Err(msg) => println(f"\nAll clear: {msg}"),
    }
}
```

`fn main()` がエントリーポイントです。クラスのラッピングも、`static` も、`Array<String>` も不要 — トップレベル関数だけ。

名前付き引数（`title = "Write docs"`）のおかげで、ビルダーなしでも構築が読みやすくなっています。末尾の `match` は `Ok` と `Err` 両方のパスを処理します — もちろん網羅的に。

## コンパイルと実行

コードを `src/com/example/tasks/main.vln` として保存して、以下を実行してください:

```sh
valenc src/com/example/tasks/main.vln
java -cp . com.example.tasks.Main
```

期待される出力:

```
[done] Write docs (low)
[todo] Fix bug #42 (HIGH)
[todo] Deploy to prod (CRITICAL: deadline Friday)

Alert: Deploy to prod needs attention!
```

## まとめ

約50行で、以下の機能を体験しました:

| 機能 | 使ったもの |
|---|---|
| **パッケージとインポート** | `package`、`import java.util.List` |
| **enum（ADT）** | ペイロード付きバリアントの `Priority` |
| **data class** | 自動生成メソッド付きの `Task` |
| **trait + impl** | `Task` に実装した `Summarize` |
| **パターンマッチ** | enumへの `match`、単一パターンの `if let` |
| **Result型** | 例外の代わりに `Result::Ok` / `Result::Err` |
| **式指向** | 式としての `if` と `match` |
| **フォーマット文字列** | `f"..."` による文字列補間 |
| **Java相互運用** | `java.util.List` の `List.of(...)` |

## 次のステップ

全体像が見えたところで、詳細に掘り下げていきましょう:

- **[変数と型](/ja/guide/variables-and-types)** — プリミティブ、型推論、暗黙の変換がない理由
- **[関数](/ja/guide/functions)** — 名前付き引数、デフォルトパラメータ、UFCS、`self` の仕組み
- **[enumとADT](/ja/guide/enums)** — バリアントの省略記法、sealedクラス、使い分け
- **[trait](/ja/guide/traits)** — オーファンルール、一貫性、固有impl
- **[エラー処理](/ja/guide/error-handling)** — `?` 演算子、`safe { ... }`、完全な失敗モデル

Happy hacking.
