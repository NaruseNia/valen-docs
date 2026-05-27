# ジェネリクス

## 宣言構文

型パラメータは `<T>` 山括弧構文を使い、パラメータ化する名前の後に配置する。

### 関数

```valen
fn identity<T>(x: T) -> T { x }
fn swap<A, B>(pair: Pair<A, B>) -> Pair<B, A> { ... }
```

### クラス

```valen
class Box<T>(pub value: T) {
    fn get(self) -> T { self.value }
}
```

### データクラス

```valen
data class Pair<A, B>(pub first: A, pub second: B);
```

### Trait

```valen
trait Mapper<T> {
    fn map<U>(self, f: fn(T) -> U) -> Self;
}
```

### Enum

```valen
enum Tree<T> {
    Leaf(value: T),
    Node(left: Tree<T>, right: Tree<T>),
}
```

## 境界

型パラメータに特定の trait 実装を要求する制約。

| 構文 | 意味 |
|---|---|
| `T: Trait` | `T` は `Trait` を実装する必要がある |
| `T: A + B` | `T` は `A` と `B` の両方を実装する必要がある |

```valen
fn print_value<T: Display>(value: T) {
    println(value.display());
}

fn process<T: System + EventHandler>(system: T, world: World) -> Unit { ... }
```

境界はクラスの型パラメータにも使用可能:

```valen
class SortedList<T: Comparable>(mut items: List<T>) { ... }
```

::: info
**`where` 句はサポートされていない。** すべての境界は型パラメータの宣言位置でインラインに宣言する必要がある（`T: Bound`）。`where T: Bound` 構文は存在しない。
:::

## 変性

型パラメータの宣言位置で指定する。サブタイピングの方向を制御する。

| アノテーション | 名前 | 意味 | Kotlin | Java |
|---|---|---|---|---|
| `out T` | 共変 | 型は `T` を生成できるが消費できない | `out T` | `? extends T` |
| `in T` | 反変 | 型は `T` を消費できるが生成できない | `in T` | `? super T` |
| *(なし)* | 不変 | `T` についてサブタイピング関係なし | `T` | `T` |

```valen
class Producer<out T>(value: T) {
    fn get(self) -> T { self.value }     // OK: T は出力位置
}

class Consumer<in T> {
    fn accept(self, value: T) { ... }    // OK: T は入力位置
}
```

::: warning
**変性はパースされるが強制されない。** パーサーは `out` と `in` アノテーションを認識し `Variance::Covariant` / `Variance::Contravariant` として格納するが、型チェッカーは変性制約を**検証しない**。例えば、`out T` を入力位置で使用してもエラーなしでコンパイルされる。強制は将来のフェーズで予定。
:::

## 明示的型引数

推論が不十分な場合、呼び出し側で型引数を明示的に指定できる。

```valen
let list = ArrayList<String>();
let map = HashMap<String, Int>();
let x = parse<Int>("42");
let items = iter(list).collect<List<String>>();
```

推論が成功する場合、型引数はオプション。

## reified 型パラメータ

`reified T` は各呼び出し側で具体型を代入し、ランタイムで型情報を保持する。`inline fn` でのみ利用可能。

```valen
inline fn <reified T> isInstance(value: Any) -> Bool {
    value is T
}

let a = isInstance<String>("hello");  // true
let b = isInstance<Int>("hello");     // false
```

### `reified T` に対する操作

| 操作 | 構文 | JVM コード生成 | 状態 |
|---|---|---|---|
| 型チェック | `value is T` | `instanceof ConcreteType` | 実装済み |
| キャスト | `value as T` | `checkcast ConcreteType` | 実装済み |
| クラスリテラル | `T::class` | `ldc ConcreteType.class` | **未実装** |

::: warning
`T::class` はまだサポートされていない。reified 型パラメータでは `is` と `as` 操作のみ動作する。
:::

### 制約

| ルール | 詳細 |
|---|---|
| `inline fn` 内のみ | 通常の `fn`、`class`、`trait`、`enum` の型パラメータには `reified` を使用不可 |
| 混在可能 | `inline fn <reified T, U>` — `T` は reified、`U` はイレイジャーされる |
| 再帰不可 | `inline fn` は自身を呼び出せない（無限展開） |
| Java 連携 | Java からの呼び出し時、`reified` は無視される（通常のイレイジャーが適用） |

## JVM での型イレイジャー

非 reified の型パラメータはランタイムでイレイジャーされ、JVM ジェネリクスと一致する。

- コンパイル時: パラメータ化された型による完全な型チェック
- ランタイム: 型パラメータは境界（または `Object`）にイレイジャーされる

```valen
// コンパイル時: Box<Int> と Box<String> は異なる型
let a: Box<Int> = Box(value = 42);
let b: Box<String> = Box(value = "hello");

// ランタイム: 両方とも Box (型パラメータがイレイジャーされる)
```

ランタイムで型情報を保持するには、`inline fn` と `reified` を使用する。
