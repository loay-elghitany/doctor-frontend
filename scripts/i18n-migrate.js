import fs from "fs";
import path from "path";
import parser from "@babel/parser";
import traverseModule from "@babel/traverse";
import generateModule from "@babel/generator";
import * as t from "@babel/types";
const traverse = traverseModule.default || traverseModule;
const generate = generateModule.default || generateModule;

const projectRoot = path.resolve("./");
const srcRoot = path.join(projectRoot, "src");
const publicLocalesRoot = path.join(projectRoot, "public", "locales");
const supportedLanguages = ["en", "ar"];
const translationFileName = "translation.json";

const fromPublicLocales = (lng) =>
  path.join(publicLocalesRoot, lng, translationFileName);

function ensurePublicLocaleDirs() {
  for (const lng of supportedLanguages) {
    const dir = path.dirname(fromPublicLocales(lng));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(fromPublicLocales(lng))) {
      fs.writeFileSync(
        fromPublicLocales(lng),
        JSON.stringify({ translation: {} }, null, 2),
      );
    }
  }
}

function loadTranslations() {
  const data = {};
  for (const lng of supportedLanguages) {
    const localePath = fromPublicLocales(lng);
    data[lng] =
      JSON.parse(fs.readFileSync(localePath, "utf-8")).translation || {};
  }
  return data;
}

function writeTranslations(translations) {
  for (const lng of supportedLanguages) {
    fs.writeFileSync(
      fromPublicLocales(lng),
      JSON.stringify({ translation: translations[lng] }, null, 2),
    );
  }
}

function toSnakeCase(text) {
  const cleaned = text
    .trim()
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned || "text";
}

function createKey(filePath, suffix, value, existingKeys) {
  const rel = path
    .relative(srcRoot, filePath)
    .replace(/\\/g, "/")
    .replace(/\.(jsx|js)$/, "");
  const filePrefix = rel.replace(/\//g, "_").replace(/[^a-zA-Z0-9_]/g, "_");
  const base = toSnakeCase(value).slice(0, 40);
  let key = `${filePrefix}.${suffix}_${base}`;
  if (key.length > 80) {
    key = `${filePrefix}.${suffix}_${toSnakeCase(value).slice(0, 20)}`;
  }
  let candidate = key;
  let idx = 1;
  while (existingKeys.has(candidate)) {
    candidate = `${key}_${idx}`;
    idx += 1;
  }
  existingKeys.add(candidate);
  return candidate;
}

function isTranslationString(value) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    !/\{\s*t\(|\buseTranslation\b/.test(value)
  );
}

function shouldSkipText(raw) {
  const text = raw.trim();
  if (!text) return true;
  if (/^[\s\W]+$/.test(text)) return true;
  if (/^{|}$/.test(text)) return true;
  if (/^\W+$/.test(text)) return true;
  if (/\b(const|let|return|if|else|function|import|export)\b/.test(text))
    return true;
  if (text.length < 2) return true;
  return false;
}

function getAttributeSuffix(name) {
  const normalized = String(name).replace(/[-_]/g, "_");
  return normalized;
}

function addUseTranslationImport(ast) {
  let hasImport = false;
  traverse(ast, {
    ImportDeclaration(path) {
      if (path.node.source.value === "react-i18next") {
        const existing = path.node.specifiers.some(
          (specifier) => specifier.imported?.name === "useTranslation",
        );
        if (!existing) {
          path.node.specifiers.push(
            t.importSpecifier(
              t.identifier("useTranslation"),
              t.identifier("useTranslation"),
            ),
          );
        }
        hasImport = true;
        path.stop();
      }
    },
  });
  if (!hasImport) {
    ast.program.body.unshift(
      t.importDeclaration(
        [
          t.importSpecifier(
            t.identifier("useTranslation"),
            t.identifier("useTranslation"),
          ),
        ],
        t.stringLiteral("react-i18next"),
      ),
    );
  }
}

function hasTranslationHook(ast) {
  let found = false;
  traverse(ast, {
    VariableDeclarator(path) {
      const id = path.node.id;
      const init = path.node.init;
      if (!init || !t.isCallExpression(init)) return;
      if (!t.isIdentifier(init.callee, { name: "useTranslation" })) return;
      if (t.isIdentifier(id) && id.name === "t") {
        found = true;
        path.stop();
        return;
      }
      if (t.isObjectPattern(id)) {
        const hasT = id.properties.some(
          (prop) =>
            t.isObjectProperty(prop) &&
            ((t.isIdentifier(prop.key) && prop.key.name === "t") ||
              (t.isStringLiteral(prop.key) && prop.key.value === "t")) &&
            t.isIdentifier(prop.value) &&
            prop.value.name === "t",
        );
        if (hasT) {
          found = true;
          path.stop();
        }
      }
    },
  });
  return found;
}

function insertTHook(ast) {
  if (hasTranslationHook(ast)) {
    return false;
  }

  let inserted = false;
  traverse(ast, {
    FunctionDeclaration(path) {
      if (inserted) return;
      const body = path.node.body.body;
      const hook = t.variableDeclaration("const", [
        t.variableDeclarator(
          t.objectPattern([
            t.objectProperty(t.identifier("t"), t.identifier("t"), false, true),
          ]),
          t.callExpression(t.identifier("useTranslation"), []),
        ),
      ]);
      body.unshift(hook);
      inserted = true;
    },
    VariableDeclaration(path) {
      if (inserted) return;
      const decl = path.node.declarations[0];
      if (
        decl &&
        t.isIdentifier(decl.id) &&
        decl.init &&
        (t.isArrowFunctionExpression(decl.init) ||
          t.isFunctionExpression(decl.init)) &&
        decl.id.name[0] === decl.id.name[0].toUpperCase()
      ) {
        const fnBody =
          decl.init.body.body || (decl.init.body && decl.init.body.body);
        if (Array.isArray(fnBody)) {
          const hook = t.variableDeclaration("const", [
            t.variableDeclarator(
              t.objectPattern([
                t.objectProperty(
                  t.identifier("t"),
                  t.identifier("t"),
                  false,
                  true,
                ),
              ]),
              t.callExpression(t.identifier("useTranslation"), []),
            ),
          ]);
          fnBody.unshift(hook);
          inserted = true;
        }
      }
    },
  });
  return inserted;
}

function buildTCall(key) {
  return t.callExpression(t.identifier("t"), [t.stringLiteral(key)]);
}

function transformFile(filePath, translations, existingKeys) {
  const source = fs.readFileSync(filePath, "utf-8");
  let ast;
  try {
    ast = parser.parse(source, {
      sourceType: "module",
      plugins: [
        "jsx",
        "classProperties",
        "optionalChaining",
        "nullishCoalescingOperator",
        "objectRestSpread",
        "decorators-legacy",
      ],
    });
  } catch (error) {
    console.error("Parse error", filePath, error.message);
    return false;
  }

  const filePrefix = path
    .relative(srcRoot, filePath)
    .replace(/\\/g, "/")
    .replace(/\.(jsx|js)$/, "")
    .replace(/\//g, "_");
  let modified = false;
  let needsUseTranslation = false;

  traverse(ast, {
    JSXAttribute(path) {
      const name =
        path.node.name.name ||
        (path.node.name.property && path.node.name.property.name);
      if (!name) return;
      const attrNames = new Set([
        "label",
        "placeholder",
        "title",
        "alt",
        "aria-label",
        "aria-label",
        "aria-describedby",
        "data-tooltip",
        "tooltip",
        "value",
        "aria-label",
      ]);
      if (!attrNames.has(name)) return;
      const valueNode = path.node.value;
      if (!valueNode || !t.isStringLiteral(valueNode)) return;
      const text = valueNode.value.trim();
      if (!isTranslationString(text) || shouldSkipText(text)) return;
      const suffix = `attr_${getAttributeSuffix(name)}`;
      const key = createKey(filePath, suffix, text, existingKeys);
      translations.en[key] = translations.en[key] || text;
      translations.ar[key] = translations.ar[key] || text;
      path.node.value = t.jsxExpressionContainer(buildTCall(key));
      modified = true;
      needsUseTranslation = true;
    },
    JSXText(path) {
      const raw = path.node.value;
      const text = raw.replace(/\s+/g, " ").trim();
      if (shouldSkipText(text)) return;
      const suffix = "text";
      const key = createKey(filePath, suffix, text, existingKeys);
      translations.en[key] = translations.en[key] || text;
      translations.ar[key] = translations.ar[key] || text;
      path.replaceWith(t.jsxExpressionContainer(buildTCall(key)));
      modified = true;
      needsUseTranslation = true;
    },
    JSXExpressionContainer(path) {
      if (t.isStringLiteral(path.node.expression)) {
        const text = path.node.expression.value.trim();
        if (shouldSkipText(text)) return;
        const suffix = "text";
        const key = createKey(filePath, suffix, text, existingKeys);
        translations.en[key] = translations.en[key] || text;
        translations.ar[key] = translations.ar[key] || text;
        path.replaceWith(t.jsxExpressionContainer(buildTCall(key)));
        modified = true;
        needsUseTranslation = true;
      }
    },
  });

  if (modified) {
    if (needsUseTranslation) {
      addUseTranslationImport(ast);
      insertTHook(ast);
    }
    const output = generate(
      ast,
      { retainLines: true, decoratorsBeforeExport: true },
      source,
    ).code;
    fs.writeFileSync(filePath, output);
  }
  return modified;
}

function gatherFiles() {
  const files = [];
  const walk = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".git") continue;
        walk(fullPath);
      } else if (entry.isFile() && /\.(jsx|js)$/.test(entry.name)) {
        if (
          fullPath.includes(path.join("src", "components")) ||
          fullPath.includes(path.join("src", "pages"))
        ) {
          files.push(fullPath);
        }
      }
    }
  };
  walk(srcRoot);
  return files;
}

function main() {
  ensurePublicLocaleDirs();
  const translations = loadTranslations();
  const existingKeys = new Set([
    ...Object.keys(translations.en),
    ...Object.keys(translations.ar),
  ]);
  const files = gatherFiles();
  let changedCount = 0;
  for (const filePath of files) {
    const modified = transformFile(filePath, translations, existingKeys);
    if (modified) {
      console.log("Updated", filePath);
      changedCount += 1;
    }
  }
  writeTranslations(translations);
  console.log(`Migration complete. Updated ${changedCount} files.`);
}

main();
