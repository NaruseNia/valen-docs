# Hello, Valen

Time to write a real program. We'll build a small task tracker that shows off the features that make Valen tick: data classes, enums, traits, pattern matching, and the failure model. By the end, you'll have a working mental model of how Valen code is structured.

## The Full Program

Here's everything at once. Don't worry — we'll walk through each piece below.

```valen
package com.example.tasks;

import java.util.List;

// -- Data modeling --

enum Priority {
    Low,
    Medium,
    High,
    Critical(reason: String),
}

data class Task(
    pub title: String,
    pub priority: Priority,
    pub done: Bool,
);

// -- Trait definition --

trait Summarize {
    fn summary(self) -> String;
}

// -- Trait implementation --

impl Summarize for Task {
    fn summary(self) -> String {
        let status = if self.done { "done" } else { "todo" };
        let prio = match self.priority {
            Priority::Low => "low",
            Priority::Medium => "med",
            Priority::High => "HIGH",
            Priority::Critical(reason) => f"CRITICAL: {reason}",
        };
        f"[{status}] {self.title} ({prio})"
    }
}

// -- Helper function with Result --

fn find_critical(tasks: List<Task>) -> Result<Task, String> {
    for task in tasks {
        if let Priority::Critical(_) = task.priority {
            return Result::Ok(task);
        }
    }
    Result::Err("no critical tasks found")
}

// -- Entry point --

fn main() {
    let tasks = List.of(
        Task(title = "Write docs", priority = Priority::Low, done = true),
        Task(title = "Fix bug #42", priority = Priority::High, done = false),
        Task(title = "Deploy to prod", priority = Priority::Critical(reason = "deadline Friday"), done = false),
    );

    for task in tasks {
        println(task.summary());
    }

    match find_critical(tasks) {
        Result::Ok(t) => println(f"\nAlert: {t.title} needs attention!"),
        Result::Err(msg) => println(f"\nAll clear: {msg}"),
    }
}
```

## Let's Break It Down

### Package Declaration

```valen
package com.example.tasks;
```

Every Valen file starts with a `package` declaration. It's mandatory — no package, no compile. The package maps to the directory structure, just like Java. Source files use the `.vln` extension and must be encoded in UTF-8.

### Imports

```valen
import java.util.List;
```

Yes, that's a Java import. It just works. `List.of(...)` calls the real `java.util.List.of()` under the hood. No wrappers, no adapters, no boilerplate. This is what "riding the Java ecosystem" looks like in practice.

### Enum (ADT)

```valen
enum Priority {
    Low,
    Medium,
    High,
    Critical(reason: String),
}
```

This is **not** your grandfather's Java enum. Each variant can carry data — `Critical` holds a `reason` string while `Low`, `Medium`, and `High` carry nothing. It's a proper sum type: the compiler knows exactly which shapes `Priority` can take, and it will make sure you handle all of them.

### Data Class

```valen
data class Task(
    pub title: String,
    pub priority: Priority,
    pub done: Bool,
);
```

A `data class` auto-generates `equals`, `hashCode`, `toString`, and `copy`. It also implicitly satisfies the `Eq`, `Hash`, `Display`, and `Clone` traits. The `pub` keyword makes fields readable from outside. Without it, fields are private to the class.

No getters. No setters. No `val` vs `var` debate. Just `pub` for visible, nothing for private, and `pub mut` if you need mutability.

### Trait

```valen
trait Summarize {
    fn summary(self) -> String;
}
```

Traits define shared behavior. If you know Rust traits or Haskell typeclasses, this is the same idea. If you're coming from Java/Kotlin, think of it as an interface — but with stricter rules about who can implement it for what.

### Trait Implementation

```valen
impl Summarize for Task {
    fn summary(self) -> String {
        let status = if self.done { "done" } else { "todo" };
        let prio = match self.priority {
            Priority::Low => "low",
            Priority::Medium => "med",
            Priority::High => "HIGH",
            Priority::Critical(reason) => f"CRITICAL: {reason}",
        };
        f"[{status}] {self.title} ({prio})"
    }
}
```

A few things to notice:

- **`impl Trait for Type`** is written *outside* the class/data class body. This separates data definition from behavior.
- **`if` is an expression** — it returns a value, so you can assign it directly to `let status`.
- **`match` is exhaustive** — the four arms cover all four variants of `Priority`. Remove one and the compiler will complain.
- **`f"..."`** is a format string. Expressions inside `{...}` are interpolated.

### Functions and the Result Type

```valen
fn find_critical(tasks: List<Task>) -> Result<Task, String> {
    for task in tasks {
        if let Priority::Critical(_) = task.priority {
            return Result::Ok(task);
        }
    }
    Result::Err("no critical tasks found")
}
```

This function returns `Result<Task, String>` — either an `Ok` with a task, or an `Err` with a message. No exceptions, no nulls.

`if let` destructures a single pattern without a full `match`. The `_` means "I don't care about the reason field right now."

Notice the last line has no `return` — Valen is expression-oriented, so the final expression in a block is its value.

### The main Function

```valen
fn main() {
    let tasks = List.of(
        Task(title = "Write docs", priority = Priority::Low, done = true),
        Task(title = "Fix bug #42", priority = Priority::High, done = false),
        Task(title = "Deploy to prod", priority = Priority::Critical(reason = "deadline Friday"), done = false),
    );

    for task in tasks {
        println(task.summary());
    }

    match find_critical(tasks) {
        Result::Ok(t) => println(f"\nAlert: {t.title} needs attention!"),
        Result::Err(msg) => println(f"\nAll clear: {msg}"),
    }
}
```

`fn main()` is the entry point. No class wrapping, no `static`, no `Array<String>` — just a top-level function.

Named arguments (`title = "Write docs"`) make construction readable without needing a builder. The `match` at the end handles both `Ok` and `Err` paths — again, exhaustively.

## Compile and Run

Save the code as `src/com/example/tasks/main.vln`, then:

```sh
valenc src/com/example/tasks/main.vln
java -cp . com.example.tasks.Main
```

Expected output:

```
[done] Write docs (low)
[todo] Fix bug #42 (HIGH)
[todo] Deploy to prod (CRITICAL: deadline Friday)

Alert: Deploy to prod needs attention!
```

## Quick Recap

In about 50 lines, you've seen:

| Feature | What you used |
|---|---|
| **Package & imports** | `package`, `import java.util.List` |
| **Enum (ADT)** | `Priority` with payload variant |
| **Data class** | `Task` with auto-generated methods |
| **Trait + impl** | `Summarize` implemented for `Task` |
| **Pattern matching** | `match` on enum, `if let` for single-pattern |
| **Result type** | `Result::Ok` / `Result::Err` instead of exceptions |
| **Expression-oriented** | `if` and `match` as expressions |
| **Format strings** | `f"..."` interpolation |
| **Java interop** | `List.of(...)` from `java.util.List` |

## What's Next?

Now that you've seen the big picture, it's time to dig into the details:

- **[Variables & Types](./variables-and-types)** — primitives, type inference, and why there's no implicit conversion
- **[Functions](./functions)** — named args, default params, UFCS, and how `self` works
- **[Enums & ADTs](./enums)** — variant shorthands, sealed classes, and when to use which
- **[Traits](./traits)** — orphan rules, coherence, and inherent impls
- **[Error Handling](./error-handling)** — the `?` operator, `safe { ... }`, and the full failure model

Happy hacking.
