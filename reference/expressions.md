# Expressions

Valen is expression-oriented. Every block, `if`, `match`, and `loop` produces a value.

## Literals

| Literal          | Type     | Example                    |
|------------------|----------|----------------------------|
| Integer          | `Int`    | `42`, `0xFF`, `0b1010`     |
| Long integer     | `Long`   | `42L`                      |
| Float            | `Float`  | `3.14f`                    |
| Double           | `Double` | `3.14`                     |
| Character        | `Char`   | `'a'`, `'\n'`              |
| String           | `String` | `"hello"`                  |
| F-string         | `String` | `f"count: {x}"`           |
| Boolean          | `Bool`   | `true`, `false`            |
| Unit             | `Unit`   | `()`                       |

### F-strings

`f"..."` embeds expressions with `{expr}`. Escape literal braces with `\{` and `\}`.

```valen
let msg = f"Hello, {name}! Result: {1 + 2}";
```

Nested block expressions and nested f-strings inside `{...}` are not allowed.

## Block Expressions

A block `{ stmts; tail_expr }` evaluates to its last expression (without trailing `;`).

```valen
let result = {
    let a = compute_a();
    let b = compute_b();
    a + b   // block value
};
```

### Semicolon Elision

Block-shaped expressions (`if`, `if let`, `match`, `for`, `while`, `while let`, `loop`, `safe`) do not require a trailing `;` in statement position. The parser automatically treats them as `ExprSemi`.

```valen
fn example() {
    if x > 0 {
        do_something();
    }                // no ; needed

    match n {
        0 => a(),
        _ => b(),
    }                // no ; needed

    for i in 0..10 {
        process(i);
    }                // no ; needed

    let y = x + 1;  // regular statements need ;
}
```

## if / else

`if` is an expression. Both branches must agree on their type when used as a value.

```valen
let abs = if x < 0 { -x } else { x };
```

## if let / while let

`if let` and `while let` combine pattern matching with conditional branching. They are block expressions and do not require a trailing semicolon.

```valen
if let Some(value) = opt {
    println(f"found: {value}");
}

if let Some(x) = a {
    use_x(x);
} else {
    fallback();
}

while let Some(item) = iter.next() {
    process(item);
}
```

`if let` supports `else if` chains:

```valen
if let Some(x) = a {
    use_x(x);
} else if let Some(y) = b {
    use_y(y);
} else {
    fallback();
}
```

## let else

`let Pattern = expr else { diverge };` binds a refutable pattern. If the pattern does not match, the `else` block executes. The `else` block **must diverge** (`return`, `break`, `continue`, or `panic`).

```valen
let Some(value) = get_option() else {
    return;
};
// value is available here

let Ok(data) = parse(input) else {
    println("parse failed");
    return;
};
```

## match

`match` is an expression. Arms use `=>` and are separated by `,`. See [Patterns](patterns) for pattern syntax.

```valen
let label = match n {
    0 => "zero",
    1..=9 => "small",
    _ => "large",
};
```

### Match Guards

Arms can have an `if condition` guard after the pattern. The guard is evaluated after the pattern matches; if the condition is `false`, matching continues with the next arm.

```valen
match value {
    Some(x) if x > 0 => println("positive"),
    Some(x) if x < 0 => println("negative"),
    Some(_) => println("zero"),
    None => println("nothing"),
}
```

## Loops

| Form             | Value type                        |
|------------------|-----------------------------------|
| `for item in iterable { ... }` | `Unit`                |
| `while condition { ... }`      | `Unit`                |
| `loop { ... }`                 | Type of `break expr`  |

### for in

```valen
for i in 0..10 {
    println(f"{i}");
}
```

Iterates over `Range` or any Java `Iterable`. Element type for Java collections is `Any` (`java.lang.Object`).

```valen
import java.util.ArrayList;
let list = ArrayList();
list.add("hello");
list.add("world");
for item in list {
    println(item);
}
```

### while

`while` loops while the condition is `true`. The loop value is always `Unit`.

```valen
let mut count = 0;
while count < 10 {
    println(f"{count}");
    count += 1;
}
```

### loop

`loop` runs indefinitely until `break`. It can produce a value via `break expr`.

```valen
let n = loop {
    let input = read();
    if input > 0 { break input; }
};
```

## break, continue, return

| Statement        | Effect                                     |
|------------------|--------------------------------------------|
| `break;`         | Exit the innermost loop                    |
| `break expr;`    | Exit the innermost loop with a value (`loop` only) |
| `continue;`      | Skip to the next iteration                 |
| `return expr;`   | Early return from the enclosing function   |

Labeled break (`'label: for ... { break 'label; }`) is not supported.

## Operator Precedence

Full precedence table, from lowest (1) to highest (15). Same-level operators are left-associative unless noted otherwise.

| Level | Operators | Associativity | Description |
|-------|-----------|---------------|-------------|
| 1 | `=` `+=` `-=` `*=` `/=` `%=` | Right | Assignment, compound assignment |
| 2 | `\|>` | Left | Pipeline |
| 3 | `\|\|` | Left | Logical OR |
| 4 | `&&` | Left | Logical AND |
| 5 | `\|` | Left | Bitwise OR |
| 6 | `^` | Left | Bitwise XOR |
| 7 | `&` | Left | Bitwise AND |
| 8 | `==` `!=` `===` `!==` | Left | Equality, reference equality |
| 9 | `<` `<=` `>` `>=` | Left | Comparison |
| 10 | `..` `..=` | None | Range (non-associative) |
| 11 | `<<` `>>` | Left | Bitwise shift |
| 12 | `+` `-` | Left | Addition, subtraction |
| 13 | `*` `/` `%` | Left | Multiplication, division, remainder |
| 14 | `-` `!` `*` | — | Unary prefix (negate, NOT, deref) |
| 15 | `.field` `.method()` `()` `?` `as Type` | Left | Postfix (field, method, call, try, cast) |

## Assignment

### Simple Assignment

`target = value` assigns to a variable or field. Assignment is an expression but its value is `Unit`.

```valen
let mut x = 0;
x = 42;
obj.field = value;
```

### Compound Assignment

`+=` `-=` `*=` `/=` `%=` combine a binary operation with assignment.

```valen
let mut n = 10;
n += 5;   // n = n + 5
n -= 3;   // n = n - 3
n *= 2;   // n = n * 2
n /= 4;   // n = n / 4
n %= 3;   // n = n % 3
```

## Arithmetic Operators

Standard arithmetic: `+` `-` `*` `/` `%`.

```valen
let sum = a + b;
let remainder = x % 3;
```

## Comparison Operators

`<` `<=` `>` `>=` `==` `!=` for structural comparison.

```valen
let is_positive = x > 0;
let equal = a == b;
```

## Bitwise Operators

Integer bitwise operations.

| Operator | Description |
|----------|-------------|
| `&` | Bitwise AND |
| `\|` | Bitwise OR |
| `^` | Bitwise XOR |
| `<<` | Left shift |
| `>>` | Right shift |

```valen
let flags = 0b1010 & 0b1100;   // 0b1000
let combined = a | b;
let flipped = x ^ 0xFF;
let shifted = n << 2;
```

## Reference Equality

`===` and `!==` compare object **identity** (whether two references point to the same JVM object).

```valen
let a = create_obj();
let b = a;
let c = create_obj();

a === b;  // true — same object
a === c;  // false — different objects
a !== c;  // true
```

`==` / `!=` test **structural equality** (`.equals()`); `===` / `!==` test **reference identity**.

## Logical Operators

`&&` (logical AND) and `||` (logical OR) are short-circuit evaluated.

```valen
if x > 0 && y > 0 {
    // both positive
}
if a || b {
    // at least one true
}
```

`!` is unary logical NOT.

```valen
if !is_valid {
    return;
}
```

## Range Expressions

`start..end` (exclusive) and `start..=end` (inclusive) create range values. They can be used standalone, not just inside `for` loops.

```valen
// In a for loop
for i in 0..10 {
    println(f"{i}");
}

// Inclusive range
for i in 0..=9 {
    println(f"{i}");  // same result as 0..10
}

// As standalone expressions
let range = 1..100;
let inclusive_range = 1..=99;
```

Range operators are non-associative (precedence level 10).

## Unary Operators

| Operator | Meaning          | Trait     |
|----------|------------------|-----------|
| `-expr`  | Numeric negation | `Neg`     |
| `!expr`  | Logical NOT      | `Not`     |
| `*expr`  | Deref (`ref mut T`) | built-in |

## Type Cast: `as`

```valen
let x: Long = 42 as Long;                       // safe widening
let pos: Position = unsafe { obj as Position };  // unsafe downcast
```

- Numeric widening (`Int` → `Long`, etc.) is safe.
- `Char` → numeric is safe.
- Downcasts require `unsafe`.

`as` is a postfix operator at the same precedence level as field access and method calls (level 15).

## Pipeline: `|>`

Pipeline is the **lowest-precedence operator among non-assignment operators** (level 2). It inserts the left-hand side as the first argument of the right-hand call.

```valen
// x |> f(a, b)  desugars to  f(x, a, b)
"hello" |> println;
data |> process(config) |> format(style);
```

The right-hand side must be a function call or function name. Pipelines are left-associative and can be chained.

## `?` Try Operator

`expr?` propagates errors from `Result` or absence from `Option`. If the expression is `Err` / `None`, the enclosing function returns early.

```valen
fn read_config(path: String) -> Result<Config, Error> {
    let content = read_file(path)?;   // Err causes early return
    let config = parse(content)?;
    Ok(config)
}
```

`?` is a postfix operator at precedence level 15 (same as field access and method calls).

::: warning
`?` works with `Option<T>` and `Result<T, E>` only. It **cannot** be used on `T?` (Nullable).
:::

## Variant Shorthand

`.Variant` and `.Variant(args)` are shorthand for enum variant references when the enum type can be inferred from context. Works in both expression and pattern position.

### As Expressions

```valen
// Full form
let color: Color = Color::Red;
let opt: Option<Int> = Option::Some(42);

// Shorthand — type must be inferable
let color: Color = .Red;
let opt: Option<Int> = .Some(42);
```

### As Patterns

```valen
match color {
    .Red => "red",
    .Green => "green",
    .Blue => "blue",
}

if let .Some(value) = opt {
    println(f"{value}");
}
```

The variant name must start with an uppercase letter. Field destructuring and `..` (rest) patterns are also supported in shorthand patterns.

## Collection Literals

| Syntax                  | Type                   | JVM class          |
|-------------------------|------------------------|--------------------|
| `[1, 2, 3]`            | `List<Int>`            | `java.util.ArrayList` |
| `#{"k": v, ...}`       | `Map<String, V>`       | `java.util.HashMap`   |

Empty collections require a type annotation:

```valen
let empty: List<String> = [];
let map: Map<String, Int> = #{};
```

## Lambda

```valen
let inc = |x: Int| x + 1;
let add = |a: Int, b: Int| a + b;
let greet = || { println("hello"); };
```

Parameter types can be inferred from context. The body is a single expression or a block.

### Return Type Annotation

```valen
let parse = |s: String| -> Int {
    s.toInt()
};
```

### Arity Limit

Lambda parameters are limited to 2, mapped to `java.util.function` interfaces:

| Parameters | JVM Functional Interface |
|------------|--------------------------|
| 0 | `java.util.function.Supplier<R>` |
| 1 | `java.util.function.Function<T, R>` |
| 2 | `java.util.function.BiFunction<T, U, R>` |

Lambdas with 3 or more parameters are a compile error.

## Deref Expression

`*expr` reads from a `ref mut T` reference. `*expr = value` writes to the referent.

```valen
let r = ref mut n;
let v = *r;       // read
*r = v + 1;       // write
```

`*` is a unary prefix operator at precedence level 14.

## `ref mut` Expression

`ref mut expr` creates a mutable reference. The result type is `ref mut T`.

```valen
let mut n = 10;
let r = ref mut n;  // r: ref mut Int
```

## safe / unsafe

### `safe` Block

`safe { expr }` catches Java exceptions and wraps the result as `Result<T, JavaException>`.

```valen
let result = safe {
    file.readLine()
};
// result: Result<String, JavaException>
```

### `safe` Shorthand

`safe expr` — the block `{}` can be omitted.

```valen
let result = safe file.readLine();
```

### `safe?` Shorthand

`safe? expr` is equivalent to `safe { expr }?` — catches the Java exception and immediately propagates with `?`.

```valen
fn read_first_line(path: String) -> Result<String, JavaException> {
    let line = safe? File(path).readLine();
    Ok(line)
}
```

### `unsafe` Block

`unsafe { expr }` bypasses safety guarantees. The shorthand `unsafe expr` is also available.

```valen
let pos: Position = unsafe { obj as Position };
let pos: Position = unsafe obj as Position;  // shorthand
```

Calls to `unsafe fn` require an `unsafe` block:

```valen
unsafe fn dangerous() -> Int { /* ... */ }

let x = unsafe { dangerous() };
```
