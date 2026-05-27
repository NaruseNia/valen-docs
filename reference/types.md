# Types

## Primitive Types

| Type      | Size    | JVM Mapping              | Default Literal |
|-----------|---------|--------------------------|-----------------|
| `Int`     | 32-bit  | `int` / `java.lang.Integer`   | `42`       |
| `Long`    | 64-bit  | `long` / `java.lang.Long`     | `42L`      |
| `Float`   | 32-bit  | `float` / `java.lang.Float`   | `3.14f`    |
| `Double`  | 64-bit  | `double` / `java.lang.Double` | `3.14`     |
| `Bool`    | 1-bit   | `boolean` / `java.lang.Boolean` | `true`   |
| `Char`    | 16-bit  | `char` / `java.lang.Character` | `'a'`     |
| `Byte`    | 8-bit   | `byte` / `java.lang.Byte`     | —          |
| `Short`   | 16-bit  | `short` / `java.lang.Short`   | —          |
| `String`  | —       | `java.lang.String`             | `"hello"`  |
| `Unit`    | —       | `void` (return) / singleton (value) | —    |
| `Nothing` | —       | ⊥ (bottom type, no instances)  | —          |
| `Any`     | —       | `java.lang.Object`             | —          |

- `Any` is the top type. Every type is implicitly a subtype of `Any`. Upcasting to `Any` is implicit (boxing occurs for primitives).
- `Nothing` is the bottom type. It is the return type of expressions that never complete (`panic`, infinite `loop`, `return`).
- `Unit` is the zero-value type, analogous to `void`. Functions with no meaningful return value return `Unit`. `-> Unit` may be omitted from signatures.

## Numeric Literals

| Base    | Prefix | Example              | Type  |
|---------|--------|----------------------|-------|
| Decimal | (none) | `42`, `1_000_000`    | `Int` |
| Hex     | `0x`   | `0xFF`, `0x1A_2B`    | `Int` |
| Binary  | `0b`   | `0b1010`, `0b1111_0000` | `Int` |
| Octal   | `0o`   | `0o77`, `0o755`      | `Int` |

### Suffixes

| Suffix | Effect           | Example   |
|--------|------------------|-----------|
| `L`    | Promotes to `Long`  | `42L`, `0xFFL` |
| `f`    | Promotes to `Float` | `3.14f`  |

- Underscore `_` separators are allowed anywhere within numeric literals: `1_000_000`, `0xFF_FF`.
- An unsuffixed integer literal defaults to `Int` (must fit i32 range).
- An unsuffixed floating-point literal defaults to `Double`.

## Numeric Conversions

**There are no implicit numeric conversions.** All conversions require an explicit method call.

| Method       | From → To                  |
|--------------|----------------------------|
| `.toInt()`   | any numeric → `Int`        |
| `.toLong()`  | any numeric → `Long`       |
| `.toFloat()` | any numeric → `Float`      |
| `.toDouble()`| any numeric → `Double`     |
| `.toByte()`  | any numeric → `Byte`       |
| `.toShort()` | any numeric → `Short`      |
| `.toChar()`  | any numeric → `Char`       |

```valen
let x: Long = 42.toLong();       // OK
let y: Long = 42;                // ERROR: type mismatch
let z: Double = 3.14f.toDouble(); // OK
```

## Option\<T\> / T?

`Option<T>` represents an optional value. `T?` is syntactic sugar for `Option<T>`.

| Variant     | Meaning          |
|-------------|------------------|
| `Some(value)` | Value is present |
| `None`        | Value is absent  |

- There is no `null` literal in Valen.
- `T!` (platform type) is internal-only — not user-writable, used only for IDE display.

```valen
let name: String? = Some("Alice");
let missing: Option<Int> = None;
```

## Result\<T, E\>

`Result<T, E>` represents a recoverable computation. `E` must implement the `Error` trait.

| Variant    | Meaning             |
|------------|---------------------|
| `Ok(value)` | Success             |
| `Err(error)` | Failure (recoverable) |

```valen
fn parse(s: String) -> Result<Int, ParseError> {
    // ...
}
```

The `?` operator propagates `Err` with early return. See [Error Handling](/guide/error-handling) for details.

## ref mut T

`ref mut T` is a mutable reference to `T`. There is no implicit conversion between `T` and `ref mut T`.

| Syntax          | Meaning                        |
|-----------------|--------------------------------|
| `ref mut expr`  | Create a mutable reference     |
| `*r`            | Read through the reference     |
| `*r = expr`     | Write through the reference    |

```valen
let mut n = 10;
let r = ref mut n;
*r = *r + 1;   // n is now 11
```

`ref mut T` is Valen-internal only and cannot be passed to Java methods.

## typealias vs newtype

| Feature          | `typealias`                     | `newtype`                          |
|------------------|---------------------------------|------------------------------------|
| Creates new type | No (transparent alias)          | Yes (distinct nominal type)        |
| Orphan rule      | Treated as the original type    | Treated as own type (can impl traits) |
| Construction     | None needed                     | `TypeName(value)`                  |
| Access inner     | Direct                          | `.value()`                         |

```valen
typealias UserId = Int;     // just an alias, no new type
newtype EntityId = Int;     // distinct type, can impl traits
let eid = EntityId(42);
let raw = eid.value();      // 42
```

## Equality Operators

| Operator | Semantics           | Desugars to         |
|----------|---------------------|----------------------|
| `==`     | Structural equality | `.equals()`          |
| `!=`     | Structural inequality | `!.equals()`       |
| `===`    | Reference identity  | JVM reference check  |
| `!==`    | Reference non-identity | JVM reference check |
