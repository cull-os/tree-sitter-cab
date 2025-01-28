#include "tree_sitter/parser.h"

enum TokenType {
  MULTILINE_COMMENT,
};

void *tree_sitter_cab_external_scanner_create() { return NULL; }

void tree_sitter_cab_external_scanner_destroy(void *payload) {}

unsigned tree_sitter_cab_external_scanner_serialize(void *_, char *__) {
  return 0;
}

void tree_sitter_cab_external_scanner_deserialize(void *_, const char *__,
                                                  unsigned ___) {}

bool tree_sitter_cab_external_scanner_scan(void *_, TSLexer *lexer,
                                           const bool *valid_symbols) {
  if (!valid_symbols[MULTILINE_COMMENT]) {
    return false;
  }

  uint32_t comment_start_length = 0;

  while (lexer->lookahead == '#') {
    comment_start_length += 1;
    lexer->advance(lexer, false);
  }

  if (comment_start_length < 3) {
    return false;
  }

  uint32_t consumed_end_length = 0;

  for (;;) {
    if (lexer->eof(lexer) || consumed_end_length >= comment_start_length) {
      break;
    }

    if (lexer->lookahead == '#') {
      consumed_end_length += 1;
    } else {
      consumed_end_length = 0;
    }

    lexer->advance(lexer, false);
  }

  lexer->result_symbol = MULTILINE_COMMENT;
  lexer->mark_end(lexer);
  return true;
}
