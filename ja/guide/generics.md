# ジェネリクス

ジェネリクスを使えば、あらゆる型で動作するコードを書ける — 制約をかけるまでは。Valenは Java や Kotlin のような山括弧構文を使い、制約には trait 境界をサポートし、将来的な検証のために宣言サイドの変性アノテーションを受け付ける。

## 基本的なジェネリクス

関数名またはクラス名の後に山括弧で型パラメータを宣言する:

```valen
fn identity<T>(x: T) -> T {
    x
}
```

この関数は任意の型 `T` を受け取り、同じ型を返す。呼び出し側では通常、型推論が `T` を特定してくれる:

```valen
let a = identity(42);        // T = Int
let b = identity("hello");   // T = String
```

推論にヒントが必要な場合は、型引数を明示的に指定:

```valen
let c = identity<String>("hello");
```

## ジェネリック関数

関数は複数の型パラメータを持てる（カンマ区切り）:

```valen
fn first<T>(items: List<T>) -> Option<T> {
    if items.is_empty() {
        None
    } else {
        Some(items.get(0))
    }
}

fn swap<A, B>(pair: Pair<A, B>) -> Pair<B, A> {
    Pair(first = pair.second, second = pair.first)
}
```

特に驚くことはない — Java や Kotlin から期待する通りに動作する。

## ジェネリッククラス

型パラメータはクラス名の直後に置く。クラス内のメソッドから自由に参照できる:

```valen
class Box<T>(pub value: T) {
    fn get(self) -> T {
        self.value
    }

    fn map<U>(self, f: fn(T) -> U) -> Box<U> {
        Box(value = f(self.value))
    }
}

let box = Box(value = 42);
let mapped = box.map(|x| f"{x}");  // Box<String>
```

`map` がクラスの `T` に加えて独自の型パラメータ `U` を導入している点に注目。メソッドは追加の型パラメータを持てる — クラスが宣言したものに限定されない。

data class も同様:

```valen
data class Pair<A, B>(pub first: A, pub second: B);

let pair = Pair(first = "name", second = 42);
println(pair);       // Pair(first=name, second=42)

let other = Pair(first = "name", second = 42);
pair == other        // true — data class の構造的等価性
```

自動生成される `equals`、`hashCode`、`toString`、`copy` はすべて型パラメータを尊重する。

## Trait 境界

制約なしの型パラメータは便利だが、型が特定の操作をサポートすることを保証したい場合がある。そこで境界の出番。

### 単一境界

型パラメータの後に `: TraitName` を使う:

```valen
fn print_value<T: Display>(value: T) {
    println(value.display());
}
```

`T: Display` は「T は `Display` trait を実装していなければならない」の意味。この境界なしに `value.display()` を呼ぶとコンパイルエラー — コンパイラは `T` がそのメソッドを持っているか分からない。

### 複数境界（交差制約）

`+` で境界を連結:

```valen
fn log<T: Display + Debug>(value: T) {
    println(f"display: {value.display()}");
    println(f"debug: {value.debug()}");
}

fn process<T: System + EventHandler>(system: T, world: World) -> Unit {
    // T は System と EventHandler の両方を実装する必要がある
}
```

`T` はリストされたすべての trait を実装する必要がある。いずれか1つでも欠けていれば呼び出し側でコンパイルが通らない。

### クラスの境界

クラスの型パラメータにも境界を付けられる:

```valen
class SortedList<T: Comparable>(mut items: List<T>) {
    fn add(mut self, item: T) {
        self.items.add(item);
        self.items.sort();
    }

    fn first(self) -> Option<T> {
        if self.items.is_empty() {
            None
        } else {
            Some(self.items.get(0))
        }
    }
}
```

`T` が `Comparable` を実装している場合のみ `SortedList<T>` を生成できる。`SortedList<SomeRandomType>` を試すとコンパイラが止める。

::: info `where` 句はなし
Valenは型境界の `where` 句をサポートしていない。すべての境界は型パラメータ宣言でインラインに指定する（例: `<T: Foo + Bar>`）。複雑な境界が必要な場合は `+` ですべて列挙する。
:::

## 変性

変性は型間のサブタイプ関係がジェネリックラッパーにどう伝搬するかを制御する。Valenは（Kotlin のように）宣言サイドの変性アノテーションを使うため、使用箇所ではなくクラス定義で一度アノテーションすればよい。

| アノテーション | 名前 | 意味 | Java での等価物 |
|------------|------|---------|-----------------|
| `out T` | 共変 | `T` を生産するが消費しない | `? extends T` |
| `in T` | 反変 | `T` を消費するが生産しない | `? super T` |
| *(なし)* | 不変 | `T` の生産と消費の両方 | `T` |

```valen
// 共変: T を生産するのみ（返すだけで、入力として受け取らない）
class Producer<out T>(value: T) {
    fn get(self) -> T {
        self.value
    }
}

// 反変: T を消費するのみ（入力として受け取るだけで、返さない）
trait Consumer<in T> {
    fn accept(self, value: T) -> Unit;
}
```

::: warning 変性はパースされるが検証されない
コンパイラは `in` と `out` アノテーションを受け付けAST に格納するが、**変性の制約は現在検査も検証もされない**。つまり `out T` と宣言しつつ反変の位置に `T` を置いてもコンパイラは止めない。意味的な検証は将来のリリースで計画されている。現時点では、アノテーションは意図のドキュメントとして機能する。
:::

## JVM上の型消去

Valenのジェネリクスは Java や Kotlin と同様にJVMの型消去に従う:

- **コンパイル時:** 完全な型検査 — `Box<Int>` と `Box<String>` は別の型
- **実行時:** 型パラメータは消去される — どちらもただの `Box`

```valen
let a: Box<Int> = Box(value = 42);
let b: Box<String> = Box(value = "hello");
// 実行時には a と b はどちらもただの Box — JVM は Int や String を知らない
```

つまり、通常のジェネリック型パラメータでは `value is T` や `value as T` ができない。型情報が実行時に存在しないため。

## Reified ジェネリクス（実際の型の抽出）

型消去を回避するため、Valenは `inline fn` で `reified` 型パラメータをサポートする。関数本体が各呼び出し箇所にインライン化され、具体的な型が代入される:

```valen
inline fn <reified T> isInstance(value: Any) -> Bool {
    value is T    // T が reified なので動作する
}

isInstance<String>("hello")   // true
isInstance<Int>("hello")      // false
```

`reified T` で可能なこと:
- **型検査:** `value is T`
- **キャスト:** `value as T`

::: tip
`reified` は `inline fn` でのみ動作する。通常の関数、クラス、trait、enum では reified 型パラメータは使えない。詳細は[インライン関数と Reified ジェネリクス](/ja/guide/inline-reified)の章を参照。
:::

## 型推論

実際には型引数を明示的に書く必要はほとんどない。コンパイラがコンテキストから推論する:

```valen
let box = Box(value = 42);                    // Box<Int>
let pair = Pair(first = 1, second = "a");     // Pair<Int, String>
let id = identity("hello");                   // String

// コンテキストがない場合は変数にアノテーション:
let empty: List<Int> = List();
```

明示的な型引数はデフォルトではなく非常手段。推論に任せ、コンパイラが求めた時だけ型を指定する。

## 次のステップ

- [クラス](/ja/guide/classes) — ジェネリッククラス、data class、継承
- [Trait](/ja/guide/traits) — 型パラメータを制約する境界の定義
