# Unsafe と Safe

Valen の型システムと失敗モデルは、あなたを安全に保つために懸命に働いてくれます — null は `Option` に、Java 例外は `Result` に、ダウンキャストには証明が必要。でも時には、コンパイラが知らないことをあなたが知っている場合があります。「ここは信じて」と伝える必要があるんです。

それが `unsafe` の役割です。安全保証からの明示的なオプトアウト。そして `safe` はその対になるもの — Java のワイルドな振る舞いを Valen の秩序ある型システムにラップする明示的なオプトインです。

## `safe { }` ブロック

`safe` ブロックは Java 例外をキャッチして `Result<T, JavaException>` にラップしてくれます。Java メソッドを呼ぶ標準的な方法ですね:

```valen
let result = safe { file.readString() };
// result: Result<String?, JavaException>
```

Java メソッドが成功すれば `Ok(value)` を、投げれば `Err(JavaException)` を取得します。Java の戻り値は自動的に `T?`（nullable）として型付けされます。Java メソッドは常に null を返す可能性があるので。

### 省略記法: `safe expr`

ワンライナーなら中括弧を省略できます:

```valen
let r = safe file.readString();  // Result<String?, JavaException>
```

`safe { file.readString() }` と完全に等価。

### `safe?` — 早期リターンとの組み合わせ

`safe? expr` は `safe { expr }?` を一発で — メソッドを呼んで、例外をラップして、`?` でアンラップ:

```valen
fn read_content(path: String) -> Result<String?, JavaException> {
    let text: String? = safe? Files.readString(Paths.get(path));
    // Java メソッドが投げていたら、既に Err をリターン済み
    Ok(text)
}
```

## `unsafe { }` ブロック

`unsafe` ブロックを使うと、Valen が通常禁止する操作を実行できます:

```valen
let pos: Position = unsafe { obj as Position };
```

ブロックは式 — 最後の式の値に評価されます。

### 省略記法

単一式なら中括弧を省略できます:

```valen
let pos: Position = unsafe obj as Position;
```

意味は同じ、句読点が少ないだけ。

## `unsafe` 内で許されること

`unsafe` ブロック内では3つのことが可能になります:

### 1. 未検査ダウンキャスト

通常、`obj as ConcreteType` は安全な変換（数値の拡張など）にのみ許可されます。`unsafe` 内ならセーフティネットなしでダウンキャストできます:

```valen
let shape: Any = get_something();
let circle: Circle = unsafe { shape as Circle };
// shape が実際に Circle でなければ: 実行時に ClassCastException
```

### 2. 例外処理のスキップ

`unsafe` 内の Java メソッド呼び出しは例外ラッピングを受けません。メソッドが投げたら、例外はそのまま伝搬します — `Result` なし、`Err` なし、ただのクラッシュ:

```valen
// safe 版 — 例外が Result になる
let content = safe { file.readString() };  // Result<String?, JavaException>

// unsafe 版 — 例外が爆発
let content: String = unsafe { file.readString() };  // String（か爆発）
```

### 3. null リテラルと Nullable 型

`null` リテラルは **`unsafe` ブロック内でのみ使用可能**。通常の Valen コードでは `Option<T>` で値の不在を表現する:

```valen
// unsafe 内でのみ null が使える
unsafe {
    let x: String? = null;  // OK
    if (x != null) {
        println(x.length());
    }
}

// let y: String? = null;  // ERROR: unsafe 外での null は禁止
```

`T?`（nullable 型）も `unsafe` ブロック内で Java interop のために直接操作可能:

```valen
// safe 版 — null は Option になる
let result = safe { map.get("key") };  // Result<Option<String>, JavaException>

// unsafe 版 — null は NPE リスク
let val: String = unsafe { map.get("key") };  // キーがなければ NPE
```

## `unsafe fn`

関数全体が unsafe 領域で動作する場合、関数自体をマークできます:

```valen
unsafe fn rawAccess(ptr: Long) -> Int {
    // 本体全体が暗黙的に unsafe
    // 内部で unsafe { } ブロックは不要
    ...
}
```

ここは注意してほしいんですが、`unsafe fn` の呼び出しには呼び出し側で `unsafe` ブロックが**必須**です:

```valen
let v = unsafe { rawAccess(ptr) };
```

こうすることで `unsafe fn` の呼び出しがすべて可視化・監査可能になります。コードレビュアーは `unsafe` を grep するだけで、保証が緩和されている箇所を全部見つけられるんです。

## `safe` vs `unsafe` 比較

| | `safe { expr }` | `unsafe { expr }` |
|---|---|---|
| **戻り値型** | `Result<T?, JavaException>` | `T`（非 nullable） |
| **例外** | キャッチされ `Err` にラップ | パススルー（クラッシュ） |
| **Null 処理** | `T?`（nullable） | `T`（NPE リスク） |
| **用途** | Java 呼び出しのデフォルト | 安全性を検証済みの場合 |

## `unsafe` を使うタイミング

短い答え: **ほぼ使わない**。正当なケースは:

- **型を既に検査済み**で、安全なダウンキャストが冗長な場合
- **Java API をラップ**していて、自分の使い方では null を返さず投げないと検証済みの場合
- **パフォーマンスクリティカルなホットパス**で `Result`/`Option` のオーバーヘッドが本当に問題になる場合（まず計測！）

## `unsafe` を使わないべき時

- 「この Java メソッドは null を返さないと思う」 — たぶん間違ってます、`safe` を使いましょう
- 「例外処理が冗長すぎる」 — `safe?` 省略記法を使ってみてください
- 「Option の match が書きたくない」 — `unwrapOr` か `map` がありますよ

::: warning 小さく保つ
`unsafe` ブロックはできるだけ狭くしてください — 理想的には式1つ。20行のコードを `unsafe { ... }` で囲んでいるなら再考を。目標は危険な操作を分離することであって、安全システムを丸ごと無効化することじゃありません。
:::

## クイックリファレンス

| 操作 | 安全な方法 | Unsafe な方法 |
|---|---|---|
| Java メソッド呼び出し | `safe { method() }` | `unsafe { method() }` |
| Java メソッド + `?` | `safe? method()` | — |
| Null 処理 | `T?`（nullable） | `T`（NPE リスク） |
| ダウンキャスト | `unsafe` 外では不可 | `unsafe { obj as Type }` |
| 数値の拡張 | `42 as Long`（`unsafe` 不要） | — |
| `unsafe fn` の呼び出し | — | `unsafe { dangerousFn() }` |

## 次のステップ

- [アノテーション](/ja/guide/annotations) — 型やフィールドへのカスタムメタデータ
- [エラーハンドリング](/ja/guide/error-handling) — 失敗を安全に処理する方法
