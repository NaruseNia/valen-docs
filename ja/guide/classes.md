# クラスと Data Class

オブジェクト指向言語にはクラスがある。Valenの特徴は、コンストラクタがクラス名の直後に置かれること、`new` キーワードが存在しないこと、そしてコンパイラがすべてをデフォルトでイミュータブルかつ `internal` として扱うこと。成功のピットへようこそ。

## プライマリコンストラクタ

クラスのコンストラクタ引数はクラス名の直後に置く。`constructor` ブロックも `init` ボディも不要 — 括弧を書くだけで完了。

```valen
class User(pub name: String, mut age: Int) {
    fn greet(self) -> String {
        f"Hello, {self.name}!"
    }
}
```

これは2つのフィールドを持つクラス: `name` はパブリック読み取り可能、`age` は内部的にミュータブル。インスタンス生成はいたってシンプル:

```valen
let alice = User(name = "Alice", age = 30);
```

`new` なし。儀式なし。名前付き引数で関数のようにクラスを呼ぶだけ。

## フィールドの可視性

コンストラクタ引数はすべてフィールドになる。アクセスは修飾子で制御する — `pub`、`internal`、`private`、`mut` — 可視性が先、次に `mut`:

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

デフォルト（修飾子なし）は `internal` — 同一パッケージ内では見えるが外部からは隠される。これは意図的な設計で、Valenはまず妥当なカプセル化レベルへ誘導する。

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

メソッドはクラス本体に直接書くことも、別の `impl` ブロックに書くこともできる。どちらも同等に機能する。

### インスタンスメソッド

最初の引数に `self` を取る関数がインスタンスメソッド。ドット構文で呼び出す。

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
- `mut self` — ミュータブルなレシーバ（フィールドを変更可能）

`mut self` を書き忘れてフィールドを変更しようとすると、コンパイラが丁重に拒否する。ちゃんと見守ってくれている。

### 関連関数

`self` を持たない関数は関連関数。`::` 構文で呼び出す。Javaの `static` と同じ概念だがキーワードは不要。

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

区別は純粋にパラメータリストに `self` があるかどうかだけ。Valenに `static` キーワードは存在しない。

### 固有 `impl` ブロック

固有 `impl` ブロックを使って、クラス本体の*外側*にメソッドを追加できる。コードの整理や後からのメソッド追加に特に便利:

```valen
class Foo(pub x: Int) {
    fn bar(self) -> Int { self.x }
}

// 後からメソッドを追加
impl Foo {
    fn baz(self) -> Int { self.x * 2 }
}
```

固有 `impl` ブロックで定義したメソッドはクラス本体のメソッドと同じ優先度を持つ。`enum` や `data class` 型（メソッドを持つクラス本体がない）では、固有 `impl` がメソッド追加の主要な手段。

## `derives` — メソッドの自動生成

`equals`、`hashCode`、`toString` を手書き？ それが `derives` の出番。コンストラクタ（とスーパータイプ）の後、本体 `{` の前に配置する:

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
`data class` は `derives(...)` を書かなくても `Eq`、`Hash`、`Display`、`Clone` を自動生成する。`derives` 句は主に `class` と `enum` 型向け。
:::

## デフォルト引数

コンストラクタ引数にはデフォルト値を設定でき、呼び出し側は不要な引数を省略できる:

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

名前付き引数とデフォルト値はうまく連携する — デフォルトを持つ引数は順序を問わず省略できる。

## Data Class

データの入れ物として `equals`、`hashCode`、`toString`、`copy` が欲しいだけなら `data class` を使う。末尾のセミコロンに注目 — data class にはボディが不要。

```valen
data class Point(pub x: Float, pub y: Float);

data class User(pub name: String, pub email: String);
```

コンパイラが自動生成するもの:

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

固有 `impl` ブロックや trait `impl` ブロックで data class にメソッドを追加できる:

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

- data class は常に **final** — `open` や `abstract` にできない
- スーパークラスにはなれない
- 構文的には `: SuperClass(args)` と書けるが、これは**既知の制限** — スーパータイプ情報はコンパイル時に失われ、data class は常に `java.lang.Object` を直接継承する。将来のリリースで修正予定。
- trait は `impl Trait for DataClass { ... }` で実装*できる*

## 継承

クラスはデフォルトで **final**。拡張可能にしたい場合は明示的にオプトインが必要。

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
- メソッドもデフォルトで final — オーバーライド可能なものは `open fn` を付ける
- サブクラスは `override fn` を使う必要がある（忘れるとコンパイルエラー。サイレントなバグにはならない）
- `open` は伝搬しない — `open class Dog` と書かない限り `Dog` は final

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
パーサは現在、`abstract` メソッドを含むすべてのメソッドにボディを要求する。abstract メソッドにはプレースホルダボディ（`{ /* placeholder */ }` など）を提供する必要がある。将来のパーサ更新でボディなしの `abstract fn area(self) -> Float;` 構文をサポート予定。
:::

### Sealed クラス

`sealed class` はサブタイプの閉じた集合を定義する。コンパイラがすべてのサブタイプを把握するため、網羅的な `match` が可能:

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
- すべてのサブタイプは同一モジュール内で定義する必要がある
- サブタイプは `class` または `data class`
- 各サブタイプは独自のフィールド、メソッド、trait 実装を持てる

### Super 呼び出し

サブクラスは `super` で親メソッドを呼び出せる:

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

`super.foo()` は親*クラス*のメソッドのみを呼び出す。trait のデフォルトメソッドを呼ぶには UFCS: `Trait::foo(self)` を使う。

## Javaからの移行

| Java                          | Valen                                  |
|-------------------------------|----------------------------------------|
| `new User("Alice", 30)`      | `User(name = "Alice", age = 30)`       |
| `public final class`         | `class`（デフォルトで final）             |
| `public class`               | `open class`                           |
| package-private（デフォルト）   | `internal`（デフォルトの可視性）          |
| `static void create()`       | `fn create()`（`self` パラメータなし）    |
| `User.create()`              | `User::create()`                       |
| `record Point(int x, int y)` | `data class Point(pub x: Int, pub y: Int);` |
