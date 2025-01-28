import XCTest
import SwiftTreeSitter
import TreeSitterCab

final class TreeSitterCabTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_cab())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Cab grammar")
    }
}
