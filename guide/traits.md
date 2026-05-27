# Traits

Traits are Valen's answer to polymorphism — and they don't involve six layers of abstract class inheritance. A trait defines a contract (a set of methods), and any type can implement that contract via `impl`. Simple, explicit, and no surprises.

## Defining a Trait

A trait declares method signatures that implementors must provide:

```valen
trait Area {
    fn area(self) -> Float;
}

trait Display {
    fn display(self) -> String;
}
```

No method bodies here — just the shapes of things to come. (Pun intended.)

### Default Methods

Traits can also provide default implementations. Implementors can override them or leave the default:

```valen
trait Greet {
    fn greet(self) -> String { "hello" }
}

class Dog {}

// greet is not implemented here — the default is used
impl Greet for Dog {}

let d = Dog();
println(d.greet());  // "hello"
```

If you want to override the default, just provide your own implementation in the `impl` block:

```valen
impl Greet for Cat {
    fn greet(self) -> String { "meow" }
}
```

## Implementing a Trait

Use `impl Trait for Type` to teach a type how to fulfill a trait's contract:

```valen
enum Shape {
    Circle(radius: Float),
    Rect(width: Float, height: Float),
    Point,
}

impl Area for Shape {
    fn area(self) -> Float {
        match self {
            Shape::Circle(r) => 3.14159 * r * r,
            Shape::Rect(w, h) => w * h,
            Shape::Point => 0.0,
        }
    }
}
```

Now anything that expects `Area` can work with `Shape`. No base classes, no `extends`, no existential dread.

::: info All trait/impl methods are public
The compiler forces all methods inside `trait` definitions and `impl` blocks to be `pub`, regardless of what visibility modifier you write. This is by design — trait contracts are public interfaces.
:::

## Inherent Impl — Methods Without a Trait

Sometimes you just want to add methods to a type without defining a whole trait. That's what **inherent impl** is for:

```valen
data class Vec2(pub x: Float, pub y: Float);

impl Vec2 {
    fn length(self) -> Float {
        // math goes here
        0.0
    }

    fn scale(self, factor: Float) -> Vec2 {
        Vec2(x = self.x * factor, y = self.y * factor)
    }
}
```

This is the primary way to add methods to `enum` and `data class` types, since they don't have class bodies with methods.

For `class` types, you can put methods directly in the class body *or* use inherent impl — your call:

```valen
class User(pub name: String, mut age: Int) {
    // Method in class body — works fine
    fn greet(self) -> String {
        f"Hello, {self.name}!"
    }
}

// Inherent impl — also works fine
impl User {
    fn birthday(mut self) {
        self.age = self.age + 1;
    }
}
```

## Receivers: `self` and `mut self`

Trait methods take a receiver as their first parameter:

| Receiver | Meaning |
|---|---|
| `self` | Immutable instance |
| `mut self` | Mutable instance |

That's it. No `&self`, no `&mut self` — Valen doesn't have ownership or borrowing. One less thing to think about.

```valen
trait Counter {
    fn count(self) -> Int;
    fn increment(mut self);
}

impl Counter for ClickTracker {
    fn count(self) -> Int { self.clicks }
    fn increment(mut self) { self.clicks = self.clicks + 1; }
}
```

## The Orphan Rule

You can write `impl Trait for Type` only if:

- **You own the trait** (it's defined in your compilation unit), **or**
- **You own the type** (the outermost type constructor is defined in your compilation unit)

This means you can't go rogue and slap `Display` on `java.lang.String` from your application code. The rule keeps the ecosystem sane — no conflicting implementations floating around.

```valen
// OK — your type, external trait
impl Display for MyType {
    fn display(self) -> String { "..." }
}

// OK — your trait, external type
impl MyTrait for String {
    fn check(self) -> Bool { true }
}

// NOPE — both foreign. Compiler says no.
// impl Display for String { ... }
```

Also forbidden:

- **typealias laundering** — `type MyList = java.util.List<Int>` doesn't make `MyList` "yours"
- **blanket impl** — `impl<T: Foo> Bar for T` is not supported

### Trait Fulfillment Rule

A class body method with the same name and signature as a trait method does **not** count as implementing that trait. Trait implementation *must* happen inside `impl Trait for Type { ... }`. The two are completely independent:

```valen
trait Show {
    fn show(self) -> String;
}

class User(pub name: String) {
    // This is NOT a Show implementation — it's a separate method
    fn show(self) -> String { self.name }
}

// You still need this:
impl Show for User {
    fn show(self) -> String { f"User({self.name})" }
}
```

## UFCS — When Two Traits Walk Into a Method Name

If two traits define a method with the same name and a type implements both, calling `obj.hello()` is ambiguous. The compiler will rightfully complain. Resolve it with **Universal Function Call Syntax**:

```valen
trait Japanese {
    fn hello(self) -> String;
}

trait English {
    fn hello(self) -> String;
}

impl Japanese for Greeter {
    fn hello(self) -> String { "konnichiwa" }
}

impl English for Greeter {
    fn hello(self) -> String { "Hello" }
}

// g.hello() — ambiguous, compile error

// UFCS to the rescue:
let jp = Japanese::hello(g);  // "konnichiwa"
let en = English::hello(g);   // "Hello"
```

The syntax is `Trait::method(receiver, args...)`. The receiver goes in as the first argument.

### Method Resolution Order

When you call `value.foo()`, the compiler resolves it in this order:

1. **Class body methods** — highest priority
2. **Inherent impl methods** — checked if no class body match
3. **Trait methods** — checked if no inherent impl match
4. **Ambiguous?** — compile error, use UFCS

::: tip Class body methods don't satisfy traits
Even if a class body method has the exact same name and signature as a trait method, it does **not** count as implementing that trait. You still need an `impl Trait for Type { ... }` block. They're independent.
:::

## Sealed Traits

A `sealed trait` restricts who can implement it. Only types in the same compilation unit are allowed — which means the compiler knows the full set of implementors and can enforce **exhaustive matching**.

```valen
sealed trait Expr {
    fn eval(self) -> Int;
}

class Lit(pub value: Int) {}
class Add(pub left: Expr, pub right: Expr) {}

impl Expr for Lit {
    fn eval(self) -> Int { self.value }
}

impl Expr for Add {
    fn eval(self) -> Int {
        self.left.eval() + self.right.eval()
    }
}
```

Now you can `match` on `Expr` and the compiler will make sure you handle every case:

```valen
fn describe(e: Expr) -> String {
    match e {
        Lit(value) => f"literal: {value}",
        Add(_, _) => "addition",
        // All implementors covered — no _ needed
    }
}
```

Think of sealed traits as "enum-like but with independent class definitions." Each implementor can have its own fields, methods, and state — more flexible than enum variants, but still a closed world.

**Rules:**
- Implementors must be `class` or `data class` (not `enum`)
- All implementors must be in the same compilation unit

::: info Supertraits are not implemented
The syntax `trait Queryable: Component + Eq { ... }` for declaring supertrait requirements is not currently supported. As a workaround, specify all required bounds at the use site: `<T: Queryable + Component + Eq>`.
:::

## Associated Types

Sometimes a trait needs a "type slot" that each implementor fills in differently. That's an associated type:

```valen
trait Container {
    type Item;
    fn get(self, index: Int) -> Self;  // see note below
}

impl Container for IntList {
    type Item = Int;
    fn get(self, index: Int) -> Int {
        // ...
    }
}
```

You can provide a default: `type Item = Int;` in the trait definition. Implementors can override it or leave the default.

::: warning Self::AssocType is not implemented
The syntax `Self::Item` or `Self::Output` for referencing associated types in trait method signatures is not currently supported by the parser. As a workaround, the stdlib's operator traits use `Self` as the return type instead of `Self::Output`. This means operator implementations always return the same type as the receiver.
:::

## Operator Overloading

Operators in Valen are just trait methods in disguise. Want `+` to work on your type? Implement `Add`.

```valen
data class Vec2(pub x: Float, pub y: Float);

impl Add<Vec2> for Vec2 {
    type Output = Vec2;
    fn add(self, rhs: Vec2) -> Vec2 {
        Vec2(x = self.x + rhs.x, y = self.y + rhs.y)
    }
}

let a = Vec2(x = 1.0, y = 2.0);
let b = Vec2(x = 3.0, y = 4.0);
let c = a + b;  // Vec2(x = 4.0, y = 6.0)
```

### Arithmetic Operators

| Operator | Trait | Method |
|---|---|---|
| `+` | `Add<Rhs>` | `fn add(self, rhs: Rhs) -> Self` |
| `-` | `Sub<Rhs>` | `fn sub(self, rhs: Rhs) -> Self` |
| `*` | `Mul<Rhs>` | `fn mul(self, rhs: Rhs) -> Self` |
| `/` | `Div<Rhs>` | `fn div(self, rhs: Rhs) -> Self` |
| `%` | `Rem<Rhs>` | `fn rem(self, rhs: Rhs) -> Self` |

Each trait declares an associated `type Output`, but since `Self::Output` isn't implemented yet, the return type is `Self` in practice.

### Unary Operators

| Operator | Trait | Method |
|---|---|---|
| `-x` | `Neg` | `fn neg(self) -> Self` |
| `!x` | `Not` | `fn not(self) -> Self` |

### Comparison: `Ord` and `Eq`

For ordering comparisons (`<`, `<=`, `>`, `>=`), implement `Ord`:

```valen
impl Ord for Priority {
    fn cmp(self, rhs: Priority) -> Int {
        self.level - rhs.level
    }
}

// Now: taskA < taskB works
```

`cmp` returns a negative number for `<`, zero for `==`, and positive for `>`.

For equality (`==`, `!=`), you can optionally implement `Eq`:

```valen
impl Eq for CaseInsensitiveString {
    fn eq(self, rhs: CaseInsensitiveString) -> Bool {
        self.value.toLowerCase() == rhs.value.toLowerCase()
    }
}
```

If a type has `impl Eq`, `==` uses `Eq::eq`. If not, it falls back to `.equals()`. Primitives (`Int`, `Float`, etc.) use built-in comparison — no trait needed.

## derives — Auto-Implementing Traits

Writing `equals`, `hashCode`, and `toString` by hand is a rite of passage. Fortunately, you only need to do it once in your career. After that, use `derives`:

```valen
pub data class Entity(pub id: Int) derives(Eq, Hash);

pub enum Color derives(Eq, Hash, Display) {
    Red,
    Green,
    Blue(value: Int),
}

pub class Point(pub x: Float, pub y: Float) derives(Eq) {}
```

### Available derives

| Trait | What You Get |
|---|---|
| `Eq` | `equals` — field-by-field comparison |
| `Hash` | `hashCode` — deterministic hash from fields |
| `Display` | `toString` — `TypeName(field=value, ...)` format |
| `Clone` | `copy` — copy constructor with all fields |

### data class Gets Them for Free

Here's the kicker: `data class` automatically derives `Eq`, `Hash`, `Display`, and `Clone` without you writing anything. It's the whole point of `data class`.

```valen
// All four traits are auto-generated. No derives() needed.
pub data class Point(pub x: Float, pub y: Float);

let a = Point(x = 1.0, y = 2.0);
let b = Point(x = 1.0, y = 2.0);
a == b  // true — structural equality, no ceremony
```

You *can* write `derives(Eq)` on a data class if it makes you feel better. It's redundant but harmless.

## What's Next?

- [Error Handling](./error-handling) — Option, Result, and the `?` operator
- [Java Interop](./java-interop) — using Java libraries from Valen
