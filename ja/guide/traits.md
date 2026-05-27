# Trait

Trait は Valen のポリモーフィズムに対する答え — 6層の abstract クラス継承は伴わない。trait はコントラクト（メソッドの集合）を定義し、任意の型が `impl` でそのコントラクトを実装できる。シンプルで明示的、サプライズなし。

## Trait の定義

trait は実装者が提供すべきメソッドシグネチャを宣言する:

```valen
trait Area {
    fn area(self) -> Float;
}

trait Display {
    fn display(self) -> String;
}
```

ここにはメソッド本体はない — これから来るものの形だけ。（シャレ込み。）

### デフォルトメソッド

trait はデフォルト実装を提供することもできる。実装者はオーバーライドするかデフォルトのままにするか選べる:

```valen
trait Greet {
    fn greet(self) -> String { "hello" }
}

class Dog {}

// greet はここで実装されていない — デフォルトが使われる
impl Greet for Dog {}

let d = Dog();
println(d.greet());  // "hello"
```

デフォルトをオーバーライドしたい場合は、`impl` ブロックで独自の実装を提供する:

```valen
impl Greet for Cat {
    fn greet(self) -> String { "meow" }
}
```

## Trait の実装

`impl Trait for Type` を使って、型に trait のコントラクトを実現させる:

```valen
enum Shape {
    Circle(radius: Float),
    Rect(width: Float, height: Float),
    Point,
}

impl Area for Shape {
    fn area(self) -> Float {
        match self {
            Shape::Circle(r) => 3.14159 * r * r,
            Shape::Rect(w, h) => w * h,
            Shape::Point => 0.0,
        }
    }
}
```

これで `Area` を期待するものは `Shape` で動作する。基底クラスなし、`extends` なし、存在論的不安なし。

::: info trait/impl のメソッドはすべて public
コンパイラは `trait` 定義と `impl` ブロック内のすべてのメソッドを、書いた可視性修飾子に関係なく `pub` として強制する。これは設計上の意図 — trait コントラクトはパブリックインターフェース。
:::

## 固有 Impl — Trait なしのメソッド

trait 全体を定義せずに型にメソッドを追加したいだけの場合がある。それが**固有 impl** の役目:

```valen
data class Vec2(pub x: Float, pub y: Float);

impl Vec2 {
    fn length(self) -> Float {
        // 計算処理
        0.0
    }

    fn scale(self, factor: Float) -> Vec2 {
        Vec2(x = self.x * factor, y = self.y * factor)
    }
}
```

これは `enum` と `data class` 型にメソッドを追加する主要な方法。メソッドを持つクラス本体がないため。

`class` 型の場合、クラス本体に直接メソッドを置くか固有 impl を使うか選べる:

```valen
class User(pub name: String, mut age: Int) {
    // クラス本体のメソッド — 問題なく動作
    fn greet(self) -> String {
        f"Hello, {self.name}!"
    }
}

// 固有 impl — これも問題なく動作
impl User {
    fn birthday(mut self) {
        self.age = self.age + 1;
    }
}
```

## レシーバ: `self` と `mut self`

trait メソッドは最初のパラメータとしてレシーバを取る:

| レシーバ | 意味 |
|---|---|
| `self` | イミュータブルなインスタンス |
| `mut self` | ミュータブルなインスタンス |

以上。`&self` も `&mut self` もない — Valen には所有権や借用がない。考えることが1つ減る。

```valen
trait Counter {
    fn count(self) -> Int;
    fn increment(mut self);
}

impl Counter for ClickTracker {
    fn count(self) -> Int { self.clicks }
    fn increment(mut self) { self.clicks = self.clicks + 1; }
}
```

## Orphan ルール

`impl Trait for Type` は以下の場合のみ書ける:

- **trait を所有している**（自分のコンパイル単位で定義されている）、**または**
- **型を所有している**（最外の型コンストラクタが自分のコンパイル単位で定義されている）

つまりアプリケーションコードから `java.lang.String` に `Display` を付けることはできない。このルールがエコシステムの健全性を保つ — 競合する実装が飛び交うことがなくなる。

```valen
// OK — 自分の型、外部の trait
impl Display for MyType {
    fn display(self) -> String { "..." }
}

// OK — 自分の trait、外部の型
impl MyTrait for String {
    fn check(self) -> Bool { true }
}

// NG — 両方とも外部。コンパイラが拒否。
// impl Display for String { ... }
```

さらに禁止事項:

- **typealias ロンダリング** — `type MyList = java.util.List<Int>` としても `MyList` は「自分のもの」にはならない
- **ブランケット impl** — `impl<T: Foo> Bar for T` はサポートされていない

### Trait 充足ルール

クラス本体のメソッドが trait メソッドと同じ名前・シグネチャを持っていても、それはその trait の実装には**ならない**。trait の実装は `impl Trait for Type { ... }` の中で行う*必要がある*。両者は完全に独立:

```valen
trait Show {
    fn show(self) -> String;
}

class User(pub name: String) {
    // これは Show の実装ではない — 別個のメソッド
    fn show(self) -> String { self.name }
}

// これが必要:
impl Show for User {
    fn show(self) -> String { f"User({self.name})" }
}
```

## UFCS — 2つの Trait が同名メソッドで衝突した場合

2つの trait が同名のメソッドを定義し、ある型が両方を実装している場合、`obj.hello()` は曖昧になる。コンパイラは当然エラーを出す。**Universal Function Call Syntax** で解決:

```valen
trait Japanese {
    fn hello(self) -> String;
}

trait English {
    fn hello(self) -> String;
}

impl Japanese for Greeter {
    fn hello(self) -> String { "konnichiwa" }
}

impl English for Greeter {
    fn hello(self) -> String { "Hello" }
}

// g.hello() — 曖昧、コンパイルエラー

// UFCS で解決:
let jp = Japanese::hello(g);  // "konnichiwa"
let en = English::hello(g);   // "Hello"
```

構文は `Trait::method(receiver, args...)`。レシーバが最初の引数になる。

### メソッド解決順序

`value.foo()` を呼ぶ時、コンパイラは以下の順序で解決する:

1. **クラス本体のメソッド** — 最高優先度
2. **固有 impl メソッド** — クラス本体にマッチがない場合にチェック
3. **Trait メソッド** — 固有 impl にマッチがない場合にチェック
4. **曖昧？** — コンパイルエラー、UFCS を使う

::: tip クラス本体のメソッドは trait を満たさない
クラス本体のメソッドが trait メソッドとまったく同じ名前・シグネチャを持っていても、その trait を実装したことには**ならない**。`impl Trait for Type { ... }` ブロックが依然として必要。両者は独立。
:::

## Sealed Trait

`sealed trait` は実装者を制限する。同一コンパイル単位内の型のみが許される — つまりコンパイラは実装者の完全な集合を把握し、**網羅的マッチング**を強制できる。

```valen
sealed trait Expr {
    fn eval(self) -> Int;
}

class Lit(pub value: Int) {}
class Add(pub left: Expr, pub right: Expr) {}

impl Expr for Lit {
    fn eval(self) -> Int { self.value }
}

impl Expr for Add {
    fn eval(self) -> Int {
        self.left.eval() + self.right.eval()
    }
}
```

これで `Expr` に対して `match` でき、コンパイラがすべてのケースを処理していることを保証する:

```valen
fn describe(e: Expr) -> String {
    match e {
        Lit(value) => f"literal: {value}",
        Add(_, _) => "addition",
        // すべての実装者をカバー — _ 不要
    }
}
```

sealed trait は「enum に似ているが独立したクラス定義を持つ」もの。各実装者は独自のフィールド、メソッド、状態を持てる — enum バリアントより柔軟だが、閉じた世界であることは同じ。

**ルール:**
- 実装者は `class` または `data class` でなければならない（`enum` 不可）
- すべての実装者は同一コンパイル単位内に存在する必要がある

::: info スーパー trait は未実装
`trait Queryable: Component + Eq { ... }` のようなスーパー trait 要件の宣言構文は現在サポートされていない。回避策として、使用箇所で必要なすべての境界を指定する: `<T: Queryable + Component + Eq>`。
:::

## 関連型

trait が各実装者で異なる「型スロット」を必要とする場合がある。それが関連型:

```valen
trait Container {
    type Item;
    fn get(self, index: Int) -> Self;  // 下記の注記を参照
}

impl Container for IntList {
    type Item = Int;
    fn get(self, index: Int) -> Int {
        // ...
    }
}
```

デフォルトを提供することもできる: trait 定義での `type Item = Int;`。実装者はオーバーライドするかデフォルトのままにできる。

::: warning Self::AssocType は未実装
trait メソッドシグネチャで関連型を参照する `Self::Item` や `Self::Output` 構文はパーサで現在サポートされていない。回避策として、標準ライブラリの演算子 trait は `Self::Output` の代わりに `Self` を戻り値型として使用している。つまり演算子の実装は常にレシーバと同じ型を返す。
:::

## 演算子オーバーロード

Valenの演算子は trait メソッドの変装。`+` を自分の型で使いたい？ `Add` を実装する。

```valen
data class Vec2(pub x: Float, pub y: Float);

impl Add<Vec2> for Vec2 {
    type Output = Vec2;
    fn add(self, rhs: Vec2) -> Vec2 {
        Vec2(x = self.x + rhs.x, y = self.y + rhs.y)
    }
}

let a = Vec2(x = 1.0, y = 2.0);
let b = Vec2(x = 3.0, y = 4.0);
let c = a + b;  // Vec2(x = 4.0, y = 6.0)
```

### 算術演算子

| 演算子 | Trait | メソッド |
|---|---|---|
| `+` | `Add<Rhs>` | `fn add(self, rhs: Rhs) -> Self` |
| `-` | `Sub<Rhs>` | `fn sub(self, rhs: Rhs) -> Self` |
| `*` | `Mul<Rhs>` | `fn mul(self, rhs: Rhs) -> Self` |
| `/` | `Div<Rhs>` | `fn div(self, rhs: Rhs) -> Self` |
| `%` | `Rem<Rhs>` | `fn rem(self, rhs: Rhs) -> Self` |

各 trait は関連型 `type Output` を宣言するが、`Self::Output` が未実装のため、実際の戻り値型は `Self`。

### 単項演算子

| 演算子 | Trait | メソッド |
|---|---|---|
| `-x` | `Neg` | `fn neg(self) -> Self` |
| `!x` | `Not` | `fn not(self) -> Self` |

### 比較: `Ord` と `Eq`

順序比較（`<`、`<=`、`>`、`>=`）には `Ord` を実装する:

```valen
impl Ord for Priority {
    fn cmp(self, rhs: Priority) -> Int {
        self.level - rhs.level
    }
}

// これで taskA < taskB が動作する
```

`cmp` は `<` で負の数、`==` でゼロ、`>` で正の数を返す。

等価性（`==`、`!=`）には、オプションで `Eq` を実装できる:

```valen
impl Eq for CaseInsensitiveString {
    fn eq(self, rhs: CaseInsensitiveString) -> Bool {
        self.value.toLowerCase() == rhs.value.toLowerCase()
    }
}
```

型が `impl Eq` を持てば、`==` は `Eq::eq` を使う。なければ `.equals()` にフォールバック。プリミティブ（`Int`、`Float` など）は組み込み比較を使う — trait 不要。

## derives — Trait の自動実装

`equals`、`hashCode`、`toString` を手書きするのは通過儀礼。幸い、キャリアで一度やれば十分。その後は `derives` を使う:

```valen
pub data class Entity(pub id: Int) derives(Eq, Hash);

pub enum Color derives(Eq, Hash, Display) {
    Red,
    Green,
    Blue(value: Int),
}

pub class Point(pub x: Float, pub y: Float) derives(Eq) {}
```

### 利用可能な derives

| Trait | 生成されるもの |
|---|---|
| `Eq` | `equals` — フィールドごとの比較 |
| `Hash` | `hashCode` — フィールドからの決定論的ハッシュ |
| `Display` | `toString` — `TypeName(field=value, ...)` 形式 |
| `Clone` | `copy` — 全フィールドのコピーコンストラクタ |

### data class は無料で付いてくる

ここが肝心: `data class` は何も書かなくても `Eq`、`Hash`、`Display`、`Clone` を自動的に derives する。それが `data class` の存在意義。

```valen
// 4つの trait すべてが自動生成される。derives() 不要。
pub data class Point(pub x: Float, pub y: Float);

let a = Point(x = 1.0, y = 2.0);
let b = Point(x = 1.0, y = 2.0);
a == b  // true — 構造的等価性、儀式なし
```

data class に `derives(Eq)` と書いても構わない。冗長だが無害。

## 次のステップ

- [エラーハンドリング](/ja/guide/error-handling) — Option、Result、`?` 演算子
- [Java 相互運用](/ja/guide/java-interop) — Valen から Java ライブラリを使う
