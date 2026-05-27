# Java 連携

Valen は JVM 上で動作し、Java ライブラリを直接利用できます。このページでは Java コードとの相互運用のルールとメカニズムを説明します。

## Import 構文

```valen
import java.util.List;
import java.util.HashMap;
import java.util.concurrent.ConcurrentHashMap as CMap;
```

| 形式 | 例 |
|---|---|
| 単一 import | `import java.util.List;` |
| エイリアス import | `import java.util.HashMap as HMap;` |
| 選択的 / グロブ | **サポートされていない** |

## コンストラクタ呼び出し

Java コンストラクタには `safe` や `unsafe` ラッパーが**不要**です。コンストラクタは常に非 null を返し、スローした場合はオブジェクトが生成されません。

```valen
let list = ArrayList();
let map = HashMap<String, Int>();
```

## メソッド呼び出し

すべての Java メソッド呼び出しは `safe` または `unsafe` でラップしてください。

| モード | 戻り型 | 例外 | null |
|---|---|---|---|
| `safe { expr }` | `Result<T?, JavaException>` | キャッチ → `Err` | `T?` (nullable) |
| `safe expr` | `Result<T?, JavaException>` | キャッチ → `Err` | `T?` (nullable) |
| `safe? expr` | `T?` | `?` で早期リターン | `T?` (nullable) |
| `unsafe { expr }` | `T` (non-nullable) | パススルー | NPE リスク |
| `unsafe expr` | `T` (non-nullable) | パススルー | NPE リスク |

::: warning 将来
素の Java メソッド呼び出し（`safe` も `unsafe` もなし）はコンパイルエラーにする予定ですが、**この制限はまだ強制されていません**。素の呼び出しは正常にコンパイルされます。将来のバージョンで拒否予定です。
:::

```valen
// safe ブロック — 完全な制御
let result = safe { file.readString() };  // Result<String?, JavaException>

// safe? — Result をアンラップ、Option を保持
let content: String? = safe? file.readString();

// unsafe — セーフティネットなし
let raw: String = unsafe { file.readString() };
```

## null の扱い

### `T?` は Nullable JVM 型

Valen の `T?` は **nullable JVM 型**（`Ty::Nullable`）を表します。`Option<T>` **ではありません**。型システム上まったく別の型です。

| 型 | 内部表現 | 用途 |
|---|---|---|
| `T?` | `Ty::Nullable(Box<Ty>)` | JVM null を許容する型、主に Java 連携用 |
| `Option<T>` | `enum Option<T> { Some(T), None }` | Valen ネイティブの不在型 (ADT) |

### `safe { }` 内の Java メソッド戻り値

`safe { }` 内のすべての Java メソッド戻り値は `T?`（nullable）として型付けされます。プラットフォーム型（`T!`）は存在しません。Java の値は常に null の可能性ありとして扱われます。

```valen
// Java: V Map.get(K key) — null を返す可能性あり
let val = safe { map.get("key") };   // Result<String?, JavaException>

match val {
    Ok(Some(v)) => println(v),
    Ok(None) => println("null returned"),
    Err(e) => println(f"exception: {e.message()}"),
}
```

`void` メソッドは `Unit` を返します（nullable ではない）。

## コレクションのイテレーション

`Iterable` を実装する Java 型（`ArrayList`、`HashSet`、`LinkedList` 等）は `for` ループで直接使えます。要素型は `Any` です。

```valen
import java.util.ArrayList;

let list = ArrayList();
list.add("hello");
list.add("world");

for item in list {
    println(item);
}
```

内部的に `.iterator()` → `hasNext()` / `next()` にデシュガーされます。

## `@valen.Closed`

Java の `sealed` 階層に対する網羅的 `match` を有効にします。Java ライブラリ作者が適用します。

| シナリオ | `match` の動作 |
|---|---|
| `@valen.Closed` あり | 網羅性チェック有効 — `_` 不要 |
| `@valen.Closed` なし | オープンワールド — `_` ワイルドカード**必須** |

```java
// Java 側
@valen.Closed
public sealed interface Color permits Red, Blue, Green {}
```

```valen
// Valen 側 — 網羅的
match color {
    Color.Red => ...,
    Color.Blue => ...,
    Color.Green => ...,
}
```

詳しくは[アノテーション](/ja/reference/annotations)を参照してください。

## クラスパス設定

`valenc` は型情報のために Java の `.class` ファイルをクラスパスから読み取ります。

| ソース | 仕組み |
|---|---|
| JDK 標準ライブラリ | `JAVA_HOME` から自動検出（Java 9+ では `java.base.jmod`、Java 8 では `rt.jar`） |
| 外部ライブラリ | `valenc compile --classpath lib/guava.jar:lib/commons.jar src/main.vln` |

- 複数のパスは `:` (Linux/macOS) または `;` (Windows) で区切る
- JAR ファイル、JMOD ファイル、ディレクトリを受け付ける

## Java からの `inline fn` の可視性

| 観点 | 動作 |
|---|---|
| Java から見た `inline fn` | 通常のメソッド（インライン化なし） |
| Java からの `reified` | 無視 — 標準的な型イレイジャーが適用 |
| ラムダのインライン化 | Java からの呼び出し時は適用されない |

```valen
inline fn <reified T> isInstance(value: Any) -> Bool {
    value is T
}
```

```java
// Java — 呼び出し可能だが reified は効果なし
boolean result = ValenClass.isInstance(obj);
```

`reified` の恩恵を受けるには、Valen コードから呼び出してください。
