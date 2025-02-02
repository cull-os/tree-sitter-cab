#include <assert.h>
#include <wctype.h>

#include <tree_sitter/alloc.h>
#include <tree_sitter/array.h>
#include <tree_sitter/parser.h>

typedef enum {
  SINGLELINE_COMMENT,
  MULTILINE_COMMENT,

  REPEATED_STRING_START,
  REPEATED_STRING_CONTENT,
  REPEATED_STRING_END,

  ERROR_SENITEL,
} TokenType;

typedef Array(uint32_t) Starts;

typedef struct {
  Starts starts;
} Scanner;

Scanner *tree_sitter_cab_external_scanner_create() {
  Scanner *scanner = ts_malloc(sizeof(Scanner));

  scanner->starts = (Starts)array_new();

  return scanner;
}

void tree_sitter_cab_external_scanner_destroy(Scanner *scanner) {
  array_delete(&scanner->starts);
  ts_free(scanner);
}

uint32_t tree_sitter_cab_external_scanner_serialize(Scanner *scanner,
                                                    uint8_t *buffer) {
  uintptr_t size = (scanner->starts.size + 1) * sizeof(uint32_t);
  assert(size <= TREE_SITTER_SERIALIZATION_BUFFER_SIZE);

  memcpy(buffer, scanner->starts.contents, size);
  return size;
}

void tree_sitter_cab_external_scanner_deserialize(Scanner *scanner,
                                                  const uint8_t *buffer,
                                                  uint32_t length) {
  scanner->starts = (Starts)array_new();

  uint32_t array_length = length / sizeof(uint32_t);

  if (array_length > 0 && array_length * sizeof(uint32_t) == length) {
    array_reserve(&scanner->starts, array_length);
    memcpy(scanner->starts.contents, buffer, length);
  }
}

static bool lex_comments(TSLexer *lexer) {
  uint32_t start_count = 0;

  while (lexer->lookahead == '#') {
    start_count += 1;
    lexer->advance(lexer, false);
  }

  if (start_count == 0) {
    return false;
  }

  if (start_count < 3) {
    for (;;) {
      if (lexer->eof(lexer) || lexer->lookahead == '\n') {
        break;
      }

      lexer->advance(lexer, false);
    }

    lexer->result_symbol = SINGLELINE_COMMENT;
  } else {
    uint32_t end_count = 0;

    for (;;) {
      if (lexer->eof(lexer) || end_count >= start_count) {
        break;
      }

      if (lexer->lookahead == '#') {
        end_count += 1;
      } else {
        end_count = 0;
      }

      lexer->advance(lexer, false);
    }

    lexer->result_symbol = MULTILINE_COMMENT;
  }

  lexer->mark_end(lexer);
  return true;
}

static bool lex_repeated_string(Scanner *scanner, TSLexer *lexer) {
  uint32_t start_count = 0;

  while (lexer->lookahead == '\'') {
    start_count += 1;
    lexer->advance(lexer, false);
  }

  if (start_count == 0) {
    return false;
  }

  array_push(&scanner->starts, start_count);

  lexer->result_symbol = REPEATED_STRING_START;
  lexer->mark_end(lexer);
  return true;
}

static bool lex_repeated_string_content(Scanner *scanner, TSLexer *lexer) {
  for (bool has_content = false;; has_content = true) {
    if (lexer->eof(lexer)) {
      return false;
    }

    switch (lexer->lookahead) {
    case '\\':
    case '\'':
      return has_content;

    default:
      lexer->advance(lexer, false);
    }


    lexer->result_symbol = REPEATED_STRING_CONTENT;
    lexer->mark_end(lexer);
  }
}

static bool lex_repeated_string_end(Scanner *scanner, TSLexer *lexer) {
  if (scanner->starts.size == 0) {
    return false;
  }

  uint32_t end_count = 0;

  while (lexer->lookahead == '\'') {
    end_count += 1;
    lexer->advance(lexer, false);
  }

  if (end_count != *array_back(&scanner->starts)) {
    return false;
  }

  array_pop(&scanner->starts);
  lexer->result_symbol = REPEATED_STRING_END;
  lexer->mark_end(lexer);
  return true;
}

bool tree_sitter_cab_external_scanner_scan(Scanner *scanner, TSLexer *lexer,
                                           const bool *valid_symbols) {
  if (!valid_symbols[ERROR_SENITEL] && valid_symbols[REPEATED_STRING_END]) {
    return lex_repeated_string_end(scanner, lexer);
  }

  if (!valid_symbols[ERROR_SENITEL] && valid_symbols[REPEATED_STRING_CONTENT]) {
    return lex_repeated_string_content(scanner, lexer);
  }

  if (!valid_symbols[ERROR_SENITEL] && valid_symbols[REPEATED_STRING_START]) {
    while (iswspace(lexer->lookahead)) {
      lexer->advance(lexer, true);
    }

    return lex_repeated_string(scanner, lexer);
  }

  if (valid_symbols[SINGLELINE_COMMENT] || valid_symbols[MULTILINE_COMMENT]) {
    while (iswspace(lexer->lookahead)) {
      lexer->advance(lexer, true);
    }

    return lex_comments(lexer);
  }

  return false;
}
