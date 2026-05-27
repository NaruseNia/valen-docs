# 制御フロー

ひとつ大事なこと: **Valenではすべてが式です**。`if` は値を返します。`match` も値を返します。`loop` ですら `break` を通じて値を返せます。これを内面化すると、コードが目に見えてきれいになっていきますよ。

## ブロックは値を返す

ブロック `{ ... }` は最後の式に評価されます。`return` は不要 — セミコロンを付けなければいいだけです。

```valen
let result = {
    let a = compute_a();
    let b = compute_b();
    a + b    // <- これがブロックの値
};
```

最後の行にセミコロンを付けると、ブロックは代わりに `Unit` を返します。セミコロンが「これが値だ」と「処理完了、次へ」の境目になる、と覚えておいてください。

## if / else

`if` は文ではなく式です。値を返すので、変数に直接バインドできます。

```valen
let abs_value = if x < 0 { -x } else { x };
```

もちろん、従来のようにも使えます:

```valen
if needs_update {
    update_cache();
}
```

式として使う場合、両方のブランチは同じ型を返す必要があります。コンパイラはどちらのブランチが「おそらく正しい」か推測してくれません。

```valen
// エラー: ブランチが異なる型を返す（IntとString）
let oops = if flag { 42 } else { "nope" };
```

チェインも想定通り動きます:

```valen
let label = if score > 90 {
    "excellent"
} else if score > 70 {
    "good"
} else if score > 50 {
    "okay"
} else {
    "needs work"
};
```

## if let

`if let` はパターンマッチと条件分岐を組み合わせたものです。フル `match` を書かずに単一パターンを分解したいときに最適。

```valen
if let Option::Some(value) = get_option() {
    println(f"Got: {value}");
}
```

パターンがマッチしない場合の `else` ブランチも追加できます:

```valen
if let Option::Some(x) = maybe_value {
    use_value(x);
} else {
    println("No value found");
}
```

`if let` は `else if` や `else if let` とチェーン可能です:

```valen
if let Option::Some(x) = a {
    use_x(x);
} else if let Option::Some(y) = b {
    use_y(y);
} else {
    fallback();
}
```

`Option` や `Result` 型で1つのバリアントだけ気にするときに特に便利です。

## let else

`let else` は `if let` の反対側にあたります。反駁可能パターンをバインドし、マッチしない場合は発散します（`return`、`break`、`continue`、または `panic`）。

```valen
let Option::Some(value) = get_option() else {
    return;
};
// valueはここで利用可能 — Someであることが保証される

let Result::Ok(data) = parse(input) else {
    println("parse failed");
    return;
};
// dataはここで利用可能 — Okであることが保証される
```

`else` ブロックは**必ず発散しなければなりません** — `return`、`break`、`continue`、または決して戻らない呼び出しで現在のスコープを抜ける必要があります。両方のケースを扱いたい場合は `if let` か `match` を使ってください。

## match

`match` はValenの至宝（のひとつ）です。網羅的で、表現力豊かで、値を返します。

### 基本的なマッチング

```valen
let description = match n {
    0 => "zero",
    1 => "one",
    _ => "many",
};
```

### 範囲パターン

`..`（終端を含まない）と `..=`（終端を含む）で値の範囲にマッチします:

```valen
let description = match n {
    0 => "zero",
    1..=9 => "small",
    10..=99 => "medium",
    _ => "large",
};
```

### enumの分解

```valen
match shape {
    Shape::Circle(r: radius) => 3.14159 * radius * radius,
    Shape::Rect(w: width, h: height) => width * height,
    Shape::Point => 0.0,
}
```

### matchガード

パターンの後に `if` 条件を追加して、さらなるフィルタリングができます。ガードはパターンがマッチした後に評価され、ガードが `false` なら次のアームが試されます。

```valen
match value {
    Option::Some(x) if x > 0 => println("positive"),
    Option::Some(x) if x < 0 => println("negative"),
    Option::Some(_) => println("zero"),
    Option::None => println("nothing"),
}
```

ガードはパターンだけでは表現できない条件が必要なときに特に役立ちます:

```valen
match pair {
    (a, b) if a == b => println("equal"),
    (a, b) if a > b => println("first is larger"),
    _ => println("second is larger or equal"),
}
```

### バリアントの省略記法

文脈からenum型が推論できる場合、パターンで `.Variant` の省略記法が使えます:

```valen
let color: Color = .Red;

match color {
    .Red => "red",
    .Green => "green",
    .Blue => "blue",
}
```

### 網羅性

コンパイラは `match` がすべてのケースをカバーしているかチェックします。バリアントを忘れるとコンパイルエラー — 実行時のサプライズじゃありません。すべてのケースを個別に処理する必要がないなら `_` をキャッチオールとして使いましょう。

パターンマッチの完全なガイドは [パターンマッチ](/ja/guide/pattern-matching) を参照してください。

## for..in

`for` は範囲およびJavaの `Iterable` を実装するものに対して反復します。

### 範囲

排他的範囲には `..`、包含的範囲には `..=` を使います:

```valen
for i in 0..10 {
    println(f"{i}");    // 0から9
}

for i in 0..=9 {
    println(f"{i}");    // 0から9（同じ結果、終端を含む）
}
```

### コレクション

```valen
let names = ["Alice", "Bob", "Charlie"];
for name in names {
    println(f"Hello, {name}!");
}
```

Javaの `Iterable` も使えます — `ArrayList`、`HashSet`、`LinkedList` など何でも:

```valen
import java.util.ArrayList;

let list = ArrayList();
list.add("hello");
list.add("world");

for item in list {
    println(item);
}
```

## while

古典的な条件付きループです。条件が `true` の間、ループ本体を実行します。

```valen
let mut attempts = 0;
while attempts < 3 {
    try_connect();
    attempts += 1;
}
```

`while` はブロック式ですが、値は常に `Unit` です。

## while let

`while let` は `while` とパターンマッチを組み合わせたものです。パターンがマッチする限りループが続きます。

```valen
while let Option::Some(item) = iter.next() {
    process(item);
}
```

イテレータの消費や `Option`/`Result` の値を繰り返しチェックする場合にとても便利です:

```valen
while let Result::Ok(line) = reader.readLine() {
    println(line);
}
```

## loop — 仕掛け付きの無限ループ

`loop` は永久に繰り返します — `break` するまで。面白いのは、`break` が値を運べるため `loop` が式になるところです。

```valen
let answer = loop {
    let input = read_input();
    if input > 0 {
        break input;     // loopの評価値がinputになる
    }
    println("Try a positive number.");
};
```

反復回数が事前にわからないリトライロジックやインタラクティブプロンプトに特に便利。

値を運ぶ `break` がない `loop` の型は `Nothing`（プレーンな `break;` の場合は `Unit`）です。

## 範囲式

範囲はループだけのものではありません — `Range<T>` 値を生成する独立した式です。

| 構文 | 意味 | 例 |
|--------|---------|---------|
| `a..b` | 半開範囲（aを含む、bを含まない） | `0..10` |
| `a..=b` | 閉区間（両端を含む） | `0..=9` |

```valen
let range = 1..100;          // Range<Int>、終端を含まない
let inclusive = 1..=99;       // Range<Int>、終端を含む

for i in 1..=5 {
    println(f"{i}");          // 1, 2, 3, 4, 5
}
```

範囲は `match` パターンでも使えます:

```valen
match score {
    90..=100 => "A",
    80..=89 => "B",
    70..=79 => "C",
    _ => "below C",
}
```

## break、continue、return

### break

最も内側のループを抜けます。`loop` では値を運べます:

```valen
break;           // ループを抜ける
break value;     // 値を返してループを抜ける（loop式）
```

### continue

現在のイテレーションの残りをスキップして次へ進みます:

```valen
for i in 0..100 {
    if i % 2 == 0 { continue; }
    println(f"{i} is odd");
}
```

### return

現在の関数から早期に値を返して抜けます:

```valen
fn find_first_negative(nums: List<Int>) -> Option<Int> {
    for n in nums {
        if n < 0 { return Option::Some(n); }
    }
    Option::None
}
```

関数本体が単一の式（または最後の式）なら `return` は不要です — 値は自然に流れ出ます:

```valen
fn double(x: Int) -> Int {
    x * 2     // returnなし、問題なし
}
```

::: warning ラベル付きbreakは未サポート
ネストしたループを抜けるためのラベル付きbreak（`'outer: for ... { break 'outer; }`）は現在サポートされていません。ヘルパー関数やフラグ変数で再構成してください。
:::

::: tip 式指向の考え方
`if`、`match`、`loop` を文ではなく式として扱い始めると、中間変数や `let mut` を書く頻度が減ることに気づくはずです。それが設計意図です。
:::

---

**次:** [文字列](/ja/guide/strings) — シンプルなやつです。
