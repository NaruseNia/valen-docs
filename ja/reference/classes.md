# クラス

## クラス宣言

```valen
class User(pub name: String, mut age: Int) {
    fn greet(self) -> String {
        f"Hello, {self.name}!"
    }

    // 関連関数 — self レシーバなし、User::... で呼び出す
    fn from_name(name: String) -> User {
        User(name = name, age = 0)
    }
}
```

クラスは**デフォルトで final**。メソッドはクラス本体内で直接定義するか、固有 `impl` ブロックで後から追加できる。Trait の実装は常に別途: `impl Trait for Class { ... }`。

## プライマリコンストラクタパラメータ

すべてのクラスに必須のプライマリコンストラクタがある。パラメータがクラスのフィールドを宣言する。

| 修飾子      | 可視性    | 可変性     | 例                   |
|-------------|-----------|------------|----------------------|
| *(なし)*    | Internal  | イミュータブル | `name: String`       |
| `pub`       | Public    | イミュータブル | `pub name: String`   |
| `pub mut`   | Public    | ミュータブル   | `pub mut age: Int`   |
| `private`   | Private   | イミュータブル | `private name: String` |
| `mut`       | Internal  | ミュータブル   | `mut age: Int`       |

- **修飾子なし**のパラメータは `internal` — 同一パッケージ内で可視、外部からは不可視。
- `pub` / `internal` / `private` はパラメータごとに指定可能。
- 修飾子の順序: 可視性が先、次に `mut` — `pub mut` であり `mut pub` ではない。

コンストラクタパラメータはデフォルト値をサポート:

```valen
class Config(pub host: String = "localhost", pub port: Int = 8080) {}
```

## 固有 `impl` ブロック

クラス本体の外側で `impl Type { ... }` を使ってメソッドを追加できる:

```valen
// クラス本体内のメソッド
class Foo(pub x: Int) {
    fn bar(self) -> Int { self.x }
}

// 固有 impl によるメソッド
impl Foo {
    fn baz(self) -> Int { self.x * 2 }
}
```

- 固有 impl メソッドはクラス本体メソッドと同じ解決優先度。
- `fn method(self)` — インスタンスメソッド、`foo.bar()` で呼び出す。
- `fn assoc(x: T)` (`self` なし) — 関連関数、`Foo::assoc(x)` で呼び出す。
- Trait の実装は常に別途: `impl Trait for Foo { ... }`。

## `derives(...)` 句

クラスと data class は `derives(...)` を宣言して標準メソッドを自動生成できる。

```valen
class Foo(pub x: Int, pub y: Int) derives(Eq, Hash) {
    fn bar(self) -> Int { self.x + self.y }
}

data class Point(x: Float, y: Float) derives(Eq, Hash, Display, Clone);
```

**構文:** `derives(Trait1, Trait2, ...)` — コンストラクタパラメータ（およびスーパータイプ句がある場合はその後）の後、本体 `{` または終端 `;` の前に配置。

### 導出可能な Trait

| Trait     | 生成されるメソッド              | 動作                              |
|-----------|---------------------------------|-----------------------------------|
| `Eq`     | `equals(Object) -> Boolean`     | フィールドごとの構造的比較        |
| `Hash`   | `hashCode() -> Int`             | 31 乗算累積アルゴリズム           |
| `Display` | `toString() -> String`         | `ClassName(field=value, ...)` 形式 |
| `Clone`  | `copy(...) -> Self`             | 全フィールドコピーコンストラクタ  |

`data class` は 4 つすべてを自動的に導出する — 明示的な `derives(...)` は冗長だが無害。通常の `class` や `enum` でオプトインするために `derives(...)` を使用。

## `data class`

```valen
data class Point(x: Float, y: Float);
data class User(pub name: String, pub email: String);
```

### 自動生成メソッド

| メソッド     | 動作                                    |
|--------------|-----------------------------------------|
| `equals`     | フィールドごとの構造的比較              |
| `hashCode`   | 全フィールドの 31 乗算累積             |
| `toString`   | `TypeName(field=value, ...)` 形式       |
| `copy`       | 名前付きオーバーライド付きコピーコンストラクタ |

自動生成は data class 自身の**プライマリコンストラクタパラメータのみ**を考慮する（継承された状態は含まない）。

### 制約

| ルール                     | 詳細                                             |
|----------------------------|--------------------------------------------------|
| 常に `final`               | サブクラス化不可                                 |
| `open` / `abstract` / `sealed` 不可 | これらの修飾子は data class では禁止     |
| スーパークラスになれない   | 他のクラスは data class を継承できない           |
| sealed/open/abstract class を継承可能 | sealed 階層のリーフとして使用可能    |
| Trait impl 可能            | `impl Trait for DataClass { ... }` が動作する    |
| 固有 impl 可能             | `impl DataClass { ... }` が動作する             |
| セミコロン終端             | 本体なしの data class は `;` で終端              |

::: warning 既知の制限
スーパータイプ構文 (`: SuperClass(args)`) はパースされるが、スーパータイプ情報は **HIR ローワリング時に失われる**。data class は現在、生成されるバイトコードでは常に `java.lang.Object` を継承する。将来のリリースで修正予定。
:::

## `open` / `abstract` / `sealed` class

| 修飾子     | サブクラス化可能 | インスタンス化可能 | メソッド                       |
|------------|-----------------|--------------------|---------------------------------|
| *(なし)*   | 不可 (final)    | 可能               | すべて具象                      |
| `open`     | 可能            | 可能               | オーバーライド可能メソッドに `open fn` を付与 |
| `abstract` | 可能            | 不可               | `abstract fn`（本体なし）を持てる |
| `sealed`   | 可能（同一モジュールのみ） | 不可      | 網羅的 match のための閉じた階層 |

```valen
open class Animal(pub name: String) {
    open fn speak(self) -> String { "..." }
}

abstract class Shape {
    abstract fn area(self) -> Float { /* プレースホルダ */ }
}

sealed class Payment;
class Card(pub number: String) : Payment();
data class Cash : Payment();
```

`open` は連鎖しない — `B : A` で `B` 自身もサブクラス化可能にしたい場合、`B` にも `open` を宣言する必要がある。

::: warning 既知の制限 — 抽象メソッド
AST は本体なしメソッド（`body: Option<Block>`）をサポートするが、**現在のパーサーはすべてのメソッドに本体を要求する**。`abstract fn area(self) -> Float;`（セミコロン終端、本体なし）はパースエラーになる。現時点では抽象メソッドにはプレースホルダ本体が必要。セミコロン終端の本体なし `abstract fn` のサポートを予定。
:::

## `sealed class` / `sealed trait` のバイトコード

| Valen | JVM バイトコード |
|-------|--------------|
| `sealed class Foo` | `abstract class Foo` + `PermittedSubclasses` 属性 |
| `sealed trait Foo` | `interface Foo` (abstract + interface) + `PermittedSubclasses` 属性 |

sealed class/trait は JVM の sealed class (JEP 360/397, JDK 17+) を活用する。`PermittedSubclasses` クラスファイル属性が許可されたサブタイプを列挙する。

## `override fn`

親メソッドのオーバーライドには、親の `open fn` と子の `override fn` の両方が必要。

```valen
class Dog(pub name: String) : Animal(name) {
    override fn speak(self) -> String { "woof" }
}
```

- 親メソッドのシャドウイング時に `override` を省略するとコンパイルエラー。
- `override` はシグネチャが親の `open fn` に一致する場合にのみ必要。
- シグネチャが異なる場合（引数の数や型）、同名は `override` なしで共存可能。
- クラス本体のメソッドは trait の要件を**充足しない** — trait の実装は `impl Trait for Type { ... }` ブロックで行う必要がある。

## スーパークラスコンストラクタ呼び出し

スーパークラスコンストラクタは継承句で呼び出す:

```valen
class Dog(pub name: String) : Animal(name) {
    // ...
}
```

引数は親のプライマリコンストラクタに直接渡される。

## `super` 呼び出し

`super.method()` は親**クラス**のメソッドのみを呼び出す。Trait のデフォルトメソッドを呼び出すには UFCS を使用: `Trait::method(self)`。Valen は単一クラス継承のため、`super` に曖昧さは生じない。

## クラス本体の制約

クラス本体は**メソッド宣言のみ**をサポートする。クラス本体内のフィールド宣言は現在のパーサーではサポートされていない — フィールドはコンストラクタパラメータとしてのみ定義。クラス本体内でメソッド以外のトークンに遭遇するとパースエラーが発生する。

## メソッド解決順序

`value.foo(args)` を解決する際、コンパイラは以下の順序に従う:

1. **クラス本体** — クラス宣言内で定義されたメソッド（最高優先度）。
2. **固有 impl** — `impl Type { ... }` ブロックのメソッド。
3. **Trait メソッド** — スコープ内の trait メソッド（最低優先度）。
4. **曖昧性エラー** — 複数の trait 候補がマッチし、区別できない場合。

UFCS で明確化: `Trait::foo(value, args...)`。

`Class::foo(args...)` は関連関数（`self` なし）専用。インスタンスメソッドは常にドット構文を使用。

## 関連関数とトップレベル関数

`parse(x)` はトップレベル関数として解決される。`User::parse(x)` は `User` の関連関数として解決される。2つの名前空間は統合されない。

**推奨:**
- **関連関数** — ファクトリメソッド、コンストラクタ、型の内部に触れるもの（`from_*`、`parse`、`zero`、`default`）
- **トップレベル関数** — 複数の型にまたがるアルゴリズム、ステートレスなユーティリティ、純粋関数

## サポートされていない機能

- `init { ... }` ブロック
- セカンダリコンストラクタ
- フィールドオーバーライド（`override val`）
- ネスト/内部クラス
- クラス本体内のフィールド宣言（コンストラクタパラメータのみ）
- 抽象メソッドの本体なし宣言（パーサーが本体を要求）
- data class のスーパータイプコード生成（HIR ローワリングでスーパータイプ情報が失われる）
