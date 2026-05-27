---
layout: home

hero:
  name: Valen
  text: JVM に本物の ADT を。
  tagline: 強い代数的データ型、exhaustive match、trait ベースの抽象化、整合した失敗モデル。Java エコシステムに乗りながら、妥協しない言語です。
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
    details: "enum は Rust スタイルのペイロード付き sum type です。match は exhaustive で、コンパイラがケースの漏れを見逃しません。"
  - icon: 🔗
    title: trait ベースの抽象化
    details: "ポリモーフィズムにクラス階層は要りません。orphan rule 付きの trait が、コードベースの整合性を守ります。"
  - icon: 🛡️
    title: 整合したエラーハンドリング
    details: "Option は欠損、Result は回復可能エラー、panic はバグ、Exception は Java FFI。それぞれに1つだけの役割があります。"
  - icon: ☕
    title: Java 連携
    details: "import java.util.List — そのまま動きます。Java 例外は Result に、null は T? に変換されます。"
  - icon: ⚡
    title: inline と reified ジェネリクス
    details: "inline fn でラムダのボクシングを排除します。reified 型パラメータはイレイジャーを生き延び、実行時の instanceof とキャストが使えます。"
  - icon: 🔧
    title: ツール同梱
    details: "補完・ホバー・診断付きの LSP サーバーを同梱しています。JVM 21 ベースライン、JVM 25 オプトイン。"
---
