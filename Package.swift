// swift-tools-version:5.3
import PackageDescription

let package = Package(
    name: "TreeSitterCab",
    products: [
        .library(name: "TreeSitterCab", targets: ["TreeSitterCab"]),
    ],
    dependencies: [
        .package(url: "https://github.com/ChimeHQ/SwiftTreeSitter", from: "0.8.0"),
    ],
    targets: [
        .target(
            name: "TreeSitterCab",
            dependencies: [],
            path: ".",
            sources: [
                "src/parser.c",
                // NOTE: if your language has an external scanner, add it here.
            ],
            resources: [
                .copy("queries")
            ],
            publicHeadersPath: "bindings/swift",
            cSettings: [.headerSearchPath("src")]
        ),
        .testTarget(
            name: "TreeSitterCabTests",
            dependencies: [
                "SwiftTreeSitter",
                "TreeSitterCab",
            ],
            path: "bindings/swift/TreeSitterCabTests"
        )
    ],
    cLanguageStandard: .c11
)
