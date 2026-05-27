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

## Wildcard `_`

Matches anything, binds nothing. Used to satisfy exhaustiveness without binding.

```valen
match n {
    0 => "zero",
    _ => "other",
}
```

## Literal Patterns

Match against integer, string, boolean, and character literals.

```valen
match c {
    'a' => "letter a",
    '0' => "digit zero",
    _ => "other",
}
```

## Binding Patterns

A bare identifier creates a binding for the matched value.

```valen
match n {
    x => use(x),   // x is bound to n
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

When the scrutinee type is known, omit the enum name:

```valen
match shape {
    .Circle(r) => f"r = {r}",
    .Rect(w, h) => f"{w} x {h}",
    .Point => "point",
}
```

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

## Range Patterns

Inclusive ranges with `..=`. Supported for integer and character types.

```valen
match n {
    1..=9 => "single digit",
    10..=99 => "two digits",
    _ => "other",
}
```

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
