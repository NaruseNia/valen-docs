# Expressions

Valen is expression-oriented. Every block, `if`, `match`, and `loop` produces a value.

## Literals

| Literal          | Type     | Example                    |
|------------------|----------|----------------------------|
| Integer          | `Int`    | `42`, `0xFF`, `0b1010`     |
| Long integer     | `Long`   | `42L`                      |
| Float            | `Float`  | `3.14f`                    |
| Double           | `Double` | `3.14`                     |
| Character        | `Char`   | `'a'`                      |
| String           | `String` | `"hello"`                  |
| F-string         | `String` | `f"count: {x}"`           |
| Boolean          | `Bool`   | `true`, `false`            |

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

## if / else

`if` is an expression. Both branches must agree on their type when used as a value.

```valen
let abs = if x < 0 { -x } else { x };
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

Iterates over `Range` or any Java `Iterable`.

### while

```valen
while condition() {
    process();
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

## Binary Operators (Precedence, High → Low)

| Precedence | Operators          | Associativity |
|------------|--------------------|---------------|
| 1          | `*`, `/`, `%`      | Left          |
| 2          | `+`, `-`           | Left          |
| 3          | `..`, `..=`        | None          |
| 4          | `<`, `<=`, `>`, `>=` | Left        |
| 5          | `==`, `!=`, `===`, `!==` | Left     |
| 6          | `&&`               | Left          |
| 7          | `\|\|`             | Left          |
| 8          | `\|>`              | Left          |
| 9          | `=`                | Right         |

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
- Downcasts require `unsafe`.

## Pipeline: `|>`

Lowest-precedence infix operator. Inserts the left-hand side as the first argument of the right-hand call.

```valen
// x |> f(a, b)  desugars to  f(x, a, b)
data |> process(config) |> format(style);
```

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
let add = |a, b| a + b;
let greet = || { println("hello"); };
```

Parameter types can be inferred from context. The body is a single expression or a block.

## unsafe / safe

| Form               | Result type                     | Behavior                                |
|---------------------|---------------------------------|-----------------------------------------|
| `unsafe { expr }`  | `T`                             | Bypasses safety: unchecked cast, exception pass-through, nullable |
| `unsafe expr`       | `T`                             | Shorthand for `unsafe { expr }`         |
| `safe { expr }`    | `Result<T?, JavaException>`     | Wraps Java exceptions, nulls → `Option` |
| `safe expr`         | `Result<T?, JavaException>`     | Shorthand for `safe { expr }`           |
| `safe? expr`        | `T?`                            | Equivalent to `safe { expr }?`          |
