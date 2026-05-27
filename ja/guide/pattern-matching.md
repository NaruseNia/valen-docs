# パターンマッチング

パターンマッチングは「このデータ、どんな形をしてる？」に対する Valen の答えです。高機能な `switch` じゃありません — コンパイラが網羅性を検査する式で、ケースの処理忘れが起こりえないんです。enum や sealed class と組み合わせると、あり得ない状態を表現不可能にして、未処理の状態をコンパイル不可能にしてくれます。

## `match` 式

`match` は値を受け取って、一連のパターン（「アーム」と呼びます）と照合し、最初にマッチしたものを評価します。式なので値を返しますよ。

```valen
fn describe(s: Shape) -> String {
    match s {
        Shape::Circle(r) => f"A circle with radius {r}",
        Shape::Rect(w, h) => f"A {w}x{h} rectangle",
        Shape::Point => "A point",
    }
}
```

各アームは `パターン => 式` の形式。`=>` は省略できませんし、すべてのケースの処理も必須です（詳しくは後ほど）。

## パターンの種類

Valen は豊富なパターンをサポートしています。全部見ていきましょう。

### リテラルパターン

正確な値とマッチします。整数、文字列、真偽値、文字、浮動小数点数、long で使えます。

```valen
match status_code {
    200 => "OK",
    404 => "Not Found",
    500 => "Internal Server Error",
    _ => "Something else entirely",
}
```

### ワイルドカード `_`

アンダースコアは何にでもマッチして、何もバインドしません。「気にしない」パターンですね。

```valen
match value {
    42 => "the answer",
    _ => "not the answer",
}
```

### 変数バインディング

裸の識別子はマッチした値を変数にキャプチャします:

```valen
match some_int {
    0 => "zero",
    n => f"got {n}",  // n に値がバインドされる
}
```

### 分解

enum バリアント、data class、その他の構造型を分解できます:

```valen
match shape {
    Shape::Circle(r) => 3.14159 * r * r,
    Shape::Rect(w, h) => w * h,
    Shape::Point => 0.0,
}
```

変数 `r`、`w`、`h` はバリアントの対応するフィールドにバインドされます。不要なフィールドには `_` を使ってください:

```valen
match shape {
    Shape::Rect(w, _) => f"width is {w}",
    _ => "not a rect",
}
```

### バリアント省略記法パターン

match 対象の型からコンパイラがどの enum かわかる場合、完全な `EnumName::Variant` パスの代わりにドット省略記法が使えます:

```valen
match color {
    .Red => "red",
    .Green => "green",
    .Blue(v) => f"blue({v})",
}
```

これは `Color::Red`、`Color::Green` などと書くのと同じ。ちょっと短いだけです。ペイロードの分解でも:

```valen
match shape {
    .Circle(r) => f"circle r={r}",
    .Rect(w, h) => f"rect {w}x{h}",
    .Point => "point",
}
```

`..`（残余）パターンも省略記法で使えます:

```valen
match shape {
    .Circle(..) => "circle",
    _ => "other",
}
```

バリアント省略記法は `if let`、`while let`、`let else` でも使えますよ:

```valen
if let .Some(x) = opt {
    println(f"got {x}");
}
```

### Or パターン（`|`）

複数のパターンを1つのアームにまとめられます:

```valen
match day {
    "Saturday" | "Sunday" => "weekend",
    _ => "weekday",
}
```

or パターンが変数をバインドする場合、**すべての選択肢が同じ名前をバインドする必要があります**:

```valen
match expr {
    Expr::Lit(v) | Expr::Neg(v) => v,   // OK: 両方が `v` をバインド
    Expr::Add(a, b) => a + b,
}

// Expr::Lit(v) | Expr::Neg(w)  — ERROR: 名前の不一致 `v` vs `w`
```

::: info バインディングの整合性は未検証
コンパイラは現在、or パターンの選択肢が同じ変数名をバインドしているかの検証を行っていません。将来のリリースで追加予定です。今のところ一貫したバインディングを書くのは開発者の責任で、不整合な名前はコンパイルされますが未定義動作になります。ここは注意してください。
:::

### 範囲パターン

排他範囲には `..`、包含範囲には `..=` を使います:

```valen
match score {
    0..10 => "single digit",       // 0 <= score < 10
    10..=99 => "double digit",     // 10 <= score <= 99
    _ => "other",
}
```

::: warning 範囲パターンの制限
範囲パターンは整数リテラルのみサポートしています。終端値は `Int` リテラルである必要があり、`Long` リテラル、浮動小数点数、文字、文字列は範囲の端点には使えません。
:::

### Match ガード（`if`）

パターンの後にブール条件を追加してフィルタリングできます:

```valen
match user {
    User(name, age) if age >= 18 => f"{name} is an adult",
    User(name, _) => f"{name} is a minor",
}
```

ガード条件はパターンでバインドされた変数にアクセスできます。条件は `Bool` に評価される必要あり。

**ここは大事:** ガード付きアームはそれ単体では**網羅的とみなされません**。ガードは実行時に `false` になりうるので、コンパイラはすべてのケースをカバーしたとは数えてくれないんです:

```valen
// ERROR: 負の値がカバーされていない
match n {
    x if x >= 0 => "non-negative",
}

// OK: ワイルドカードが残りをキャッチ
match n {
    x if x >= 0 => "non-negative",
    _ => "negative",
}
```

ガードが or パターンに付く場合、or パターン全体に適用されます:

```valen
match n {
    2 | 4 | 6 if n < 10 => "small even",
    _ => "other",
}
```

### `@` バインディング

値全体を名前にバインドしつつ分解もする。値全体とその部分の両方が欲しい場合に使います:

```valen
match user {
    p @ User(name = "admin", ..) => admin_action(p),
    User(name, ..) => regular_action(name),
}
```

`..` は「残りのフィールドを無視」という意味です。`@` は `User` 全体を `p` にキャプチャしてくれます。

## 網羅性

ここが肝心です。コンパイラは match がすべてのケースをカバーすることを**要求します**。例外なし。「たぶん大丈夫」もなし。

```valen
// ERROR: Point が処理されていない
match shape {
    Shape::Circle(r) => f"circle {r}",
    Shape::Rect(w, h) => f"rect {w}x{h}",
    // Shape::Point — おっと、忘れてた
}
```

網羅性チェックが適用される対象:
- **Enum** — すべてのバリアントをカバーする必要あり
- **Sealed class** — すべてのサブタイプをカバーする必要あり
- **Sealed trait** — すべての実装者をカバーする必要あり
- **Boolean** — `true` と `false`（または `_`）

オープンな型（`Int` や `String` など）では、残りをキャッチする `_` ワイルドカードが必要です。

網羅性チェッカーは提案じゃなくて保証です。明日 enum に新しいバリアントを追加したら、その enum に対するすべての `match` は新しいケースを処理するまでコンパイルに失敗します。これはバグじゃなくて機能ですよ。

## `if let`

1つのパターンだけ必要な場合、`match` はちょっと大袈裟。`if let` は単一アームのショートカットです:

```valen
// こう書く代わりに:
match get_user(id) {
    Option::Some(user) => println(f"Found {user.name}"),
    Option::None => {},
}

// こう書く:
if let Some(user) = get_user(id) {
    println(f"Found {user.name}");
}
```

`else` と `else if let` のチェーンもサポートしています:

```valen
if let Some(pos) = get_component(entity, "Position") {
    println(f"pos: ({pos.x}, {pos.y})");
} else if let Some(vel) = get_component(entity, "Velocity") {
    println(f"velocity only");
} else {
    println("no components found");
}
```

## `while let`

パターンがマッチする間ループします:

```valen
while let Some(item) = iter.next() {
    process(item);
}
```

`iter.next()` が `None` を返した瞬間にループ終了。手動の `break` もブールフラグも要りません。

## `let`-`else`

「早期リターン」パターンを形式化したもの。反証可能なパターンをバインドするか、そうでなければ脱出します:

```valen
fn get_health(world: World, entity: Entity) -> Int {
    let Some(health) = world.get_component(entity, "Health") else {
        return 0;
    };
    health
}
```

`else` ブロックは**発散しないといけません** — `return`、`break`、`continue`、または `panic` が必要です。コンパイラがこれを強制します。デフォルト値をそこに置くことはできません。

```valen
// ERROR: else ブロックが発散していない
let Some(v) = opt else { 42 };

// OK: else ブロックが return する
let Some(v) = opt else { return default_value; };

// OK: else ブロックが panic する
let Ok(data) = readFile(path) else { panic("read failed"); };
```

これで深くネストした match チェーンがフラットなコードになります:

```valen
// let-else なし（ネストが急速に深くなる）:
fn process(result: Result<Data, Error>) -> String {
    match result {
        Result::Ok(data) => {
            match data.parse() {
                Result::Ok(parsed) => parsed.to_string(),
                Result::Err(_) => return "parse error",
            }
        }
        Result::Err(e) => return f"error: {e}",
    }
}

// let-else あり（フラットで読みやすい）:
fn process(result: Result<Data, Error>) -> String {
    let Ok(data) = result else { return "error"; };
    let Ok(parsed) = data.parse() else { return "parse error"; };
    parsed.to_string()
}
```

## クイックリファレンス

| パターン | 例 | バインド |
|---------|---------|-------|
| リテラル | `42`, `"hello"`, `true` | なし |
| ワイルドカード | `_` | なし |
| 変数 | `x` | `x` = マッチした値 |
| 分解 | `Shape::Circle(r)` | `r` = フィールドの値 |
| 省略記法 | `.Circle(r)`, `.None` | 完全パスと同じ |
| Or | `1 \| 2 \| 3` | 選択肢間で同じ名前 |
| 範囲 | `0..=100`, `0..10` | なし |
| ガード | `x if x > 0` | `x` = マッチした値 |
| @ バインディング | `p @ Point(x, y)` | `p` = 値全体, `x`, `y` = フィールド |

## 次のステップ

- [Enum](/ja/guide/enums) — パターンが分解するデータを定義する
- [クラス](/ja/guide/classes) — sealed class も網羅的 match で使える
