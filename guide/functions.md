# Functions

Functions in Valen look a lot like Rust functions, act a lot like Kotlin functions, and run on the JVM. It's a whole vibe.

## Basic Syntax

Every function starts with `fn`, takes typed parameters, and declares its return type.

```valen
fn add(a: Int, b: Int) -> Int {
    a + b
}
```

- Parameter types are always explicit. The compiler doesn't guess.
- The last expression in the body is the return value (no semicolon needed).
- If the return type is `Unit` (i.e., you're not returning anything useful), you can omit `-> Unit`.

```valen
fn greet(name: String) {
    println(f"Hello, {name}!");
    // implicitly returns Unit
}
```

## Named Arguments

When a function has several parameters and you want to be kind to future readers (including yourself), use named arguments.

```valen
fn create_user(name: String, age: Int, active: Bool) -> User {
    User(name = name, age = age, active = active)
}

// positional — works, but what does `true` mean again?
create_user("Alice", 30, true);

// named — ah, much better
create_user(name = "Alice", age = 30, active = true);
```

## Default Arguments

Parameters can have default values. When they do, callers can omit them.

```valen
fn greet(msg: String = "hi", count: Int = 1) -> String {
    f"{msg} x{count}"
}

greet()              // "hi x1"
greet("yo")          // "yo x1"
greet("yo", 3)       // "yo x3"
```

A few things to know:

- Default values can be **any expression** — not just literals. Function calls, field accesses, whatever you need.
- They're evaluated at **each call site**, not once at definition time.
- Defaults work on **any parameter position** (no "must be at the end" rule).
- Combine with named arguments to skip middle parameters:

```valen
greet(count = 5)     // "hi x5" — msg uses default, count is explicit
```

Defaults also work on class and data class constructor parameters, and on trait methods (though `impl` blocks cannot override a trait method's default values).

## `self` and `mut self`

Methods are just functions whose first parameter is `self` or `mut self`. This determines whether the method can modify the receiver.

### `self` — Immutable receiver

The method can read the instance but not modify it.

```valen
class Counter {
    let mut count: Int = 0;

    fn get(self) -> Int {
        self.count
    }
}
```

### `mut self` — Mutable receiver

The method can read and write to the instance's fields.

```valen
class Counter {
    let mut count: Int = 0;

    fn increment(mut self) {
        self.count += 1;
    }
}
```

The same `self` / `mut self` convention applies to trait methods:

```valen
trait Resettable {
    fn reset(mut self);
}

impl Resettable for Counter {
    fn reset(mut self) {
        self.count = 0;
    }
}
```

## Methods vs Associated Functions

Inside a `class`, functions come in two flavors depending on whether they take `self`.

### Methods — have `self`

```valen
class Circle(radius: Double) {
    fn area(self) -> Double {
        3.14159 * self.radius * self.radius
    }
}

let c = Circle(5.0);
c.area()              // called on an instance
```

### Associated functions — no `self`

These are like Java's `static` methods, but Valen doesn't use the `static` keyword. No `self` parameter = associated function.

```valen
class Circle(radius: Double) {
    fn unit_circle() -> Circle {
        Circle(1.0)
    }
}

let c = Circle::unit_circle();   // called on the type, not an instance
```

Think of it this way: if the function needs to look at a specific instance, give it `self`. If it's a factory or utility that just happens to live on the type, leave `self` out.

## Lambdas

Lambdas use `| |` pipe syntax. They're concise, they capture variables from their environment, and they don't require a `fn` keyword.

```valen
let double = |x: Int| x * 2;
let sum = |a: Int, b: Int| -> Int { a + b };
```

For single-expression lambdas, you can skip the braces:

```valen
let inc = |x: Int| x + 1;
```

For multi-line lambdas or when you want an explicit return type, use braces:

```valen
let classify = |n: Int| -> String {
    let abs = if n < 0 { -n } else { n };
    if abs > 100 { "big" } else { "small" }
};
```

### Lambda Arity Limit

Lambdas in Valen are compiled to `java.util.function` interfaces, which means **the maximum number of parameters is 2**.

| Parameters | JVM type |
|------------|----------|
| 0 | `java.util.function.Supplier<R>` |
| 1 | `java.util.function.Function<T, R>` |
| 2 | `java.util.function.BiFunction<T, U, R>` |

A lambda with 3 or more parameters is a **compile error**. If you need more, use a named function or a data class to bundle parameters.

### Capturing Mutable Variables

Lambdas can capture outer variables, but mutating captured variables requires explicit `ref mut`:

```valen
let mut count = 0;
let r = ref mut count;
let inc = || { *r = *r + 1; };
inc();
inc();
// count == 2
```

## `unsafe fn`

An `unsafe fn` is a function that requires an `unsafe { }` block at the call site. Use it for operations that bypass Valen's safety guarantees, such as unchecked casts or low-level JVM operations.

```valen
unsafe fn cast_unchecked<T>(obj: Any) -> T {
    obj as T
}

// Calling requires unsafe
let value: Int = unsafe { cast_unchecked(raw) };
```

`unsafe fn` can be combined with `inline fn`:

```valen
unsafe inline fn fast_cast<T>(obj: Any) -> T {
    obj as T
}
```

## Pipeline Operator

The `|>` operator takes the value on the left and feeds it as the first argument to the function on the right. It's for those moments when nested function calls start looking like LISP.

```valen
// without pipeline — read inside-out
format(process(data, config), style);

// with pipeline — read left-to-right
data |> process(config) |> format(style);
```

The desugaring is straightforward: `x |> f(a, b)` becomes `f(x, a, b)`.

```valen
"hello" |> println;                      // println("hello")
data |> validate() |> transform(opts);   // transform(validate(data), opts)
```

Pipelines are left-associative and have the lowest precedence of any non-assignment operator, so they chain naturally.

## UFCS (Uniform Function Call Syntax)

Method syntax `value.method(args)` is the primary way to call methods. When there's ambiguity (e.g., multiple traits define the same method name), use the fully qualified form:

```valen
// Normal method call
xs.map(|x| x * 2);

// Disambiguate by specifying the trait
Mappable::map(xs, |x| x * 2);
```

`foo(args)` is always resolved as a top-level function call. You can't call a trait method using bare function syntax.

## Inline Functions

For performance-sensitive code, Valen offers `inline fn` — the function body is expanded at each call site, and lambda arguments are inlined too (no boxing overhead).

```valen
inline fn <T> measure(block: fn() -> T) -> T {
    let start = System.nanoTime();
    let result = block();
    println(f"elapsed: {System.nanoTime() - start}ns");
    result
}
```

This is also where `reified` type parameters live — they let you do `is` checks and casts on generic types at runtime, defeating JVM erasure.

::: warning Inline restrictions
Inline functions cannot be recursive (the expansion would be infinite). Also, `reified` type parameters are only valid inside `inline fn` — using them in a regular function is a compile error.
:::

For the full story, see [Inline & Reified](./inline-reified).

---

**Next up:** [Control Flow](./control-flow) — because data without logic is just a very expensive spreadsheet.
