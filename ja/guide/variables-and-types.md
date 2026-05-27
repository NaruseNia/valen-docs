# 変数と型

すべてのプログラムはデータから始まります。Valenにはデータの扱い方について強い主張があります。深夜2時の自分を救ってくれる類の主張です。

## バインディング: `let` と `let mut`

Valenの変数はデフォルトでイミュータブルです。変更したい場合は、明示的に宣言する必要があります。

```valen
let name = "Valen";         // イミュータブル — 確定、完了、変更不可
let mut counter = 0;         // ミュータブル — 変更を許可
counter = counter + 1;       // OK
name = "something else";     // エラー: イミュータブルなバインディングに代入できない
```

Valenが意地悪をしてるわけじゃありません。バグの出どころに正直なだけです。

## 型推論と明示的な型注釈

Valenはほとんどの型を自分で推論できます。明示的に書きたいならどうぞ — コンパイラは文句を言いません。

```valen
let x = 42;                  // Intとして推論
let y: Int = 42;             // 明示的 — 同じこと、タイプが増えるだけ
let msg = f"count: {x}";    // Stringとして推論
```

**関数シグネチャは常に明示的です。** 関数が何をすべきかの推測は、コンパイラの守備範囲外。

```valen
fn add(a: Int, b: Int) -> Int {
    a + b
}
```

コンパイラが型を推論できない場合（空のジェネリックコンテナなど）は、ちょっと手助けが必要です:

```valen
let items: List<Int> = [];   // 空リストには型注釈が必要
```

## プリミティブ型

Valenは以下のプリミティブ名前型を提供しています。内部的にはJVMプリミティブにマッピングされますが、言語仕様はそれを保証しません。

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

想像以上によく登場する2つの特殊な型があります:

- `Unit` — 「意味のある値を返さない」ことを表す型です。Javaの `void` に似ていますが、ジェネリクスで使える実際の型になっています。戻り値型を宣言しない関数は暗黙的に `Unit` を返します。リテラル値は `()`。
- `Nothing` — 「決して戻らない」ことを表す型です。`Nothing` を返す関数は永久にループするかpanicします。ボトム型であり、すべての型のサブタイプで、値を持ちません。

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

`Char` はシングルクォートを使った単一文字を表します。文字列と同じエスケープシーケンスをサポートしています。

```valen
let letter = 'A';
let newline = '\n';
let tab = '\t';
let nul = '\0';
let escaped = '\'';     // シングルクォート
let backslash = '\\';
```

`Char` はJVMの `char` / `java.lang.Character` にマッピングされます。`Char` と数値型の間での変換も可能です:

```valen
let code = 'A' as Int;          // 65（安全なキャスト）
let ch = 'A';
let n = ch.toInt();              // 65
let l = ch.toLong();             // 65
```

## 数値リテラル

Valenは複数の数値リテラル形式をサポートしています。`255` より `0xFF` のほうがわかりやすい場面、ありますよね。

```valen
let decimal    = 42;
let hex        = 0xFF;           // 255
let binary     = 0b1010;         // 10
let octal      = 0o77;           // 63
let grouped    = 1_000_000;      // アンダースコアで読みやすく
let hex_group  = 0xFF_FF;        // どの基数でも使える
```

### 整数サフィックス

サフィックスなしの整数はデフォルトで `Int` になります。`Long` にするには `L` または `l` サフィックスを追加。サフィックスはすべての基数で使えます。

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

浮動小数点リテラルは小数点の両側に数字が必要です（`.5` や `1.` は無効 — `0.5` と `1.0` と書いてください）。`e` / `E` による科学的記数法をサポート。アンダースコアで読みやすくもできます。

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

JavaやKotlinの開発者が二度見するポイントです。**Valenは数値型間の暗黙の変換を一切行いません。**

```valen
let x: Long = 42;              // エラー: 型の不一致、Int != Long
let y: Long = 42.toLong();     // OK
let z: Double = 3.14f.toDouble(); // OK
let w: Float = 42.toFloat();   // OK
```

### 変換メソッド

各数値型には特定の変換メソッドセットがあります。その型に存在しないメソッドを呼ぶとコンパイルエラーになります。

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
`.toChar()` はどの型にも存在しません。`.toByte()` は `Short` のみ、`.toShort()` は `Byte` のみです。上の表にないメソッドはコンパイルエラーになります。
:::

数値キャストには `as` も使えます。数値間のキャスト（`Char` から数値を含む）はすべてsafeで、`unsafe` ブロックは不要です:

```valen
let x = 42 as Long;      // OK（safe）
let c = 'A' as Int;      // OK（safe）: 65
```

**暗黙の変換がないのはなぜか？** 暗黙の拡大変換はJava/Kotlinにおいて巧妙なバグの温床です。これを排除することでオーバーロード解決も劇的にシンプルになります — コンパイラは正確な型の一致のみを考慮します。確かに数文字多く打つことにはなります。でもその代わり、数値の型の不一致はコンパイル時に必ず検出されます。十分その価値はあります。

## Nullable型（`T?`）と `Option<T>`

Valenには値の不在を表す**2つの別々のメカニズム**があり、**互換性はありません**:

| 型 | 内容 | 使うべき場面 |
|------|-----------|----------------|
| `Option<T>` | Valenネイティブのadt: `enum { Some(T), None }` | Valenの慣用的なコード |
| `T?` | JVMのnullを許容するnullable型 | Java相互運用 |

**`T?` は `Option<T>` の糖衣構文ではありません。** 型システム上、完全に異なる型です。`Option<T>` は `match` や `if let` で分解する正当なenum。`T?` はJVMのボックス型にマッピングされるnullable型で、nullを返すJava APIとの連携のために存在します。

```valen
let opt: Option<Int> = Option::Some(42);   // Valenネイティブのadt
let nullable: Int? = 42;                    // Java相互運用のnullable型
```

`?`（try）演算子は `Option<T>` と `Result<T, E>` で使えますが、`T?`（nullable）では**使えません**。

::: tip 使い分けの目安
自分のValenコードでは `Option<T>` を使いましょう。nullを返す可能性のあるJava APIから値を受け取るときだけ `T?` を使います。
:::

## `typealias` と `newtype`

### `typealias` — ただのニックネーム

`typealias` は既存の型に別名を作ります。純粋に見た目だけのもので、コンパイラはエイリアスと元の型を同じ型として扱います。

```valen
typealias UserId = Int;
typealias Handler = fn(String) -> Unit;

let id: UserId = 42;
let x: Int = id;      // OK — UserIdはInt
```

ただのエイリアスなので、オーファンルールは `UserId` を `Int` として扱います。外部traitを実装することはできません。

### `newtype` — 新しい独自の型

`newtype` は既存の型を本当に新しい型としてラップします。コンパイラはそれを独自の型として扱います。

```valen
newtype EntityId = Int;
newtype ComponentName = String;

let eid = EntityId(42);         // TypeName(value)で構築
let raw: Int = eid.value();     // .value()でアンラップ

let x: Int = eid;               // エラー: EntityIdはIntではない
```

`newtype` は実際に所有する型を作るので、traitを実装できます:

```valen
impl Display for EntityId {
    fn display(self) -> String {
        f"Entity#{self.value()}"
    }
}
```

**使い分けの目安:** 可読性のためなら `typealias`。同じ基底型を持つ2つのものを型システムで混同できないようにしたいなら `newtype` を選びましょう。

## 等価性: `==` と `===`

ValenはKotlinと同様に、構造的等価性と参照同一性を分離しています。

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

Java開発者向けに補足すると、Valenの `==` はJavaの `.equals()` で、Valenの `===` はJavaの `==` です。逆の慣例ですね。慣れればコードが良くなります。

---

**次:** [関数](/ja/guide/functions) — これらの型を使って実際に何かを*する*方法。
