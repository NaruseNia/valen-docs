# Inline と Reified

JVM は実行時にジェネリック型パラメータを消去します。99% の場合これで問題ないんですが、`value is T` が必要になって JVM が「知らんけど」と肩をすくめる瞬間が来ます。Valen の `inline fn` と `reified` 型パラメータは、関数本体を呼び出し箇所にインライン化して、必要な場面で具体的な型情報を保持することで解決してくれます。

## `inline fn` — 呼び出し箇所でのインライン化

`inline fn` は（概念的に）本体がすべての呼び出し箇所にコピペされます。一番のメリット: **ラムダ引数もインライン化されて**、`Function` オブジェクトへのボクシングオーバーヘッドがなくなること。

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

Kotlin の `inline fun` と同じ考え方ですね。ラムダを受け取るユーティリティを書いていてパフォーマンスが気になるなら、`inline fn` がそのツールです。

### ラムダのインライン化

`inline fn` にラムダを渡すと、ラムダの本体が周囲のコードに直接展開されます。匿名クラスなし、`invoke()` 呼び出しなし、アロケーションなし:

```valen
inline fn <T> run(block: fn() -> T) -> T {
    block()
}

fn main() {
    let x = run(|| { 42 });
    // インライン化後、実質こうなる: let x = 42;
}
```

::: info ラムダのアリティ制限
inline 関数は現在、最大2引数のラムダパラメータをサポートしています（例: `fn(A, B) -> C`）。3引数以上のラムダはまだサポートされていません。
:::

## `reified T` — 消去を生き延びる型

通常、`T` は実行時に消去されます。`inline fn` 内で `reified` を付けると、コンパイラが各呼び出し箇所で具体的な型を代入してくれます:

```valen
inline fn <reified T> isInstance(value: Any) -> Bool {
    value is T
}

let a = isInstance<String>("hello");  // true — instanceof String を検査
let b = isInstance<Int>("hello");     // false — instanceof Integer を検査
```

`reified` なしだと `value is T` はコンパイルエラーになります — JVM は実行時に `T` が何か知らないので。

### `reified T` でできること

| 操作 | 構文 | 動作 |
|---|---|---|
| 型検査 | `value is T` | 具体型に対する `instanceof` |
| キャスト | `value as T` | 具体型へのキャスト |

これが全リストです。この2つの操作だけが `reified` 型パラメータで動作します。

::: warning `T::class` は未実装
reified 型パラメータから `Class` オブジェクトを取得する `T::class` 構文は計画中ですが**まだ使えません**。クラスオブジェクトが必要な場合は、明示的なパラメータとして渡してください:

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

一部の型パラメータだけ `reified` にして、残りはそうしないこともできます:

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

いくつか基本ルールがあります:

- **`reified` は `inline fn` でのみ動作。** 通常の関数、クラスの型パラメータ、trait の型パラメータでは使えません。コンパイラは型を代入するために本体をインライン化する必要があるんです。

- **再帰はダメ。** `inline fn` が自身を呼ぶと無限に展開されてしまいます。コンパイラがこれを検出してエラーを出してくれます。

- **非ローカルリターンは不可。** `inline fn` に渡されたラムダ内から囲む関数を `return` することはできません。末尾式を使ってください。

- **再コンパイルの連鎖。** `inline fn` の本体を変更するとすべての呼び出し箇所の再コンパイルが必要になります。inline 関数は小さく保ちましょう。

- **ラムダのアリティは最大2。** ラムダパラメータは最大2引数まで。

## Java 相互運用

Java から見ると、`inline fn` はただの通常のメソッドです。Java から呼べますがインライン化はされず、普通のメソッドとして実行されます。

もっと重要なのは、**`reified` は Java から呼ばれると効果がない**ということ。JVM の型消去が適用されるので、`value is T` は正しく動作しません:

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

`reified` の動作が必要なら、Valen コードから関数を呼んでください。

::: tip `inline fn` を使うタイミング
1. 関数がラムダを受け取り、アロケーションオーバーヘッドをゼロにしたい
2. 実行時の型操作（`is` / `as`）に `reified T` が必要
3. 関数本体が小さい（大きい本体 = バイトコードの膨張）

どれにも当てはまらなければ、普通の `fn` のほうがシンプルでコンパイルも速いですよ。
:::

## 次のステップ

- [Unsafe](/ja/guide/unsafe) — Valen の安全保証を知った上でバイパスする
- [ジェネリクス](/ja/guide/generics) — 変性と境界を含むジェネリクスの全容
