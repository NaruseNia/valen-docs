# エラーモデル

Valen は失敗処理を4つの異なるメカニズムに分離する。それぞれ正確に1つの役割を持ち、重複や曖昧さはない。

## 4つのメカニズム

| メカニズム | 用途 | 典型的な使用場面 |
|---|---|---|
| `Option<T>` | 値の不在 | 「見つからない」が正常な結果の場合 |
| `Result<T, E>` | 回復可能な失敗 | 呼び出し側が処理可能かつ処理すべき場合 |
| `panic` | 契約違反 / 到達不能 | バグを検出 — プログラムを停止する |
| 例外 | Java FFI 境界のみ | Java が例外をスロー、境界でキャッチ |

Valen に `throw` は存在しない。ドメイン上の失敗には `Option` / `Result` を使用。致命的エラーには `panic` を使用。Java の例外は `safe { }` でラップする。

## Option\<T\>

`Option<T>` は値が存在するかもしれないし、しないかもしれないことを表す。2つのバリアント: `Some(value)` と `None`。

::: info
`T?` は `Option<T>` のシュガー**ではない**。`T?` は独立した nullable JVM 型（`Ty::Nullable`）。詳細は [Java 連携](/ja/reference/java-interop)を参照。
:::

### メソッド

| メソッド | シグネチャ | 説明 |
|---|---|---|
| `map` | `fn map<U>(self, f: fn(T) -> U) -> Option<U>` | `Some` なら内部値を変換 |
| `flatMap` | `fn flatMap<U>(self, f: fn(T) -> Option<U>) -> Option<U>` | 失敗し得る計算をチェーン |
| `filter` | `fn filter(self, f: fn(T) -> Bool) -> Option<T>` | 述語を満たす場合のみ `Some` を保持 |
| `unwrapOr` | `fn unwrapOr(self, default: T) -> T` | 値を取り出すか、デフォルトを使用 |
| `isSome` | `fn isSome(self) -> Bool` | `Some` なら `true` |
| `isNone` | `fn isNone(self) -> Bool` | `None` なら `true` |

## Result\<T, E\>

`Result<T, E>` は成功（`Ok(value)`）または失敗（`Err(error)`）し得る計算を表す。

::: info
`E` には `E: Error` trait 制約が**ない**。stdlib は `E` に境界なしで `Result<T, E>` を定義しており、型チェッカーも強制しない。任意の型を `E` として使用可能。将来のバージョンで `E: Error` 要件を導入する可能性があるが、現時点では無制約。
:::

### メソッド

| メソッド | シグネチャ | 説明 |
|---|---|---|
| `map` | `fn map<U>(self, f: fn(T) -> U) -> Result<U, E>` | 成功値を変換 |
| `mapErr` | `fn mapErr<F>(self, f: fn(E) -> F) -> Result<T, F>` | エラー値を変換 |
| `flatMap` | `fn flatMap<U>(self, f: fn(T) -> Result<U, E>) -> Result<U, E>` | 失敗し得る計算をチェーン |
| `unwrapOr` | `fn unwrapOr(self, default: T) -> T` | 値を取り出すか、デフォルトを使用 |
| `isOk` | `fn isOk(self) -> Bool` | `Ok` なら `true` |
| `isErr` | `fn isErr(self) -> Bool` | `Err` なら `true` |

## Error Trait

`valen.core` で定義。ユーザー定義のエラー型が実装可能だが、`Result` には必須ではない。

```valen
trait Error {
    fn message(self) -> String;
}
```

ユーザー定義のエラー型:

```valen
enum AppError {
    NotFound(id: Int),
    Forbidden(reason: String),
}

impl Error for AppError {
    fn message(self) -> String {
        match self {
            AppError::NotFound(id) => f"not found: {id}",
            AppError::Forbidden(reason) => f"forbidden: {reason}",
        }
    }
}
```

## `?` 演算子

| コンテキスト | 動作 | 要件 |
|---|---|---|
| `Result<T, E>` | `Ok(v)` → `v`、`Err(e)` → 早期リターン `Err(e)` | 外側の関数が `Result<..>` を返す |
| `Option<T>` | `Some(v)` → `v`、`None` → 早期リターン `None` | 外側の関数が `Option<..>` を返す |

- `Option` → `Result` の暗黙的昇格は禁止。
- `?` は `T?`（nullable 型）には使用不可。`Option<T>` と `Result<T, E>` でのみ動作する。

::: warning
**エラー型の同一性は検証されない。** 型チェッカーは対象が `Result<T, E>` または `Option<T>` であること、外側の関数が同じラッパー型を返すことは確認するが、`E` の型が一致するかは**チェックしない**。異なるエラー型間での `?` の使用はエラーなしでコンパイルされる。正確性を保つために `map_err` で明示的に変換すること。
:::

```valen
fn find_user(id: Int) -> Result<User, DbError> {
    let row = query(id)?;   // DbError → DbError (同じ型、OK)
    Ok(User::from_row(row))
}

// 異なるエラー型 — map_err で変換
fn load(path: String) -> Result<Data, AppError> {
    let content = read_file(path)
        .map_err(|e| AppError::IoFailed(e.message()))?;
    parse(content)
        .map_err(|e| AppError::ParseFailed(e.message()))
}

fn first_char(s: String) -> Option<Char> {
    let c = s.chars().first()?;
    Some(c.to_uppercase())
}
```

## `safe { }` ブロック

Java メソッド呼び出しをラップし、例外をキャッチして null を正規化する。

**戻り型:** `Result<T, JavaException>`（void でない Java の戻り値は `Ok` 内で `T?`）

- 例外 → `Err(JavaException)`
- 成功 → `Ok(value)`、void でない戻り値は `T?`（nullable）
- `void` メソッドは `Unit` を返す

```valen
fn read_safe(path: String) -> Result<String, JavaException> {
    safe { java.nio.file.Files.readString(java.nio.file.Paths.get(path)) }
}
```

### `safe expr` (省略記法)

`safe { expr }` と等価。単一式ならブレース不要。

```valen
let r = safe file.readString();  // Result<String?, JavaException>
```

### `safe? expr`

`safe { expr }?` と等価。`Result` を `?` でアンラップし、直接 `T?` を返す。

```valen
let s: String? = safe? file.readString();
// 等価: safe { file.readString() }?
```

## Java メソッド呼び出しモード

| 構文 | 戻り型 | 例外処理 | null 処理 |
|---|---|---|---|
| `safe { expr }` / `safe expr` | `Result<T?, JavaException>` | `Err` でラップ | `T?` (nullable) |
| `safe? expr` | `T?` | `?` で早期リターン | `T?` (nullable) |
| `unsafe { expr }` / `unsafe expr` | `T` (non-nullable) | パススルー（クラッシュ） | NPE リスク |

::: warning 将来
素の Java メソッド呼び出し（`safe` も `unsafe` もなし）はコンパイルエラーにする予定だが、**この制限は現在強制されていない**。素の呼び出しは正常にコンパイルされる。将来のバージョンで拒否予定。
:::

**例外:** Java コンストラクタ呼び出しには `safe`/`unsafe` ラッパーが不要。コンストラクタは常に非 null を返し、スローした場合はオブジェクトが生成されない。

```valen
let list = ArrayList();  // safe/unsafe 不要
```

## `unsafe` ブロック / `unsafe fn`

Valen の型および失敗モデルの安全性保証をバイパスする。

### `unsafe` 内で許可される操作

| 操作 | 例 | リスク |
|---|---|---|
| 未チェックダウンキャスト | `obj as ConcreteType` | `ClassCastException` |
| Java 例外のバイパス | キャッチなしの Java 呼び出し | 未処理例外 |
| Non-nullable null | `let x: String = unsafe { null };` | NPE |

### `unsafe` 省略記法

ブレースなしの単一式形式:

```valen
let pos: Position = unsafe obj as Position;
// 等価: unsafe { obj as Position }
```

### `unsafe fn`

関数本体全体が暗黙的な unsafe コンテキスト。呼び出し側は `unsafe { }` でラップする必要がある。

```valen
unsafe fn rawAccess(ptr: Long) -> Int { ... }

let v = unsafe { rawAccess(ptr) };
```

## `as` キャスト

`expr as Type` は型キャストを実行する。安全性は変換の種類による:

- **安全（`unsafe` 不要）:** 数値の拡張変換（`42 as Long`、`'A' as Int`）
- **unsafe 必要:** ダウンキャスト（`obj as Position` — `ClassCastException` リスク）

```valen
let x: Long = 42 as Long;                     // 安全な拡張
let pos: Position = unsafe { obj as Position }; // unsafe ダウンキャスト
```

## panic

`panic` は契約違反や到達不能状態でプログラムを停止する。回復可能なエラー用ではない。

```valen
panic("invariant violated: negative count");
```

予期される失敗には `Option` / `Result` を使用。`panic` はバグのために予約。
