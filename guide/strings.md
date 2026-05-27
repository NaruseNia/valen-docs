# Strings

Strings in Valen are simple. Deliberately so. This is one of those pages you'll read in two minutes and remember forever.

## String Literals

Strings are double-quoted, immutable, and backed by `java.lang.String` on the JVM.

```valen
let greeting = "Hello, world!";
```

### Escape Sequences

The usual suspects:

| Escape | Meaning          |
|--------|------------------|
| `\\`   | Backslash        |
| `\n`   | Newline          |
| `\r`   | Carriage return  |
| `\t`   | Tab              |
| `\"`   | Double quote     |
| `\{`   | Literal `{` (in f-strings) |
| `\}`   | Literal `}` (in f-strings) |

```valen
let path = "C:\\Users\\valen";
let multiline = "line one\nline two";
```

## f-strings: String Interpolation

Prefix a string with `f` and drop expressions inside `{ }`. The compiler handles the rest.

```valen
let name = "Alice";
let age = 30;

let msg = f"Hello, {name}!";                // "Hello, Alice!"
let info = f"{name} is {age} years old.";    // "Alice is 30 years old."
let math = f"1 + 2 = {1 + 2}";              // "1 + 2 = 3"
```

You can use variable references, field access, method chains, and simple binary expressions inside the braces:

```valen
let user = get_user(1);
let label = f"User: {user.name}, score: {user.score * 2}";
```

### Limitations

f-strings keep things simple on purpose:

- **No block expressions** inside `{ }`. You can't write `f"{ let x = 1; x + 2 }"`.
- **No nested f-strings.** `f"outer {f"inner"}"` is not allowed.
- Stick to simple expressions. If your interpolation needs multiple lines of logic, compute it beforehand and interpolate the result.

```valen
// Don't try to be clever inside the braces
let result = compute_something();
let msg = f"The answer is {result}";   // clean and clear
```

### Escaping Braces

Need a literal `{` or `}` in an f-string? Escape it:

```valen
let json_ish = f"\{\"name\": \"{name}\"\}";
// {"name": "Alice"}
```

## Immutability

`String` is immutable. There's no `StringBuilder` or mutable string type in the language itself — if you need one, reach for `java.lang.StringBuilder` through Java interop.

```valen
let s = "hello";
// s[0] = 'H';    // not a thing — strings are immutable
```

String concatenation with `+` works but creates new strings each time. For anything beyond trivial cases, f-strings or `StringBuilder` are your friends.

---

**Next up:** [Classes](./classes) — time to model some real data.
