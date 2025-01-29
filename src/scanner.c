#include <wctype.h>

#include <tree_sitter/parser.h>

typedef enum {
  _SINGLELINE_COMMENT,
  _MULTILINE_COMMENT,
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
  if (!valid_symbols[_SINGLELINE_COMMENT] && !valid_symbols[_MULTILINE_COMMENT]) {
    return false;
  }

  /// TODO: ???
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

    lexer->result_symbol = _SINGLELINE_COMMENT;
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

    lexer->result_symbol = _MULTILINE_COMMENT;
  }

  lexer->mark_end(lexer);
  return true;
}
