# パターン

## パターンの種類

| パターン                 | 構文                            | 例                                         |
|--------------------------|---------------------------------|--------------------------------------------|
| ワイルドカード           | `_`                             | `_ => "default"`                           |
| リテラル                 | `value`                         | `0 => "zero"`                              |
| バインディング           | `name`                          | `n => use(n)`                              |
| パス（バリアント）       | `Enum::Variant`                 | `Shape::Circle(r) => ...`                  |
| バリアント省略記法       | `.Variant`                      | `.Circle(r) => ...`                        |
| 構造体分解               | `Type(field1, field2)`          | `User(name, age) => ...`                   |
| 残余付き構造体           | `Type(field, ..)`               | `User(name = "admin", ..) => ...`          |
| Or パターン              | `p1 \| p2`                     | `1 \| 2 \| 3 => "small"`                  |
| 範囲                     | `start..=end`                   | `1..=9 => "digit"`                         |
| ガード                   | `pattern if cond`               | `n if n < 0 => "negative"`                 |
| @ バインディング         | `name @ pattern`                | `p @ User(name = "admin", ..) => use(p)`   |
| タプル                   | *(予約、パース不可)*            | —                                          |

## ワイルドカード `_`

何にでもマッチし、何もバインドしません。バインドなしで網羅性を満たすために使います。

```valen
match n {
    0 => "zero",
    _ => "other",
}
```

## リテラルパターン

整数、long、文字列、真偽値、浮動小数点、文字リテラルに対してマッチします。

```valen
match c {
    'a' => "letter a",
    '0' => "digit zero",
    _ => "other",
}
```

## バインディングパターン

素の識別子はマッチした値へのバインディングを作成します。`mut` 修飾子もサポートしています。

```valen
match n {
    x => use(x),       // x は n にバインドされる
    mut y => { ... },   // ミュータブルバインディング
}
```

## パス / バリアントパターン

enum バリアントに対してマッチし、オプションでフィールドを分解します。

```valen
match shape {
    Shape::Circle(r) => f"r = {r}",
    Shape::Rect(w, h) => f"{w} x {h}",
    Shape::Point => "point",
}
```

### バリアント省略記法

被検査式の型が既知の場合、`.Variant` または `.Variant(fields)` で enum 名を省略できます。`.` の後の識別子は大文字で始まる必要があります。

```valen
match shape {
    .Circle(r) => f"r = {r}",
    .Rect(w, h) => f"{w} x {h}",
    .Point => "point",
}
```

残余パターン（`..`）も省略記法で使えます。

```valen
match shape {
    .Circle(..) => "circle",
    _ => "other",
}
```

網羅性チェッカーは `VariantShorthand` パターンを正しく認識します。

## Or パターン

`|` で区切られた複数のパターンです。すべての選択肢は**同じ変数名のセット**をバインドする必要があります。

```valen
match n {
    1 | 2 | 3 => "small",
    _ => "other",
}

match expr {
    Expr::Lit(v) | Expr::Neg(v) => v,       // OK: 両方とも `v` をバインド
    // Expr::Lit(v) | Expr::Neg(w) => ...    // ERROR: 名前が異なる
}
```

バインディングなしの Or パターン（リテラルのみ）にはバインディング整合性の要件はありません。

::: warning
**バインディング整合性は現在チェックされていません。** パーサーも網羅性チェッカーも、or パターンのすべての選択肢が同じ変数名をバインドするかを検証しません。将来のセマンティックチェックパスで強制予定です。現時点では不整合なバインディングもエラーなしでコンパイルされます。
:::

## 範囲パターン

排他的（`..`）と包含的（`..=`）の両方の範囲をサポートしています。

```valen
match n {
    0..10 => "single digit",      // 排他的: 0 <= n < 10
    10..=99 => "double digit",    // 包含的: 10 <= n <= 99
    _ => "large",
}
```

### 制限

- **開始リテラル:** `IntLit` と `LongLit` を受け付ける
- **終了リテラル:** `IntLit` **のみ**受け付ける。終了値に `LongLit` を書くとパースエラー
- `Float`、`Double`、`Char`、`String` の範囲パターンはサポートされていない

## ガード

パターンの後の `if` 条件です。マッチとバインディングの後に評価されます。

```valen
match user {
    User(name, age) if age >= 20 => f"adult: {name}",
    User(name, _) => f"minor: {name}",
}
```

- ガードの型は `Bool` でなければならない
- ガード付きアームは無条件に網羅的とは**見なされない**
- Or パターンでは、ガードは or パターン全体に適用される

```valen
match n {
    2 | 4 | 6 if n < 10 => "small even",
    _ => "other",
}
```

## @ バインディング

マッチした値全体に名前をバインドしつつ、分解も行います。

```valen
match user {
    p @ User(name = "admin", ..) => admin_action(p),
    _ => default_action(),
}
```

## 網羅性規則

| 型             | 規則                                                         |
|----------------|--------------------------------------------------------------|
| `enum`         | すべてのバリアントをカバーするか、`_` が必要                 |
| `sealed class` | すべての許可されたサブタイプをカバーするか、`_` が必要       |
| `sealed trait` | すべての実装者をカバーするか、`_` が必要                     |
| `@valen.Closed` 付き Java `sealed` | 網羅的 — すべての permits をカバーする必要あり |
| `@valen.Closed` なし Java `sealed` | オープンワールド — `_` が常に必要            |
| `Bool`         | `true` + `false`、または `_`                                 |
| 整数 / 文字列 / その他 | `_` が常に必要                                      |

ガード付きアームは無条件に網羅的とは見なされません。

::: warning 既知の制限
網羅性チェッカーは**生の AST** で動作し、被検査式の型は**パラメータの型注釈**と **`let` バインディングの型注釈**からのみ推論します。以下のケースではチェックがスキップされます。

- 関数の戻り値: `match getColor() { ... }`
- メソッドチェーン: `match obj.method().field { ... }`
- 複雑な式: `match if cond { a } else { b } { ... }`

```valen
fn process(c: Color) {
    match c { ... }   // OK — パラメータから型を推論
}

fn process2() {
    let c: Color = getColor();
    match c { ... }   // OK — let 注釈から型を推論
}

fn process3() {
    match getColor() { ... }  // NG — 型不明、チェックスキップ
}
```

将来のバージョンで、すべての被検査式型に対する正確な網羅性のために型付き HIR を使うようリファクタリング予定です。
:::

## タプルパターン

::: info 予約
`Pattern::Tuple` は AST に存在しますがパーサーロジックはありません。タプルパターンは現在使えません。将来のタプル型サポートのために予約されています。
:::

## if let

条件付きパターンマッチです。1アームの `match` に相当します。

```valen
if let Some(value) = opt {
    use(value);
} else {
    fallback();
}
```

`else if let` チェーンもサポートしています。

```valen
if let Some(pos) = getPosition() {
    use_pos(pos);
} else if let Some(vel) = getVelocity() {
    use_vel(vel);
} else {
    default();
}
```

**制限:** ガード条件（`if let P = e && cond`）は現在サポートされていません。

## while let

パターンがマッチする間ループします。

```valen
while let Some(item) = iter.next() {
    process(item);
}
```

## let-else

必須の発散 else ブロック（`return`、`break`、`continue`、または `panic`）付きの反駁可能バインディングです。

```valen
let Some(health) = world.getComponent(entity, "Health") else { return; };
let Ok(data) = readFile(path) else { panic("read failed"); };
```

バインドされた変数は外側のスコープで利用できます。else ブロックの型は `Nothing` でなければなりません。

深い `match` のネストを避ける早期リターンパターンのシンタックスシュガーです。

```valen
// let-else なし:
let health = match world.getComponent(entity, "Health") {
    Option::Some(h) => h,
    Option::None => return,
};

// let-else あり:
let Option::Some(health) = world.getComponent(entity, "Health") else { return; };
```
