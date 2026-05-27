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

- Default values can be any expression — not just literals.
- They're evaluated at each call site, not once at definition time.
- Defaults work on any parameter position (no "must be at the end" rule).
- Combine with named arguments to skip middle parameters:

```valen
greet(count = 5)     // "hi x5" — msg uses default, count is explicit
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

Lambdas capture outer variables by reference. Mutable variables can be captured and mutated:

```valen
let mut count = 0;
let inc = || { count = count + 1; };
inc();
inc();
// count == 2
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

Pipelines are left-associative and have the lowest precedence of any operator, so they chain naturally.

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

For the full story, see [Inline & Reified](./inline-reified).

---

**Next up:** [Control Flow](./control-flow) — because data without logic is just a very expensive spreadsheet.
