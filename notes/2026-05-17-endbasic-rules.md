## EndBASIC writing rules

These are my working rules for writing EndBASIC code in this repository.
They are derived from `core/tests/*.md` and the real command/function set in
`cli/tests/repl/help.out`.  I ignore test-only helpers such as `OUT`,
`GETDATA`, `LAST_ERROR`, `RAISE`, `RAISEF`, and similar fake builtins.

### General syntax

- Write one statement per logical line.  `:` is allowed to separate multiple
  statements on a single physical line.
- Use `IF ... THEN`; `THEN` is mandatory.
- Use `ELSEIF` as one word.  Do not write `ELSE IF`.
- Comments are introduced with `'` or `REM`.
- Labels can be numeric like `20` or textual like `@loop`.  Text labels may
  optionally end in `:`.
- EndBASIC is case-insensitive for identifiers, but I should follow the
  project style: uppercase keywords and lowercase identifiers.

### Real builtins and calls

- Commands and SUBs are statement-style calls: `PRINT 1`, `foo 2, 3`.
- Functions are expression-style calls: `LEN%(a$)`, `SIN#(x#)`.
- Do not call a SUB as if it were a function, and do not use a FUNCTION as a
  bare statement unless its return value is actually part of an expression.
- Argument-less functions are referenced as bare identifiers, not `f()`.
- When in doubt about available builtins, trust `cli/tests/repl/help.out`, not
  the integration tests.

### Types

- The language is strictly typed.  Variables do not change type after first
  definition.
- Type suffixes are meaningful:
  `?` = BOOLEAN, `#` = DOUBLE, `%` = INTEGER, `$` = STRING.
- A mismatched suffix on a reference is a compile error.
- Unsuffixed numeric variables behave as integers unless declared otherwise.
- Use `DIM` to define variables explicitly when clarity matters.
- Use `DIM SHARED` for globals accessed from `SUB` and `FUNCTION` bodies.

### Numeric conversions

- Integer-to-double promotion is automatic.
- Double-to-integer coercion rounds during normal assignment/coercion.
- Use `CINT%` when I want explicit rounding.
- Use `INT%` when I want truncation instead.

### Operators

- `+` is numeric addition or string concatenation depending on operand types.
- Integer arithmetic stays integer.  In particular, `10 / 3` yields `3`, not a
  floating-point quotient.
- Use doubles if I need non-integer division.
- `MOD` is supported.
- `^` is exponentiation.
- `AND`, `OR`, `XOR`, and `NOT` are boolean operators on booleans and bitwise
  operators on integers.
- `<<` and `>>` are integer-only shifts, and `>>` is sign-preserving.
- Overflows, divide-by-zero, invalid shifts, and similar numeric faults are
  runtime errors.  Do not assume wraparound semantics.
- Floating-point results may expose binary precision artifacts.

### Comparisons

- `=`, `<>`, `<`, `<=`, `>`, `>=` are available.
- Equality/inequality work across booleans, numbers, and strings.
- Ordering comparisons do not apply to booleans.
- String comparisons are lexicographic.

### Variables and arrays

- Scalars can be introduced by assignment or by `DIM`.
- Arrays must be declared with `DIM` before use.
- Arrays are zero-based.
- `DIM a(3)` means valid indexes are `0`, `1`, and `2`.  The declared number
  acts like a size, not an inclusive upper bound as in some BASIC dialects.
- Multidimensional arrays are also zero-based.
- Array indexes are numeric expressions; doubles are coerced to integers by
  rounding.
- Bounds and dimension errors are runtime errors.
- Arrays and scalars are distinct namespaces of values, but names still cannot
  conflict with existing symbols.
- Use `LBOUND%` and `UBOUND%` to inspect array limits when needed.

### Control flow

- `WHILE ... WEND` requires a boolean condition.
- `DO` supports pre-test and post-test forms with both `WHILE` and `UNTIL`.
- `EXIT DO` leaves only the nearest enclosing `DO` loop.
- `FOR` loops are numeric and support optional positive or negative `STEP`.
- A `FOR` iterator is just a normal variable; it remains visible after `NEXT`.
- Mutating the loop variable inside the loop affects iteration behavior.
- Be careful with integer iterators and fractional `STEP` values because the
  repeated rounding can lead to surprising or non-terminating loops.
- `EXIT FOR` leaves only the nearest enclosing `FOR` loop.
- `END` can terminate execution anywhere and may take an exit code.

### IF and SELECT CASE

- Both multiline and uniline `IF` forms are supported.
- Uniline `IF` supports only a restricted set of statements, so prefer the
  multiline form for anything nontrivial.
- `SELECT CASE` evaluates its selector exactly once.
- `CASE` guards can match literals, comma-separated alternatives, ranges via
  `x TO y`, and relational tests via `CASE IS <op> expr`.
- `CASE ELSE`, if present, must appear once and last.

### Jumps and subroutines

- `GOTO` and `GOSUB` can target either numeric or textual labels.
- Duplicate or unknown labels are compile errors.
- `RETURN` is only valid when there is an active `GOSUB` frame.
- Reaching `RETURN` without a matching `GOSUB` is a runtime error.
- If a `GOSUB` target falls through without `RETURN`, execution simply
  continues, so I should make `RETURN` explicit.

### Error handling

- Use the real forms of `ON ERROR`:
  `ON ERROR GOTO line`, `ON ERROR GOTO @label`,
  `ON ERROR RESUME NEXT`, and `ON ERROR GOTO 0`.
- Use `ERRMSG$` to inspect the last trapped error.
- `RESUME NEXT` continues with the statement immediately after the failing
  one, including later statements on the same `:`-separated line.

### DATA and READ

- Use `DATA`, `READ`, and `RESTORE`; ignore test-only `GETDATA` helpers.
- `DATA` values are collected from source order, not execution order.
- `DATA` statements are visible even if they appear in branches or loops that
  never run.
- Empty `DATA` fields become the default value of the target type on `READ`.
- Trying to `READ` past the available data is an error.

### User-defined FUNCTION rules

- Define functions with `FUNCTION` and end them with `END FUNCTION`.
- Return values are produced by assigning to the function's own name.
- If no return assignment happens, the function returns its type's zero value.
- `EXIT FUNCTION` returns early.
- Function arguments are passed by value.
- Functions have local scope and do not see non-shared program variables.
- Use `DECLARE FUNCTION` for forward declarations and mutual recursion.
- Do not nest `FUNCTION` or `SUB` definitions.

### User-defined SUB rules

- Define procedures with `SUB` and end them with `END SUB`.
- Call SUBs as statements, not inside expressions.
- `EXIT SUB` returns early.
- SUB arguments are passed by value.
- SUBs have local scope and only see globals declared with `DIM SHARED`.
- Use `DECLARE SUB` for forward declarations.

### Strings

- Strings are UTF-8 and use double quotes.
- Embedded double quotes are escaped with `\`.
- Use `LEFT$`, `RIGHT$`, `MID$`, `LEN%`, `LTRIM$`, `RTRIM$`, `ASC%`, `CHR$`,
  and `STR$` as documented in `help.out`.
- `STR$` prefixes non-negative numeric results with a leading space, so use
  `LTRIM$(STR$(expr))` when I need a clean numeric string.

### Practical gotchas compared to many BASIC dialects

- EndBASIC is strict and typed, not variant-heavy.
- Integer `/` stays integer.
- Arrays are zero-based, and `DIM a(3)` gives `0..2`, not `0..3`.
- Argument-less functions are referenced without parentheses.
- SUB/FUNCTION parameters are passed by value.
- `FOR` iterators are mutable ordinary variables, so changing them in the body
  changes loop behavior.
