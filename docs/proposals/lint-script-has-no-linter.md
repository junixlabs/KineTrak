# `npm run lint` has no linter behind it

Found while verifying ISS-2 (`report_friction`) against the plan's verify list.

`package.json` declares `"lint": "eslint ."`, but `eslint` is not in `dependencies` or
`devDependencies`, and the repo has no eslint config of any form. On a fresh clone the script fails
with `sh: 1: eslint: not found`, so it has never gated anything.

Not fixable inside a feature diff: it needs the dependency, a flat config covering both the `src`
(React/TSX) and `server` (Node) halves, and one pass over whatever the first run flags across the
whole repo. Until then, `npm test` + `npm run typecheck:server` + `npm run build` are the real gates
— `tsc -b` is the only one that typechecks `src/components`.

Options, cheapest first: (a) drop the script so it stops reading as a gate that passes; (b) add
`eslint` + `typescript-eslint` + `eslint-plugin-react-hooks` with a flat config and fix the fallout
in a dedicated change.
