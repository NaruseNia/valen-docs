# Enum（代数的データ型）

Javaの `enum` がバリアントごとに異なるデータを持てたらと思ったことがあるなら、これは気に入るはず。Valenの `enum` は完全な代数的データ型 — 各バリアントが独自のペイロードを持てる直和型。言語の四本柱の一つであり、一度慣れたらプレーンなenumに戻るのはガラケーに戻るようなもの。

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

以上。クラス階層も、Visitorパターンも、ファクトリメソッドも不要。型システムがどのバリアントが存在するかを正確に把握し、コンパイラがすべてを処理することを強制する。

## バリアントの生成

`::` スコープ演算子でバリアントを生成する。ペイロードフィールドは名前付き引数を使う:

```valen
let circle = Shape::Circle(r = 5.0);
let rect = Shape::Rect(w = 10.0, h = 20.0);
let point = Shape::Point;
```

### バリアントの省略記法

コンパイラがどの enum かを既に把握している場合（型注釈、戻り値型、match の対象から）、enum 名を省略してドット構文を使える:

```valen
let c: Shape = .Circle(r = 5.0);   // Shape::Circle(r = 5.0)
let p: Shape = .Point;              // Shape::Point

fn origin() -> Shape {
    .Point                           // 戻り値型から推論
}
```

この省略記法は期待される型が分かっている場所ならどこでも使える — 変数宣言、関数引数、return 式、match アーム。コンパイラが型を特定できない場合は、完全な `Shape::Circle(...)` 形式の使用を求められる。

省略記法はパターンでも使える:

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

パターンでの省略記法の詳細は[パターンマッチング](/ja/guide/pattern-matching)を参照。

## `derives` — メソッドの自動生成

enum は `derives(...)` 句を使ってペイロードバリアントのメソッドを自動生成できる。enum 名の後、本体 `{` の前に配置する:

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

ペイロードなしのバリアント（`Point` のような）はシングルトンなので、同一性比較で十分 — derives は影響しない。

## メソッドの追加

enum には固有 `impl` ブロックでメソッドを追加できる。enum に直接振る舞いを付与する方法:

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

`impl EnumName { ... }` で定義されたメソッドはすべてのバリアントで利用可能。内部的にはsealed interfaceに出力されるため、すべてのバリアントクラスがそれを継承する。

enum に trait を実装することもできる:

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

これによりデータと振る舞いがきれいに分離される。enum はデータの*見た目*を定義し、`impl` ブロックはデータで*何ができるか*を定義する。

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

再帰型は自然に動作する — `Array` は `List<JsonValue>` を含み、コンパイラはそれで全く問題ない。

## Enum vs Sealed Class

enum と sealed class はどちらも型の閉じた集合を表す。違いは各バリアント/サブタイプに許される内容:

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

バリアントが純粋なデータで、振る舞いがすべてのバリアントで共有される場合は `enum` を使う:

```valen
enum Color {
    Red,
    Green,
    Blue,
    Custom(r: Int, g: Int, b: Int),
}
```

### Sealed class を使うべき場合

各サブタイプが独自のメソッドや状態を必要とする場合は `sealed class` を使う:

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

**経験則:** まず `enum` から始める。バリアントに独自の状態やメソッドが欲しくなったら `sealed class` に切り替える。

## JVM上での表現

内部的に、Valenの enum はJavaのsealed interfaceとrecordにコンパイルされる:

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

JavaコードはValenの enum を `$` 区切りの名前（例: `Shape$Circle`）で扱える。ペイロードバリアントは名前付きコンポーネントを持つrecordになり、ペイロードなしバリアントはメモリ効率のためシングルトンになる。

固有 `impl` と trait `impl` のメソッドはsealed interface側に出力されるため、すべてのバリアントで利用可能。

## 次のステップ

- [パターンマッチング](/ja/guide/pattern-matching) — ADT のもう半分の物語
- [Trait](/ja/guide/traits) — enum に振る舞いを追加する方法
