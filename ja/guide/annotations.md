# アノテーション

アノテーションは宣言にメタデータを付けるものです — コンパイラとランタイムへの付箋みたいなもの。Java アノテーションを使ったことがあれば馴染み深いはずです。Valen は `@Foo` 構文を使って、アノテーションを標準的な JVM アノテーションインターフェースにコンパイルします。

## アノテーションの定義

`annotation class` で宣言します:

```valen
annotation class Deprecated(pub message: String)

annotation class Serializable  // パラメータなし — マーカーアノテーション

@Target("type", "field")
annotation class JsonName(pub name: String)
```

以上です。`@interface` も `Retention` のボイラープレートも要りません。Valen はデフォルトで `RUNTIME` リテンションを使い、JVM アノテーションメタデータを自動的に出力してくれます。

## アノテーションの使用

宣言の前に `@AnnotationName(args)` を置きます:

```valen
@Deprecated(message = "use NewApi instead")
pub class OldApi {}

@Serializable
data class User(pub name: String, pub age: Int);
```

### 名前付き引数

パラメータは名前付き引数構文を使います:

```valen
@Deprecated(message = "use NewApi instead")
pub fn oldMethod() -> Unit { ... }
```

### 単一パラメータの省略記法

アノテーションのパラメータが1つだけなら、名前を省略できますよ:

```valen
@JsonName("user_name")
pub name: String
```

`@JsonName(name = "user_name")` と等価。

### マーカーアノテーション

パラメータなし？ 括弧も要りません:

```valen
@Serializable
data class Config(pub debug: Bool);
```

## パラメータのルール

アノテーションパラメータは**リテラルのみ**に制限されています:

- `String`, `Int`, `Float`, `Bool`, `Long`, `Double`, `Char`

式、関数呼び出し、定数への参照は使えません。こうすることでアノテーションはシンプルでコンパイル時に解決可能な状態を保っています。

## 適用可能な場所

アノテーションは以下に使えます:

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

アノテーションクラスに `@Target` を使って、適用できる場所を宣言します:

```valen
@Target("type")
annotation class Entity

@Target("field", "method")
annotation class Inject
```

有効なターゲット: `"type"`、`"field"`、`"method"`。

::: info @Target の検証は未実施
コンパイラは `@Target` をパースしてターゲット情報を保存しますが、アノテーションが宣言されたターゲットにのみ適用されているかの**検証は現在行っていません**。例えば `@Target("field")` アノテーションをクラスに適用してもエラーなくコンパイルされます。ターゲット検証は将来のリリースで追加予定です。
:::

## `@Retention`

Valen の設計上のデフォルトは `RUNTIME` リテンション — アノテーションは実行時にリフレクション経由で利用可能です。

::: info @Retention は未実装
`@Retention` アノテーションは現在パースも強制もされていません。すべてのアノテーションがランタイムリテンションとして扱われます。カスタムリテンションポリシー（SOURCE、CLASS）は将来のリリースで追加予定です。
:::

## `@valen.Closed` — 唯一の組み込みアノテーション

Valen は特別なアノテーションを1つだけ同梱しています: `@valen.Closed`。Java ライブラリの作者が `sealed` 階層を Valen の網羅的 `match` に対して安全とマークするためのものです。

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

Valen コードで `@valen.Closed` を書くことはありません — これは Java 側のアノテーションです。詳しくは [Java 相互運用](/ja/guide/java-interop)を参照してください。

## Java アノテーション

Java アノテーションをインポートして Valen の宣言に適用できます。`@Foo(...)` 構文は Valen 定義のアノテーションでも Java 定義のアノテーションでも同じです:

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
Java アノテーションについて、Valen はコンパイル時にパラメータの型、必須フィールド、アノテーションターゲットを検証しません。書いたものをそのままバイトコードに出力します。パラメータを間違えたり必須フィールドを漏らしたりすると、エラーはコンパイル時ではなく実行時に浮上します。アノテーションメタデータの完全なクラスパス解決がまだ実装されていないためです。ここは気をつけてください。
:::

## 次のステップ

- [Trait](/ja/guide/traits) — `trait` と `impl` で振る舞いのコントラクトを定義
- [Java 相互運用](/ja/guide/java-interop) — Java の型、メソッド、アノテーションの使用
