# 式

Valen は式指向の言語。すべてのブロック、`if`、`match`、`loop` は値を生成する。

## リテラル

| リテラル         | 型       | 例                         |
|------------------|----------|----------------------------|
| 整数             | `Int`    | `42`, `0xFF`, `0b1010`     |
| Long 整数        | `Long`   | `42L`                      |
| 浮動小数点       | `Float`  | `3.14f`                    |
| 倍精度浮動小数点 | `Double` | `3.14`                     |
| 文字             | `Char`   | `'a'`, `'\n'`              |
| 文字列           | `String` | `"hello"`                  |
| F 文字列         | `String` | `f"count: {x}"`           |
| 真偽値           | `Bool`   | `true`, `false`            |
| Unit             | `Unit`   | `()`                       |

### F 文字列

`f"..."` は `{expr}` で式を埋め込む。リテラルの波括弧は `\{` と `\}` でエスケープする。

```valen
let msg = f"Hello, {name}! Result: {1 + 2}";
```

`{...}` 内でのネストされたブロック式やネストされた F 文字列は許可されていない。

## ブロック式

ブロック `{ stmts; tail_expr }` は最後の式（末尾の `;` なし）に評価される。

```valen
let result = {
    let a = compute_a();
    let b = compute_b();
    a + b   // ブロックの値
};
```

### セミコロン省略

ブロック型の式（`if`、`if let`、`match`、`for`、`while`、`while let`、`loop`、`safe`）は文の位置で末尾の `;` を必要としない。パーサーが自動的に `ExprSemi` として扱う。

```valen
fn example() {
    if x > 0 {
        do_something();
    }                // ; 不要

    match n {
        0 => a(),
        _ => b(),
    }                // ; 不要

    for i in 0..10 {
        process(i);
    }                // ; 不要

    let y = x + 1;  // 通常の文には ; が必要
}
```

## if / else

`if` は式。値として使う場合、両方のブランチの型が一致する必要がある。

```valen
let abs = if x < 0 { -x } else { x };
```

## if let / while let

`if let` と `while let` はパターンマッチと条件分岐を組み合わせる。ブロック式であり、末尾のセミコロンは不要。

```valen
if let Some(value) = opt {
    println(f"found: {value}");
}

if let Some(x) = a {
    use_x(x);
} else {
    fallback();
}

while let Some(item) = iter.next() {
    process(item);
}
```

`if let` は `else if` チェーンをサポート:

```valen
if let Some(x) = a {
    use_x(x);
} else if let Some(y) = b {
    use_y(y);
} else {
    fallback();
}
```

## let else

`let Pattern = expr else { diverge };` は反駁可能なパターンをバインドする。パターンがマッチしない場合、`else` ブロックが実行される。`else` ブロックは**発散する必要がある**（`return`、`break`、`continue`、または `panic`）。

```valen
let Some(value) = get_option() else {
    return;
};
// value はここで利用可能

let Ok(data) = parse(input) else {
    println("parse failed");
    return;
};
```

## match

`match` は式。各アームは `=>` を使い、`,` で区切る。パターン構文は[パターン](/ja/reference/patterns)を参照。

```valen
let label = match n {
    0 => "zero",
    1..=9 => "small",
    _ => "large",
};
```

### match ガード

アームにはパターンの後に `if condition` ガードを付けることができる。ガードはパターンマッチ後に評価され、条件が `false` の場合は次のアームに進む。

```valen
match value {
    Some(x) if x > 0 => println("positive"),
    Some(x) if x < 0 => println("negative"),
    Some(_) => println("zero"),
    None => println("nothing"),
}
```

## ループ

| 形式             | 値の型                            |
|------------------|-----------------------------------|
| `for item in iterable { ... }` | `Unit`                |
| `while condition { ... }`      | `Unit`                |
| `loop { ... }`                 | `break expr` の型     |

### for in

```valen
for i in 0..10 {
    println(f"{i}");
}
```

`Range` または任意の Java `Iterable` をイテレートする。Java コレクションの要素型は `Any` (`java.lang.Object`)。

```valen
import java.util.ArrayList;
let list = ArrayList();
list.add("hello");
list.add("world");
for item in list {
    println(item);
}
```

### while

`while` は条件が `true` の間ループする。ループの値は常に `Unit`。

```valen
let mut count = 0;
while count < 10 {
    println(f"{count}");
    count += 1;
}
```

### loop

`loop` は `break` するまで無限にループする。`break expr` で値を生成できる。

```valen
let n = loop {
    let input = read();
    if input > 0 { break input; }
};
```

## break, continue, return

| 文               | 効果                                       |
|------------------|--------------------------------------------|
| `break;`         | 最も内側のループを抜ける                   |
| `break expr;`    | 値を伴って最も内側のループを抜ける（`loop` のみ） |
| `continue;`      | 次のイテレーションにスキップ               |
| `return expr;`   | 外側の関数から早期リターン                 |

ラベル付き break（`'label: for ... { break 'label; }`）はサポートされていない。

## 演算子の優先順位

完全な優先順位表。最低 (1) から最高 (15)。同レベルの演算子は特記がない限り左結合。

| レベル | 演算子 | 結合性 | 説明 |
|-------|-----------|---------|------|
| 1 | `=` `+=` `-=` `*=` `/=` `%=` | 右 | 代入、複合代入 |
| 2 | `\|>` | 左 | パイプライン |
| 3 | `\|\|` | 左 | 論理 OR |
| 4 | `&&` | 左 | 論理 AND |
| 5 | `\|` | 左 | ビット OR |
| 6 | `^` | 左 | ビット XOR |
| 7 | `&` | 左 | ビット AND |
| 8 | `==` `!=` `===` `!==` | 左 | 等値、参照等値 |
| 9 | `<` `<=` `>` `>=` | 左 | 比較 |
| 10 | `..` `..=` | なし | 範囲（非結合） |
| 11 | `<<` `>>` | 左 | ビットシフト |
| 12 | `+` `-` | 左 | 加算、減算 |
| 13 | `*` `/` `%` | 左 | 乗算、除算、剰余 |
| 14 | `-` `!` `*` | — | 単項前置（否定、NOT、参照外し） |
| 15 | `.field` `.method()` `()` `?` `as Type` | 左 | 後置（フィールド、メソッド、呼び出し、try、キャスト） |

## 代入

### 単純代入

`target = value` は変数またはフィールドに代入する。代入は式だが値は `Unit`。

```valen
let mut x = 0;
x = 42;
obj.field = value;
```

### 複合代入

`+=` `-=` `*=` `/=` `%=` は二項演算と代入を組み合わせる。

```valen
let mut n = 10;
n += 5;   // n = n + 5
n -= 3;   // n = n - 3
n *= 2;   // n = n * 2
n /= 4;   // n = n / 4
n %= 3;   // n = n % 3
```

## 算術演算子

標準的な算術: `+` `-` `*` `/` `%`。

```valen
let sum = a + b;
let remainder = x % 3;
```

## 比較演算子

構造的比較のための `<` `<=` `>` `>=` `==` `!=`。

```valen
let is_positive = x > 0;
let equal = a == b;
```

## ビット演算子

整数のビット演算。

| 演算子 | 説明 |
|----------|------|
| `&` | ビット AND |
| `\|` | ビット OR |
| `^` | ビット XOR |
| `<<` | 左シフト |
| `>>` | 右シフト |

```valen
let flags = 0b1010 & 0b1100;   // 0b1000
let combined = a | b;
let flipped = x ^ 0xFF;
let shifted = n << 2;
```

## 参照等値

`===` と `!==` はオブジェクトの**同一性**（2つの参照が同じ JVM オブジェクトを指しているか）を比較する。

```valen
let a = create_obj();
let b = a;
let c = create_obj();

a === b;  // true — 同じオブジェクト
a === c;  // false — 異なるオブジェクト
a !== c;  // true
```

`==` / `!=` は**構造的等値**（`.equals()`）をテスト、`===` / `!==` は**参照同一性**をテストする。

## 論理演算子

`&&`（論理 AND）と `||`（論理 OR）は短絡評価される。

```valen
if x > 0 && y > 0 {
    // 両方とも正
}
if a || b {
    // 少なくとも一方が true
}
```

`!` は単項論理 NOT。

```valen
if !is_valid {
    return;
}
```

## 範囲式

`start..end`（排他的）と `start..=end`（包含的）は範囲値を作成する。`for` ループ内だけでなく、単独で使用可能。

```valen
// for ループ内
for i in 0..10 {
    println(f"{i}");
}

// 包含範囲
for i in 0..=9 {
    println(f"{i}");  // 0..10 と同じ結果
}

// 単独の式として
let range = 1..100;
let inclusive_range = 1..=99;
```

範囲演算子は非結合（優先順位レベル 10）。

## 単項演算子

| 演算子   | 意味             | Trait     |
|----------|------------------|-----------|
| `-expr`  | 数値否定         | `Neg`     |
| `!expr`  | 論理 NOT         | `Not`     |
| `*expr`  | 参照外し (`ref mut T`) | 組み込み |

## 型キャスト: `as`

```valen
let x: Long = 42 as Long;                       // 安全な拡張
let pos: Position = unsafe { obj as Position };  // unsafe ダウンキャスト
```

- 数値の拡張変換（`Int` → `Long` など）は安全。
- `Char` → 数値は安全。
- ダウンキャストには `unsafe` が必要。

`as` はフィールドアクセスやメソッド呼び出しと同じ優先順位レベル (15) の後置演算子。

## パイプライン: `|>`

パイプラインは**代入以外の演算子の中で最も低い優先順位**（レベル 2）。左辺を右辺の呼び出しの第一引数として挿入する。

```valen
// x |> f(a, b)  は  f(x, a, b) にデシュガー
"hello" |> println;
data |> process(config) |> format(style);
```

右辺は関数呼び出しまたは関数名でなければならない。パイプラインは左結合でチェーン可能。

## `?` Try 演算子

`expr?` は `Result` のエラーまたは `Option` の不在を伝播する。式が `Err` / `None` の場合、外側の関数が早期リターンする。

```valen
fn read_config(path: String) -> Result<Config, Error> {
    let content = read_file(path)?;   // Err で早期リターン
    let config = parse(content)?;
    Ok(config)
}
```

`?` は優先順位レベル 15（フィールドアクセスやメソッド呼び出しと同じ）の後置演算子。

::: warning
`?` は `Option<T>` と `Result<T, E>` にのみ対応。`T?` (Nullable) には**使用不可**。
:::

## バリアント省略記法

`.Variant` と `.Variant(args)` は、コンテキストから enum 型を推論できる場合の enum バリアント参照の省略記法。式とパターンの両方で使用可能。

### 式として

```valen
// 完全形
let color: Color = Color::Red;
let opt: Option<Int> = Option::Some(42);

// 省略記法 — 型が推論可能な場合
let color: Color = .Red;
let opt: Option<Int> = .Some(42);
```

### パターンとして

```valen
match color {
    .Red => "red",
    .Green => "green",
    .Blue => "blue",
}

if let .Some(value) = opt {
    println(f"{value}");
}
```

バリアント名は大文字で始まる必要がある。省略記法パターンではフィールドの分解と `..`（残余）パターンもサポートされる。

## コレクションリテラル

| 構文                    | 型                     | JVM クラス          |
|-------------------------|------------------------|--------------------|
| `[1, 2, 3]`            | `List<Int>`            | `java.util.ArrayList` |
| `#{"k": v, ...}`       | `Map<String, V>`       | `java.util.HashMap`   |

空のコレクションには型注釈が必要:

```valen
let empty: List<String> = [];
let map: Map<String, Int> = #{};
```

## ラムダ

```valen
let inc = |x: Int| x + 1;
let add = |a: Int, b: Int| a + b;
let greet = || { println("hello"); };
```

パラメータ型はコンテキストから推論可能。本体は単一の式またはブロック。

### 戻り型注釈

```valen
let parse = |s: String| -> Int {
    s.toInt()
};
```

### パラメータ数の制限

ラムダのパラメータは 2 つまでに制限され、`java.util.function` インターフェースにマッピングされる:

| パラメータ数 | JVM 関数インターフェース |
|------------|--------------------------|
| 0 | `java.util.function.Supplier<R>` |
| 1 | `java.util.function.Function<T, R>` |
| 2 | `java.util.function.BiFunction<T, U, R>` |

3 つ以上のパラメータを持つラムダはコンパイルエラー。

## 参照外し式

`*expr` は `ref mut T` 参照から読み取る。`*expr = value` は参照先に書き込む。

```valen
let r = ref mut n;
let v = *r;       // 読み取り
*r = v + 1;       // 書き込み
```

`*` は優先順位レベル 14 の単項前置演算子。

## `ref mut` 式

`ref mut expr` は可変参照を作成する。結果の型は `ref mut T`。

```valen
let mut n = 10;
let r = ref mut n;  // r: ref mut Int
```

## safe / unsafe

### `safe` ブロック

`safe { expr }` は Java 例外をキャッチし、結果を `Result<T, JavaException>` としてラップする。

```valen
let result = safe {
    file.readLine()
};
// result: Result<String, JavaException>
```

### `safe` 省略記法

`safe expr` — ブロック `{}` を省略可能。

```valen
let result = safe file.readLine();
```

### `safe?` 省略記法

`safe? expr` は `safe { expr }?` と等価 — Java 例外をキャッチし、即座に `?` で伝播する。

```valen
fn read_first_line(path: String) -> Result<String, JavaException> {
    let line = safe? File(path).readLine();
    Ok(line)
}
```

### `unsafe` ブロック

`unsafe { expr }` は安全性の保証をバイパスする。省略記法 `unsafe expr` も利用可能。

```valen
let pos: Position = unsafe { obj as Position };
let pos: Position = unsafe obj as Position;  // 省略記法
```

`unsafe fn` の呼び出しには `unsafe` ブロックが必要:

```valen
unsafe fn dangerous() -> Int { /* ... */ }

let x = unsafe { dangerous() };
```
