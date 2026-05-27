# Classes

## Class Declaration

```valen
class User(pub name: String, mut age: Int) {
    fn greet(self) -> String {
        f"Hello, {self.name}!"
    }

    fn from_name(name: String) -> User {
        User(name = name, age = 0)
    }
}
```

Classes are **final by default**. Methods are defined directly inside the class body — there is no `impl Class { ... }` block. Trait implementations are separate: `impl Trait for Class { ... }`.

## Primary Constructor Parameters

Every class has a mandatory primary constructor. Parameters declare the class fields.

| Modifier    | Visibility    | Mutability | Example              |
|-------------|---------------|------------|----------------------|
| *(none)*    | Private       | Immutable  | `name: String`       |
| `pub`       | Public        | Immutable  | `pub name: String`   |
| `mut`       | Private       | Mutable    | `mut age: Int`       |
| `pub mut`   | Public        | Mutable    | `pub mut age: Int`   |

Modifier order: visibility first, then `mut` — `pub mut`, not `mut pub`.

Constructor parameters support default values:

```valen
class Config(pub host: String = "localhost", pub port: Int = 8080) {}
```

## data class

```valen
data class Point(x: Float, y: Float);
data class User(pub name: String, pub email: String);
```

### Auto-generated Methods

| Method       | Behavior                                |
|--------------|-----------------------------------------|
| `equals`     | Field-by-field structural comparison    |
| `hashCode`   | 31-multiply-accumulate over all fields  |
| `toString`   | `TypeName(field=value, ...)` format     |
| `copy`       | Copy constructor with named overrides   |

Auto-generation considers **only the primary constructor parameters** of the data class itself (not inherited state).

### Restrictions

| Rule                       | Detail                                           |
|----------------------------|--------------------------------------------------|
| Always `final`             | Cannot be subclassed                             |
| No `open` / `abstract` / `sealed` | These modifiers are forbidden on data class |
| Cannot be a superclass     | Other classes cannot extend a data class         |
| Can extend sealed/open/abstract class | Usable as a leaf in sealed hierarchies |
| Trait impl allowed         | `impl Trait for DataClass { ... }` works         |
| Semicolon terminator       | Body-less data class ends with `;`               |

## open / abstract / sealed class

| Modifier   | Subclassable | Can instantiate | Methods                     |
|------------|-------------|------------------|-----------------------------|
| *(none)*   | No (final)  | Yes              | All concrete                |
| `open`     | Yes         | Yes              | Mark overridable methods with `open fn` |
| `abstract` | Yes         | No               | May have `abstract fn` (no body)        |
| `sealed`   | Yes (same module only) | No      | Closed hierarchy for exhaustive match   |

```valen
open class Animal(pub name: String) {
    open fn speak(self) -> String { "..." }
}

abstract class Shape {
    abstract fn area(self) -> Float
}

sealed class Payment;
class Card(pub number: String) : Payment();
data class Cash : Payment();
```

`open` does not cascade — if `B : A` and `B` itself should be subclassable, `B` must also be declared `open`.

## override fn

Overriding a parent method requires both `open fn` on the parent and `override fn` on the child.

```valen
class Dog(pub name: String) : Animal(name) {
    override fn speak(self) -> String { "woof" }
}
```

- Omitting `override` when shadowing a parent method is a compile error.
- `override` is only required when the signature matches a parent `open fn`.
- Class body methods do **not** satisfy trait requirements — trait implementations must be in `impl Trait for Type { ... }` blocks.

## Superclass Constructor Call

The superclass constructor is called in the inheritance clause:

```valen
class Dog(pub name: String) : Animal(name) {
    // ...
}
```

Arguments are passed directly to the parent's primary constructor.

## super Calls

`super.method()` calls the parent **class** method only. To call a trait default method, use UFCS: `Trait::method(self)`.

## Unsupported Features

- `init { ... }` blocks
- Secondary constructors
- Field overrides (`override val`)
- Nested / inner classes
