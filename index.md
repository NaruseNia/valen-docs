---
layout: home

hero:
  name: Valen
  text: ADTs on the JVM, done right.
  tagline: Strong algebraic data types, exhaustive match, trait-based abstraction, and a sane failure model — riding the Java ecosystem without fighting it.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/NaruseNia/valen-lang

features:
  - icon: 🧱
    title: Real ADTs
    details: "enum is a Rust-style sum type with payloads. match is exhaustive — the compiler won't let you forget a case."
  - icon: 🔗
    title: Trait-based Abstraction
    details: "No class hierarchies for polymorphism. Traits with strict orphan rules keep your codebase honest."
  - icon: 🛡️
    title: Coherent Error Handling
    details: "Option for absence, Result for recoverable errors, panic for bugs, Exception for Java FFI. Each has exactly one job."
  - icon: ☕
    title: Java Interop
    details: "import java.util.List — it just works. Java exceptions become Result, null becomes Option. No magic, no surprises."
  - icon: ⚡
    title: Inline & Reified Generics
    details: "inline fn eliminates lambda boxing. reified type parameters survive erasure — instanceof, casts, and class literals at runtime."
  - icon: 🔧
    title: Batteries Included
    details: "LSP server with completions, hover, and diagnostics. Code formatter. JVM 21 baseline with JVM 25 opt-in."
---
