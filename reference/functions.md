# Functions

## Signature Syntax

```valen
fn name(param1: Type1, param2: Type2) -> ReturnType {
    body
}
```

- Parameter types and return type are **always explicit**.
- `-> Unit` can be omitted.
- Top-level functions are allowed (no enclosing class required).

## Named Arguments

Any argument can be passed by name at the call site.

```valen
fn greet(msg: String, count: Int) -> String { /* ... */ }

greet(msg = "hi", count = 3);
greet(count = 3, msg = "hi");  // order doesn't matter
```

## Default Arguments

Parameters can have default values. Defaults are evaluated at the call site on each invocation.

```valen
fn greet(msg: String = "hi", count: Int = 1) -> String { /* ... */ }

greet()              // msg = "hi", count = 1
greet("yo")          // msg = "yo", count = 1
greet(count = 5)     // msg = "hi", count = 5
```

- Default values can be any expression (literals, function calls, etc.).
- No restriction on parameter position — any parameter may have a default.
- Works on class / data class constructor parameters as well.
- Trait methods can declare defaults; implementations **cannot** override them.

## Receivers: self / mut self

| Receiver    | Meaning                             |
|-------------|-------------------------------------|
| `self`      | Immutable receiver (instance method) |
| `mut self`  | Mutable receiver                     |
| *(none)*    | Associated function (no instance)    |

```valen
class Vec2(pub x: Float, pub y: Float) {
    fn length(self) -> Float { /* ... */ }
    fn scale(mut self, factor: Float) { /* ... */ }
    fn zero() -> Vec2 { Vec2(x = 0.0, y = 0.0) }  // associated
}
```

There is no `&self` or `&mut self` — Valen does not have ownership/borrowing.

## Associated Functions

Functions without a `self` receiver are associated functions, called via `Type::name(args)`.

```valen
class User(pub name: String, mut age: Int) {
    fn from_name(name: String) -> User {
        User(name = name, age = 0)
    }
}

let u = User::from_name("Alice");
```

There is no `static` keyword. The presence or absence of `self` is the only distinction.

## inline fn

`inline fn` expands its body at the call site. Lambda arguments are also inlined, avoiding boxing overhead.

```valen
inline fn <T> measure(block: fn() -> T) -> T {
    let start = System.nanoTime();
    let result = block();
    println(f"elapsed: {System.nanoTime() - start}ns");
    result
}
```

### Restrictions

| Restriction              | Reason                                |
|--------------------------|---------------------------------------|
| No recursion             | Inlining would produce infinite expansion |
| No non-local `return`    | Use tail expressions instead          |
| Body changes require recompilation of callers | Inherent to inlining |

From Java, `inline fn` appears as a normal method. `reified` parameters become erased.

## reified Type Parameters

`reified` parameters are only available inside `inline fn`. They preserve concrete type information at runtime, bypassing JVM type erasure.

```valen
inline fn <reified T> isInstance(value: Any) -> Bool {
    value is T
}

inline fn <reified T, U> mixed(value: Any, other: U) -> Bool {
    value is T   // OK — T is reified
    // value is U — ERROR — U is not reified
}
```

### Allowed Operations with reified T

| Operation     | Syntax      | JVM Codegen                    |
|---------------|-------------|--------------------------------|
| Type check    | `value is T` | `instanceof ConcreteType`     |
| Cast          | `value as T` | `checkcast ConcreteType`      |
| Class literal | `T::class`   | `ldc ConcreteType.class`      |

`reified` cannot be used on class, trait, or enum type parameters — only on `inline fn` type parameters. Reified and non-reified type parameters can coexist on the same function.
