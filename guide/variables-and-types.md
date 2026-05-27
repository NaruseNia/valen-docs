# Variables & Types

Every program starts with data, and Valen has opinions about how you handle it. Strong opinions. The kind that save you from yourself at 2 AM.

## Bindings: `let` and `let mut`

Variables in Valen are immutable by default. If you want to mutate something, you have to say so out loud.

```valen
let name = "Valen";         // immutable — settled, done, final
let mut counter = 0;         // mutable — you're allowed to change your mind
counter = counter + 1;       // fine
name = "something else";     // ERROR: can't assign to immutable binding
```

This isn't Valen being difficult. It's Valen being honest about where bugs come from.

## Type Inference vs Explicit Annotation

Valen can figure out most types on its own. But if you want to spell it out, go ahead — the compiler won't judge.

```valen
let x = 42;                  // inferred as Int
let y: Int = 42;             // explicit — same thing, more typing
let msg = f"count: {x}";    // inferred as String
```

**Function signatures are always explicit.** The compiler draws the line at guessing what your function is supposed to do.

```valen
fn add(a: Int, b: Int) -> Int {
    a + b
}
```

When the compiler can't infer a type (e.g., empty generic containers), you'll need to help it out:

```valen
let items: List<Int> = [];   // empty list needs a type annotation
```

## Primitive Types

Valen provides the following primitive nominal types. They map to JVM primitives under the hood, but the language spec doesn't make promises about that.

| Type     | What it is                                 | Example       |
|----------|--------------------------------------------|---------------|
| `Int`    | 32-bit integer                             | `42`          |
| `Long`   | 64-bit integer                             | `42L`         |
| `Float`  | 32-bit floating point                      | `3.14f`       |
| `Double` | 64-bit floating point                      | `3.14`        |
| `Bool`   | Boolean                                    | `true`        |
| `Char`   | Single character                           | `'a'`         |
| `String` | Text (immutable, maps to `java.lang.String`) | `"hello"`   |
| `Byte`   | 8-bit integer                              | —             |
| `Short`  | 16-bit integer                             | —             |

## Unit and Nothing

Two special types that show up more often than you'd expect:

- **`Unit`** — The "I don't return anything interesting" type. Like Java's `void`, but it's an actual type you can use in generics. Functions that don't declare a return type implicitly return `Unit`.
- **`Nothing`** — The "I never return at all" type. A function returning `Nothing` either loops forever or panics. It's the bottom type — a subtype of everything, inhabited by nothing.

```valen
fn greet(name: String) {
    // return type is Unit (omitted)
    println(f"Hello, {name}!");
}

fn crash(msg: String) -> Nothing {
    panic(msg);  // never returns
}
```

## Numeric Literals

Valen supports several numeric literal formats, because sometimes `255` is less clear than `0xFF`.

```valen
let decimal    = 42;
let hex        = 0xFF;           // 255
let binary     = 0b1010;         // 10
let octal      = 0o77;           // 63
let grouped    = 1_000_000;      // underscores for readability
let hex_group  = 0xFF_FF;        // works with any base
```

### Type Suffixes

Unsuffixed integers are `Int`. Unsuffixed decimals are `Double`. Need something else? Add a suffix.

| Suffix | Resulting Type | Example   |
|--------|---------------|-----------|
| `L`    | `Long`        | `42L`     |
| `f`    | `Float`       | `3.14f`   |
| (none) | `Int` or `Double` | `42`, `3.14` |

```valen
let a = 42;        // Int
let b = 42L;       // Long
let c = 3.14;      // Double
let d = 3.14f;     // Float
let e = 0xFFL;     // Long: 255
let f = 0o77L;     // Long: 63
```

## No Implicit Numeric Conversions

This is the part where Java and Kotlin developers do a double-take. **Valen does not implicitly convert between numeric types.** Ever.

```valen
let x: Long = 42;              // ERROR: type mismatch, Int != Long
let y: Long = 42.toLong();     // OK
let z: Double = 3.14f.toDouble(); // OK
let w: Float = 42.toFloat();   // OK
```

Available conversion methods:

- `.toInt()`, `.toLong()`, `.toFloat()`, `.toDouble()`
- `.toByte()`, `.toShort()`, `.toChar()`

**Why?** Implicit widening is a subtle bug factory in Java/Kotlin. Removing it also makes overload resolution dramatically simpler — the compiler only considers exact type matches. Yes, you type a few more characters. In exchange, numeric mismatches are always caught at compile time. That's a trade worth making.

## `typealias` vs `newtype`

### `typealias` — Just a nickname

A `typealias` creates an alternative name for an existing type. It's purely cosmetic — the compiler treats the alias and the original as the same type.

```valen
typealias UserId = Int;
typealias Handler = fn(String) -> Unit;

let id: UserId = 42;
let x: Int = id;      // fine — UserId IS Int
```

Because it's just an alias, orphan rules treat `UserId` as `Int`. You can't implement foreign traits on it.

### `newtype` — A new, distinct type

A `newtype` wraps an existing type into a genuinely new type. The compiler treats it as its own thing.

```valen
newtype EntityId = Int;
newtype ComponentName = String;

let eid = EntityId(42);         // construct with TypeName(value)
let raw: Int = eid.value();     // unwrap with .value()

let x: Int = eid;               // ERROR: EntityId is not Int
```

Because `newtype` creates a real type you own, you can implement traits on it:

```valen
impl Display for EntityId {
    fn display(self) -> String {
        f"Entity#{self.value()}"
    }
}
```

**Rule of thumb:** Use `typealias` for readability. Use `newtype` when you want the type system to stop you from mixing up two things that happen to be the same underlying type.

## Equality: `==` vs `===`

Valen separates structural equality from reference identity, much like Kotlin.

| Operator | Meaning              | Desugars to        |
|----------|----------------------|---------------------|
| `==`     | Structural equality  | `.equals()`         |
| `!=`     | Structural inequality| `!.equals()`        |
| `===`    | Reference identity   | JVM reference check |
| `!==`    | Reference inequality | JVM reference check |

```valen
let a = "hello";
let b = "hello";
a == b     // true — same content
a === b    // maybe true, maybe false — depends on JVM string interning
```

For Java developers: Valen's `==` is Java's `.equals()`. Valen's `===` is Java's `==`. Yes, it's the opposite convention. You'll get used to it, and your code will be better for it.

---

**Next up:** [Functions](./functions) — how to actually *do* things with all these types.
