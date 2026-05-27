# エラーハンドリング

多くの言語は失敗に対処する方法を1つか2つ提供して幸運を祈る。Valenは4つ提供する — ただし各々の役割は正確に1つ。重複なし、曖昧さなし、深夜2時の「throw すべきか null を返すべきか」論争なし。

## 4つのメカニズム

| メカニズム | 使うタイミング | 一言で |
|---|---|---|
| `Option<T>` | 値が不在の可能性がある | 「見つからない」は正常な結果 |
| `Result<T, E>` | 回復可能な失敗の可能性がある | 呼び出し側が処理できる（すべき） |
| `panic` | 契約違反、到達不能コード | 「これはバグ。すべて停止」 |
| Exception | Java FFI 境界のみ | Java が何か投げた。境界でキャッチ |

::: warning Valen に `throw` はない
`throw` は存在しない。失敗を表現したければ `Option` か `Result` を返す。致命的な問題なら `panic` する。Java が例外を投げてきたら `safe { }` でラップする。それだけ。
:::

## Option — 「ないかもしれない」

`Option<T>` は値が存在するかもしれないし、しないかもしれないことを表す。2つのバリアント: `Some(value)` と `None`。

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
| `isSome` | `fn isSome(self) -> Bool` | 値があるか？ |
| `isNone` | `fn isNone(self) -> Bool` | 空か？ |

## `T?` — Nullable 型（`Option<T>` ではない）

重要な点: **`T?` は `Option<T>` の糖衣構文ではない。** 完全に別の型。

| 型 | 本質 | 用途 |
|---|---|---|
| `Option<T>` | Valen ネイティブの ADT enum（`Some(T)` / `None`） | Valen ネイティブの不在モデリング |
| `T?` | Nullable 型（`Ty::Nullable`） | JVM null の相互運用、Java メソッドの戻り値 |

`Option<T>` は Valen の enum — パターンマッチング可能な正当な ADT。`T?` は「この値は JVM null かもしれない」という型システムのアノテーション。言語の異なるレイヤーに存在する。

`T?` が現れるのはいつ？ 主に Java 相互運用時 — `safe { }` ブロックが Java メソッドを呼ぶと、Java メソッドは常に null を返す可能性があるため戻り値は `T?` として型付けされる。詳細は [Java 相互運用](/ja/guide/java-interop)を参照。

### `?` 演算子は `Option` と `Result` に作用する — `T?` には作用しない

`?`（try）演算子は成功値を取り出すか、失敗を早期リターンする。動作対象:

- `Option<T>` — `Some(v)` を取り出す、または `None` を返す
- `Result<T, E>` — `Ok(v)` を取り出す、または `Err(e)` を返す

`T?`（nullable 型）には動作**しない**。Java 相互運用からの nullable 値がある場合、パターンマッチングか変換で処理する必要がある。

## Result — 「失敗するかもしれないが、処理できる」

`Result<T, E>` は `Ok(value)` か `Err(error)` のどちらか。

### Error Trait

```valen
trait Error {
    fn message(self) -> String;
}
```

メソッド1つ。それだけ。エラー型を enum で定義し、実装する:

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
`Result<T, E>` は `E` が `Error` trait を実装することを要求しない。エラーには任意の型が使える — `String`、enum、data class、意味のあるものなら何でも。`Error` の実装は推奨されるが強制されない。
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
| `isOk` | `fn isOk(self) -> Bool` | 成功したか？ |
| `isErr` | `fn isErr(self) -> Bool` | 失敗したか？ |

## `?` 演算子 — ボイラープレートなしの早期リターン

`?` 演算子のおかげでネストした `match` 式に溺れずに済む。`Result` や `Option` の後に置くと、成功値を取り出すか、失敗を即座にリターンする。

### `?` on Result

```valen
fn find_user(id: Int) -> Result<User, DbError> {
    let row = query(id)?;  // Err？ 即座にリターン。
    Ok(User::from_row(row))
}
```

エラー型が異なる場合は `mapErr` で変換:

```valen
fn load(path: String) -> Result<Data, AppError> {
    let content = read_file(path)
        .mapErr(|e| AppError::IoFailed(detail = e.message()))?;

    parse(content)
        .mapErr(|e| AppError::IoFailed(detail = e.message()))
}
```

暗黙のエラー変換マジックなし。何が起きているか常に正確に分かる。

::: info エラー型の検査
型チェッカーは `?` が `Result` または `Option` に適用されていること、そして囲む関数が同じラッパー型を返すことを検証する。ただし、`?` 式と関数の戻り値型の間で `Result<T, E>` の `E` 型が一致するかは現在検証されない。`mapErr` を使ってエラー型間を明示的に変換する。
:::

### `?` on Option

同じように動作するが、囲む関数は `Option` を返す必要がある:

```valen
fn first_char_upper(s: String) -> Option<Char> {
    let c = s.chars().first()?;  // None？ None をリターン。
    Some(c.to_uppercase())
}
```

### Option から Result へ？ 明示的に変換する。

`Result` を返す関数内で `Option` に `?` は使えない。先に変換する:

```valen
// Option -> Result: match かヘルパーを使う
let value = find_something()
    .map(|v| Ok(v))
    .unwrapOr(Err(AppError::NotFound(id = 42)));
```

## `safe { }` — Java 例外を手なずける

Java メソッドは例外を投げる。Valen メソッドは投げない。`safe { }` ブロックはこの2つの世界の橋渡し — Java 例外をキャッチして `Result<T, JavaException>` にラップする。

```valen
fn read_safe(path: String) -> Result<String, JavaException> {
    safe { java.nio.file.Files.readString(java.nio.file.Paths.get(path)) }
}
```

Java メソッドが成功すれば `Ok(value)` を取得。投げれば `Err(JavaException)` を取得。`safe { }` 内の Java 戻り値は自動的に nullable（`T?`）として型付けされる。Java メソッドは約束しても常に null を返す可能性があるため。

### 省略記法: `safe expr`

ワンライナーなら中括弧を省略:

```valen
let r = safe file.readString();  // Result<String?, JavaException>
```

`safe { file.readString() }` と完全に等価。

### `safe?` — コンボ技

`safe? expr` は `safe { expr }?` を一発で。Java メソッドを呼び、例外を Result にラップし、`?` でアンラップ:

```valen
fn read_content(path: String) -> Result<String?, JavaException> {
    let text: String? = safe? Files.readString(Paths.get(path));
    // Java メソッドが投げていたら、既に Err をリターン済み
    Ok(text)
}
```

Java 相互運用で最も一般的なパターン — 短く、安全で、明確。

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

各 `?` は早期脱出の可能性。ハッピーパスがネストなしで上から下に読める。

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

unwrap して祈るのではなく、常にフォールバックを提供する。

## まとめ

```
値が不在かもしれない？              -> Option<T>
操作が回復可能な失敗をする？        -> Result<T, E>
Java 相互運用からの JVM null？      -> T?（nullable 型）
バグや到達不能コード？              -> panic
Java メソッドが投げるかもしれない？  -> safe { } で Result を取得
もっと短くしたい？                  -> safe? expr
```

Valenのすべての失敗は型シグネチャに現れる。隠れた `throws` なし、サプライズ null なし、`catch (Exception e)` のセーフティネットなし。見て、処理して、先へ進む。

## 次のステップ

- [Java 相互運用](/ja/guide/java-interop) — `safe`、`unsafe`、Java ライブラリとの連携の全容
- [Unsafe](/ja/guide/unsafe) — 危険に（責任を持って）生きたい時
