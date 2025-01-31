package tree_sitter_cab_test

import (
	"testing"

	tree_sitter_cab "github.com/cull-os/tree-sitcab/bindings/go"
	tree_sitter "github.com/tree-sittering-tree-sitters/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_cab.Language())
	if language == nil {
		t.Errorf("Error loading Cab grammar")
	}
}
