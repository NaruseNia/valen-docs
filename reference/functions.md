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

## Receivers: `self` / `mut self`

The first parameter of a method can be `self` or `mut self` to make it an instance method. The parser treats `self` as a parameter of type `Self`.

| Receiver    | Meaning                             |
|-------------|-------------------------------------|
| `self`      | Immutable receiver (read-only)      |
| `mut self`  | Mutable receiver (can write fields) |
| *(none)*    | Associated function (no instance)   |

```valen
class Counter {
    let mut count: Int = 0;

    fn increment(mut self) {
        self.count += 1;
    }

    fn get(self) -> Int {
        self.count
    }
}
```

Trait methods use `self` / `mut self` in the same way:

```valen
trait Printable {
    fn print(self);
}

impl Printable for Counter {
    fn print(self) {
        println(f"count: {self.get()}");
    }
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

## UFCS (Uniform Function Call Syntax)

Method syntax `value.method(args)` is first-class. When there is ambiguity between multiple traits, use **`Trait::method(receiver, args)`** to disambiguate.

```valen
trait Mappable<T> {
    fn map<U>(self, f: fn(T) -> U) -> Mappable<U>;
}

// Normal method call
xs.map(|x| x * 2);

// Disambiguation (explicit trait)
Mappable::map(xs, |x| x * 2);
```

**Prohibited forms:**
- ~~`map(xs, f)` form~~ — indistinguishable from top-level function call
- `foo(args)` always resolves as a top-level function call. Trait methods cannot be called in function-call style.

## Type Inference

- **Local variables**: Type inference is available. `let x = 42;` infers `Int`.
- **Function signatures**: Parameter types and return types are **always explicit**. Omitting them is a compile error.

```valen
let x = 42;           // x: Int (inferred)
let y = f"{x}";       // y: String (inferred)

// fn signatures must be explicit
fn add(a: Int, b: Int) -> Int {
    a + b  // inference within body
}
```

## Lambdas (Closures)

`|params| body` creates a lambda expression.

```valen
let add = |a: Int, b: Int| a + b;
let unit = || 42;
```

Parameter types can be omitted when inferable from context.

### Return Type Annotation

`|params| -> Type body` adds an explicit return type:

```valen
let parse = |s: String| -> Int {
    s.toInt()
};
```

### Arity

Codegen maps lambdas to `java.util.function` standard functional interfaces for 0-2 parameters. For 3-22 parameters, the compiler generates `valen/core/FunctionN` interfaces on demand.

| Parameters | JVM Mapping |
|------------|-------------|
| 0 | `java.util.function.Supplier<R>` |
| 1 | `java.util.function.Function<T, R>` |
| 2 | `java.util.function.BiFunction<T, U, R>` |
| 3-22 | `valen.core.FunctionN<A, B, ..., R>` (compiler-generated) |

A lambda with 23 or more parameters is a compile error.

## `unsafe fn`

`unsafe fn` declares a function that requires an `unsafe { }` block at the call site. Use it for operations that bypass safety guarantees (unchecked casts, low-level JVM operations, etc.).

```valen
unsafe fn cast_unchecked<T>(obj: Any) -> T {
    obj as T
}

// Call site
let value: Int = unsafe { cast_unchecked(raw) };
```

`unsafe fn` and `inline fn` can be combined:

```valen
unsafe inline fn fast_cast<T>(obj: Any) -> T {
    obj as T
}
```

The parser handles `unsafe fn` / `unsafe inline fn` via `is_unsafe` / `is_inline` flags on `FnDecl`.

## Trait Method Default Bodies

Trait methods can omit the body (abstract method) or provide a default implementation.

```valen
trait Summary {
    // Abstract — impl must provide a body
    fn summarize(self) -> String;

    // Default implementation — impl may override
    fn preview(self) -> String {
        let s = self.summarize();
        f"{s}..."
    }
}
```

- No body (`;` terminator) — `is_abstract = true`, `body = None`
- With body (`{ ... }`) — `is_abstract = false`, `body = Some(...)`

## `inline fn`

`inline fn` expands its body at the call site. Lambda arguments are also inlined, avoiding boxing overhead.

```valen
inline fn <T> measure(block: fn() -> T) -> T {
    let start = System.nanoTime();
    let result = block();
    println(f"elapsed: {System.nanoTime() - start}ns");
    result
}
```

### Lambda Inlining

Lambdas passed to `inline fn` are expanded at the call site:

```valen
inline fn <T> run(block: fn() -> T) -> T {
    block()
}

fn main() {
    let x = run(|| { 42 });
    // block() body is inlined here
}
```

Non-local return (a `return` inside a lambda exiting the enclosing function) is not supported. Use tail expressions instead.

### Restrictions

| Restriction              | Reason                                |
|--------------------------|---------------------------------------|
| No recursion             | Inlining would produce infinite expansion |
| No non-local `return`    | Use tail expressions instead          |
| Body changes require recompilation of callers | Inherent to inlining |

From Java, `inline fn` appears as a normal method. `reified` parameters become erased.

## `reified` Type Parameters

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

### Allowed Operations with `reified T`

| Operation     | Syntax      | JVM Codegen                    |
|---------------|-------------|--------------------------------|
| Type check    | `value is T` | `instanceof ConcreteType`     |
| Cast          | `value as T` | `checkcast ConcreteType`      |
| Class literal | `T::class`   | `ldc ConcreteType.class`      |

`reified` cannot be used on class, trait, or enum type parameters — only on `inline fn` type parameters. Reified and non-reified type parameters can coexist on the same function.

## Built-in Functions

The prelude provides these built-in functions, available without import:

| Function  | Signature              | Description                        | JVM Implementation          |
|-----------|------------------------|------------------------------------|-----------------------------|
| `println` | `fn(String) -> Unit`   | Print string to stdout with newline | `System.out.println(String)` |
| `print`   | `fn(String) -> Unit`   | Print string to stdout (no newline) | `System.out.print(String)`   |

```valen
println("hello world");          // hello world\n
print("no newline");             // no newline
println(f"count: {x}");          // works with f-strings
```
