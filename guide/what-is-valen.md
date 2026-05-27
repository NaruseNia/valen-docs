# What is Valen?

Valen is an **ADT-first language for the JVM**. It gives you Rust-style algebraic data types, exhaustive pattern matching, and a coherent failure model — all while riding the massive Java ecosystem you already depend on.

If you've ever wanted `enum` to carry data, `match` to yell at you for missing a case, and `null` to simply *not exist* in your code, you're in the right place.

## The Four Pillars

Everything in Valen's design traces back to four core ideas:

### 1. Strong Algebraic Data Types

Valen's `enum` isn't a list of integer constants. It's a **sum type with payloads** — each variant can carry its own fields.

```valen
enum Shape {
    Circle(radius: Double),
    Rect(width: Double, height: Double),
    Point,
}

let s = Shape::Circle(radius = 3.14);
```

If you've used Rust enums or Haskell data types, this will feel like home. If you're coming from Java, think of it as sealed interfaces that don't make you write five files.

### 2. Exhaustive Pattern Matching

`match` in Valen covers the full Rust pattern set: literals, ranges, destructuring, or-patterns, guards, and `@`-bindings. The compiler checks that you handle every case — no sneaky runtime surprises.

```valen
match shape {
    Shape::Circle(r: radius) => 3.14159 * radius * radius,
    Shape::Rect(w: width, h: height) => width * height,
    Shape::Point => 0.0,
}
```

Forget a variant? That's a compile error. You're welcome.

### 3. Trait-Based Abstraction

Polymorphism in Valen comes from **traits**, not deep class hierarchies. A strict orphan rule keeps implementations honest — you can't retroactively bolt a trait onto someone else's type from a third-party module.

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

### 4. Coherent Failure Model

No more guessing whether to throw, return null, or panic. Valen gives each failure strategy exactly one job:

| Mechanism | Purpose |
|---|---|
| `Option<T>` | Value might be absent |
| `Result<T, E>` | Recoverable errors |
| `panic!` | Bugs, contract violations, "this should never happen" |
| `T?` (Nullable) | Java interop boundary — represents JVM null |

`throw` is **not a thing** in Valen code. If a Java method throws, you wrap it in `safe { ... }` and get a `Result` back. Clean and predictable.

::: tip Option vs Nullable
`Option<T>` and `T?` are **separate types** in Valen. `Option<T>` is a Valen-native ADT (`Some(T)` / `None`). `T?` is a nullable type for Java interop that represents JVM null. They are not interchangeable, and `T?` is *not* sugar for `Option<T>`.
:::

## Java Ecosystem? Just Use It.

Valen compiles to JVM bytecode and interoperates with Java directly. No wrappers, no codegen, no ceremony:

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

Java exceptions become `Result` via `safe { ... }`. The interop is intentionally boring — in the best way.

## JVM Target

- **JVM 21** is the baseline. That's the minimum your code will run on.
- **JVM 25** is available as an opt-in target for newer bytecode features.

## How Does It Compare?

Here's a quick, non-exhaustive, deliberately-opinionated snapshot:

| Feature | Java | Kotlin | Scala | **Valen** |
|---|---|---|---|---|
| ADTs (sum types) | Sealed classes (verbose) | Sealed classes | `enum` / case classes | **First-class `enum` with payloads** |
| Pattern matching | `switch` (limited) | `when` (no exhaustive on sealed) | Full match | **Full match, Rust-style** |
| Null safety | `Optional` / annotations | `?` nullable types | `Option` | **`Option<T>` + `T?` for Java interop** |
| Error model | Checked + unchecked exceptions | Unchecked only | Mixed | **Option / Result / panic** |
| Polymorphism | Interfaces + inheritance | Interfaces + inheritance | Traits + inheritance | **Traits with orphan rule** |
| Implicit conversions | Widening only | None | Yes (givens) | **None** |
| Extension functions | No | Yes | Yes (extensions) | **Phase 1.5** (traits + UFCS for now) |
| JVM interop | Native | Excellent | Good | **Direct** (`import` and go) |

::: tip Not here to replace Kotlin
Valen isn't trying to be "Kotlin but better." Kotlin is great at making Java less painful. Valen is for people who want ADTs, exhaustive match, and a strict failure model as **first-class citizens** on the JVM. Different tools for different vibes.
:::

## What's Next?

Ready to get your hands dirty? Head to [Getting Started](./getting-started) to install the compiler, or jump straight to [Hello, Valen](./hello-valen) to see a real program.
