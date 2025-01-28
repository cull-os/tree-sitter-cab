#include <tree_sitter/parser.h>

typedef enum {
  MULTILINE_COMMENT,
  ERROR_SENITEL,
} TokenType ;

void *tree_sitter_cab_external_scanner_create() { return NULL; }

void tree_sitter_cab_external_scanner_destroy(void *payload) {}

uint32_t tree_sitter_cab_external_scanner_serialize(void *_paylad, uint8_t *_buffer) {
  return 0;
}

void tree_sitter_cab_external_scanner_deserialize(void *_payload, const uint8_t *_buffer,
                                                  uint32_t _length) {}

bool tree_sitter_cab_external_scanner_scan(void *_paylad, TSLexer *lexer,
                                           const bool *valid_symbols) {
  if (valid_symbols[ERROR_SENITEL]) {
    return false;
  }

  if (!valid_symbols[MULTILINE_COMMENT]) {
    return false;
  }

  TSLexer local_lexer = *lexer;
  uint32_t start_count = 0;

  while (local_lexer.lookahead == '#') {
    start_count += 1;
    local_lexer.advance(&local_lexer, false);
  }

  if (start_count < 3) {
    return false;
  }

  for (uint32_t i = 0; i < start_count; i += 1) {
    lexer->advance(lexer, false);
  }

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
  lexer->mark_end(lexer);
  return true;
}
