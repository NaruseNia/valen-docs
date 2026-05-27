# Traits

## Trait Declaration

```valen
trait Area {
    fn area(self) -> Float;
}

trait Display {
    fn display(self) -> String;
}
```

All trait methods are forced to `pub` visibility. Even if you write a visibility modifier on a trait method, it is ignored — the parser hardcodes all trait methods as `Visibility::Pub`.

## Default Methods

Trait methods can have a default implementation (a body). If an `impl` block omits a method that has a default body, the default is used instead of raising a compile error.

```valen
trait Greet {
    fn greet(self) -> String { "hello" }
}

class Dog {}

// greet omitted — default implementation is used
impl Greet for Dog {}
```

- If the impl provides the same method, it overrides the default (signature must match).

## impl Trait for Type

```valen
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

Class body methods do **not** satisfy trait requirements. Trait implementation always requires an explicit `impl Trait for Type { ... }` block. If a class body has a method with the same name and signature as a trait method, calling `value.foo()` resolves to the class body method.

::: info
All methods inside `impl` blocks are forced to `pub` by the resolver, regardless of what visibility modifier you write. impl methods are effectively always public.
:::

## Inherent impl

`impl Type { ... }` adds methods directly to a type. This is the primary way to add methods to `enum` and `data class`.

```valen
impl Vec2 {
    fn length(self) -> Float { /* ... */ }
    fn scale(self, factor: Float) -> Vec2 { /* ... */ }
}
```

Classes can also define methods in the class body — inherent `impl` is optional for classes.

## Receiver

| Form | Meaning |
|---|---|
| `fn f(self)` | Explicit self receiver |
| `fn f(mut self)` | Mutable self receiver |
| `fn f(&self)` / `fn f(&mut self)` | **Not supported** (no ownership model) |

## Orphan Rule

`impl Trait for Type` is allowed only if **at least one** of the following holds:

- `Trait` is defined in the current **compilation unit**.
- The outermost nominal type constructor of `Type` is owned by the current **compilation unit**.

The coherence checker determines ownership based on definitions in the HIR `local_defs`. Prelude-injected synthetic types are excluded. Names that only appear via import are considered "foreign".

### Prohibited

| Case | Example | Reason |
|------|---------|--------|
| Foreign trait for foreign type | `impl java.util.List for java.lang.String` | Neither owned |
| typealias bypass | `typealias MyList = java.util.List<Int>; impl Foo for MyList` | typealias does not create ownership |
| Blanket impl | `impl<T: Foo> Bar for T` | Not supported |

### stdlib Exception

`valen.core` and `valen.std.*` packages can implement foreign traits for foreign types (for Java collection integration). User code cannot.

### Uniqueness

Each `(Trait, Type)` pair has exactly one global implementation. Duplicate impls are a compile error.

### Trait Satisfaction

- Trait method implementation is only established inside an `impl Trait for Type { ... }` block.
- A class body method with the same name/signature as a trait method does **not** satisfy the trait.
- When both exist, `value.foo()` resolves to the class body method first.

### Conflict Resolution

1. Class body member (method / associated function) takes highest priority if applicable.
2. When multiple trait methods are candidates and ambiguous, use UFCS: `Trait::foo(value, args)`.

## UFCS (Uniform Function Call Syntax)

When method resolution is ambiguous between multiple traits, use UFCS to disambiguate:

```valen
Trait::method(receiver, args...)
```

```valen
// Ambiguous — both TraitA and TraitB define `process`
TraitA::process(value, arg);
```

`Class::name(args)` is **only** for associated functions (no `self`). Instance methods always use dot syntax.

## sealed trait

A `sealed trait` restricts its implementors to the same compilation unit, enabling exhaustive `match`.

```valen
sealed trait Expr {
    fn eval(self) -> Int;
}

class Lit {}
class Add {}

impl Expr for Lit { fn eval(self) -> Int { 0 } }
impl Expr for Add { fn eval(self) -> Int { 1 } }

match e {
    Lit => 0,
    Add => 1,
}   // exhaustive — all implementors covered
```

| Rule                              | Detail                                    |
|-----------------------------------|-------------------------------------------|
| Implementors: `class`, `data class` only | `enum` cannot implement sealed trait  |
| Permit scope                      | Same compilation unit                     |
| JVM ABI                           | `sealed interface` with `PermittedSubclasses` |

::: warning
Supertraits (e.g. `sealed trait Foo: Bar`) are **not supported**. See [Intersection Constraints](#intersection-constraints) for the current alternative.
:::

## Associated Type

```valen
trait Container {
    type Item;
    fn get(self, index: Int) -> Self;  // Note: Self::Item is not implemented
}

impl Container for IntList {
    type Item = Int;
    fn get(self, index: Int) -> Int { /* ... */ }
}
```

- One concrete type per impl.
- Default type allowed in the trait definition: `type Item = Int;`.

::: warning Future
**`Self::AssocType` reference syntax is not implemented.** The parser does not resolve `Self::Item` as a type path. Type paths use `.` (dot) for segments, and `::` is only for value-level variant access.

As a workaround, stdlib operator traits use `Self` as the return type instead of `Self::Output`.
:::

## derives

`derives(Trait1, Trait2)` on a type declaration auto-generates trait implementations.

```valen
data class Point(x: Float, y: Float);                    // implicit derives(Eq, Hash, Display, Clone)
enum Color derives(Eq, Hash, Display) { Red, Green, Blue(value: Int) }
class Pos(pub x: Float, pub y: Float) derives(Eq) {}
```

### Derivable Traits

| Trait     | Generated Method                      | Behavior                              |
|-----------|---------------------------------------|---------------------------------------|
| `Eq`     | `equals(Object) -> boolean`           | Field-by-field comparison             |
| `Hash`   | `hashCode() -> int`                   | 31-multiply-accumulate                |
| `Display` | `toString() -> String`               | `TypeName(field=value, ...)` format   |
| `Clone`  | `copy(fields...) -> Self`             | Copy constructor with all fields      |

`data class` automatically derives all four — explicit `derives(...)` is redundant but harmless.

## Operator Overloading

Implement the corresponding trait from the prelude to overload an operator.

### Arithmetic Operators

| Operator | Trait       | Method Signature                              |
|----------|-------------|-----------------------------------------------|
| `+`      | `Add<Rhs>`  | `fn add(self, rhs: Rhs) -> Self`             |
| `-`      | `Sub<Rhs>`  | `fn sub(self, rhs: Rhs) -> Self`             |
| `*`      | `Mul<Rhs>`  | `fn mul(self, rhs: Rhs) -> Self`             |
| `/`      | `Div<Rhs>`  | `fn div(self, rhs: Rhs) -> Self`             |
| `%`      | `Rem<Rhs>`  | `fn rem(self, rhs: Rhs) -> Self`             |

Each arithmetic trait declares an associated `type Output`, but since `Self::Output` is [not yet implemented](#associated-type), the method return type is `Self`.

### Unary Operators

| Operator | Trait  | Method Signature                     |
|----------|--------|--------------------------------------|
| `-x`     | `Neg`  | `fn neg(self) -> Self`               |
| `!x`     | `Not`  | `fn not(self) -> Self`               |

### Comparison Operators

| Operator             | Trait  | Method Signature                   |
|----------------------|--------|------------------------------------|
| `<` `<=` `>` `>=`   | `Ord`  | `fn cmp(self, rhs: Self) -> Int`   |

`cmp` returns: negative → `<`, zero → `==`, positive → `>`.

### Equality Operators

| Operator     | Trait | Method Signature                     |
|--------------|-------|--------------------------------------|
| `==` `!=`    | `Eq`  | `fn eq(self, rhs: Self) -> Bool`     |

- If `impl Eq` exists → uses `Eq::eq`.
- If `impl Eq` does not exist → falls back to `.equals()`.
- Primitive type `==` is built-in (no trait needed).

### Example

```valen
impl Add<Vec2> for Vec2 {
    type Output = Vec2;
    fn add(self, rhs: Vec2) -> Vec2 {
        Vec2(x = self.x + rhs.x, y = self.y + rhs.y)
    }
}
```

## Intersection Constraints

Use `+` to require multiple trait bounds on a type parameter:

```valen
fn process<T: System + EventHandler>(system: T, world: World) -> Unit { ... }
```

When `T: A + B` is declared, both `A` and `B` methods are callable on `T`, and any concrete type substituted for `T` must implement both.

::: warning Future — Supertraits
Supertrait syntax (e.g. `trait Queryable: Component + Eq { ... }`) is **not implemented**. The AST does not have a `supertypes` field for trait declarations, and the parser does not parse a supertrait list after `:`.

As a workaround, require all bounds at the use site: `T: Queryable + Component + Eq`.
:::
