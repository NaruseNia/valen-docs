# ジェネリクス

ジェネリクスを使えば、あらゆる型で動くコードが書けます — 制約をかけるまでは。Valen は Java や Kotlin と同じ山括弧構文を使い、制約には trait 境界をサポート。将来の検証に向けて宣言サイドの変性アノテーションも受け付けます。

## 基本的なジェネリクス

関数名またはクラス名の後に山括弧で型パラメータを宣言します:

```valen
fn identity<T>(x: T) -> T {
    x
}
```

任意の型 `T` を受け取って同じ型を返す関数です。呼び出し側では通常、型推論が `T` を特定してくれますよ:

```valen
let a = identity(42);        // T = Int
let b = identity("hello");   // T = String
```

推論にヒントが必要なら、型引数を明示的に指定:

```valen
let c = identity<String>("hello");
```

## ジェネリック関数

関数は複数の型パラメータを持てます（カンマ区切り）:

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

特に驚くところはないですね — Java や Kotlin から想像する通りに動きます。

## ジェネリッククラス

型パラメータはクラス名の直後に置きます。クラス内のメソッドから自由に参照できますよ:

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

`map` がクラスの `T` に加えて独自の型パラメータ `U` を導入している点に注目。メソッドは追加の型パラメータを持てます — クラスが宣言したものに縛られません。

data class でも同じです:

```valen
data class Pair<A, B>(pub first: A, pub second: B);

let pair = Pair(first = "name", second = 42);
println(pair);       // Pair(first=name, second=42)

let other = Pair(first = "name", second = 42);
pair == other        // true — data class の構造的等価性
```

自動生成される `equals`、`hashCode`、`toString`、`copy` はすべて型パラメータをちゃんと尊重してくれます。

## Trait 境界

制約なしの型パラメータは便利ですが、型が特定の操作をサポートしていることを保証したい場面もありますよね。そこで境界の出番です。

### 単一境界

型パラメータの後に `: TraitName` を使います:

```valen
fn print_value<T: Display>(value: T) {
    println(value.display());
}
```

`T: Display` は「T は `Display` trait を実装していないとダメ」という意味。この境界なしに `value.display()` を呼ぶとコンパイルエラーになります — コンパイラは `T` がそのメソッドを持っているかわからないので。

### 複数境界（交差制約）

`+` で境界を連結します:

```valen
fn log<T: Display + Debug>(value: T) {
    println(f"display: {value.display()}");
    println(f"debug: {value.debug()}");
}

fn process<T: System + EventHandler>(system: T, world: World) -> Unit {
    // T は System と EventHandler の両方を実装する必要あり
}
```

`T` はリストされたすべての trait を実装しないといけません。1つでも欠けていれば呼び出し側でコンパイルが通りません。

### クラスの境界

クラスの型パラメータにも境界を付けられます:

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

`T` が `Comparable` を実装している場合のみ `SortedList<T>` を作れます。`SortedList<SomeRandomType>` を試すとコンパイラが止めてくれますよ。

::: info `where` 句はなし
Valen は型境界の `where` 句をサポートしていません。すべての境界は型パラメータ宣言でインラインに指定します（例: `<T: Foo + Bar>`）。複雑な境界が必要なら `+` で全部列挙してください。
:::

## 変性

変性は、型間のサブタイプ関係がジェネリックラッパーにどう伝搬するかを制御するものです。Valen は（Kotlin のように）宣言サイドの変性アノテーションを使うので、使用箇所ではなくクラス定義で一度だけアノテーションすれば OK。

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
コンパイラは `in` と `out` アノテーションを受け付けて AST に格納しますが、**変性の制約は現在検査も検証もされていません**。`out T` と宣言しつつ反変の位置に `T` を置いてもコンパイラは止めません。意味的な検証は将来のリリースで追加予定です。今のところアノテーションは意図のドキュメントとして機能します。
:::

## JVM 上の型消去

Valen のジェネリクスは Java や Kotlin と同様に JVM の型消去に従います:

- **コンパイル時:** 完全な型検査 — `Box<Int>` と `Box<String>` は別の型
- **実行時:** 型パラメータは消去される — どちらもただの `Box`

```valen
let a: Box<Int> = Box(value = 42);
let b: Box<String> = Box(value = "hello");
// 実行時には a と b はどちらもただの Box — JVM は Int や String を知らない
```

つまり、通常のジェネリック型パラメータでは `value is T` や `value as T` はできません。型情報が実行時に存在しないからです。

## Reified ジェネリクス（実際の型の抽出）

型消去を回避するため、Valen は `inline fn` で `reified` 型パラメータをサポートしています。関数本体が各呼び出し箇所にインライン化されて、具体的な型が代入されます:

```valen
inline fn <reified T> isInstance(value: Any) -> Bool {
    value is T    // T が reified なので動作する
}

isInstance<String>("hello")   // true
isInstance<Int>("hello")      // false
```

`reified T` でできること:
- **型検査:** `value is T`
- **キャスト:** `value as T`

::: tip
`reified` は `inline fn` でのみ動作します。通常の関数、クラス、trait、enum では reified 型パラメータは使えません。詳しくは[インライン関数と Reified ジェネリクス](/ja/guide/inline-reified)の章をどうぞ。
:::

## 型推論

実際には型引数を明示的に書く場面はほとんどありません。コンパイラがコンテキストから推論してくれます:

```valen
let box = Box(value = 42);                    // Box<Int>
let pair = Pair(first = 1, second = "a");     // Pair<Int, String>
let id = identity("hello");                   // String

// コンテキストがない場合は変数にアノテーション:
let empty: List<Int> = List();
```

明示的な型引数はデフォルトじゃなくて最後の手段。推論に任せて、コンパイラが求めたときだけ型を指定しましょう。

## 次のステップ

- [クラス](/ja/guide/classes) — ジェネリッククラス、data class、継承
- [Trait](/ja/guide/traits) — 型パラメータを制約する境界の定義
