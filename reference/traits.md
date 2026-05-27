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

Traits declare method signatures that types must implement. Default method bodies are not currently supported.

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

Class body methods do **not** satisfy trait requirements. Trait implementation always requires an explicit `impl Trait for Type { ... }` block.

## Inherent impl

`impl Type { ... }` adds methods directly to a type. This is the primary way to add methods to `enum` and `data class`.

```valen
impl Vec2 {
    fn length(self) -> Float { /* ... */ }
    fn scale(self, factor: Float) -> Vec2 { /* ... */ }
}
```

Classes can also define methods in the class body — inherent `impl` is optional for classes.

## Orphan Rule

`impl Trait for Type` is allowed only if **at least one** of the following holds:

- `Trait` is defined in the current **module**.
- The outermost nominal type constructor of `Type` is owned by the current **module**.

### Prohibited

| Case | Example | Reason |
|------|---------|--------|
| Foreign trait for foreign type | `impl java.util.List for java.lang.String` | Neither owned |
| typealias bypass | `typealias MyList = java.util.List<Int>; impl Foo for MyList` | typealias does not create ownership |
| Blanket impl | `impl<T: Foo> Bar for T` | Not supported |

### stdlib Exception

`valen.core` and `valen.std.*` packages can implement foreign traits for foreign types (for Java collection integration). User code cannot.

### Uniqueness

Each `(Trait, Type)` pair has exactly one global implementation. Duplicate impls across modules are a compile error.

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

## Associated Type

```valen
trait Container {
    type Item;
    fn get(self, index: Int) -> Self::Item;
}

impl Container for IntList {
    type Item = Int;
    fn get(self, index: Int) -> Int { /* ... */ }
}
```

- Referenced via `Self::Name` inside the trait.
- One concrete type per impl.
- Default type allowed: `type Item = Int;` in the trait definition.

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
| `+`      | `Add<Rhs>`  | `fn add(self, rhs: Rhs) -> Self::Output`     |
| `-`      | `Sub<Rhs>`  | `fn sub(self, rhs: Rhs) -> Self::Output`     |
| `*`      | `Mul<Rhs>`  | `fn mul(self, rhs: Rhs) -> Self::Output`     |
| `/`      | `Div<Rhs>`  | `fn div(self, rhs: Rhs) -> Self::Output`     |
| `%`      | `Rem<Rhs>`  | `fn rem(self, rhs: Rhs) -> Self::Output`     |

Each arithmetic trait has an associated `type Output`.

### Unary Operators

| Operator | Trait  | Method Signature                     |
|----------|--------|--------------------------------------|
| `-x`     | `Neg`  | `fn neg(self) -> Self::Output`       |
| `!x`     | `Not`  | `fn not(self) -> Self::Output`       |

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

Use `+` to require multiple trait bounds:

```valen
fn process<T: System + EventHandler>(system: T) -> Unit { /* ... */ }
trait Queryable: Component + Eq { /* ... */ }
```
