# Java 相互運用

Valen は JVM 上で動作し、それを隠そうとしない。Java クラスのインポート、Java メソッドの呼び出し、Java コレクションのイテレーション、Java エコシステム全体の利用 — すべてラッパーやコード生成なしで可能。唯一の条件: Valen は null と例外について正直であることを求める。

## Java 型のインポート

`import` で完全修飾クラス名を使う:

```valen
import java.util.List;
import java.util.HashMap;
import java.util.concurrent.ConcurrentHashMap;
```

### `as` によるエイリアス

長いクラス名？ 名前衝突？ `as` を使う:

```valen
import java.util.concurrent.ConcurrentHashMap as CMap;

let cache = CMap<String, Int>();
```

## コンストラクタ — `safe` の唯一の例外

Java コンストラクタは `safe` も `unsafe` も不要。常に非 null のインスタンスを返す（投げた場合はオブジェクトが存在しない）ため、Valen は直接呼び出しを許可する:

```valen
let list = ArrayList();
let map = HashMap<String, Int>();
```

以上。儀式なし。

## Java メソッドの呼び出し

ルール: **すべての Java メソッド呼び出しは `safe { }` または `unsafe { }` でラップすべき**。裸の呼び出しは非推奨で、将来的にはコンパイルエラーになる。

```valen
// 将来コンパイルエラーになる — 裸の Java メソッド呼び出し
let content = Files.readString(path);

// OK — safe でラップ
let content = safe { Files.readString(path) };

// OK — unsafe でラップ（自己責任）
let content = unsafe { Files.readString(path) };
```

なぜか？ Java メソッドは例外を投げ、null を返す可能性がある。Valen はそれを無視させない。

::: info 将来的に強制される
Java メソッド呼び出しの `safe`/`unsafe` 要件は Valen の設計の一部だが、現在コンパイラは裸の呼び出しを拒否しない。裸の呼び出しはまだコンパイルされる。将来のバージョンでこのルールが強制されるため、今から `safe`/`unsafe` を採用することを推奨。
:::

### 3つのモード

| 構文 | 戻り値型 | 例外 | Null |
|---|---|---|---|
| `safe { expr }` | `Result<T?, JavaException>` | `Err` にラップ | Nullable `T?` |
| `safe? expr` | `T?` | `?` で早期リターン | Nullable `T?` |
| `unsafe { expr }` | `T`（非 nullable） | パススルー（クラッシュ） | NPE リスク |

::: tip デフォルトは `safe`
`unsafe` は呼び出しが絶対に投げない、絶対に null を返さないと確信できる場合のみ。迷ったら `safe` を使う。
:::

## Null ハンドリング: `T?` と `Option<T>` は別物

Valen における重要な区別:

| 型 | 本質 | 出現タイミング |
|---|---|---|
| `T?` | Nullable 型 — JVM null が有効な値 | Java メソッドの戻り値、Java 相互運用 |
| `Option<T>` | Valen ネイティブの ADT enum（`Some(T)` / `None`） | Valen ネイティブのコード |

**`T?` は `Option<T>` の糖衣構文ではない。** Valen の型システムにおいて完全に別の型。

- `T?` は JVM のボックス型にマップされる（例: `Int?` は `java/lang/Integer` になる）
- `Option<T>` は `Some` と `None` バリアントを持つ本物の Valen enum

`safe { }` 内で Java メソッドを呼ぶと、戻り値は `T?`（nullable）として型付けされる。Java メソッドは約束しても常に null を返す可能性があるため:

```valen
import java.util.HashMap;

let map = HashMap<String, String>();
safe { map.put("key", "value") };

// map.get() は Java では V を返すが、Valen の safe コンテキストでは T?
let result = safe { map.get("key") };
// result: Result<String?, JavaException>
```

`void` メソッドは `Unit` として返る — nullable ラッピング不要。

Kotlin は「プラットフォーム型 `T!`」アプローチを選んだ — null かもしれないし、そうでないかもしれない、誰にも分からない。Valen は言う: 常に `T?`。退屈なほど安全。

### `?` 演算子は `T?` に作用しない

`?`（try）演算子は `Option<T>` と `Result<T, E>` に作用するが、**`T?` には作用しない**。nullable 値を変換する必要がある場合は明示的に処理する。

## コレクション: `for` がそのまま動く

Java の `Iterable` 型は `for` で直接使える:

```valen
import java.util.ArrayList;

let names = ArrayList<String>();
safe { names.add("Alice") };
safe { names.add("Bob") };

for name in names {
    println(name);
}
```

内部的には `.iterator()` / `hasNext()` / `next()` パターンにコンパイルされる。特別なことはない、ただ動く。

## ジェネリック型の追跡

Valen は Java クラスのシグネチャを読んでジェネリック型引数を追跡する:

```valen
import java.util.HashMap;
import java.util.ArrayList;

let map = HashMap<String, Int>();
let list = ArrayList<String>();
let nested = HashMap<String, ArrayList<Int>>();

// 推論で十分なら型引数を省略
let inferred = ArrayList();  // ArrayList<Any>
```

`K`、`V` のような型変数はインスタンスの型引数から解決されるため、`map.get("key")` は `Any?` ではなく `String?` を返すと分かる。

## `@valen.Closed` — Java Sealed 型の網羅的 Match

Valen 独自の `enum`、`sealed class`、`sealed trait` は自動的に網羅的 `match` チェックが行われる。だが Java の sealed 型は厄介 — クラスパスが変わって、背後で新しい permitted サブタイプが追加される可能性がある。

### デフォルト: オープンワールド

`@valen.Closed` なしの場合、Java sealed 型にはワイルドカード `_` アームが必要:

```valen
// Java: sealed interface Color permits Red, Blue, Green
// @valen.Closed アノテーションなし

match color {
    Color.Red => "red",
    Color.Blue => "blue",
    Color.Green => "green",
    _ => "unknown",  // 必須！省略するとコンパイラが怒る。
}
```

### オプトイン: `@valen.Closed`

Java ライブラリの作者が sealed 階層に `@valen.Closed` をアノテーションすると、Valen はクローズドワールドとして扱う:

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
Valen コードで `@valen.Closed` を書くことはない。Java ライブラリの作者が「この階層は安定している、約束する」と宣言するためのもの。
:::

## クラスパスの設定

### JDK の自動検出

`valenc` は `JAVA_HOME` 経由で JDK 標準ライブラリを自動検出する。`java.util.ArrayList` のようなクラスはフラグなしでそのまま使える。

### ライブラリの追加

サードパーティの JAR には `--classpath` を使う:

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
