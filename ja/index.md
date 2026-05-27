---
layout: home

hero:
  name: Valen
  text: JVM に本物の ADT を。
  tagline: 強い代数的データ型、exhaustive match、trait ベースの抽象化、整合した失敗モデル — Java エコシステムに乗りながら、妥協しない。
  actions:
    - theme: brand
      text: はじめる
      link: /ja/guide/getting-started
    - theme: alt
      text: GitHub で見る
      link: https://github.com/NaruseNia/valen-lang

features:
  - icon: 🧱
    title: 本物の ADT
    details: "enum は Rust スタイルのペイロード付き sum type。match は exhaustive — コンパイラがケースの漏れを許さない。"
  - icon: 🔗
    title: trait ベースの抽象化
    details: "ポリモーフィズムにクラス階層は不要。orphan rule 付き trait がコードベースを誠実に保つ。"
  - icon: 🛡️
    title: 整合したエラーハンドリング
    details: "Option は欠損、Result は回復可能エラー、panic はバグ、Exception は Java FFI。それぞれに 1 つだけの役割。"
  - icon: ☕
    title: Java 連携
    details: "import java.util.List — そのまま動く。Java 例外は Result に、null は T? に。魔法なし、驚きなし。"
  - icon: ⚡
    title: inline と reified ジェネリクス
    details: "inline fn でラムダのボクシングを排除。reified 型パラメータはイレイジャーを生き延びる — 実行時の instanceof とキャスト。"
  - icon: 🔧
    title: ツール同梱
    details: "補完・ホバー・診断付き LSP サーバー。コードフォーマッタ。JVM 21 ベースライン、JVM 25 オプトイン。"
---
