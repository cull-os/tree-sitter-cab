export default grammar({
  name: "cab",

  externals: ($) => [
    $.multiline_comment,
    $.error_senitel,
  ],

  extras: ($) => [
    /\s+/,
    $.comment,
  ],

  supertypes: ($) => [$.expression],

  word: ($) => $._identifier_simple,

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
          $[`prefix_operation_${operator}`],
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
              seq(
                field("left_expression", $.expression),
                ...operator !== null ? [field("operator", operator)] : [],
                field("right_expression", $.expression),
              ),
            ),
            $[`infix_operation_${operator}`],
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
            $[`suffix_operation_${operator}`],
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

    _identifier_simple: ($) => /[\p{L}_-][\p{L}\p{N}_'-]*/,

    identifier: ($) =>
      choice(
        $._identifier_simple,
        alias(
          seq(
            "`",
            repeat(choice(
              $.interpolation,
              alias(token.immediate(/(?:\\(?:[^(])|[^\\`])+/), $.content),
            )),
            token.immediate("`"),
          ),
          $._identifier_quoted,
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
          field("condition", $.expression),
          "then",
          field("true_expression", $.expression),
          optional(seq(
            "else",
            field("false_expression", prec.right(30, $.expression)),
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
