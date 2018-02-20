module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es6": true,
        "node": true
    },
    "extends": [
        "eslint:recommended",
        "hapi",
        "plugin:prettier/recommended",
    ],
    "parser": "babel-eslint",
    "rules": {
        "hapi/no-arrowception": "off",
        "no-param-reassign": "off",
        "object-curly-newline": "off",
        "max-len": "off",
        "comma-dangle": "off",
        "arrow-parens": "off",
        "no-unused-expressions": ["error", { "allowTernary": true }],
        "no-plusplus": "off",
        "no-console": "off",
        "no-undef": "off",
        "function-paren-newline": "off",
        "no-param-reassign": ["error", { "props": false }],
        "indent": "off",
        "linebreak-style": ["error", "unix"],
        "quotes": ["error", "double"],
        "semi": ["error", "always"],
        "strict": ["error", "global"],
        "curly": "warn",
        "prettier/prettier": [
          "error",
          {
            "printWidth": 120,
            "tabWidth": 4,
            "arrowParens": "avoid",
            "trailingComma": "es5"
          }
        ],
        "hapi/hapi-scope-start": "off"
    }
};