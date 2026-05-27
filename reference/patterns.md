# Patterns

## Pattern Kinds

| Pattern                  | Syntax                          | Example                                    |
|--------------------------|---------------------------------|--------------------------------------------|
| Wildcard                 | `_`                             | `_ => "default"`                           |
| Literal                  | `value`                         | `0 => "zero"`                              |
| Binding                  | `name`                          | `n => use(n)`                              |
| Path (variant)           | `Enum::Variant`                 | `Shape::Circle(r) => ...`                  |
| Variant shorthand        | `.Variant`                      | `.Circle(r) => ...`                        |
| Struct destructuring     | `Type(field1, field2)`          | `User(name, age) => ...`                   |
| Struct with rest         | `Type(field, ..)`               | `User(name = "admin", ..) => ...`          |
| Or-pattern               | `p1 \| p2`                     | `1 \| 2 \| 3 => "small"`                  |
| Range                    | `start..=end`                   | `1..=9 => "digit"`                         |
| Guard                    | `pattern if cond`               | `n if n < 0 => "negative"`                 |
| @ binding                | `name @ pattern`                | `p @ User(name = "admin", ..) => use(p)`   |
| Tuple                    | *(reserved, not parseable)*     | —                                          |

## Wildcard `_`

Matches anything, binds nothing. Used to satisfy exhaustiveness without binding.

```valen
match n {
    0 => "zero",
    _ => "other",
}
```

## Literal Patterns

Match against integer, long, string, boolean, float, and character literals.

```valen
match c {
    'a' => "letter a",
    '0' => "digit zero",
    _ => "other",
}
```

## Binding Patterns

A bare identifier creates a binding for the matched value. `mut` modifier is supported.

```valen
match n {
    x => use(x),       // x is bound to n
    mut y => { ... },   // mutable binding
}
```

## Path / Variant Patterns

Match against enum variants, optionally destructuring fields.

```valen
match shape {
    Shape::Circle(r) => f"r = {r}",
    Shape::Rect(w, h) => f"{w} x {h}",
    Shape::Point => "point",
}
```

### Variant Shorthand

When the scrutinee type is known, use `.Variant` or `.Variant(fields)` to omit the enum name. The identifier after `.` must start with an uppercase letter.

```valen
match shape {
    .Circle(r) => f"r = {r}",
    .Rect(w, h) => f"{w} x {h}",
    .Point => "point",
}
```

Rest patterns (`..`) also work with shorthand:

```valen
match shape {
    .Circle(..) => "circle",
    _ => "other",
}
```

The exhaustiveness checker recognizes `VariantShorthand` patterns correctly.

## Or-Patterns

Multiple patterns separated by `|`. All alternatives must bind the **same set of variable names**.

```valen
match n {
    1 | 2 | 3 => "small",
    _ => "other",
}

match expr {
    Expr::Lit(v) | Expr::Neg(v) => v,       // OK: both bind `v`
    // Expr::Lit(v) | Expr::Neg(w) => ...    // ERROR: names differ
}
```

Or-patterns without bindings (literals only) have no binding consistency requirement.

::: warning
**Binding consistency is not currently checked.** Neither the parser nor the exhaustiveness checker validates that all alternatives in an or-pattern bind the same variable names. This will be enforced in a future semantic check pass. Inconsistent bindings compile without error today.
:::

## Range Patterns

Both exclusive (`..`) and inclusive (`..=`) ranges are supported.

```valen
match n {
    0..10 => "single digit",      // exclusive: 0 <= n < 10
    10..=99 => "double digit",    // inclusive: 10 <= n <= 99
    _ => "large",
}
```

### Limitations

- **Start literal:** accepts `IntLit` and `LongLit`.
- **End literal:** accepts `IntLit` **only**. Writing a `LongLit` as the end value causes a parse error.
- `Float`, `Double`, `Char`, and `String` range patterns are not supported.

## Guards

An `if` condition after the pattern. Evaluated after matching and binding.

```valen
match user {
    User(name, age) if age >= 20 => f"adult: {name}",
    User(name, _) => f"minor: {name}",
}
```

- Guard type must be `Bool`.
- A guarded arm does **not** count as unconditionally exhaustive.
- On or-patterns, the guard applies to the entire or-pattern.

```valen
match n {
    2 | 4 | 6 if n < 10 => "small even",
    _ => "other",
}
```

## @ Binding

Bind the entire matched value to a name while also destructuring.

```valen
match user {
    p @ User(name = "admin", ..) => admin_action(p),
    _ => default_action(),
}
```

## Exhaustiveness Rules

| Type           | Rule                                                         |
|----------------|--------------------------------------------------------------|
| `enum`         | All variants must be covered, or a wildcard `_` must be present |
| `sealed class` | All permitted subtypes must be covered, or `_`               |
| `sealed trait` | All implementors must be covered, or `_`                     |
| Java `sealed` with `@valen.Closed` | Exhaustive — all permits must be covered |
| Java `sealed` without `@valen.Closed` | Open-world — `_` is always required  |
| `Bool`         | `true` + `false`, or `_`                                    |
| Integer / String / other | `_` is always required                            |

Guarded arms are never considered unconditionally exhaustive.

::: warning Known Limitations
The exhaustiveness checker operates on **raw AST** and infers the scrutinee type only from **parameter type annotations** and **`let` binding type annotations**. The following cases cause the check to be silently skipped:

- Function return values: `match getColor() { ... }`
- Method chains: `match obj.method().field { ... }`
- Complex expressions: `match if cond { a } else { b } { ... }`

```valen
fn process(c: Color) {
    match c { ... }   // ✓ — type inferred from parameter
}

fn process2() {
    let c: Color = getColor();
    match c { ... }   // ✓ — type inferred from let annotation
}

fn process3() {
    match getColor() { ... }  // ✗ — type unknown, check skipped
}
```

A future version will refactor to use typed HIR for accurate exhaustiveness on all scrutinee types.
:::

## Tuple Patterns

::: info Reserved
`Pattern::Tuple` exists in the AST but has no parser logic. Tuple patterns are not currently usable. They are reserved for future tuple type support.
:::

## if let

Conditional pattern match — a one-arm `match`.

```valen
if let Some(value) = opt {
    use(value);
} else {
    fallback();
}
```

Supports `else if let` chains:

```valen
if let Some(pos) = getPosition() {
    use_pos(pos);
} else if let Some(vel) = getVelocity() {
    use_vel(vel);
} else {
    default();
}
```

**Limitation:** Guard conditions (`if let P = e && cond`) are not currently supported.

## while let

Loop while the pattern matches.

```valen
while let Some(item) = iter.next() {
    process(item);
}
```

## let-else

Refutable binding with a mandatory diverging else block (`return`, `break`, `continue`, or `panic`).

```valen
let Some(health) = world.getComponent(entity, "Health") else { return; };
let Ok(data) = readFile(path) else { panic("read failed"); };
```

The bound variables are available in the enclosing scope. The else block must have type `Nothing`.

This is syntactic sugar for early-return patterns, avoiding deep `match` nesting:

```valen
// Without let-else:
let health = match world.getComponent(entity, "Health") {
    Option::Some(h) => h,
    Option::None => return,
};

// With let-else:
let Option::Some(health) = world.getComponent(entity, "Health") else { return; };
```
