# 関数

Valenの関数はRustの関数に似た見た目で、Kotlinの関数に似た動きをし、JVM上で動きます。いい感じですね。

## 基本構文

すべての関数は `fn` で始まり、型付きパラメータを取り、戻り値型を宣言します。

```valen
fn add(a: Int, b: Int) -> Int {
    a + b
}
```

- パラメータの型は常に明示的。コンパイラは推測しません。
- 本体の最後の式が戻り値になります（セミコロン不要）。
- 戻り値型が `Unit`（意味のある値を返さない）の場合、`-> Unit` は省略できます。

```valen
fn greet(name: String) {
    println(f"Hello, {name}!");
    // 暗黙的にUnitを返す
}
```

## 名前付き引数

パラメータが多い関数で、将来の読者（自分を含む）に優しくしたいなら、名前付き引数を使いましょう。

```valen
fn create_user(name: String, age: Int, active: Bool) -> User {
    User(name = name, age = age, active = active)
}

// 位置引数 — 動くけど、trueって何だっけ？
create_user("Alice", 30, true);

// 名前付き — ずっと分かりやすい
create_user(name = "Alice", age = 30, active = true);
```

## デフォルト引数

パラメータにデフォルト値を設定できます。呼び出し時に省略可能になります。

```valen
fn greet(msg: String = "hi", count: Int = 1) -> String {
    f"{msg} x{count}"
}

greet()              // "hi x1"
greet("yo")          // "yo x1"
greet("yo", 3)       // "yo x3"
```

知っておくと良いことがいくつかあります:

- デフォルト値はリテラルだけでなく**任意の式**が使えます。関数呼び出し、フィールドアクセスなど何でもOK。
- 定義時に一度だけでなく、**各呼び出し時に**評価されます。
- **任意のパラメータ位置**にデフォルトを設定可能（「末尾でなければならない」ルールはありません）。
- 名前付き引数と組み合わせれば、中間のパラメータをスキップできます:

```valen
greet(count = 5)     // "hi x5" — msgはデフォルト、countは明示的
```

デフォルトはクラスやdata classのコンストラクタパラメータ、traitメソッドでも使えます（ただし `impl` ブロックではtraitメソッドのデフォルト値をオーバーライドできません）。

## `self` と `mut self`

メソッドは最初のパラメータが `self` または `mut self` である関数にすぎません。これによりメソッドがレシーバーを変更できるかが決まります。

### `self` — イミュータブルなレシーバー

メソッドはインスタンスを読めますが変更はできません。

```valen
class Counter {
    let mut count: Int = 0;

    fn get(self) -> Int {
        self.count
    }
}
```

### `mut self` — ミュータブルなレシーバー

メソッドはインスタンスのフィールドを読み書きできます。

```valen
class Counter {
    let mut count: Int = 0;

    fn increment(mut self) {
        self.count += 1;
    }
}
```

同じ `self` / `mut self` の慣例はtraitメソッドにも適用されます:

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

`class` 内の関数は、`self` を取るかどうかで2種類に分かれます。

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

Javaの `static` メソッドに相当しますが、Valenは `static` キーワードを使いません。`self` パラメータがなければ関連関数です。

```valen
class Circle(radius: Double) {
    fn unit_circle() -> Circle {
        Circle(1.0)
    }
}

let c = Circle::unit_circle();   // インスタンスではなく型に対して呼ぶ
```

特定のインスタンスを見る必要があるなら `self` を渡す。型に属するファクトリやユーティリティなら `self` を省く。そう考えるとわかりやすいです。

## ラムダ

ラムダは `| |` パイプ構文を使います。簡潔で、環境から変数をキャプチャし、`fn` キーワードは不要です。

```valen
let double = |x: Int| x * 2;
let sum = |a: Int, b: Int| -> Int { a + b };
```

単一式のラムダはブレースを省略できます:

```valen
let inc = |x: Int| x + 1;
```

複数行のラムダや明示的な戻り値型が必要な場合はブレースを使いましょう:

```valen
let classify = |n: Int| -> String {
    let abs = if n < 0 { -n } else { n };
    if abs > 100 { "big" } else { "small" }
};
```

### ラムダのアリティ制限

Valenのラムダは `java.util.function` インターフェースにコンパイルされるため、**パラメータの最大数は2つ**です。

| パラメータ数 | JVMの型 |
|------------|----------|
| 0 | `java.util.function.Supplier<R>` |
| 1 | `java.util.function.Function<T, R>` |
| 2 | `java.util.function.BiFunction<T, U, R>` |

3つ以上のパラメータを持つラムダは**コンパイルエラー**になります。それ以上必要な場合は、名前付き関数を使うか、data classでパラメータをまとめてください。

### ミュータブル変数のキャプチャ

ラムダは外部変数をキャプチャできますが、キャプチャした変数の変更には明示的な `ref mut` が必要です:

```valen
let mut count = 0;
let r = ref mut count;
let inc = || { *r = *r + 1; };
inc();
inc();
// count == 2
```

## `unsafe fn`

`unsafe fn` は呼び出し側で `unsafe { }` ブロックが必要な関数です。未チェックのキャストや低レベルJVM操作など、Valenの安全保証をバイパスする操作に使います。

```valen
unsafe fn cast_unchecked<T>(obj: Any) -> T {
    obj as T
}

// 呼び出しにはunsafeが必要
let value: Int = unsafe { cast_unchecked(raw) };
```

`unsafe fn` は `inline fn` と組み合わせることもできます:

```valen
unsafe inline fn fast_cast<T>(obj: Any) -> T {
    obj as T
}
```

## パイプライン演算子

`|>` 演算子は左の値を右の関数の最初の引数として渡します。ネストした関数呼び出しがLISPに見え始めたら出番です。

```valen
// パイプラインなし — 内側から読む
format(process(data, config), style);

// パイプラインあり — 左から右に読める
data |> process(config) |> format(style);
```

脱糖は単純です。`x |> f(a, b)` は `f(x, a, b)` になります。

```valen
"hello" |> println;                      // println("hello")
data |> validate() |> transform(opts);   // transform(validate(data), opts)
```

パイプラインは左結合で、代入以外の全演算子の中で最も低い優先順位を持つため、自然にチェーンできます。

## UFCS（統一関数呼び出し構文）

メソッド構文 `value.method(args)` がメソッドを呼ぶ主な方法です。曖昧さがある場合（複数のtraitが同名メソッドを定義しているなど）は、完全修飾形式を使います:

```valen
// 通常のメソッド呼び出し
xs.map(|x| x * 2);

// traitを指定して曖昧さを解消
Mappable::map(xs, |x| x * 2);
```

`foo(args)` は常にトップレベル関数呼び出しとして解決されます。traitメソッドをベア関数構文で呼ぶことはできません。

## インライン関数

パフォーマンスが重要なコードのために、Valenは `inline fn` を提供しています。関数本体が各呼び出し箇所で展開され、ラムダ引数もインライン化されます（ボクシングのオーバーヘッドなし）。

```valen
inline fn <T> measure(block: fn() -> T) -> T {
    let start = System.nanoTime();
    let result = block();
    println(f"elapsed: {System.nanoTime() - start}ns");
    result
}
```

ここが reified 型パラメータの居場所でもあります。ジェネリック型に対して実行時に `is` チェックやキャストが可能になり、JVMのイレイジャーを回避できます。

::: warning インライン関数の制約
インライン関数は再帰できません（展開が無限になります）。また、reified 型パラメータは `inline fn` 内でのみ有効 — 通常の関数で使うとコンパイルエラーになります。
:::

詳細は [inline と reified](/ja/guide/inline-reified) を参照してください。

---

**次:** [制御フロー](/ja/guide/control-flow) — データだけではただの高価なスプレッドシートですからね。
