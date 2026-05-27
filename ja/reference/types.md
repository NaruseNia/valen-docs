# 型

## プリミティブ型

| 型        | サイズ  | JVM マッピング               | デフォルトリテラル |
|-----------|---------|------------------------------|-------------------|
| `Int`     | 32-bit  | `int` / `java.lang.Integer`   | `42`       |
| `Long`    | 64-bit  | `long` / `java.lang.Long`     | `42L`      |
| `Float`   | 32-bit  | `float` / `java.lang.Float`   | `3.14f`    |
| `Double`  | 64-bit  | `double` / `java.lang.Double` | `3.14`     |
| `Bool`    | 1-bit   | `boolean` / `java.lang.Boolean` | `true`   |
| `Char`    | 16-bit  | `char` / `java.lang.Character` | `'a'`     |
| `Byte`    | 8-bit   | `byte` / `java.lang.Byte`     | —          |
| `Short`   | 16-bit  | `short` / `java.lang.Short`   | —          |
| `String`  | —       | `java.lang.String`             | `"hello"`  |
| `Unit`    | —       | `void` (戻り値) / `()` (値位置) | `()` |
| `Nothing` | —       | ⊥ (ボトム型、インスタンスなし)  | —          |
| `Any`     | —       | `java.lang.Object`             | —          |

- `Any` はトップ型です。すべての型は暗黙的に `Any` のサブタイプになり、`Any` へのアップキャストは暗黙的に行われます（プリミティブはボクシングされます）。
- `Nothing` はボトム型です。完了しない式（`panic`、無限 `loop`、`return`）の戻り型として使われます。
- `Unit` はゼロ値型で、`void` に相当します。意味のある戻り値がない関数は `Unit` を返します。`-> Unit` の戻り型注釈はシグネチャから省略できます。Unit リテラルは `()` です。

## サブタイピング規則

型チェッカーは以下のサブタイピング関係を適用します。

| 規則 | 説明 |
|------|------|
| 反射律 | `T` は `T` のサブタイプ |
| Any | すべての型は `Any` のサブタイプ |
| Nullable | `T` は `T?` のサブタイプ |
| Nothing | `Nothing` はすべての型のサブタイプ |
| TypeParam | 具体型は `TypeParam` にマッチ（呼び出し側で解決） |

```valen
let x: Any = 42;           // Int → Any (暗黙的アップキャスト)
let y: Int? = 42;           // Int → Int? (暗黙的アップキャスト)
```

ダウンキャストには `unsafe` コンテキスト内での明示的な `as` キャストが必要です。

## 数値リテラル

| 基数    | プレフィックス | 例                    | 型    |
|---------|------------|----------------------|-------|
| 10進数  | (なし)     | `42`, `1_000_000`    | `Int` |
| 16進数  | `0x`       | `0xFF`, `0x1A_2B`    | `Int` |
| 2進数   | `0b`       | `0b1010`, `0b1111_0000` | `Int` |
| 8進数   | `0o`       | `0o77`, `0o755`      | `Int` |

### サフィックス

| サフィックス | 効果           | 例        |
|------------|----------------|-----------|
| `L`        | `Long` に昇格   | `42L`, `0xFFL` |
| `f`        | `Float` に昇格  | `3.14f`  |

- アンダースコア `_` セパレータは数値リテラル内のどこでも使えます: `1_000_000`, `0xFF_FF`
- サフィックスなしの整数リテラルはデフォルトで `Int`（i32 範囲に収まる必要あり）
- サフィックスなしの浮動小数点リテラルはデフォルトで `Double`

## 文字リテラル

シングルクォートの文字リテラルは `Char` 値を生成します。

```valen
let a = 'A';
let newline = '\n';
let nul = '\0';
```

サポートされるエスケープシーケンス: `\n` `\t` `\r` `\\` `\'` `\0`

## 数値変換

**暗黙的な数値変換は存在しません。** すべての変換には明示的なメソッド呼び出しが必要です。

### 変換メソッド

各型は以下に列挙された変換のみを提供します。列挙されていないメソッドの呼び出しはコンパイルエラーになります。

| 型 | 利用可能な変換メソッド |
|------|------------------------------|
| `Int` | `.toLong()`, `.toFloat()`, `.toDouble()` |
| `Long` | `.toInt()`, `.toFloat()`, `.toDouble()` |
| `Float` | `.toInt()`, `.toLong()`, `.toDouble()` |
| `Double` | `.toInt()`, `.toLong()`, `.toFloat()` |
| `Byte` | `.toInt()`, `.toLong()`, `.toFloat()`, `.toDouble()`, `.toShort()` |
| `Short` | `.toInt()`, `.toLong()`, `.toFloat()`, `.toDouble()`, `.toByte()` |
| `Char` | `.toInt()`, `.toLong()`, `.toFloat()`, `.toDouble()` |

::: warning
`.toChar()` はどの型にも存在しません。`.toByte()` は `Short` のみ、`.toShort()` は `Byte` のみで利用できます。
:::

```valen
let x: Long = 42.toLong();       // OK
let y: Long = 42;                // ERROR: 型不一致
let z: Double = 3.14f.toDouble(); // OK
let w: Float = 42.toFloat();     // OK
```

### `as` による数値キャスト

数値型間の明示的な `as` キャストも利用できます。数値間の `as` キャストはすべて安全で、`unsafe` ブロックは不要です。`Char` から数値へのキャストも安全です。

```valen
let x = 42 as Long;    // OK (安全)
let c = 'A' as Int;    // OK (安全)
```

## Nullable 型 (`T?`)

### `T?` と `Option<T>` は別の型

Valen には値の不在を表す **2つの異なる** 表現があります。

| 型 | 内部表現 | 用途 |
|------|-------------------------|---------|
| `T?` | `Ty::Nullable(Box<Ty>)` | JVM null を許容する型。主に Java 連携用 |
| `Option<T>` | `enum Option<T> { Some(T), None }` | Valen ネイティブのオプショナル値。代数的データ型 |

::: danger 重要
`T?` は `Option<T>` のシンタックスシュガー**ではありません**。型システム上まったく別の型です。`T?` は JVM の nullable 参照にマッピングされ、`Option<T>` は ADT enum です。
:::

### `T?` の JVM マッピング

`T?` はボックス化された JVM 型（null を保持できる参照型）にマッピングされます。

| Valen 型 | JVM 型 |
|------------|----------|
| `Int?` | `java/lang/Integer` |
| `Long?` | `java/lang/Long` |
| `Float?` | `java/lang/Float` |
| `Double?` | `java/lang/Double` |
| `Bool?` | `java/lang/Boolean` |
| `Char?` | `java/lang/Character` |
| `Byte?` | `java/lang/Byte` |
| `Short?` | `java/lang/Short` |
| `String?` | `java/lang/String` (元々参照型のため変更なし) |

### `?` 演算子と Nullable

`?` (try) 演算子は `Option<T>` と `Result<T, E>` にのみ対応しています。**`T?` (Nullable) には使えません。**

```valen
fn get_value() -> Option<Int> {
    Option::Some(42)
}

fn example() -> Option<Int> {
    let v = get_value()?;  // OK: Option<Int> に ? を使用
    Option::Some(v + 1)
}
```

`?` を使う場合、外側の関数の戻り型が一致する必要があります。
- `Option<T>` に `?` → 関数は `Option<..>` を返す必要あり
- `Result<T, E>` に `?` → 関数は `Result<..>` を返す必要あり

### `null` リテラルはない

Valen に `null` リテラルは存在しません。JVM null は Nullable 型と Java 連携を通じてのみ扱います。

### プラットフォーム型 (`T!`)

`T!` は **未実装** です（将来の検討のために予約）。ユーザーが記述することはできません。

## Option\<T\>

`Option<T>` はオプショナル値のための標準ライブラリ ADT enum です。

| バリアント    | 意味           |
|---------------|----------------|
| `Some(value)` | 値が存在する   |
| `None`        | 値が存在しない |

```valen
let name: Option<String> = Option::Some("Alice");
let missing: Option<Int> = Option::None;

// 型が既知の場合のバリアント省略記法:
let name: Option<String> = .Some("Alice");
let missing: Option<Int> = .None;
```

## Result\<T, E\>

`Result<T, E>` は回復可能な計算を表します。`E` は `Error` trait を実装する必要があります。

| バリアント   | 意味                |
|-------------|---------------------|
| `Ok(value)` | 成功                |
| `Err(error)` | 失敗（回復可能）   |

```valen
fn parse(s: String) -> Result<Int, ParseError> {
    // ...
}
```

`?` 演算子は `Err` を早期リターンで伝播します。詳しくは[エラー処理](/ja/guide/error-handling)を参照してください。

## ref mut T

`ref mut T` は `T` への可変参照です。`T` と `ref mut T` の間に暗黙的な変換はありません。

| 構文            | 意味                       |
|-----------------|----------------------------|
| `ref mut expr`  | 可変参照を作成             |
| `*r`            | 参照を通じて読み取り       |
| `*r = expr`     | 参照を通じて書き込み       |

```valen
fn increment(x: ref mut Int) -> Unit {
    *x = *x + 1;
}

let mut n = 10;
increment(ref mut n);
// n == 11
```

`ref mut T` は Valen 内部専用で、Java メソッドに渡すことはできません。

### JVM 実装

| Valen 型 | JVM クラス | 備考 |
|------------|-----------|------|
| `ref mut Int` | `valen/core/IntRef` | |
| `ref mut Byte` | `valen/core/IntRef` | Int と IntRef を共有 |
| `ref mut Short` | `valen/core/IntRef` | Int と IntRef を共有 |
| `ref mut Char` | `valen/core/IntRef` | Int と IntRef を共有 |
| `ref mut Long` | `valen/core/LongRef` | |
| `ref mut Float` | `valen/core/FloatRef` | |
| `ref mut Double` | `valen/core/DoubleRef` | |
| `ref mut Bool` | `valen/core/BoolRef` | |
| `ref mut T` (オブジェクト) | `valen/core/Ref` | |

::: info
`ref mut Byte`、`ref mut Short`、`ref mut Char` はすべて `ref mut Int` と `valen/core/IntRef` を共有しています。
:::

## ジェネリクス

Valen のジェネリクスは `<T>` 構文と JVM イレイジャーセマンティクスを使います。

```valen
class Box<T>(val value: T) {}

fn <T> identity(x: T) -> T {
    x
}
```

### 変性アノテーション (`in`/`out`)

`in` (反変) と `out` (共変) のアノテーションは構文的には受け付けますが、型チェッカーによる**強制はまだ行われていません**。パーサーは記録しますが、変性制約のチェックは実行しません。強制は将来のフェーズで予定されています。

```valen
// 構文的には有効だが、変性は未強制
class Box<out T>(val value: T) {}
trait Consumer<in T> {
    fn accept(self, item: T) -> Unit;
}
```

### reified 型パラメータ

`inline fn` の `reified T` は JVM イレイジャーを通じて具体型を保持し、ランタイムでの型操作を可能にします。

```valen
inline fn <reified T> isInstance(value: Any) -> Bool {
    value is T
}
```

制約:
- `inline fn` 内でのみ使用可能（それ以外はコンパイルエラー）
- class、data class、enum、trait の型パラメータには使用不可
- 同一関数内で reified と非 reified の型パラメータを混在可能

### 明示的型引数

呼び出し側で型引数を明示的に指定できます。

```valen
let list = ArrayList<String>();
let x = parse<Int>("42");
```

## typealias と newtype

| 機能             | `typealias`                     | `newtype`                          |
|------------------|---------------------------------|------------------------------------|
| 新しい型を作成   | しない（透過的エイリアス）       | する（独立した名前型）              |
| オーファンルール  | 元の型として扱われる            | 自身の型として扱う（trait impl 可能） |
| 構築             | 不要                            | `TypeName(value)`                  |
| 内部値へのアクセス | 直接                           | `.value()` (コード生成レベル)       |

```valen
typealias UserId = Int;     // 単なるエイリアス、新しい型ではない
newtype EntityId = Int;     // 独立した型、trait を impl 可能
let eid = EntityId(42);
```

::: warning
`.value()` ゲッターは JVM バイトコードレベルで生成されますが、型チェッカーレベルでの `.value()` の解決はまだ実装されていません。現在のコンパイラでは `.value()` の呼び出しが型チェックエラーになる場合があります。
:::

## 等値演算子

| 演算子   | セマンティクス      | デシュガー先         |
|----------|---------------------|----------------------|
| `==`     | 構造的等値          | `.equals()`          |
| `!=`     | 構造的非等値        | `!.equals()`         |
| `===`    | 参照同一性          | JVM 参照チェック     |
| `!==`    | 参照非同一性        | JVM 参照チェック     |

```valen
let a = "hello";
let b = "hello";
a == b    // true (構造的比較)
a === b   // true または false (JVM の文字列インターニングに依存)
```

## `safe {}` ブロック

`safe {}` は Java 例外をキャッチし、`Result<T, JavaException>` を返します。

```valen
let result = safe {
    riskyOperation()
};
// result: Result<ReturnType, JavaException>
```

`JavaException` は標準ライブラリの data class です。

```valen
pub data class JavaException(
    pub message: String,
    pub class_name: String,
);
```

`JavaException` は `Error` trait を実装しています。

## data class の暗黙的 trait 充足

`data class` は以下の trait 境界を暗黙的に充足します（明示的な `derives(...)` や `impl` は不要です）。

- `Eq`
- `Hash`
- `Display`
- `Clone`

```valen
data class Point(pub x: Int, pub y: Int);

fn <T: Eq> compare(a: T, b: T) -> Bool {
    a.eq(b)
}

compare(Point(1, 2), Point(1, 2));  // OK: Point は暗黙的に Eq を充足
```

## タプル型 (予約)

`(A, B, C)` タプル構文は AST に予約されていますが、**現在は使えません**。HIR では `Ty::Error` にローワリングされます。

代わりに `data class` または標準ライブラリの `Pair<A, B>` を使ってください。

```valen
let p = Pair(42, "hello");  // Pair<Int, String>
```

## 標準ライブラリ型

### ADT Enum

| 型 | 定義 |
|------|------------|
| `Option<T>` | `enum { Some(value: T), None }` |
| `Result<T, E>` | `enum { Ok(value: T), Err(error: E) }` |
| `Ordering` | `enum { Less, Equal, Greater }` |

### データクラス

| 型 | フィールド |
|------|--------|
| `Pair<A, B>` | `first: A`, `second: B` |
| `Range<T>` | `start: T`, `end: T`, `inclusive: Bool` |
| `JavaException` | `message: String`, `class_name: String` |

### コレクション型エイリアス

| Valen 型 | Java 型 |
|------------|-----------|
| `List<T>` | `java.util.List<T>` |
| `Map<K, V>` | `java.util.Map<K, V>` |
| `Set<T>` | `java.util.Set<T>` |

### Trait

| Trait | メソッド |
|-------|-----------|
| `Eq` | `fn eq(self, other: Self) -> Bool` |
| `Hash` | `fn hash(self) -> Int` |
| `Display` | `fn display(self) -> String` |
| `Clone` | `fn clone(self) -> Self` |
| `Error` | `fn message(self) -> String` |
| `Iterator<T>` | `next`, `map`, `filter`, `fold`, `collect`, `forEach`, `count`, `any`, `all`, `find` |
| `Into<T>` | `fn into(self) -> T` |
| `From<T>` | `fn from(value: T) -> Self` |
| `TryInto<T>` | `fn tryInto(self) -> Result<T, String>` |
| `TryFrom<T>` | `fn tryFrom(value: T) -> Result<Self, String>` |
| `Default` | `fn default() -> Self` |
| `IntoIterator<T>` | `fn intoIter(self) -> Iterator<T>` |
| `Index<Idx>` | `fn index(self, idx: Idx) -> Self` |
| `ToString` | `fn toString(self) -> String` |
| `Ord` | `fn cmp(self, rhs: Self) -> Int` |

### 演算子 Trait

| Trait | メソッド |
|-------|--------|
| `Add<Rhs>` | `fn add(self, rhs: Rhs) -> Self` |
| `Sub<Rhs>` | `fn sub(self, rhs: Rhs) -> Self` |
| `Mul<Rhs>` | `fn mul(self, rhs: Rhs) -> Self` |
| `Div<Rhs>` | `fn div(self, rhs: Rhs) -> Self` |
| `Rem<Rhs>` | `fn rem(self, rhs: Rhs) -> Self` |
| `Neg` | `fn neg(self) -> Self` |
| `Not` | `fn not(self) -> Self` |
