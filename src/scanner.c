#include <wctype.h>

#include <tree_sitter/parser.h>

typedef enum {
  SINGLELINE_COMMENT,
  MULTILINE_COMMENT,
} TokenType;

void *tree_sitter_cab_external_scanner_create() { return NULL; }

void tree_sitter_cab_external_scanner_destroy(void *payload) {}

uint32_t tree_sitter_cab_external_scanner_serialize(void *_paylad,
                                                    uint8_t *_buffer) {
  return 0;
}

void tree_sitter_cab_external_scanner_deserialize(void *_payload,
                                                  const uint8_t *_buffer,
                                                  uint32_t _length) {}

bool tree_sitter_cab_external_scanner_scan(void *_paylad, TSLexer *lexer,
                                           const bool *valid_symbols) {
  if (!valid_symbols[SINGLELINE_COMMENT] && !valid_symbols[MULTILINE_COMMENT]) {
    return false;
  }

  while (iswspace(lexer->lookahead)) {
    lexer->advance(lexer, true);
  }

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
