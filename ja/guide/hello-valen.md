# Hello, Valen

実際のプログラムを書いてみよう。data class、enum、trait、パターンマッチ、失敗モデルなど、Valenの特徴を見せる小さなタスクトラッカーを作る。最後には、Valenのコードがどのように構成されるか、動くメンタルモデルが手に入る。

## プログラム全体

まず全体を見てみよう。心配いらない — 各パーツは後で一つずつ解説する。

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

すべてのValenファイルは `package` 宣言から始まる。必須だ — パッケージがなければコンパイルできない。パッケージはJavaと同じくディレクトリ構造にマッピングされる。ソースファイルは `.vln` 拡張子を使い、UTF-8でエンコードされている必要がある。

### インポート

```valen
import java.util.List;
```

そう、Javaのインポートだ。そのまま動く。`List.of(...)` は内部で実際の `java.util.List.of()` を呼び出している。ラッパーもアダプターもボイラープレートもなし。これが「Javaエコシステムに乗る」ということの実際の姿だ。

### enum（ADT）

```valen
enum Priority {
    Low,
    Medium,
    High,
    Critical(reason: String),
}
```

おじいちゃんのJava enumとは**違う**。各バリアントはデータを持てる — `Critical` は `reason` 文字列を保持し、`Low`、`Medium`、`High` は何も持たない。これは正当な直和型であり、コンパイラは `Priority` が取りうるすべての形を正確に把握し、それらをすべて処理しているか確認する。

### data class

```valen
data class Task(
    pub title: String,
    pub priority: Priority,
    pub done: Bool,
);
```

`data class` は `equals`、`hashCode`、`toString`、`copy` を自動生成する。また暗黙的に `Eq`、`Hash`、`Display`、`Clone` traitを満たす。`pub` キーワードはフィールドを外部から読み取り可能にする。なければフィールドはクラスに対してprivate。

getterもsetterもない。`val` vs `var` の議論もない。`pub` で公開、何もなければprivate、可変性が必要なら `pub mut`。

### trait

```valen
trait Summarize {
    fn summary(self) -> String;
}
```

traitは共有の振る舞いを定義する。Rustのtraitやhaskellの型クラスを知っているなら、同じ概念だ。Java/Kotlinから来た人は、インターフェースだと思えばいい — ただし、誰が何に対して実装できるかについてより厳格なルールがある。

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

いくつか注目すべき点:

- **`impl Trait for Type`** はクラス/data classの本体の*外側*に書く。データ定義と振る舞いを分離する。
- **`if` は式** — 値を返すので、`let status` に直接代入できる。
- **`match` は網羅的** — 4つのアームが `Priority` の4つのバリアントすべてをカバーしている。1つ削除するとコンパイラが文句を言う。
- **`f"..."`** はフォーマット文字列。`{...}` 内の式が展開される。

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

この関数は `Result<Task, String>` を返す — タスクを含む `Ok` か、メッセージを含む `Err` のどちらか。例外もnullもなし。

`if let` はフル `match` を書かずに単一パターンを分解する。`_` は「reasonフィールドは今は気にしない」という意味。

最後の行に `return` がないことに注目 — Valenは式指向なので、ブロックの最後の式がその値になる。

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

`fn main()` がエントリーポイント。クラスのラッピングも、`static` も、`Array<String>` も不要 — トップレベル関数だけ。

名前付き引数（`title = "Write docs"`）によりビルダーなしで構築が読みやすくなる。末尾の `match` は `Ok` と `Err` 両方のパスを処理する — もちろん網羅的に。

## コンパイルと実行

コードを `src/com/example/tasks/main.vln` として保存し、以下を実行:

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

約50行で、以下の機能を体験した:

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

全体像が見えたところで、詳細に掘り下げていこう:

- **[変数と型](/ja/guide/variables-and-types)** — プリミティブ、型推論、暗黙の変換がない理由
- **[関数](/ja/guide/functions)** — 名前付き引数、デフォルトパラメータ、UFCS、`self` の仕組み
- **[enumとADT](/ja/guide/enums)** — バリアントの省略記法、sealedクラス、使い分け
- **[trait](/ja/guide/traits)** — オーファンルール、一貫性、固有impl
- **[エラー処理](/ja/guide/error-handling)** — `?` 演算子、`safe { ... }`、完全な失敗モデル

Happy hacking.
