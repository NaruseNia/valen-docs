# Keywords

## Language Keywords

| Keyword | Purpose |
|---|---|
| `fn` | Function declaration |
| `let` | Variable binding |
| `mut` | Mutable variable / mutable field / mutable self |
| `self` | Instance receiver in methods |
| `return` | Early return from a function |
| `if` | Conditional expression |
| `else` | Alternate branch of `if` |
| `match` | Pattern matching expression |
| `class` | Class declaration |
| `data` | Data class modifier (context keyword — only keyword before `class`) |
| `enum` | Enum (ADT) declaration |
| `trait` | Trait declaration |
| `impl` | Trait implementation / inherent implementation block |
| `pub` | Public visibility modifier |
| `internal` | Same-module visibility (default) |
| `private` | Declaration-private visibility |
| `open` | Allows a class or method to be overridden |
| `override` | Overrides a parent class method |
| `abstract` | Abstract class or method (no body) |
| `sealed` | Closed hierarchy — `sealed class`, `sealed trait` |
| `package` | Package declaration (file header) |
| `import` | Import a type into scope |
| `for` | For loop (`for x in collection`) |
| `in` | Iterator binding in `for`; contravariant variance annotation |
| `while` | While loop |
| `loop` | Infinite loop (exit with `break`) |
| `break` | Exit a loop (optionally with a value) |
| `continue` | Skip to next loop iteration |
| `as` | Import alias (`import ... as`); type cast (`expr as Type`) |
| `safe` | Java exception-catching block (`safe { }`, `safe expr`, `safe?`) |
| `unsafe` | Bypass safety guarantees (`unsafe { }`, `unsafe fn`) |
| `ref` | Mutable reference creation (used as `ref mut`) |
| `inline` | Inline function modifier (body expanded at call site) |
| `reified` | Reified type parameter (context keyword — only in generic parameter position) |
| `annotation` | Annotation class declaration |
| `typealias` | Type alias (`typealias UserId = Int`) |
| `newtype` | Newtype wrapper (`newtype EntityId = Int`) |
| `type` | Associated type in traits (`type Item;`) |
| `true` | Boolean literal |
| `false` | Boolean literal |
| `out` | Covariant variance annotation |

## Reserved Keywords

These keywords are reserved for future use. They cannot be used as identifiers.

| Keyword | Planned Feature |
|---|---|
| `suspend` | Coroutine / structured concurrency |
| `async` | Asynchronous computation |
| `await` | Asynchronous result extraction |
| `yield` | Generator / coroutine yield |

## JVM Reserved Words

These Java keywords are not used by Valen but are **forbidden as identifiers** to prevent confusion and bytecode conflicts.

| Keyword | Java Meaning |
|---|---|
| `static` | Static members (Valen uses associated functions instead) |
| `void` | No return value (Valen uses `Unit`) |
| `this` | Instance reference (Valen uses `self`) |
| `super` | Parent class reference (Valen uses `super` only in method calls) |
| `null` | Null literal (Valen uses `Option<T>` / `None`) |
| `throw` | Throw an exception (forbidden in Valen) |
| `try` | Exception handling block |
| `catch` | Exception handler |
| `finally` | Cleanup block |
| `extends` | Class inheritance (Valen uses `:`) |
| `implements` | Interface implementation (Valen uses `impl`) |

::: tip
`new` is **not** a keyword in Valen and can be used as an identifier. Constructor calls use `ClassName(args)` syntax without `new`.
:::
