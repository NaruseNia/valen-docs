# 変数と型

すべてのプログラムはデータから始まる。Valenにはデータの扱い方について強い主張がある。深夜2時の自分を救ってくれる類の強い主張だ。

## バインディング: `let` と `let mut`

Valenの変数はデフォルトでイミュータブル。変更したい場合は、明示的に宣言する必要がある。

```valen
let name = "Valen";         // イミュータブル — 確定、完了、変更不可
let mut counter = 0;         // ミュータブル — 変更を許可
counter = counter + 1;       // OK
name = "something else";     // エラー: イミュータブルなバインディングに代入できない
```

Valenが意地悪をしているのではない。バグがどこから生まれるかについて正直なだけだ。

## 型推論と明示的な型注釈

Valenはほとんどの型を自分で推論できる。明示的に書きたいならどうぞ — コンパイラは文句を言わない。

```valen
let x = 42;                  // Intとして推論
let y: Int = 42;             // 明示的 — 同じこと、タイプが増えるだけ
let msg = f"count: {x}";    // Stringとして推論
```

**関数シグネチャは常に明示的。** 関数が何をすべきかの推測は、コンパイラの守備範囲外だ。

```valen
fn add(a: Int, b: Int) -> Int {
    a + b
}
```

コンパイラが型を推論できない場合（空のジェネリックコンテナなど）、手助けが必要:

```valen
let items: List<Int> = [];   // 空リストには型注釈が必要
```

## プリミティブ型

Valenは以下のプリミティブ名前型を提供する。内部的にはJVMプリミティブにマッピングされるが、言語仕様はそれを保証しない。

| 型       | 内容                                       | 例            |
|----------|--------------------------------------------|---------------|
| `Int`    | 32ビット整数                               | `42`          |
| `Long`   | 64ビット整数                               | `42L`         |
| `Float`  | 32ビット浮動小数点                         | `3.14f`       |
| `Double` | 64ビット浮動小数点                         | `3.14`        |
| `Bool`   | ブーリアン                                 | `true`        |
| `Char`   | 単一文字                                   | `'a'`         |
| `String` | テキスト（イミュータブル、`java.lang.String` にマッピング） | `"hello"` |
| `Byte`   | 8ビット整数                                | --            |
| `Short`  | 16ビット整数                               | --            |

## UnitとNothing

想像以上によく登場する2つの特殊な型:

- **`Unit`** — 「意味のある値を返さない」型。Javaの `void` に似ているが、ジェネリクスで使える実際の型。戻り値型を宣言しない関数は暗黙的に `Unit` を返す。リテラル値は `()`。
- **`Nothing`** — 「決して戻らない」型。`Nothing` を返す関数は永久にループするかpanicする。ボトム型であり、すべての型のサブタイプで、値を持たない。

```valen
fn greet(name: String) {
    // 戻り値型はUnit（省略）
    println(f"Hello, {name}!");
}

fn crash(msg: String) -> Nothing {
    panic(msg);  // 決して戻らない
}
```

## Char型

`Char` はシングルクォートを使った単一文字を表す。文字列と同じエスケープシーケンスをサポートする。

```valen
let letter = 'A';
let newline = '\n';
let tab = '\t';
let nul = '\0';
let escaped = '\'';     // シングルクォート
let backslash = '\\';
```

`Char` はJVMの `char` / `java.lang.Character` にマッピングされる。`Char` と数値型の間で変換可能:

```valen
let code = 'A' as Int;          // 65（安全なキャスト）
let ch = 'A';
let n = ch.toInt();              // 65
let l = ch.toLong();             // 65
```

## 数値リテラル

Valenは複数の数値リテラル形式をサポートする。`255` より `0xFF` の方がわかりやすい場面もあるから。

```valen
let decimal    = 42;
let hex        = 0xFF;           // 255
let binary     = 0b1010;         // 10
let octal      = 0o77;           // 63
let grouped    = 1_000_000;      // アンダースコアで読みやすく
let hex_group  = 0xFF_FF;        // どの基数でも使える
```

### 整数サフィックス

サフィックスなしの整数はデフォルトで `Int`。`Long` にするには `L` または `l` サフィックスを追加。サフィックスはすべての基数で使える。

| サフィックス | 結果の型 | 例         |
|-------------|----------|------------|
| （なし）    | `Int`    | `42`       |
| `L` / `l`  | `Long`   | `42L`, `42l` |

```valen
let a = 42;        // Int
let b = 42L;       // Long
let c = 42l;       // Long（小文字も可）
let d = 0xFFL;     // Long: 255
let e = 0o77L;     // Long: 63
let f = 0b1010l;   // Long: 10
```

### 浮動小数点リテラル

浮動小数点リテラルは小数点の両側に数字が必要（`.5` や `1.` は無効 — `0.5` と `1.0` と書くこと）。`e` / `E` による科学的記数法をサポート。アンダースコアで読みやすくできる。

| サフィックス | 結果の型 | 例                   |
|-------------|----------|----------------------|
| （なし）    | `Double` | `3.14`、`1.5e10`     |
| `f` / `F`  | `Float`  | `3.14f`、`2.5e3F`    |

```valen
let pi = 3.14;           // Double
let rate = 1_000.5;      // Double（アンダースコアOK）
let sci = 1.5e10;        // Double: 科学的記数法
let neg_exp = 2.0E-3;    // Double: 負の指数
let half = 0.5f;         // Float
let half2 = 0.5F;        // Float（大文字も可）
```

## 暗黙の数値変換はない

JavaやKotlinの開発者が二度見するポイント。**Valenは数値型間の暗黙の変換を一切行わない。**

```valen
let x: Long = 42;              // エラー: 型の不一致、Int != Long
let y: Long = 42.toLong();     // OK
let z: Double = 3.14f.toDouble(); // OK
let w: Float = 42.toFloat();   // OK
```

### 変換メソッド

各数値型には特定の変換メソッドセットがある。その型に存在しないメソッドを呼ぶとコンパイルエラー。

| 型       | 利用可能な変換メソッド                                      |
|----------|-------------------------------------------------------------|
| `Int`    | `.toLong()`、`.toFloat()`、`.toDouble()`                     |
| `Long`   | `.toInt()`、`.toFloat()`、`.toDouble()`                      |
| `Float`  | `.toInt()`、`.toLong()`、`.toDouble()`                       |
| `Double` | `.toInt()`、`.toLong()`、`.toFloat()`                        |
| `Byte`   | `.toInt()`、`.toLong()`、`.toFloat()`、`.toDouble()`、`.toShort()` |
| `Short`  | `.toInt()`、`.toLong()`、`.toFloat()`、`.toDouble()`、`.toByte()` |
| `Char`   | `.toInt()`、`.toLong()`、`.toFloat()`、`.toDouble()`         |

::: warning ほとんどの型に.toChar()や.toByte()/.toShort()はない
`.toChar()` はどの型にも存在しない。`.toByte()` は `Short` のみ、`.toShort()` は `Byte` のみ。上の表にないメソッドはコンパイルエラーになる。
:::

数値キャストには `as` も使える。数値間のキャスト（`Char` から数値を含む）はすべてsafeであり、`unsafe` ブロックは不要:

```valen
let x = 42 as Long;      // OK（safe）
let c = 'A' as Int;      // OK（safe）: 65
```

**なぜ暗黙の変換がないのか？** 暗黙の拡大変換はJava/Kotlinにおいて巧妙なバグの温床だ。これを排除することでオーバーロード解決も劇的にシンプルになる — コンパイラは正確な型の一致のみを考慮する。確かに数文字多く打つことになる。その代わり、数値の型の不一致はコンパイル時に必ず検出される。その価値はある。

## Nullable型（`T?`）と `Option<T>`

Valenには値の不在を表す**2つの別々のメカニズム**があり、**互換性はない**:

| 型 | 内容 | 使うべき場面 |
|------|-----------|----------------|
| `Option<T>` | Valenネイティブのadt: `enum { Some(T), None }` | Valenの慣用的なコード |
| `T?` | JVMのnullを許容するnullable型 | Java相互運用 |

**`T?` は `Option<T>` の糖衣構文ではない。** 型システム上、完全に異なる型だ。`Option<T>` は `match` や `if let` で分解する正当なenum。`T?` はJVMのボックス型にマッピングされるnullable型で、nullを返すJava APIとの連携のために存在する。

```valen
let opt: Option<Int> = Option::Some(42);   // Valenネイティブのadt
let nullable: Int? = 42;                    // Java相互運用のnullable型
```

`?`（try）演算子は `Option<T>` と `Result<T, E>` で使えるが、`T?`（nullable）では**使えない**。

::: tip 使い分けの目安
自分のValenコードでは `Option<T>` を使う。nullを返す可能性のあるJava APIから値を受け取るときは `T?` を使う。
:::

## `typealias` と `newtype`

### `typealias` — ただのニックネーム

`typealias` は既存の型に別名を作る。純粋に見た目だけ — コンパイラはエイリアスと元の型を同じ型として扱う。

```valen
typealias UserId = Int;
typealias Handler = fn(String) -> Unit;

let id: UserId = 42;
let x: Int = id;      // OK — UserIdはInt
```

ただのエイリアスなので、オーファンルールは `UserId` を `Int` として扱う。外部traitを実装することはできない。

### `newtype` — 新しい独自の型

`newtype` は既存の型を本当に新しい型としてラップする。コンパイラはそれを独自の型として扱う。

```valen
newtype EntityId = Int;
newtype ComponentName = String;

let eid = EntityId(42);         // TypeName(value)で構築
let raw: Int = eid.value();     // .value()でアンラップ

let x: Int = eid;               // エラー: EntityIdはIntではない
```

`newtype` は実際に所有する型を作るので、traitを実装できる:

```valen
impl Display for EntityId {
    fn display(self) -> String {
        f"Entity#{self.value()}"
    }
}
```

**使い分けの目安:** 可読性のためには `typealias`。同じ基底型を持つ2つのものを型システムで混同できないようにしたいなら `newtype`。

## 等価性: `==` と `===`

ValenはKotlinと同様に、構造的等価性と参照同一性を分離する。

| 演算子 | 意味               | 脱糖先              |
|--------|--------------------|---------------------|
| `==`   | 構造的等価性       | `.equals()`         |
| `!=`   | 構造的非等価性     | `!.equals()`        |
| `===`  | 参照同一性         | JVMの参照チェック   |
| `!==`  | 参照非同一性       | JVMの参照チェック   |

```valen
let a = "hello";
let b = "hello";
a == b     // true — 同じ内容
a === b    // trueかもしれないしfalseかもしれない — JVMの文字列インターニング次第
```

Java開発者向けに: Valenの `==` はJavaの `.equals()`。Valenの `===` はJavaの `==`。逆の慣例だ。慣れればコードが良くなる。

---

**次:** [関数](/ja/guide/functions) — これらの型を使って実際に何かを*する*方法。
