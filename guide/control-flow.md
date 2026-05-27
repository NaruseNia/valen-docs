# Control Flow

Here's the headline: **everything is an expression in Valen**. `if` returns a value. `match` returns a value. Even `loop` can return a value via `break`. Once you internalize this, your code gets noticeably cleaner.

## Blocks Return Values

A block `{ ... }` evaluates to its last expression. No `return` needed — just leave off the semicolon.

```valen
let result = {
    let a = compute_a();
    let b = compute_b();
    a + b    // <- this is the block's value
};
```

Add a semicolon to the last line, and the block returns `Unit` instead. The semicolon is the difference between "here's a value" and "I'm done, carry on."

## if / else

`if` is an expression, not a statement. It returns a value, which means you can bind it to a variable directly.

```valen
let abs_value = if x < 0 { -x } else { x };
```

Of course, you can still use it the old-fashioned way:

```valen
if needs_update {
    update_cache();
}
```

When used as an expression, both branches must return the same type. The compiler will not guess which branch you "probably meant."

```valen
// ERROR: branches return different types (Int vs String)
let oops = if flag { 42 } else { "nope" };
```

Chaining works as expected:

```valen
let label = if score > 90 {
    "excellent"
} else if score > 70 {
    "good"
} else if score > 50 {
    "okay"
} else {
    "needs work"
};
```

## if let

`if let` combines pattern matching with a conditional branch. It's perfect when you want to destructure a single pattern without writing a full `match`.

```valen
if let Option::Some(value) = get_option() {
    println(f"Got: {value}");
}
```

You can add an `else` branch for when the pattern doesn't match:

```valen
if let Option::Some(x) = maybe_value {
    use_value(x);
} else {
    println("No value found");
}
```

`if let` chains work with `else if` and `else if let`:

```valen
if let Option::Some(x) = a {
    use_x(x);
} else if let Option::Some(y) = b {
    use_y(y);
} else {
    fallback();
}
```

This is especially handy for working with `Option` and `Result` types when you only care about one variant.

## let else

`let else` is the flip side of `if let`. It binds a refutable pattern and diverges (via `return`, `break`, `continue`, or `panic`) if the pattern doesn't match.

```valen
let Option::Some(value) = get_option() else {
    return;
};
// value is available here — guaranteed to be Some

let Result::Ok(data) = parse(input) else {
    println("parse failed");
    return;
};
// data is available here — guaranteed to be Ok
```

The `else` block **must diverge** — it has to exit the current scope via `return`, `break`, `continue`, or a call that never returns. If you just want to handle both cases, use `if let` or `match` instead.

## match

`match` is Valen's crown jewel (well, one of them). It's exhaustive, expressive, and returns a value.

### Basic Matching

```valen
let description = match n {
    0 => "zero",
    1 => "one",
    _ => "many",
};
```

### Range Patterns

Use `..` (exclusive end) and `..=` (inclusive end) to match ranges of values:

```valen
let description = match n {
    0 => "zero",
    1..=9 => "small",
    10..=99 => "medium",
    _ => "large",
};
```

### Destructuring Enums

```valen
match shape {
    Shape::Circle(r: radius) => 3.14159 * radius * radius,
    Shape::Rect(w: width, h: height) => width * height,
    Shape::Point => 0.0,
}
```

### Match Guards

Add an `if` condition after a pattern for additional filtering. The guard is evaluated after the pattern matches; if the guard is `false`, the next arm is tried.

```valen
match value {
    Option::Some(x) if x > 0 => println("positive"),
    Option::Some(x) if x < 0 => println("negative"),
    Option::Some(_) => println("zero"),
    Option::None => println("nothing"),
}
```

Guards are especially useful when patterns alone can't express the condition you need:

```valen
match pair {
    (a, b) if a == b => println("equal"),
    (a, b) if a > b => println("first is larger"),
    _ => println("second is larger or equal"),
}
```

### Variant Shorthand

When the enum type can be inferred from context, you can use `.Variant` shorthand in patterns:

```valen
let color: Color = .Red;

match color {
    .Red => "red",
    .Green => "green",
    .Blue => "blue",
}
```

### Exhaustiveness

The compiler checks that your `match` covers every possible case. Forget a variant and you get a compile error — not a runtime surprise. Use `_` as a catch-all when you don't need to handle every case individually.

For the full tour of pattern matching, see [Pattern Matching](./pattern-matching).

## for..in

`for` iterates over ranges and anything that implements Java's `Iterable`.

### Ranges

Use `..` for exclusive ranges and `..=` for inclusive ranges:

```valen
for i in 0..10 {
    println(f"{i}");    // 0 through 9
}

for i in 0..=9 {
    println(f"{i}");    // 0 through 9 (same result, inclusive end)
}
```

### Collections

```valen
let names = ["Alice", "Bob", "Charlie"];
for name in names {
    println(f"Hello, {name}!");
}
```

Any Java `Iterable` works too — `ArrayList`, `HashSet`, `LinkedList`, you name it:

```valen
import java.util.ArrayList;

let list = ArrayList();
list.add("hello");
list.add("world");

for item in list {
    println(item);
}
```

## while

Your classic conditional loop. The loop body executes as long as the condition is `true`.

```valen
let mut attempts = 0;
while attempts < 3 {
    try_connect();
    attempts += 1;
}
```

`while` is a block expression, but its value is always `Unit`.

## while let

`while let` combines `while` with pattern matching. The loop continues as long as the pattern matches.

```valen
while let Option::Some(item) = iter.next() {
    process(item);
}
```

This is particularly useful for consuming iterators or repeatedly checking `Option`/`Result` values:

```valen
while let Result::Ok(line) = reader.readLine() {
    println(line);
}
```

## loop — Infinite Loop with a Trick

`loop` repeats forever — or until you `break`. The neat part: `break` can carry a value, making `loop` an expression.

```valen
let answer = loop {
    let input = read_input();
    if input > 0 {
        break input;     // loop evaluates to `input`
    }
    println("Try a positive number.");
};
```

This is particularly handy for retry logic or interactive prompts where you don't know the iteration count ahead of time.

A `loop` without a value-carrying `break` has type `Nothing` (or `Unit` with a plain `break;`).

## Range Expressions

Ranges aren't just for loops — they're standalone expressions that produce `Range<T>` values.

| Syntax | Meaning | Example |
|--------|---------|---------|
| `a..b` | Half-open range (a inclusive, b exclusive) | `0..10` |
| `a..=b` | Closed range (both inclusive) | `0..=9` |

```valen
let range = 1..100;          // Range<Int>, exclusive end
let inclusive = 1..=99;       // Range<Int>, inclusive end

for i in 1..=5 {
    println(f"{i}");          // 1, 2, 3, 4, 5
}
```

Ranges are also used in `match` patterns:

```valen
match score {
    90..=100 => "A",
    80..=89 => "B",
    70..=79 => "C",
    _ => "below C",
}
```

## break, continue, return

### break

Exits the innermost loop. In a `loop`, it can carry a value:

```valen
break;           // exit the loop
break value;     // exit and return a value (loop expression)
```

### continue

Skips the rest of the current iteration and jumps to the next one:

```valen
for i in 0..100 {
    if i % 2 == 0 { continue; }
    println(f"{i} is odd");
}
```

### return

Exits the current function early with a value:

```valen
fn find_first_negative(nums: List<Int>) -> Option<Int> {
    for n in nums {
        if n < 0 { return Option::Some(n); }
    }
    Option::None
}
```

If a function's body is a single expression (or its last expression), you don't need `return` — the value flows out naturally:

```valen
fn double(x: Int) -> Int {
    x * 2     // no return, no problem
}
```

::: warning No labeled breaks
Labeled break (`'outer: for ... { break 'outer; }`) for breaking out of nested loops is not currently supported. You'll need to restructure with a helper function or a flag variable.
:::

::: tip Expression-Oriented Thinking
Once you start treating `if`, `match`, and `loop` as expressions rather than statements, you'll find yourself writing fewer intermediate variables and less `let mut` code. That's by design.
:::

---

**Next up:** [Strings](./strings) — the simple things in life.
