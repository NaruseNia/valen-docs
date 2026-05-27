# 制御フロー

見出し: **Valenではすべてが式**。`if` は値を返す。`match` は値を返す。`loop` すら `break` を通じて値を返せる。これを内面化すれば、コードが目に見えてきれいになる。

## ブロックは値を返す

ブロック `{ ... }` は最後の式に評価される。`return` 不要 — セミコロンを付けなければいい。

```valen
let result = {
    let a = compute_a();
    let b = compute_b();
    a + b    // <- これがブロックの値
};
```

最後の行にセミコロンを付けると、ブロックは代わりに `Unit` を返す。セミコロンが「これが値だ」と「処理完了、次へ」の境目になる。

## if / else

`if` は文ではなく式。値を返すので、変数に直接バインドできる。

```valen
let abs_value = if x < 0 { -x } else { x };
```

もちろん、従来のようにも使える:

```valen
if needs_update {
    update_cache();
}
```

式として使う場合、両方のブランチは同じ型を返す必要がある。コンパイラはどちらのブランチが「おそらく正しい」か推測しない。

```valen
// エラー: ブランチが異なる型を返す（IntとString）
let oops = if flag { 42 } else { "nope" };
```

チェインも想定通り動く:

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

`if let` はパターンマッチと条件分岐を組み合わせる。フル `match` を書かずに単一パターンを分解したい場合に最適。

```valen
if let Option::Some(value) = get_option() {
    println(f"Got: {value}");
}
```

パターンがマッチしない場合の `else` ブランチも追加可能:

```valen
if let Option::Some(x) = maybe_value {
    use_value(x);
} else {
    println("No value found");
}
```

`if let` は `else if` や `else if let` とチェーン可能:

```valen
if let Option::Some(x) = a {
    use_x(x);
} else if let Option::Some(y) = b {
    use_y(y);
} else {
    fallback();
}
```

`Option` や `Result` 型で1つのバリアントだけ気にする場合に特に便利だ。

## let else

`let else` は `if let` の反対側。反駁可能パターンをバインドし、マッチしない場合は発散する（`return`、`break`、`continue`、または `panic`）。

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

`else` ブロックは**必ず発散しなければならない** — `return`、`break`、`continue`、または決して戻らない呼び出しで現在のスコープを抜ける必要がある。両方のケースを扱いたい場合は `if let` か `match` を使う。

## match

`match` はValenの至宝（の1つ）。網羅的で、表現力豊かで、値を返す。

### 基本的なマッチング

```valen
let description = match n {
    0 => "zero",
    1 => "one",
    _ => "many",
};
```

### 範囲パターン

`..`（終端を含まない）と `..=`（終端を含む）で値の範囲にマッチ:

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

パターンの後に `if` 条件を追加して、さらなるフィルタリングが可能。ガードはパターンがマッチした後に評価され、ガードが `false` なら次のアームが試される。

```valen
match value {
    Option::Some(x) if x > 0 => println("positive"),
    Option::Some(x) if x < 0 => println("negative"),
    Option::Some(_) => println("zero"),
    Option::None => println("nothing"),
}
```

ガードはパターンだけでは表現できない条件が必要な場合に特に有用:

```valen
match pair {
    (a, b) if a == b => println("equal"),
    (a, b) if a > b => println("first is larger"),
    _ => println("second is larger or equal"),
}
```

### バリアントの省略記法

文脈からenum型が推論できる場合、パターンで `.Variant` の省略記法が使える:

```valen
let color: Color = .Red;

match color {
    .Red => "red",
    .Green => "green",
    .Blue => "blue",
}
```

### 網羅性

コンパイラは `match` がすべてのケースをカバーしているかチェックする。バリアントを忘れるとコンパイルエラー — 実行時のサプライズではない。すべてのケースを個別に処理する必要がないなら `_` をキャッチオールとして使う。

パターンマッチの完全なガイドは [パターンマッチ](/ja/guide/pattern-matching) を参照。

## for..in

`for` は範囲およびJavaの `Iterable` を実装するものに対して反復する。

### 範囲

排他的範囲には `..`、包含的範囲には `..=` を使う:

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

Javaの `Iterable` も使える — `ArrayList`、`HashSet`、`LinkedList` など何でも:

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

古典的な条件付きループ。条件が `true` の間、ループ本体を実行する。

```valen
let mut attempts = 0;
while attempts < 3 {
    try_connect();
    attempts += 1;
}
```

`while` はブロック式だが、値は常に `Unit`。

## while let

`while let` は `while` とパターンマッチを組み合わせる。パターンがマッチする限りループが続く。

```valen
while let Option::Some(item) = iter.next() {
    process(item);
}
```

イテレータの消費や `Option`/`Result` の値を繰り返しチェックする場合に特に便利:

```valen
while let Result::Ok(line) = reader.readLine() {
    println(line);
}
```

## loop — 仕掛け付きの無限ループ

`loop` は永久に繰り返す — `break` するまで。面白いのは、`break` が値を運べるため、`loop` が式になること。

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

値を運ぶ `break` がない `loop` の型は `Nothing`（プレーンな `break;` の場合は `Unit`）。

## 範囲式

範囲はループだけのものではない — `Range<T>` 値を生成する独立した式。

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

範囲は `match` パターンでも使える:

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

最も内側のループを抜ける。`loop` では値を運べる:

```valen
break;           // ループを抜ける
break value;     // 値を返してループを抜ける（loop式）
```

### continue

現在のイテレーションの残りをスキップして次へ:

```valen
for i in 0..100 {
    if i % 2 == 0 { continue; }
    println(f"{i} is odd");
}
```

### return

現在の関数から早期に値を返して抜ける:

```valen
fn find_first_negative(nums: List<Int>) -> Option<Int> {
    for n in nums {
        if n < 0 { return Option::Some(n); }
    }
    Option::None
}
```

関数本体が単一の式（または最後の式）なら `return` は不要 — 値は自然に流れ出る:

```valen
fn double(x: Int) -> Int {
    x * 2     // returnなし、問題なし
}
```

::: warning ラベル付きbreakは未サポート
ネストしたループを抜けるためのラベル付きbreak（`'outer: for ... { break 'outer; }`）は現在サポートされていない。ヘルパー関数やフラグ変数で再構成する必要がある。
:::

::: tip 式指向の考え方
`if`、`match`、`loop` を文ではなく式として扱い始めると、中間変数や `let mut` を書く頻度が減ることに気づくだろう。それが設計意図だ。
:::

---

**次:** [文字列](/ja/guide/strings) — シンプルなもの。
