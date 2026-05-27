# 文字列

Valenの文字列はシンプルです。意図的にそうしています。2分で読めて、ずっと覚えているページになるはず。

## 文字列リテラル

文字列はダブルクォートで囲まれ、イミュータブルで、JVM上では `java.lang.String` がバックエンドです。

```valen
let greeting = "Hello, world!";
```

### エスケープシーケンス

文字列は以下のエスケープシーケンスをサポートしています:

| エスケープ | 意味             |
|-----------|------------------|
| `\\`      | バックスラッシュ |
| `\n`      | 改行（LF）       |
| `\r`      | キャリッジリターン（CR） |
| `\t`      | タブ             |
| `\"`      | ダブルクォート   |
| `\0`      | NUL文字          |

```valen
let path = "C:\\Users\\valen";
let multiline = "line one\nline two";
let quoted = "She said \"hi\"";
let with_nul = "terminated\0here";
```

その他のバックスラッシュ + 文字の組み合わせ（`\x` など）は現在そのまま通過します（バックスラッシュと後続文字の両方が保持されます）。この挙動は将来的により厳格になる可能性があります。

## 文字リテラル

単一文字にはシングルクォートを使います。同じエスケープシーケンスをサポートしていますが、`\"` の代わりに `\'` を使います:

```valen
let ch = 'A';
let newline = '\n';
let tab = '\t';
let nul = '\0';
let single_quote = '\'';
let backslash = '\\';
```

## f-string: 文字列補間

文字列の前に `f` を付けて `{ }` 内に式を書きます。あとはコンパイラにお任せ。

```valen
let name = "Alice";
let age = 30;

let msg = f"Hello, {name}!";                // "Hello, Alice!"
let info = f"{name} is {age} years old.";    // "Alice is 30 years old."
let math = f"1 + 2 = {1 + 2}";              // "1 + 2 = 3"
```

ブレース内では変数参照、フィールドアクセス、メソッドチェーン、単純な二項式が使えます:

```valen
let user = get_user(1);
let label = f"User: {user.name}, score: {user.score * 2}";
```

::: tip fとクォートの間にスペースを入れない
`f"..."` は単一のトークンです。`f "..."` と書くと、レキサーは識別子 `f` の後に通常の文字列が続いていると見なします — f-stringにはなりません。
:::

### f-string内のブレースのエスケープ

f-string内にリテラルの `{` や `}` が必要な場合はバックスラッシュでエスケープします:

```valen
let json_ish = f"\{\"name\": \"{name}\"\}";
// {"name": "Alice"}
```

### f-stringの制限

f-stringは意図的にシンプルに保っています:

- `{ }` 内に**ブロック式は使えません**。`f"{ let x = 1; x + 2 }"` のようには書けません。
- **ネストしたf-stringも不可。** `f"outer {f"inner"}"` は許可されていません。
- 単純な式にとどめてください。補間に複数行のロジックが必要なら、事前に計算して結果を補間しましょう。

```valen
// ブレース内で凝りすぎない
let result = compute_something();
let msg = f"The answer is {result}";   // クリーンで明快
```

### f-stringエスケープ一覧

f-stringは標準の文字列エスケープに加えてブレースのエスケープをサポートしています:

| エスケープ | 意味                  |
|-----------|----------------------|
| `\\`      | バックスラッシュ     |
| `\n`      | 改行（LF）           |
| `\r`      | キャリッジリターン（CR） |
| `\t`      | タブ                 |
| `\"`      | ダブルクォート       |
| `\0`      | NUL文字              |
| `\{`      | リテラルの `{`       |
| `\}`      | リテラルの `}`       |

## イミュータビリティ

`String` はイミュータブルです。言語自体にはStringBuilderやミュータブルな文字列型はありません — 必要なら、Java相互運用で `java.lang.StringBuilder` を使ってください。

```valen
let s = "hello";
// s[0] = 'H';    // 不可 — 文字列はイミュータブル
```

`+` による文字列連結は使えますが、毎回新しい文字列が作られます。些細なケース以外では、f-stringか `StringBuilder` を使いましょう。

---

**次:** [クラス](/ja/guide/classes) — 実際のデータをモデリングする時間です。
