# Enum (ADT)

Valen の enum は **Rust スタイルの代数的データ型**（直和型）です。クラス階層とは完全に分離されています。閉じた型であり、enum に対する `match` は網羅的です。

## 宣言

```valen
enum Shape {
    Circle(r: Float),
    Rect(w: Float, h: Float),
    Point,
}
```

## バリアントの形式

| 形式                        | 説明                  | 例                         |
|-----------------------------|----------------------|----------------------------|
| `Variant`                   | ベア（ペイロードなし）| `Point`                    |
| `Variant(field: Type, ...)` | 名前付きフィールド    | `Circle(r: Float)`        |

位置指定（無名）フィールドはサポートされていません。ペイロードフィールドはすべて名前付きです。

## 構築

`::` を使った完全パス構文です。

```valen
let s = Shape::Circle(r = 5.0);
let p = Shape::Point;
```

## 省略記法による構築: `.Variant`

期待される型が既知の場合、enum 名を省略できます。

```valen
let c: Color = .Red;
let b: Color = .Blue(42);

fn make() -> Color {
    .Green
}
```

### 推論規則

1. 期待される型が名前付き enum 型の場合、その enum からバリアントを検索
2. 期待される型がない場合、スコープ内のすべての enum からバリアント名で検索（曖昧さはエラー）
3. 推論に失敗した場合、完全修飾の `EnumName::Variant` 形式を使用

## パターンでの省略記法

`.Variant` は `match`、`if let`、`while let`、`let else` でも使えます。

```valen
match color {
    .Red => "red",
    .Blue(v) => f"blue({v})",
    .Green => "green",
}

if let .Some(x) = opt {
    use(x);
}
```

## `derives(...)` 句

enum は `derives(...)` を宣言してペイロードバリアントのメソッドを自動生成できます。

```valen
enum Shape derives(Eq, Hash, Display, Clone) {
    Circle(r: Float),
    Rect(w: Float, h: Float),
    Point,
}
```

**構文:** `derives(Trait1, Trait2, ...)` — enum 名（およびジェネリックパラメータ）の後、本体 `{` の前に配置します。

### 導出可能な Trait

| Trait     | 生成されるメソッド              | 対象           |
|-----------|---------------------------------|----------------|
| `Eq`     | `equals(Object) -> Boolean`     | ペイロードバリアントのみ |
| `Hash`   | `hashCode() -> Int`             | ペイロードバリアントのみ |
| `Display` | `toString() -> String`         | ペイロードバリアントのみ |
| `Clone`  | `copy(...) -> Self`             | ペイロードバリアントのみ |

ベアバリアント（ペイロードなし）はシングルトンなので、同一性の等値で十分です。derives は適用されません。

生成ロジックは `data class` と共有しています（同一の `data_class_methods` モジュール）。

## `impl` による固有メソッド

enum は固有 `impl` ブロックでメソッドを持てます。

```valen
enum Shape {
    Circle(r: Float),
    Rect(w: Float, h: Float),
    Point,
}

impl Shape {
    fn describe(self) -> String {
        match self {
            .Circle(r) => f"circle with radius {r}",
            .Rect(w, h) => f"rect {w}x{h}",
            .Point => "point",
        }
    }

    fn is_circle(self) -> Boolean {
        match self {
            .Circle(_) => true,
            _ => false,
        }
    }
}
```

- `impl EnumName { ... }` — 固有メソッド、すべてのバリアントで利用可能
- `impl Trait for EnumName { ... }` — trait 実装
- メソッドは sealed interface に出力されるため、すべてのバリアントで使用可能

## `enum` と `sealed class` の比較

| 観点                | `enum`                             | `sealed class`                         |
|---------------------|------------------------------------|----------------------------------------|
| 用途                | データ直和型 (ADT)                 | 閉じた OOP 階層                        |
| バリアントの状態    | ペイロードフィールドのみ           | 独自の状態、メソッド、trait impl       |
| 独自メソッド        | `impl` ブロック経由               | クラス本体または `impl` ブロック       |
| 継承                | なし（フラット）                   | 親子階層                               |
| バリアントごとの可視性 | 不可能                          | 各サブタイプが独立して決定             |

**目安:** まず `enum` を使ってみてください。バリアントが独自のメソッドや状態を必要とする場合に `sealed class` にアップグレードしましょう。

## JVM バイトコード表現

| バリアントの種類  | JVM 表現                               |
|-------------------|----------------------------------------|
| ペイロードあり    | `sealed interface` を実装する `record`  |
| ペイロードなし    | `INSTANCE` フィールドを持つシングルトンクラス |

```java
// Shape.valen -> Shape.class + Shape$Circle.class + Shape$Rect.class + Shape$Point.class
// 各バリアントは独立したトップレベル .class ファイルとして出力

// sealed interface (enum 自体)
public sealed interface Shape permits Shape$Circle, Shape$Rect, Shape$Point {}

// ペイロードバリアント -> record (java.lang.Record を継承)
public final record Shape$Circle(float r) implements Shape {}
public final record Shape$Rect(float w, float h) implements Shape {}

// ベアバリアント -> シングルトンクラス
public final class Shape$Point implements Shape {
    public static final Shape$Point INSTANCE = new Shape$Point();
    private Shape$Point() {}
}
```

要点:
- enum 自体は `PermittedSubclasses` 属性を持つ `sealed interface` になります。
- ペイロードバリアントは `private final` フィールドとパブリックゲッターを持つ `record` クラスになります。
- ベアバリアントは static `INSTANCE` フィールドを持つシングルトンクラスになります。
- バリアントクラスは `static` ネストクラスではなく、**独立したトップレベル `.class` ファイル**です。バイナリ名の `$` は Java の命名規則に従いますが、クラス構造は独立しています。
- Valen の `Float` は JVM `float` (32-bit) に、Valen の `Double` は JVM `double` (64-bit) にマッピングされます。
- `derives(...)` はペイロードバリアントの record に `equals` / `hashCode` / `toString` / `copy` を生成します。
- 固有 impl と trait impl のメソッドは sealed interface に出力されます。

バリアントのバイナリ名: `EnumName$VariantName` (Java の内部クラス命名規則)
