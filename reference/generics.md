# Generics

## Declaration Syntax

Type parameters use `<T>` angle-bracket syntax, placed after the name being parameterized.

### Functions

```valen
fn identity<T>(x: T) -> T { x }
fn swap<A, B>(pair: Pair<A, B>) -> Pair<B, A> { ... }
```

### Classes

```valen
class Box<T>(pub value: T) {
    fn get(self) -> T { self.value }
}
```

### Data Classes

```valen
data class Pair<A, B>(pub first: A, pub second: B);
```

### Traits

```valen
trait Mapper<T> {
    fn map<U>(self, f: fn(T) -> U) -> Self;
}
```

### Enums

```valen
enum Tree<T> {
    Leaf(value: T),
    Node(left: Tree<T>, right: Tree<T>),
}
```

## Bounds

Constrain a type parameter to require specific trait implementations.

| Syntax | Meaning |
|---|---|
| `T: Trait` | `T` must implement `Trait` |
| `T: A + B` | `T` must implement both `A` and `B` |

```valen
fn print_value<T: Display>(value: T) {
    println(value.display());
}

fn process<T: System + EventHandler>(system: T, world: World) -> Unit { ... }
```

Bounds work on class type parameters as well:

```valen
class SortedList<T: Comparable>(mut items: List<T>) { ... }
```

::: info
**`where` clauses are not supported.** All bounds must be declared inline at the type parameter site (`T: Bound`). There is no `where T: Bound` syntax.
:::

## Variance

Declared at the type parameter site. Controls subtyping direction.

| Annotation | Name | Meaning | Kotlin | Java |
|---|---|---|---|---|
| `out T` | Covariant | Type can produce `T` but not consume it | `out T` | `? extends T` |
| `in T` | Contravariant | Type can consume `T` but not produce it | `in T` | `? super T` |
| *(none)* | Invariant | No subtyping relation on `T` | `T` | `T` |

```valen
class Producer<out T>(value: T) {
    fn get(self) -> T { self.value }     // OK: T in output position
}

class Consumer<in T> {
    fn accept(self, value: T) { ... }    // OK: T in input position
}
```

::: warning
**Variance is parsed but not enforced.** The parser recognizes `out` and `in` annotations and stores them as `Variance::Covariant` / `Variance::Contravariant`, but the type checker does **not** validate variance constraints. For example, using an `out T` in an input position compiles without error. Enforcement is planned for a future phase.
:::

## Explicit Type Arguments

Type arguments can be specified at call sites when inference is insufficient.

```valen
let list = ArrayList<String>();
let map = HashMap<String, Int>();
let x = parse<Int>("42");
let items = iter(list).collect<List<String>>();
```

Type arguments are optional when inference succeeds.

## Reified Type Parameters

`reified T` preserves type information at runtime by substituting the concrete type at each call site. Only available on `inline fn`.

```valen
inline fn <reified T> isInstance(value: Any) -> Bool {
    value is T
}

let a = isInstance<String>("hello");  // true
let b = isInstance<Int>("hello");     // false
```

### Operations on `reified T`

| Operation | Syntax | JVM Codegen | Status |
|---|---|---|---|
| Type check | `value is T` | `instanceof ConcreteType` | Implemented |
| Cast | `value as T` | `checkcast ConcreteType` | Implemented |
| Class literal | `T::class` | `ldc ConcreteType.class` | **Not implemented** |

::: warning
`T::class` is not yet supported. Only `is` and `as` operations work with reified type parameters.
:::

### Constraints

| Rule | Detail |
|---|---|
| Only in `inline fn` | Cannot use `reified` on regular `fn`, `class`, `trait`, or `enum` type parameters |
| Mixing allowed | `inline fn <reified T, U>` — `T` is reified, `U` is erased |
| No recursion | `inline fn` cannot call itself (infinite expansion) |
| Java interop | `reified` is ignored when called from Java (normal erasure applies) |

## Type Erasure on JVM

Non-reified type parameters are erased at runtime, consistent with JVM generics.

- Compile time: full type checking with parameterized types
- Runtime: type parameters are erased to their bounds (or `Object`)

```valen
// Compile time: Box<Int> and Box<String> are distinct types
let a: Box<Int> = Box(value = 42);
let b: Box<String> = Box(value = "hello");

// Runtime: both are Box (type parameter erased)
```

To retain type information at runtime, use `inline fn` with `reified`.
