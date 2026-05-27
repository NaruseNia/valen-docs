# Pattern Matching

Pattern matching is Valen's answer to the question "what shape is this data?" It's not a fancy `switch` — it's an expression that the compiler checks for exhaustiveness, meaning you can't accidentally forget a case. Combined with enums and sealed classes, it makes impossible states unrepresentable and unhandled states uncompilable.

## The `match` Expression

`match` takes a value, checks it against a series of patterns (called "arms"), and evaluates the first one that matches. It's an expression, so it returns a value.

```valen
fn describe(s: Shape) -> String {
    match s {
        Shape::Circle(r) => f"A circle with radius {r}",
        Shape::Rect(w, h) => f"A {w}x{h} rectangle",
        Shape::Point => "A point",
    }
}
```

Every arm has the form `pattern => expression`. The `=>` is not optional, and neither is handling every case (more on that soon).

## Pattern Kinds

Valen supports a rich set of patterns. Let's go through them all.

### Literal Patterns

Match against exact values. Works with integers, strings, booleans, characters, floats, and longs.

```valen
match status_code {
    200 => "OK",
    404 => "Not Found",
    500 => "Internal Server Error",
    _ => "Something else entirely",
}
```

### Wildcard `_`

The underscore matches anything and binds nothing. It's your "I don't care" pattern.

```valen
match value {
    42 => "the answer",
    _ => "not the answer",
}
```

### Variable Binding

A bare identifier captures the matched value into a variable:

```valen
match some_int {
    0 => "zero",
    n => f"got {n}",  // n binds to the value
}
```

### Destructuring

Pull apart enum variants, data classes, or any structured type:

```valen
match shape {
    Shape::Circle(r) => 3.14159 * r * r,
    Shape::Rect(w, h) => w * h,
    Shape::Point => 0.0,
}
```

The variables `r`, `w`, and `h` are bound to the corresponding fields of the variant. You can use `_` for fields you don't need:

```valen
match shape {
    Shape::Rect(w, _) => f"width is {w}",
    _ => "not a rect",
}
```

### Variant Shorthand Patterns

When the match scrutinee's type tells the compiler which enum you're matching, you can use the dot shorthand instead of the full `EnumName::Variant` path:

```valen
match color {
    .Red => "red",
    .Green => "green",
    .Blue(v) => f"blue({v})",
}
```

This is the same as writing `Color::Red`, `Color::Green`, etc. — just shorter. It works with payload destructuring too:

```valen
match shape {
    .Circle(r) => f"circle r={r}",
    .Rect(w, h) => f"rect {w}x{h}",
    .Point => "point",
}
```

The `..` (rest) pattern works with shorthand as well:

```valen
match shape {
    .Circle(..) => "circle",
    _ => "other",
}
```

Variant shorthand works in `if let`, `while let`, and `let else` too:

```valen
if let .Some(x) = opt {
    println(f"got {x}");
}
```

### Or-Patterns (`|`)

Combine multiple patterns into one arm:

```valen
match day {
    "Saturday" | "Sunday" => "weekend",
    _ => "weekday",
}
```

When or-patterns bind variables, **every alternative must bind the same names**:

```valen
match expr {
    Expr::Lit(v) | Expr::Neg(v) => v,   // OK: both bind `v`
    Expr::Add(a, b) => a + b,
}

// Expr::Lit(v) | Expr::Neg(w)  — ERROR: mismatched names `v` vs `w`
```

::: info Binding consistency not yet enforced
The compiler does not currently validate that or-pattern alternatives bind the same variable names. This validation is planned for a future release. For now, writing consistent bindings is your responsibility — inconsistent names will compile but produce undefined behavior.
:::

### Range Patterns

Use `..` for exclusive ranges and `..=` for inclusive ranges:

```valen
match score {
    0..10 => "single digit",       // 0 <= score < 10
    10..=99 => "double digit",     // 10 <= score <= 99
    _ => "other",
}
```

::: warning Range pattern limitations
Range patterns only support integer literals. The end value must be an `Int` literal specifically — `Long` literals, floats, characters, and strings are not supported as range endpoints.
:::

### Match Guards (`if`)

Add a boolean condition after the pattern for extra filtering:

```valen
match user {
    User(name, age) if age >= 18 => f"{name} is an adult",
    User(name, _) => f"{name} is a minor",
}
```

Guard conditions have access to variables bound by the pattern. The condition must evaluate to `Bool`.

**Important:** guard arms are **not considered exhaustive** on their own. The guard might be `false` at runtime, so the compiler doesn't count it as covering all cases:

```valen
// ERROR: negative values not covered
match n {
    x if x >= 0 => "non-negative",
}

// OK: wildcard catches the rest
match n {
    x if x >= 0 => "non-negative",
    _ => "negative",
}
```

When a guard is attached to an or-pattern, it applies to the entire or-pattern:

```valen
match n {
    2 | 4 | 6 if n < 10 => "small even",
    _ => "other",
}
```

### `@` Binding

Bind the entire matched value to a name while still destructuring it. Useful when you need both the whole value and its parts:

```valen
match user {
    p @ User(name = "admin", ..) => admin_action(p),
    User(name, ..) => regular_action(name),
}
```

The `..` means "ignore the remaining fields." The `@` captures the whole `User` into `p`.

## Exhaustiveness

Here's the deal: the compiler **requires** that your match covers every possible case. No exceptions. No "it'll probably be fine."

```valen
// ERROR: Point is not handled
match shape {
    Shape::Circle(r) => f"circle {r}",
    Shape::Rect(w, h) => f"rect {w}x{h}",
    // Shape::Point — oops, forgot this one
}
```

This applies to:
- **Enums** — every variant must be covered
- **Sealed classes** — every subtype must be covered
- **Sealed traits** — every implementor must be covered
- **Booleans** — `true` and `false` (or use `_`)

For open types (like `Int` or `String`), you'll need a `_` wildcard to catch everything else.

The exhaustiveness checker is not a suggestion — it's a guarantee. If you add a new variant to an enum tomorrow, every `match` on that enum will fail to compile until you handle the new case. That's a feature, not a bug.

## `if let`

When you only care about one pattern, `match` feels like overkill. `if let` is the single-arm shortcut:

```valen
// Instead of this:
match get_user(id) {
    Option::Some(user) => println(f"Found {user.name}"),
    Option::None => {},
}

// Write this:
if let Some(user) = get_user(id) {
    println(f"Found {user.name}");
}
```

It supports `else` and chaining with `else if let`:

```valen
if let Some(pos) = get_component(entity, "Position") {
    println(f"pos: ({pos.x}, {pos.y})");
} else if let Some(vel) = get_component(entity, "Velocity") {
    println(f"velocity only");
} else {
    println("no components found");
}
```

## `while let`

Loop as long as the pattern matches:

```valen
while let Some(item) = iter.next() {
    process(item);
}
```

The loop breaks the moment `iter.next()` returns `None`. No manual `break`, no boolean flags.

## `let`-`else`

The "early return" pattern, formalized. Bind a refutable pattern or bail out:

```valen
fn get_health(world: World, entity: Entity) -> Int {
    let Some(health) = world.get_component(entity, "Health") else {
        return 0;
    };
    health
}
```

The `else` block **must diverge** — it has to `return`, `break`, `continue`, or `panic`. The compiler enforces this; you can't just put a default value in there.

```valen
// ERROR: else block doesn't diverge
let Some(v) = opt else { 42 };

// OK: else block returns
let Some(v) = opt else { return default_value; };

// OK: else block panics
let Ok(data) = readFile(path) else { panic("read failed"); };
```

This flattens deeply nested match chains into linear code:

```valen
// Without let-else (nesting grows fast):
fn process(result: Result<Data, Error>) -> String {
    match result {
        Result::Ok(data) => {
            match data.parse() {
                Result::Ok(parsed) => parsed.to_string(),
                Result::Err(_) => return "parse error",
            }
        }
        Result::Err(e) => return f"error: {e}",
    }
}

// With let-else (flat and readable):
fn process(result: Result<Data, Error>) -> String {
    let Ok(data) = result else { return "error"; };
    let Ok(parsed) = data.parse() else { return "parse error"; };
    parsed.to_string()
}
```

## Quick Reference

| Pattern | Example | Binds |
|---------|---------|-------|
| Literal | `42`, `"hello"`, `true` | Nothing |
| Wildcard | `_` | Nothing |
| Variable | `x` | `x` = matched value |
| Destructure | `Shape::Circle(r)` | `r` = field value |
| Shorthand | `.Circle(r)`, `.None` | Same as full path |
| Or | `1 \| 2 \| 3` | Same names across alternatives |
| Range | `0..=100`, `0..10` | Nothing |
| Guard | `x if x > 0` | `x` = matched value |
| @ Binding | `p @ Point(x, y)` | `p` = whole value, `x`, `y` = fields |

## Next Steps

- [Enums](./enums) — define the data that patterns take apart
- [Classes](./classes) — sealed classes work with exhaustive match too
