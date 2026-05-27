# Enum（代数的データ型）

Java の `enum` でバリアントごとに違うデータを持てたらなあ、と思ったことありませんか？ それなら Valen の `enum` は気に入るはずです。完全な代数的データ型 — 各バリアントが独自のペイロードを持てる直和型。言語の四本柱の一つで、正直これに慣れたらプレーンな enum に戻るのはガラケーに戻るような感覚ですよ。

## Enum の定義

```valen
enum Shape {
    Circle(r: Float),
    Rect(w: Float, h: Float),
    Point,
}
```

- `Circle` は半径を持つ
- `Rect` は幅と高さを持つ
- `Point` は何も持たない — ただのタグ

以上です。クラス階層も、Visitor パターンも、ファクトリメソッドも不要。型システムがどのバリアントが存在するか正確に把握していて、コンパイラがすべてを処理することを強制してくれます。

## バリアントの生成

`::` スコープ演算子でバリアントを生成します。ペイロードフィールドは名前付き引数で:

```valen
let circle = Shape::Circle(r = 5.0);
let rect = Shape::Rect(w = 10.0, h = 20.0);
let point = Shape::Point;
```

### バリアントの省略記法

コンパイラがどの enum かを既に知っている場合（型注釈、戻り値型、match の対象から推論）、enum 名を省略してドット構文が使えます:

```valen
let c: Shape = .Circle(r = 5.0);   // Shape::Circle(r = 5.0)
let p: Shape = .Point;              // Shape::Point

fn origin() -> Shape {
    .Point                           // 戻り値型から推論
}
```

この省略記法は期待される型がわかっている場所ならどこでも使えます — 変数宣言、関数引数、return 式、match アーム。コンパイラが型を特定できない場合は、完全な `Shape::Circle(...)` 形式を使ってください。

パターンでも省略記法が使えますよ:

```valen
match color {
    .Red => "red",
    .Green => "green",
    .Blue(v) => f"blue({v})",
}

if let .Some(x) = opt {
    x
}
```

パターンでの省略記法について詳しくは[パターンマッチング](/ja/guide/pattern-matching)を参照してください。

## `derives` — メソッドの自動生成

enum は `derives(...)` 句を使ってペイロードバリアントのメソッドを自動生成できます。enum 名の後、本体 `{` の前に配置:

```valen
enum Shape derives(Eq, Hash, Display, Clone) {
    Circle(r: Float),
    Rect(w: Float, h: Float),
    Point,
}
```

| Derive    | 生成されるもの | 適用対象 |
|-----------|-------------|------------|
| `Eq`      | `equals(Object) -> Boolean` | ペイロードバリアントのみ |
| `Hash`    | `hashCode() -> Int` | ペイロードバリアントのみ |
| `Display` | `toString() -> String` | ペイロードバリアントのみ |
| `Clone`   | `copy(...) -> Self` | ペイロードバリアントのみ |

ペイロードなしのバリアント（`Point` みたいなやつ）はシングルトンなので、同一性比較で十分。derives の影響は受けません。

## メソッドの追加

enum には固有 `impl` ブロックでメソッドを追加できます。enum に直接振る舞いを付ける方法ですね:

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

let s = Shape::Circle(r = 3.0);
println(s.describe());  // "circle with radius 3.0"
```

`impl EnumName { ... }` で定義したメソッドはすべてのバリアントで使えます。内部的には sealed interface に出力されるので、すべてのバリアントクラスがそれを継承する仕組みです。

trait の実装もできますよ:

```valen
trait Area {
    fn area(self) -> Float;
}

impl Area for Shape {
    fn area(self) -> Float {
        match self {
            .Circle(r) => 3.14159 * r * r,
            .Rect(w, h) => w * h,
            .Point => 0.0,
        }
    }
}

let s = Shape::Circle(r = 3.0);
println(f"{s.area()}");  // 28.27431
```

こうするとデータと振る舞いがきれいに分離されます。enum はデータの*見た目*を定義して、`impl` ブロックはデータで*何ができるか*を定義する。

## より実践的な例

```valen
enum JsonValue {
    Null,
    Bool(value: Bool),
    Number(value: Float),
    Str(value: String),
    Array(items: List<JsonValue>),
    Object(entries: Map<String, JsonValue>),
}

impl JsonValue {
    fn display(self) -> String {
        match self {
            .Null => "null",
            .Bool(v) => f"{v}",
            .Number(v) => f"{v}",
            .Str(v) => f"\"{v}\"",
            .Array(_) => "[...]",
            .Object(_) => "{...}",
        }
    }
}
```

再帰型も自然に動きます — `Array` は `List<JsonValue>` を含みますが、コンパイラは全く問題なく処理してくれます。

## Enum vs Sealed Class

enum と sealed class はどちらも型の閉じた集合を表します。違いは各バリアント/サブタイプに何が許されるか:

| | Enum | Sealed Class |
|---|---|---|
| **本質** | ADT — データの直和 | 閉じた OOP 階層 |
| **バリアントごとの状態** | 宣言されたペイロードのみ | 独立したフィールドと状態 |
| **メソッド** | `impl EnumName { ... }` 経由 | クラス本体 + 固有 impl |
| **バリアントごとの trait impl** | 不可 | 可能 |
| **サブタイプからの継承** | 不可 | 可能（`open`/`abstract` の場合） |
| **可視性の違い** | バリアントごとの差異なし | 各サブタイプで異なりうる |
| **最適な用途** | データの分類 | 振る舞いの階層 |

### Enum を使うべき場合

バリアントが純粋なデータで、振る舞いがすべてのバリアントで共有される場合は `enum` がぴったりです:

```valen
enum Color {
    Red,
    Green,
    Blue,
    Custom(r: Int, g: Int, b: Int),
}
```

### Sealed class を使うべき場合

各サブタイプが独自のメソッドや状態を必要とするなら `sealed class` にしましょう:

```valen
sealed class Widget;

class Button(pub label: String) : Widget() {
    fn click(self) {
        println(f"Button '{self.label}' clicked");
    }
}

class TextField(pub placeholder: String, mut value: String) : Widget() {
    fn clear(mut self) {
        self.value = "";
    }
}
```

**経験則:** まず `enum` から始めてみてください。バリアントに独自の状態やメソッドが欲しくなったら `sealed class` に切り替えればOKです。

## JVM 上での表現

内部的に、Valen の enum は Java の sealed interface と record にコンパイルされます:

```java
// Shape enum は以下になる:
public sealed interface Shape
    permits Shape$Circle, Shape$Rect, Shape$Point {}

// ペイロードバリアント → record
public record Shape$Circle(float r) implements Shape {}
public record Shape$Rect(float w, float h) implements Shape {}

// ペイロードなしバリアント → シングルトン
public final class Shape$Point implements Shape {
    public static final Shape$Point INSTANCE = new Shape$Point();
    private Shape$Point() {}
}
```

Java コードは Valen の enum を `$` 区切りの名前（例: `Shape$Circle`）で扱えます。ペイロードバリアントは名前付きコンポーネントを持つ record に、ペイロードなしバリアントはメモリ効率のためシングルトンになります。

固有 `impl` と trait `impl` のメソッドは sealed interface 側に出力されるので、すべてのバリアントで利用可能です。

## 次のステップ

- [パターンマッチング](/ja/guide/pattern-matching) — ADT のもう半分の物語
- [Trait](/ja/guide/traits) — enum に振る舞いを追加する方法
