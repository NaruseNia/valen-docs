# Keywords

## Language Keywords

These are unconditionally consumed as dedicated tokens by the lexer and **cannot** be used as identifiers.

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
| `data` | Data class modifier (`data class`). The lexer treats `data` as a full keyword (`Data` token) in all positions, not a context keyword. |
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
| `reified` | Reified type parameter (preserves concrete type through erasure). The lexer treats `reified` as a full keyword (`Reified` token) in all positions, not a context keyword. |
| `annotation` | Annotation class declaration |
| `typealias` | Type alias (`typealias UserId = Int`) |
| `newtype` | Newtype wrapper (`newtype EntityId = Int`) |
| `type` | Associated type in traits (`type Item;`) |
| `true` | Boolean literal |
| `false` | Boolean literal |
| `out` | Covariant variance annotation |

## Reserved Keywords

These keywords are reserved for future use. The lexer generates dedicated tokens for them, but the parser does not currently accept them. They **cannot** be used as identifiers.

| Keyword | Planned Feature |
|---|---|
| `suspend` | Coroutine / structured concurrency |
| `async` | Asynchronous computation |
| `await` | Asynchronous result extraction |
| `yield` | Generator / coroutine yield |

## JVM Reserved Words

These Java keywords are not used by Valen but are **forbidden as identifiers** to prevent confusion and bytecode conflicts.

| Keyword | Note |
|---|---|
| `static` | Valen uses associated functions (no `self` receiver) instead of `static` members |
| `void` | Valen uses `Unit` |
| `this` | Valen uses `self` |
| `super` | Reserved for JVM compatibility. Valen does not currently expose `super` for parent-class dispatch. |
| `null` | No null literal in Valen. JVM null is handled through `T?` (Nullable) and Java interop. |
| `throw` | Valen uses `Result<T, E>` and `safe {}` for error handling |
| `try` | Valen uses `safe {}` blocks |
| `catch` | Valen uses `safe {}` blocks |
| `finally` | Not applicable in Valen's error model |
| `extends` | Valen uses `:` for class inheritance |
| `implements` | Valen uses `impl` for trait implementations |

::: tip
`new` is **not** a keyword in Valen and can be used as an identifier. The lexer recognizes `new` but maps it to `Ident("new")`. Constructor calls use `ClassName(args)` syntax without `new`.
:::

## Operators and Sigils

### Arithmetic Operators

| Operator | Description |
|----------|-------------|
| `+` | Addition |
| `-` | Subtraction / unary negation |
| `*` | Multiplication / deref |
| `/` | Division |
| `%` | Remainder |

### Comparison Operators

| Operator | Description |
|----------|-------------|
| `==` | Structural equality (`.equals()`) |
| `!=` | Structural inequality |
| `===` | Reference identity (JVM reference check) |
| `!==` | Reference non-identity |
| `<` | Less than |
| `<=` | Less than or equal |
| `>` | Greater than |
| `>=` | Greater than or equal |

### Logical Operators

| Operator | Description |
|----------|-------------|
| `&&` | Logical AND (short-circuit) |
| `\|\|` | Logical OR (short-circuit) |
| `!` | Logical NOT |

### Bitwise Operators

| Operator | Description |
|----------|-------------|
| `&` | Bitwise AND |
| `\|` | Bitwise OR |
| `^` | Bitwise XOR |
| `<<` | Left shift |
| `>>` | Right shift |

### Assignment Operators

| Operator | Description |
|----------|-------------|
| `=` | Assignment |
| `+=` | Addition assignment |
| `-=` | Subtraction assignment |
| `*=` | Multiplication assignment |
| `/=` | Division assignment |
| `%=` | Remainder assignment |

### Range Operators

| Operator | Description |
|----------|-------------|
| `..` | Exclusive range |
| `..=` | Inclusive range |

### Pipeline and Arrows

| Operator | Description |
|----------|-------------|
| `\|>` | Pipeline operator |
| `->` | Return type arrow |
| `=>` | Match arm arrow |

### Sigils

| Sigil | Description |
|-------|-------------|
| `?` | Try operator — propagates `Err`/`None` with early return. Works on `Option<T>` and `Result<T, E>` only. |
| `@` | Annotation sigil. Reserved for annotation syntax (`@AnnotationName`). Currently not user-writable; using `@` before an identifier causes a parser error. |
| `#` | Attribute sigil. Used in map literals (`#{}`). |
| `_` | Wildcard pattern / placeholder. A dedicated token, not an identifier. |

### Delimiters

| Token | Description |
|-------|-------------|
| `(` `)` | Parentheses (function calls, grouping) |
| `{` `}` | Braces (blocks, class/enum/trait bodies) |
| `[` `]` | Brackets (list literals, indexing) |

### Separators

| Token | Description |
|-------|-------------|
| `,` | Element separator |
| `;` | Statement terminator |
| `:` | Type annotation separator |
| `::` | Path separator |
| `.` | Field access / method call |

### Lexer Precedence

Three-character tokens (`===`, `!==`, `..=`) are matched before two-character tokens (`==`, `!=`, `..`, `->`, `=>`, `<=`, `>=`, `<<`, `>>`, `&&`, `||`, `|>`, `::`, `+=`, `-=`, `*=`, `/=`, `%=`), which are matched before single-character tokens. This follows a longest-match rule.
