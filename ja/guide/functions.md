# 関数

Valenの関数はRustの関数に似た見た目で、Kotlinの関数に似た動きをし、JVM上で動く。いい感じだ。

## 基本構文

すべての関数は `fn` で始まり、型付きパラメータを取り、戻り値型を宣言する。

```valen
fn add(a: Int, b: Int) -> Int {
    a + b
}
```

- パラメータの型は常に明示的。コンパイラは推測しない。
- 本体の最後の式が戻り値になる（セミコロン不要）。
- 戻り値型が `Unit`（意味のある値を返さない）の場合、`-> Unit` は省略可能。

```valen
fn greet(name: String) {
    println(f"Hello, {name}!");
    // 暗黙的にUnitを返す
}
```

## 名前付き引数

パラメータが多い関数で、将来の読者（自分を含む）に優しくしたいなら、名前付き引数を使おう。

```valen
fn create_user(name: String, age: Int, active: Bool) -> User {
    User(name = name, age = age, active = active)
}

// 位置引数 — 動くが、trueって何だっけ？
create_user("Alice", 30, true);

// 名前付き — ずっと分かりやすい
create_user(name = "Alice", age = 30, active = true);
```

## デフォルト引数

パラメータにデフォルト値を設定可能。呼び出し時に省略できるようになる。

```valen
fn greet(msg: String = "hi", count: Int = 1) -> String {
    f"{msg} x{count}"
}

greet()              // "hi x1"
greet("yo")          // "yo x1"
greet("yo", 3)       // "yo x3"
```

知っておくべきこと:

- デフォルト値はリテラルだけでなく**任意の式**を使える。関数呼び出し、フィールドアクセスなど何でも。
- 定義時に一度だけでなく、**各呼び出し時に**評価される。
- **任意のパラメータ位置**にデフォルトを設定可能（「末尾でなければならない」ルールなし）。
- 名前付き引数と組み合わせて中間のパラメータをスキップ可能:

```valen
greet(count = 5)     // "hi x5" — msgはデフォルト、countは明示的
```

デフォルトはクラスやdata classのコンストラクタパラメータ、traitメソッドでも使える（ただし `impl` ブロックではtraitメソッドのデフォルト値をオーバーライドできない）。

## `self` と `mut self`

メソッドは最初のパラメータが `self` または `mut self` である関数にすぎない。これによりメソッドがレシーバーを変更できるかが決まる。

### `self` — イミュータブルなレシーバー

メソッドはインスタンスを読めるが変更はできない。

```valen
class Counter {
    let mut count: Int = 0;

    fn get(self) -> Int {
        self.count
    }
}
```

### `mut self` — ミュータブルなレシーバー

メソッドはインスタンスのフィールドを読み書きできる。

```valen
class Counter {
    let mut count: Int = 0;

    fn increment(mut self) {
        self.count += 1;
    }
}
```

同じ `self` / `mut self` の慣例はtraitメソッドにも適用される:

```valen
trait Resettable {
    fn reset(mut self);
}

impl Resettable for Counter {
    fn reset(mut self) {
        self.count = 0;
    }
}
```

## メソッドと関連関数

`class` 内の関数は、`self` を取るかどうかで2種類に分かれる。

### メソッド — `self` あり

```valen
class Circle(radius: Double) {
    fn area(self) -> Double {
        3.14159 * self.radius * self.radius
    }
}

let c = Circle(5.0);
c.area()              // インスタンスに対して呼ぶ
```

### 関連関数 — `self` なし

Javaの `static` メソッドに相当するが、Valenは `static` キーワードを使わない。`self` パラメータがなければ関連関数。

```valen
class Circle(radius: Double) {
    fn unit_circle() -> Circle {
        Circle(1.0)
    }
}

let c = Circle::unit_circle();   // インスタンスではなく型に対して呼ぶ
```

特定のインスタンスを見る必要があるなら `self` を渡す。型に属するファクトリやユーティリティなら `self` を省く、と考えるとわかりやすい。

## ラムダ

ラムダは `| |` パイプ構文を使う。簡潔で、環境から変数をキャプチャし、`fn` キーワードは不要。

```valen
let double = |x: Int| x * 2;
let sum = |a: Int, b: Int| -> Int { a + b };
```

単一式のラムダはブレースを省略可能:

```valen
let inc = |x: Int| x + 1;
```

複数行のラムダや明示的な戻り値型が必要な場合はブレースを使う:

```valen
let classify = |n: Int| -> String {
    let abs = if n < 0 { -n } else { n };
    if abs > 100 { "big" } else { "small" }
};
```

### ラムダのアリティ制限

Valenのラムダは `java.util.function` インターフェースにコンパイルされるため、**パラメータの最大数は2つ**。

| パラメータ数 | JVMの型 |
|------------|----------|
| 0 | `java.util.function.Supplier<R>` |
| 1 | `java.util.function.Function<T, R>` |
| 2 | `java.util.function.BiFunction<T, U, R>` |

3つ以上のパラメータを持つラムダは**コンパイルエラー**。それ以上必要な場合は、名前付き関数を使うか、data classでパラメータをまとめる。

### ミュータブル変数のキャプチャ

ラムダは外部変数をキャプチャできるが、キャプチャした変数の変更には明示的な `ref mut` が必要:

```valen
let mut count = 0;
let r = ref mut count;
let inc = || { *r = *r + 1; };
inc();
inc();
// count == 2
```

## `unsafe fn`

`unsafe fn` は呼び出し側で `unsafe { }` ブロックが必要な関数。未チェックのキャストや低レベルJVM操作など、Valenの安全保証をバイパスする操作に使う。

```valen
unsafe fn cast_unchecked<T>(obj: Any) -> T {
    obj as T
}

// 呼び出しにはunsafeが必要
let value: Int = unsafe { cast_unchecked(raw) };
```

`unsafe fn` は `inline fn` と組み合わせ可能:

```valen
unsafe inline fn fast_cast<T>(obj: Any) -> T {
    obj as T
}
```

## パイプライン演算子

`|>` 演算子は左の値を右の関数の最初の引数として渡す。ネストした関数呼び出しがLISPに見え始めたときに使う。

```valen
// パイプラインなし — 内側から読む
format(process(data, config), style);

// パイプラインあり — 左から右に読める
data |> process(config) |> format(style);
```

脱糖は単純: `x |> f(a, b)` は `f(x, a, b)` になる。

```valen
"hello" |> println;                      // println("hello")
data |> validate() |> transform(opts);   // transform(validate(data), opts)
```

パイプラインは左結合で、代入以外の全演算子の中で最も低い優先順位を持つため、自然にチェーンできる。

## UFCS（統一関数呼び出し構文）

メソッド構文 `value.method(args)` がメソッドを呼ぶ主な方法。曖昧さがある場合（複数のtraitが同名メソッドを定義しているなど）、完全修飾形式を使う:

```valen
// 通常のメソッド呼び出し
xs.map(|x| x * 2);

// traitを指定して曖昧さを解消
Mappable::map(xs, |x| x * 2);
```

`foo(args)` は常にトップレベル関数呼び出しとして解決される。traitメソッドをベア関数構文で呼ぶことはできない。

## インライン関数

パフォーマンスが重要なコードのために、Valenは `inline fn` を提供する — 関数本体が各呼び出し箇所で展開され、ラムダ引数もインライン化される（ボクシングのオーバーヘッドなし）。

```valen
inline fn <T> measure(block: fn() -> T) -> T {
    let start = System.nanoTime();
    let result = block();
    println(f"elapsed: {System.nanoTime() - start}ns");
    result
}
```

ここが reified 型パラメータの居場所でもある — ジェネリック型に対して実行時に `is` チェックやキャストが可能になり、JVMのイレイジャーを回避できる。

::: warning インライン関数の制約
インライン関数は再帰できない（展開が無限になる）。また、reified 型パラメータは `inline fn` 内でのみ有効 — 通常の関数で使うとコンパイルエラーになる。
:::

詳細は [inline と reified](/ja/guide/inline-reified) を参照。

---

**次:** [制御フロー](/ja/guide/control-flow) — データだけではただの高価なスプレッドシートだから。
