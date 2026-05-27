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
| `Unit`    | —       | `void` (return) / `()` (value position) | `()` |
| `Nothing` | —       | ⊥ (bottom type, no instances)  | —          |
| `Any`     | —       | `java.lang.Object`             | —          |

- `Any` is the top type. Every type is implicitly a subtype of `Any`. Upcasting to `Any` is implicit (boxing occurs for primitives).
- `Nothing` is the bottom type. It is the return type of expressions that never complete (`panic`, infinite `loop`, `return`).
- `Unit` is the zero-value type, analogous to `void`. Functions with no meaningful return value return `Unit`. The `-> Unit` return annotation may be omitted from signatures. The unit literal is `()`.

## Subtyping Rules

The type checker enforces the following subtyping relationships:

| Rule | Description |
|------|-------------|
| Reflexivity | `T` is a subtype of `T` |
| Any | Every type is a subtype of `Any` |
| Nullable | `T` is a subtype of `T?` |
| Nothing | `Nothing` is a subtype of every type |
| TypeParam | A concrete type matches a `TypeParam` (resolved at call site) |

```valen
let x: Any = 42;           // Int → Any (implicit upcast)
let y: Int? = 42;           // Int → Int? (implicit upcast)
```

Downcasts require an explicit `as` cast inside an `unsafe` context.

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

## Character Literals

Single-quoted character literals produce a `Char` value.

```valen
let a = 'A';
let newline = '\n';
let nul = '\0';
```

Supported escape sequences: `\n` `\t` `\r` `\\` `\'` `\0`.

## Numeric Conversions

**There are no implicit numeric conversions.** All conversions require an explicit method call.

### Conversion Methods

Each type only provides the conversions listed below. Calling a method not listed for a type is a compile error.

| Type | Available Conversion Methods |
|------|------------------------------|
| `Int` | `.toLong()`, `.toFloat()`, `.toDouble()` |
| `Long` | `.toInt()`, `.toFloat()`, `.toDouble()` |
| `Float` | `.toInt()`, `.toLong()`, `.toDouble()` |
| `Double` | `.toInt()`, `.toLong()`, `.toFloat()` |
| `Byte` | `.toInt()`, `.toLong()`, `.toFloat()`, `.toDouble()`, `.toShort()` |
| `Short` | `.toInt()`, `.toLong()`, `.toFloat()`, `.toDouble()`, `.toByte()` |
| `Char` | `.toInt()`, `.toLong()`, `.toFloat()`, `.toDouble()` |

::: warning
`.toChar()` does not exist on any type. `.toByte()` is only available on `Short`, and `.toShort()` is only available on `Byte`.
:::

```valen
let x: Long = 42.toLong();       // OK
let y: Long = 42;                // ERROR: type mismatch
let z: Double = 3.14f.toDouble(); // OK
let w: Float = 42.toFloat();     // OK
```

### Numeric Casts with `as`

Explicit `as` casts between numeric types are also available. All numeric-to-numeric `as` casts are safe (no `unsafe` block required). `Char` to numeric casts are also safe.

```valen
let x = 42 as Long;    // OK (safe)
let c = 'A' as Int;    // OK (safe)
```

## Nullable Type (`T?`)

### `T?` and `Option<T>` Are Separate Types

Valen has **two distinct** representations for absent values:

| Type | Internal Representation | Purpose |
|------|-------------------------|---------|
| `T?` | `Ty::Nullable(Box<Ty>)` | A type that permits JVM null. Primarily used for Java interop. |
| `Option<T>` | `enum Option<T> { Some(T), None }` | Valen-native optional value. An algebraic data type. |

::: danger IMPORTANT
`T?` is **NOT** syntactic sugar for `Option<T>`. They are completely separate types in the type system. `T?` maps to JVM nullable references, while `Option<T>` is an ADT enum.
:::

### JVM Mapping of `T?`

`T?` maps to boxed JVM types (reference types that can hold null):

| Valen Type | JVM Type |
|------------|----------|
| `Int?` | `java/lang/Integer` |
| `Long?` | `java/lang/Long` |
| `Float?` | `java/lang/Float` |
| `Double?` | `java/lang/Double` |
| `Bool?` | `java/lang/Boolean` |
| `Char?` | `java/lang/Character` |
| `Byte?` | `java/lang/Byte` |
| `Short?` | `java/lang/Short` |
| `String?` | `java/lang/String` (already a reference type — no change) |

### The `?` Operator and Nullable

The `?` (try) operator works with `Option<T>` and `Result<T, E>` only. **It cannot be used on `T?` (Nullable).**

```valen
fn get_value() -> Option<Int> {
    Option::Some(42)
}

fn example() -> Option<Int> {
    let v = get_value()?;  // OK: ? on Option<Int>
    Option::Some(v + 1)
}
```

When using `?`, the enclosing function's return type must match:
- `?` on `Option<T>` → function must return `Option<..>`
- `?` on `Result<T, E>` → function must return `Result<..>`

### No `null` Literal

There is no `null` literal in Valen. JVM null is handled through Nullable types and Java interop only.

### Platform Type (`T!`)

`T!` is **not implemented** (reserved for future consideration). It is not user-writable.

## Option\<T\>

`Option<T>` is a standard-library ADT enum for optional values.

| Variant       | Meaning          |
|---------------|------------------|
| `Some(value)` | Value is present |
| `None`        | Value is absent  |

```valen
let name: Option<String> = Option::Some("Alice");
let missing: Option<Int> = Option::None;

// With variant shorthand (when type is known):
let name: Option<String> = .Some("Alice");
let missing: Option<Int> = .None;
```

## Result\<T, E\>

`Result<T, E>` represents a recoverable computation. `E` must implement the `Error` trait.

| Variant      | Meaning               |
|--------------|-----------------------|
| `Ok(value)`  | Success               |
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
fn increment(x: ref mut Int) -> Unit {
    *x = *x + 1;
}

let mut n = 10;
increment(ref mut n);
// n == 11
```

`ref mut T` is Valen-internal only and cannot be passed to Java methods.

### JVM Implementation

| Valen Type | JVM Class | Notes |
|------------|-----------|-------|
| `ref mut Int` | `valen/core/IntRef` | |
| `ref mut Byte` | `valen/core/IntRef` | Shares IntRef with Int |
| `ref mut Short` | `valen/core/IntRef` | Shares IntRef with Int |
| `ref mut Char` | `valen/core/IntRef` | Shares IntRef with Int |
| `ref mut Long` | `valen/core/LongRef` | |
| `ref mut Float` | `valen/core/FloatRef` | |
| `ref mut Double` | `valen/core/DoubleRef` | |
| `ref mut Bool` | `valen/core/BoolRef` | |
| `ref mut T` (object) | `valen/core/Ref` | |

::: info
`ref mut Byte`, `ref mut Short`, and `ref mut Char` all share `valen/core/IntRef` with `ref mut Int`.
:::

## Generics

Valen generics use `<T>` syntax with JVM erasure semantics.

```valen
class Box<T>(val value: T) {}

fn <T> identity(x: T) -> T {
    x
}
```

### Variance Annotations (`in`/`out`)

`in` (contravariant) and `out` (covariant) annotations are syntactically accepted but **not currently enforced** by the type checker. The parser records them, but no variance constraint checking is performed. Enforcement is planned for a future phase.

```valen
// Syntactically valid, but variance is not enforced yet
class Box<out T>(val value: T) {}
trait Consumer<in T> {
    fn accept(self, item: T) -> Unit;
}
```

### Reified Type Parameters

`reified T` on an `inline fn` preserves the concrete type through JVM erasure, enabling runtime type operations.

```valen
inline fn <reified T> isInstance(value: Any) -> Bool {
    value is T
}
```

Constraints:
- Only allowed inside `inline fn` (compile error otherwise)
- Cannot be used on class, data class, enum, or trait type parameters
- Can mix reified and non-reified type parameters in the same function

### Explicit Type Arguments

Type arguments can be specified explicitly at call sites:

```valen
let list = ArrayList<String>();
let x = parse<Int>("42");
```

## typealias vs newtype

| Feature          | `typealias`                     | `newtype`                          |
|------------------|---------------------------------|------------------------------------|
| Creates new type | No (transparent alias)          | Yes (distinct nominal type)        |
| Orphan rule      | Treated as the original type    | Treated as own type (can impl traits) |
| Construction     | None needed                     | `TypeName(value)`                  |
| Access inner     | Direct                          | `.value()` (codegen-level)         |

```valen
typealias UserId = Int;     // just an alias, no new type
newtype EntityId = Int;     // distinct type, can impl traits
let eid = EntityId(42);
```

::: warning
The `.value()` getter is generated at the JVM bytecode level, but type-checker-level resolution of `.value()` is not yet implemented. Calling `.value()` may produce a type-check error in the current compiler.
:::

## Equality Operators

| Operator | Semantics           | Desugars to         |
|----------|---------------------|----------------------|
| `==`     | Structural equality | `.equals()`          |
| `!=`     | Structural inequality | `!.equals()`       |
| `===`    | Reference identity  | JVM reference check  |
| `!==`    | Reference non-identity | JVM reference check |

```valen
let a = "hello";
let b = "hello";
a == b    // true (structural comparison)
a === b   // true or false (depends on JVM string interning)
```

## `safe {}` Block

`safe {}` catches Java exceptions and returns `Result<T, JavaException>`.

```valen
let result = safe {
    riskyOperation()
};
// result: Result<ReturnType, JavaException>
```

`JavaException` is a stdlib data class:

```valen
pub data class JavaException(
    pub message: String,
    pub class_name: String,
);
```

`JavaException` implements the `Error` trait.

## Data Class Implicit Trait Satisfaction

`data class` implicitly satisfies the following trait bounds (no explicit `derives(...)` or `impl` needed):

- `Eq`
- `Hash`
- `Display`
- `Clone`

```valen
data class Point(pub x: Int, pub y: Int);

fn <T: Eq> compare(a: T, b: T) -> Bool {
    a.eq(b)
}

compare(Point(1, 2), Point(1, 2));  // OK: Point implicitly satisfies Eq
```

## Tuple Type (Reserved)

`(A, B, C)` tuple syntax is reserved in the AST but is **not currently usable**. It lowers to `Ty::Error` in HIR.

Use `data class` or the stdlib `Pair<A, B>` instead:

```valen
let p = Pair(42, "hello");  // Pair<Int, String>
```

## Standard Library Types

### ADT Enums

| Type | Definition |
|------|------------|
| `Option<T>` | `enum { Some(value: T), None }` |
| `Result<T, E>` | `enum { Ok(value: T), Err(error: E) }` |
| `Ordering` | `enum { Less, Equal, Greater }` |

### Data Classes

| Type | Fields |
|------|--------|
| `Pair<A, B>` | `first: A`, `second: B` |
| `Range<T>` | `start: T`, `end: T`, `inclusive: Bool` |
| `JavaException` | `message: String`, `class_name: String` |

### Collection Type Aliases

| Valen Type | Java Type |
|------------|-----------|
| `List<T>` | `java.util.List<T>` |
| `Map<K, V>` | `java.util.Map<K, V>` |
| `Set<T>` | `java.util.Set<T>` |

### Traits

| Trait | Method(s) |
|-------|-----------|
| `Eq` | `fn eq(self, other: Self) -> Bool` |
| `Hash` | `fn hash(self) -> Int` |
| `Display` | `fn display(self) -> String` |
| `Clone` | `fn clone(self) -> Self` |
| `Error` | `fn message(self) -> String` |
| `Iterator<T>` | `next`, `map`, `filter`, `fold`, `collect`, `forEach`, `count`, `any`, `all`, `find` |
| `Into<T>` | `fn into(self) -> T` |
| `From<T>` | `fn from(value: T) -> Self` |
| `TryInto<T>` | `fn tryInto(self) -> Result<T, String>` |
| `TryFrom<T>` | `fn tryFrom(value: T) -> Result<Self, String>` |
| `Default` | `fn default() -> Self` |
| `IntoIterator<T>` | `fn intoIter(self) -> Iterator<T>` |
| `Index<Idx>` | `fn index(self, idx: Idx) -> Self` |
| `ToString` | `fn toString(self) -> String` |
| `Ord` | `fn cmp(self, rhs: Self) -> Int` |

### Operator Traits

| Trait | Method |
|-------|--------|
| `Add<Rhs>` | `fn add(self, rhs: Rhs) -> Self` |
| `Sub<Rhs>` | `fn sub(self, rhs: Rhs) -> Self` |
| `Mul<Rhs>` | `fn mul(self, rhs: Rhs) -> Self` |
| `Div<Rhs>` | `fn div(self, rhs: Rhs) -> Self` |
| `Rem<Rhs>` | `fn rem(self, rhs: Rhs) -> Self` |
| `Neg` | `fn neg(self) -> Self` |
| `Not` | `fn not(self) -> Self` |
