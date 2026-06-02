# 関数

## シグネチャ構文

```valen
fn name(param1: Type1, param2: Type2) -> ReturnType {
    body
}
```

- パラメータ型と戻り型は**常に明示的**です。
- `-> Unit` は省略できます。
- トップレベル関数が許可されています（外側のクラス不要）。

## 名前付き引数

呼び出し側で任意の引数を名前で渡せます。

```valen
fn greet(msg: String, count: Int) -> String { /* ... */ }

greet(msg = "hi", count = 3);
greet(count = 3, msg = "hi");  // 順序不問
```

## デフォルト引数

パラメータにデフォルト値を設定できます。デフォルトは各呼び出し時に呼び出し側で評価されます。

```valen
fn greet(msg: String = "hi", count: Int = 1) -> String { /* ... */ }

greet()              // msg = "hi", count = 1
greet("yo")          // msg = "yo", count = 1
greet(count = 5)     // msg = "hi", count = 5
```

- デフォルト値には任意の式（リテラル、関数呼び出し等）を使えます。
- パラメータの位置に制限はありません。どのパラメータにもデフォルトを設定できます。
- class / data class のコンストラクタパラメータにも対応しています。
- Trait メソッドはデフォルトを宣言できます。実装側ではデフォルトを**オーバーライドできません**。

## レシーバ: `self` / `mut self`

メソッドの最初のパラメータに `self` または `mut self` を指定するとインスタンスメソッドになります。パーサーは `self` を `Self` 型のパラメータとして扱います。

| レシーバ    | 意味                                |
|-------------|-------------------------------------|
| `self`      | イミュータブルレシーバ（読み取り専用） |
| `mut self`  | ミュータブルレシーバ（フィールド書き込み可） |
| *(なし)*    | 関連関数（インスタンスなし）          |

```valen
class Counter {
    let mut count: Int = 0;

    fn increment(mut self) {
        self.count += 1;
    }

    fn get(self) -> Int {
        self.count
    }
}
```

Trait メソッドも同様に `self` / `mut self` を使います。

```valen
trait Printable {
    fn print(self);
}

impl Printable for Counter {
    fn print(self) {
        println(f"count: {self.get()}");
    }
}
```

`&self` や `&mut self` は存在しません。Valen には所有権/借用モデルがありません。

## 関連関数

`self` レシーバのない関数は関連関数で、`Type::name(args)` で呼び出します。

```valen
class User(pub name: String, mut age: Int) {
    fn from_name(name: String) -> User {
        User(name = name, age = 0)
    }
}

let u = User::from_name("Alice");
```

`static` キーワードは存在しません。`self` の有無が唯一の区別です。

## UFCS (統一関数呼び出し構文)

メソッド構文 `value.method(args)` はファーストクラスです。複数の trait 間で曖昧さがある場合、**`Trait::method(receiver, args)`** で明確化します。

```valen
trait Mappable<T> {
    fn map<U>(self, f: fn(T) -> U) -> Mappable<U>;
}

// 通常のメソッド呼び出し
xs.map(|x| x * 2);

// 明確化（trait を明示）
Mappable::map(xs, |x| x * 2);
```

**禁止される形式:**
- ~~`map(xs, f)` 形式~~ — トップレベル関数呼び出しと区別不可能
- `foo(args)` は常にトップレベル関数呼び出しとして解決されます。Trait メソッドを関数呼び出しスタイルで呼ぶことはできません。

## 型推論

- **ローカル変数**: 型推論が利用できます。`let x = 42;` は `Int` と推論されます。
- **関数シグネチャ**: パラメータ型と戻り型は**常に明示的**です。省略するとコンパイルエラーになります。

```valen
let x = 42;           // x: Int (推論)
let y = f"{x}";       // y: String (推論)

// fn シグネチャは明示的でなければならない
fn add(a: Int, b: Int) -> Int {
    a + b  // 本体内での推論
}
```

## ラムダ（クロージャ）

`|params| body` でラムダ式を作成します。

```valen
let add = |a: Int, b: Int| a + b;
let unit = || 42;
```

パラメータ型はコンテキストから推論できる場合は省略できます。

### 戻り型注釈

`|params| -> Type body` で明示的な戻り型を追加します。

```valen
let parse = |s: String| -> Int {
    s.toInt()
};
```

### パラメータ数

0〜2パラメータは `java.util.function` の標準インターフェースにマッピング。3〜22パラメータはコンパイラが `valen/core/FunctionN` インターフェースを自動生成する。

| パラメータ数 | JVM マッピング |
|------------|-------------|
| 0 | `java.util.function.Supplier<R>` |
| 1 | `java.util.function.Function<T, R>` |
| 2 | `java.util.function.BiFunction<T, U, R>` |
| 3〜22 | `valen.core.FunctionN<A, B, ..., R>`（コンパイラ生成） |

23パラメータ以上はコンパイルエラー。

## `unsafe fn`

`unsafe fn` は呼び出し側に `unsafe { }` ブロックを要求する関数を宣言します。安全性の保証をバイパスする操作（未チェックキャスト、低レベル JVM 操作等）に使います。

```valen
unsafe fn cast_unchecked<T>(obj: Any) -> T {
    obj as T
}

// 呼び出し側
let value: Int = unsafe { cast_unchecked(raw) };
```

`unsafe fn` と `inline fn` は組み合わせられます。

```valen
unsafe inline fn fast_cast<T>(obj: Any) -> T {
    obj as T
}
```

パーサーは `unsafe fn` / `unsafe inline fn` を `FnDecl` の `is_unsafe` / `is_inline` フラグで処理します。

## Trait メソッドのデフォルト本体

Trait メソッドは本体を省略（抽象メソッド）するか、デフォルト実装を提供できます。

```valen
trait Summary {
    // 抽象 — impl は本体を提供する必要あり
    fn summarize(self) -> String;

    // デフォルト実装 — impl でオーバーライド可能
    fn preview(self) -> String {
        let s = self.summarize();
        f"{s}..."
    }
}
```

- 本体なし（`;` で終端）— `is_abstract = true`, `body = None`
- 本体あり（`{ ... }`）— `is_abstract = false`, `body = Some(...)`

## `inline fn`

`inline fn` は呼び出し側で本体を展開します。ラムダ引数もインライン化され、ボクシングのオーバーヘッドを回避します。

```valen
inline fn <T> measure(block: fn() -> T) -> T {
    let start = System.nanoTime();
    let result = block();
    println(f"elapsed: {System.nanoTime() - start}ns");
    result
}
```

### ラムダのインライン化

`inline fn` に渡されたラムダは呼び出し側で展開されます。

```valen
inline fn <T> run(block: fn() -> T) -> T {
    block()
}

fn main() {
    let x = run(|| { 42 });
    // block() の本体はここでインライン化
}
```

非ローカルリターン（ラムダ内の `return` で外側の関数から抜ける）はサポートされていません。代わりに末尾式を使ってください。

### 制約

| 制約                     | 理由                                  |
|--------------------------|---------------------------------------|
| 再帰不可                 | インライン化で無限展開が発生する      |
| 非ローカル `return` 不可 | 代わりに末尾式を使用                  |
| 本体変更時に呼び出し側の再コンパイルが必要 | インライン化固有の性質 |

Java からは `inline fn` は通常のメソッドとして見えます。`reified` パラメータはイレイジャーされます。

## `reified` 型パラメータ

`reified` パラメータは `inline fn` 内でのみ利用できます。JVM の型イレイジャーをバイパスし、ランタイムで具体的な型情報を保持します。

```valen
inline fn <reified T> isInstance(value: Any) -> Bool {
    value is T
}

inline fn <reified T, U> mixed(value: Any, other: U) -> Bool {
    value is T   // OK — T は reified
    // value is U — ERROR — U は reified ではない
}
```

### `reified T` で可能な操作

| 操作          | 構文        | JVM コード生成                 |
|---------------|-------------|--------------------------------|
| 型チェック    | `value is T` | `instanceof ConcreteType`     |
| キャスト      | `value as T` | `checkcast ConcreteType`      |
| クラスリテラル | `T::class`   | `ldc ConcreteType.class`      |

`reified` は class、trait、enum の型パラメータには使えません。`inline fn` の型パラメータのみです。reified と非 reified の型パラメータは同一関数上に共存できます。

## 組み込み関数

プレリュードは以下の組み込み関数を提供しており、import なしで利用できます。

| 関数      | シグネチャ             | 説明                               | JVM 実装                    |
|-----------|------------------------|------------------------------------|-----------------------------|
| `println` | `fn(String) -> Unit`   | 文字列を標準出力に改行付きで出力    | `System.out.println(String)` |
| `print`   | `fn(String) -> Unit`   | 文字列を標準出力に出力（改行なし）  | `System.out.print(String)`   |

```valen
println("hello world");          // hello world\n
print("no newline");             // no newline
println(f"count: {x}");          // F 文字列と併用可能
```
