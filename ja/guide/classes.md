# クラスと Data Class

オブジェクト指向言語にはクラスがありますよね。Valen のちょっと変わったところは、コンストラクタがクラス名の直後にくること、`new` キーワードがないこと、そしてコンパイラがデフォルトですべてをイミュータブル＆ `internal` として扱うこと。成功のピットへようこそ。

## プライマリコンストラクタ

コンストラクタの引数はクラス名の直後に書きます。`constructor` ブロックも `init` ボディも要りません — 括弧を書くだけ。

```valen
class User(pub name: String, mut age: Int) {
    fn greet(self) -> String {
        f"Hello, {self.name}!"
    }
}
```

フィールドが2つあるクラスです。`name` はパブリック読み取り可能、`age` は内部的にミュータブル。インスタンス生成はとてもシンプル:

```valen
let alice = User(name = "Alice", age = 30);
```

`new` なし。儀式なし。名前付き引数で関数みたいにクラスを呼ぶだけですね。

## フィールドの可視性

コンストラクタ引数はすべてフィールドになります。アクセス制御は修飾子で — `pub`、`internal`、`private`、`mut` の順で、可視性が先、次に `mut`:

| 修飾子         | 外部からの読み取り | 外部からの書き込み | 内部でミュータブル |
|----------------|-------------------|--------------------|----------------|
| *(なし)*       | 同一パッケージのみ | 不可               | 不可           |
| `pub`          | 可                | 不可               | 不可           |
| `pub mut`      | 可                | 可                 | 可             |
| `internal`     | 同一パッケージのみ | 不可               | 不可           |
| `internal mut` | 同一パッケージのみ | 同一パッケージのみ  | 可             |
| `private`      | 不可              | 不可               | 不可           |
| `private mut`  | 不可              | 不可               | 可             |
| `mut`          | 同一パッケージのみ | 同一パッケージのみ  | 可             |

修飾子なしのデフォルトは `internal` です。同一パッケージ内からは見えるけど、外部からは隠れます。これは意図的な設計で、Valen はまず妥当なカプセル化レベルに誘導してくれるんですよ。

```valen
class Config(
    pub name: String,          // 誰でも読めるが、書き込み不可
    pub mut retries: Int,      // 誰でも読み書き可能
    mut internal_state: Int,   // 同一パッケージから参照・変更可能
    private secret: String,    // このクラスのみ参照可能
) {
    fn tick(mut self) {
        self.internal_state = self.internal_state + 1;
    }
}

let cfg = Config(
    name = "app",
    retries = 3,
    internal_state = 0,
    secret = "hunter2",
);

println(cfg.name);      // OK
cfg.retries = 5;         // OK
// cfg.secret            // ERROR: private フィールド — 残念でした
```

## メソッド

メソッドはクラス本体に直接書いても、別の `impl` ブロックに書いてもOKです。どちらも同じように動きます。

### インスタンスメソッド

最初の引数に `self` を取る関数がインスタンスメソッド。ドット構文で呼び出します。

```valen
class Counter(pub mut count: Int) {
    fn increment(mut self) {
        self.count = self.count + 1;
    }

    fn current(self) -> Int {
        self.count
    }
}

let mut c = Counter(count = 0);
c.increment();
println(c.current());  // 1
```

- `self` — イミュータブルなレシーバ（フィールドは読み取り専用）
- `mut self` — ミュータブルなレシーバ（フィールドを変更できる）

`mut self` を書き忘れてフィールドを変更しようとすると、コンパイラが丁重に怒ってくれます。ちゃんと見守ってくれてるんですね。

### 関連関数

`self` を持たない関数は関連関数です。`::` 構文で呼び出します。Java の `static` と同じ発想ですが、キーワードは不要。

```valen
class User(pub name: String, mut age: Int) {
    fn anonymous() -> User {
        User(name = "Anonymous", age = 0)
    }

    fn greet(self) -> String {
        f"Hello, {self.name}!"
    }
}

let ghost = User::anonymous();   // 関連関数 — :: に注目
println(ghost.greet());           // インスタンスメソッド — . に注目
```

パラメータリストに `self` があるかどうか、それだけの違いです。Valen に `static` キーワードはありません。

### 固有 `impl` ブロック

固有 `impl` ブロックを使えば、クラス本体の*外側*にメソッドを追加できます。コードの整理や後からのメソッド追加に便利ですよ:

```valen
class Foo(pub x: Int) {
    fn bar(self) -> Int { self.x }
}

// 後からメソッドを追加
impl Foo {
    fn baz(self) -> Int { self.x * 2 }
}
```

固有 `impl` ブロックで定義したメソッドは、クラス本体のメソッドと同じ優先度を持ちます。`enum` や `data class`（メソッドを持つクラス本体がない型）では、固有 `impl` がメソッド追加の主な手段になります。

## `derives` — メソッドの自動生成

`equals`、`hashCode`、`toString` を手書き？ それこそ `derives` の出番です。コンストラクタ（とスーパータイプ）の後、本体 `{` の前に配置します:

```valen
class Foo(pub x: Int, pub y: Int) derives(Eq, Hash) {
    fn bar(self) -> Int { self.x + self.y }
}

data class Point(x: Float, y: Float) derives(Eq, Hash, Display, Clone);

enum Shape derives(Eq, Hash, Display) {
    Circle(r: Float),
    Rect(w: Float, h: Float),
    Point,
}
```

### 利用可能な derives

| Derive    | 生成されるもの | 説明 |
|-----------|-------------|-------------|
| `Eq`      | `equals(Object) -> Boolean` | フィールドごとの構造的比較 |
| `Hash`    | `hashCode() -> Int` | 決定論的ハッシュ（31-multiply-accumulate） |
| `Display` | `toString() -> String` | `TypeName(field=value, ...)` 形式 |
| `Clone`   | `copy(...) -> Self` | 全フィールドをパラメータとするコピーコンストラクタ |

::: tip data class は自動で生成される
`data class` は `derives(...)` を書かなくても `Eq`、`Hash`、`Display`、`Clone` を自動生成します。`derives` 句は主に `class` と `enum` 向けですね。
:::

## デフォルト引数

コンストラクタ引数にはデフォルト値を設定できて、呼び出し側は不要な引数を省略できます:

```valen
class HttpClient(
    pub base_url: String,
    pub mut timeout: Int = 30,
    pub mut retries: Int = 3,
) {
    fn get(self, path: String) -> String {
        // ...
    }
}

let client = HttpClient(base_url = "https://api.example.com");
// timeout = 30, retries = 3 — デフォルト値が適用

let impatient = HttpClient(
    base_url = "https://api.example.com",
    timeout = 5,
);
// retries はデフォルトの 3 のまま
```

名前付き引数とデフォルト値はうまく連携します。デフォルトを持つ引数は順序を問わず省略できますよ。

## Data Class

データの入れ物として `equals`、`hashCode`、`toString`、`copy` が欲しいだけなら `data class` を使いましょう。末尾のセミコロンに注目 — data class にはボディが要りません。

```valen
data class Point(pub x: Float, pub y: Float);

data class User(pub name: String, pub email: String);
```

コンパイラが自動生成してくれるもの:

- **`equals`** — 全フィールドの構造的比較
- **`hashCode`** — 全フィールドに基づく一貫したハッシュ
- **`toString`** — `Point(x=1.0, y=2.0)` 形式
- **`copy`** — 指定フィールドを変更したクローン

```valen
let p1 = Point(x = 1.0f, y = 2.0f);
let p2 = Point(x = 1.0f, y = 2.0f);

p1 == p2        // true — 参照ではなく構造的等価性
println(p1);    // Point(x=1.0, y=2.0)

let p3 = p1.copy(x = 3.0f);
println(p3);    // Point(x=3.0, y=2.0)
```

固有 `impl` ブロックや trait `impl` ブロックで data class にメソッドを追加できます:

```valen
data class Vec2(pub x: Float, pub y: Float);

impl Vec2 {
    fn length(self) -> Float { /* ... */ }
}

impl Display for Vec2 {
    fn display(self) -> String { f"({self.x}, {self.y})" }
}
```

### Data Class の制約

- data class は常に **final** — `open` や `abstract` にはできません
- スーパークラスにもなれません
- 構文的には `: SuperClass(args)` と書けますが、これは**既知の制限**です。スーパータイプ情報はコンパイル時に失われて、data class は常に `java.lang.Object` を直接継承します。将来のリリースで修正予定。
- trait は `impl Trait for DataClass { ... }` で実装*できます*

## 継承

クラスはデフォルトで **final** です。拡張可能にしたい場合は、明示的にオプトインが必要。

### Open クラス

```valen
open class Animal(pub name: String) {
    open fn speak(self) -> String {
        "..."
    }
}

class Dog(pub name: String) : Animal(name) {
    override fn speak(self) -> String {
        "woof"
    }
}
```

ポイント:
- `: ParentClass(args)` で継承
- メソッドもデフォルトで final — オーバーライドさせたいものには `open fn` を付ける
- サブクラスは `override fn` が必須（忘れるとコンパイルエラー。サイレントなバグにはなりません）
- `open` は伝搬しません — `open class Dog` と書かない限り `Dog` は final のまま

### Abstract クラス

実装なしでメソッドを宣言したい場合:

```valen
abstract class Shape {
    abstract fn area(self) -> Float { /* placeholder */ }

    fn describe(self) -> String {
        f"area = {self.area()}"
    }
}

class Circle(pub r: Float) : Shape() {
    override fn area(self) -> Float {
        3.14159 * self.r * self.r
    }
}
```

::: warning 既知の制限: abstract メソッドにもボディが必要
パーサは現在、`abstract` メソッドを含むすべてのメソッドにボディを要求します。abstract メソッドにはプレースホルダボディ（`{ /* placeholder */ }` など）を置いてください。将来のパーサ更新でボディなしの `abstract fn area(self) -> Float;` 構文をサポート予定です。
:::

### Sealed クラス

`sealed class` はサブタイプの閉じた集合を定義します。コンパイラがすべてのサブタイプを知っているので、網羅的な `match` ができるんです:

```valen
sealed class Payment;

class Card(pub number: String, pub expiry: String) : Payment();
data class Cash(pub amount: Int) : Payment();
class BankTransfer(pub account: String) : Payment();
```

```valen
fn describe(payment: Payment) -> String {
    match payment {
        Card(number, _) => f"Card ending in {number}",
        Cash(amount) => f"Cash: {amount}",
        BankTransfer(account) => f"Transfer to {account}",
    }
    // すべてのサブタイプをカバー — ワイルドカード不要
}
```

sealed class のルール:
- すべてのサブタイプは同一モジュール内で定義する必要あり
- サブタイプは `class` または `data class`
- 各サブタイプは独自のフィールド、メソッド、trait 実装を持てる

### Super 呼び出し

サブクラスは `super` で親メソッドを呼べます:

```valen
open class Animal(pub name: String) {
    open fn speak(self) -> String {
        f"I am {self.name}"
    }
}

class Dog(pub name: String) : Animal(name) {
    override fn speak(self) -> String {
        let base = super.speak();
        f"{base}, woof!"
    }
}
```

`super.foo()` は親*クラス*のメソッドだけを呼びます。trait のデフォルトメソッドを呼ぶには UFCS: `Trait::foo(self)` を使ってください。

## Java からの移行

| Java                          | Valen                                  |
|-------------------------------|----------------------------------------|
| `new User("Alice", 30)`      | `User(name = "Alice", age = 30)`       |
| `public final class`         | `class`（デフォルトで final）             |
| `public class`               | `open class`                           |
| package-private（デフォルト）   | `internal`（デフォルトの可視性）          |
| `static void create()`       | `fn create()`（`self` パラメータなし）    |
| `User.create()`              | `User::create()`                       |
| `record Point(int x, int y)` | `data class Point(pub x: Int, pub y: Int);` |
