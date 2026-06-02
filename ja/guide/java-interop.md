# Java 相互運用

Valen は JVM 上で動いていて、それを隠すつもりはありません。Java クラスのインポート、Java メソッドの呼び出し、Java コレクションのイテレーション、Java エコシステム全体の利用 — すべてラッパーやコード生成なしでできます。唯一の条件: Valen は null と例外について正直であることを求めてきます。

## Java 型のインポート

`import` で完全修飾クラス名を使います:

```valen
import java.util.List;
import java.util.HashMap;
import java.util.concurrent.ConcurrentHashMap;
```

### `as` によるエイリアス

長いクラス名？ 名前衝突？ `as` を使いましょう:

```valen
import java.util.concurrent.ConcurrentHashMap as CMap;

let cache = CMap<String, Int>();
```

## コンストラクタ — `safe` の唯一の例外

Java コンストラクタには `safe` も `unsafe` も要りません。常に非 null のインスタンスを返す（投げたらオブジェクト自体が存在しない）ので、Valen は直接呼び出しを許可しています:

```valen
let list = ArrayList();
let map = HashMap<String, Int>();
```

以上。儀式なし。

## Java メソッドの呼び出し

ルールはシンプルです: **すべての Java メソッド呼び出しは `safe { }` または `unsafe { }` でラップすべき**。裸の呼び出しは非推奨で、将来的にはコンパイルエラーになります。

```valen
// 将来コンパイルエラーになる — 裸の Java メソッド呼び出し
let content = Files.readString(path);

// OK — safe でラップ
let content = safe { Files.readString(path) };

// OK — unsafe でラップ（自己責任）
let content = unsafe { Files.readString(path) };
```

なぜかというと、Java メソッドは例外を投げたり null を返したりする可能性があるからです。Valen はそれを無視させてくれません。

::: info 将来的に強制される
Java メソッド呼び出しの `safe`/`unsafe` 要件は Valen の設計の一部ですが、現在コンパイラは裸の呼び出しを拒否しません。まだコンパイルは通ります。将来のバージョンで強制されるので、今から `safe`/`unsafe` を使い始めることをおすすめします。
:::

### 3つのモード

| 構文 | 戻り値型 | 例外 | Null |
|---|---|---|---|
| `safe { expr }` | `Result<Option<T>, JavaException>` | `Err` にラップ | null は `None` |
| `safe? expr` | `Option<T>` | `?` で早期リターン | null は `None` |
| `unsafe { expr }` | `T`（非 nullable） | パススルー（クラッシュ） | NPE リスク |

::: tip デフォルトは `safe`
`unsafe` は呼び出しが絶対に投げない＆絶対に null を返さないと確信できる場合だけ。迷ったら `safe` にしておきましょう。
:::

## Null ハンドリング: `T?` と `Option<T>` は別物

Valen では大事な区別があります:

| 型 | 本質 | 出現タイミング |
|---|---|---|
| `T?` | Nullable 型 — JVM null が有効な値 | Java メソッドの戻り値、Java 相互運用 |
| `Option<T>` | Valen ネイティブの ADT enum（`Some(T)` / `None`） | Valen ネイティブのコード |

**`T?` は `Option<T>` の糖衣構文じゃありません。** Valen の型システムにおいて完全に別の型です。

- `T?` は JVM のボックス型にマップされる（例: `Int?` は `java/lang/Integer` になる）
- `Option<T>` は `Some` と `None` バリアントを持つ本物の Valen enum

`safe { }` 内で Java メソッドを呼ぶと、戻り値は `T?`（nullable）として型付けされます。Java メソッドは約束しても常に null を返す可能性があるので:

```valen
import java.util.HashMap;

let map = HashMap<String, String>();
safe { map.put("key", "value") };

// map.get() は Java では V を返すが、Valen の safe コンテキストでは T?
let result = safe { map.get("key") };
// result: Result<String?, JavaException>
```

`void` メソッドは `Unit` として返ります — nullable ラッピングは不要です。

Kotlin は「プラットフォーム型 `T!`」アプローチを選びました — null かもしれないし、そうでないかもしれない、誰にもわからない。Valen のスタンスは: 常に `T?`。ぶっちゃけ退屈なほど安全です。

### `?` 演算子は `T?` に作用しない

`?`（try）演算子は `Option<T>` と `Result<T, E>` に作用しますが、**`T?` には作用しません**。nullable 値を変換する必要がある場合は明示的に処理してください。

## コレクション: `for` がそのまま動く

Java の `Iterable` 型は `for` で直接使えます:

```valen
import java.util.ArrayList;

let names = ArrayList<String>();
safe { names.add("Alice") };
safe { names.add("Bob") };

for name in names {
    println(name);
}
```

内部的には `.iterator()` / `hasNext()` / `next()` パターンにコンパイルされます。特別なことはなくて、ただ動くだけ。

## ジェネリック型の追跡

Valen は Java クラスのシグネチャを読んでジェネリック型引数を追跡します:

```valen
import java.util.HashMap;
import java.util.ArrayList;

let map = HashMap<String, Int>();
let list = ArrayList<String>();
let nested = HashMap<String, ArrayList<Int>>();

// 推論で十分なら型引数を省略
let inferred = ArrayList();  // ArrayList<Any>
```

`K`、`V` のような型変数はインスタンスの型引数から解決されるので、`map.get("key")` が `Any?` ではなく `String?` を返すとわかります。

## `@valen.Closed` — Java Sealed 型の網羅的 Match

Valen 独自の `enum`、`sealed class`、`sealed trait` は自動的に網羅的 `match` チェックが行われます。でも Java の sealed 型はちょっと厄介で、クラスパスが変わって背後で新しい permitted サブタイプが追加される可能性があるんです。

### デフォルト: オープンワールド

`@valen.Closed` なしの場合、Java sealed 型にはワイルドカード `_` アームが必要です:

```valen
// Java: sealed interface Color permits Red, Blue, Green
// @valen.Closed アノテーションなし

match color {
    Color.Red => "red",
    Color.Blue => "blue",
    Color.Green => "green",
    _ => "unknown",  // 必須！省略するとコンパイラが怒ります。
}
```

### オプトイン: `@valen.Closed`

Java ライブラリの作者が sealed 階層に `@valen.Closed` をアノテーションすると、Valen はクローズドワールドとして扱います:

```java
// Java 側 — ライブラリ作者がこれを追加
package com.example;

import valen.Closed;

@Closed
public sealed interface Color permits Red, Blue, Green {}
public final class Red implements Color {}
public final class Blue implements Color {}
public final class Green implements Color {}
```

```valen
// Valen 側 — 網羅的 match が動作
import com.example.Color;

match color {
    Color.Red => "red",
    Color.Blue => "blue",
    Color.Green => "green",
    // すべてのケースをカバー。コンパイラも満足。
}
```

::: info @valen.Closed は Java 側のアノテーション
Valen コードで `@valen.Closed` を書くことはありません。Java ライブラリの作者が「この階層は安定している、約束する」と宣言するためのものです。
:::

## クラスパスの設定

### JDK の自動検出

`valenc` は `JAVA_HOME` 経由で JDK 標準ライブラリを自動検出します。`java.util.ArrayList` のようなクラスはフラグなしでそのまま使えますよ。

### ライブラリの追加

サードパーティの JAR には `--classpath` を使います:

```sh
valenc compile --classpath lib/guava.jar:lib/commons.jar src/main.vln
```

- パスは `:` で区切る（Linux/macOS）、`;` で区切る（Windows）
- JAR ファイル、JMOD ファイル、ディレクトリを受け付ける
- JDK クラスは `--classpath` に関係なく常に利用可能

## クイックリファレンス

| タスク | 方法 |
|---|---|
| Java クラスのインポート | `import java.util.List;` |
| 長い名前のエイリアス | `import ... as Alias;` |
| Java メソッドの安全な呼び出し | `safe { javaMethod() }` |
| `?` 伝搬付き呼び出し | `safe? javaMethod()` |
| Java オブジェクトの生成 | `ArrayList()`（`safe` 不要） |
| Java からの null の処理 | `T?` — nullable 型（`Option<T>` ではない） |
| Java コレクションのイテレーション | `for item in list { ... }` |
| sealed 型の網羅的 match | ライブラリに `@valen.Closed` が必要 |
| クラスパスへの追加 | `valenc compile --classpath path.jar` |

## 次のステップ

- [Inline と Reified](/ja/guide/inline-reified) — インライン関数と実行時の型情報
- [エラーハンドリング](/ja/guide/error-handling) — `safe`、`Result`、`?` の深掘り
