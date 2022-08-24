module.exports = {
    parser: "@typescript-eslint/parser",
    env: {
        browser: true,
        node: true,
        es6: true,
        mocha: true,
    },
    plugins: ["@typescript-eslint", "react"],
    extends: ["eslint:recommended", "plugin:react/recommended", "plugin:react-hooks/recommended"],
    rules: {
        "no-console": "warn",
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": ["error", { ignoreRestSiblings: true }],
        "react/jsx-uses-react": "off",
        "react/react-in-jsx-scope": "off",
    },
    settings: {
        react: {
            createClass: "createReactClass", // Regex for Component Factory to use,
            // default to "createReactClass"
            pragma: "React", // Pragma to use, default to "React"
            fragment: "Fragment", // Fragment to use (may be a property of <pragma>), default to "Fragment"
            version: "detect", // React version. "detect" automatically picks the version you have installed.
            // You can also use `16.0`, `16.3`, etc, if you want to override the detected value.
            // It will default to "latest" and warn if missing, and to "detect" in the future
            flowVersion: "0.53", // Flow version
        },
    },
};