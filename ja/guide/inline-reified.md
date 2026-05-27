# Inline と Reified

JVM は実行時にジェネリック型パラメータを消去する。99% の場合これで問題ない — `value is T` が必要で JVM が肩をすくめるまでは。Valen の `inline fn` と `reified` 型パラメータは、関数本体を呼び出し箇所にインライン化し、重要な場面で具体的な型情報を保持することでこれを解決する。

## `inline fn` — 呼び出し箇所でのインライン化

`inline fn` は（概念的に）本体がすべての呼び出し箇所にコピー＆ペーストされる。主なメリット: **ラムダ引数もインライン化され**、`Function` オブジェクトへのボクシングオーバーヘッドが排除される。

```valen
inline fn <T> measure(block: fn() -> T) -> T {
    let start = System.nanoTime();
    let result = block();
    println(f"elapsed: {System.nanoTime() - start}ns");
    result
}

fn main() {
    let answer = measure(|| { 42 });
    // ラムダ本体がここにインライン化される — Function オブジェクトのアロケーションなし
}
```

Kotlin の `inline fun` と同じ考え方。ラムダを受け取るユーティリティを書いていてパフォーマンスが重要なら、`inline fn` がそのツール。

### ラムダのインライン化

`inline fn` にラムダを渡すと、ラムダの本体が周囲のコードに直接展開される。匿名クラスなし、`invoke()` 呼び出しなし、アロケーションなし:

```valen
inline fn <T> run(block: fn() -> T) -> T {
    block()
}

fn main() {
    let x = run(|| { 42 });
    // インライン化後、実質的にこうなる: let x = 42;
}
```

::: info ラムダのアリティ制限
inline 関数は現在、最大2引数のラムダパラメータをサポート（例: `fn(A, B) -> C`）。3引数以上のラムダはサポートされていない。
:::

## `reified T` — 消去を生き延びる型

通常、`T` は実行時に消去される。`inline fn` 内で `reified` を付けると、コンパイラが各呼び出し箇所で具体的な型を代入する:

```valen
inline fn <reified T> isInstance(value: Any) -> Bool {
    value is T
}

let a = isInstance<String>("hello");  // true — instanceof String を検査
let b = isInstance<Int>("hello");     // false — instanceof Integer を検査
```

`reified` なしでは `value is T` はコンパイルエラー — JVM は実行時に `T` が何か分からない。

### `reified T` で可能なこと

| 操作 | 構文 | 動作 |
|---|---|---|
| 型検査 | `value is T` | 具体型に対する `instanceof` |
| キャスト | `value as T` | 具体型へのキャスト |

これが全リスト。この2つの操作だけが `reified` 型パラメータで動作する。

::: warning `T::class` は未実装
reified 型パラメータから `Class` オブジェクトを取得する `T::class` 構文は計画されているが**まだ利用不可**。クラスオブジェクトが必要な場合は、明示的なパラメータとして渡す:

```valen
// T::class の代わりに、クラスを明示的に渡す:
fn <T> fromJson(json: String, cls: Class<T>) -> T {
    deserialize(json, cls) as T
}
```
:::

### 実践例: 型安全なフィルタリング

```valen
inline fn <reified T> filterByType(items: List<Any>) -> List<T> {
    let result = ArrayList<T>();
    for item in items {
        if item is T {
            safe { result.add(item as T) };
        }
    }
    result
}

let mixed: List<Any> = getItems();
let strings: List<String> = filterByType<String>(mixed);
```

### Reified と非 Reified の混在

一部の型パラメータを `reified` にし、他はそうしないことができる:

```valen
inline fn <reified T, U> checkAndMap(value: Any, f: fn(T) -> U) -> Option<U> {
    if value is T {
        Some(f(value as T))
    } else {
        None
    }
}

let result = checkAndMap<String, Int>("hello", |s| s.length());
// T = String（reified、`is` チェックで使用）
// U = Int（reified でない、その必要なし）
```

## 制約

いくつかの基本ルール:

- **`reified` は `inline fn` でのみ動作。** 通常の関数、クラスの型パラメータ、trait の型パラメータでは使えない。コンパイラは型を代入するために本体をインライン化する必要がある。

- **再帰不可。** `inline fn` が自身を呼ぶと無限に展開される。コンパイラがこれを検出してエラーを報告する。

- **非ローカルリターン不可。** `inline fn` に渡されたラムダ内から囲む関数を `return` することはできない。末尾式を代わりに使う。

- **再コンパイルの連鎖。** `inline fn` の本体を変更するとすべての呼び出し箇所の再コンパイルが必要。inline 関数は小さく保つ。

- **ラムダのアリティは最大2。** ラムダパラメータは最大2引数まで。

## Java 相互運用

Java から見ると、`inline fn` はただの通常のメソッド。Java から呼べるが、インライン化は行われない。メソッドとして通常通り実行される。

より重要なのは、**`reified` は Java から呼ばれると効果がない**こと。JVM の型消去が適用されるため、`value is T` は正しく動作しない:

```valen
// Valen 側
inline fn <reified T> isInstance(value: Any) -> Bool {
    value is T
}
```

```java
// Java 側 — 通常のメソッドとして呼ばれる
// reified は失われ、T は消去される。これに依存してはいけない。
ValenUtils.isInstance(someObj);
```

`reified` の動作が必要なら、Valen コードから関数を呼ぶこと。

::: tip `inline fn` を使うタイミング
1. 関数がラムダを受け取り、アロケーションオーバーヘッドをゼロにしたい
2. 実行時の型操作（`is` / `as`）に `reified T` が必要
3. 関数本体が小さい（大きい本体 = バイトコードの膨張）

どれにも当てはまらないなら、通常の `fn` の方がシンプルでコンパイルも速い。
:::

## 次のステップ

- [Unsafe](/ja/guide/unsafe) — Valen の安全保証を知った上でバイパスする
- [ジェネリクス](/ja/guide/generics) — 変性と境界を含むジェネリクスの全容
