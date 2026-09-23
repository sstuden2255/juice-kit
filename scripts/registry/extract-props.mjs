/**
 * Pulls prop tables straight out of the component source with the TypeScript parser.
 *
 * SPEC leaves prop tables "generated from types if practical" — it is practical here because
 * every prop already carries a JSDoc line, so the table can never drift from the code. This is
 * a syntactic read of the declared members only: inherited DOM props (the `extends` clause) are
 * reported as a note instead of being expanded, which is what a reader wants anyway.
 */
import ts from "typescript";

/**
 * @param {ts.Node} node
 * @returns {string} the node's JSDoc text as a single line, or "".
 */
function jsDocText(node) {
  for (const doc of ts.getJSDocCommentsAndTags(node)) {
    if (!ts.isJSDoc(doc)) continue;
    const text = ts.getTextOfJSDocComment(doc.comment);
    if (text) return text.replace(/\s+/g, " ").trim();
  }
  return "";
}

/**
 * Splits "Seconds per sweep. Default 1.1." into its description and its default, so the table
 * can show them in separate columns. Matches a period only when it ends a sentence, which keeps
 * decimals and `rgba(…, 0.7)` defaults intact.
 *
 * The capital D is the convention: "Default false." declares a value for the table, while
 * "defaults to the user's OS preference" is prose and stays in the description.
 *
 * @param {string} text
 * @returns {{ description: string, defaultValue: string | null }}
 */
export function splitDefault(text) {
  const match = /\bDefaults?(?:\s+to|:)?\s+(.+?)\.(?=\s|$)/.exec(text);
  if (!match?.[1]) return { description: text, defaultValue: null };
  const description = (text.slice(0, match.index) + text.slice(match.index + match[0].length))
    .replace(/\s+/g, " ")
    .trim();
  return { description, defaultValue: match[1].replace(/^`|`$/g, "") };
}

/**
 * @param {ts.InterfaceDeclaration} decl
 * @param {ts.SourceFile} sf
 */
function readInterface(decl, sf) {
  const members = [];
  for (const member of decl.members) {
    if (!ts.isPropertySignature(member) && !ts.isMethodSignature(member)) continue;
    if (!member.name) continue;
    const doc = jsDocText(member);
    const { description, defaultValue } = splitDefault(doc);
    members.push({
      name: member.name.getText(sf),
      optional: member.questionToken !== undefined,
      // A method signature has no `type` node covering its parameters, so print the whole
      // member and strip the name to get "(amount: number): void".
      type: ts.isMethodSignature(member)
        ? member
            .getText(sf)
            .replace(/^[A-Za-z0-9_$]+\??/, "")
            .replace(/;$/, "")
            .trim()
        : (member.type?.getText(sf) ?? "unknown"),
      description,
      defaultValue,
    });
  }
  const heritage = decl.heritageClauses
    ?.flatMap((clause) => clause.types.map((type) => type.getText(sf)))
    .join(", ");
  return { name: decl.name.getText(sf), extends: heritage ?? null, members };
}

/**
 * @param {string} filePath
 * @param {string} contents
 * @returns {{ interfaces: ReturnType<typeof readInterface>[], types: { name: string, text: string }[] }}
 */
export function extractApi(filePath, contents) {
  const sf = ts.createSourceFile(
    filePath,
    contents,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const interfaces = [];
  const types = [];
  for (const statement of sf.statements) {
    const exported = ts
      .getCombinedModifierFlags(/** @type {ts.Declaration} */ (statement))
      .valueOf();
    const isExported = (exported & ts.ModifierFlags.Export) !== 0;
    if (!isExported) continue;
    if (ts.isInterfaceDeclaration(statement)) {
      interfaces.push(readInterface(statement, sf));
    } else if (ts.isTypeAliasDeclaration(statement)) {
      types.push({
        name: statement.name.getText(sf),
        text: statement.type.getText(sf).replace(/\s+/g, " ").trim(),
      });
    }
  }
  return { interfaces, types };
}
