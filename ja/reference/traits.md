# Trait

## Trait 宣言

```valen
trait Area {
    fn area(self) -> Float;
}

trait Display {
    fn display(self) -> String;
}
```

すべての trait メソッドは `pub` 可視性に強制される。trait メソッドに可視性修飾子を書いても無視される — パーサーはすべての trait メソッドを `Visibility::Pub` にハードコードする。

## デフォルトメソッド

Trait メソッドはデフォルト実装（本体）を持てる。`impl` ブロックでデフォルト本体を持つメソッドを省略した場合、コンパイルエラーではなくデフォルトが使用される。

```valen
trait Greet {
    fn greet(self) -> String { "hello" }
}

class Dog {}

// greet を省略 — デフォルト実装が使用される
impl Greet for Dog {}
```

- impl で同名メソッドを提供するとデフォルトをオーバーライドする（シグネチャは一致する必要あり）。

## impl Trait for Type

```valen
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

クラス本体のメソッドは trait の要件を**充足しない**。Trait の実装には常に明示的な `impl Trait for Type { ... }` ブロックが必要。クラス本体に trait メソッドと同名・同シグネチャのメソッドがある場合、`value.foo()` はクラス本体メソッドに解決される。

::: info
`impl` ブロック内のすべてのメソッドは、書いた可視性修飾子に関係なくリゾルバによって `pub` に強制される。impl メソッドは事実上常にパブリック。
:::

## 固有 impl

`impl Type { ... }` は型に直接メソッドを追加する。`enum` と `data class` にメソッドを追加する主要な方法。

```valen
impl Vec2 {
    fn length(self) -> Float { /* ... */ }
    fn scale(self, factor: Float) -> Vec2 { /* ... */ }
}
```

クラスはクラス本体でもメソッドを定義できる — クラスにとって固有 `impl` はオプション。

## レシーバ

| 形式 | 意味 |
|---|---|
| `fn f(self)` | 明示的 self レシーバ |
| `fn f(mut self)` | ミュータブル self レシーバ |
| `fn f(&self)` / `fn f(&mut self)` | **サポートされていない**（所有権モデルなし） |

## オーファンルール

`impl Trait for Type` は以下の**少なくとも1つ**が成立する場合のみ許可:

- `Trait` が現在の**コンパイル単位**で定義されている。
- `Type` の最外の名前型コンストラクタが現在の**コンパイル単位**に所有されている。

コヒーレンスチェッカーは HIR の `local_defs` 内の定義に基づいて所有権を判定する。プレリュード注入の合成型は除外される。import 経由でのみ出現する名前は「外来」と見なされる。

### 禁止

| ケース | 例 | 理由 |
|------|---------|--------|
| 外来 trait に対する外来型 | `impl java.util.List for java.lang.String` | どちらも所有していない |
| typealias によるバイパス | `typealias MyList = java.util.List<Int>; impl Foo for MyList` | typealias は所有権を生成しない |
| ブランケット impl | `impl<T: Foo> Bar for T` | サポートされていない |

### stdlib の例外

`valen.core` と `valen.std.*` パッケージは外来 trait を外来型に実装可能（Java コレクション統合用）。ユーザーコードでは不可。

### 一意性

各 `(Trait, Type)` ペアにはグローバルに唯一の実装。重複 impl はコンパイルエラー。

### Trait 充足

- Trait メソッドの実装は `impl Trait for Type { ... }` ブロック内でのみ成立する。
- trait メソッドと同名・同シグネチャのクラス本体メソッドは trait を**充足しない**。
- 両方が存在する場合、`value.foo()` はクラス本体メソッドを優先して解決する。

### 競合解決

1. クラス本体メンバー（メソッド / 関連関数）が適用可能なら最優先。
2. 複数の trait メソッドが候補で曖昧な場合、UFCS を使用: `Trait::foo(value, args)`。

## UFCS (統一関数呼び出し構文)

複数の trait 間でメソッド解決が曖昧な場合、UFCS で明確化する:

```valen
Trait::method(receiver, args...)
```

```valen
// 曖昧 — TraitA と TraitB の両方が `process` を定義
TraitA::process(value, arg);
```

`Class::name(args)` は関連関数（`self` なし）**専用**。インスタンスメソッドは常にドット構文を使用。

## sealed trait

`sealed trait` は同一コンパイル単位に実装者を制限し、網羅的な `match` を可能にする。

```valen
sealed trait Expr {
    fn eval(self) -> Int;
}

class Lit {}
class Add {}

impl Expr for Lit { fn eval(self) -> Int { 0 } }
impl Expr for Add { fn eval(self) -> Int { 1 } }

match e {
    Lit => 0,
    Add => 1,
}   // 網羅的 — すべての実装者をカバー
```

| ルール                            | 詳細                                      |
|-----------------------------------|-------------------------------------------|
| 実装者: `class`、`data class` のみ | `enum` は sealed trait を実装不可         |
| 許可スコープ                      | 同一コンパイル単位                        |
| JVM ABI                           | `PermittedSubclasses` 付き `sealed interface` |

::: warning
スーパー trait（例: `sealed trait Foo: Bar`）は**サポートされていない**。現在の代替手段は[交差制約](#交差制約)を参照。
:::

## 関連型

```valen
trait Container {
    type Item;
    fn get(self, index: Int) -> Self;  // 注: Self::Item は未実装
}

impl Container for IntList {
    type Item = Int;
    fn get(self, index: Int) -> Int { /* ... */ }
}
```

- impl ごとに1つの具体型。
- trait 定義でのデフォルト型が可能: `type Item = Int;`。

::: warning 将来
**`Self::AssocType` 参照構文は未実装。** パーサーは `Self::Item` を型パスとして解決しない。型パスはセグメント区切りに `.`（ドット）を使用し、`::` は値レベルのバリアントアクセスのみ。

回避策として、stdlib の演算子 trait は `Self::Output` の代わりに `Self` を戻り型として使用している。
:::

## derives

型宣言の `derives(Trait1, Trait2)` は trait 実装を自動生成する。

```valen
data class Point(x: Float, y: Float);                    // 暗黙的 derives(Eq, Hash, Display, Clone)
enum Color derives(Eq, Hash, Display) { Red, Green, Blue(value: Int) }
class Pos(pub x: Float, pub y: Float) derives(Eq) {}
```

### 導出可能な Trait

| Trait     | 生成されるメソッド                | 動作                                  |
|-----------|---------------------------------------|---------------------------------------|
| `Eq`     | `equals(Object) -> boolean`           | フィールドごとの比較                  |
| `Hash`   | `hashCode() -> int`                   | 31 乗算累積                           |
| `Display` | `toString() -> String`               | `TypeName(field=value, ...)` 形式     |
| `Clone`  | `copy(fields...) -> Self`             | 全フィールドのコピーコンストラクタ    |

`data class` は 4 つすべてを自動的に導出する — 明示的な `derives(...)` は冗長だが無害。

## 演算子オーバーロード

プレリュードの対応する trait を実装して演算子をオーバーロードする。

### 算術演算子

| 演算子   | Trait       | メソッドシグネチャ                            |
|----------|-------------|-----------------------------------------------|
| `+`      | `Add<Rhs>`  | `fn add(self, rhs: Rhs) -> Self`             |
| `-`      | `Sub<Rhs>`  | `fn sub(self, rhs: Rhs) -> Self`             |
| `*`      | `Mul<Rhs>`  | `fn mul(self, rhs: Rhs) -> Self`             |
| `/`      | `Div<Rhs>`  | `fn div(self, rhs: Rhs) -> Self`             |
| `%`      | `Rem<Rhs>`  | `fn rem(self, rhs: Rhs) -> Self`             |

各算術 trait は関連型 `type Output` を宣言するが、`Self::Output` は[未実装](#関連型)のため、メソッドの戻り型は `Self` になっている。

### 単項演算子

| 演算子   | Trait  | メソッドシグネチャ                   |
|----------|--------|--------------------------------------|
| `-x`     | `Neg`  | `fn neg(self) -> Self`               |
| `!x`     | `Not`  | `fn not(self) -> Self`               |

### 比較演算子

| 演算子               | Trait  | メソッドシグネチャ                 |
|----------------------|--------|------------------------------------|
| `<` `<=` `>` `>=`   | `Ord`  | `fn cmp(self, rhs: Self) -> Int`   |

`cmp` の戻り値: 負 → `<`、ゼロ → `==`、正 → `>`。

### 等値演算子

| 演算子       | Trait | メソッドシグネチャ                   |
|-------------|-------|--------------------------------------|
| `==` `!=`   | `Eq`  | `fn eq(self, rhs: Self) -> Bool`     |

- `impl Eq` が存在する場合 → `Eq::eq` を使用。
- `impl Eq` が存在しない場合 → `.equals()` にフォールバック。
- プリミティブ型の `==` は組み込み（trait 不要）。

### 例

```valen
impl Add<Vec2> for Vec2 {
    type Output = Vec2;
    fn add(self, rhs: Vec2) -> Vec2 {
        Vec2(x = self.x + rhs.x, y = self.y + rhs.y)
    }
}
```

## 交差制約

型パラメータに複数の trait 境界を要求するには `+` を使用:

```valen
fn process<T: System + EventHandler>(system: T, world: World) -> Unit { ... }
```

`T: A + B` と宣言すると、`A` と `B` の両方のメソッドが `T` で呼び出し可能になり、`T` に代入される具体型は両方を実装する必要がある。

::: warning 将来 — スーパー trait
スーパー trait 構文（例: `trait Queryable: Component + Eq { ... }`）は**未実装**。AST に trait 宣言の `supertypes` フィールドがなく、パーサーは `:` の後のスーパー trait リストをパースしない。

回避策として、使用側ですべての境界を要求する: `T: Queryable + Component + Eq`。
:::
