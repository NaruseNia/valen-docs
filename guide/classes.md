# Classes & Data Classes

Every object-oriented language has classes. Valen's twist: the constructor lives *in the class name*, there's no `new` keyword, and the compiler assumes everything is immutable and private unless you say otherwise. Welcome to the pit of success.

## Primary Constructor

A class's constructor parameters sit right after the class name. No separate `constructor` block, no `init` body — just parentheses and you're done.

```valen
class User(pub name: String, mut age: Int) {
    fn greet(self) -> String {
        f"Hello, {self.name}!"
    }
}
```

That's a class with two fields: `name` is publicly readable, `age` is privately mutable. Creating an instance is refreshingly boring:

```valen
let alice = User(name = "Alice", age = 30);
```

No `new`. No ceremony. Just call the class like a function with named arguments.

## Field Visibility

Every constructor parameter becomes a field. You control access with two modifiers — `pub` and `mut` — always in that order:

| Modifier   | Read from outside | Write from outside | Mutable inside |
|------------|-------------------|--------------------|----------------|
| *(none)*   | No                | No                 | No             |
| `pub`      | Yes               | No                 | No             |
| `mut`      | No                | No                 | Yes            |
| `pub mut`  | Yes               | Yes                | Yes            |

The default (no modifier) gives you a private, immutable field. This is intentional — Valen nudges you toward the safest option first.

```valen
class Config(
    pub name: String,          // anyone can read, nobody can write
    pub mut retries: Int,      // anyone can read and write
    mut internal_state: Int,   // only this class can mutate
    secret: String,            // private and frozen forever
) {
    fn tick(mut self) {
        self.internal_state = self.internal_state + 1;
    }
}

let cfg = Config(
    name = "app",
    retries = 3,
    internal_state = 0,
    secret = "hunter2",
);

println(cfg.name);      // OK
cfg.retries = 5;         // OK
// cfg.secret            // ERROR: private field — nice try
```

## Methods

Methods live directly inside the class body. No separate `impl` block needed.

### Instance Methods

A function that takes `self` as its first parameter is an instance method. Call it with dot syntax.

```valen
class Counter(pub mut count: Int) {
    fn increment(mut self) {
        self.count = self.count + 1;
    }

    fn current(self) -> Int {
        self.count
    }
}

let mut c = Counter(count = 0);
c.increment();
println(c.current());  // 1
```

- `self` — immutable receiver (read-only access to fields)
- `mut self` — mutable receiver (can modify fields)

If you forget `mut self` and try to mutate a field, the compiler will politely refuse. It's looking out for you.

### Associated Functions

A function without `self` is an associated function. Call it with `::` syntax. Think of it as Java's `static` without the keyword.

```valen
class User(pub name: String, mut age: Int) {
    fn anonymous() -> User {
        User(name = "Anonymous", age = 0)
    }

    fn greet(self) -> String {
        f"Hello, {self.name}!"
    }
}

let ghost = User::anonymous();   // associated function — note the ::
println(ghost.greet());           // instance method — note the .
```

The distinction is purely based on whether `self` appears in the parameter list. No `static` keyword exists in Valen.

## Default Arguments

Constructor parameters can have default values, letting callers skip what they don't care about:

```valen
class HttpClient(
    pub base_url: String,
    pub mut timeout: Int = 30,
    pub mut retries: Int = 3,
) {
    fn get(self, path: String) -> String {
        // ...
    }
}

let client = HttpClient(base_url = "https://api.example.com");
// timeout = 30, retries = 3 — defaults kick in

let impatient = HttpClient(
    base_url = "https://api.example.com",
    timeout = 5,
);
// retries still defaults to 3
```

Named arguments and default values play together nicely — skip any parameter that has a default, in any order.

## Data Classes

When all you want is a bag of data with sensible `equals`, `hashCode`, `toString`, and `copy`, reach for `data class`. Note the semicolon at the end — data classes don't need a body.

```valen
data class Point(pub x: Float, pub y: Float);

data class User(pub name: String, pub email: String);
```

The compiler auto-generates:

- **`equals`** — structural comparison of all fields
- **`hashCode`** — consistent hash based on all fields
- **`toString`** — `Point(x=1.0, y=2.0)` format
- **`copy`** — clone with selected fields changed

```valen
let p1 = Point(x = 1.0f, y = 2.0f);
let p2 = Point(x = 1.0f, y = 2.0f);

p1 == p2        // true — structural equality, not reference
println(p1);    // Point(x=1.0, y=2.0)

let p3 = p1.copy(x = 3.0f);
println(p3);    // Point(x=3.0, y=2.0)
```

### Data Class Restrictions

- Data classes are always **final** — you can't `open` or `abstract` them
- They cannot be superclasses
- They *can* extend `sealed` / `open` / `abstract` classes
- They *can* implement traits

## Inheritance

Classes are **final by default**. If you want a class to be extensible, you have to opt in explicitly.

### Open Classes

```valen
open class Animal(pub name: String) {
    open fn speak(self) -> String {
        "..."
    }
}

class Dog(pub name: String) : Animal(name) {
    override fn speak(self) -> String {
        "woof"
    }
}
```

Key points:
- Inherit with `: ParentClass(args)`
- Methods are also final by default — mark overridable ones with `open fn`
- Subclasses must use `override fn` (forgetting it is a compile error, not a silent bug)
- `open` does not propagate — `Dog` is final unless you write `open class Dog`

### Abstract Classes

For when you want to declare a method without implementing it:

```valen
abstract class Shape {
    abstract fn area(self) -> Float;

    fn describe(self) -> String {
        f"area = {self.area()}"
    }
}

class Circle(pub r: Float) : Shape() {
    override fn area(self) -> Float {
        3.14159 * self.r * self.r
    }
}
```

- `abstract fn` has no body — subclasses must implement it
- Abstract classes cannot be instantiated directly

### Sealed Classes

A `sealed class` defines a closed set of subtypes. The compiler knows every possible subtype, which enables exhaustive `match`:

```valen
sealed class Payment;

class Card(pub number: String, pub expiry: String) : Payment();
data class Cash(pub amount: Int) : Payment();
class BankTransfer(pub account: String) : Payment();
```

```valen
fn describe(payment: Payment) -> String {
    match payment {
        Card(number, _) => f"Card ending in {number}",
        Cash(amount) => f"Cash: {amount}",
        BankTransfer(account) => f"Transfer to {account}",
    }
    // All subtypes covered — no wildcard needed
}
```

Sealed class rules:
- All subtypes must be defined in the same module
- Subtypes can be `class` or `data class`
- Each subtype can have its own fields, methods, and trait implementations

### Super Calls

Subclasses can call parent methods with `super`:

```valen
open class Animal(pub name: String) {
    open fn speak(self) -> String {
        f"I am {self.name}"
    }
}

class Dog(pub name: String) : Animal(name) {
    override fn speak(self) -> String {
        let base = super.speak();
        f"{base}, woof!"
    }
}
```

## Coming from Java?

| Java                          | Valen                                  |
|-------------------------------|----------------------------------------|
| `new User("Alice", 30)`      | `User(name = "Alice", age = 30)`       |
| `public final class`         | `class` (final by default)             |
| `public class`               | `open class`                           |
| `static void create()`       | `fn create()` (no `self` parameter)    |
| `User.create()`              | `User::create()`                       |
| `record Point(int x, int y)` | `data class Point(pub x: Int, pub y: Int);` |
