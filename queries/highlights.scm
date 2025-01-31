(comment) @comment

[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
] @punctuation.bracket

(prefix_operation
  operator: _ @operator)

(infix_operation
  operator: [
    "=>"
    ":="
  ] @punctuation.special)

(infix_operation
  operator: _ @operator)

(infix_operation
  operator: "|>"
  right: _ @function)

(infix_operation
  left: _ @function
  !operator)

(infix_operation
  left: _ @function
  operator: "<|")

(infix_operation
  operator: "."
  right: (identifier) @property)

[
  ","
  ";"
] @punctuation.delimiter

(suffix_operation
  operator: _ @operator)

(interpolation
  "\\(" @punctuation.special
  (_) @embedded
  ")" @punctuation.special)

[
  (path)
  (island)
] @string.special.path

(identifier) @variable

(pattern_identifier) @variable.parameter

((identifier) @function.builtin
 (#match? @function.builtin "^(import|provide|expect|error)$")
 (#is-not? local))

((identifier) @type.builtin
  (#match? @type.builtin "^(list|attributes|string|number)$")
  (#is-not? local))

((identifier) @variable.builtin
 (#match? @variable.builtin "^(true|false|null|list)$")
 (#is-not? local))

(string) @string

(escape) @escape

[
  "if"
  "then"
  "is"
  "else"
] @keyword

(number) @number
