# エラーハンドリング

多くの言語は失敗に対処する方法を1つか2つ提供して、あとは幸運を祈るスタイル。Valen は4つ提供します — ただし各々の役割は正確に1つだけ。重複なし、曖昧さなし、深夜2時の「throw すべきか null 返すべきか」論争なし。

## 4つのメカニズム

| メカニズム | 使うタイミング | 一言で |
|---|---|---|
| `Option<T>` | 値が不在の可能性がある | 「見つからない」は正常な結果 |
| `Result<T, E>` | 回復可能な失敗の可能性がある | 呼び出し側が処理できる（すべき） |
| `panic` | 契約違反、到達不能コード | 「これはバグ。すべて停止」 |
| Exception | Java FFI 境界のみ | Java が何か投げてきた。境界でキャッチ |

::: warning Valen に `throw` はない
`throw` は存在しません。失敗を表現したければ `Option` か `Result` を返します。致命的な問題なら `panic`。Java が例外を投げてきたら `safe { }` でラップ。それだけです。
:::

## Option — 「ないかもしれない」

`Option<T>` は値が存在するかもしれないし、しないかもしれないことを表します。バリアントは2つ: `Some(value)` と `None`。

```valen
fn find_user(id: Int) -> Option<User> {
    if id == 1 {
        Some(User(name = "Alice", age = 30))
    } else {
        None
    }
}

match find_user(42) {
    Some(u) => println(f"Found: {u.name}"),
    None => println("User not found"),
}
```

### Option のメソッド

| メソッド | シグネチャ | 動作 |
|---|---|---|
| `map` | `fn map<U>(self, f: fn(T) -> U) -> Option<U>` | 内部の値を変換 |
| `flatMap` | `fn flatMap<U>(self, f: fn(T) -> Option<U>) -> Option<U>` | オプショナルな操作を連鎖 |
| `unwrapOr` | `fn unwrapOr(self, default: T) -> T` | 値を取得、またはフォールバック |
| `filter` | `fn filter(self, predicate: fn(T) -> Bool) -> Option<T>` | 述語を満たす場合のみ保持 |
| `isSome` | `fn isSome(self) -> Bool` | 値がある？ |
| `isNone` | `fn isNone(self) -> Bool` | 空？ |

## `T?` — Nullable 型（`Option<T>` ではない）

大事なポイント: **`T?` は `Option<T>` の糖衣構文じゃありません。** 完全に別の型です。

| 型 | 本質 | 用途 |
|---|---|---|
| `Option<T>` | Valen ネイティブの ADT enum（`Some(T)` / `None`） | Valen ネイティブの不在モデリング |
| `T?` | Nullable 型（`Ty::Nullable`） | JVM null の相互運用、Java メソッドの戻り値 |

`Option<T>` は Valen の enum で、パターンマッチングできる正当な ADT。`T?` は「この値は JVM null かもしれない」という型システムのアノテーション。言語の異なるレイヤーに存在しています。

`T?` が現れるのは主に Java 相互運用時です。`safe { }` ブロックで Java メソッドを呼ぶと、Java メソッドは常に null を返す可能性があるため戻り値は `T?` になります。詳しくは [Java 相互運用](/ja/guide/java-interop)を参照。

### `?` 演算子は `Option` と `Result` に作用する — `T?` には作用しない

`?`（try）演算子は成功値を取り出すか、失敗を早期リターンするものです。動作対象:

- `Option<T>` — `Some(v)` を取り出す、または `None` を返す
- `Result<T, E>` — `Ok(v)` を取り出す、または `Err(e)` を返す

`T?`（nullable 型）には動作**しません**。Java 相互運用からの nullable 値は、パターンマッチングか変換で処理してください。

## Result — 「失敗するかもしれないけど、処理できる」

`Result<T, E>` は `Ok(value)` か `Err(error)` のどちらか。

### Error Trait

```valen
trait Error {
    fn message(self) -> String;
}
```

メソッド1つ。それだけ。エラー型を enum で定義して実装しましょう:

```valen
enum AppError {
    NotFound(id: Int),
    Forbidden(reason: String),
    IoFailed(detail: String),
}

impl Error for AppError {
    fn message(self) -> String {
        match self {
            AppError::NotFound(id) => f"not found: {id}",
            AppError::Forbidden(reason) => f"forbidden: {reason}",
            AppError::IoFailed(detail) => f"I/O error: {detail}",
        }
    }
}
```

::: info `E: Error` 制約はなし
`Result<T, E>` は `E` が `Error` trait を実装していることを要求しません。エラーには任意の型が使えます — `String`、enum、data class、意味のあるものなら何でも。`Error` の実装は推奨しますが強制はされません。
:::

### Result の使用

```valen
fn load_config(path: String) -> Result<Config, AppError> {
    let content = read_file(path);
    match content {
        Ok(text) => parse_config(text),
        Err(e) => Err(AppError::IoFailed(detail = e.message())),
    }
}
```

### Result のメソッド

| メソッド | シグネチャ | 動作 |
|---|---|---|
| `map` | `fn map<U>(self, f: fn(T) -> U) -> Result<U, E>` | 成功値を変換 |
| `mapErr` | `fn mapErr<F>(self, f: fn(E) -> F) -> Result<T, F>` | エラー値を変換 |
| `flatMap` | `fn flatMap<U>(self, f: fn(T) -> Result<U, E>) -> Result<U, E>` | 失敗可能な操作を連鎖 |
| `unwrapOr` | `fn unwrapOr(self, default: T) -> T` | 値を取得、またはデフォルト |
| `isOk` | `fn isOk(self) -> Bool` | 成功した？ |
| `isErr` | `fn isErr(self) -> Bool` | 失敗した？ |

## `?` 演算子 — ボイラープレートなしの早期リターン

`?` 演算子があれば、ネストした `match` 式の沼にハマらずに済みます。`Result` や `Option` の後に置くと、成功値を取り出すか、失敗を即リターンしてくれます。

### `?` on Result

```valen
fn find_user(id: Int) -> Result<User, DbError> {
    let row = query(id)?;  // Err？ 即リターン。
    Ok(User::from_row(row))
}
```

エラー型が違う場合は `mapErr` で変換:

```valen
fn load(path: String) -> Result<Data, AppError> {
    let content = read_file(path)
        .mapErr(|e| AppError::IoFailed(detail = e.message()))?;

    parse(content)
        .mapErr(|e| AppError::IoFailed(detail = e.message()))
}
```

暗黙のエラー変換マジックはありません。何が起きているか常にわかります。

::: info エラー型の検査
型チェッカーは `?` が `Result` または `Option` に適用されていること、そして囲む関数が同じラッパー型を返すことを検証します。ただし、`?` 式と関数の戻り値型の間で `Result<T, E>` の `E` 型が一致するかは現在未検証です。`mapErr` でエラー型間を明示的に変換してください。
:::

### `?` on Option

同じ仕組みですが、囲む関数は `Option` を返す必要があります:

```valen
fn first_char_upper(s: String) -> Option<Char> {
    let c = s.chars().first()?;  // None？ None をリターン。
    Some(c.to_uppercase())
}
```

### Option から Result へ？ 明示的に変換する。

`Result` を返す関数内で `Option` に `?` は使えません。先に変換してください:

```valen
// Option -> Result: match かヘルパーを使う
let value = find_something()
    .map(|v| Ok(v))
    .unwrapOr(Err(AppError::NotFound(id = 42)));
```

## `safe { }` — Java 例外を手なずける

Java メソッドは例外を投げます。Valen メソッドは投げません。`safe { }` ブロックはこの2つの世界の橋渡し — Java 例外をキャッチして `Result<Option<T>, JavaException>` にラップしてくれます。

```valen
fn read_safe(path: String) -> Result<Option<String>, JavaException> {
    safe { java.nio.file.Files.readString(java.nio.file.Paths.get(path)) }
}
```

Java メソッドが成功し非 null を返せば `Ok(Some(value))`。null を返せば `Ok(None)`。例外を投げれば `Err(JavaException)`。成功・不在・失敗の3つを明確に分離。

### 省略記法: `safe expr`

ワンライナーなら中括弧を省略できます:

```valen
let r = safe file.readString();  // Result<Option<String>, JavaException>
```

`safe { file.readString() }` と完全に等価。

### `safe?` — コンボ技

`safe? expr` は `safe { expr }?` を一発でやってくれます。Java メソッドを呼んで、例外を Result にラップして、`?` でアンラップ:

```valen
fn read_content(path: String) -> Result<String?, JavaException> {
    let text: String? = safe? Files.readString(Paths.get(path));
    // Java メソッドが投げていたら、既に Err をリターン済み
    Ok(text)
}
```

Java 相互運用で一番よく使うパターンです — 短くて、安全で、明確。

## 実践的なパターン

### 複数呼び出しの `?` チェーン

```valen
fn process(id: Int) -> Result<Report, AppError> {
    let user = find_user(id)?;
    let data = load_data(user.data_id)?;
    let report = generate_report(data)?;
    Ok(report)
}
```

各 `?` は早期脱出の可能性です。ハッピーパスがネストなしで上から下に読めますよ。

### Result の Match

両方のケースを明示的に処理する必要がある場合:

```valen
match load_config("app.toml") {
    Ok(config) => start_server(config),
    Err(AppError::NotFound(_)) => {
        println("Config not found, using defaults");
        start_server(default_config())
    },
    Err(e) => {
        println(f"Fatal: {e.message()}");
        panic("cannot start");
    },
}
```

### unwrapOr — デフォルト値を提供

```valen
let name = find_user(id)
    .map(|u| u.name)
    .unwrapOr("Guest");
```

unwrap して祈るんじゃなくて、常にフォールバックを提供しましょう。

## まとめ

```
値が不在かもしれない？              -> Option<T>
操作が回復可能な失敗をする？        -> Result<T, E>
Java 相互運用からの JVM null？      -> T?（nullable 型）
バグや到達不能コード？              -> panic
Java メソッドが投げるかもしれない？  -> safe { } で Result を取得
もっと短くしたい？                  -> safe? expr
```

Valen のすべての失敗は型シグネチャに現れます。隠れた `throws` なし、サプライズ null なし、`catch (Exception e)` のセーフティネットもなし。見て、処理して、先へ進む。

## 次のステップ

- [Java 相互運用](/ja/guide/java-interop) — `safe`、`unsafe`、Java ライブラリとの連携の全容
- [Unsafe](/ja/guide/unsafe) — 危険に（責任を持って）生きたい時
