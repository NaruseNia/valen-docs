# Valenとは？

Valenは**JVM向けのADTファーストな言語**です。Rustスタイルの代数的データ型、網羅的パターンマッチ、一貫した失敗モデルを備えながら、すでに使っているJavaの巨大なエコシステムをそのまま活かせます。

`enum` にデータを持たせたい、`match` でケースの漏れをちゃんと怒ってほしい、`null` をコードから消し去りたい — そう思ったことがあるなら、ここが正しい場所です。

## 4つの柱

Valenの設計はすべて、4つの核となるアイデアに基づいています。

### 1. 強力な代数的データ型

Valenの `enum` は整数定数のリストじゃありません。**ペイロード付きの直和型**で、各バリアントが独自のフィールドを持てます。

```valen
enum Shape {
    Circle(radius: Double),
    Rect(width: Double, height: Double),
    Point,
}

let s = Shape::Circle(radius = 3.14);
```

Rustのenumやhaskellのデータ型を使ったことがあるなら、おなじみの感覚ですね。Javaから来た人は、5つのファイルを書かなくていいsealed interfaceだと思ってください。

### 2. 網羅的パターンマッチ

Valenの `match` はRustのパターンセットをフルカバーします。リテラル、範囲、分解（destructuring）、or-パターン、ガード、`@`-バインディング。コンパイラがすべてのケースを処理しているかチェックするので、実行時に不意を突かれることはありません。

```valen
match shape {
    Shape::Circle(r: radius) => 3.14159 * radius * radius,
    Shape::Rect(w: width, h: height) => width * height,
    Shape::Point => 0.0,
}
```

バリアントを忘れた？コンパイルエラーです。どういたしまして。

### 3. traitベースの抽象化

Valenの多相性は深いクラス階層ではなく**trait**から得られます。厳格なオーファンルールが実装を正直に保ちます — サードパーティモジュールの型に対して、外部からtraitを後付けすることはできません。

```valen
trait Area {
    fn area(self) -> Double;
}

impl Area for Shape {
    fn area(self) -> Double {
        match self {
            Shape::Circle(r: radius) => 3.14159 * radius * radius,
            Shape::Rect(w: width, h: height) => width * height,
            Shape::Point => 0.0,
        }
    }
}
```

### 4. 一貫した失敗モデル

throwするのか、nullを返すのか、panicするのか — もう迷わなくて大丈夫です。Valenでは各失敗戦略に明確な役割があります。

| メカニズム | 用途 |
|---|---|
| `Option<T>` | 値が存在しない可能性がある |
| `Result<T, E>` | 回復可能なエラー |
| `panic!` | バグ、契約違反、「これは絶対に起きないはず」 |
| `T?` (Nullable) | Java相互運用の境界 — JVMのnullを表す |

Valenのコードに `throw` は**存在しません**。Javaのメソッドがthrowする場合は `safe { ... }` でラップすれば `Result` が返ってきます。クリーンで予測可能。

::: tip OptionとNullableの違い
`Option<T>` と `T?` はValenにおいて**別の型**です。`Option<T>` はValenネイティブのADT（`Some(T)` / `None`）。`T?` はJava相互運用のためのnullable型で、JVMのnullを表します。互換性はなく、`T?` は `Option<T>` の糖衣構文*ではありません*。
:::

## Javaエコシステム？そのまま使えます。

ValenはJVMバイトコードにコンパイルされ、Javaと直接相互運用します。ラッパーもコード生成も儀式も不要です。

```valen
package com.example.app;

import java.util.List;
import java.util.HashMap;

fn main() {
    let items = List.of("one", "two", "three");
    for item in items {
        println(item);
    }
}
```

Javaの例外は `safe { ... }` を通じて `Result` になります。相互運用は意図的に退屈 — いい意味で。

## JVMターゲット

- **JVM 21** がベースライン。コードが動作する最低バージョンです。
- **JVM 25** はオプトインターゲットとして利用可能。新しいバイトコード機能を使えます。

## 他の言語との比較

簡潔で、網羅的ではない、意図的に偏った比較表です。

| 機能 | Java | Kotlin | Scala | **Valen** |
|---|---|---|---|---|
| ADT（直和型） | Sealedクラス（冗長） | Sealedクラス | `enum` / caseクラス | **ペイロード付きファーストクラスの `enum`** |
| パターンマッチ | `switch`（限定的） | `when`（sealedで網羅性なし） | フルmatch | **フルmatch、Rustスタイル** |
| Null安全性 | `Optional` / アノテーション | `?` nullable型 | `Option` | **`Option<T>` + Java相互運用の `T?`** |
| エラーモデル | 検査例外 + 非検査例外 | 非検査例外のみ | 混合 | **Option / Result / panic** |
| 多相性 | インターフェース + 継承 | インターフェース + 継承 | trait + 継承 | **オーファンルール付きtrait** |
| 暗黙の変換 | 拡大変換のみ | なし | あり（givens） | **なし** |
| 拡張関数 | なし | あり | あり（extensions） | **Phase 1.5**（現時点ではtrait + UFCS） |
| JVM相互運用 | ネイティブ | 優秀 | 良好 | **直接**（`import` するだけ） |

::: tip Kotlinの代替を目指しているわけではない
Valenは「Kotlinだけどもっと良い」を目指しているわけじゃありません。KotlinはJavaの痛みを和らげるのに優れています。Valenは、ADT、網羅的match、厳格な失敗モデルをJVM上で**ファーストクラスの市民**として求める人のための言語です。違うツールで、違う方向性。
:::

## 次のステップ

手を動かす準備はできましたか？[はじめに](/ja/guide/getting-started)でコンパイラをインストールするか、[Hello, Valen](/ja/guide/hello-valen)に直接進んで実際のプログラムを見てみましょう。
