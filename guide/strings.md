# Strings

Strings in Valen are simple. Deliberately so. This is one of those pages you'll read in two minutes and remember forever.

## String Literals

Strings are double-quoted, immutable, and backed by `java.lang.String` on the JVM.

```valen
let greeting = "Hello, world!";
```

### Escape Sequences

Strings support the following escape sequences:

| Escape | Meaning          |
|--------|------------------|
| `\\`   | Backslash        |
| `\n`   | Newline (LF)     |
| `\r`   | Carriage return (CR) |
| `\t`   | Tab              |
| `\"`   | Double quote     |
| `\0`   | NUL character    |

```valen
let path = "C:\\Users\\valen";
let multiline = "line one\nline two";
let quoted = "She said \"hi\"";
let with_nul = "terminated\0here";
```

Any other backslash + character combination (like `\x`) currently passes through as-is (the backslash and the following character are both kept). This behavior may become stricter in the future.

## Character Literals

Single characters use single quotes and support the same escape sequences (with `\'` instead of `\"`):

```valen
let ch = 'A';
let newline = '\n';
let tab = '\t';
let nul = '\0';
let single_quote = '\'';
let backslash = '\\';
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

::: tip No space between f and the quote
`f"..."` is a single token. If you write `f "..."`, the lexer sees an identifier `f` followed by a plain string — not an f-string.
:::

### Escaping Braces in f-strings

Need a literal `{` or `}` in an f-string? Escape it with a backslash:

```valen
let json_ish = f"\{\"name\": \"{name}\"\}";
// {"name": "Alice"}
```

### f-string Limitations

f-strings keep things simple on purpose:

- **No block expressions** inside `{ }`. You can't write `f"{ let x = 1; x + 2 }"`.
- **No nested f-strings.** `f"outer {f"inner"}"` is not allowed.
- Stick to simple expressions. If your interpolation needs multiple lines of logic, compute it beforehand and interpolate the result.

```valen
// Don't try to be clever inside the braces
let result = compute_something();
let msg = f"The answer is {result}";   // clean and clear
```

### Complete f-string Escape Reference

f-strings support all the standard string escapes plus brace escaping:

| Escape | Meaning               |
|--------|-----------------------|
| `\\`   | Backslash             |
| `\n`   | Newline (LF)          |
| `\r`   | Carriage return (CR)  |
| `\t`   | Tab                   |
| `\"`   | Double quote          |
| `\0`   | NUL character         |
| `\{`   | Literal `{`           |
| `\}`   | Literal `}`           |

## Immutability

`String` is immutable. There's no `StringBuilder` or mutable string type in the language itself — if you need one, reach for `java.lang.StringBuilder` through Java interop.

```valen
let s = "hello";
// s[0] = 'H';    // not a thing — strings are immutable
```

String concatenation with `+` works but creates new strings each time. For anything beyond trivial cases, f-strings or `StringBuilder` are your friends.

---

**Next up:** [Classes](./classes) — time to model some real data.
