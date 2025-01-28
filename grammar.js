const operatorMap = {
  "+": "addition",
  "-": "subtraction",
  "!": "not",
  "?": "try",
  ".": "select",
  "++": "concat",
  "*": "multiplication",
  "/": "division",
  "^": "power",
  "//": "update",
  "<=": "less_or_equal",
  "<": "less",
  ">=": "more_or_equal",
  ">": "more",
  ":": "construct",
  "==": "equals",
  "!=": "not_equals",
  "&&": "and",
  "||": "or",
  "->": "implication",
  "|>": "pipe",
  null: "implicit_application",
  "<|": "application",
  "=>": "lambda",
  ":=": "bind",
  ",": "same",
  ";": "sequence",
};

export default grammar({
  name: "cab",

  externals: ($) => [
    $.multiline_comment,
  ],

  extras: ($) => [
    /\s+/,
    $.comment,
  ],

  supertypes: ($) => [$.expression],

  rules: {
    source_code: ($) => $.expression,

    comment: ($) =>
      choice(
        $.multiline_comment,
        alias(/#{1,2}[^\n]*/, $.singleline_comment),
      ),

    expression: ($) =>
      choice(
        $.parenthesis,
        $.list,
        $.attribute_list,
        // $.prefix_operation,
        // $.infix_operation,
        // $.suffix_operation,
        $.path,
        $.identifier,
        $.string,
        $.island,
        $.number,
        $.if_else,
        $.if_is,
      ),

    parenthesis: ($) =>
      seq(
        "(",
        $.expression,
        ")",
      ),

    list: ($) =>
      seq(
        "[",
        optional($.expression),
        "]",
      ),

    attribute_list: ($) =>
      seq(
        "{",
        optional($.expression),
        "}",
      ),

    prefix_operation: ($) =>
      choice(...[
        ["+", 155],
        ["-", 155],

        ["!", 135],

        ["?", 115],
      ].map(([operator, precedence]) =>
        alias(
          prec(
            precedence,
            seq(
              field(
                "operator",
                operator,
              ),
              field("expression", $.expression),
            ),
          ),
          $[`prefix_operation_${operatorMap[operator]}`],
        )
      )),

    infix_operation: ($) =>
      choice(
        ...[
          [".", [195, 190]],
          [null, [185, 180]],

          ["++", [175, 170]],

          ["*", [160, 165]],
          ["/", [160, 165]],
          ["^", [165, 160]],

          // + -

          ["+", [140, 145]],
          ["-", [140, 145]],

          // !

          ["//", [120, 125]],

          ["<=", [110, 115]],
          ["<", [110, 115]],
          [">=", [110, 115]],
          [">", [110, 115]],
          // ?

          [":", [105, 100]],

          ["==", [95, 90]],
          ["!=", [95, 90]],

          ["&&", [85, 80]],
          ["||", [75, 70]],
          ["->", [65, 60]],

          ["|>", [50, 55]],
          ["<|", [55, 50]],

          ["=>", [45, 40]],
          [":=", [35, 30]],

          [",", [25, 20]],
          [";", [15, 10]],
        ].map(([operator, [left, right]]) =>
          alias(
            (left > right ? prec.left : prec.right)(
              Math.max(left, right),
              operator === null
                ? seq(
                  field("left_expression", $.expression),
                  field("right_expression", $.expression),
                )
                : seq(
                  field("left_expression", $.expression),
                  field("operator", operator),
                  field("right_expression", $.expression),
                ),
            ),
            $[`infix_operation_${operatorMap[operator]}`],
          )
        ),
      ),

    suffix_operation: ($) =>
      choice(
        ...[
          [",", 26],
          [";", 16],
        ].map(([operator, precedence]) =>
          alias(
            prec(
              precedence,
              seq(
                field("expression", $.expression),
                field("operator", operator),
              ),
            ),
            $[`suffix_operation_${operatorMap[operator]}`],
          )
        ),
      ),

    interpolation: ($) =>
      seq(
        token.immediate("\\("),
        $.expression,
        token.immediate(")"),
      ),

    path: ($) =>
      seq(
        /(\.?\/|\.\.)(?:[\p{L}\p{N}.\/_-]|\\[^(])*/,
        repeat(choice(
          $.interpolation,
          alias(token.immediate(/(?:[\p{L}\p{N}.\/_-]|\\[^(])+/), $.content),
        )),
      ),

    identifier: ($) =>
      choice(
        /[\p{L}_-][\p{L}\p{N}_'-]*/,
        seq(
          "`",
          repeat(choice(
            $.interpolation,
            alias(token.immediate(/(?:\\(?:[^(])|[^\\`])+/), $.content),
          )),
          token.immediate("`"),
        ),
      ),

    string: ($) =>
      seq(
        '"',
        repeat(choice(
          $.interpolation,
          alias(token.immediate(/(?:\\(?:[^(])|[^\\"])+/), $.content),
        )),
        token.immediate('"'),
      ),

    island: ($) =>
      seq(
        "<",
        repeat(choice(
          $.interpolation,
          alias(token.immediate(/(?:\\(?:[^(])|[^\\>])+/), $.content),
        )),
        token.immediate(">"),
      ),

    number: (_$) =>
      choice(
        /[0-9]+(?:\.[0-9]+([eE][0-9]+)?)?/,
        /0b[01]+(?:\.[01]+([eE][01]+)?)?/,
        /0o[0-7]+(?:\.[0-7]+([eE][0-7]+)?)?/,
        /0x[0-9a-fA-F]+(?:\.[0-9a-fA-F]+([eE][0-9a-fA-F]+)?)?/,
      ),

    if_else: ($) =>
      prec.right(
        30,
        seq(
          "if",
          alias($.expression, $.condition),
          "then",
          alias($.expression, $.true_expression),
          optional(seq(
            "else",
            alias(prec.right(30, $.expression), $.false_expression),
          )),
        ),
      ),

    if_is: ($) =>
      seq(
        "if",
        field("expression", $.expression),
        "is",
        field("match_expression", prec(20, $.expression)),
      ),
  },
});
