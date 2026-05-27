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

## match

`match` is Valen's crown jewel (well, one of them). At its simplest, it's a powerful switch:

```valen
let description = match n {
    0 => "zero",
    1..=9 => "small",
    _ => "large",
};
```

But `match` really shines with enums and pattern matching — destructuring payloads, nested patterns, guards, the works. That's a whole chapter on its own.

For the full tour, see [Pattern Matching](./pattern-matching).

## for..in

`for` iterates over ranges and anything that implements Java's `Iterable`.

### Ranges

```valen
for i in 0..10 {
    println(f"{i}");    // 0 through 9
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

Your classic conditional loop. Nothing surprising here.

```valen
let mut attempts = 0;
while attempts < 3 {
    try_connect();
    attempts = attempts + 1;
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
fn find_first_negative(nums: List<Int>) -> Int? {
    for n in nums {
        if n < 0 { return Some(n); }
    }
    None
}
```

If a function's body is a single expression (or its last expression), you don't need `return` — the value flows out naturally:

```valen
fn double(x: Int) -> Int {
    x * 2     // no return, no problem
}
```

::: tip Expression-Oriented Thinking
Once you start treating `if`, `match`, and `loop` as expressions rather than statements, you'll find yourself writing fewer intermediate variables and less `let mut` code. That's by design.
:::

---

**Next up:** [Strings](./strings) — the simple things in life.
