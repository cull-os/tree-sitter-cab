const sepTrailing = (rule, separator) => seq(sep(rule, ","), optional(","));

const sep = (rule, separator) => seq(rule, repeat(seq(separator, rule)));

export default grammar({
  name: "cab",

  externals: ($) => [
    $.comment,
  ],

  extras: ($) => [
    /\s/,
    $.comment,
  ],

  supertypes: ($) => [
    $.expression,
    $.pattern,
  ],

  word: ($) => $._identifier_plain,

  rules: {
    source_code: ($) => $.expression,

    expression: ($) =>
      choice(
        $.parenthesis,
        $.list,
        $.attribute_list,
        $.prefix_operation,
        $.infix_operation,
        $.suffix_operation,
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
        prec(
          precedence,
          seq(
            field("operator", operator),
            field("right", $.expression),
          ),
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

          // TODO: ["+", [140, 145]],
          // TODO: ["-", [140, 145]],

          // !

          ["//", [120, 125]],

          // TODO: ["<=", [110, 115]],
          // TODO: ["<", [110, 115]],
          // TODO: [">=", [110, 115]],
          // TODO: [">", [110, 115]],
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
          (left > right ? prec.left : prec.right)(
            Math.max(left, right),
            seq(
              field(
                "left",
                operator === "=>" || operator === ":="
                  ? $.pattern
                  : $.expression,
              ),
              ...operator !== null ? [field("operator", operator)] : [],
              field(
                "right",
                $.expression,
              ),
            ),
          )
        ),
      ),

    suffix_operation: ($) =>
      choice(
        ...[
          [",", 24],
          [";", 14],
        ].map(([operator, precedence]) =>
          prec(
            precedence,
            seq(
              field("left", $.expression),
              field("operator", operator),
            ),
          )
        ),
      ),

    interpolation: ($) =>
      seq(
        token.immediate("\\("),
        $.expression,
        ")",
      ),

    path: ($) =>
      seq(
        /(\.?\/|\.\.)(?:[\p{L}\p{N}.\/_-]|\\[^(])*/,
        repeat(choice(
          $.interpolation,
          alias(token.immediate(/\\[^(]/), $.escape),
          alias(token.immediate(/[\p{L}\p{N}.\/_-]+/), $.content),
        )),
      ),

    _identifier_plain: ($) => /[\p{L}_][\p{L}\p{N}_'-]*/,
    _identifier_quoted: ($) =>
      seq(
        "`",
        repeat(choice(
          $.interpolation,
          alias(token.immediate(/\\[^(]/), $.escape),
          alias(token.immediate(/[^\\`]+/), $.content),
        )),
        token.immediate("`"),
      ),

    identifier: ($) =>
      choice(
        $._identifier_plain,
        $._identifier_quoted,
      ),

    string: ($) =>
      seq(
        alias('"', $.string_start),
        repeat(choice(
          $.interpolation,
          alias(token.immediate(/\\[^(]/), $.escape),
          alias(token.immediate(/[^\\"]+/), $.content),
        )),
        alias(token.immediate('"'), $.string_start),
      ),

    island: ($) =>
      seq(
        "<",
        repeat(choice(
          $.interpolation,
          alias(token.immediate(/\\[^(]/), $.escape),
          alias(token.immediate(/[^\\>]+/), $.content),
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

    pattern: ($) =>
      choice(
        $.pattern_parenthesis,
        $.pattern_list,
        $.pattern_attribute_list,
        $.pattern_infix_operation,
        $.pattern_identifier,
        $.pattern_string,
        $.pattern_number,
      ),

    pattern_parenthesis: ($) =>
      prec(
        -1,
        seq(
          "(",
          $.pattern,
          ")",
        ),
      ),

    pattern_list: ($) =>
      prec(
        -1,
        seq(
          "[",
          optional(sepTrailing(
            $.pattern,
            ",",
          )),
          "]",
        ),
      ),

    pattern_attribute_list: ($) =>
      prec(
        -1,
        seq(
          "{",
          optional(sepTrailing(
            choice(
              $.pattern,
              prec(-1, $.infix_operation),
            ),
            ",",
          )),
          "}",
        ),
      ),

    pattern_infix_operation: ($) =>
      prec(
        -1,
        choice(
          ...[
            [null, [185, 180]],

            ["*", [160, 165]],
            ["/", [160, 165]],
            ["^", [165, 160]],

            ["+", [140, 145]],
            ["-", [140, 145]],

            ["|>", [50, 55]],
            ["<|", [55, 50]],
          ].map(([operator, [left, right]]) =>
            (left > right ? prec.left : prec.right)(
              Math.max(left, right),
              seq(
                field(
                  "left_pattern",
                  operator === null || operator === "<|"
                    ? $.expression
                    : $.pattern,
                ),
                ...operator !== null ? [field("operator", operator)] : [],
                field(
                  "right_pattern",
                  operator === "|>" ? $.expression : $.pattern,
                ),
              ),
            )
          ),
        ),
      ),

    pattern_identifier: ($) => prec(-1, $.identifier),
    pattern_string: ($) => prec(-1, $.string),
    pattern_number: ($) => prec(-1, $.number),
  },
});
