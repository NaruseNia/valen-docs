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
| `Byte`   | 8-bit integer                              | --            |
| `Short`  | 16-bit integer                             | --            |

## Unit and Nothing

Two special types that show up more often than you'd expect:

- **`Unit`** — The "I don't return anything interesting" type. Like Java's `void`, but it's an actual type you can use in generics. Functions that don't declare a return type implicitly return `Unit`. The literal value is `()`.
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

## Char Type

`Char` represents a single character, using single quotes. It supports the same escape sequences as strings.

```valen
let letter = 'A';
let newline = '\n';
let tab = '\t';
let nul = '\0';
let escaped = '\'';     // single quote
let backslash = '\\';
```

`Char` maps to JVM's `char` / `java.lang.Character`. You can convert between `Char` and numeric types:

```valen
let code = 'A' as Int;          // 65 (safe cast)
let ch = 'A';
let n = ch.toInt();              // 65
let l = ch.toLong();             // 65
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

### Integer Suffixes

Unsuffixed integers default to `Int`. Add an `L` or `l` suffix for `Long`. The suffix works with all bases.

| Suffix    | Resulting Type | Example    |
|-----------|---------------|------------|
| (none)    | `Int`         | `42`       |
| `L` / `l` | `Long`       | `42L`, `42l` |

```valen
let a = 42;        // Int
let b = 42L;       // Long
let c = 42l;       // Long (lowercase also accepted)
let d = 0xFFL;     // Long: 255
let e = 0o77L;     // Long: 63
let f = 0b1010l;   // Long: 10
```

### Floating-Point Literals

Floating-point literals require a digit on both sides of the decimal point (`.5` and `1.` are not valid -- write `0.5` and `1.0`). Scientific notation with `e` / `E` is supported. Underscores are allowed for readability.

| Suffix    | Resulting Type | Example              |
|-----------|---------------|----------------------|
| (none)    | `Double`      | `3.14`, `1.5e10`     |
| `f` / `F` | `Float`      | `3.14f`, `2.5e3F`    |

```valen
let pi = 3.14;           // Double
let rate = 1_000.5;      // Double (underscores OK)
let sci = 1.5e10;        // Double: scientific notation
let neg_exp = 2.0E-3;    // Double: negative exponent
let half = 0.5f;         // Float
let half2 = 0.5F;        // Float (uppercase also accepted)
```

## No Implicit Numeric Conversions

This is the part where Java and Kotlin developers do a double-take. **Valen does not implicitly convert between numeric types.** Ever.

```valen
let x: Long = 42;              // ERROR: type mismatch, Int != Long
let y: Long = 42.toLong();     // OK
let z: Double = 3.14f.toDouble(); // OK
let w: Float = 42.toFloat();   // OK
```

### Conversion Methods

Each numeric type has a specific set of conversion methods. Calling a method that doesn't exist for a type is a compile error.

| Type     | Available Conversion Methods                                  |
|----------|---------------------------------------------------------------|
| `Int`    | `.toLong()`, `.toFloat()`, `.toDouble()`                      |
| `Long`   | `.toInt()`, `.toFloat()`, `.toDouble()`                       |
| `Float`  | `.toInt()`, `.toLong()`, `.toDouble()`                        |
| `Double` | `.toInt()`, `.toLong()`, `.toFloat()`                         |
| `Byte`   | `.toInt()`, `.toLong()`, `.toFloat()`, `.toDouble()`, `.toShort()` |
| `Short`  | `.toInt()`, `.toLong()`, `.toFloat()`, `.toDouble()`, `.toByte()` |
| `Char`   | `.toInt()`, `.toLong()`, `.toFloat()`, `.toDouble()`          |

::: warning No .toChar() or .toByte()/.toShort() on most types
`.toChar()` does not exist on any type. `.toByte()` is only on `Short`, and `.toShort()` is only on `Byte`. If the method isn't in the table above, it's a compile error.
:::

You can also use `as` for numeric casts. All numeric-to-numeric casts (including `Char` to numeric) are safe and don't require an `unsafe` block:

```valen
let x = 42 as Long;      // OK (safe)
let c = 'A' as Int;      // OK (safe): 65
```

**Why no implicit conversions?** Implicit widening is a subtle bug factory in Java/Kotlin. Removing it also makes overload resolution dramatically simpler — the compiler only considers exact type matches. Yes, you type a few more characters. In exchange, numeric mismatches are always caught at compile time. That's a trade worth making.

## Nullable Types (`T?`) vs `Option<T>`

Valen has **two separate mechanisms** for representing absent values, and they are **not interchangeable**:

| Type | What it is | When to use it |
|------|-----------|----------------|
| `Option<T>` | A Valen-native ADT: `enum { Some(T), None }` | Idiomatic Valen code |
| `T?` | A nullable type that permits JVM null | Java interop |

**`T?` is NOT sugar for `Option<T>`.** They are completely different types in the type system. `Option<T>` is a proper enum you destructure with `match` or `if let`. `T?` is a nullable type that maps to JVM boxed types and exists primarily for working with Java APIs that return null.

```valen
let opt: Option<Int> = Option::Some(42);   // Valen-native ADT
let nullable: Int? = 42;                    // nullable type for Java interop
```

The `?` (try) operator works with `Option<T>` and `Result<T, E>`, but **not** with `T?` (nullable).

::: tip Rule of thumb
Use `Option<T>` in your own Valen code. Use `T?` when you're receiving values from Java APIs that might return null.
:::

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
