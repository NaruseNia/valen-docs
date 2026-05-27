# Generics

Generics let you write code that works with any type — until you tell it not to. Valen uses angle-bracket syntax like Java and Kotlin, supports trait bounds for constraints, and accepts declaration-site variance annotations for future enforcement.

## Basic Generics

Declare a type parameter in angle brackets after the function or class name:

```valen
fn identity<T>(x: T) -> T {
    x
}
```

This function accepts any type `T` and returns the same type. At the call site, type inference usually figures out `T` for you:

```valen
let a = identity(42);        // T = Int
let b = identity("hello");   // T = String
```

When inference needs a hint, specify the type argument explicitly:

```valen
let c = identity<String>("hello");
```

## Generic Functions

Functions can have multiple type parameters, separated by commas:

```valen
fn first<T>(items: List<T>) -> Option<T> {
    if items.is_empty() {
        None
    } else {
        Some(items.get(0))
    }
}

fn swap<A, B>(pair: Pair<A, B>) -> Pair<B, A> {
    Pair(first = pair.second, second = pair.first)
}
```

Nothing surprising here — it works exactly like you'd expect from Java or Kotlin.

## Generic Classes

Type parameters go right after the class name. Methods inside the class can reference them freely:

```valen
class Box<T>(pub value: T) {
    fn get(self) -> T {
        self.value
    }

    fn map<U>(self, f: fn(T) -> U) -> Box<U> {
        Box(value = f(self.value))
    }
}

let box = Box(value = 42);
let mapped = box.map(|x| f"{x}");  // Box<String>
```

Notice that `map` introduces its own type parameter `U` in addition to the class's `T`. Methods can have extra type parameters — they're not limited to what the class declares.

Data classes work the same way:

```valen
data class Pair<A, B>(pub first: A, pub second: B);

let pair = Pair(first = "name", second = 42);
println(pair);       // Pair(first=name, second=42)

let other = Pair(first = "name", second = 42);
pair == other        // true — data class structural equality
```

The auto-generated `equals`, `hashCode`, `toString`, and `copy` all respect the type parameters.

## Trait Bounds

Unconstrained type parameters are useful, but sometimes you need to guarantee that a type supports certain operations. That's where bounds come in.

### Single Bound

Use `: TraitName` after the type parameter:

```valen
fn print_value<T: Display>(value: T) {
    println(value.display());
}
```

`T: Display` means "T must implement the `Display` trait." Without this bound, calling `value.display()` would be a compile error — the compiler doesn't know if `T` has that method.

### Multiple Bounds (Intersection Constraints)

Chain bounds with `+`:

```valen
fn log<T: Display + Debug>(value: T) {
    println(f"display: {value.display()}");
    println(f"debug: {value.debug()}");
}

fn process<T: System + EventHandler>(system: T, world: World) -> Unit {
    // T must implement both System and EventHandler
}
```

`T` must implement all listed traits. If it's missing any one of them, the call site won't compile.

### Bounds on Classes

Class type parameters can be bounded too:

```valen
class SortedList<T: Comparable>(mut items: List<T>) {
    fn add(mut self, item: T) {
        self.items.add(item);
        self.items.sort();
    }

    fn first(self) -> Option<T> {
        if self.items.is_empty() {
            None
        } else {
            Some(self.items.get(0))
        }
    }
}
```

You can only create a `SortedList<T>` if `T` implements `Comparable`. Try `SortedList<SomeRandomType>` and the compiler will stop you.

::: info No `where` clauses
Valen does not support `where` clauses for type bounds. All bounds are specified inline with the type parameter declaration (e.g., `<T: Foo + Bar>`). If you need complex bounds, list them all with `+`.
:::

## Variance

Variance controls how subtyping relationships between types translate to their generic wrappers. Valen uses declaration-site variance annotations (like Kotlin), so you annotate it once in the class definition instead of at every use site.

| Annotation | Name | Meaning | Java equivalent |
|------------|------|---------|-----------------|
| `out T` | Covariant | Produces `T`, never consumes it | `? extends T` |
| `in T` | Contravariant | Consumes `T`, never produces it | `? super T` |
| *(none)* | Invariant | Both produces and consumes `T` | `T` |

```valen
// Covariant: only produces T (returns it, never takes it as input)
class Producer<out T>(value: T) {
    fn get(self) -> T {
        self.value
    }
}

// Contravariant: only consumes T (takes it as input, never returns it)
trait Consumer<in T> {
    fn accept(self, value: T) -> Unit;
}
```

::: warning Variance is parsed but not enforced
The compiler accepts `in` and `out` annotations and stores them in the AST, but **variance constraints are not currently checked or enforced**. This means the compiler won't stop you from putting `T` in a contravariant position when you declared `out T`. Semantic enforcement is planned for a future release. For now, the annotations serve as documentation of your intent.
:::

## Type Erasure on the JVM

Valen generics follow JVM type erasure, just like Java and Kotlin:

- **Compile time:** full type checking — `Box<Int>` and `Box<String>` are distinct types
- **Runtime:** type parameters are erased — both are just `Box`

```valen
let a: Box<Int> = Box(value = 42);
let b: Box<String> = Box(value = "hello");
// At runtime, a and b are both just Box — the JVM doesn't know about Int or String
```

This means you can't do `value is T` or `value as T` with a normal generic type parameter. The type information simply isn't there at runtime.

## Reified Generics (extracting the real type)

To work around erasure, Valen supports `reified` type parameters on `inline fn`. The function body is inlined at each call site, and the concrete type is substituted in:

```valen
inline fn <reified T> isInstance(value: Any) -> Bool {
    value is T    // this works because T is reified
}

isInstance<String>("hello")   // true
isInstance<Int>("hello")      // false
```

With `reified T` you can:
- **Type check:** `value is T`
- **Cast:** `value as T`

::: tip
`reified` only works on `inline fn`. Regular functions, classes, traits, and enums cannot have reified type parameters. For the full details, see the [Inline Functions & Reified Generics](/guide/inline-reified) chapter.
:::

## Type Inference

In practice, you rarely need to spell out type arguments. The compiler infers them from context:

```valen
let box = Box(value = 42);                    // Box<Int>
let pair = Pair(first = 1, second = "a");     // Pair<Int, String>
let id = identity("hello");                   // String

// When there's no context, annotate the variable:
let empty: List<Int> = List();
```

Explicit type arguments are the escape hatch, not the default. Let inference do its job, and specify types only when the compiler asks.

## Next Steps

- [Classes](./classes) — generic classes, data classes, and inheritance
- [Traits](./traits) — defining the bounds that constrain type parameters
