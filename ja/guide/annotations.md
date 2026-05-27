# アノテーション

アノテーションは宣言にメタデータを付与する — コンパイラとランタイムへの付箋のようなもの。Java アノテーションを使ったことがあれば馴染み深いはず。Valen は `@Foo` 構文を使い、アノテーションを標準的な JVM アノテーションインターフェースにコンパイルする。

## アノテーションの定義

`annotation class` で宣言する:

```valen
annotation class Deprecated(pub message: String)

annotation class Serializable  // パラメータなし — マーカーアノテーション

@Target("type", "field")
annotation class JsonName(pub name: String)
```

以上。`@interface` も `Retention` のボイラープレートも不要。Valen はデフォルトで `RUNTIME` リテンションを使い、JVM アノテーションメタデータを自動的に出力する。

## アノテーションの使用

宣言の前に `@AnnotationName(args)` を置く:

```valen
@Deprecated(message = "use NewApi instead")
pub class OldApi {}

@Serializable
data class User(pub name: String, pub age: Int);
```

### 名前付き引数

パラメータは名前付き引数構文を使う:

```valen
@Deprecated(message = "use NewApi instead")
pub fn oldMethod() -> Unit { ... }
```

### 単一パラメータの省略記法

アノテーションのパラメータが1つだけの場合、名前を省略できる:

```valen
@JsonName("user_name")
pub name: String
```

`@JsonName(name = "user_name")` と等価。

### マーカーアノテーション

パラメータなし？ 括弧も不要:

```valen
@Serializable
data class Config(pub debug: Bool);
```

## パラメータのルール

アノテーションパラメータは**リテラルのみ**に制限される:

- `String`, `Int`, `Float`, `Bool`, `Long`, `Double`, `Char`

式、関数呼び出し、定数への参照は不可。これによりアノテーションはシンプルでコンパイル時に解決可能に保たれる。

## 適用可能な場所

アノテーションは以下に使える:

- **型:** `class`、`data class`、`enum`、`trait`
- **関数:** トップレベルまたはクラス内の `fn`
- **フィールド**と**コンストラクタ引数**

```valen
@Deprecated(message = "legacy")
pub class LegacyService {
    @JsonName("svc_name")
    pub name: String,
}
```

## `@Target` — 配置の制限

アノテーションクラスに `@Target` を使って適用箇所を宣言する:

```valen
@Target("type")
annotation class Entity

@Target("field", "method")
annotation class Inject
```

有効なターゲット: `"type"`、`"field"`、`"method"`。

::: info @Target の検証は未実施
コンパイラは `@Target` をパースしてターゲット情報を保存するが、アノテーションが宣言されたターゲットにのみ適用されているかの**検証は現在行っていない**。例えば、`@Target("field")` アノテーションをクラスに適用してもエラーなくコンパイルされる。ターゲット検証は将来のリリースで計画されている。
:::

## `@Retention`

Valen の設計上のデフォルトは `RUNTIME` リテンション — アノテーションは実行時にリフレクション経由で利用可能。

::: info @Retention は未実装
`@Retention` アノテーションは現在パースも強制もされない。すべてのアノテーションはランタイムリテンションとして扱われる。カスタムリテンションポリシー（SOURCE、CLASS）は将来のリリースで計画されている。
:::

## `@valen.Closed` — 唯一の組み込みアノテーション

Valen は特別なアノテーションを1つ同梱: `@valen.Closed`。Java ライブラリの作者が `sealed` 階層を Valen の網羅的 `match` に対して安全とマークするためのもの。

```java
// Java 側
import valen.Closed;

@Closed
public sealed interface Shape permits Circle, Rect {}
```

```valen
// Valen 側 — 網羅的 match が動作
match shape {
    Shape.Circle => "circle",
    Shape.Rect => "rect",
    // _ 不要 — @valen.Closed が集合の閉鎖を保証
}
```

Valen コードで `@valen.Closed` を書くことはない — Java 側のアノテーション。詳細は [Java 相互運用](/ja/guide/java-interop)を参照。

## Java アノテーション

Java アノテーションをインポートして Valen の宣言に適用できる。`@Foo(...)` 構文は Valen 定義と Java 定義のアノテーションで同じ:

```valen
import javax.persistence.Entity;
import javax.persistence.Id;

@Entity
pub class User {
    @Id
    pub id: Long,
    pub name: String,
}
```

::: warning パラメータ検証は信頼ベース
Java アノテーションについて、Valen はコンパイル時にパラメータの型、必須フィールド、アノテーションターゲットを検証しない。書いたものをそのままバイトコードに出力する。パラメータを間違えたり必須フィールドを漏らしたりすると、エラーはコンパイル時ではなく実行時に浮上する。Java アノテーション定義はクラスパス経由で解決され、アノテーションメタデータの完全なクラスパス解決がまだ実装されていないため。
:::

## 次のステップ

- [Trait](/ja/guide/traits) — `trait` と `impl` で振る舞いのコントラクトを定義
- [Java 相互運用](/ja/guide/java-interop) — Java の型、メソッド、アノテーションの使用
