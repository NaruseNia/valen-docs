# アノテーション

## アノテーションの宣言

`annotation class` でカスタムアノテーションを定義します。

```valen
annotation class Deprecated(pub message: String)

annotation class Serializable    // マーカー（パラメータなし）

@Target("type", "field")
annotation class JsonName(pub name: String)
```

### パラメータ型

アノテーションのパラメータは**リテラルのみ**を受け付けます。

`String`, `Int`, `Float`, `Bool`, `Long`, `Double`, `Char`

### @Target

`@Target("type")`、`@Target("type", "field", "method")` 等でアノテーションの適用先を制限します。ターゲットは HIR に格納されます。

::: warning
**`@Target` のバリデーションは未実装です。** ターゲット文字列はパースされ格納されますが、コンパイラはアノテーションが有効なターゲットに適用されているか**チェックしません**。たとえば、フィールド専用アノテーションをクラスに適用してもエラーなしでコンパイルされます。
:::

### @Retention

デフォルトのリテンションは `RUNTIME` です。

::: warning
**`@Retention` は未実装です。** パース、格納、JVM バイトコードへのリフレクション出力すべてが未実装です。
:::

### JVM 表現

`@interface`（`ACC_INTERFACE | ACC_ABSTRACT | ACC_ANNOTATION`）として出力されます。

## アノテーションの適用

| 形式 | 使用場面 |
|---|---|
| `@Name` | マーカーアノテーション（引数なし） |
| `@Name("value")` | 単一パラメータ（名前省略） |
| `@Name(key = "value")` | 名前付き引数 |
| `@Name(a = 1, b = "x")` | 複数の名前付き引数 |

```valen
@Deprecated(message = "use NewApi")
pub class OldApi {}

@JsonName("user_name")         // 単一パラメータ — 名前省略可
pub name: String

@Serializable                  // マーカー — () 不要
data class User(pub name: String);
```

### 適用可能なターゲット

トップレベル宣言（`class`、`data class`、`enum`、`trait`、`fn`）およびフィールド / コンストラクタパラメータです。

### Java アノテーション

インポートした Java アノテーションは `@Foo(...)` 構文で適用できます。構文は Valen 定義のアノテーションと同じです。

::: warning
**Java アノテーションのパラメータ型チェックは未実装です。** コンパイラはクラスパスから Java アノテーション定義を解決しないため、パラメータ型は検証されません。適用は信頼ベースです。
:::

## `@valen.Closed`

唯一の組み込みアノテーションです。Java の sealed 階層に対する網羅的 `match` を有効にします。

### ルール

| ルール | 詳細 |
|---|---|
| 誰が書くか | Java ライブラリ作者（Valen コードではない） |
| ターゲット | Java の `sealed interface` または `sealed class` |
| 効果 | Valen コンパイラが階層をクローズドワールドとして `match` を扱う |
| なしの場合 | Java の `sealed` 型は `match` で `_` ワイルドカードが必要 |

### Java 側

```java
package com.example;
import valen.Closed;

@Closed
public sealed interface Color permits Red, Blue, Green {}
```

### Valen 側

```valen
import com.example.Color;

match color {
    Color.Red => ...,
    Color.Blue => ...,
    Color.Green => ...,   // 網羅的 — _ 不要
}
```

### `@valen.Closed` なしの場合

```valen
match color {
    Color.Red => ...,
    Color.Blue => ...,
    Color.Green => ...,
    _ => ...,             // 必須 — 省略するとコンパイルエラー
}
```
