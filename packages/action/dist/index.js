"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../../node_modules/yaml/dist/nodes/identity.js
var require_identity = __commonJS({
  "../../node_modules/yaml/dist/nodes/identity.js"(exports2) {
    "use strict";
    var ALIAS = /* @__PURE__ */ Symbol.for("yaml.alias");
    var DOC = /* @__PURE__ */ Symbol.for("yaml.document");
    var MAP = /* @__PURE__ */ Symbol.for("yaml.map");
    var PAIR = /* @__PURE__ */ Symbol.for("yaml.pair");
    var SCALAR = /* @__PURE__ */ Symbol.for("yaml.scalar");
    var SEQ = /* @__PURE__ */ Symbol.for("yaml.seq");
    var NODE_TYPE = /* @__PURE__ */ Symbol.for("yaml.node.type");
    var isAlias = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
    var isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
    var isMap = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
    var isPair = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
    var isScalar = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR;
    var isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
    function isCollection(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case MAP:
          case SEQ:
            return true;
        }
      return false;
    }
    function isNode(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case ALIAS:
          case MAP:
          case SCALAR:
          case SEQ:
            return true;
        }
      return false;
    }
    var hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;
    exports2.ALIAS = ALIAS;
    exports2.DOC = DOC;
    exports2.MAP = MAP;
    exports2.NODE_TYPE = NODE_TYPE;
    exports2.PAIR = PAIR;
    exports2.SCALAR = SCALAR;
    exports2.SEQ = SEQ;
    exports2.hasAnchor = hasAnchor;
    exports2.isAlias = isAlias;
    exports2.isCollection = isCollection;
    exports2.isDocument = isDocument;
    exports2.isMap = isMap;
    exports2.isNode = isNode;
    exports2.isPair = isPair;
    exports2.isScalar = isScalar;
    exports2.isSeq = isSeq;
  }
});

// ../../node_modules/yaml/dist/visit.js
var require_visit = __commonJS({
  "../../node_modules/yaml/dist/visit.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var BREAK = /* @__PURE__ */ Symbol("break visit");
    var SKIP = /* @__PURE__ */ Symbol("skip children");
    var REMOVE = /* @__PURE__ */ Symbol("remove node");
    function visit(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd = visit_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        visit_(null, node, visitor_, Object.freeze([]));
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP;
    visit.REMOVE = REMOVE;
    function visit_(key, node, visitor, path) {
      const ctrl = callVisitor(key, node, visitor, path);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path, ctrl);
        return visit_(key, ctrl, visitor, path);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path = Object.freeze(path.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = visit_(i, node.items[i], visitor, path);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path = Object.freeze(path.concat(node));
          const ck = visit_("key", node.key, visitor, path);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = visit_("value", node.value, visitor, path);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    async function visitAsync(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd = await visitAsync_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        await visitAsync_(null, node, visitor_, Object.freeze([]));
    }
    visitAsync.BREAK = BREAK;
    visitAsync.SKIP = SKIP;
    visitAsync.REMOVE = REMOVE;
    async function visitAsync_(key, node, visitor, path) {
      const ctrl = await callVisitor(key, node, visitor, path);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path, ctrl);
        return visitAsync_(key, ctrl, visitor, path);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path = Object.freeze(path.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = await visitAsync_(i, node.items[i], visitor, path);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path = Object.freeze(path.concat(node));
          const ck = await visitAsync_("key", node.key, visitor, path);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = await visitAsync_("value", node.value, visitor, path);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    function initVisitor(visitor) {
      if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) {
        return Object.assign({
          Alias: visitor.Node,
          Map: visitor.Node,
          Scalar: visitor.Node,
          Seq: visitor.Node
        }, visitor.Value && {
          Map: visitor.Value,
          Scalar: visitor.Value,
          Seq: visitor.Value
        }, visitor.Collection && {
          Map: visitor.Collection,
          Seq: visitor.Collection
        }, visitor);
      }
      return visitor;
    }
    function callVisitor(key, node, visitor, path) {
      if (typeof visitor === "function")
        return visitor(key, node, path);
      if (identity.isMap(node))
        return visitor.Map?.(key, node, path);
      if (identity.isSeq(node))
        return visitor.Seq?.(key, node, path);
      if (identity.isPair(node))
        return visitor.Pair?.(key, node, path);
      if (identity.isScalar(node))
        return visitor.Scalar?.(key, node, path);
      if (identity.isAlias(node))
        return visitor.Alias?.(key, node, path);
      return void 0;
    }
    function replaceNode(key, path, node) {
      const parent = path[path.length - 1];
      if (identity.isCollection(parent)) {
        parent.items[key] = node;
      } else if (identity.isPair(parent)) {
        if (key === "key")
          parent.key = node;
        else
          parent.value = node;
      } else if (identity.isDocument(parent)) {
        parent.contents = node;
      } else {
        const pt = identity.isAlias(parent) ? "alias" : "scalar";
        throw new Error(`Cannot replace node with ${pt} parent`);
      }
    }
    exports2.visit = visit;
    exports2.visitAsync = visitAsync;
  }
});

// ../../node_modules/yaml/dist/doc/directives.js
var require_directives = __commonJS({
  "../../node_modules/yaml/dist/doc/directives.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var visit = require_visit();
    var escapeChars = {
      "!": "%21",
      ",": "%2C",
      "[": "%5B",
      "]": "%5D",
      "{": "%7B",
      "}": "%7D"
    };
    var escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);
    var Directives = class _Directives {
      constructor(yaml, tags) {
        this.docStart = null;
        this.docEnd = false;
        this.yaml = Object.assign({}, _Directives.defaultYaml, yaml);
        this.tags = Object.assign({}, _Directives.defaultTags, tags);
      }
      clone() {
        const copy = new _Directives(this.yaml, this.tags);
        copy.docStart = this.docStart;
        return copy;
      }
      /**
       * During parsing, get a Directives instance for the current document and
       * update the stream state according to the current version's spec.
       */
      atDocument() {
        const res = new _Directives(this.yaml, this.tags);
        switch (this.yaml.version) {
          case "1.1":
            this.atNextDocument = true;
            break;
          case "1.2":
            this.atNextDocument = false;
            this.yaml = {
              explicit: _Directives.defaultYaml.explicit,
              version: "1.2"
            };
            this.tags = Object.assign({}, _Directives.defaultTags);
            break;
        }
        return res;
      }
      /**
       * @param onError - May be called even if the action was successful
       * @returns `true` on success
       */
      add(line, onError) {
        if (this.atNextDocument) {
          this.yaml = { explicit: _Directives.defaultYaml.explicit, version: "1.1" };
          this.tags = Object.assign({}, _Directives.defaultTags);
          this.atNextDocument = false;
        }
        const parts = line.trim().split(/[ \t]+/);
        const name = parts.shift();
        switch (name) {
          case "%TAG": {
            if (parts.length !== 2) {
              onError(0, "%TAG directive should contain exactly two parts");
              if (parts.length < 2)
                return false;
            }
            const [handle, prefix] = parts;
            this.tags[handle] = prefix;
            return true;
          }
          case "%YAML": {
            this.yaml.explicit = true;
            if (parts.length !== 1) {
              onError(0, "%YAML directive should contain exactly one part");
              return false;
            }
            const [version] = parts;
            if (version === "1.1" || version === "1.2") {
              this.yaml.version = version;
              return true;
            } else {
              const isValid = /^\d+\.\d+$/.test(version);
              onError(6, `Unsupported YAML version ${version}`, isValid);
              return false;
            }
          }
          default:
            onError(0, `Unknown directive ${name}`, true);
            return false;
        }
      }
      /**
       * Resolves a tag, matching handles to those defined in %TAG directives.
       *
       * @returns Resolved tag, which may also be the non-specific tag `'!'` or a
       *   `'!local'` tag, or `null` if unresolvable.
       */
      tagName(source, onError) {
        if (source === "!")
          return "!";
        if (source[0] !== "!") {
          onError(`Not a valid tag: ${source}`);
          return null;
        }
        if (source[1] === "<") {
          const verbatim = source.slice(2, -1);
          if (verbatim === "!" || verbatim === "!!") {
            onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
            return null;
          }
          if (source[source.length - 1] !== ">")
            onError("Verbatim tags must end with a >");
          return verbatim;
        }
        const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
        if (!suffix)
          onError(`The ${source} tag has no suffix`);
        const prefix = this.tags[handle];
        if (prefix) {
          try {
            return prefix + decodeURIComponent(suffix);
          } catch (error) {
            onError(String(error));
            return null;
          }
        }
        if (handle === "!")
          return source;
        onError(`Could not resolve tag: ${source}`);
        return null;
      }
      /**
       * Given a fully resolved tag, returns its printable string form,
       * taking into account current tag prefixes and defaults.
       */
      tagString(tag) {
        for (const [handle, prefix] of Object.entries(this.tags)) {
          if (tag.startsWith(prefix))
            return handle + escapeTagName(tag.substring(prefix.length));
        }
        return tag[0] === "!" ? tag : `!<${tag}>`;
      }
      toString(doc) {
        const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
        const tagEntries = Object.entries(this.tags);
        let tagNames;
        if (doc && tagEntries.length > 0 && identity.isNode(doc.contents)) {
          const tags = {};
          visit.visit(doc.contents, (_key, node) => {
            if (identity.isNode(node) && node.tag)
              tags[node.tag] = true;
          });
          tagNames = Object.keys(tags);
        } else
          tagNames = [];
        for (const [handle, prefix] of tagEntries) {
          if (handle === "!!" && prefix === "tag:yaml.org,2002:")
            continue;
          if (!doc || tagNames.some((tn) => tn.startsWith(prefix)))
            lines.push(`%TAG ${handle} ${prefix}`);
        }
        return lines.join("\n");
      }
    };
    Directives.defaultYaml = { explicit: false, version: "1.2" };
    Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };
    exports2.Directives = Directives;
  }
});

// ../../node_modules/yaml/dist/doc/anchors.js
var require_anchors = __commonJS({
  "../../node_modules/yaml/dist/doc/anchors.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var visit = require_visit();
    function anchorIsValid(anchor) {
      if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
        const sa = JSON.stringify(anchor);
        const msg = `Anchor must not contain whitespace or control characters: ${sa}`;
        throw new Error(msg);
      }
      return true;
    }
    function anchorNames(root) {
      const anchors = /* @__PURE__ */ new Set();
      visit.visit(root, {
        Value(_key, node) {
          if (node.anchor)
            anchors.add(node.anchor);
        }
      });
      return anchors;
    }
    function findNewAnchor(prefix, exclude) {
      for (let i = 1; true; ++i) {
        const name = `${prefix}${i}`;
        if (!exclude.has(name))
          return name;
      }
    }
    function createNodeAnchors(doc, prefix) {
      const aliasObjects = [];
      const sourceObjects = /* @__PURE__ */ new Map();
      let prevAnchors = null;
      return {
        onAnchor: (source) => {
          aliasObjects.push(source);
          prevAnchors ?? (prevAnchors = anchorNames(doc));
          const anchor = findNewAnchor(prefix, prevAnchors);
          prevAnchors.add(anchor);
          return anchor;
        },
        /**
         * With circular references, the source node is only resolved after all
         * of its child nodes are. This is why anchors are set only after all of
         * the nodes have been created.
         */
        setAnchors: () => {
          for (const source of aliasObjects) {
            const ref = sourceObjects.get(source);
            if (typeof ref === "object" && ref.anchor && (identity.isScalar(ref.node) || identity.isCollection(ref.node))) {
              ref.node.anchor = ref.anchor;
            } else {
              const error = new Error("Failed to resolve repeated object (this should not happen)");
              error.source = source;
              throw error;
            }
          }
        },
        sourceObjects
      };
    }
    exports2.anchorIsValid = anchorIsValid;
    exports2.anchorNames = anchorNames;
    exports2.createNodeAnchors = createNodeAnchors;
    exports2.findNewAnchor = findNewAnchor;
  }
});

// ../../node_modules/yaml/dist/doc/applyReviver.js
var require_applyReviver = __commonJS({
  "../../node_modules/yaml/dist/doc/applyReviver.js"(exports2) {
    "use strict";
    function applyReviver(reviver, obj, key, val) {
      if (val && typeof val === "object") {
        if (Array.isArray(val)) {
          for (let i = 0, len = val.length; i < len; ++i) {
            const v0 = val[i];
            const v1 = applyReviver(reviver, val, String(i), v0);
            if (v1 === void 0)
              delete val[i];
            else if (v1 !== v0)
              val[i] = v1;
          }
        } else if (val instanceof Map) {
          for (const k of Array.from(val.keys())) {
            const v0 = val.get(k);
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              val.delete(k);
            else if (v1 !== v0)
              val.set(k, v1);
          }
        } else if (val instanceof Set) {
          for (const v0 of Array.from(val)) {
            const v1 = applyReviver(reviver, val, v0, v0);
            if (v1 === void 0)
              val.delete(v0);
            else if (v1 !== v0) {
              val.delete(v0);
              val.add(v1);
            }
          }
        } else {
          for (const [k, v0] of Object.entries(val)) {
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              delete val[k];
            else if (v1 !== v0)
              val[k] = v1;
          }
        }
      }
      return reviver.call(obj, key, val);
    }
    exports2.applyReviver = applyReviver;
  }
});

// ../../node_modules/yaml/dist/nodes/toJS.js
var require_toJS = __commonJS({
  "../../node_modules/yaml/dist/nodes/toJS.js"(exports2) {
    "use strict";
    var identity = require_identity();
    function toJS(value, arg, ctx) {
      if (Array.isArray(value))
        return value.map((v, i) => toJS(v, String(i), ctx));
      if (value && typeof value.toJSON === "function") {
        if (!ctx || !identity.hasAnchor(value))
          return value.toJSON(arg, ctx);
        const data = { aliasCount: 0, count: 1, res: void 0 };
        ctx.anchors.set(value, data);
        ctx.onCreate = (res2) => {
          data.res = res2;
          delete ctx.onCreate;
        };
        const res = value.toJSON(arg, ctx);
        if (ctx.onCreate)
          ctx.onCreate(res);
        return res;
      }
      if (typeof value === "bigint" && !ctx?.keep)
        return Number(value);
      return value;
    }
    exports2.toJS = toJS;
  }
});

// ../../node_modules/yaml/dist/nodes/Node.js
var require_Node = __commonJS({
  "../../node_modules/yaml/dist/nodes/Node.js"(exports2) {
    "use strict";
    var applyReviver = require_applyReviver();
    var identity = require_identity();
    var toJS = require_toJS();
    var NodeBase = class {
      constructor(type) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: type });
      }
      /** Create a copy of this node.  */
      clone() {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** A plain JavaScript representation of this node. */
      toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        if (!identity.isDocument(doc))
          throw new TypeError("A document argument is required");
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc,
          keep: true,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this, "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
    };
    exports2.NodeBase = NodeBase;
  }
});

// ../../node_modules/yaml/dist/nodes/Alias.js
var require_Alias = __commonJS({
  "../../node_modules/yaml/dist/nodes/Alias.js"(exports2) {
    "use strict";
    var anchors = require_anchors();
    var visit = require_visit();
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var Alias = class extends Node.NodeBase {
      constructor(source) {
        super(identity.ALIAS);
        this.source = source;
        Object.defineProperty(this, "tag", {
          set() {
            throw new Error("Alias nodes cannot have tags");
          }
        });
      }
      /**
       * Resolve the value of this alias within `doc`, finding the last
       * instance of the `source` anchor before this node.
       */
      resolve(doc, ctx) {
        if (ctx?.maxAliasCount === 0)
          throw new ReferenceError("Alias resolution is disabled");
        let nodes;
        if (ctx?.aliasResolveCache) {
          nodes = ctx.aliasResolveCache;
        } else {
          nodes = [];
          visit.visit(doc, {
            Node: (_key, node) => {
              if (identity.isAlias(node) || identity.hasAnchor(node))
                nodes.push(node);
            }
          });
          if (ctx)
            ctx.aliasResolveCache = nodes;
        }
        let found = void 0;
        for (const node of nodes) {
          if (node === this)
            break;
          if (node.anchor === this.source)
            found = node;
        }
        if (found && ctx) {
          const { anchors: anchors2, doc: doc2, maxAliasCount } = ctx;
          let data = anchors2.get(found);
          if (!data) {
            toJS.toJS(found, null, ctx);
            data = anchors2.get(found);
          }
          if (data?.res === void 0) {
            const msg = "This should not happen: Alias anchor was not resolved?";
            throw new ReferenceError(msg);
          }
          if (maxAliasCount >= 0) {
            data.count += 1;
            if (data.aliasCount === 0)
              data.aliasCount = getAliasCount(doc2, found, anchors2);
            if (data.count * data.aliasCount > maxAliasCount) {
              const msg = "Excessive alias count indicates a resource exhaustion attack";
              throw new ReferenceError(msg);
            }
          }
        }
        return found;
      }
      toJSON(_arg, ctx) {
        if (!ctx)
          return { source: this.source };
        const source = this.resolve(ctx.doc, ctx);
        if (!source) {
          const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
          throw new ReferenceError(msg);
        }
        return ctx.anchors.get(source).res;
      }
      toString(ctx, _onComment, _onChompKeep) {
        const src = `*${this.source}`;
        if (ctx) {
          anchors.anchorIsValid(this.source);
          if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
            const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
            throw new Error(msg);
          }
          if (ctx.implicitKey)
            return `${src} `;
        }
        return src;
      }
    };
    function getAliasCount(doc, node, anchors2) {
      if (identity.isAlias(node)) {
        const source = node.resolve(doc);
        const anchor = anchors2 && source && anchors2.get(source);
        return anchor ? anchor.count * anchor.aliasCount : 0;
      } else if (identity.isCollection(node)) {
        let count = 0;
        for (const item of node.items) {
          const c2 = getAliasCount(doc, item, anchors2);
          if (c2 > count)
            count = c2;
        }
        return count;
      } else if (identity.isPair(node)) {
        const kc = getAliasCount(doc, node.key, anchors2);
        const vc = getAliasCount(doc, node.value, anchors2);
        return Math.max(kc, vc);
      }
      return 1;
    }
    exports2.Alias = Alias;
  }
});

// ../../node_modules/yaml/dist/nodes/Scalar.js
var require_Scalar = __commonJS({
  "../../node_modules/yaml/dist/nodes/Scalar.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";
    var Scalar = class extends Node.NodeBase {
      constructor(value) {
        super(identity.SCALAR);
        this.value = value;
      }
      toJSON(arg, ctx) {
        return ctx?.keep ? this.value : toJS.toJS(this.value, arg, ctx);
      }
      toString() {
        return String(this.value);
      }
    };
    Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
    Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
    Scalar.PLAIN = "PLAIN";
    Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
    Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";
    exports2.Scalar = Scalar;
    exports2.isScalarValue = isScalarValue;
  }
});

// ../../node_modules/yaml/dist/doc/createNode.js
var require_createNode = __commonJS({
  "../../node_modules/yaml/dist/doc/createNode.js"(exports2) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var defaultTagPrefix = "tag:yaml.org,2002:";
    function findTagObject(value, tagName, tags) {
      if (tagName) {
        const match = tags.filter((t) => t.tag === tagName);
        const tagObj = match.find((t) => !t.format) ?? match[0];
        if (!tagObj)
          throw new Error(`Tag ${tagName} not found`);
        return tagObj;
      }
      return tags.find((t) => t.identify?.(value) && !t.format);
    }
    function createNode(value, tagName, ctx) {
      if (identity.isDocument(value))
        value = value.contents;
      if (identity.isNode(value))
        return value;
      if (identity.isPair(value)) {
        const map = ctx.schema[identity.MAP].createNode?.(ctx.schema, null, ctx);
        map.items.push(value);
        return map;
      }
      if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) {
        value = value.valueOf();
      }
      const { aliasDuplicateObjects, onAnchor, onTagObj, schema, sourceObjects } = ctx;
      let ref = void 0;
      if (aliasDuplicateObjects && value && typeof value === "object") {
        ref = sourceObjects.get(value);
        if (ref) {
          ref.anchor ?? (ref.anchor = onAnchor(value));
          return new Alias.Alias(ref.anchor);
        } else {
          ref = { anchor: null, node: null };
          sourceObjects.set(value, ref);
        }
      }
      if (tagName?.startsWith("!!"))
        tagName = defaultTagPrefix + tagName.slice(2);
      let tagObj = findTagObject(value, tagName, schema.tags);
      if (!tagObj) {
        if (value && typeof value.toJSON === "function") {
          value = value.toJSON();
        }
        if (!value || typeof value !== "object") {
          const node2 = new Scalar.Scalar(value);
          if (ref)
            ref.node = node2;
          return node2;
        }
        tagObj = value instanceof Map ? schema[identity.MAP] : Symbol.iterator in Object(value) ? schema[identity.SEQ] : schema[identity.MAP];
      }
      if (onTagObj) {
        onTagObj(tagObj);
        delete ctx.onTagObj;
      }
      const node = tagObj?.createNode ? tagObj.createNode(ctx.schema, value, ctx) : typeof tagObj?.nodeClass?.from === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar.Scalar(value);
      if (tagName)
        node.tag = tagName;
      else if (!tagObj.default)
        node.tag = tagObj.tag;
      if (ref)
        ref.node = node;
      return node;
    }
    exports2.createNode = createNode;
  }
});

// ../../node_modules/yaml/dist/nodes/Collection.js
var require_Collection = __commonJS({
  "../../node_modules/yaml/dist/nodes/Collection.js"(exports2) {
    "use strict";
    var createNode = require_createNode();
    var identity = require_identity();
    var Node = require_Node();
    function collectionFromPath(schema, path, value) {
      let v = value;
      for (let i = path.length - 1; i >= 0; --i) {
        const k = path[i];
        if (typeof k === "number" && Number.isInteger(k) && k >= 0) {
          const a = [];
          a[k] = v;
          v = a;
        } else {
          v = /* @__PURE__ */ new Map([[k, v]]);
        }
      }
      return createNode.createNode(v, void 0, {
        aliasDuplicateObjects: false,
        keepUndefined: false,
        onAnchor: () => {
          throw new Error("This should not happen, please report a bug.");
        },
        schema,
        sourceObjects: /* @__PURE__ */ new Map()
      });
    }
    var isEmptyPath = (path) => path == null || typeof path === "object" && !!path[Symbol.iterator]().next().done;
    var Collection = class extends Node.NodeBase {
      constructor(type, schema) {
        super(type);
        Object.defineProperty(this, "schema", {
          value: schema,
          configurable: true,
          enumerable: false,
          writable: true
        });
      }
      /**
       * Create a copy of this collection.
       *
       * @param schema - If defined, overwrites the original's schema
       */
      clone(schema) {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (schema)
          copy.schema = schema;
        copy.items = copy.items.map((it) => identity.isNode(it) || identity.isPair(it) ? it.clone(schema) : it);
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /**
       * Adds a value to the collection. For `!!map` and `!!omap` the value must
       * be a Pair instance or a `{ key, value }` object, which may not have a key
       * that already exists in the map.
       */
      addIn(path, value) {
        if (isEmptyPath(path))
          this.add(value);
        else {
          const [key, ...rest] = path;
          const node = this.get(key, true);
          if (identity.isCollection(node))
            node.addIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
      /**
       * Removes a value from the collection.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path) {
        const [key, ...rest] = path;
        if (rest.length === 0)
          return this.delete(key);
        const node = this.get(key, true);
        if (identity.isCollection(node))
          return node.deleteIn(rest);
        else
          throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path, keepScalar) {
        const [key, ...rest] = path;
        const node = this.get(key, true);
        if (rest.length === 0)
          return !keepScalar && identity.isScalar(node) ? node.value : node;
        else
          return identity.isCollection(node) ? node.getIn(rest, keepScalar) : void 0;
      }
      hasAllNullValues(allowScalar) {
        return this.items.every((node) => {
          if (!identity.isPair(node))
            return false;
          const n = node.value;
          return n == null || allowScalar && identity.isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
        });
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       */
      hasIn(path) {
        const [key, ...rest] = path;
        if (rest.length === 0)
          return this.has(key);
        const node = this.get(key, true);
        return identity.isCollection(node) ? node.hasIn(rest) : false;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path, value) {
        const [key, ...rest] = path;
        if (rest.length === 0) {
          this.set(key, value);
        } else {
          const node = this.get(key, true);
          if (identity.isCollection(node))
            node.setIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
    };
    exports2.Collection = Collection;
    exports2.collectionFromPath = collectionFromPath;
    exports2.isEmptyPath = isEmptyPath;
  }
});

// ../../node_modules/yaml/dist/stringify/stringifyComment.js
var require_stringifyComment = __commonJS({
  "../../node_modules/yaml/dist/stringify/stringifyComment.js"(exports2) {
    "use strict";
    var stringifyComment = (str) => str.replace(/^(?!$)(?: $)?/gm, "#");
    function indentComment(comment, indent) {
      if (/^\n+$/.test(comment))
        return comment.substring(1);
      return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
    }
    var lineComment = (str, indent, comment) => str.endsWith("\n") ? indentComment(comment, indent) : comment.includes("\n") ? "\n" + indentComment(comment, indent) : (str.endsWith(" ") ? "" : " ") + comment;
    exports2.indentComment = indentComment;
    exports2.lineComment = lineComment;
    exports2.stringifyComment = stringifyComment;
  }
});

// ../../node_modules/yaml/dist/stringify/foldFlowLines.js
var require_foldFlowLines = __commonJS({
  "../../node_modules/yaml/dist/stringify/foldFlowLines.js"(exports2) {
    "use strict";
    var FOLD_FLOW = "flow";
    var FOLD_BLOCK = "block";
    var FOLD_QUOTED = "quoted";
    function foldFlowLines(text10, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
      if (!lineWidth || lineWidth < 0)
        return text10;
      if (lineWidth < minContentWidth)
        minContentWidth = 0;
      const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
      if (text10.length <= endStep)
        return text10;
      const folds = [];
      const escapedFolds = {};
      let end = lineWidth - indent.length;
      if (typeof indentAtStart === "number") {
        if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
          folds.push(0);
        else
          end = lineWidth - indentAtStart;
      }
      let split = void 0;
      let prev = void 0;
      let overflow = false;
      let i = -1;
      let escStart = -1;
      let escEnd = -1;
      if (mode === FOLD_BLOCK) {
        i = consumeMoreIndentedLines(text10, i, indent.length);
        if (i !== -1)
          end = i + endStep;
      }
      for (let ch; ch = text10[i += 1]; ) {
        if (mode === FOLD_QUOTED && ch === "\\") {
          escStart = i;
          switch (text10[i + 1]) {
            case "x":
              i += 3;
              break;
            case "u":
              i += 5;
              break;
            case "U":
              i += 9;
              break;
            default:
              i += 1;
          }
          escEnd = i;
        }
        if (ch === "\n") {
          if (mode === FOLD_BLOCK)
            i = consumeMoreIndentedLines(text10, i, indent.length);
          end = i + indent.length + endStep;
          split = void 0;
        } else {
          if (ch === " " && prev && prev !== " " && prev !== "\n" && prev !== "	") {
            const next = text10[i + 1];
            if (next && next !== " " && next !== "\n" && next !== "	")
              split = i;
          }
          if (i >= end) {
            if (split) {
              folds.push(split);
              end = split + endStep;
              split = void 0;
            } else if (mode === FOLD_QUOTED) {
              while (prev === " " || prev === "	") {
                prev = ch;
                ch = text10[i += 1];
                overflow = true;
              }
              const j = i > escEnd + 1 ? i - 2 : escStart - 1;
              if (escapedFolds[j])
                return text10;
              folds.push(j);
              escapedFolds[j] = true;
              end = j + endStep;
              split = void 0;
            } else {
              overflow = true;
            }
          }
        }
        prev = ch;
      }
      if (overflow && onOverflow)
        onOverflow();
      if (folds.length === 0)
        return text10;
      if (onFold)
        onFold();
      let res = text10.slice(0, folds[0]);
      for (let i2 = 0; i2 < folds.length; ++i2) {
        const fold = folds[i2];
        const end2 = folds[i2 + 1] || text10.length;
        if (fold === 0)
          res = `
${indent}${text10.slice(0, end2)}`;
        else {
          if (mode === FOLD_QUOTED && escapedFolds[fold])
            res += `${text10[fold]}\\`;
          res += `
${indent}${text10.slice(fold + 1, end2)}`;
        }
      }
      return res;
    }
    function consumeMoreIndentedLines(text10, i, indent) {
      let end = i;
      let start = i + 1;
      let ch = text10[start];
      while (ch === " " || ch === "	") {
        if (i < start + indent) {
          ch = text10[++i];
        } else {
          do {
            ch = text10[++i];
          } while (ch && ch !== "\n");
          end = i;
          start = i + 1;
          ch = text10[start];
        }
      }
      return end;
    }
    exports2.FOLD_BLOCK = FOLD_BLOCK;
    exports2.FOLD_FLOW = FOLD_FLOW;
    exports2.FOLD_QUOTED = FOLD_QUOTED;
    exports2.foldFlowLines = foldFlowLines;
  }
});

// ../../node_modules/yaml/dist/stringify/stringifyString.js
var require_stringifyString = __commonJS({
  "../../node_modules/yaml/dist/stringify/stringifyString.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var foldFlowLines = require_foldFlowLines();
    var getFoldOptions = (ctx, isBlock) => ({
      indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
      lineWidth: ctx.options.lineWidth,
      minContentWidth: ctx.options.minContentWidth
    });
    var containsDocumentMarker = (str) => /^(%|---|\.\.\.)/m.test(str);
    function lineLengthOverLimit(str, lineWidth, indentLength) {
      if (!lineWidth || lineWidth < 0)
        return false;
      const limit = lineWidth - indentLength;
      const strLen = str.length;
      if (strLen <= limit)
        return false;
      for (let i = 0, start = 0; i < strLen; ++i) {
        if (str[i] === "\n") {
          if (i - start > limit)
            return true;
          start = i + 1;
          if (strLen - start <= limit)
            return false;
        }
      }
      return true;
    }
    function doubleQuotedString(value, ctx) {
      const json = JSON.stringify(value);
      if (ctx.options.doubleQuotedAsJSON)
        return json;
      const { implicitKey } = ctx;
      const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      let str = "";
      let start = 0;
      for (let i = 0, ch = json[i]; ch; ch = json[++i]) {
        if (ch === " " && json[i + 1] === "\\" && json[i + 2] === "n") {
          str += json.slice(start, i) + "\\ ";
          i += 1;
          start = i;
          ch = "\\";
        }
        if (ch === "\\")
          switch (json[i + 1]) {
            case "u":
              {
                str += json.slice(start, i);
                const code = json.substr(i + 2, 4);
                switch (code) {
                  case "0000":
                    str += "\\0";
                    break;
                  case "0007":
                    str += "\\a";
                    break;
                  case "000b":
                    str += "\\v";
                    break;
                  case "001b":
                    str += "\\e";
                    break;
                  case "0085":
                    str += "\\N";
                    break;
                  case "00a0":
                    str += "\\_";
                    break;
                  case "2028":
                    str += "\\L";
                    break;
                  case "2029":
                    str += "\\P";
                    break;
                  default:
                    if (code.substr(0, 2) === "00")
                      str += "\\x" + code.substr(2);
                    else
                      str += json.substr(i, 6);
                }
                i += 5;
                start = i + 1;
              }
              break;
            case "n":
              if (implicitKey || json[i + 2] === '"' || json.length < minMultiLineLength) {
                i += 1;
              } else {
                str += json.slice(start, i) + "\n\n";
                while (json[i + 2] === "\\" && json[i + 3] === "n" && json[i + 4] !== '"') {
                  str += "\n";
                  i += 2;
                }
                str += indent;
                if (json[i + 2] === " ")
                  str += "\\";
                i += 1;
                start = i + 1;
              }
              break;
            default:
              i += 1;
          }
      }
      str = start ? str + json.slice(start) : json;
      return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_QUOTED, getFoldOptions(ctx, false));
    }
    function singleQuotedString(value, ctx) {
      if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes("\n") || /[ \t]\n|\n[ \t]/.test(value))
        return doubleQuotedString(value, ctx);
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&
${indent}`) + "'";
      return ctx.implicitKey ? res : foldFlowLines.foldFlowLines(res, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function quotedString(value, ctx) {
      const { singleQuote } = ctx.options;
      let qs;
      if (singleQuote === false)
        qs = doubleQuotedString;
      else {
        const hasDouble = value.includes('"');
        const hasSingle = value.includes("'");
        if (hasDouble && !hasSingle)
          qs = singleQuotedString;
        else if (hasSingle && !hasDouble)
          qs = doubleQuotedString;
        else
          qs = singleQuote ? singleQuotedString : doubleQuotedString;
      }
      return qs(value, ctx);
    }
    var blockEndNewlines;
    try {
      blockEndNewlines = new RegExp("(^|(?<!\n))\n+(?!\n|$)", "g");
    } catch {
      blockEndNewlines = /\n+(?!\n|$)/g;
    }
    function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
      const { blockQuote, commentString, lineWidth } = ctx.options;
      if (!blockQuote || /\n[\t ]+$/.test(value)) {
        return quotedString(value, ctx);
      }
      const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
      const literal = blockQuote === "literal" ? true : blockQuote === "folded" || type === Scalar.Scalar.BLOCK_FOLDED ? false : type === Scalar.Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
      if (!value)
        return literal ? "|\n" : ">\n";
      let chomp;
      let endStart;
      for (endStart = value.length; endStart > 0; --endStart) {
        const ch = value[endStart - 1];
        if (ch !== "\n" && ch !== "	" && ch !== " ")
          break;
      }
      let end = value.substring(endStart);
      const endNlPos = end.indexOf("\n");
      if (endNlPos === -1) {
        chomp = "-";
      } else if (value === end || endNlPos !== end.length - 1) {
        chomp = "+";
        if (onChompKeep)
          onChompKeep();
      } else {
        chomp = "";
      }
      if (end) {
        value = value.slice(0, -end.length);
        if (end[end.length - 1] === "\n")
          end = end.slice(0, -1);
        end = end.replace(blockEndNewlines, `$&${indent}`);
      }
      let startWithSpace = false;
      let startEnd;
      let startNlPos = -1;
      for (startEnd = 0; startEnd < value.length; ++startEnd) {
        const ch = value[startEnd];
        if (ch === " ")
          startWithSpace = true;
        else if (ch === "\n")
          startNlPos = startEnd;
        else
          break;
      }
      let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
      if (start) {
        value = value.substring(start.length);
        start = start.replace(/\n+/g, `$&${indent}`);
      }
      const indentSize = indent ? "2" : "1";
      let header = (startWithSpace ? indentSize : "") + chomp;
      if (comment) {
        header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
        if (onComment)
          onComment();
      }
      if (!literal) {
        const foldedValue = value.replace(/\n+/g, "\n$&").replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
        let literalFallback = false;
        const foldOptions = getFoldOptions(ctx, true);
        if (blockQuote !== "folded" && type !== Scalar.Scalar.BLOCK_FOLDED) {
          foldOptions.onOverflow = () => {
            literalFallback = true;
          };
        }
        const body = foldFlowLines.foldFlowLines(`${start}${foldedValue}${end}`, indent, foldFlowLines.FOLD_BLOCK, foldOptions);
        if (!literalFallback)
          return `>${header}
${indent}${body}`;
      }
      value = value.replace(/\n+/g, `$&${indent}`);
      return `|${header}
${indent}${start}${value}${end}`;
    }
    function plainString(item, ctx, onComment, onChompKeep) {
      const { type, value } = item;
      const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
      if (implicitKey && value.includes("\n") || inFlow && /[[\]{},]/.test(value)) {
        return quotedString(value, ctx);
      }
      if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
        return implicitKey || inFlow || !value.includes("\n") ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
      }
      if (!implicitKey && !inFlow && type !== Scalar.Scalar.PLAIN && value.includes("\n")) {
        return blockString(item, ctx, onComment, onChompKeep);
      }
      if (containsDocumentMarker(value)) {
        if (indent === "") {
          ctx.forceBlockIndent = true;
          return blockString(item, ctx, onComment, onChompKeep);
        } else if (implicitKey && indent === indentStep) {
          return quotedString(value, ctx);
        }
      }
      const str = value.replace(/\n+/g, `$&
${indent}`);
      if (actualString) {
        const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str);
        const { compat, tags } = ctx.doc.schema;
        if (tags.some(test) || compat?.some(test))
          return quotedString(value, ctx);
      }
      return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function stringifyString(item, ctx, onComment, onChompKeep) {
      const { implicitKey, inFlow } = ctx;
      const ss = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
      let { type } = item;
      if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
        if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
          type = Scalar.Scalar.QUOTE_DOUBLE;
      }
      const _stringify = (_type) => {
        switch (_type) {
          case Scalar.Scalar.BLOCK_FOLDED:
          case Scalar.Scalar.BLOCK_LITERAL:
            return implicitKey || inFlow ? quotedString(ss.value, ctx) : blockString(ss, ctx, onComment, onChompKeep);
          case Scalar.Scalar.QUOTE_DOUBLE:
            return doubleQuotedString(ss.value, ctx);
          case Scalar.Scalar.QUOTE_SINGLE:
            return singleQuotedString(ss.value, ctx);
          case Scalar.Scalar.PLAIN:
            return plainString(ss, ctx, onComment, onChompKeep);
          default:
            return null;
        }
      };
      let res = _stringify(type);
      if (res === null) {
        const { defaultKeyType, defaultStringType } = ctx.options;
        const t = implicitKey && defaultKeyType || defaultStringType;
        res = _stringify(t);
        if (res === null)
          throw new Error(`Unsupported default string type ${t}`);
      }
      return res;
    }
    exports2.stringifyString = stringifyString;
  }
});

// ../../node_modules/yaml/dist/stringify/stringify.js
var require_stringify = __commonJS({
  "../../node_modules/yaml/dist/stringify/stringify.js"(exports2) {
    "use strict";
    var anchors = require_anchors();
    var identity = require_identity();
    var stringifyComment = require_stringifyComment();
    var stringifyString = require_stringifyString();
    function createStringifyContext(doc, options) {
      const opt = Object.assign({
        blockQuote: true,
        commentString: stringifyComment.stringifyComment,
        defaultKeyType: null,
        defaultStringType: "PLAIN",
        directives: null,
        doubleQuotedAsJSON: false,
        doubleQuotedMinMultiLineLength: 40,
        falseStr: "false",
        flowCollectionPadding: true,
        indentSeq: true,
        lineWidth: 80,
        minContentWidth: 20,
        nullStr: "null",
        simpleKeys: false,
        singleQuote: null,
        trailingComma: false,
        trueStr: "true",
        verifyAliasOrder: true
      }, doc.schema.toStringOptions, options);
      let inFlow;
      switch (opt.collectionStyle) {
        case "block":
          inFlow = false;
          break;
        case "flow":
          inFlow = true;
          break;
        default:
          inFlow = null;
      }
      return {
        anchors: /* @__PURE__ */ new Set(),
        doc,
        flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
        indent: "",
        indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
        inFlow,
        options: opt
      };
    }
    function getTagObject(tags, item) {
      if (item.tag) {
        const match = tags.filter((t) => t.tag === item.tag);
        if (match.length > 0)
          return match.find((t) => t.format === item.format) ?? match[0];
      }
      let tagObj = void 0;
      let obj;
      if (identity.isScalar(item)) {
        obj = item.value;
        let match = tags.filter((t) => t.identify?.(obj));
        if (match.length > 1) {
          const testMatch = match.filter((t) => t.test);
          if (testMatch.length > 0)
            match = testMatch;
        }
        tagObj = match.find((t) => t.format === item.format) ?? match.find((t) => !t.format);
      } else {
        obj = item;
        tagObj = tags.find((t) => t.nodeClass && obj instanceof t.nodeClass);
      }
      if (!tagObj) {
        const name = obj?.constructor?.name ?? (obj === null ? "null" : typeof obj);
        throw new Error(`Tag not resolved for ${name} value`);
      }
      return tagObj;
    }
    function stringifyProps(node, tagObj, { anchors: anchors$1, doc }) {
      if (!doc.directives)
        return "";
      const props = [];
      const anchor = (identity.isScalar(node) || identity.isCollection(node)) && node.anchor;
      if (anchor && anchors.anchorIsValid(anchor)) {
        anchors$1.add(anchor);
        props.push(`&${anchor}`);
      }
      const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
      if (tag)
        props.push(doc.directives.tagString(tag));
      return props.join(" ");
    }
    function stringify2(item, ctx, onComment, onChompKeep) {
      if (identity.isPair(item))
        return item.toString(ctx, onComment, onChompKeep);
      if (identity.isAlias(item)) {
        if (ctx.doc.directives)
          return item.toString(ctx);
        if (ctx.resolvedAliases?.has(item)) {
          throw new TypeError(`Cannot stringify circular structure without alias nodes`);
        } else {
          if (ctx.resolvedAliases)
            ctx.resolvedAliases.add(item);
          else
            ctx.resolvedAliases = /* @__PURE__ */ new Set([item]);
          item = item.resolve(ctx.doc);
        }
      }
      let tagObj = void 0;
      const node = identity.isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o) => tagObj = o });
      tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
      const props = stringifyProps(node, tagObj, ctx);
      if (props.length > 0)
        ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
      const str = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : identity.isScalar(node) ? stringifyString.stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
      if (!props)
        return str;
      return identity.isScalar(node) || str[0] === "{" || str[0] === "[" ? `${props} ${str}` : `${props}
${ctx.indent}${str}`;
    }
    exports2.createStringifyContext = createStringifyContext;
    exports2.stringify = stringify2;
  }
});

// ../../node_modules/yaml/dist/stringify/stringifyPair.js
var require_stringifyPair = __commonJS({
  "../../node_modules/yaml/dist/stringify/stringifyPair.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var stringify2 = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
      const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
      let keyComment = identity.isNode(key) && key.comment || null;
      if (simpleKeys) {
        if (keyComment) {
          throw new Error("With simple keys, key nodes cannot have comments");
        }
        if (identity.isCollection(key) || !identity.isNode(key) && typeof key === "object") {
          const msg = "With simple keys, collection cannot be used as a key value";
          throw new Error(msg);
        }
      }
      let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || identity.isCollection(key) || (identity.isScalar(key) ? key.type === Scalar.Scalar.BLOCK_FOLDED || key.type === Scalar.Scalar.BLOCK_LITERAL : typeof key === "object"));
      ctx = Object.assign({}, ctx, {
        allNullValues: false,
        implicitKey: !explicitKey && (simpleKeys || !allNullValues),
        indent: indent + indentStep
      });
      let keyCommentDone = false;
      let chompKeep = false;
      let str = stringify2.stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
      if (!explicitKey && !ctx.inFlow && str.length > 1024) {
        if (simpleKeys)
          throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
        explicitKey = true;
      }
      if (ctx.inFlow) {
        if (allNullValues || value == null) {
          if (keyCommentDone && onComment)
            onComment();
          return str === "" ? "?" : explicitKey ? `? ${str}` : str;
        }
      } else if (allNullValues && !simpleKeys || value == null && explicitKey) {
        str = `? ${str}`;
        if (keyComment && !keyCommentDone) {
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
        } else if (chompKeep && onChompKeep)
          onChompKeep();
        return str;
      }
      if (keyCommentDone)
        keyComment = null;
      if (explicitKey) {
        if (keyComment)
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
        str = `? ${str}
${indent}:`;
      } else {
        str = `${str}:`;
        if (keyComment)
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
      }
      let vsb, vcb, valueComment;
      if (identity.isNode(value)) {
        vsb = !!value.spaceBefore;
        vcb = value.commentBefore;
        valueComment = value.comment;
      } else {
        vsb = false;
        vcb = null;
        valueComment = null;
        if (value && typeof value === "object")
          value = doc.createNode(value);
      }
      ctx.implicitKey = false;
      if (!explicitKey && !keyComment && identity.isScalar(value))
        ctx.indentAtStart = str.length + 1;
      chompKeep = false;
      if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && identity.isSeq(value) && !value.flow && !value.tag && !value.anchor) {
        ctx.indent = ctx.indent.substring(2);
      }
      let valueCommentDone = false;
      const valueStr = stringify2.stringify(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
      let ws = " ";
      if (keyComment || vsb || vcb) {
        ws = vsb ? "\n" : "";
        if (vcb) {
          const cs = commentString(vcb);
          ws += `
${stringifyComment.indentComment(cs, ctx.indent)}`;
        }
        if (valueStr === "" && !ctx.inFlow) {
          if (ws === "\n" && valueComment)
            ws = "\n\n";
        } else {
          ws += `
${ctx.indent}`;
        }
      } else if (!explicitKey && identity.isCollection(value)) {
        const vs0 = valueStr[0];
        const nl0 = valueStr.indexOf("\n");
        const hasNewline = nl0 !== -1;
        const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
        if (hasNewline || !flow) {
          let hasPropsLine = false;
          if (hasNewline && (vs0 === "&" || vs0 === "!")) {
            let sp0 = valueStr.indexOf(" ");
            if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") {
              sp0 = valueStr.indexOf(" ", sp0 + 1);
            }
            if (sp0 === -1 || nl0 < sp0)
              hasPropsLine = true;
          }
          if (!hasPropsLine)
            ws = `
${ctx.indent}`;
        }
      } else if (valueStr === "" || valueStr[0] === "\n") {
        ws = "";
      }
      str += ws + valueStr;
      if (ctx.inFlow) {
        if (valueCommentDone && onComment)
          onComment();
      } else if (valueComment && !valueCommentDone) {
        str += stringifyComment.lineComment(str, ctx.indent, commentString(valueComment));
      } else if (chompKeep && onChompKeep) {
        onChompKeep();
      }
      return str;
    }
    exports2.stringifyPair = stringifyPair;
  }
});

// ../../node_modules/yaml/dist/log.js
var require_log = __commonJS({
  "../../node_modules/yaml/dist/log.js"(exports2) {
    "use strict";
    var node_process = require("process");
    function debug(logLevel, ...messages) {
      if (logLevel === "debug")
        console.log(...messages);
    }
    function warn(logLevel, warning) {
      if (logLevel === "debug" || logLevel === "warn") {
        if (typeof node_process.emitWarning === "function")
          node_process.emitWarning(warning);
        else
          console.warn(warning);
      }
    }
    exports2.debug = debug;
    exports2.warn = warn;
  }
});

// ../../node_modules/yaml/dist/schema/yaml-1.1/merge.js
var require_merge = __commonJS({
  "../../node_modules/yaml/dist/schema/yaml-1.1/merge.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var MERGE_KEY = "<<";
    var merge = {
      identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
      default: "key",
      tag: "tag:yaml.org,2002:merge",
      test: /^<<$/,
      resolve: () => Object.assign(new Scalar.Scalar(Symbol(MERGE_KEY)), {
        addToJSMap: addMergeToJSMap
      }),
      stringify: () => MERGE_KEY
    };
    var isMergeKey = (ctx, key) => (merge.identify(key) || identity.isScalar(key) && (!key.type || key.type === Scalar.Scalar.PLAIN) && merge.identify(key.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge.tag && tag.default);
    function addMergeToJSMap(ctx, map, value) {
      const source = resolveAliasValue(ctx, value);
      if (identity.isSeq(source))
        for (const it of source.items)
          mergeValue(ctx, map, it);
      else if (Array.isArray(source))
        for (const it of source)
          mergeValue(ctx, map, it);
      else
        mergeValue(ctx, map, source);
    }
    function mergeValue(ctx, map, value) {
      const source = resolveAliasValue(ctx, value);
      if (!identity.isMap(source))
        throw new Error("Merge sources must be maps or map aliases");
      const srcMap = source.toJSON(null, ctx, Map);
      for (const [key, value2] of srcMap) {
        if (map instanceof Map) {
          if (!map.has(key))
            map.set(key, value2);
        } else if (map instanceof Set) {
          map.add(key);
        } else if (!Object.prototype.hasOwnProperty.call(map, key)) {
          Object.defineProperty(map, key, {
            value: value2,
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
      }
      return map;
    }
    function resolveAliasValue(ctx, value) {
      return ctx && identity.isAlias(value) ? value.resolve(ctx.doc, ctx) : value;
    }
    exports2.addMergeToJSMap = addMergeToJSMap;
    exports2.isMergeKey = isMergeKey;
    exports2.merge = merge;
  }
});

// ../../node_modules/yaml/dist/nodes/addPairToJSMap.js
var require_addPairToJSMap = __commonJS({
  "../../node_modules/yaml/dist/nodes/addPairToJSMap.js"(exports2) {
    "use strict";
    var log = require_log();
    var merge = require_merge();
    var stringify2 = require_stringify();
    var identity = require_identity();
    var toJS = require_toJS();
    function addPairToJSMap(ctx, map, { key, value }) {
      if (identity.isNode(key) && key.addToJSMap)
        key.addToJSMap(ctx, map, value);
      else if (merge.isMergeKey(ctx, key))
        merge.addMergeToJSMap(ctx, map, value);
      else {
        const jsKey = toJS.toJS(key, "", ctx);
        if (map instanceof Map) {
          map.set(jsKey, toJS.toJS(value, jsKey, ctx));
        } else if (map instanceof Set) {
          map.add(jsKey);
        } else {
          const stringKey = stringifyKey(key, jsKey, ctx);
          const jsValue = toJS.toJS(value, stringKey, ctx);
          if (stringKey in map)
            Object.defineProperty(map, stringKey, {
              value: jsValue,
              writable: true,
              enumerable: true,
              configurable: true
            });
          else
            map[stringKey] = jsValue;
        }
      }
      return map;
    }
    function stringifyKey(key, jsKey, ctx) {
      if (jsKey === null)
        return "";
      if (typeof jsKey !== "object")
        return String(jsKey);
      if (identity.isNode(key) && ctx?.doc) {
        const strCtx = stringify2.createStringifyContext(ctx.doc, {});
        strCtx.anchors = /* @__PURE__ */ new Set();
        for (const node of ctx.anchors.keys())
          strCtx.anchors.add(node.anchor);
        strCtx.inFlow = true;
        strCtx.inStringifyKey = true;
        const strKey = key.toString(strCtx);
        if (!ctx.mapKeyWarned) {
          let jsonStr = JSON.stringify(strKey);
          if (jsonStr.length > 40)
            jsonStr = jsonStr.substring(0, 36) + '..."';
          log.warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
          ctx.mapKeyWarned = true;
        }
        return strKey;
      }
      return JSON.stringify(jsKey);
    }
    exports2.addPairToJSMap = addPairToJSMap;
  }
});

// ../../node_modules/yaml/dist/nodes/Pair.js
var require_Pair = __commonJS({
  "../../node_modules/yaml/dist/nodes/Pair.js"(exports2) {
    "use strict";
    var createNode = require_createNode();
    var stringifyPair = require_stringifyPair();
    var addPairToJSMap = require_addPairToJSMap();
    var identity = require_identity();
    function createPair(key, value, ctx) {
      const k = createNode.createNode(key, void 0, ctx);
      const v = createNode.createNode(value, void 0, ctx);
      return new Pair(k, v);
    }
    var Pair = class _Pair {
      constructor(key, value = null) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.PAIR });
        this.key = key;
        this.value = value;
      }
      clone(schema) {
        let { key, value } = this;
        if (identity.isNode(key))
          key = key.clone(schema);
        if (identity.isNode(value))
          value = value.clone(schema);
        return new _Pair(key, value);
      }
      toJSON(_, ctx) {
        const pair = ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        return addPairToJSMap.addPairToJSMap(ctx, pair, this);
      }
      toString(ctx, onComment, onChompKeep) {
        return ctx?.doc ? stringifyPair.stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
      }
    };
    exports2.Pair = Pair;
    exports2.createPair = createPair;
  }
});

// ../../node_modules/yaml/dist/stringify/stringifyCollection.js
var require_stringifyCollection = __commonJS({
  "../../node_modules/yaml/dist/stringify/stringifyCollection.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var stringify2 = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyCollection(collection, ctx, options) {
      const flow = ctx.inFlow ?? collection.flow;
      const stringify3 = flow ? stringifyFlowCollection : stringifyBlockCollection;
      return stringify3(collection, ctx, options);
    }
    function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
      const { indent, options: { commentString } } = ctx;
      const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
      let chompKeep = false;
      const lines = [];
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment2 = null;
        if (identity.isNode(item)) {
          if (!chompKeep && item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
          if (item.comment)
            comment2 = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (!chompKeep && ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
          }
        }
        chompKeep = false;
        let str2 = stringify2.stringify(item, itemCtx, () => comment2 = null, () => chompKeep = true);
        if (comment2)
          str2 += stringifyComment.lineComment(str2, itemIndent, commentString(comment2));
        if (chompKeep && comment2)
          chompKeep = false;
        lines.push(blockItemPrefix + str2);
      }
      let str;
      if (lines.length === 0) {
        str = flowChars.start + flowChars.end;
      } else {
        str = lines[0];
        for (let i = 1; i < lines.length; ++i) {
          const line = lines[i];
          str += line ? `
${indent}${line}` : "\n";
        }
      }
      if (comment) {
        str += "\n" + stringifyComment.indentComment(commentString(comment), indent);
        if (onComment)
          onComment();
      } else if (chompKeep && onChompKeep)
        onChompKeep();
      return str;
    }
    function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
      const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
      itemIndent += indentStep;
      const itemCtx = Object.assign({}, ctx, {
        indent: itemIndent,
        inFlow: true,
        type: null
      });
      let reqNewline = false;
      let linesAtValue = 0;
      const lines = [];
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment = null;
        if (identity.isNode(item)) {
          if (item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, false);
          if (item.comment)
            comment = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, false);
            if (ik.comment)
              reqNewline = true;
          }
          const iv = identity.isNode(item.value) ? item.value : null;
          if (iv) {
            if (iv.comment)
              comment = iv.comment;
            if (iv.commentBefore)
              reqNewline = true;
          } else if (item.value == null && ik?.comment) {
            comment = ik.comment;
          }
        }
        if (comment)
          reqNewline = true;
        let str = stringify2.stringify(item, itemCtx, () => comment = null);
        reqNewline || (reqNewline = lines.length > linesAtValue || str.includes("\n"));
        if (i < items.length - 1) {
          str += ",";
        } else if (ctx.options.trailingComma) {
          if (ctx.options.lineWidth > 0) {
            reqNewline || (reqNewline = lines.reduce((sum, line) => sum + line.length + 2, 2) + (str.length + 2) > ctx.options.lineWidth);
          }
          if (reqNewline) {
            str += ",";
          }
        }
        if (comment)
          str += stringifyComment.lineComment(str, itemIndent, commentString(comment));
        lines.push(str);
        linesAtValue = lines.length;
      }
      const { start, end } = flowChars;
      if (lines.length === 0) {
        return start + end;
      } else {
        if (!reqNewline) {
          const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
          reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
        }
        if (reqNewline) {
          let str = start;
          for (const line of lines)
            str += line ? `
${indentStep}${indent}${line}` : "\n";
          return `${str}
${indent}${end}`;
        } else {
          return `${start}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
        }
      }
    }
    function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
      if (comment && chompKeep)
        comment = comment.replace(/^\n+/, "");
      if (comment) {
        const ic = stringifyComment.indentComment(commentString(comment), indent);
        lines.push(ic.trimStart());
      }
    }
    exports2.stringifyCollection = stringifyCollection;
  }
});

// ../../node_modules/yaml/dist/nodes/YAMLMap.js
var require_YAMLMap = __commonJS({
  "../../node_modules/yaml/dist/nodes/YAMLMap.js"(exports2) {
    "use strict";
    var stringifyCollection = require_stringifyCollection();
    var addPairToJSMap = require_addPairToJSMap();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    function findPair(items, key) {
      const k = identity.isScalar(key) ? key.value : key;
      for (const it of items) {
        if (identity.isPair(it)) {
          if (it.key === key || it.key === k)
            return it;
          if (identity.isScalar(it.key) && it.key.value === k)
            return it;
        }
      }
      return void 0;
    }
    var YAMLMap = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:map";
      }
      constructor(schema) {
        super(identity.MAP, schema);
        this.items = [];
      }
      /**
       * A generic collection parsing method that can be extended
       * to other node classes that inherit from YAMLMap
       */
      static from(schema, obj, ctx) {
        const { keepUndefined, replacer } = ctx;
        const map = new this(schema);
        const add = (key, value) => {
          if (typeof replacer === "function")
            value = replacer.call(obj, key, value);
          else if (Array.isArray(replacer) && !replacer.includes(key))
            return;
          if (value !== void 0 || keepUndefined)
            map.items.push(Pair.createPair(key, value, ctx));
        };
        if (obj instanceof Map) {
          for (const [key, value] of obj)
            add(key, value);
        } else if (obj && typeof obj === "object") {
          for (const key of Object.keys(obj))
            add(key, obj[key]);
        }
        if (typeof schema.sortMapEntries === "function") {
          map.items.sort(schema.sortMapEntries);
        }
        return map;
      }
      /**
       * Adds a value to the collection.
       *
       * @param overwrite - If not set `true`, using a key that is already in the
       *   collection will throw. Otherwise, overwrites the previous value.
       */
      add(pair, overwrite) {
        let _pair;
        if (identity.isPair(pair))
          _pair = pair;
        else if (!pair || typeof pair !== "object" || !("key" in pair)) {
          _pair = new Pair.Pair(pair, pair?.value);
        } else
          _pair = new Pair.Pair(pair.key, pair.value);
        const prev = findPair(this.items, _pair.key);
        const sortEntries = this.schema?.sortMapEntries;
        if (prev) {
          if (!overwrite)
            throw new Error(`Key ${_pair.key} already set`);
          if (identity.isScalar(prev.value) && Scalar.isScalarValue(_pair.value))
            prev.value.value = _pair.value;
          else
            prev.value = _pair.value;
        } else if (sortEntries) {
          const i = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
          if (i === -1)
            this.items.push(_pair);
          else
            this.items.splice(i, 0, _pair);
        } else {
          this.items.push(_pair);
        }
      }
      delete(key) {
        const it = findPair(this.items, key);
        if (!it)
          return false;
        const del = this.items.splice(this.items.indexOf(it), 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const it = findPair(this.items, key);
        const node = it?.value;
        return (!keepScalar && identity.isScalar(node) ? node.value : node) ?? void 0;
      }
      has(key) {
        return !!findPair(this.items, key);
      }
      set(key, value) {
        this.add(new Pair.Pair(key, value), true);
      }
      /**
       * @param ctx - Conversion context, originally set in Document#toJS()
       * @param {Class} Type - If set, forces the returned collection type
       * @returns Instance of Type, Map, or Object
       */
      toJSON(_, ctx, Type) {
        const map = Type ? new Type() : ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const item of this.items)
          addPairToJSMap.addPairToJSMap(ctx, map, item);
        return map;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        for (const item of this.items) {
          if (!identity.isPair(item))
            throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
        }
        if (!ctx.allNullValues && this.hasAllNullValues(false))
          ctx = Object.assign({}, ctx, { allNullValues: true });
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "",
          flowChars: { start: "{", end: "}" },
          itemIndent: ctx.indent || "",
          onChompKeep,
          onComment
        });
      }
    };
    exports2.YAMLMap = YAMLMap;
    exports2.findPair = findPair;
  }
});

// ../../node_modules/yaml/dist/schema/common/map.js
var require_map = __commonJS({
  "../../node_modules/yaml/dist/schema/common/map.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var YAMLMap = require_YAMLMap();
    var map = {
      collection: "map",
      default: true,
      nodeClass: YAMLMap.YAMLMap,
      tag: "tag:yaml.org,2002:map",
      resolve(map2, onError) {
        if (!identity.isMap(map2))
          onError("Expected a mapping for this tag");
        return map2;
      },
      createNode: (schema, obj, ctx) => YAMLMap.YAMLMap.from(schema, obj, ctx)
    };
    exports2.map = map;
  }
});

// ../../node_modules/yaml/dist/nodes/YAMLSeq.js
var require_YAMLSeq = __commonJS({
  "../../node_modules/yaml/dist/nodes/YAMLSeq.js"(exports2) {
    "use strict";
    var createNode = require_createNode();
    var stringifyCollection = require_stringifyCollection();
    var Collection = require_Collection();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var toJS = require_toJS();
    var YAMLSeq = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:seq";
      }
      constructor(schema) {
        super(identity.SEQ, schema);
        this.items = [];
      }
      add(value) {
        this.items.push(value);
      }
      /**
       * Removes a value from the collection.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       *
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return false;
        const del = this.items.splice(idx, 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return void 0;
        const it = this.items[idx];
        return !keepScalar && identity.isScalar(it) ? it.value : it;
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       */
      has(key) {
        const idx = asItemIndex(key);
        return typeof idx === "number" && idx < this.items.length;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       *
       * If `key` does not contain a representation of an integer, this will throw.
       * It may be wrapped in a `Scalar`.
       */
      set(key, value) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          throw new Error(`Expected a valid index, not ${key}.`);
        const prev = this.items[idx];
        if (identity.isScalar(prev) && Scalar.isScalarValue(value))
          prev.value = value;
        else
          this.items[idx] = value;
      }
      toJSON(_, ctx) {
        const seq = [];
        if (ctx?.onCreate)
          ctx.onCreate(seq);
        let i = 0;
        for (const item of this.items)
          seq.push(toJS.toJS(item, String(i++), ctx));
        return seq;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "- ",
          flowChars: { start: "[", end: "]" },
          itemIndent: (ctx.indent || "") + "  ",
          onChompKeep,
          onComment
        });
      }
      static from(schema, obj, ctx) {
        const { replacer } = ctx;
        const seq = new this(schema);
        if (obj && Symbol.iterator in Object(obj)) {
          let i = 0;
          for (let it of obj) {
            if (typeof replacer === "function") {
              const key = obj instanceof Set ? it : String(i++);
              it = replacer.call(obj, key, it);
            }
            seq.items.push(createNode.createNode(it, void 0, ctx));
          }
        }
        return seq;
      }
    };
    function asItemIndex(key) {
      let idx = identity.isScalar(key) ? key.value : key;
      if (idx && typeof idx === "string")
        idx = Number(idx);
      return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
    }
    exports2.YAMLSeq = YAMLSeq;
  }
});

// ../../node_modules/yaml/dist/schema/common/seq.js
var require_seq = __commonJS({
  "../../node_modules/yaml/dist/schema/common/seq.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var YAMLSeq = require_YAMLSeq();
    var seq = {
      collection: "seq",
      default: true,
      nodeClass: YAMLSeq.YAMLSeq,
      tag: "tag:yaml.org,2002:seq",
      resolve(seq2, onError) {
        if (!identity.isSeq(seq2))
          onError("Expected a sequence for this tag");
        return seq2;
      },
      createNode: (schema, obj, ctx) => YAMLSeq.YAMLSeq.from(schema, obj, ctx)
    };
    exports2.seq = seq;
  }
});

// ../../node_modules/yaml/dist/schema/common/string.js
var require_string = __commonJS({
  "../../node_modules/yaml/dist/schema/common/string.js"(exports2) {
    "use strict";
    var stringifyString = require_stringifyString();
    var string = {
      identify: (value) => typeof value === "string",
      default: true,
      tag: "tag:yaml.org,2002:str",
      resolve: (str) => str,
      stringify(item, ctx, onComment, onChompKeep) {
        ctx = Object.assign({ actualString: true }, ctx);
        return stringifyString.stringifyString(item, ctx, onComment, onChompKeep);
      }
    };
    exports2.string = string;
  }
});

// ../../node_modules/yaml/dist/schema/common/null.js
var require_null = __commonJS({
  "../../node_modules/yaml/dist/schema/common/null.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var nullTag = {
      identify: (value) => value == null,
      createNode: () => new Scalar.Scalar(null),
      default: true,
      tag: "tag:yaml.org,2002:null",
      test: /^(?:~|[Nn]ull|NULL)?$/,
      resolve: () => new Scalar.Scalar(null),
      stringify: ({ source }, ctx) => typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr
    };
    exports2.nullTag = nullTag;
  }
});

// ../../node_modules/yaml/dist/schema/core/bool.js
var require_bool = __commonJS({
  "../../node_modules/yaml/dist/schema/core/bool.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var boolTag = {
      identify: (value) => typeof value === "boolean",
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
      resolve: (str) => new Scalar.Scalar(str[0] === "t" || str[0] === "T"),
      stringify({ source, value }, ctx) {
        if (source && boolTag.test.test(source)) {
          const sv = source[0] === "t" || source[0] === "T";
          if (value === sv)
            return source;
        }
        return value ? ctx.options.trueStr : ctx.options.falseStr;
      }
    };
    exports2.boolTag = boolTag;
  }
});

// ../../node_modules/yaml/dist/stringify/stringifyNumber.js
var require_stringifyNumber = __commonJS({
  "../../node_modules/yaml/dist/stringify/stringifyNumber.js"(exports2) {
    "use strict";
    function stringifyNumber({ format, minFractionDigits, tag, value }) {
      if (typeof value === "bigint")
        return String(value);
      const num9 = typeof value === "number" ? value : Number(value);
      if (!isFinite(num9))
        return isNaN(num9) ? ".nan" : num9 < 0 ? "-.inf" : ".inf";
      let n = Object.is(value, -0) ? "-0" : JSON.stringify(value);
      if (!format && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^-?\d/.test(n) && !n.includes("e")) {
        let i = n.indexOf(".");
        if (i < 0) {
          i = n.length;
          n += ".";
        }
        let d = minFractionDigits - (n.length - i - 1);
        while (d-- > 0)
          n += "0";
      }
      return n;
    }
    exports2.stringifyNumber = stringifyNumber;
  }
});

// ../../node_modules/yaml/dist/schema/core/float.js
var require_float = __commonJS({
  "../../node_modules/yaml/dist/schema/core/float.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
      resolve: (str) => parseFloat(str),
      stringify(node) {
        const num9 = Number(node.value);
        return isFinite(num9) ? num9.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
      resolve(str) {
        const node = new Scalar.Scalar(parseFloat(str));
        const dot = str.indexOf(".");
        if (dot !== -1 && str[str.length - 1] === "0")
          node.minFractionDigits = str.length - dot - 1;
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports2.float = float;
    exports2.floatExp = floatExp;
    exports2.floatNaN = floatNaN;
  }
});

// ../../node_modules/yaml/dist/schema/core/int.js
var require_int = __commonJS({
  "../../node_modules/yaml/dist/schema/core/int.js"(exports2) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    var intResolve = (str, offset, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str.substring(offset), radix);
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value) && value >= 0)
        return prefix + value.toString(radix);
      return stringifyNumber.stringifyNumber(node);
    }
    var intOct = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^0o[0-7]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 8, opt),
      stringify: (node) => intStringify(node, 8, "0o")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^0x[0-9a-fA-F]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports2.int = int;
    exports2.intHex = intHex;
    exports2.intOct = intOct;
  }
});

// ../../node_modules/yaml/dist/schema/core/schema.js
var require_schema = __commonJS({
  "../../node_modules/yaml/dist/schema/core/schema.js"(exports2) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var bool = require_bool();
    var float = require_float();
    var int = require_int();
    var schema = [
      map.map,
      seq.seq,
      string.string,
      _null.nullTag,
      bool.boolTag,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float
    ];
    exports2.schema = schema;
  }
});

// ../../node_modules/yaml/dist/schema/json/schema.js
var require_schema2 = __commonJS({
  "../../node_modules/yaml/dist/schema/json/schema.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var map = require_map();
    var seq = require_seq();
    function intIdentify(value) {
      return typeof value === "bigint" || Number.isInteger(value);
    }
    var stringifyJSON = ({ value }) => JSON.stringify(value);
    var jsonScalars = [
      {
        identify: (value) => typeof value === "string",
        default: true,
        tag: "tag:yaml.org,2002:str",
        resolve: (str) => str,
        stringify: stringifyJSON
      },
      {
        identify: (value) => value == null,
        createNode: () => new Scalar.Scalar(null),
        default: true,
        tag: "tag:yaml.org,2002:null",
        test: /^null$/,
        resolve: () => null,
        stringify: stringifyJSON
      },
      {
        identify: (value) => typeof value === "boolean",
        default: true,
        tag: "tag:yaml.org,2002:bool",
        test: /^true$|^false$/,
        resolve: (str) => str === "true",
        stringify: stringifyJSON
      },
      {
        identify: intIdentify,
        default: true,
        tag: "tag:yaml.org,2002:int",
        test: /^-?(?:0|[1-9][0-9]*)$/,
        resolve: (str, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str, 10),
        stringify: ({ value }) => intIdentify(value) ? value.toString() : JSON.stringify(value)
      },
      {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
        resolve: (str) => parseFloat(str),
        stringify: stringifyJSON
      }
    ];
    var jsonError = {
      default: true,
      tag: "",
      test: /^/,
      resolve(str, onError) {
        onError(`Unresolved plain scalar ${JSON.stringify(str)}`);
        return str;
      }
    };
    var schema = [map.map, seq.seq].concat(jsonScalars, jsonError);
    exports2.schema = schema;
  }
});

// ../../node_modules/yaml/dist/schema/yaml-1.1/binary.js
var require_binary = __commonJS({
  "../../node_modules/yaml/dist/schema/yaml-1.1/binary.js"(exports2) {
    "use strict";
    var node_buffer = require("buffer");
    var Scalar = require_Scalar();
    var stringifyString = require_stringifyString();
    var binary = {
      identify: (value) => value instanceof Uint8Array,
      // Buffer inherits from Uint8Array
      default: false,
      tag: "tag:yaml.org,2002:binary",
      /**
       * Returns a Buffer in node and an Uint8Array in browsers
       *
       * To use the resulting buffer as an image, you'll want to do something like:
       *
       *   const blob = new Blob([buffer], { type: 'image/jpeg' })
       *   document.querySelector('#photo').src = URL.createObjectURL(blob)
       */
      resolve(src, onError) {
        if (typeof node_buffer.Buffer === "function") {
          return node_buffer.Buffer.from(src, "base64");
        } else if (typeof atob === "function") {
          const str = atob(src.replace(/[\n\r]/g, ""));
          const buffer = new Uint8Array(str.length);
          for (let i = 0; i < str.length; ++i)
            buffer[i] = str.charCodeAt(i);
          return buffer;
        } else {
          onError("This environment does not support reading binary tags; either Buffer or atob is required");
          return src;
        }
      },
      stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
        if (!value)
          return "";
        const buf = value;
        let str;
        if (typeof node_buffer.Buffer === "function") {
          str = buf instanceof node_buffer.Buffer ? buf.toString("base64") : node_buffer.Buffer.from(buf.buffer).toString("base64");
        } else if (typeof btoa === "function") {
          let s = "";
          for (let i = 0; i < buf.length; ++i)
            s += String.fromCharCode(buf[i]);
          str = btoa(s);
        } else {
          throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
        }
        type ?? (type = Scalar.Scalar.BLOCK_LITERAL);
        if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
          const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
          const n = Math.ceil(str.length / lineWidth);
          const lines = new Array(n);
          for (let i = 0, o = 0; i < n; ++i, o += lineWidth) {
            lines[i] = str.substr(o, lineWidth);
          }
          str = lines.join(type === Scalar.Scalar.BLOCK_LITERAL ? "\n" : " ");
        }
        return stringifyString.stringifyString({ comment, type, value: str }, ctx, onComment, onChompKeep);
      }
    };
    exports2.binary = binary;
  }
});

// ../../node_modules/yaml/dist/schema/yaml-1.1/pairs.js
var require_pairs = __commonJS({
  "../../node_modules/yaml/dist/schema/yaml-1.1/pairs.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLSeq = require_YAMLSeq();
    function resolvePairs(seq, onError) {
      if (identity.isSeq(seq)) {
        for (let i = 0; i < seq.items.length; ++i) {
          let item = seq.items[i];
          if (identity.isPair(item))
            continue;
          else if (identity.isMap(item)) {
            if (item.items.length > 1)
              onError("Each pair must have its own sequence indicator");
            const pair = item.items[0] || new Pair.Pair(new Scalar.Scalar(null));
            if (item.commentBefore)
              pair.key.commentBefore = pair.key.commentBefore ? `${item.commentBefore}
${pair.key.commentBefore}` : item.commentBefore;
            if (item.comment) {
              const cn = pair.value ?? pair.key;
              cn.comment = cn.comment ? `${item.comment}
${cn.comment}` : item.comment;
            }
            item = pair;
          }
          seq.items[i] = identity.isPair(item) ? item : new Pair.Pair(item);
        }
      } else
        onError("Expected a sequence for this tag");
      return seq;
    }
    function createPairs(schema, iterable, ctx) {
      const { replacer } = ctx;
      const pairs2 = new YAMLSeq.YAMLSeq(schema);
      pairs2.tag = "tag:yaml.org,2002:pairs";
      let i = 0;
      if (iterable && Symbol.iterator in Object(iterable))
        for (let it of iterable) {
          if (typeof replacer === "function")
            it = replacer.call(iterable, String(i++), it);
          let key, value;
          if (Array.isArray(it)) {
            if (it.length === 2) {
              key = it[0];
              value = it[1];
            } else
              throw new TypeError(`Expected [key, value] tuple: ${it}`);
          } else if (it && it instanceof Object) {
            const keys = Object.keys(it);
            if (keys.length === 1) {
              key = keys[0];
              value = it[key];
            } else {
              throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
            }
          } else {
            key = it;
          }
          pairs2.items.push(Pair.createPair(key, value, ctx));
        }
      return pairs2;
    }
    var pairs = {
      collection: "seq",
      default: false,
      tag: "tag:yaml.org,2002:pairs",
      resolve: resolvePairs,
      createNode: createPairs
    };
    exports2.createPairs = createPairs;
    exports2.pairs = pairs;
    exports2.resolvePairs = resolvePairs;
  }
});

// ../../node_modules/yaml/dist/schema/yaml-1.1/omap.js
var require_omap = __commonJS({
  "../../node_modules/yaml/dist/schema/yaml-1.1/omap.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var toJS = require_toJS();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var pairs = require_pairs();
    var YAMLOMap = class _YAMLOMap extends YAMLSeq.YAMLSeq {
      constructor() {
        super();
        this.add = YAMLMap.YAMLMap.prototype.add.bind(this);
        this.delete = YAMLMap.YAMLMap.prototype.delete.bind(this);
        this.get = YAMLMap.YAMLMap.prototype.get.bind(this);
        this.has = YAMLMap.YAMLMap.prototype.has.bind(this);
        this.set = YAMLMap.YAMLMap.prototype.set.bind(this);
        this.tag = _YAMLOMap.tag;
      }
      /**
       * If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
       * but TypeScript won't allow widening the signature of a child method.
       */
      toJSON(_, ctx) {
        if (!ctx)
          return super.toJSON(_);
        const map = /* @__PURE__ */ new Map();
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const pair of this.items) {
          let key, value;
          if (identity.isPair(pair)) {
            key = toJS.toJS(pair.key, "", ctx);
            value = toJS.toJS(pair.value, key, ctx);
          } else {
            key = toJS.toJS(pair, "", ctx);
          }
          if (map.has(key))
            throw new Error("Ordered maps must not include duplicate keys");
          map.set(key, value);
        }
        return map;
      }
      static from(schema, iterable, ctx) {
        const pairs$1 = pairs.createPairs(schema, iterable, ctx);
        const omap2 = new this();
        omap2.items = pairs$1.items;
        return omap2;
      }
    };
    YAMLOMap.tag = "tag:yaml.org,2002:omap";
    var omap = {
      collection: "seq",
      identify: (value) => value instanceof Map,
      nodeClass: YAMLOMap,
      default: false,
      tag: "tag:yaml.org,2002:omap",
      resolve(seq, onError) {
        const pairs$1 = pairs.resolvePairs(seq, onError);
        const seenKeys = [];
        for (const { key } of pairs$1.items) {
          if (identity.isScalar(key)) {
            if (seenKeys.includes(key.value)) {
              onError(`Ordered maps must not include duplicate keys: ${key.value}`);
            } else {
              seenKeys.push(key.value);
            }
          }
        }
        return Object.assign(new YAMLOMap(), pairs$1);
      },
      createNode: (schema, iterable, ctx) => YAMLOMap.from(schema, iterable, ctx)
    };
    exports2.YAMLOMap = YAMLOMap;
    exports2.omap = omap;
  }
});

// ../../node_modules/yaml/dist/schema/yaml-1.1/bool.js
var require_bool2 = __commonJS({
  "../../node_modules/yaml/dist/schema/yaml-1.1/bool.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    function boolStringify({ value, source }, ctx) {
      const boolObj = value ? trueTag : falseTag;
      if (source && boolObj.test.test(source))
        return source;
      return value ? ctx.options.trueStr : ctx.options.falseStr;
    }
    var trueTag = {
      identify: (value) => value === true,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
      resolve: () => new Scalar.Scalar(true),
      stringify: boolStringify
    };
    var falseTag = {
      identify: (value) => value === false,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
      resolve: () => new Scalar.Scalar(false),
      stringify: boolStringify
    };
    exports2.falseTag = falseTag;
    exports2.trueTag = trueTag;
  }
});

// ../../node_modules/yaml/dist/schema/yaml-1.1/float.js
var require_float2 = __commonJS({
  "../../node_modules/yaml/dist/schema/yaml-1.1/float.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
      resolve: (str) => parseFloat(str.replace(/_/g, "")),
      stringify(node) {
        const num9 = Number(node.value);
        return isFinite(num9) ? num9.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
      resolve(str) {
        const node = new Scalar.Scalar(parseFloat(str.replace(/_/g, "")));
        const dot = str.indexOf(".");
        if (dot !== -1) {
          const f = str.substring(dot + 1).replace(/_/g, "");
          if (f[f.length - 1] === "0")
            node.minFractionDigits = f.length;
        }
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports2.float = float;
    exports2.floatExp = floatExp;
    exports2.floatNaN = floatNaN;
  }
});

// ../../node_modules/yaml/dist/schema/yaml-1.1/int.js
var require_int2 = __commonJS({
  "../../node_modules/yaml/dist/schema/yaml-1.1/int.js"(exports2) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    function intResolve(str, offset, radix, { intAsBigInt }) {
      const sign = str[0];
      if (sign === "-" || sign === "+")
        offset += 1;
      str = str.substring(offset).replace(/_/g, "");
      if (intAsBigInt) {
        switch (radix) {
          case 2:
            str = `0b${str}`;
            break;
          case 8:
            str = `0o${str}`;
            break;
          case 16:
            str = `0x${str}`;
            break;
        }
        const n2 = BigInt(str);
        return sign === "-" ? BigInt(-1) * n2 : n2;
      }
      const n = parseInt(str, radix);
      return sign === "-" ? -1 * n : n;
    }
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value)) {
        const str = value.toString(radix);
        return value < 0 ? "-" + prefix + str.substr(1) : prefix + str;
      }
      return stringifyNumber.stringifyNumber(node);
    }
    var intBin = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "BIN",
      test: /^[-+]?0b[0-1_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 2, opt),
      stringify: (node) => intStringify(node, 2, "0b")
    };
    var intOct = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^[-+]?0[0-7_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 1, 8, opt),
      stringify: (node) => intStringify(node, 8, "0")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9][0-9_]*$/,
      resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^[-+]?0x[0-9a-fA-F_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports2.int = int;
    exports2.intBin = intBin;
    exports2.intHex = intHex;
    exports2.intOct = intOct;
  }
});

// ../../node_modules/yaml/dist/schema/yaml-1.1/set.js
var require_set = __commonJS({
  "../../node_modules/yaml/dist/schema/yaml-1.1/set.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSet = class _YAMLSet extends YAMLMap.YAMLMap {
      constructor(schema) {
        super(schema);
        this.tag = _YAMLSet.tag;
      }
      add(key) {
        let pair;
        if (identity.isPair(key))
          pair = key;
        else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null)
          pair = new Pair.Pair(key.key, null);
        else
          pair = new Pair.Pair(key, null);
        const prev = YAMLMap.findPair(this.items, pair.key);
        if (!prev)
          this.items.push(pair);
      }
      /**
       * If `keepPair` is `true`, returns the Pair matching `key`.
       * Otherwise, returns the value of that Pair's key.
       */
      get(key, keepPair) {
        const pair = YAMLMap.findPair(this.items, key);
        return !keepPair && identity.isPair(pair) ? identity.isScalar(pair.key) ? pair.key.value : pair.key : pair;
      }
      set(key, value) {
        if (typeof value !== "boolean")
          throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
        const prev = YAMLMap.findPair(this.items, key);
        if (prev && !value) {
          this.items.splice(this.items.indexOf(prev), 1);
        } else if (!prev && value) {
          this.items.push(new Pair.Pair(key));
        }
      }
      toJSON(_, ctx) {
        return super.toJSON(_, ctx, Set);
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        if (this.hasAllNullValues(true))
          return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
        else
          throw new Error("Set items must all have null values");
      }
      static from(schema, iterable, ctx) {
        const { replacer } = ctx;
        const set2 = new this(schema);
        if (iterable && Symbol.iterator in Object(iterable))
          for (let value of iterable) {
            if (typeof replacer === "function")
              value = replacer.call(iterable, value, value);
            set2.items.push(Pair.createPair(value, null, ctx));
          }
        return set2;
      }
    };
    YAMLSet.tag = "tag:yaml.org,2002:set";
    var set = {
      collection: "map",
      identify: (value) => value instanceof Set,
      nodeClass: YAMLSet,
      default: false,
      tag: "tag:yaml.org,2002:set",
      createNode: (schema, iterable, ctx) => YAMLSet.from(schema, iterable, ctx),
      resolve(map, onError) {
        if (identity.isMap(map)) {
          if (map.hasAllNullValues(true))
            return Object.assign(new YAMLSet(), map);
          else
            onError("Set items must all have null values");
        } else
          onError("Expected a mapping for this tag");
        return map;
      }
    };
    exports2.YAMLSet = YAMLSet;
    exports2.set = set;
  }
});

// ../../node_modules/yaml/dist/schema/yaml-1.1/timestamp.js
var require_timestamp = __commonJS({
  "../../node_modules/yaml/dist/schema/yaml-1.1/timestamp.js"(exports2) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    function parseSexagesimal(str, asBigInt) {
      const sign = str[0];
      const parts = sign === "-" || sign === "+" ? str.substring(1) : str;
      const num9 = (n) => asBigInt ? BigInt(n) : Number(n);
      const res = parts.replace(/_/g, "").split(":").reduce((res2, p) => res2 * num9(60) + num9(p), num9(0));
      return sign === "-" ? num9(-1) * res : res;
    }
    function stringifySexagesimal(node) {
      let { value } = node;
      let num9 = (n) => n;
      if (typeof value === "bigint")
        num9 = (n) => BigInt(n);
      else if (isNaN(value) || !isFinite(value))
        return stringifyNumber.stringifyNumber(node);
      let sign = "";
      if (value < 0) {
        sign = "-";
        value *= num9(-1);
      }
      const _60 = num9(60);
      const parts = [value % _60];
      if (value < 60) {
        parts.unshift(0);
      } else {
        value = (value - parts[0]) / _60;
        parts.unshift(value % _60);
        if (value >= 60) {
          value = (value - parts[0]) / _60;
          parts.unshift(value);
        }
      }
      return sign + parts.map((n) => String(n).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
    }
    var intTime = {
      identify: (value) => typeof value === "bigint" || Number.isInteger(value),
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
      resolve: (str, _onError, { intAsBigInt }) => parseSexagesimal(str, intAsBigInt),
      stringify: stringifySexagesimal
    };
    var floatTime = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
      resolve: (str) => parseSexagesimal(str, false),
      stringify: stringifySexagesimal
    };
    var timestamp = {
      identify: (value) => value instanceof Date,
      default: true,
      tag: "tag:yaml.org,2002:timestamp",
      // If the time zone is omitted, the timestamp is assumed to be specified in UTC. The time part
      // may be omitted altogether, resulting in a date format. In such a case, the time part is
      // assumed to be 00:00:00Z (start of day, UTC).
      test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?$"),
      resolve(str) {
        const match = str.match(timestamp.test);
        if (!match)
          throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
        const [, year, month, day, hour, minute, second] = match.map(Number);
        const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
        let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
        const tz = match[8];
        if (tz && tz !== "Z") {
          let d = parseSexagesimal(tz, false);
          if (Math.abs(d) < 30)
            d *= 60;
          date -= 6e4 * d;
        }
        return new Date(date);
      },
      stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
    };
    exports2.floatTime = floatTime;
    exports2.intTime = intTime;
    exports2.timestamp = timestamp;
  }
});

// ../../node_modules/yaml/dist/schema/yaml-1.1/schema.js
var require_schema3 = __commonJS({
  "../../node_modules/yaml/dist/schema/yaml-1.1/schema.js"(exports2) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var binary = require_binary();
    var bool = require_bool2();
    var float = require_float2();
    var int = require_int2();
    var merge = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var set = require_set();
    var timestamp = require_timestamp();
    var schema = [
      map.map,
      seq.seq,
      string.string,
      _null.nullTag,
      bool.trueTag,
      bool.falseTag,
      int.intBin,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float,
      binary.binary,
      merge.merge,
      omap.omap,
      pairs.pairs,
      set.set,
      timestamp.intTime,
      timestamp.floatTime,
      timestamp.timestamp
    ];
    exports2.schema = schema;
  }
});

// ../../node_modules/yaml/dist/schema/tags.js
var require_tags = __commonJS({
  "../../node_modules/yaml/dist/schema/tags.js"(exports2) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var bool = require_bool();
    var float = require_float();
    var int = require_int();
    var schema = require_schema();
    var schema$1 = require_schema2();
    var binary = require_binary();
    var merge = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var schema$2 = require_schema3();
    var set = require_set();
    var timestamp = require_timestamp();
    var schemas = /* @__PURE__ */ new Map([
      ["core", schema.schema],
      ["failsafe", [map.map, seq.seq, string.string]],
      ["json", schema$1.schema],
      ["yaml11", schema$2.schema],
      ["yaml-1.1", schema$2.schema]
    ]);
    var tagsByName = {
      binary: binary.binary,
      bool: bool.boolTag,
      float: float.float,
      floatExp: float.floatExp,
      floatNaN: float.floatNaN,
      floatTime: timestamp.floatTime,
      int: int.int,
      intHex: int.intHex,
      intOct: int.intOct,
      intTime: timestamp.intTime,
      map: map.map,
      merge: merge.merge,
      null: _null.nullTag,
      omap: omap.omap,
      pairs: pairs.pairs,
      seq: seq.seq,
      set: set.set,
      timestamp: timestamp.timestamp
    };
    var coreKnownTags = {
      "tag:yaml.org,2002:binary": binary.binary,
      "tag:yaml.org,2002:merge": merge.merge,
      "tag:yaml.org,2002:omap": omap.omap,
      "tag:yaml.org,2002:pairs": pairs.pairs,
      "tag:yaml.org,2002:set": set.set,
      "tag:yaml.org,2002:timestamp": timestamp.timestamp
    };
    function getTags(customTags, schemaName, addMergeTag) {
      const schemaTags = schemas.get(schemaName);
      if (schemaTags && !customTags) {
        return addMergeTag && !schemaTags.includes(merge.merge) ? schemaTags.concat(merge.merge) : schemaTags.slice();
      }
      let tags = schemaTags;
      if (!tags) {
        if (Array.isArray(customTags))
          tags = [];
        else {
          const keys = Array.from(schemas.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
        }
      }
      if (Array.isArray(customTags)) {
        for (const tag of customTags)
          tags = tags.concat(tag);
      } else if (typeof customTags === "function") {
        tags = customTags(tags.slice());
      }
      if (addMergeTag)
        tags = tags.concat(merge.merge);
      return tags.reduce((tags2, tag) => {
        const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
        if (!tagObj) {
          const tagName = JSON.stringify(tag);
          const keys = Object.keys(tagsByName).map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
        }
        if (!tags2.includes(tagObj))
          tags2.push(tagObj);
        return tags2;
      }, []);
    }
    exports2.coreKnownTags = coreKnownTags;
    exports2.getTags = getTags;
  }
});

// ../../node_modules/yaml/dist/schema/Schema.js
var require_Schema = __commonJS({
  "../../node_modules/yaml/dist/schema/Schema.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var map = require_map();
    var seq = require_seq();
    var string = require_string();
    var tags = require_tags();
    var sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
    var Schema = class _Schema {
      constructor({ compat, customTags, merge, resolveKnownTags, schema, sortMapEntries, toStringDefaults }) {
        this.compat = Array.isArray(compat) ? tags.getTags(compat, "compat") : compat ? tags.getTags(null, compat) : null;
        this.name = typeof schema === "string" && schema || "core";
        this.knownTags = resolveKnownTags ? tags.coreKnownTags : {};
        this.tags = tags.getTags(customTags, this.name, merge);
        this.toStringOptions = toStringDefaults ?? null;
        Object.defineProperty(this, identity.MAP, { value: map.map });
        Object.defineProperty(this, identity.SCALAR, { value: string.string });
        Object.defineProperty(this, identity.SEQ, { value: seq.seq });
        this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
      }
      clone() {
        const copy = Object.create(_Schema.prototype, Object.getOwnPropertyDescriptors(this));
        copy.tags = this.tags.slice();
        return copy;
      }
    };
    exports2.Schema = Schema;
  }
});

// ../../node_modules/yaml/dist/stringify/stringifyDocument.js
var require_stringifyDocument = __commonJS({
  "../../node_modules/yaml/dist/stringify/stringifyDocument.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var stringify2 = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyDocument(doc, options) {
      const lines = [];
      let hasDirectives = options.directives === true;
      if (options.directives !== false && doc.directives) {
        const dir = doc.directives.toString(doc);
        if (dir) {
          lines.push(dir);
          hasDirectives = true;
        } else if (doc.directives.docStart)
          hasDirectives = true;
      }
      if (hasDirectives)
        lines.push("---");
      const ctx = stringify2.createStringifyContext(doc, options);
      const { commentString } = ctx.options;
      if (doc.commentBefore) {
        if (lines.length !== 1)
          lines.unshift("");
        const cs = commentString(doc.commentBefore);
        lines.unshift(stringifyComment.indentComment(cs, ""));
      }
      let chompKeep = false;
      let contentComment = null;
      if (doc.contents) {
        if (identity.isNode(doc.contents)) {
          if (doc.contents.spaceBefore && hasDirectives)
            lines.push("");
          if (doc.contents.commentBefore) {
            const cs = commentString(doc.contents.commentBefore);
            lines.push(stringifyComment.indentComment(cs, ""));
          }
          ctx.forceBlockIndent = !!doc.comment;
          contentComment = doc.contents.comment;
        }
        const onChompKeep = contentComment ? void 0 : () => chompKeep = true;
        let body = stringify2.stringify(doc.contents, ctx, () => contentComment = null, onChompKeep);
        if (contentComment)
          body += stringifyComment.lineComment(body, "", commentString(contentComment));
        if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---") {
          lines[lines.length - 1] = `--- ${body}`;
        } else
          lines.push(body);
      } else {
        lines.push(stringify2.stringify(doc.contents, ctx));
      }
      if (doc.directives?.docEnd) {
        if (doc.comment) {
          const cs = commentString(doc.comment);
          if (cs.includes("\n")) {
            lines.push("...");
            lines.push(stringifyComment.indentComment(cs, ""));
          } else {
            lines.push(`... ${cs}`);
          }
        } else {
          lines.push("...");
        }
      } else {
        let dc = doc.comment;
        if (dc && chompKeep)
          dc = dc.replace(/^\n+/, "");
        if (dc) {
          if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "")
            lines.push("");
          lines.push(stringifyComment.indentComment(commentString(dc), ""));
        }
      }
      return lines.join("\n") + "\n";
    }
    exports2.stringifyDocument = stringifyDocument;
  }
});

// ../../node_modules/yaml/dist/doc/Document.js
var require_Document = __commonJS({
  "../../node_modules/yaml/dist/doc/Document.js"(exports2) {
    "use strict";
    var Alias = require_Alias();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var toJS = require_toJS();
    var Schema = require_Schema();
    var stringifyDocument = require_stringifyDocument();
    var anchors = require_anchors();
    var applyReviver = require_applyReviver();
    var createNode = require_createNode();
    var directives = require_directives();
    var Document = class _Document {
      constructor(value, replacer, options) {
        this.commentBefore = null;
        this.comment = null;
        this.errors = [];
        this.warnings = [];
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.DOC });
        let _replacer = null;
        if (typeof replacer === "function" || Array.isArray(replacer)) {
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const opt = Object.assign({
          intAsBigInt: false,
          keepSourceTokens: false,
          logLevel: "warn",
          prettyErrors: true,
          strict: true,
          stringKeys: false,
          uniqueKeys: true,
          version: "1.2"
        }, options);
        this.options = opt;
        let { version } = opt;
        if (options?._directives) {
          this.directives = options._directives.atDocument();
          if (this.directives.yaml.explicit)
            version = this.directives.yaml.version;
        } else
          this.directives = new directives.Directives({ version });
        this.setSchema(version, options);
        this.contents = value === void 0 ? null : this.createNode(value, _replacer, options);
      }
      /**
       * Create a deep copy of this Document and its contents.
       *
       * Custom Node values that inherit from `Object` still refer to their original instances.
       */
      clone() {
        const copy = Object.create(_Document.prototype, {
          [identity.NODE_TYPE]: { value: identity.DOC }
        });
        copy.commentBefore = this.commentBefore;
        copy.comment = this.comment;
        copy.errors = this.errors.slice();
        copy.warnings = this.warnings.slice();
        copy.options = Object.assign({}, this.options);
        if (this.directives)
          copy.directives = this.directives.clone();
        copy.schema = this.schema.clone();
        copy.contents = identity.isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** Adds a value to the document. */
      add(value) {
        if (assertCollection(this.contents))
          this.contents.add(value);
      }
      /** Adds a value to the document. */
      addIn(path, value) {
        if (assertCollection(this.contents))
          this.contents.addIn(path, value);
      }
      /**
       * Create a new `Alias` node, ensuring that the target `node` has the required anchor.
       *
       * If `node` already has an anchor, `name` is ignored.
       * Otherwise, the `node.anchor` value will be set to `name`,
       * or if an anchor with that name is already present in the document,
       * `name` will be used as a prefix for a new unique anchor.
       * If `name` is undefined, the generated anchor will use 'a' as a prefix.
       */
      createAlias(node, name) {
        if (!node.anchor) {
          const prev = anchors.anchorNames(this);
          node.anchor = // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          !name || prev.has(name) ? anchors.findNewAnchor(name || "a", prev) : name;
        }
        return new Alias.Alias(node.anchor);
      }
      createNode(value, replacer, options) {
        let _replacer = void 0;
        if (typeof replacer === "function") {
          value = replacer.call({ "": value }, "", value);
          _replacer = replacer;
        } else if (Array.isArray(replacer)) {
          const keyToStr = (v) => typeof v === "number" || v instanceof String || v instanceof Number;
          const asStr = replacer.filter(keyToStr).map(String);
          if (asStr.length > 0)
            replacer = replacer.concat(asStr);
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options ?? {};
        const { onAnchor, setAnchors, sourceObjects } = anchors.createNodeAnchors(
          this,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          anchorPrefix || "a"
        );
        const ctx = {
          aliasDuplicateObjects: aliasDuplicateObjects ?? true,
          keepUndefined: keepUndefined ?? false,
          onAnchor,
          onTagObj,
          replacer: _replacer,
          schema: this.schema,
          sourceObjects
        };
        const node = createNode.createNode(value, tag, ctx);
        if (flow && identity.isCollection(node))
          node.flow = true;
        setAnchors();
        return node;
      }
      /**
       * Convert a key and a value into a `Pair` using the current schema,
       * recursively wrapping all values as `Scalar` or `Collection` nodes.
       */
      createPair(key, value, options = {}) {
        const k = this.createNode(key, null, options);
        const v = this.createNode(value, null, options);
        return new Pair.Pair(k, v);
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        return assertCollection(this.contents) ? this.contents.delete(key) : false;
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path) {
        if (Collection.isEmptyPath(path)) {
          if (this.contents == null)
            return false;
          this.contents = null;
          return true;
        }
        return assertCollection(this.contents) ? this.contents.deleteIn(path) : false;
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      get(key, keepScalar) {
        return identity.isCollection(this.contents) ? this.contents.get(key, keepScalar) : void 0;
      }
      /**
       * Returns item at `path`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path, keepScalar) {
        if (Collection.isEmptyPath(path))
          return !keepScalar && identity.isScalar(this.contents) ? this.contents.value : this.contents;
        return identity.isCollection(this.contents) ? this.contents.getIn(path, keepScalar) : void 0;
      }
      /**
       * Checks if the document includes a value with the key `key`.
       */
      has(key) {
        return identity.isCollection(this.contents) ? this.contents.has(key) : false;
      }
      /**
       * Checks if the document includes a value at `path`.
       */
      hasIn(path) {
        if (Collection.isEmptyPath(path))
          return this.contents !== void 0;
        return identity.isCollection(this.contents) ? this.contents.hasIn(path) : false;
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      set(key, value) {
        if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, [key], value);
        } else if (assertCollection(this.contents)) {
          this.contents.set(key, value);
        }
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path, value) {
        if (Collection.isEmptyPath(path)) {
          this.contents = value;
        } else if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, Array.from(path), value);
        } else if (assertCollection(this.contents)) {
          this.contents.setIn(path, value);
        }
      }
      /**
       * Change the YAML version and schema used by the document.
       * A `null` version disables support for directives, explicit tags, anchors, and aliases.
       * It also requires the `schema` option to be given as a `Schema` instance value.
       *
       * Overrides all previously set schema options.
       */
      setSchema(version, options = {}) {
        if (typeof version === "number")
          version = String(version);
        let opt;
        switch (version) {
          case "1.1":
            if (this.directives)
              this.directives.yaml.version = "1.1";
            else
              this.directives = new directives.Directives({ version: "1.1" });
            opt = { resolveKnownTags: false, schema: "yaml-1.1" };
            break;
          case "1.2":
          case "next":
            if (this.directives)
              this.directives.yaml.version = version;
            else
              this.directives = new directives.Directives({ version });
            opt = { resolveKnownTags: true, schema: "core" };
            break;
          case null:
            if (this.directives)
              delete this.directives;
            opt = null;
            break;
          default: {
            const sv = JSON.stringify(version);
            throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
          }
        }
        if (options.schema instanceof Object)
          this.schema = options.schema;
        else if (opt)
          this.schema = new Schema.Schema(Object.assign(opt, options));
        else
          throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
      }
      // json & jsonArg are only used from toJSON()
      toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc: this,
          keep: !json,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this.contents, jsonArg ?? "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
      /**
       * A JSON representation of the document `contents`.
       *
       * @param jsonArg Used by `JSON.stringify` to indicate the array index or
       *   property name.
       */
      toJSON(jsonArg, onAnchor) {
        return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor });
      }
      /** A YAML representation of the document. */
      toString(options = {}) {
        if (this.errors.length > 0)
          throw new Error("Document with errors cannot be stringified");
        if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
          const s = JSON.stringify(options.indent);
          throw new Error(`"indent" option must be a positive integer, not ${s}`);
        }
        return stringifyDocument.stringifyDocument(this, options);
      }
    };
    function assertCollection(contents) {
      if (identity.isCollection(contents))
        return true;
      throw new Error("Expected a YAML collection as document contents");
    }
    exports2.Document = Document;
  }
});

// ../../node_modules/yaml/dist/errors.js
var require_errors = __commonJS({
  "../../node_modules/yaml/dist/errors.js"(exports2) {
    "use strict";
    var YAMLError = class extends Error {
      constructor(name, pos, code, message) {
        super();
        this.name = name;
        this.code = code;
        this.message = message;
        this.pos = pos;
      }
    };
    var YAMLParseError = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLParseError", pos, code, message);
      }
    };
    var YAMLWarning = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLWarning", pos, code, message);
      }
    };
    var prettifyError = (src, lc) => (error) => {
      if (error.pos[0] === -1)
        return;
      error.linePos = error.pos.map((pos) => lc.linePos(pos));
      const { line, col } = error.linePos[0];
      error.message += ` at line ${line}, column ${col}`;
      let ci = col - 1;
      let lineStr = src.substring(lc.lineStarts[line - 1], lc.lineStarts[line]).replace(/[\n\r]+$/, "");
      if (ci >= 60 && lineStr.length > 80) {
        const trimStart = Math.min(ci - 39, lineStr.length - 79);
        lineStr = "\u2026" + lineStr.substring(trimStart);
        ci -= trimStart - 1;
      }
      if (lineStr.length > 80)
        lineStr = lineStr.substring(0, 79) + "\u2026";
      if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
        let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
        if (prev.length > 80)
          prev = prev.substring(0, 79) + "\u2026\n";
        lineStr = prev + lineStr;
      }
      if (/[^ ]/.test(lineStr)) {
        let count = 1;
        const end = error.linePos[1];
        if (end?.line === line && end.col > col) {
          count = Math.max(1, Math.min(end.col - col, 80 - ci));
        }
        const pointer = " ".repeat(ci) + "^".repeat(count);
        error.message += `:

${lineStr}
${pointer}
`;
      }
    };
    exports2.YAMLError = YAMLError;
    exports2.YAMLParseError = YAMLParseError;
    exports2.YAMLWarning = YAMLWarning;
    exports2.prettifyError = prettifyError;
  }
});

// ../../node_modules/yaml/dist/compose/resolve-props.js
var require_resolve_props = __commonJS({
  "../../node_modules/yaml/dist/compose/resolve-props.js"(exports2) {
    "use strict";
    function resolveProps(tokens, { flow, indicator, next, offset, onError, parentIndent, startOnNewline }) {
      let spaceBefore = false;
      let atNewline = startOnNewline;
      let hasSpace = startOnNewline;
      let comment = "";
      let commentSep = "";
      let hasNewline = false;
      let reqSpace = false;
      let tab = null;
      let anchor = null;
      let tag = null;
      let newlineAfterProp = null;
      let comma = null;
      let found = null;
      let start = null;
      for (const token of tokens) {
        if (reqSpace) {
          if (token.type !== "space" && token.type !== "newline" && token.type !== "comma")
            onError(token.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
          reqSpace = false;
        }
        if (tab) {
          if (atNewline && token.type !== "comment" && token.type !== "newline") {
            onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
          }
          tab = null;
        }
        switch (token.type) {
          case "space":
            if (!flow && (indicator !== "doc-start" || next?.type !== "flow-collection") && token.source.includes("	")) {
              tab = token;
            }
            hasSpace = true;
            break;
          case "comment": {
            if (!hasSpace)
              onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
            const cb = token.source.substring(1) || " ";
            if (!comment)
              comment = cb;
            else
              comment += commentSep + cb;
            commentSep = "";
            atNewline = false;
            break;
          }
          case "newline":
            if (atNewline) {
              if (comment)
                comment += token.source;
              else if (!found || indicator !== "seq-item-ind")
                spaceBefore = true;
            } else
              commentSep += token.source;
            atNewline = true;
            hasNewline = true;
            if (anchor || tag)
              newlineAfterProp = token;
            hasSpace = true;
            break;
          case "anchor":
            if (anchor)
              onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
            if (token.source.endsWith(":"))
              onError(token.offset + token.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", true);
            anchor = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          case "tag": {
            if (tag)
              onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
            tag = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          }
          case indicator:
            if (anchor || tag)
              onError(token, "BAD_PROP_ORDER", `Anchors and tags must be after the ${token.source} indicator`);
            if (found)
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.source} in ${flow ?? "collection"}`);
            found = token;
            atNewline = indicator === "seq-item-ind" || indicator === "explicit-key-ind";
            hasSpace = false;
            break;
          case "comma":
            if (flow) {
              if (comma)
                onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow}`);
              comma = token;
              atNewline = false;
              hasSpace = false;
              break;
            }
          // else fallthrough
          default:
            onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
            atNewline = false;
            hasSpace = false;
        }
      }
      const last = tokens[tokens.length - 1];
      const end = last ? last.offset + last.source.length : offset;
      if (reqSpace && next && next.type !== "space" && next.type !== "newline" && next.type !== "comma" && (next.type !== "scalar" || next.source !== "")) {
        onError(next.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
      }
      if (tab && (atNewline && tab.indent <= parentIndent || next?.type === "block-map" || next?.type === "block-seq"))
        onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
      return {
        comma,
        found,
        spaceBefore,
        comment,
        hasNewline,
        anchor,
        tag,
        newlineAfterProp,
        end,
        start: start ?? end
      };
    }
    exports2.resolveProps = resolveProps;
  }
});

// ../../node_modules/yaml/dist/compose/util-contains-newline.js
var require_util_contains_newline = __commonJS({
  "../../node_modules/yaml/dist/compose/util-contains-newline.js"(exports2) {
    "use strict";
    function containsNewline(key) {
      if (!key)
        return null;
      switch (key.type) {
        case "alias":
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          if (key.source.includes("\n"))
            return true;
          if (key.end) {
            for (const st of key.end)
              if (st.type === "newline")
                return true;
          }
          return false;
        case "flow-collection":
          for (const it of key.items) {
            for (const st of it.start)
              if (st.type === "newline")
                return true;
            if (it.sep) {
              for (const st of it.sep)
                if (st.type === "newline")
                  return true;
            }
            if (containsNewline(it.key) || containsNewline(it.value))
              return true;
          }
          return false;
        default:
          return true;
      }
    }
    exports2.containsNewline = containsNewline;
  }
});

// ../../node_modules/yaml/dist/compose/util-flow-indent-check.js
var require_util_flow_indent_check = __commonJS({
  "../../node_modules/yaml/dist/compose/util-flow-indent-check.js"(exports2) {
    "use strict";
    var utilContainsNewline = require_util_contains_newline();
    function flowIndentCheck(indent, fc, onError) {
      if (fc?.type === "flow-collection") {
        const end = fc.end[0];
        if (end.indent === indent && (end.source === "]" || end.source === "}") && utilContainsNewline.containsNewline(fc)) {
          const msg = "Flow end indicator should be more indented than parent";
          onError(end, "BAD_INDENT", msg, true);
        }
      }
    }
    exports2.flowIndentCheck = flowIndentCheck;
  }
});

// ../../node_modules/yaml/dist/compose/util-map-includes.js
var require_util_map_includes = __commonJS({
  "../../node_modules/yaml/dist/compose/util-map-includes.js"(exports2) {
    "use strict";
    var identity = require_identity();
    function mapIncludes(ctx, items, search) {
      const { uniqueKeys } = ctx.options;
      if (uniqueKeys === false)
        return false;
      const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a, b) => a === b || identity.isScalar(a) && identity.isScalar(b) && a.value === b.value;
      return items.some((pair) => isEqual(pair.key, search));
    }
    exports2.mapIncludes = mapIncludes;
  }
});

// ../../node_modules/yaml/dist/compose/resolve-block-map.js
var require_resolve_block_map = __commonJS({
  "../../node_modules/yaml/dist/compose/resolve-block-map.js"(exports2) {
    "use strict";
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    var utilMapIncludes = require_util_map_includes();
    var startColMsg = "All mapping items must start at the same column";
    function resolveBlockMap({ composeNode, composeEmptyNode }, ctx, bm, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLMap.YAMLMap;
      const map = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      let offset = bm.offset;
      let commentEnd = null;
      for (const collItem of bm.items) {
        const { start, key, sep, value } = collItem;
        const keyProps = resolveProps.resolveProps(start, {
          indicator: "explicit-key-ind",
          next: key ?? sep?.[0],
          offset,
          onError,
          parentIndent: bm.indent,
          startOnNewline: true
        });
        const implicitKey = !keyProps.found;
        if (implicitKey) {
          if (key) {
            if (key.type === "block-seq")
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key");
            else if ("indent" in key && key.indent !== bm.indent)
              onError(offset, "BAD_INDENT", startColMsg);
          }
          if (!keyProps.anchor && !keyProps.tag && !sep) {
            commentEnd = keyProps.end;
            if (keyProps.comment) {
              if (map.comment)
                map.comment += "\n" + keyProps.comment;
              else
                map.comment = keyProps.comment;
            }
            continue;
          }
          if (keyProps.newlineAfterProp || utilContainsNewline.containsNewline(key)) {
            onError(key ?? start[start.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
          }
        } else if (keyProps.found?.indent !== bm.indent) {
          onError(offset, "BAD_INDENT", startColMsg);
        }
        ctx.atKey = true;
        const keyStart = keyProps.end;
        const keyNode = key ? composeNode(ctx, key, keyProps, onError) : composeEmptyNode(ctx, keyStart, start, null, keyProps, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bm.indent, key, onError);
        ctx.atKey = false;
        if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
          onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
        const valueProps = resolveProps.resolveProps(sep ?? [], {
          indicator: "map-value-ind",
          next: value,
          offset: keyNode.range[2],
          onError,
          parentIndent: bm.indent,
          startOnNewline: !key || key.type === "block-scalar"
        });
        offset = valueProps.end;
        if (valueProps.found) {
          if (implicitKey) {
            if (value?.type === "block-map" && !valueProps.hasNewline)
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings");
            if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024)
              onError(keyNode.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key");
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : composeEmptyNode(ctx, offset, sep, null, valueProps, onError);
          if (ctx.schema.compat)
            utilFlowIndentCheck.flowIndentCheck(bm.indent, value, onError);
          offset = valueNode.range[2];
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        } else {
          if (implicitKey)
            onError(keyNode.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values");
          if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        }
      }
      if (commentEnd && commentEnd < offset)
        onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
      map.range = [bm.offset, offset, commentEnd ?? offset];
      return map;
    }
    exports2.resolveBlockMap = resolveBlockMap;
  }
});

// ../../node_modules/yaml/dist/compose/resolve-block-seq.js
var require_resolve_block_seq = __commonJS({
  "../../node_modules/yaml/dist/compose/resolve-block-seq.js"(exports2) {
    "use strict";
    var YAMLSeq = require_YAMLSeq();
    var resolveProps = require_resolve_props();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    function resolveBlockSeq({ composeNode, composeEmptyNode }, ctx, bs, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLSeq.YAMLSeq;
      const seq = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = bs.offset;
      let commentEnd = null;
      for (const { start, value } of bs.items) {
        const props = resolveProps.resolveProps(start, {
          indicator: "seq-item-ind",
          next: value,
          offset,
          onError,
          parentIndent: bs.indent,
          startOnNewline: true
        });
        if (!props.found) {
          if (props.anchor || props.tag || value) {
            if (value?.type === "block-seq")
              onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
            else
              onError(offset, "MISSING_CHAR", "Sequence item without - indicator");
          } else {
            commentEnd = props.end;
            if (props.comment)
              seq.comment = props.comment;
            continue;
          }
        }
        const node = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start, null, props, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bs.indent, value, onError);
        offset = node.range[2];
        seq.items.push(node);
      }
      seq.range = [bs.offset, offset, commentEnd ?? offset];
      return seq;
    }
    exports2.resolveBlockSeq = resolveBlockSeq;
  }
});

// ../../node_modules/yaml/dist/compose/resolve-end.js
var require_resolve_end = __commonJS({
  "../../node_modules/yaml/dist/compose/resolve-end.js"(exports2) {
    "use strict";
    function resolveEnd(end, offset, reqSpace, onError) {
      let comment = "";
      if (end) {
        let hasSpace = false;
        let sep = "";
        for (const token of end) {
          const { source, type } = token;
          switch (type) {
            case "space":
              hasSpace = true;
              break;
            case "comment": {
              if (reqSpace && !hasSpace)
                onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
              const cb = source.substring(1) || " ";
              if (!comment)
                comment = cb;
              else
                comment += sep + cb;
              sep = "";
              break;
            }
            case "newline":
              if (comment)
                sep += source;
              hasSpace = true;
              break;
            default:
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type} at node end`);
          }
          offset += source.length;
        }
      }
      return { comment, offset };
    }
    exports2.resolveEnd = resolveEnd;
  }
});

// ../../node_modules/yaml/dist/compose/resolve-flow-collection.js
var require_resolve_flow_collection = __commonJS({
  "../../node_modules/yaml/dist/compose/resolve-flow-collection.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilMapIncludes = require_util_map_includes();
    var blockMsg = "Block collections are not allowed within flow collections";
    var isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
    function resolveFlowCollection({ composeNode, composeEmptyNode }, ctx, fc, onError, tag) {
      const isMap = fc.start.source === "{";
      const fcName = isMap ? "flow map" : "flow sequence";
      const NodeClass = tag?.nodeClass ?? (isMap ? YAMLMap.YAMLMap : YAMLSeq.YAMLSeq);
      const coll = new NodeClass(ctx.schema);
      coll.flow = true;
      const atRoot = ctx.atRoot;
      if (atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = fc.offset + fc.start.source.length;
      for (let i = 0; i < fc.items.length; ++i) {
        const collItem = fc.items[i];
        const { start, key, sep, value } = collItem;
        const props = resolveProps.resolveProps(start, {
          flow: fcName,
          indicator: "explicit-key-ind",
          next: key ?? sep?.[0],
          offset,
          onError,
          parentIndent: fc.indent,
          startOnNewline: false
        });
        if (!props.found) {
          if (!props.anchor && !props.tag && !sep && !value) {
            if (i === 0 && props.comma)
              onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
            else if (i < fc.items.length - 1)
              onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
            if (props.comment) {
              if (coll.comment)
                coll.comment += "\n" + props.comment;
              else
                coll.comment = props.comment;
            }
            offset = props.end;
            continue;
          }
          if (!isMap && ctx.options.strict && utilContainsNewline.containsNewline(key))
            onError(
              key,
              // checked by containsNewline()
              "MULTILINE_IMPLICIT_KEY",
              "Implicit keys of flow sequence pairs need to be on a single line"
            );
        }
        if (i === 0) {
          if (props.comma)
            onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
        } else {
          if (!props.comma)
            onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
          if (props.comment) {
            let prevItemComment = "";
            loop: for (const st of start) {
              switch (st.type) {
                case "comma":
                case "space":
                  break;
                case "comment":
                  prevItemComment = st.source.substring(1);
                  break loop;
                default:
                  break loop;
              }
            }
            if (prevItemComment) {
              let prev = coll.items[coll.items.length - 1];
              if (identity.isPair(prev))
                prev = prev.value ?? prev.key;
              if (prev.comment)
                prev.comment += "\n" + prevItemComment;
              else
                prev.comment = prevItemComment;
              props.comment = props.comment.substring(prevItemComment.length + 1);
            }
          }
        }
        if (!isMap && !sep && !props.found) {
          const valueNode = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, sep, null, props, onError);
          coll.items.push(valueNode);
          offset = valueNode.range[2];
          if (isBlock(value))
            onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
        } else {
          ctx.atKey = true;
          const keyStart = props.end;
          const keyNode = key ? composeNode(ctx, key, props, onError) : composeEmptyNode(ctx, keyStart, start, null, props, onError);
          if (isBlock(key))
            onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
          ctx.atKey = false;
          const valueProps = resolveProps.resolveProps(sep ?? [], {
            flow: fcName,
            indicator: "map-value-ind",
            next: value,
            offset: keyNode.range[2],
            onError,
            parentIndent: fc.indent,
            startOnNewline: false
          });
          if (valueProps.found) {
            if (!isMap && !props.found && ctx.options.strict) {
              if (sep)
                for (const st of sep) {
                  if (st === valueProps.found)
                    break;
                  if (st.type === "newline") {
                    onError(st, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
                    break;
                  }
                }
              if (props.start < valueProps.found.offset - 1024)
                onError(valueProps.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
            }
          } else if (value) {
            if ("source" in value && value.source?.[0] === ":")
              onError(value, "MISSING_CHAR", `Missing space after : in ${fcName}`);
            else
              onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : valueProps.found ? composeEmptyNode(ctx, valueProps.end, sep, null, valueProps, onError) : null;
          if (valueNode) {
            if (isBlock(value))
              onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
          } else if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          if (isMap) {
            const map = coll;
            if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
              onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
            map.items.push(pair);
          } else {
            const map = new YAMLMap.YAMLMap(ctx.schema);
            map.flow = true;
            map.items.push(pair);
            const endRange = (valueNode ?? keyNode).range;
            map.range = [keyNode.range[0], endRange[1], endRange[2]];
            coll.items.push(map);
          }
          offset = valueNode ? valueNode.range[2] : valueProps.end;
        }
      }
      const expectedEnd = isMap ? "}" : "]";
      const [ce, ...ee] = fc.end;
      let cePos = offset;
      if (ce?.source === expectedEnd)
        cePos = ce.offset + ce.source.length;
      else {
        const name = fcName[0].toUpperCase() + fcName.substring(1);
        const msg = atRoot ? `${name} must end with a ${expectedEnd}` : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
        onError(offset, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
        if (ce && ce.source.length !== 1)
          ee.unshift(ce);
      }
      if (ee.length > 0) {
        const end = resolveEnd.resolveEnd(ee, cePos, ctx.options.strict, onError);
        if (end.comment) {
          if (coll.comment)
            coll.comment += "\n" + end.comment;
          else
            coll.comment = end.comment;
        }
        coll.range = [fc.offset, cePos, end.offset];
      } else {
        coll.range = [fc.offset, cePos, cePos];
      }
      return coll;
    }
    exports2.resolveFlowCollection = resolveFlowCollection;
  }
});

// ../../node_modules/yaml/dist/compose/compose-collection.js
var require_compose_collection = __commonJS({
  "../../node_modules/yaml/dist/compose/compose-collection.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveBlockMap = require_resolve_block_map();
    var resolveBlockSeq = require_resolve_block_seq();
    var resolveFlowCollection = require_resolve_flow_collection();
    function resolveCollection(CN, ctx, token, onError, tagName, tag) {
      const coll = token.type === "block-map" ? resolveBlockMap.resolveBlockMap(CN, ctx, token, onError, tag) : token.type === "block-seq" ? resolveBlockSeq.resolveBlockSeq(CN, ctx, token, onError, tag) : resolveFlowCollection.resolveFlowCollection(CN, ctx, token, onError, tag);
      const Coll = coll.constructor;
      if (tagName === "!" || tagName === Coll.tagName) {
        coll.tag = Coll.tagName;
        return coll;
      }
      if (tagName)
        coll.tag = tagName;
      return coll;
    }
    function composeCollection(CN, ctx, token, props, onError) {
      const tagToken = props.tag;
      const tagName = !tagToken ? null : ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg));
      if (token.type === "block-seq") {
        const { anchor, newlineAfterProp: nl } = props;
        const lastProp = anchor && tagToken ? anchor.offset > tagToken.offset ? anchor : tagToken : anchor ?? tagToken;
        if (lastProp && (!nl || nl.offset < lastProp.offset)) {
          const message = "Missing newline after block sequence props";
          onError(lastProp, "MISSING_CHAR", message);
        }
      }
      const expType = token.type === "block-map" ? "map" : token.type === "block-seq" ? "seq" : token.start.source === "{" ? "map" : "seq";
      if (!tagToken || !tagName || tagName === "!" || tagName === YAMLMap.YAMLMap.tagName && expType === "map" || tagName === YAMLSeq.YAMLSeq.tagName && expType === "seq") {
        return resolveCollection(CN, ctx, token, onError, tagName);
      }
      let tag = ctx.schema.tags.find((t) => t.tag === tagName && t.collection === expType);
      if (!tag) {
        const kt = ctx.schema.knownTags[tagName];
        if (kt?.collection === expType) {
          ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
          tag = kt;
        } else {
          if (kt) {
            onError(tagToken, "BAD_COLLECTION_TYPE", `${kt.tag} used for ${expType} collection, but expects ${kt.collection ?? "scalar"}`, true);
          } else {
            onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
          }
          return resolveCollection(CN, ctx, token, onError, tagName);
        }
      }
      const coll = resolveCollection(CN, ctx, token, onError, tagName, tag);
      const res = tag.resolve?.(coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options) ?? coll;
      const node = identity.isNode(res) ? res : new Scalar.Scalar(res);
      node.range = coll.range;
      node.tag = tagName;
      if (tag?.format)
        node.format = tag.format;
      return node;
    }
    exports2.composeCollection = composeCollection;
  }
});

// ../../node_modules/yaml/dist/compose/resolve-block-scalar.js
var require_resolve_block_scalar = __commonJS({
  "../../node_modules/yaml/dist/compose/resolve-block-scalar.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    function resolveBlockScalar(ctx, scalar, onError) {
      const start = scalar.offset;
      const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
      if (!header)
        return { value: "", type: null, comment: "", range: [start, start, start] };
      const type = header.mode === ">" ? Scalar.Scalar.BLOCK_FOLDED : Scalar.Scalar.BLOCK_LITERAL;
      const lines = scalar.source ? splitLines(scalar.source) : [];
      let chompStart = lines.length;
      for (let i = lines.length - 1; i >= 0; --i) {
        const content = lines[i][1];
        if (content === "" || content === "\r")
          chompStart = i;
        else
          break;
      }
      if (chompStart === 0) {
        const value2 = header.chomp === "+" && lines.length > 0 ? "\n".repeat(Math.max(1, lines.length - 1)) : "";
        let end2 = start + header.length;
        if (scalar.source)
          end2 += scalar.source.length;
        return { value: value2, type, comment: header.comment, range: [start, end2, end2] };
      }
      let trimIndent = scalar.indent + header.indent;
      let offset = scalar.offset + header.length;
      let contentStart = 0;
      for (let i = 0; i < chompStart; ++i) {
        const [indent, content] = lines[i];
        if (content === "" || content === "\r") {
          if (header.indent === 0 && indent.length > trimIndent)
            trimIndent = indent.length;
        } else {
          if (indent.length < trimIndent) {
            const message = "Block scalars with more-indented leading empty lines must use an explicit indentation indicator";
            onError(offset + indent.length, "MISSING_CHAR", message);
          }
          if (header.indent === 0)
            trimIndent = indent.length;
          contentStart = i;
          if (trimIndent === 0 && !ctx.atRoot) {
            const message = "Block scalar values in collections must be indented";
            onError(offset, "BAD_INDENT", message);
          }
          break;
        }
        offset += indent.length + content.length + 1;
      }
      for (let i = lines.length - 1; i >= chompStart; --i) {
        if (lines[i][0].length > trimIndent)
          chompStart = i + 1;
      }
      let value = "";
      let sep = "";
      let prevMoreIndented = false;
      for (let i = 0; i < contentStart; ++i)
        value += lines[i][0].slice(trimIndent) + "\n";
      for (let i = contentStart; i < chompStart; ++i) {
        let [indent, content] = lines[i];
        offset += indent.length + content.length + 1;
        const crlf = content[content.length - 1] === "\r";
        if (crlf)
          content = content.slice(0, -1);
        if (content && indent.length < trimIndent) {
          const src = header.indent ? "explicit indentation indicator" : "first line";
          const message = `Block scalar lines must not be less indented than their ${src}`;
          onError(offset - content.length - (crlf ? 2 : 1), "BAD_INDENT", message);
          indent = "";
        }
        if (type === Scalar.Scalar.BLOCK_LITERAL) {
          value += sep + indent.slice(trimIndent) + content;
          sep = "\n";
        } else if (indent.length > trimIndent || content[0] === "	") {
          if (sep === " ")
            sep = "\n";
          else if (!prevMoreIndented && sep === "\n")
            sep = "\n\n";
          value += sep + indent.slice(trimIndent) + content;
          sep = "\n";
          prevMoreIndented = true;
        } else if (content === "") {
          if (sep === "\n")
            value += "\n";
          else
            sep = "\n";
        } else {
          value += sep + content;
          sep = " ";
          prevMoreIndented = false;
        }
      }
      switch (header.chomp) {
        case "-":
          break;
        case "+":
          for (let i = chompStart; i < lines.length; ++i)
            value += "\n" + lines[i][0].slice(trimIndent);
          if (value[value.length - 1] !== "\n")
            value += "\n";
          break;
        default:
          value += "\n";
      }
      const end = start + header.length + scalar.source.length;
      return { value, type, comment: header.comment, range: [start, end, end] };
    }
    function parseBlockScalarHeader({ offset, props }, strict, onError) {
      if (props[0].type !== "block-scalar-header") {
        onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
        return null;
      }
      const { source } = props[0];
      const mode = source[0];
      let indent = 0;
      let chomp = "";
      let error = -1;
      for (let i = 1; i < source.length; ++i) {
        const ch = source[i];
        if (!chomp && (ch === "-" || ch === "+"))
          chomp = ch;
        else {
          const n = Number(ch);
          if (!indent && n)
            indent = n;
          else if (error === -1)
            error = offset + i;
        }
      }
      if (error !== -1)
        onError(error, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${source}`);
      let hasSpace = false;
      let comment = "";
      let length = source.length;
      for (let i = 1; i < props.length; ++i) {
        const token = props[i];
        switch (token.type) {
          case "space":
            hasSpace = true;
          // fallthrough
          case "newline":
            length += token.source.length;
            break;
          case "comment":
            if (strict && !hasSpace) {
              const message = "Comments must be separated from other tokens by white space characters";
              onError(token, "MISSING_CHAR", message);
            }
            length += token.source.length;
            comment = token.source.substring(1);
            break;
          case "error":
            onError(token, "UNEXPECTED_TOKEN", token.message);
            length += token.source.length;
            break;
          /* istanbul ignore next should not happen */
          default: {
            const message = `Unexpected token in block scalar header: ${token.type}`;
            onError(token, "UNEXPECTED_TOKEN", message);
            const ts = token.source;
            if (ts && typeof ts === "string")
              length += ts.length;
          }
        }
      }
      return { mode, indent, chomp, comment, length };
    }
    function splitLines(source) {
      const split = source.split(/\n( *)/);
      const first = split[0];
      const m = first.match(/^( *)/);
      const line0 = m?.[1] ? [m[1], first.slice(m[1].length)] : ["", first];
      const lines = [line0];
      for (let i = 1; i < split.length; i += 2)
        lines.push([split[i], split[i + 1]]);
      return lines;
    }
    exports2.resolveBlockScalar = resolveBlockScalar;
  }
});

// ../../node_modules/yaml/dist/compose/resolve-flow-scalar.js
var require_resolve_flow_scalar = __commonJS({
  "../../node_modules/yaml/dist/compose/resolve-flow-scalar.js"(exports2) {
    "use strict";
    var Scalar = require_Scalar();
    var resolveEnd = require_resolve_end();
    function resolveFlowScalar(scalar, strict, onError) {
      const { offset, type, source, end } = scalar;
      let _type;
      let value;
      const _onError = (rel, code, msg) => onError(offset + rel, code, msg);
      switch (type) {
        case "scalar":
          _type = Scalar.Scalar.PLAIN;
          value = plainValue(source, _onError);
          break;
        case "single-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_SINGLE;
          value = singleQuotedValue(source, _onError);
          break;
        case "double-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_DOUBLE;
          value = doubleQuotedValue(source, _onError);
          break;
        /* istanbul ignore next should not happen */
        default:
          onError(scalar, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type}`);
          return {
            value: "",
            type: null,
            comment: "",
            range: [offset, offset + source.length, offset + source.length]
          };
      }
      const valueEnd = offset + source.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, strict, onError);
      return {
        value,
        type: _type,
        comment: re.comment,
        range: [offset, valueEnd, re.offset]
      };
    }
    function plainValue(source, onError) {
      let badChar = "";
      switch (source[0]) {
        /* istanbul ignore next should not happen */
        case "	":
          badChar = "a tab character";
          break;
        case ",":
          badChar = "flow indicator character ,";
          break;
        case "%":
          badChar = "directive indicator character %";
          break;
        case "|":
        case ">": {
          badChar = `block scalar indicator ${source[0]}`;
          break;
        }
        case "@":
        case "`": {
          badChar = `reserved character ${source[0]}`;
          break;
        }
      }
      if (badChar)
        onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
      return unfoldLines(source);
    }
    function singleQuotedValue(source, onError) {
      if (source[source.length - 1] !== "'" || source.length === 1)
        onError(source.length, "MISSING_CHAR", "Missing closing 'quote");
      return unfoldLines(source.slice(1, -1)).replace(/''/g, "'");
    }
    function unfoldLines(source) {
      const line = /(.*?)\r?\n/sy;
      let match = line.exec(source);
      if (!match)
        return source;
      let trimEnd, trimBoth;
      try {
        trimEnd = new RegExp("(?<![ 	])[ 	]+$");
        trimBoth = new RegExp("^[ 	]+|(?<![ 	])[ 	]+$", "g");
      } catch {
        trimEnd = /[ \t]+$/;
        trimBoth = /^[ \t]+|[ \t]+$/g;
      }
      let res = match[1].replace(trimEnd, "");
      let sep = " ";
      let pos = line.lastIndex;
      while (match = line.exec(source)) {
        const lm = match[1].replace(trimBoth, "");
        if (lm === "") {
          if (sep === "\n")
            res += sep;
          else
            sep = "\n";
        } else {
          res += sep + lm;
          sep = " ";
        }
        pos = line.lastIndex;
      }
      const last = /[ \t]*(.*)/sy;
      last.lastIndex = pos;
      match = last.exec(source);
      return res + sep + (match?.[1] ?? "");
    }
    function doubleQuotedValue(source, onError) {
      let res = "";
      for (let i = 1; i < source.length - 1; ++i) {
        const ch = source[i];
        if (ch === "\r" && source[i + 1] === "\n")
          continue;
        if (ch === "\n") {
          const { fold, offset } = foldNewline(source, i);
          res += fold;
          i = offset;
        } else if (ch === "\\") {
          let next = source[++i];
          const cc = escapeCodes[next];
          if (cc)
            res += cc;
          else if (next === "\n") {
            next = source[i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
          } else if (next === "\r" && source[i + 1] === "\n") {
            next = source[++i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
          } else if (next === "x" || next === "u" || next === "U") {
            const length = next === "x" ? 2 : next === "u" ? 4 : 8;
            res += parseCharCode(source, i + 1, length, onError);
            i += length;
          } else {
            const raw = source.substr(i - 1, 2);
            onError(i - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
            res += raw;
          }
        } else if (ch === " " || ch === "	") {
          const wsStart = i;
          let next = source[i + 1];
          while (next === " " || next === "	")
            next = source[++i + 1];
          if (next !== "\n" && !(next === "\r" && source[i + 2] === "\n"))
            res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
        } else {
          res += ch;
        }
      }
      if (source[source.length - 1] !== '"' || source.length === 1)
        onError(source.length, "MISSING_CHAR", 'Missing closing "quote');
      return res;
    }
    function foldNewline(source, offset) {
      let fold = "";
      let ch = source[offset + 1];
      while (ch === " " || ch === "	" || ch === "\n" || ch === "\r") {
        if (ch === "\r" && source[offset + 2] !== "\n")
          break;
        if (ch === "\n")
          fold += "\n";
        offset += 1;
        ch = source[offset + 1];
      }
      if (!fold)
        fold = " ";
      return { fold, offset };
    }
    var escapeCodes = {
      "0": "\0",
      // null character
      a: "\x07",
      // bell character
      b: "\b",
      // backspace
      e: "\x1B",
      // escape character
      f: "\f",
      // form feed
      n: "\n",
      // line feed
      r: "\r",
      // carriage return
      t: "	",
      // horizontal tab
      v: "\v",
      // vertical tab
      N: "\x85",
      // Unicode next line
      _: "\xA0",
      // Unicode non-breaking space
      L: "\u2028",
      // Unicode line separator
      P: "\u2029",
      // Unicode paragraph separator
      " ": " ",
      '"': '"',
      "/": "/",
      "\\": "\\",
      "	": "	"
    };
    function parseCharCode(source, offset, length, onError) {
      const cc = source.substr(offset, length);
      const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc);
      const code = ok ? parseInt(cc, 16) : NaN;
      try {
        return String.fromCodePoint(code);
      } catch {
        const raw = source.substr(offset - 2, length + 2);
        onError(offset - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
        return raw;
      }
    }
    exports2.resolveFlowScalar = resolveFlowScalar;
  }
});

// ../../node_modules/yaml/dist/compose/compose-scalar.js
var require_compose_scalar = __commonJS({
  "../../node_modules/yaml/dist/compose/compose-scalar.js"(exports2) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    function composeScalar(ctx, token, tagToken, onError) {
      const { value, type, comment, range } = token.type === "block-scalar" ? resolveBlockScalar.resolveBlockScalar(ctx, token, onError) : resolveFlowScalar.resolveFlowScalar(token, ctx.options.strict, onError);
      const tagName = tagToken ? ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg)) : null;
      let tag;
      if (ctx.options.stringKeys && ctx.atKey) {
        tag = ctx.schema[identity.SCALAR];
      } else if (tagName)
        tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
      else if (token.type === "scalar")
        tag = findScalarTagByTest(ctx, value, token, onError);
      else
        tag = ctx.schema[identity.SCALAR];
      let scalar;
      try {
        const res = tag.resolve(value, (msg) => onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg), ctx.options);
        scalar = identity.isScalar(res) ? res : new Scalar.Scalar(res);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg);
        scalar = new Scalar.Scalar(value);
      }
      scalar.range = range;
      scalar.source = value;
      if (type)
        scalar.type = type;
      if (tagName)
        scalar.tag = tagName;
      if (tag.format)
        scalar.format = tag.format;
      if (comment)
        scalar.comment = comment;
      return scalar;
    }
    function findScalarTagByName(schema, value, tagName, tagToken, onError) {
      if (tagName === "!")
        return schema[identity.SCALAR];
      const matchWithTest = [];
      for (const tag of schema.tags) {
        if (!tag.collection && tag.tag === tagName) {
          if (tag.default && tag.test)
            matchWithTest.push(tag);
          else
            return tag;
        }
      }
      for (const tag of matchWithTest)
        if (tag.test?.test(value))
          return tag;
      const kt = schema.knownTags[tagName];
      if (kt && !kt.collection) {
        schema.tags.push(Object.assign({}, kt, { default: false, test: void 0 }));
        return kt;
      }
      onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, tagName !== "tag:yaml.org,2002:str");
      return schema[identity.SCALAR];
    }
    function findScalarTagByTest({ atKey, directives, schema }, value, token, onError) {
      const tag = schema.tags.find((tag2) => (tag2.default === true || atKey && tag2.default === "key") && tag2.test?.test(value)) || schema[identity.SCALAR];
      if (schema.compat) {
        const compat = schema.compat.find((tag2) => tag2.default && tag2.test?.test(value)) ?? schema[identity.SCALAR];
        if (tag.tag !== compat.tag) {
          const ts = directives.tagString(tag.tag);
          const cs = directives.tagString(compat.tag);
          const msg = `Value may be parsed as either ${ts} or ${cs}`;
          onError(token, "TAG_RESOLVE_FAILED", msg, true);
        }
      }
      return tag;
    }
    exports2.composeScalar = composeScalar;
  }
});

// ../../node_modules/yaml/dist/compose/util-empty-scalar-position.js
var require_util_empty_scalar_position = __commonJS({
  "../../node_modules/yaml/dist/compose/util-empty-scalar-position.js"(exports2) {
    "use strict";
    function emptyScalarPosition(offset, before, pos) {
      if (before) {
        pos ?? (pos = before.length);
        for (let i = pos - 1; i >= 0; --i) {
          let st = before[i];
          switch (st.type) {
            case "space":
            case "comment":
            case "newline":
              offset -= st.source.length;
              continue;
          }
          st = before[++i];
          while (st?.type === "space") {
            offset += st.source.length;
            st = before[++i];
          }
          break;
        }
      }
      return offset;
    }
    exports2.emptyScalarPosition = emptyScalarPosition;
  }
});

// ../../node_modules/yaml/dist/compose/compose-node.js
var require_compose_node = __commonJS({
  "../../node_modules/yaml/dist/compose/compose-node.js"(exports2) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var composeCollection = require_compose_collection();
    var composeScalar = require_compose_scalar();
    var resolveEnd = require_resolve_end();
    var utilEmptyScalarPosition = require_util_empty_scalar_position();
    var CN = { composeNode, composeEmptyNode };
    function composeNode(ctx, token, props, onError) {
      const atKey = ctx.atKey;
      const { spaceBefore, comment, anchor, tag } = props;
      let node;
      let isSrcToken = true;
      switch (token.type) {
        case "alias":
          node = composeAlias(ctx, token, onError);
          if (anchor || tag)
            onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
          break;
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "block-scalar":
          node = composeScalar.composeScalar(ctx, token, tag, onError);
          if (anchor)
            node.anchor = anchor.source.substring(1);
          break;
        case "block-map":
        case "block-seq":
        case "flow-collection":
          try {
            node = composeCollection.composeCollection(CN, ctx, token, props, onError);
            if (anchor)
              node.anchor = anchor.source.substring(1);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            onError(token, "RESOURCE_EXHAUSTION", message);
          }
          break;
        default: {
          const message = token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`;
          onError(token, "UNEXPECTED_TOKEN", message);
          isSrcToken = false;
        }
      }
      node ?? (node = composeEmptyNode(ctx, token.offset, void 0, null, props, onError));
      if (anchor && node.anchor === "")
        onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      if (atKey && ctx.options.stringKeys && (!identity.isScalar(node) || typeof node.value !== "string" || node.tag && node.tag !== "tag:yaml.org,2002:str")) {
        const msg = "With stringKeys, all keys must be strings";
        onError(tag ?? token, "NON_STRING_KEY", msg);
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        if (token.type === "scalar" && token.source === "")
          node.comment = comment;
        else
          node.commentBefore = comment;
      }
      if (ctx.options.keepSourceTokens && isSrcToken)
        node.srcToken = token;
      return node;
    }
    function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor, tag, end }, onError) {
      const token = {
        type: "scalar",
        offset: utilEmptyScalarPosition.emptyScalarPosition(offset, before, pos),
        indent: -1,
        source: ""
      };
      const node = composeScalar.composeScalar(ctx, token, tag, onError);
      if (anchor) {
        node.anchor = anchor.source.substring(1);
        if (node.anchor === "")
          onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        node.comment = comment;
        node.range[2] = end;
      }
      return node;
    }
    function composeAlias({ options }, { offset, source, end }, onError) {
      const alias = new Alias.Alias(source.substring(1));
      if (alias.source === "")
        onError(offset, "BAD_ALIAS", "Alias cannot be an empty string");
      if (alias.source.endsWith(":"))
        onError(offset + source.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
      const valueEnd = offset + source.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, options.strict, onError);
      alias.range = [offset, valueEnd, re.offset];
      if (re.comment)
        alias.comment = re.comment;
      return alias;
    }
    exports2.composeEmptyNode = composeEmptyNode;
    exports2.composeNode = composeNode;
  }
});

// ../../node_modules/yaml/dist/compose/compose-doc.js
var require_compose_doc = __commonJS({
  "../../node_modules/yaml/dist/compose/compose-doc.js"(exports2) {
    "use strict";
    var Document = require_Document();
    var composeNode = require_compose_node();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    function composeDoc(options, directives, { offset, start, value, end }, onError) {
      const opts = Object.assign({ _directives: directives }, options);
      const doc = new Document.Document(void 0, opts);
      const ctx = {
        atKey: false,
        atRoot: true,
        directives: doc.directives,
        options: doc.options,
        schema: doc.schema
      };
      const props = resolveProps.resolveProps(start, {
        indicator: "doc-start",
        next: value ?? end?.[0],
        offset,
        onError,
        parentIndent: 0,
        startOnNewline: true
      });
      if (props.found) {
        doc.directives.docStart = true;
        if (value && (value.type === "block-map" || value.type === "block-seq") && !props.hasNewline)
          onError(props.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker");
      }
      doc.contents = value ? composeNode.composeNode(ctx, value, props, onError) : composeNode.composeEmptyNode(ctx, props.end, start, null, props, onError);
      const contentEnd = doc.contents.range[2];
      const re = resolveEnd.resolveEnd(end, contentEnd, false, onError);
      if (re.comment)
        doc.comment = re.comment;
      doc.range = [offset, contentEnd, re.offset];
      return doc;
    }
    exports2.composeDoc = composeDoc;
  }
});

// ../../node_modules/yaml/dist/compose/composer.js
var require_composer = __commonJS({
  "../../node_modules/yaml/dist/compose/composer.js"(exports2) {
    "use strict";
    var node_process = require("process");
    var directives = require_directives();
    var Document = require_Document();
    var errors = require_errors();
    var identity = require_identity();
    var composeDoc = require_compose_doc();
    var resolveEnd = require_resolve_end();
    function getErrorPos(src) {
      if (typeof src === "number")
        return [src, src + 1];
      if (Array.isArray(src))
        return src.length === 2 ? src : [src[0], src[1]];
      const { offset, source } = src;
      return [offset, offset + (typeof source === "string" ? source.length : 1)];
    }
    function parsePrelude(prelude) {
      let comment = "";
      let atComment = false;
      let afterEmptyLine = false;
      for (let i = 0; i < prelude.length; ++i) {
        const source = prelude[i];
        switch (source[0]) {
          case "#":
            comment += (comment === "" ? "" : afterEmptyLine ? "\n\n" : "\n") + (source.substring(1) || " ");
            atComment = true;
            afterEmptyLine = false;
            break;
          case "%":
            if (prelude[i + 1]?.[0] !== "#")
              i += 1;
            atComment = false;
            break;
          default:
            if (!atComment)
              afterEmptyLine = true;
            atComment = false;
        }
      }
      return { comment, afterEmptyLine };
    }
    var Composer = class {
      constructor(options = {}) {
        this.doc = null;
        this.atDirectives = false;
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
        this.onError = (source, code, message, warning) => {
          const pos = getErrorPos(source);
          if (warning)
            this.warnings.push(new errors.YAMLWarning(pos, code, message));
          else
            this.errors.push(new errors.YAMLParseError(pos, code, message));
        };
        this.directives = new directives.Directives({ version: options.version || "1.2" });
        this.options = options;
      }
      decorate(doc, afterDoc) {
        const { comment, afterEmptyLine } = parsePrelude(this.prelude);
        if (comment) {
          const dc = doc.contents;
          if (afterDoc) {
            doc.comment = doc.comment ? `${doc.comment}
${comment}` : comment;
          } else if (afterEmptyLine || doc.directives.docStart || !dc) {
            doc.commentBefore = comment;
          } else if (identity.isCollection(dc) && !dc.flow && dc.items.length > 0) {
            let it = dc.items[0];
            if (identity.isPair(it))
              it = it.key;
            const cb = it.commentBefore;
            it.commentBefore = cb ? `${comment}
${cb}` : comment;
          } else {
            const cb = dc.commentBefore;
            dc.commentBefore = cb ? `${comment}
${cb}` : comment;
          }
        }
        if (afterDoc) {
          for (let i = 0; i < this.errors.length; ++i)
            doc.errors.push(this.errors[i]);
          for (let i = 0; i < this.warnings.length; ++i)
            doc.warnings.push(this.warnings[i]);
        } else {
          doc.errors = this.errors;
          doc.warnings = this.warnings;
        }
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
      }
      /**
       * Current stream status information.
       *
       * Mostly useful at the end of input for an empty stream.
       */
      streamInfo() {
        return {
          comment: parsePrelude(this.prelude).comment,
          directives: this.directives,
          errors: this.errors,
          warnings: this.warnings
        };
      }
      /**
       * Compose tokens into documents.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *compose(tokens, forceDoc = false, endOffset = -1) {
        for (const token of tokens)
          yield* this.next(token);
        yield* this.end(forceDoc, endOffset);
      }
      /** Advance the composer by one CST token. */
      *next(token) {
        if (node_process.env.LOG_STREAM)
          console.dir(token, { depth: null });
        switch (token.type) {
          case "directive":
            this.directives.add(token.source, (offset, message, warning) => {
              const pos = getErrorPos(token);
              pos[0] += offset;
              this.onError(pos, "BAD_DIRECTIVE", message, warning);
            });
            this.prelude.push(token.source);
            this.atDirectives = true;
            break;
          case "document": {
            const doc = composeDoc.composeDoc(this.options, this.directives, token, this.onError);
            if (this.atDirectives && !doc.directives.docStart)
              this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
            this.decorate(doc, false);
            if (this.doc)
              yield this.doc;
            this.doc = doc;
            this.atDirectives = false;
            break;
          }
          case "byte-order-mark":
          case "space":
            break;
          case "comment":
          case "newline":
            this.prelude.push(token.source);
            break;
          case "error": {
            const msg = token.source ? `${token.message}: ${JSON.stringify(token.source)}` : token.message;
            const error = new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
            if (this.atDirectives || !this.doc)
              this.errors.push(error);
            else
              this.doc.errors.push(error);
            break;
          }
          case "doc-end": {
            if (!this.doc) {
              const msg = "Unexpected doc-end without preceding document";
              this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg));
              break;
            }
            this.doc.directives.docEnd = true;
            const end = resolveEnd.resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
            this.decorate(this.doc, true);
            if (end.comment) {
              const dc = this.doc.comment;
              this.doc.comment = dc ? `${dc}
${end.comment}` : end.comment;
            }
            this.doc.range[2] = end.offset;
            break;
          }
          default:
            this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", `Unsupported token ${token.type}`));
        }
      }
      /**
       * Call at end of input to yield any remaining document.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *end(forceDoc = false, endOffset = -1) {
        if (this.doc) {
          this.decorate(this.doc, true);
          yield this.doc;
          this.doc = null;
        } else if (forceDoc) {
          const opts = Object.assign({ _directives: this.directives }, this.options);
          const doc = new Document.Document(void 0, opts);
          if (this.atDirectives)
            this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
          doc.range = [0, endOffset, endOffset];
          this.decorate(doc, false);
          yield doc;
        }
      }
    };
    exports2.Composer = Composer;
  }
});

// ../../node_modules/yaml/dist/parse/cst-scalar.js
var require_cst_scalar = __commonJS({
  "../../node_modules/yaml/dist/parse/cst-scalar.js"(exports2) {
    "use strict";
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    var errors = require_errors();
    var stringifyString = require_stringifyString();
    function resolveAsScalar(token, strict = true, onError) {
      if (token) {
        const _onError = (pos, code, message) => {
          const offset = typeof pos === "number" ? pos : Array.isArray(pos) ? pos[0] : pos.offset;
          if (onError)
            onError(offset, code, message);
          else
            throw new errors.YAMLParseError([offset, offset + 1], code, message);
        };
        switch (token.type) {
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return resolveFlowScalar.resolveFlowScalar(token, strict, _onError);
          case "block-scalar":
            return resolveBlockScalar.resolveBlockScalar({ options: { strict } }, token, _onError);
        }
      }
      return null;
    }
    function createScalarToken(value, context) {
      const { implicitKey = false, indent, inFlow = false, offset = -1, type = "PLAIN" } = context;
      const source = stringifyString.stringifyString({ type, value }, {
        implicitKey,
        indent: indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      const end = context.end ?? [
        { type: "newline", offset: -1, indent, source: "\n" }
      ];
      switch (source[0]) {
        case "|":
        case ">": {
          const he = source.indexOf("\n");
          const head = source.substring(0, he);
          const body = source.substring(he + 1) + "\n";
          const props = [
            { type: "block-scalar-header", offset, indent, source: head }
          ];
          if (!addEndtoBlockProps(props, end))
            props.push({ type: "newline", offset: -1, indent, source: "\n" });
          return { type: "block-scalar", offset, indent, props, source: body };
        }
        case '"':
          return { type: "double-quoted-scalar", offset, indent, source, end };
        case "'":
          return { type: "single-quoted-scalar", offset, indent, source, end };
        default:
          return { type: "scalar", offset, indent, source, end };
      }
    }
    function setScalarValue(token, value, context = {}) {
      let { afterKey = false, implicitKey = false, inFlow = false, type } = context;
      let indent = "indent" in token ? token.indent : null;
      if (afterKey && typeof indent === "number")
        indent += 2;
      if (!type)
        switch (token.type) {
          case "single-quoted-scalar":
            type = "QUOTE_SINGLE";
            break;
          case "double-quoted-scalar":
            type = "QUOTE_DOUBLE";
            break;
          case "block-scalar": {
            const header = token.props[0];
            if (header.type !== "block-scalar-header")
              throw new Error("Invalid block scalar header");
            type = header.source[0] === ">" ? "BLOCK_FOLDED" : "BLOCK_LITERAL";
            break;
          }
          default:
            type = "PLAIN";
        }
      const source = stringifyString.stringifyString({ type, value }, {
        implicitKey: implicitKey || indent === null,
        indent: indent !== null && indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      switch (source[0]) {
        case "|":
        case ">":
          setBlockScalarValue(token, source);
          break;
        case '"':
          setFlowScalarValue(token, source, "double-quoted-scalar");
          break;
        case "'":
          setFlowScalarValue(token, source, "single-quoted-scalar");
          break;
        default:
          setFlowScalarValue(token, source, "scalar");
      }
    }
    function setBlockScalarValue(token, source) {
      const he = source.indexOf("\n");
      const head = source.substring(0, he);
      const body = source.substring(he + 1) + "\n";
      if (token.type === "block-scalar") {
        const header = token.props[0];
        if (header.type !== "block-scalar-header")
          throw new Error("Invalid block scalar header");
        header.source = head;
        token.source = body;
      } else {
        const { offset } = token;
        const indent = "indent" in token ? token.indent : -1;
        const props = [
          { type: "block-scalar-header", offset, indent, source: head }
        ];
        if (!addEndtoBlockProps(props, "end" in token ? token.end : void 0))
          props.push({ type: "newline", offset: -1, indent, source: "\n" });
        for (const key of Object.keys(token))
          if (key !== "type" && key !== "offset")
            delete token[key];
        Object.assign(token, { type: "block-scalar", indent, props, source: body });
      }
    }
    function addEndtoBlockProps(props, end) {
      if (end)
        for (const st of end)
          switch (st.type) {
            case "space":
            case "comment":
              props.push(st);
              break;
            case "newline":
              props.push(st);
              return true;
          }
      return false;
    }
    function setFlowScalarValue(token, source, type) {
      switch (token.type) {
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          token.type = type;
          token.source = source;
          break;
        case "block-scalar": {
          const end = token.props.slice(1);
          let oa = source.length;
          if (token.props[0].type === "block-scalar-header")
            oa -= token.props[0].source.length;
          for (const tok of end)
            tok.offset += oa;
          delete token.props;
          Object.assign(token, { type, source, end });
          break;
        }
        case "block-map":
        case "block-seq": {
          const offset = token.offset + source.length;
          const nl = { type: "newline", offset, indent: token.indent, source: "\n" };
          delete token.items;
          Object.assign(token, { type, source, end: [nl] });
          break;
        }
        default: {
          const indent = "indent" in token ? token.indent : -1;
          const end = "end" in token && Array.isArray(token.end) ? token.end.filter((st) => st.type === "space" || st.type === "comment" || st.type === "newline") : [];
          for (const key of Object.keys(token))
            if (key !== "type" && key !== "offset")
              delete token[key];
          Object.assign(token, { type, indent, source, end });
        }
      }
    }
    exports2.createScalarToken = createScalarToken;
    exports2.resolveAsScalar = resolveAsScalar;
    exports2.setScalarValue = setScalarValue;
  }
});

// ../../node_modules/yaml/dist/parse/cst-stringify.js
var require_cst_stringify = __commonJS({
  "../../node_modules/yaml/dist/parse/cst-stringify.js"(exports2) {
    "use strict";
    var stringify2 = (cst) => "type" in cst ? stringifyToken(cst) : stringifyItem(cst);
    function stringifyToken(token) {
      switch (token.type) {
        case "block-scalar": {
          let res = "";
          for (const tok of token.props)
            res += stringifyToken(tok);
          return res + token.source;
        }
        case "block-map":
        case "block-seq": {
          let res = "";
          for (const item of token.items)
            res += stringifyItem(item);
          return res;
        }
        case "flow-collection": {
          let res = token.start.source;
          for (const item of token.items)
            res += stringifyItem(item);
          for (const st of token.end)
            res += st.source;
          return res;
        }
        case "document": {
          let res = stringifyItem(token);
          if (token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
        default: {
          let res = token.source;
          if ("end" in token && token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
      }
    }
    function stringifyItem({ start, key, sep, value }) {
      let res = "";
      for (const st of start)
        res += st.source;
      if (key)
        res += stringifyToken(key);
      if (sep)
        for (const st of sep)
          res += st.source;
      if (value)
        res += stringifyToken(value);
      return res;
    }
    exports2.stringify = stringify2;
  }
});

// ../../node_modules/yaml/dist/parse/cst-visit.js
var require_cst_visit = __commonJS({
  "../../node_modules/yaml/dist/parse/cst-visit.js"(exports2) {
    "use strict";
    var BREAK = /* @__PURE__ */ Symbol("break visit");
    var SKIP = /* @__PURE__ */ Symbol("skip children");
    var REMOVE = /* @__PURE__ */ Symbol("remove item");
    function visit(cst, visitor) {
      if ("type" in cst && cst.type === "document")
        cst = { start: cst.start, value: cst.value };
      _visit(Object.freeze([]), cst, visitor);
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP;
    visit.REMOVE = REMOVE;
    visit.itemAtPath = (cst, path) => {
      let item = cst;
      for (const [field, index] of path) {
        const tok = item?.[field];
        if (tok && "items" in tok) {
          item = tok.items[index];
        } else
          return void 0;
      }
      return item;
    };
    visit.parentCollection = (cst, path) => {
      const parent = visit.itemAtPath(cst, path.slice(0, -1));
      const field = path[path.length - 1][0];
      const coll = parent?.[field];
      if (coll && "items" in coll)
        return coll;
      throw new Error("Parent collection not found");
    };
    function _visit(path, item, visitor) {
      let ctrl = visitor(item, path);
      if (typeof ctrl === "symbol")
        return ctrl;
      for (const field of ["key", "value"]) {
        const token = item[field];
        if (token && "items" in token) {
          for (let i = 0; i < token.items.length; ++i) {
            const ci = _visit(Object.freeze(path.concat([[field, i]])), token.items[i], visitor);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              token.items.splice(i, 1);
              i -= 1;
            }
          }
          if (typeof ctrl === "function" && field === "key")
            ctrl = ctrl(item, path);
        }
      }
      return typeof ctrl === "function" ? ctrl(item, path) : ctrl;
    }
    exports2.visit = visit;
  }
});

// ../../node_modules/yaml/dist/parse/cst.js
var require_cst = __commonJS({
  "../../node_modules/yaml/dist/parse/cst.js"(exports2) {
    "use strict";
    var cstScalar = require_cst_scalar();
    var cstStringify = require_cst_stringify();
    var cstVisit = require_cst_visit();
    var BOM = "\uFEFF";
    var DOCUMENT = "";
    var FLOW_END = "";
    var SCALAR = "";
    var isCollection = (token) => !!token && "items" in token;
    var isScalar = (token) => !!token && (token.type === "scalar" || token.type === "single-quoted-scalar" || token.type === "double-quoted-scalar" || token.type === "block-scalar");
    function prettyToken(token) {
      switch (token) {
        case BOM:
          return "<BOM>";
        case DOCUMENT:
          return "<DOC>";
        case FLOW_END:
          return "<FLOW_END>";
        case SCALAR:
          return "<SCALAR>";
        default:
          return JSON.stringify(token);
      }
    }
    function tokenType(source) {
      switch (source) {
        case BOM:
          return "byte-order-mark";
        case DOCUMENT:
          return "doc-mode";
        case FLOW_END:
          return "flow-error-end";
        case SCALAR:
          return "scalar";
        case "---":
          return "doc-start";
        case "...":
          return "doc-end";
        case "":
        case "\n":
        case "\r\n":
          return "newline";
        case "-":
          return "seq-item-ind";
        case "?":
          return "explicit-key-ind";
        case ":":
          return "map-value-ind";
        case "{":
          return "flow-map-start";
        case "}":
          return "flow-map-end";
        case "[":
          return "flow-seq-start";
        case "]":
          return "flow-seq-end";
        case ",":
          return "comma";
      }
      switch (source[0]) {
        case " ":
        case "	":
          return "space";
        case "#":
          return "comment";
        case "%":
          return "directive-line";
        case "*":
          return "alias";
        case "&":
          return "anchor";
        case "!":
          return "tag";
        case "'":
          return "single-quoted-scalar";
        case '"':
          return "double-quoted-scalar";
        case "|":
        case ">":
          return "block-scalar-header";
      }
      return null;
    }
    exports2.createScalarToken = cstScalar.createScalarToken;
    exports2.resolveAsScalar = cstScalar.resolveAsScalar;
    exports2.setScalarValue = cstScalar.setScalarValue;
    exports2.stringify = cstStringify.stringify;
    exports2.visit = cstVisit.visit;
    exports2.BOM = BOM;
    exports2.DOCUMENT = DOCUMENT;
    exports2.FLOW_END = FLOW_END;
    exports2.SCALAR = SCALAR;
    exports2.isCollection = isCollection;
    exports2.isScalar = isScalar;
    exports2.prettyToken = prettyToken;
    exports2.tokenType = tokenType;
  }
});

// ../../node_modules/yaml/dist/parse/lexer.js
var require_lexer = __commonJS({
  "../../node_modules/yaml/dist/parse/lexer.js"(exports2) {
    "use strict";
    var cst = require_cst();
    function isEmpty(ch) {
      switch (ch) {
        case void 0:
        case " ":
        case "\n":
        case "\r":
        case "	":
          return true;
        default:
          return false;
      }
    }
    var hexDigits = new Set("0123456789ABCDEFabcdef");
    var tagChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
    var flowIndicatorChars = new Set(",[]{}");
    var invalidAnchorChars = new Set(" ,[]{}\n\r	");
    var isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);
    var Lexer = class {
      constructor() {
        this.atEnd = false;
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        this.buffer = "";
        this.flowKey = false;
        this.flowLevel = 0;
        this.indentNext = 0;
        this.indentValue = 0;
        this.lineEndPos = null;
        this.next = null;
        this.pos = 0;
      }
      /**
       * Generate YAML tokens from the `source` string. If `incomplete`,
       * a part of the last line may be left as a buffer for the next call.
       *
       * @returns A generator of lexical tokens
       */
      *lex(source, incomplete = false) {
        if (source) {
          if (typeof source !== "string")
            throw TypeError("source is not a string");
          this.buffer = this.buffer ? this.buffer + source : source;
          this.lineEndPos = null;
        }
        this.atEnd = !incomplete;
        let next = this.next ?? "stream";
        while (next && (incomplete || this.hasChars(1)))
          next = yield* this.parseNext(next);
      }
      atLineEnd() {
        let i = this.pos;
        let ch = this.buffer[i];
        while (ch === " " || ch === "	")
          ch = this.buffer[++i];
        if (!ch || ch === "#" || ch === "\n")
          return true;
        if (ch === "\r")
          return this.buffer[i + 1] === "\n";
        return false;
      }
      charAt(n) {
        return this.buffer[this.pos + n];
      }
      continueScalar(offset) {
        let ch = this.buffer[offset];
        if (this.indentNext > 0) {
          let indent = 0;
          while (ch === " ")
            ch = this.buffer[++indent + offset];
          if (ch === "\r") {
            const next = this.buffer[indent + offset + 1];
            if (next === "\n" || !next && !this.atEnd)
              return offset + indent + 1;
          }
          return ch === "\n" || indent >= this.indentNext || !ch && !this.atEnd ? offset + indent : -1;
        }
        if (ch === "-" || ch === ".") {
          const dt = this.buffer.substr(offset, 3);
          if ((dt === "---" || dt === "...") && isEmpty(this.buffer[offset + 3]))
            return -1;
        }
        return offset;
      }
      getLine() {
        let end = this.lineEndPos;
        if (typeof end !== "number" || end !== -1 && end < this.pos) {
          end = this.buffer.indexOf("\n", this.pos);
          this.lineEndPos = end;
        }
        if (end === -1)
          return this.atEnd ? this.buffer.substring(this.pos) : null;
        if (this.buffer[end - 1] === "\r")
          end -= 1;
        return this.buffer.substring(this.pos, end);
      }
      hasChars(n) {
        return this.pos + n <= this.buffer.length;
      }
      setNext(state) {
        this.buffer = this.buffer.substring(this.pos);
        this.pos = 0;
        this.lineEndPos = null;
        this.next = state;
        return null;
      }
      peek(n) {
        return this.buffer.substr(this.pos, n);
      }
      *parseNext(next) {
        switch (next) {
          case "stream":
            return yield* this.parseStream();
          case "line-start":
            return yield* this.parseLineStart();
          case "block-start":
            return yield* this.parseBlockStart();
          case "doc":
            return yield* this.parseDocument();
          case "flow":
            return yield* this.parseFlowCollection();
          case "quoted-scalar":
            return yield* this.parseQuotedScalar();
          case "block-scalar":
            return yield* this.parseBlockScalar();
          case "plain-scalar":
            return yield* this.parsePlainScalar();
        }
      }
      *parseStream() {
        let line = this.getLine();
        if (line === null)
          return this.setNext("stream");
        if (line[0] === cst.BOM) {
          yield* this.pushCount(1);
          line = line.substring(1);
        }
        if (line[0] === "%") {
          let dirEnd = line.length;
          let cs = line.indexOf("#");
          while (cs !== -1) {
            const ch = line[cs - 1];
            if (ch === " " || ch === "	") {
              dirEnd = cs - 1;
              break;
            } else {
              cs = line.indexOf("#", cs + 1);
            }
          }
          while (true) {
            const ch = line[dirEnd - 1];
            if (ch === " " || ch === "	")
              dirEnd -= 1;
            else
              break;
          }
          const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
          yield* this.pushCount(line.length - n);
          this.pushNewline();
          return "stream";
        }
        if (this.atLineEnd()) {
          const sp = yield* this.pushSpaces(true);
          yield* this.pushCount(line.length - sp);
          yield* this.pushNewline();
          return "stream";
        }
        yield cst.DOCUMENT;
        return yield* this.parseLineStart();
      }
      *parseLineStart() {
        const ch = this.charAt(0);
        if (!ch && !this.atEnd)
          return this.setNext("line-start");
        if (ch === "-" || ch === ".") {
          if (!this.atEnd && !this.hasChars(4))
            return this.setNext("line-start");
          const s = this.peek(3);
          if ((s === "---" || s === "...") && isEmpty(this.charAt(3))) {
            yield* this.pushCount(3);
            this.indentValue = 0;
            this.indentNext = 0;
            return s === "---" ? "doc" : "stream";
          }
        }
        this.indentValue = yield* this.pushSpaces(false);
        if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
          this.indentNext = this.indentValue;
        return yield* this.parseBlockStart();
      }
      *parseBlockStart() {
        const [ch0, ch1] = this.peek(2);
        if (!ch1 && !this.atEnd)
          return this.setNext("block-start");
        if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty(ch1)) {
          const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
          this.indentNext = this.indentValue + 1;
          this.indentValue += n;
          return "block-start";
        }
        return "doc";
      }
      *parseDocument() {
        yield* this.pushSpaces(true);
        const line = this.getLine();
        if (line === null)
          return this.setNext("doc");
        let n = yield* this.pushIndicators();
        switch (line[n]) {
          case "#":
            yield* this.pushCount(line.length - n);
          // fallthrough
          case void 0:
            yield* this.pushNewline();
            return yield* this.parseLineStart();
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel = 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            return "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "doc";
          case '"':
          case "'":
            return yield* this.parseQuotedScalar();
          case "|":
          case ">":
            n += yield* this.parseBlockScalarHeader();
            n += yield* this.pushSpaces(true);
            yield* this.pushCount(line.length - n);
            yield* this.pushNewline();
            return yield* this.parseBlockScalar();
          default:
            return yield* this.parsePlainScalar();
        }
      }
      *parseFlowCollection() {
        let nl, sp;
        let indent = -1;
        do {
          nl = yield* this.pushNewline();
          if (nl > 0) {
            sp = yield* this.pushSpaces(false);
            this.indentValue = indent = sp;
          } else {
            sp = 0;
          }
          sp += yield* this.pushSpaces(true);
        } while (nl + sp > 0);
        const line = this.getLine();
        if (line === null)
          return this.setNext("flow");
        if (indent !== -1 && indent < this.indentNext && line[0] !== "#" || indent === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty(line[3])) {
          const atFlowEndMarker = indent === this.indentNext - 1 && this.flowLevel === 1 && (line[0] === "]" || line[0] === "}");
          if (!atFlowEndMarker) {
            this.flowLevel = 0;
            yield cst.FLOW_END;
            return yield* this.parseLineStart();
          }
        }
        let n = 0;
        while (line[n] === ",") {
          n += yield* this.pushCount(1);
          n += yield* this.pushSpaces(true);
          this.flowKey = false;
        }
        n += yield* this.pushIndicators();
        switch (line[n]) {
          case void 0:
            return "flow";
          case "#":
            yield* this.pushCount(line.length - n);
            return "flow";
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel += 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            this.flowKey = true;
            this.flowLevel -= 1;
            return this.flowLevel ? "flow" : "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "flow";
          case '"':
          case "'":
            this.flowKey = true;
            return yield* this.parseQuotedScalar();
          case ":": {
            const next = this.charAt(1);
            if (this.flowKey || isEmpty(next) || next === ",") {
              this.flowKey = false;
              yield* this.pushCount(1);
              yield* this.pushSpaces(true);
              return "flow";
            }
          }
          // fallthrough
          default:
            this.flowKey = false;
            return yield* this.parsePlainScalar();
        }
      }
      *parseQuotedScalar() {
        const quote = this.charAt(0);
        let end = this.buffer.indexOf(quote, this.pos + 1);
        if (quote === "'") {
          while (end !== -1 && this.buffer[end + 1] === "'")
            end = this.buffer.indexOf("'", end + 2);
        } else {
          while (end !== -1) {
            let n = 0;
            while (this.buffer[end - 1 - n] === "\\")
              n += 1;
            if (n % 2 === 0)
              break;
            end = this.buffer.indexOf('"', end + 1);
          }
        }
        const qb = this.buffer.substring(0, end);
        let nl = qb.indexOf("\n", this.pos);
        if (nl !== -1) {
          while (nl !== -1) {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = qb.indexOf("\n", cs);
          }
          if (nl !== -1) {
            end = nl - (qb[nl - 1] === "\r" ? 2 : 1);
          }
        }
        if (end === -1) {
          if (!this.atEnd)
            return this.setNext("quoted-scalar");
          end = this.buffer.length;
        }
        yield* this.pushToIndex(end + 1, false);
        return this.flowLevel ? "flow" : "doc";
      }
      *parseBlockScalarHeader() {
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        let i = this.pos;
        while (true) {
          const ch = this.buffer[++i];
          if (ch === "+")
            this.blockScalarKeep = true;
          else if (ch > "0" && ch <= "9")
            this.blockScalarIndent = Number(ch) - 1;
          else if (ch !== "-")
            break;
        }
        return yield* this.pushUntil((ch) => isEmpty(ch) || ch === "#");
      }
      *parseBlockScalar() {
        let nl = this.pos - 1;
        let indent = 0;
        let ch;
        loop: for (let i2 = this.pos; ch = this.buffer[i2]; ++i2) {
          switch (ch) {
            case " ":
              indent += 1;
              break;
            case "\n":
              nl = i2;
              indent = 0;
              break;
            case "\r": {
              const next = this.buffer[i2 + 1];
              if (!next && !this.atEnd)
                return this.setNext("block-scalar");
              if (next === "\n")
                break;
            }
            // fallthrough
            default:
              break loop;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("block-scalar");
        if (indent >= this.indentNext) {
          if (this.blockScalarIndent === -1)
            this.indentNext = indent;
          else {
            this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
          }
          do {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = this.buffer.indexOf("\n", cs);
          } while (nl !== -1);
          if (nl === -1) {
            if (!this.atEnd)
              return this.setNext("block-scalar");
            nl = this.buffer.length;
          }
        }
        let i = nl + 1;
        ch = this.buffer[i];
        while (ch === " ")
          ch = this.buffer[++i];
        if (ch === "	") {
          while (ch === "	" || ch === " " || ch === "\r" || ch === "\n")
            ch = this.buffer[++i];
          nl = i - 1;
        } else if (!this.blockScalarKeep) {
          do {
            let i2 = nl - 1;
            let ch2 = this.buffer[i2];
            if (ch2 === "\r")
              ch2 = this.buffer[--i2];
            const lastChar = i2;
            while (ch2 === " ")
              ch2 = this.buffer[--i2];
            if (ch2 === "\n" && i2 >= this.pos && i2 + 1 + indent > lastChar)
              nl = i2;
            else
              break;
          } while (true);
        }
        yield cst.SCALAR;
        yield* this.pushToIndex(nl + 1, true);
        return yield* this.parseLineStart();
      }
      *parsePlainScalar() {
        const inFlow = this.flowLevel > 0;
        let end = this.pos - 1;
        let i = this.pos - 1;
        let ch;
        while (ch = this.buffer[++i]) {
          if (ch === ":") {
            const next = this.buffer[i + 1];
            if (isEmpty(next) || inFlow && flowIndicatorChars.has(next))
              break;
            end = i;
          } else if (isEmpty(ch)) {
            let next = this.buffer[i + 1];
            if (ch === "\r") {
              if (next === "\n") {
                i += 1;
                ch = "\n";
                next = this.buffer[i + 1];
              } else
                end = i;
            }
            if (next === "#" || inFlow && flowIndicatorChars.has(next))
              break;
            if (ch === "\n") {
              const cs = this.continueScalar(i + 1);
              if (cs === -1)
                break;
              i = Math.max(i, cs - 2);
            }
          } else {
            if (inFlow && flowIndicatorChars.has(ch))
              break;
            end = i;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("plain-scalar");
        yield cst.SCALAR;
        yield* this.pushToIndex(end + 1, true);
        return inFlow ? "flow" : "doc";
      }
      *pushCount(n) {
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos += n;
          return n;
        }
        return 0;
      }
      *pushToIndex(i, allowEmpty) {
        const s = this.buffer.slice(this.pos, i);
        if (s) {
          yield s;
          this.pos += s.length;
          return s.length;
        } else if (allowEmpty)
          yield "";
        return 0;
      }
      *pushIndicators() {
        let n = 0;
        loop: while (true) {
          switch (this.charAt(0)) {
            case "!":
              n += yield* this.pushTag();
              n += yield* this.pushSpaces(true);
              continue loop;
            case "&":
              n += yield* this.pushUntil(isNotAnchorChar);
              n += yield* this.pushSpaces(true);
              continue loop;
            case "-":
            // this is an error
            case "?":
            // this is an error outside flow collections
            case ":": {
              const inFlow = this.flowLevel > 0;
              const ch1 = this.charAt(1);
              if (isEmpty(ch1) || inFlow && flowIndicatorChars.has(ch1)) {
                if (!inFlow)
                  this.indentNext = this.indentValue + 1;
                else if (this.flowKey)
                  this.flowKey = false;
                n += yield* this.pushCount(1);
                n += yield* this.pushSpaces(true);
                continue loop;
              }
            }
          }
          break loop;
        }
        return n;
      }
      *pushTag() {
        if (this.charAt(1) === "<") {
          let i = this.pos + 2;
          let ch = this.buffer[i];
          while (!isEmpty(ch) && ch !== ">")
            ch = this.buffer[++i];
          return yield* this.pushToIndex(ch === ">" ? i + 1 : i, false);
        } else {
          let i = this.pos + 1;
          let ch = this.buffer[i];
          while (ch) {
            if (tagChars.has(ch))
              ch = this.buffer[++i];
            else if (ch === "%" && hexDigits.has(this.buffer[i + 1]) && hexDigits.has(this.buffer[i + 2])) {
              ch = this.buffer[i += 3];
            } else
              break;
          }
          return yield* this.pushToIndex(i, false);
        }
      }
      *pushNewline() {
        const ch = this.buffer[this.pos];
        if (ch === "\n")
          return yield* this.pushCount(1);
        else if (ch === "\r" && this.charAt(1) === "\n")
          return yield* this.pushCount(2);
        else
          return 0;
      }
      *pushSpaces(allowTabs) {
        let i = this.pos - 1;
        let ch;
        do {
          ch = this.buffer[++i];
        } while (ch === " " || allowTabs && ch === "	");
        const n = i - this.pos;
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos = i;
        }
        return n;
      }
      *pushUntil(test) {
        let i = this.pos;
        let ch = this.buffer[i];
        while (!test(ch))
          ch = this.buffer[++i];
        return yield* this.pushToIndex(i, false);
      }
    };
    exports2.Lexer = Lexer;
  }
});

// ../../node_modules/yaml/dist/parse/line-counter.js
var require_line_counter = __commonJS({
  "../../node_modules/yaml/dist/parse/line-counter.js"(exports2) {
    "use strict";
    var LineCounter = class {
      constructor() {
        this.lineStarts = [];
        this.addNewLine = (offset) => this.lineStarts.push(offset);
        this.linePos = (offset) => {
          let low = 0;
          let high = this.lineStarts.length;
          while (low < high) {
            const mid = low + high >> 1;
            if (this.lineStarts[mid] < offset)
              low = mid + 1;
            else
              high = mid;
          }
          if (this.lineStarts[low] === offset)
            return { line: low + 1, col: 1 };
          if (low === 0)
            return { line: 0, col: offset };
          const start = this.lineStarts[low - 1];
          return { line: low, col: offset - start + 1 };
        };
      }
    };
    exports2.LineCounter = LineCounter;
  }
});

// ../../node_modules/yaml/dist/parse/parser.js
var require_parser = __commonJS({
  "../../node_modules/yaml/dist/parse/parser.js"(exports2) {
    "use strict";
    var node_process = require("process");
    var cst = require_cst();
    var lexer = require_lexer();
    function includesToken(list, type) {
      for (let i = 0; i < list.length; ++i)
        if (list[i].type === type)
          return true;
      return false;
    }
    function findNonEmptyIndex(list) {
      for (let i = 0; i < list.length; ++i) {
        switch (list[i].type) {
          case "space":
          case "comment":
          case "newline":
            break;
          default:
            return i;
        }
      }
      return -1;
    }
    function isFlowToken(token) {
      switch (token?.type) {
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "flow-collection":
          return true;
        default:
          return false;
      }
    }
    function getPrevProps(parent) {
      switch (parent.type) {
        case "document":
          return parent.start;
        case "block-map": {
          const it = parent.items[parent.items.length - 1];
          return it.sep ?? it.start;
        }
        case "block-seq":
          return parent.items[parent.items.length - 1].start;
        /* istanbul ignore next should not happen */
        default:
          return [];
      }
    }
    function getFirstKeyStartProps(prev) {
      if (prev.length === 0)
        return [];
      let i = prev.length;
      loop: while (--i >= 0) {
        switch (prev[i].type) {
          case "doc-start":
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
          case "newline":
            break loop;
        }
      }
      while (prev[++i]?.type === "space") {
      }
      return prev.splice(i, prev.length);
    }
    function arrayPushArray(target, source) {
      if (source.length < 1e5)
        Array.prototype.push.apply(target, source);
      else
        for (let i = 0; i < source.length; ++i)
          target.push(source[i]);
    }
    function fixFlowSeqItems(fc) {
      if (fc.start.type === "flow-seq-start") {
        for (const it of fc.items) {
          if (it.sep && !it.value && !includesToken(it.start, "explicit-key-ind") && !includesToken(it.sep, "map-value-ind")) {
            if (it.key)
              it.value = it.key;
            delete it.key;
            if (isFlowToken(it.value)) {
              if (it.value.end)
                arrayPushArray(it.value.end, it.sep);
              else
                it.value.end = it.sep;
            } else
              arrayPushArray(it.start, it.sep);
            delete it.sep;
          }
        }
      }
    }
    var Parser = class {
      /**
       * @param onNewLine - If defined, called separately with the start position of
       *   each new line (in `parse()`, including the start of input).
       */
      constructor(onNewLine) {
        this.atNewLine = true;
        this.atScalar = false;
        this.indent = 0;
        this.offset = 0;
        this.onKeyLine = false;
        this.stack = [];
        this.source = "";
        this.type = "";
        this.lexer = new lexer.Lexer();
        this.onNewLine = onNewLine;
      }
      /**
       * Parse `source` as a YAML stream.
       * If `incomplete`, a part of the last line may be left as a buffer for the next call.
       *
       * Errors are not thrown, but yielded as `{ type: 'error', message }` tokens.
       *
       * @returns A generator of tokens representing each directive, document, and other structure.
       */
      *parse(source, incomplete = false) {
        if (this.onNewLine && this.offset === 0)
          this.onNewLine(0);
        for (const lexeme of this.lexer.lex(source, incomplete))
          yield* this.next(lexeme);
        if (!incomplete)
          yield* this.end();
      }
      /**
       * Advance the parser by the `source` of one lexical token.
       */
      *next(source) {
        this.source = source;
        if (node_process.env.LOG_TOKENS)
          console.log("|", cst.prettyToken(source));
        if (this.atScalar) {
          this.atScalar = false;
          yield* this.step();
          this.offset += source.length;
          return;
        }
        const type = cst.tokenType(source);
        if (!type) {
          const message = `Not a YAML token: ${source}`;
          yield* this.pop({ type: "error", offset: this.offset, message, source });
          this.offset += source.length;
        } else if (type === "scalar") {
          this.atNewLine = false;
          this.atScalar = true;
          this.type = "scalar";
        } else {
          this.type = type;
          yield* this.step();
          switch (type) {
            case "newline":
              this.atNewLine = true;
              this.indent = 0;
              if (this.onNewLine)
                this.onNewLine(this.offset + source.length);
              break;
            case "space":
              if (this.atNewLine && source[0] === " ")
                this.indent += source.length;
              break;
            case "explicit-key-ind":
            case "map-value-ind":
            case "seq-item-ind":
              if (this.atNewLine)
                this.indent += source.length;
              break;
            case "doc-mode":
            case "flow-error-end":
              return;
            default:
              this.atNewLine = false;
          }
          this.offset += source.length;
        }
      }
      /** Call at end of input to push out any remaining constructions */
      *end() {
        while (this.stack.length > 0)
          yield* this.pop();
      }
      get sourceToken() {
        const st = {
          type: this.type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
        return st;
      }
      *step() {
        const top = this.peek(1);
        if (this.type === "doc-end" && top?.type !== "doc-end") {
          while (this.stack.length > 0)
            yield* this.pop();
          this.stack.push({
            type: "doc-end",
            offset: this.offset,
            source: this.source
          });
          return;
        }
        if (!top)
          return yield* this.stream();
        switch (top.type) {
          case "document":
            return yield* this.document(top);
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return yield* this.scalar(top);
          case "block-scalar":
            return yield* this.blockScalar(top);
          case "block-map":
            return yield* this.blockMap(top);
          case "block-seq":
            return yield* this.blockSequence(top);
          case "flow-collection":
            return yield* this.flowCollection(top);
          case "doc-end":
            return yield* this.documentEnd(top);
        }
        yield* this.pop();
      }
      peek(n) {
        return this.stack[this.stack.length - n];
      }
      *pop(error) {
        const token = error ?? this.stack.pop();
        if (!token) {
          const message = "Tried to pop an empty stack";
          yield { type: "error", offset: this.offset, source: "", message };
        } else if (this.stack.length === 0) {
          yield token;
        } else {
          const top = this.peek(1);
          if (token.type === "block-scalar") {
            token.indent = "indent" in top ? top.indent : 0;
          } else if (token.type === "flow-collection" && top.type === "document") {
            token.indent = 0;
          }
          if (token.type === "flow-collection")
            fixFlowSeqItems(token);
          switch (top.type) {
            case "document":
              top.value = token;
              break;
            case "block-scalar":
              top.props.push(token);
              break;
            case "block-map": {
              const it = top.items[top.items.length - 1];
              if (it.value) {
                top.items.push({ start: [], key: token, sep: [] });
                this.onKeyLine = true;
                return;
              } else if (it.sep) {
                it.value = token;
              } else {
                Object.assign(it, { key: token, sep: [] });
                this.onKeyLine = !it.explicitKey;
                return;
              }
              break;
            }
            case "block-seq": {
              const it = top.items[top.items.length - 1];
              if (it.value)
                top.items.push({ start: [], value: token });
              else
                it.value = token;
              break;
            }
            case "flow-collection": {
              const it = top.items[top.items.length - 1];
              if (!it || it.value)
                top.items.push({ start: [], key: token, sep: [] });
              else if (it.sep)
                it.value = token;
              else
                Object.assign(it, { key: token, sep: [] });
              return;
            }
            /* istanbul ignore next should not happen */
            default:
              yield* this.pop();
              yield* this.pop(token);
          }
          if ((top.type === "document" || top.type === "block-map" || top.type === "block-seq") && (token.type === "block-map" || token.type === "block-seq")) {
            const last = token.items[token.items.length - 1];
            if (last && !last.sep && !last.value && last.start.length > 0 && findNonEmptyIndex(last.start) === -1 && (token.indent === 0 || last.start.every((st) => st.type !== "comment" || st.indent < token.indent))) {
              if (top.type === "document")
                top.end = last.start;
              else
                top.items.push({ start: last.start });
              token.items.splice(-1, 1);
            }
          }
        }
      }
      *stream() {
        switch (this.type) {
          case "directive-line":
            yield { type: "directive", offset: this.offset, source: this.source };
            return;
          case "byte-order-mark":
          case "space":
          case "comment":
          case "newline":
            yield this.sourceToken;
            return;
          case "doc-mode":
          case "doc-start": {
            const doc = {
              type: "document",
              offset: this.offset,
              start: []
            };
            if (this.type === "doc-start")
              doc.start.push(this.sourceToken);
            this.stack.push(doc);
            return;
          }
        }
        yield {
          type: "error",
          offset: this.offset,
          message: `Unexpected ${this.type} token in YAML stream`,
          source: this.source
        };
      }
      *document(doc) {
        if (doc.value)
          return yield* this.lineEnd(doc);
        switch (this.type) {
          case "doc-start": {
            if (findNonEmptyIndex(doc.start) !== -1) {
              yield* this.pop();
              yield* this.step();
            } else
              doc.start.push(this.sourceToken);
            return;
          }
          case "anchor":
          case "tag":
          case "space":
          case "comment":
          case "newline":
            doc.start.push(this.sourceToken);
            return;
        }
        const bv = this.startBlockValue(doc);
        if (bv)
          this.stack.push(bv);
        else {
          yield {
            type: "error",
            offset: this.offset,
            message: `Unexpected ${this.type} token in YAML document`,
            source: this.source
          };
        }
      }
      *scalar(scalar) {
        if (this.type === "map-value-ind") {
          const prev = getPrevProps(this.peek(2));
          const start = getFirstKeyStartProps(prev);
          let sep;
          if (scalar.end) {
            sep = scalar.end;
            sep.push(this.sourceToken);
            delete scalar.end;
          } else
            sep = [this.sourceToken];
          const map = {
            type: "block-map",
            offset: scalar.offset,
            indent: scalar.indent,
            items: [{ start, key: scalar, sep }]
          };
          this.onKeyLine = true;
          this.stack[this.stack.length - 1] = map;
        } else
          yield* this.lineEnd(scalar);
      }
      *blockScalar(scalar) {
        switch (this.type) {
          case "space":
          case "comment":
          case "newline":
            scalar.props.push(this.sourceToken);
            return;
          case "scalar":
            scalar.source = this.source;
            this.atNewLine = true;
            this.indent = 0;
            if (this.onNewLine) {
              let nl = this.source.indexOf("\n") + 1;
              while (nl !== 0) {
                this.onNewLine(this.offset + nl);
                nl = this.source.indexOf("\n", nl) + 1;
              }
            }
            yield* this.pop();
            break;
          /* istanbul ignore next should not happen */
          default:
            yield* this.pop();
            yield* this.step();
        }
      }
      *blockMap(map) {
        const it = map.items[map.items.length - 1];
        switch (this.type) {
          case "newline":
            this.onKeyLine = false;
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              it.start.push(this.sourceToken);
            }
            return;
          case "space":
          case "comment":
            if (it.value) {
              map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              if (this.atIndentedComment(it.start, map.indent)) {
                const prev = map.items[map.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  arrayPushArray(end, it.start);
                  end.push(this.sourceToken);
                  map.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
        }
        if (this.indent >= map.indent) {
          const atMapIndent = !this.onKeyLine && this.indent === map.indent;
          const atNextItem = atMapIndent && (it.sep || it.explicitKey) && this.type !== "seq-item-ind";
          let start = [];
          if (atNextItem && it.sep && !it.value) {
            const nl = [];
            for (let i = 0; i < it.sep.length; ++i) {
              const st = it.sep[i];
              switch (st.type) {
                case "newline":
                  nl.push(i);
                  break;
                case "space":
                  break;
                case "comment":
                  if (st.indent > map.indent)
                    nl.length = 0;
                  break;
                default:
                  nl.length = 0;
              }
            }
            if (nl.length >= 2)
              start = it.sep.splice(nl[1]);
          }
          switch (this.type) {
            case "anchor":
            case "tag":
              if (atNextItem || it.value) {
                start.push(this.sourceToken);
                map.items.push({ start });
                this.onKeyLine = true;
              } else if (it.sep) {
                it.sep.push(this.sourceToken);
              } else {
                it.start.push(this.sourceToken);
              }
              return;
            case "explicit-key-ind":
              if (!it.sep && !it.explicitKey) {
                it.start.push(this.sourceToken);
                it.explicitKey = true;
              } else if (atNextItem || it.value) {
                start.push(this.sourceToken);
                map.items.push({ start, explicitKey: true });
              } else {
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: [this.sourceToken], explicitKey: true }]
                });
              }
              this.onKeyLine = true;
              return;
            case "map-value-ind":
              if (it.explicitKey) {
                if (!it.sep) {
                  if (includesToken(it.start, "newline")) {
                    Object.assign(it, { key: null, sep: [this.sourceToken] });
                  } else {
                    const start2 = getFirstKeyStartProps(it.start);
                    this.stack.push({
                      type: "block-map",
                      offset: this.offset,
                      indent: this.indent,
                      items: [{ start: start2, key: null, sep: [this.sourceToken] }]
                    });
                  }
                } else if (it.value) {
                  map.items.push({ start: [], key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start, key: null, sep: [this.sourceToken] }]
                  });
                } else if (isFlowToken(it.key) && !includesToken(it.sep, "newline")) {
                  const start2 = getFirstKeyStartProps(it.start);
                  const key = it.key;
                  const sep = it.sep;
                  sep.push(this.sourceToken);
                  delete it.key;
                  delete it.sep;
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: start2, key, sep }]
                  });
                } else if (start.length > 0) {
                  it.sep = it.sep.concat(start, this.sourceToken);
                } else {
                  it.sep.push(this.sourceToken);
                }
              } else {
                if (!it.sep) {
                  Object.assign(it, { key: null, sep: [this.sourceToken] });
                } else if (it.value || atNextItem) {
                  map.items.push({ start, key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: [], key: null, sep: [this.sourceToken] }]
                  });
                } else {
                  it.sep.push(this.sourceToken);
                }
              }
              this.onKeyLine = true;
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs = this.flowScalar(this.type);
              if (atNextItem || it.value) {
                map.items.push({ start, key: fs, sep: [] });
                this.onKeyLine = true;
              } else if (it.sep) {
                this.stack.push(fs);
              } else {
                Object.assign(it, { key: fs, sep: [] });
                this.onKeyLine = true;
              }
              return;
            }
            default: {
              const bv = this.startBlockValue(map);
              if (bv) {
                if (bv.type === "block-seq") {
                  if (!it.explicitKey && it.sep && !includesToken(it.sep, "newline")) {
                    yield* this.pop({
                      type: "error",
                      offset: this.offset,
                      message: "Unexpected block-seq-ind on same line with key",
                      source: this.source
                    });
                    return;
                  }
                } else if (atMapIndent) {
                  map.items.push({ start });
                }
                this.stack.push(bv);
                return;
              }
            }
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *blockSequence(seq) {
        const it = seq.items[seq.items.length - 1];
        switch (this.type) {
          case "newline":
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                seq.items.push({ start: [this.sourceToken] });
            } else
              it.start.push(this.sourceToken);
            return;
          case "space":
          case "comment":
            if (it.value)
              seq.items.push({ start: [this.sourceToken] });
            else {
              if (this.atIndentedComment(it.start, seq.indent)) {
                const prev = seq.items[seq.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  arrayPushArray(end, it.start);
                  end.push(this.sourceToken);
                  seq.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
          case "anchor":
          case "tag":
            if (it.value || this.indent <= seq.indent)
              break;
            it.start.push(this.sourceToken);
            return;
          case "seq-item-ind":
            if (this.indent !== seq.indent)
              break;
            if (it.value || includesToken(it.start, "seq-item-ind"))
              seq.items.push({ start: [this.sourceToken] });
            else
              it.start.push(this.sourceToken);
            return;
        }
        if (this.indent > seq.indent) {
          const bv = this.startBlockValue(seq);
          if (bv) {
            this.stack.push(bv);
            return;
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *flowCollection(fc) {
        const it = fc.items[fc.items.length - 1];
        if (this.type === "flow-error-end") {
          let top;
          do {
            yield* this.pop();
            top = this.peek(1);
          } while (top?.type === "flow-collection");
        } else if (fc.end.length === 0) {
          switch (this.type) {
            case "comma":
            case "explicit-key-ind":
              if (!it || it.sep)
                fc.items.push({ start: [this.sourceToken] });
              else
                it.start.push(this.sourceToken);
              return;
            case "map-value-ind":
              if (!it || it.value)
                fc.items.push({ start: [], key: null, sep: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                Object.assign(it, { key: null, sep: [this.sourceToken] });
              return;
            case "space":
            case "comment":
            case "newline":
            case "anchor":
            case "tag":
              if (!it || it.value)
                fc.items.push({ start: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                it.start.push(this.sourceToken);
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs = this.flowScalar(this.type);
              if (!it || it.value)
                fc.items.push({ start: [], key: fs, sep: [] });
              else if (it.sep)
                this.stack.push(fs);
              else
                Object.assign(it, { key: fs, sep: [] });
              return;
            }
            case "flow-map-end":
            case "flow-seq-end":
              fc.end.push(this.sourceToken);
              return;
          }
          const bv = this.startBlockValue(fc);
          if (bv)
            this.stack.push(bv);
          else {
            yield* this.pop();
            yield* this.step();
          }
        } else {
          const parent = this.peek(2);
          if (parent.type === "block-map" && (this.type === "map-value-ind" && parent.indent === fc.indent || this.type === "newline" && !parent.items[parent.items.length - 1].sep)) {
            yield* this.pop();
            yield* this.step();
          } else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            fixFlowSeqItems(fc);
            const sep = fc.end.splice(1, fc.end.length);
            sep.push(this.sourceToken);
            const map = {
              type: "block-map",
              offset: fc.offset,
              indent: fc.indent,
              items: [{ start, key: fc, sep }]
            };
            this.onKeyLine = true;
            this.stack[this.stack.length - 1] = map;
          } else {
            yield* this.lineEnd(fc);
          }
        }
      }
      flowScalar(type) {
        if (this.onNewLine) {
          let nl = this.source.indexOf("\n") + 1;
          while (nl !== 0) {
            this.onNewLine(this.offset + nl);
            nl = this.source.indexOf("\n", nl) + 1;
          }
        }
        return {
          type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
      }
      startBlockValue(parent) {
        switch (this.type) {
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return this.flowScalar(this.type);
          case "block-scalar-header":
            return {
              type: "block-scalar",
              offset: this.offset,
              indent: this.indent,
              props: [this.sourceToken],
              source: ""
            };
          case "flow-map-start":
          case "flow-seq-start":
            return {
              type: "flow-collection",
              offset: this.offset,
              indent: this.indent,
              start: this.sourceToken,
              items: [],
              end: []
            };
          case "seq-item-ind":
            return {
              type: "block-seq",
              offset: this.offset,
              indent: this.indent,
              items: [{ start: [this.sourceToken] }]
            };
          case "explicit-key-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            start.push(this.sourceToken);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, explicitKey: true }]
            };
          }
          case "map-value-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, key: null, sep: [this.sourceToken] }]
            };
          }
        }
        return null;
      }
      atIndentedComment(start, indent) {
        if (this.type !== "comment")
          return false;
        if (this.indent <= indent)
          return false;
        return start.every((st) => st.type === "newline" || st.type === "space");
      }
      *documentEnd(docEnd) {
        if (this.type !== "doc-mode") {
          if (docEnd.end)
            docEnd.end.push(this.sourceToken);
          else
            docEnd.end = [this.sourceToken];
          if (this.type === "newline")
            yield* this.pop();
        }
      }
      *lineEnd(token) {
        switch (this.type) {
          case "comma":
          case "doc-start":
          case "doc-end":
          case "flow-seq-end":
          case "flow-map-end":
          case "map-value-ind":
            yield* this.pop();
            yield* this.step();
            break;
          case "newline":
            this.onKeyLine = false;
          // fallthrough
          case "space":
          case "comment":
          default:
            if (token.end)
              token.end.push(this.sourceToken);
            else
              token.end = [this.sourceToken];
            if (this.type === "newline")
              yield* this.pop();
        }
      }
    };
    exports2.Parser = Parser;
  }
});

// ../../node_modules/yaml/dist/public-api.js
var require_public_api = __commonJS({
  "../../node_modules/yaml/dist/public-api.js"(exports2) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var errors = require_errors();
    var log = require_log();
    var identity = require_identity();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    function parseOptions(options) {
      const prettyErrors = options.prettyErrors !== false;
      const lineCounter$1 = options.lineCounter || prettyErrors && new lineCounter.LineCounter() || null;
      return { lineCounter: lineCounter$1, prettyErrors };
    }
    function parseAllDocuments(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      const docs = Array.from(composer$1.compose(parser$1.parse(source)));
      if (prettyErrors && lineCounter2)
        for (const doc of docs) {
          doc.errors.forEach(errors.prettifyError(source, lineCounter2));
          doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
        }
      if (docs.length > 0)
        return docs;
      return Object.assign([], { empty: true }, composer$1.streamInfo());
    }
    function parseDocument(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      let doc = null;
      for (const _doc of composer$1.compose(parser$1.parse(source), true, source.length)) {
        if (!doc)
          doc = _doc;
        else if (doc.options.logLevel !== "silent") {
          doc.errors.push(new errors.YAMLParseError(_doc.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
          break;
        }
      }
      if (prettyErrors && lineCounter2) {
        doc.errors.forEach(errors.prettifyError(source, lineCounter2));
        doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
      }
      return doc;
    }
    function parse2(src, reviver, options) {
      let _reviver = void 0;
      if (typeof reviver === "function") {
        _reviver = reviver;
      } else if (options === void 0 && reviver && typeof reviver === "object") {
        options = reviver;
      }
      const doc = parseDocument(src, options);
      if (!doc)
        return null;
      doc.warnings.forEach((warning) => log.warn(doc.options.logLevel, warning));
      if (doc.errors.length > 0) {
        if (doc.options.logLevel !== "silent")
          throw doc.errors[0];
        else
          doc.errors = [];
      }
      return doc.toJS(Object.assign({ reviver: _reviver }, options));
    }
    function stringify2(value, replacer, options) {
      let _replacer = null;
      if (typeof replacer === "function" || Array.isArray(replacer)) {
        _replacer = replacer;
      } else if (options === void 0 && replacer) {
        options = replacer;
      }
      if (typeof options === "string")
        options = options.length;
      if (typeof options === "number") {
        const indent = Math.round(options);
        options = indent < 1 ? void 0 : indent > 8 ? { indent: 8 } : { indent };
      }
      if (value === void 0) {
        const { keepUndefined } = options ?? replacer ?? {};
        if (!keepUndefined)
          return void 0;
      }
      if (identity.isDocument(value) && !_replacer)
        return value.toString(options);
      return new Document.Document(value, _replacer, options).toString(options);
    }
    exports2.parse = parse2;
    exports2.parseAllDocuments = parseAllDocuments;
    exports2.parseDocument = parseDocument;
    exports2.stringify = stringify2;
  }
});

// ../../node_modules/yaml/dist/index.js
var require_dist = __commonJS({
  "../../node_modules/yaml/dist/index.js"(exports2) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var Schema = require_Schema();
    var errors = require_errors();
    var Alias = require_Alias();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var cst = require_cst();
    var lexer = require_lexer();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    var publicApi = require_public_api();
    var visit = require_visit();
    exports2.Composer = composer.Composer;
    exports2.Document = Document.Document;
    exports2.Schema = Schema.Schema;
    exports2.YAMLError = errors.YAMLError;
    exports2.YAMLParseError = errors.YAMLParseError;
    exports2.YAMLWarning = errors.YAMLWarning;
    exports2.Alias = Alias.Alias;
    exports2.isAlias = identity.isAlias;
    exports2.isCollection = identity.isCollection;
    exports2.isDocument = identity.isDocument;
    exports2.isMap = identity.isMap;
    exports2.isNode = identity.isNode;
    exports2.isPair = identity.isPair;
    exports2.isScalar = identity.isScalar;
    exports2.isSeq = identity.isSeq;
    exports2.Pair = Pair.Pair;
    exports2.Scalar = Scalar.Scalar;
    exports2.YAMLMap = YAMLMap.YAMLMap;
    exports2.YAMLSeq = YAMLSeq.YAMLSeq;
    exports2.CST = cst;
    exports2.Lexer = lexer.Lexer;
    exports2.LineCounter = lineCounter.LineCounter;
    exports2.Parser = parser.Parser;
    exports2.parse = publicApi.parse;
    exports2.parseAllDocuments = publicApi.parseAllDocuments;
    exports2.parseDocument = publicApi.parseDocument;
    exports2.stringify = publicApi.stringify;
    exports2.visit = visit.visit;
    exports2.visitAsync = visit.visitAsync;
  }
});

// ../../node_modules/chess.js/dist/cjs/chess.js
var require_chess = __commonJS({
  "../../node_modules/chess.js/dist/cjs/chess.js"(exports2) {
    "use strict";
    function rootNode(comment) {
      return comment !== null ? { comment, variations: [] } : { variations: [] };
    }
    function node(move, suffix, nag, comment, variations) {
      const node2 = { move, variations };
      if (suffix) {
        node2.suffix = suffix;
      }
      if (nag) {
        node2.nag = nag;
      }
      if (comment !== null) {
        node2.comment = comment;
      }
      return node2;
    }
    function lineToTree(...nodes) {
      const [root, ...rest] = nodes;
      let parent = root;
      for (const child of rest) {
        if (child !== null) {
          parent.variations = [child, ...child.variations];
          child.variations = [];
          parent = child;
        }
      }
      return root;
    }
    function pgn(headers, game) {
      if (game.marker && game.marker.comment) {
        let node2 = game.root;
        while (true) {
          const next = node2.variations[0];
          if (!next) {
            node2.comment = game.marker.comment;
            break;
          }
          node2 = next;
        }
      }
      return {
        headers,
        root: game.root,
        result: (game.marker && game.marker.result) ?? void 0
      };
    }
    function peg$subclass(child, parent) {
      function C() {
        this.constructor = child;
      }
      C.prototype = parent.prototype;
      child.prototype = new C();
    }
    function peg$SyntaxError(message, expected, found, location) {
      var self = Error.call(this, message);
      if (Object.setPrototypeOf) {
        Object.setPrototypeOf(self, peg$SyntaxError.prototype);
      }
      self.expected = expected;
      self.found = found;
      self.location = location;
      self.name = "SyntaxError";
      return self;
    }
    peg$subclass(peg$SyntaxError, Error);
    function peg$padEnd(str, targetLength, padString) {
      padString = padString || " ";
      if (str.length > targetLength) {
        return str;
      }
      targetLength -= str.length;
      padString += padString.repeat(targetLength);
      return str + padString.slice(0, targetLength);
    }
    peg$SyntaxError.prototype.format = function(sources) {
      var str = "Error: " + this.message;
      if (this.location) {
        var src = null;
        var k;
        for (k = 0; k < sources.length; k++) {
          if (sources[k].source === this.location.source) {
            src = sources[k].text.split(/\r\n|\n|\r/g);
            break;
          }
        }
        var s = this.location.start;
        var offset_s = this.location.source && typeof this.location.source.offset === "function" ? this.location.source.offset(s) : s;
        var loc = this.location.source + ":" + offset_s.line + ":" + offset_s.column;
        if (src) {
          var e = this.location.end;
          var filler = peg$padEnd("", offset_s.line.toString().length, " ");
          var line = src[s.line - 1];
          var last = s.line === e.line ? e.column : line.length + 1;
          var hatLen = last - s.column || 1;
          str += "\n --> " + loc + "\n" + filler + " |\n" + offset_s.line + " | " + line + "\n" + filler + " | " + peg$padEnd("", s.column - 1, " ") + peg$padEnd("", hatLen, "^");
        } else {
          str += "\n at " + loc;
        }
      }
      return str;
    };
    peg$SyntaxError.buildMessage = function(expected, found) {
      var DESCRIBE_EXPECTATION_FNS = {
        literal: function(expectation) {
          return '"' + literalEscape(expectation.text) + '"';
        },
        class: function(expectation) {
          var escapedParts = expectation.parts.map(function(part) {
            return Array.isArray(part) ? classEscape(part[0]) + "-" + classEscape(part[1]) : classEscape(part);
          });
          return "[" + (expectation.inverted ? "^" : "") + escapedParts.join("") + "]";
        },
        any: function() {
          return "any character";
        },
        end: function() {
          return "end of input";
        },
        other: function(expectation) {
          return expectation.description;
        }
      };
      function hex(ch) {
        return ch.charCodeAt(0).toString(16).toUpperCase();
      }
      function literalEscape(s) {
        return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, function(ch) {
          return "\\x0" + hex(ch);
        }).replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) {
          return "\\x" + hex(ch);
        });
      }
      function classEscape(s) {
        return s.replace(/\\/g, "\\\\").replace(/\]/g, "\\]").replace(/\^/g, "\\^").replace(/-/g, "\\-").replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, function(ch) {
          return "\\x0" + hex(ch);
        }).replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) {
          return "\\x" + hex(ch);
        });
      }
      function describeExpectation(expectation) {
        return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
      }
      function describeExpected(expected2) {
        var descriptions = expected2.map(describeExpectation);
        var i, j;
        descriptions.sort();
        if (descriptions.length > 0) {
          for (i = 1, j = 1; i < descriptions.length; i++) {
            if (descriptions[i - 1] !== descriptions[i]) {
              descriptions[j] = descriptions[i];
              j++;
            }
          }
          descriptions.length = j;
        }
        switch (descriptions.length) {
          case 1:
            return descriptions[0];
          case 2:
            return descriptions[0] + " or " + descriptions[1];
          default:
            return descriptions.slice(0, -1).join(", ") + ", or " + descriptions[descriptions.length - 1];
        }
      }
      function describeFound(found2) {
        return found2 ? '"' + literalEscape(found2) + '"' : "end of input";
      }
      return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
    };
    function peg$parse(input2, options) {
      options = options !== void 0 ? options : {};
      var peg$FAILED = {};
      var peg$source = options.grammarSource;
      var peg$startRuleFunctions = { pgn: peg$parsepgn };
      var peg$startRuleFunction = peg$parsepgn;
      var peg$c0 = "[";
      var peg$c1 = '"';
      var peg$c2 = "]";
      var peg$c3 = ".";
      var peg$c4 = "O-O-O";
      var peg$c5 = "O-O";
      var peg$c6 = "0-0-0";
      var peg$c7 = "0-0";
      var peg$c8 = "$";
      var peg$c9 = "{";
      var peg$c10 = "}";
      var peg$c11 = ";";
      var peg$c12 = "(";
      var peg$c13 = ")";
      var peg$c14 = "1-0";
      var peg$c15 = "0-1";
      var peg$c16 = "1/2-1/2";
      var peg$c17 = "*";
      var peg$r0 = /^[a-zA-Z]/;
      var peg$r1 = /^[^"]/;
      var peg$r2 = /^[0-9]/;
      var peg$r3 = /^[.]/;
      var peg$r4 = /^[a-zA-Z1-8\-=]/;
      var peg$r5 = /^[+#]/;
      var peg$r6 = /^[!?]/;
      var peg$r7 = /^[^}]/;
      var peg$r8 = /^[^\r\n]/;
      var peg$r9 = /^[ \t\r\n]/;
      var peg$e0 = peg$otherExpectation("tag pair");
      var peg$e1 = peg$literalExpectation("[", false);
      var peg$e2 = peg$literalExpectation('"', false);
      var peg$e3 = peg$literalExpectation("]", false);
      var peg$e4 = peg$otherExpectation("tag name");
      var peg$e5 = peg$classExpectation([["a", "z"], ["A", "Z"]], false, false);
      var peg$e6 = peg$otherExpectation("tag value");
      var peg$e7 = peg$classExpectation(['"'], true, false);
      var peg$e8 = peg$otherExpectation("move number");
      var peg$e9 = peg$classExpectation([["0", "9"]], false, false);
      var peg$e10 = peg$literalExpectation(".", false);
      var peg$e11 = peg$classExpectation(["."], false, false);
      var peg$e12 = peg$otherExpectation("standard algebraic notation");
      var peg$e13 = peg$literalExpectation("O-O-O", false);
      var peg$e14 = peg$literalExpectation("O-O", false);
      var peg$e15 = peg$literalExpectation("0-0-0", false);
      var peg$e16 = peg$literalExpectation("0-0", false);
      var peg$e17 = peg$classExpectation([["a", "z"], ["A", "Z"], ["1", "8"], "-", "="], false, false);
      var peg$e18 = peg$classExpectation(["+", "#"], false, false);
      var peg$e19 = peg$otherExpectation("suffix annotation");
      var peg$e20 = peg$classExpectation(["!", "?"], false, false);
      var peg$e21 = peg$otherExpectation("NAG");
      var peg$e22 = peg$literalExpectation("$", false);
      var peg$e23 = peg$otherExpectation("brace comment");
      var peg$e24 = peg$literalExpectation("{", false);
      var peg$e25 = peg$classExpectation(["}"], true, false);
      var peg$e26 = peg$literalExpectation("}", false);
      var peg$e27 = peg$otherExpectation("rest of line comment");
      var peg$e28 = peg$literalExpectation(";", false);
      var peg$e29 = peg$classExpectation(["\r", "\n"], true, false);
      var peg$e30 = peg$otherExpectation("variation");
      var peg$e31 = peg$literalExpectation("(", false);
      var peg$e32 = peg$literalExpectation(")", false);
      var peg$e33 = peg$otherExpectation("game termination marker");
      var peg$e34 = peg$literalExpectation("1-0", false);
      var peg$e35 = peg$literalExpectation("0-1", false);
      var peg$e36 = peg$literalExpectation("1/2-1/2", false);
      var peg$e37 = peg$literalExpectation("*", false);
      var peg$e38 = peg$otherExpectation("whitespace");
      var peg$e39 = peg$classExpectation([" ", "	", "\r", "\n"], false, false);
      var peg$f0 = function(headers, game) {
        return pgn(headers, game);
      };
      var peg$f1 = function(tagPairs) {
        return Object.fromEntries(tagPairs);
      };
      var peg$f2 = function(tagName, tagValue) {
        return [tagName, tagValue];
      };
      var peg$f3 = function(root, marker) {
        return { root, marker };
      };
      var peg$f4 = function(comment, moves2) {
        return lineToTree(rootNode(comment), ...moves2.flat());
      };
      var peg$f5 = function(san, suffix, nag, comment, variations) {
        return node(san, suffix, nag, comment, variations);
      };
      var peg$f6 = function(nag) {
        return nag;
      };
      var peg$f7 = function(comment) {
        return comment.replace(/[\r\n]+/g, " ");
      };
      var peg$f8 = function(comment) {
        return comment.trim();
      };
      var peg$f9 = function(line) {
        return line;
      };
      var peg$f10 = function(result, comment) {
        return { result, comment };
      };
      var peg$currPos = options.peg$currPos | 0;
      var peg$posDetailsCache = [{ line: 1, column: 1 }];
      var peg$maxFailPos = peg$currPos;
      var peg$maxFailExpected = options.peg$maxFailExpected || [];
      var peg$silentFails = options.peg$silentFails | 0;
      var peg$result;
      if (options.startRule) {
        if (!(options.startRule in peg$startRuleFunctions)) {
          throw new Error(`Can't start parsing from rule "` + options.startRule + '".');
        }
        peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
      }
      function peg$literalExpectation(text10, ignoreCase) {
        return { type: "literal", text: text10, ignoreCase };
      }
      function peg$classExpectation(parts, inverted, ignoreCase) {
        return { type: "class", parts, inverted, ignoreCase };
      }
      function peg$endExpectation() {
        return { type: "end" };
      }
      function peg$otherExpectation(description) {
        return { type: "other", description };
      }
      function peg$computePosDetails(pos) {
        var details = peg$posDetailsCache[pos];
        var p;
        if (details) {
          return details;
        } else {
          if (pos >= peg$posDetailsCache.length) {
            p = peg$posDetailsCache.length - 1;
          } else {
            p = pos;
            while (!peg$posDetailsCache[--p]) {
            }
          }
          details = peg$posDetailsCache[p];
          details = {
            line: details.line,
            column: details.column
          };
          while (p < pos) {
            if (input2.charCodeAt(p) === 10) {
              details.line++;
              details.column = 1;
            } else {
              details.column++;
            }
            p++;
          }
          peg$posDetailsCache[pos] = details;
          return details;
        }
      }
      function peg$computeLocation(startPos, endPos, offset) {
        var startPosDetails = peg$computePosDetails(startPos);
        var endPosDetails = peg$computePosDetails(endPos);
        var res = {
          source: peg$source,
          start: {
            offset: startPos,
            line: startPosDetails.line,
            column: startPosDetails.column
          },
          end: {
            offset: endPos,
            line: endPosDetails.line,
            column: endPosDetails.column
          }
        };
        return res;
      }
      function peg$fail(expected) {
        if (peg$currPos < peg$maxFailPos) {
          return;
        }
        if (peg$currPos > peg$maxFailPos) {
          peg$maxFailPos = peg$currPos;
          peg$maxFailExpected = [];
        }
        peg$maxFailExpected.push(expected);
      }
      function peg$buildStructuredError(expected, found, location) {
        return new peg$SyntaxError(
          peg$SyntaxError.buildMessage(expected, found),
          expected,
          found,
          location
        );
      }
      function peg$parsepgn() {
        var s0, s1, s2;
        s0 = peg$currPos;
        s1 = peg$parsetagPairSection();
        s2 = peg$parsemoveTextSection();
        s0 = peg$f0(s1, s2);
        return s0;
      }
      function peg$parsetagPairSection() {
        var s0, s1, s2;
        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parsetagPair();
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parsetagPair();
        }
        s2 = peg$parse_();
        s0 = peg$f1(s1);
        return s0;
      }
      function peg$parsetagPair() {
        var s0, s2, s4, s6, s7, s8, s10;
        peg$silentFails++;
        s0 = peg$currPos;
        peg$parse_();
        if (input2.charCodeAt(peg$currPos) === 91) {
          s2 = peg$c0;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e1);
          }
        }
        if (s2 !== peg$FAILED) {
          peg$parse_();
          s4 = peg$parsetagName();
          if (s4 !== peg$FAILED) {
            peg$parse_();
            if (input2.charCodeAt(peg$currPos) === 34) {
              s6 = peg$c1;
              peg$currPos++;
            } else {
              s6 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e2);
              }
            }
            if (s6 !== peg$FAILED) {
              s7 = peg$parsetagValue();
              if (input2.charCodeAt(peg$currPos) === 34) {
                s8 = peg$c1;
                peg$currPos++;
              } else {
                s8 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$e2);
                }
              }
              if (s8 !== peg$FAILED) {
                peg$parse_();
                if (input2.charCodeAt(peg$currPos) === 93) {
                  s10 = peg$c2;
                  peg$currPos++;
                } else {
                  s10 = peg$FAILED;
                  if (peg$silentFails === 0) {
                    peg$fail(peg$e3);
                  }
                }
                if (s10 !== peg$FAILED) {
                  s0 = peg$f2(s4, s7);
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          if (peg$silentFails === 0) {
            peg$fail(peg$e0);
          }
        }
        return s0;
      }
      function peg$parsetagName() {
        var s0, s1, s2;
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = [];
        s2 = input2.charAt(peg$currPos);
        if (peg$r0.test(s2)) {
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e5);
          }
        }
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = input2.charAt(peg$currPos);
            if (peg$r0.test(s2)) {
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e5);
              }
            }
          }
        } else {
          s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
          s0 = input2.substring(s0, peg$currPos);
        } else {
          s0 = s1;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e4);
          }
        }
        return s0;
      }
      function peg$parsetagValue() {
        var s0, s1, s2;
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = [];
        s2 = input2.charAt(peg$currPos);
        if (peg$r1.test(s2)) {
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e7);
          }
        }
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = input2.charAt(peg$currPos);
          if (peg$r1.test(s2)) {
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e7);
            }
          }
        }
        s0 = input2.substring(s0, peg$currPos);
        peg$silentFails--;
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e6);
        }
        return s0;
      }
      function peg$parsemoveTextSection() {
        var s0, s1, s3;
        s0 = peg$currPos;
        s1 = peg$parseline();
        peg$parse_();
        s3 = peg$parsegameTerminationMarker();
        if (s3 === peg$FAILED) {
          s3 = null;
        }
        peg$parse_();
        s0 = peg$f3(s1, s3);
        return s0;
      }
      function peg$parseline() {
        var s0, s1, s2, s3;
        s0 = peg$currPos;
        s1 = peg$parsecomment();
        if (s1 === peg$FAILED) {
          s1 = null;
        }
        s2 = [];
        s3 = peg$parsemove();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parsemove();
        }
        s0 = peg$f4(s1, s2);
        return s0;
      }
      function peg$parsemove() {
        var s0, s4, s5, s6, s7, s8, s9, s10;
        s0 = peg$currPos;
        peg$parse_();
        peg$parsemoveNumber();
        peg$parse_();
        s4 = peg$parsesan();
        if (s4 !== peg$FAILED) {
          s5 = peg$parsesuffixAnnotation();
          if (s5 === peg$FAILED) {
            s5 = null;
          }
          s6 = [];
          s7 = peg$parsenag();
          while (s7 !== peg$FAILED) {
            s6.push(s7);
            s7 = peg$parsenag();
          }
          s7 = peg$parse_();
          s8 = peg$parsecomment();
          if (s8 === peg$FAILED) {
            s8 = null;
          }
          s9 = [];
          s10 = peg$parsevariation();
          while (s10 !== peg$FAILED) {
            s9.push(s10);
            s10 = peg$parsevariation();
          }
          s0 = peg$f5(s4, s5, s6, s8, s9);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        return s0;
      }
      function peg$parsemoveNumber() {
        var s0, s1, s2, s3, s4, s5;
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = [];
        s2 = input2.charAt(peg$currPos);
        if (peg$r2.test(s2)) {
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e9);
          }
        }
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = input2.charAt(peg$currPos);
          if (peg$r2.test(s2)) {
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e9);
            }
          }
        }
        if (input2.charCodeAt(peg$currPos) === 46) {
          s2 = peg$c3;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e10);
          }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parse_();
          s4 = [];
          s5 = input2.charAt(peg$currPos);
          if (peg$r3.test(s5)) {
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e11);
            }
          }
          while (s5 !== peg$FAILED) {
            s4.push(s5);
            s5 = input2.charAt(peg$currPos);
            if (peg$r3.test(s5)) {
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e11);
              }
            }
          }
          s1 = [s1, s2, s3, s4];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e8);
          }
        }
        return s0;
      }
      function peg$parsesan() {
        var s0, s1, s2, s3, s4, s5;
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = peg$currPos;
        if (input2.substr(peg$currPos, 5) === peg$c4) {
          s2 = peg$c4;
          peg$currPos += 5;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e13);
          }
        }
        if (s2 === peg$FAILED) {
          if (input2.substr(peg$currPos, 3) === peg$c5) {
            s2 = peg$c5;
            peg$currPos += 3;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e14);
            }
          }
          if (s2 === peg$FAILED) {
            if (input2.substr(peg$currPos, 5) === peg$c6) {
              s2 = peg$c6;
              peg$currPos += 5;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e15);
              }
            }
            if (s2 === peg$FAILED) {
              if (input2.substr(peg$currPos, 3) === peg$c7) {
                s2 = peg$c7;
                peg$currPos += 3;
              } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$e16);
                }
              }
              if (s2 === peg$FAILED) {
                s2 = peg$currPos;
                s3 = input2.charAt(peg$currPos);
                if (peg$r0.test(s3)) {
                  peg$currPos++;
                } else {
                  s3 = peg$FAILED;
                  if (peg$silentFails === 0) {
                    peg$fail(peg$e5);
                  }
                }
                if (s3 !== peg$FAILED) {
                  s4 = [];
                  s5 = input2.charAt(peg$currPos);
                  if (peg$r4.test(s5)) {
                    peg$currPos++;
                  } else {
                    s5 = peg$FAILED;
                    if (peg$silentFails === 0) {
                      peg$fail(peg$e17);
                    }
                  }
                  if (s5 !== peg$FAILED) {
                    while (s5 !== peg$FAILED) {
                      s4.push(s5);
                      s5 = input2.charAt(peg$currPos);
                      if (peg$r4.test(s5)) {
                        peg$currPos++;
                      } else {
                        s5 = peg$FAILED;
                        if (peg$silentFails === 0) {
                          peg$fail(peg$e17);
                        }
                      }
                    }
                  } else {
                    s4 = peg$FAILED;
                  }
                  if (s4 !== peg$FAILED) {
                    s3 = [s3, s4];
                    s2 = s3;
                  } else {
                    peg$currPos = s2;
                    s2 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s2;
                  s2 = peg$FAILED;
                }
              }
            }
          }
        }
        if (s2 !== peg$FAILED) {
          s3 = input2.charAt(peg$currPos);
          if (peg$r5.test(s3)) {
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e18);
            }
          }
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          s2 = [s2, s3];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
          s0 = input2.substring(s0, peg$currPos);
        } else {
          s0 = s1;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e12);
          }
        }
        return s0;
      }
      function peg$parsesuffixAnnotation() {
        var s0, s1, s2;
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = [];
        s2 = input2.charAt(peg$currPos);
        if (peg$r6.test(s2)) {
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e20);
          }
        }
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          if (s1.length >= 2) {
            s2 = peg$FAILED;
          } else {
            s2 = input2.charAt(peg$currPos);
            if (peg$r6.test(s2)) {
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e20);
              }
            }
          }
        }
        if (s1.length < 1) {
          peg$currPos = s0;
          s0 = peg$FAILED;
        } else {
          s0 = s1;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e19);
          }
        }
        return s0;
      }
      function peg$parsenag() {
        var s0, s2, s3, s4, s5;
        peg$silentFails++;
        s0 = peg$currPos;
        peg$parse_();
        if (input2.charCodeAt(peg$currPos) === 36) {
          s2 = peg$c8;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e22);
          }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$currPos;
          s4 = [];
          s5 = input2.charAt(peg$currPos);
          if (peg$r2.test(s5)) {
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e9);
            }
          }
          if (s5 !== peg$FAILED) {
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              s5 = input2.charAt(peg$currPos);
              if (peg$r2.test(s5)) {
                peg$currPos++;
              } else {
                s5 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$e9);
                }
              }
            }
          } else {
            s4 = peg$FAILED;
          }
          if (s4 !== peg$FAILED) {
            s3 = input2.substring(s3, peg$currPos);
          } else {
            s3 = s4;
          }
          if (s3 !== peg$FAILED) {
            s0 = peg$f6(s3);
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          if (peg$silentFails === 0) {
            peg$fail(peg$e21);
          }
        }
        return s0;
      }
      function peg$parsecomment() {
        var s0;
        s0 = peg$parsebraceComment();
        if (s0 === peg$FAILED) {
          s0 = peg$parserestOfLineComment();
        }
        return s0;
      }
      function peg$parsebraceComment() {
        var s0, s1, s2, s3, s4;
        peg$silentFails++;
        s0 = peg$currPos;
        if (input2.charCodeAt(peg$currPos) === 123) {
          s1 = peg$c9;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e24);
          }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$currPos;
          s3 = [];
          s4 = input2.charAt(peg$currPos);
          if (peg$r7.test(s4)) {
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e25);
            }
          }
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = input2.charAt(peg$currPos);
            if (peg$r7.test(s4)) {
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e25);
              }
            }
          }
          s2 = input2.substring(s2, peg$currPos);
          if (input2.charCodeAt(peg$currPos) === 125) {
            s3 = peg$c10;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e26);
            }
          }
          if (s3 !== peg$FAILED) {
            s0 = peg$f7(s2);
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e23);
          }
        }
        return s0;
      }
      function peg$parserestOfLineComment() {
        var s0, s1, s2, s3, s4;
        peg$silentFails++;
        s0 = peg$currPos;
        if (input2.charCodeAt(peg$currPos) === 59) {
          s1 = peg$c11;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e28);
          }
        }
        if (s1 !== peg$FAILED) {
          s2 = peg$currPos;
          s3 = [];
          s4 = input2.charAt(peg$currPos);
          if (peg$r8.test(s4)) {
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e29);
            }
          }
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = input2.charAt(peg$currPos);
            if (peg$r8.test(s4)) {
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e29);
              }
            }
          }
          s2 = input2.substring(s2, peg$currPos);
          s0 = peg$f8(s2);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e27);
          }
        }
        return s0;
      }
      function peg$parsevariation() {
        var s0, s2, s3, s5;
        peg$silentFails++;
        s0 = peg$currPos;
        peg$parse_();
        if (input2.charCodeAt(peg$currPos) === 40) {
          s2 = peg$c12;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e31);
          }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseline();
          if (s3 !== peg$FAILED) {
            peg$parse_();
            if (input2.charCodeAt(peg$currPos) === 41) {
              s5 = peg$c13;
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e32);
              }
            }
            if (s5 !== peg$FAILED) {
              s0 = peg$f9(s3);
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          if (peg$silentFails === 0) {
            peg$fail(peg$e30);
          }
        }
        return s0;
      }
      function peg$parsegameTerminationMarker() {
        var s0, s1, s3;
        peg$silentFails++;
        s0 = peg$currPos;
        if (input2.substr(peg$currPos, 3) === peg$c14) {
          s1 = peg$c14;
          peg$currPos += 3;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e34);
          }
        }
        if (s1 === peg$FAILED) {
          if (input2.substr(peg$currPos, 3) === peg$c15) {
            s1 = peg$c15;
            peg$currPos += 3;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e35);
            }
          }
          if (s1 === peg$FAILED) {
            if (input2.substr(peg$currPos, 7) === peg$c16) {
              s1 = peg$c16;
              peg$currPos += 7;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e36);
              }
            }
            if (s1 === peg$FAILED) {
              if (input2.charCodeAt(peg$currPos) === 42) {
                s1 = peg$c17;
                peg$currPos++;
              } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$e37);
                }
              }
            }
          }
        }
        if (s1 !== peg$FAILED) {
          peg$parse_();
          s3 = peg$parsecomment();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          s0 = peg$f10(s1, s3);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e33);
          }
        }
        return s0;
      }
      function peg$parse_() {
        var s0, s1;
        peg$silentFails++;
        s0 = [];
        s1 = input2.charAt(peg$currPos);
        if (peg$r9.test(s1)) {
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e39);
          }
        }
        while (s1 !== peg$FAILED) {
          s0.push(s1);
          s1 = input2.charAt(peg$currPos);
          if (peg$r9.test(s1)) {
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e39);
            }
          }
        }
        peg$silentFails--;
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e38);
        }
        return s0;
      }
      peg$result = peg$startRuleFunction();
      if (options.peg$library) {
        return (
          /** @type {any} */
          {
            peg$result,
            peg$currPos,
            peg$FAILED,
            peg$maxFailExpected,
            peg$maxFailPos
          }
        );
      }
      if (peg$result !== peg$FAILED && peg$currPos === input2.length) {
        return peg$result;
      } else {
        if (peg$result !== peg$FAILED && peg$currPos < input2.length) {
          peg$fail(peg$endExpectation());
        }
        throw peg$buildStructuredError(
          peg$maxFailExpected,
          peg$maxFailPos < input2.length ? input2.charAt(peg$maxFailPos) : null,
          peg$maxFailPos < input2.length ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1) : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
        );
      }
    }
    var MASK64 = 0xffffffffffffffffn;
    function rotl(x, k) {
      return (x << k | x >> 64n - k) & 0xffffffffffffffffn;
    }
    function wrappingMul(x, y) {
      return x * y & MASK64;
    }
    function xoroshiro128(state) {
      return function() {
        let s0 = BigInt(state & MASK64);
        let s1 = BigInt(state >> 64n & MASK64);
        const result = wrappingMul(rotl(wrappingMul(s0, 5n), 7n), 9n);
        s1 ^= s0;
        s0 = (rotl(s0, 24n) ^ s1 ^ s1 << 16n) & MASK64;
        s1 = rotl(s1, 37n);
        state = s1 << 64n | s0;
        return result;
      };
    }
    var rand = xoroshiro128(0xa187eb39cdcaed8f31c4b365b102e01en);
    var PIECE_KEYS = Array.from({ length: 2 }, () => Array.from({ length: 6 }, () => Array.from({ length: 128 }, () => rand())));
    var EP_KEYS = Array.from({ length: 8 }, () => rand());
    var CASTLING_KEYS = Array.from({ length: 16 }, () => rand());
    var SIDE_KEY = rand();
    var WHITE = "w";
    var BLACK = "b";
    var PAWN = "p";
    var KNIGHT = "n";
    var BISHOP = "b";
    var ROOK = "r";
    var QUEEN = "q";
    var KING = "k";
    var DEFAULT_POSITION = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    var Move = class {
      color;
      from;
      to;
      piece;
      captured;
      promotion;
      /**
       * @deprecated This field is deprecated and will be removed in version 2.0.0.
       * Please use move descriptor functions instead: `isCapture`, `isPromotion`,
       * `isEnPassant`, `isKingsideCastle`, `isQueensideCastle`, `isCastle`, and
       * `isBigPawn`
       */
      flags;
      san;
      lan;
      before;
      after;
      constructor(chess, internal) {
        const { color, piece, from, to, flags, captured, promotion } = internal;
        const fromAlgebraic = algebraic(from);
        const toAlgebraic = algebraic(to);
        this.color = color;
        this.piece = piece;
        this.from = fromAlgebraic;
        this.to = toAlgebraic;
        this.san = chess["_moveToSan"](internal, chess["_moves"]({ legal: true }));
        this.lan = fromAlgebraic + toAlgebraic;
        this.before = chess.fen();
        chess["_makeMove"](internal);
        this.after = chess.fen();
        chess["_undoMove"]();
        this.flags = "";
        for (const flag in BITS) {
          if (BITS[flag] & flags) {
            this.flags += FLAGS[flag];
          }
        }
        if (captured) {
          this.captured = captured;
        }
        if (promotion) {
          this.promotion = promotion;
          this.lan += promotion;
        }
      }
      isCapture() {
        return this.flags.indexOf(FLAGS["CAPTURE"]) > -1;
      }
      isPromotion() {
        return this.flags.indexOf(FLAGS["PROMOTION"]) > -1;
      }
      isEnPassant() {
        return this.flags.indexOf(FLAGS["EP_CAPTURE"]) > -1;
      }
      isKingsideCastle() {
        return this.flags.indexOf(FLAGS["KSIDE_CASTLE"]) > -1;
      }
      isQueensideCastle() {
        return this.flags.indexOf(FLAGS["QSIDE_CASTLE"]) > -1;
      }
      isBigPawn() {
        return this.flags.indexOf(FLAGS["BIG_PAWN"]) > -1;
      }
    };
    var EMPTY = -1;
    var FLAGS = {
      NORMAL: "n",
      CAPTURE: "c",
      BIG_PAWN: "b",
      EP_CAPTURE: "e",
      PROMOTION: "p",
      KSIDE_CASTLE: "k",
      QSIDE_CASTLE: "q",
      NULL_MOVE: "-"
    };
    var SQUARES = [
      "a8",
      "b8",
      "c8",
      "d8",
      "e8",
      "f8",
      "g8",
      "h8",
      "a7",
      "b7",
      "c7",
      "d7",
      "e7",
      "f7",
      "g7",
      "h7",
      "a6",
      "b6",
      "c6",
      "d6",
      "e6",
      "f6",
      "g6",
      "h6",
      "a5",
      "b5",
      "c5",
      "d5",
      "e5",
      "f5",
      "g5",
      "h5",
      "a4",
      "b4",
      "c4",
      "d4",
      "e4",
      "f4",
      "g4",
      "h4",
      "a3",
      "b3",
      "c3",
      "d3",
      "e3",
      "f3",
      "g3",
      "h3",
      "a2",
      "b2",
      "c2",
      "d2",
      "e2",
      "f2",
      "g2",
      "h2",
      "a1",
      "b1",
      "c1",
      "d1",
      "e1",
      "f1",
      "g1",
      "h1"
    ];
    var BITS = {
      NORMAL: 1,
      CAPTURE: 2,
      BIG_PAWN: 4,
      EP_CAPTURE: 8,
      PROMOTION: 16,
      KSIDE_CASTLE: 32,
      QSIDE_CASTLE: 64,
      NULL_MOVE: 128
    };
    var SEVEN_TAG_ROSTER = {
      Event: "?",
      Site: "?",
      Date: "????.??.??",
      Round: "?",
      White: "?",
      Black: "?",
      Result: "*"
    };
    var SUPLEMENTAL_TAGS = {
      WhiteTitle: null,
      BlackTitle: null,
      WhiteElo: null,
      BlackElo: null,
      WhiteUSCF: null,
      BlackUSCF: null,
      WhiteNA: null,
      BlackNA: null,
      WhiteType: null,
      BlackType: null,
      EventDate: null,
      EventSponsor: null,
      Section: null,
      Stage: null,
      Board: null,
      Opening: null,
      Variation: null,
      SubVariation: null,
      ECO: null,
      NIC: null,
      Time: null,
      UTCTime: null,
      UTCDate: null,
      TimeControl: null,
      SetUp: null,
      FEN: null,
      Termination: null,
      Annotator: null,
      Mode: null,
      PlyCount: null
    };
    var HEADER_TEMPLATE = {
      ...SEVEN_TAG_ROSTER,
      ...SUPLEMENTAL_TAGS
    };
    var Ox88 = {
      a8: 0,
      b8: 1,
      c8: 2,
      d8: 3,
      e8: 4,
      f8: 5,
      g8: 6,
      h8: 7,
      a7: 16,
      b7: 17,
      c7: 18,
      d7: 19,
      e7: 20,
      f7: 21,
      g7: 22,
      h7: 23,
      a6: 32,
      b6: 33,
      c6: 34,
      d6: 35,
      e6: 36,
      f6: 37,
      g6: 38,
      h6: 39,
      a5: 48,
      b5: 49,
      c5: 50,
      d5: 51,
      e5: 52,
      f5: 53,
      g5: 54,
      h5: 55,
      a4: 64,
      b4: 65,
      c4: 66,
      d4: 67,
      e4: 68,
      f4: 69,
      g4: 70,
      h4: 71,
      a3: 80,
      b3: 81,
      c3: 82,
      d3: 83,
      e3: 84,
      f3: 85,
      g3: 86,
      h3: 87,
      a2: 96,
      b2: 97,
      c2: 98,
      d2: 99,
      e2: 100,
      f2: 101,
      g2: 102,
      h2: 103,
      a1: 112,
      b1: 113,
      c1: 114,
      d1: 115,
      e1: 116,
      f1: 117,
      g1: 118,
      h1: 119
    };
    var PAWN_OFFSETS = {
      b: [16, 32, 17, 15],
      w: [-16, -32, -17, -15]
    };
    var PIECE_OFFSETS = {
      n: [-18, -33, -31, -14, 18, 33, 31, 14],
      b: [-17, -15, 17, 15],
      r: [-16, 1, 16, -1],
      q: [-17, -16, -15, 1, 17, 16, 15, -1],
      k: [-17, -16, -15, 1, 17, 16, 15, -1]
    };
    var ATTACKS = [
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      24,
      0,
      0,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      0,
      24,
      0,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      24,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      24,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      24,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      20,
      2,
      24,
      2,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      2,
      53,
      56,
      53,
      2,
      0,
      0,
      0,
      0,
      0,
      0,
      24,
      24,
      24,
      24,
      24,
      24,
      56,
      0,
      56,
      24,
      24,
      24,
      24,
      24,
      24,
      0,
      0,
      0,
      0,
      0,
      0,
      2,
      53,
      56,
      53,
      2,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      20,
      2,
      24,
      2,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      24,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      24,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      24,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      0,
      24,
      0,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      24,
      0,
      0,
      0,
      0,
      0,
      0,
      20
    ];
    var RAYS = [
      17,
      0,
      0,
      0,
      0,
      0,
      0,
      16,
      0,
      0,
      0,
      0,
      0,
      0,
      15,
      0,
      0,
      17,
      0,
      0,
      0,
      0,
      0,
      16,
      0,
      0,
      0,
      0,
      0,
      15,
      0,
      0,
      0,
      0,
      17,
      0,
      0,
      0,
      0,
      16,
      0,
      0,
      0,
      0,
      15,
      0,
      0,
      0,
      0,
      0,
      0,
      17,
      0,
      0,
      0,
      16,
      0,
      0,
      0,
      15,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      17,
      0,
      0,
      16,
      0,
      0,
      15,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      17,
      0,
      16,
      0,
      15,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      17,
      16,
      15,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      -15,
      -16,
      -17,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      -15,
      0,
      -16,
      0,
      -17,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      -15,
      0,
      0,
      -16,
      0,
      0,
      -17,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      -15,
      0,
      0,
      0,
      -16,
      0,
      0,
      0,
      -17,
      0,
      0,
      0,
      0,
      0,
      0,
      -15,
      0,
      0,
      0,
      0,
      -16,
      0,
      0,
      0,
      0,
      -17,
      0,
      0,
      0,
      0,
      -15,
      0,
      0,
      0,
      0,
      0,
      -16,
      0,
      0,
      0,
      0,
      0,
      -17,
      0,
      0,
      -15,
      0,
      0,
      0,
      0,
      0,
      0,
      -16,
      0,
      0,
      0,
      0,
      0,
      0,
      -17
    ];
    var PIECE_MASKS = { p: 1, n: 2, b: 4, r: 8, q: 16, k: 32 };
    var SYMBOLS = "pnbrqkPNBRQK";
    var PROMOTIONS = [KNIGHT, BISHOP, ROOK, QUEEN];
    var RANK_1 = 7;
    var RANK_2 = 6;
    var RANK_7 = 1;
    var RANK_8 = 0;
    var SIDES = {
      [KING]: BITS.KSIDE_CASTLE,
      [QUEEN]: BITS.QSIDE_CASTLE
    };
    var ROOKS = {
      w: [
        { square: Ox88.a1, flag: BITS.QSIDE_CASTLE },
        { square: Ox88.h1, flag: BITS.KSIDE_CASTLE }
      ],
      b: [
        { square: Ox88.a8, flag: BITS.QSIDE_CASTLE },
        { square: Ox88.h8, flag: BITS.KSIDE_CASTLE }
      ]
    };
    var SECOND_RANK = { b: RANK_7, w: RANK_2 };
    var SAN_NULLMOVE = "--";
    function rank(square) {
      return square >> 4;
    }
    function file(square) {
      return square & 15;
    }
    function isDigit(c2) {
      return "0123456789".indexOf(c2) !== -1;
    }
    function algebraic(square) {
      const f = file(square);
      const r = rank(square);
      return "abcdefgh".substring(f, f + 1) + "87654321".substring(r, r + 1);
    }
    function swapColor(color) {
      return color === WHITE ? BLACK : WHITE;
    }
    function validateFen(fen) {
      const tokens = fen.split(/\s+/);
      if (tokens.length !== 6) {
        return {
          ok: false,
          error: "Invalid FEN: must contain six space-delimited fields"
        };
      }
      const moveNumber = parseInt(tokens[5], 10);
      if (isNaN(moveNumber) || moveNumber <= 0) {
        return {
          ok: false,
          error: "Invalid FEN: move number must be a positive integer"
        };
      }
      const halfMoves = parseInt(tokens[4], 10);
      if (isNaN(halfMoves) || halfMoves < 0) {
        return {
          ok: false,
          error: "Invalid FEN: half move counter number must be a non-negative integer"
        };
      }
      if (!/^(-|[abcdefgh][36])$/.test(tokens[3])) {
        return { ok: false, error: "Invalid FEN: en-passant square is invalid" };
      }
      if (/[^kKqQ-]/.test(tokens[2])) {
        return { ok: false, error: "Invalid FEN: castling availability is invalid" };
      }
      if (!/^(w|b)$/.test(tokens[1])) {
        return { ok: false, error: "Invalid FEN: side-to-move is invalid" };
      }
      const rows = tokens[0].split("/");
      if (rows.length !== 8) {
        return {
          ok: false,
          error: "Invalid FEN: piece data does not contain 8 '/'-delimited rows"
        };
      }
      for (let i = 0; i < rows.length; i++) {
        let sumFields = 0;
        let previousWasNumber = false;
        for (let k = 0; k < rows[i].length; k++) {
          if (isDigit(rows[i][k])) {
            if (previousWasNumber) {
              return {
                ok: false,
                error: "Invalid FEN: piece data is invalid (consecutive number)"
              };
            }
            sumFields += parseInt(rows[i][k], 10);
            previousWasNumber = true;
          } else {
            if (!/^[prnbqkPRNBQK]$/.test(rows[i][k])) {
              return {
                ok: false,
                error: "Invalid FEN: piece data is invalid (invalid piece)"
              };
            }
            sumFields += 1;
            previousWasNumber = false;
          }
        }
        if (sumFields !== 8) {
          return {
            ok: false,
            error: "Invalid FEN: piece data is invalid (too many squares in rank)"
          };
        }
      }
      if (tokens[3][1] == "3" && tokens[1] == "w" || tokens[3][1] == "6" && tokens[1] == "b") {
        return { ok: false, error: "Invalid FEN: illegal en-passant square" };
      }
      const kings = [
        { color: "white", regex: /K/g },
        { color: "black", regex: /k/g }
      ];
      for (const { color, regex } of kings) {
        if (!regex.test(tokens[0])) {
          return { ok: false, error: `Invalid FEN: missing ${color} king` };
        }
        if ((tokens[0].match(regex) || []).length > 1) {
          return { ok: false, error: `Invalid FEN: too many ${color} kings` };
        }
      }
      if (Array.from(rows[0] + rows[7]).some((char) => char.toUpperCase() === "P")) {
        return {
          ok: false,
          error: "Invalid FEN: some pawns are on the edge rows"
        };
      }
      return { ok: true };
    }
    function getDisambiguator(move, moves2) {
      const from = move.from;
      const to = move.to;
      const piece = move.piece;
      let ambiguities = 0;
      let sameRank = 0;
      let sameFile = 0;
      for (let i = 0, len = moves2.length; i < len; i++) {
        const ambigFrom = moves2[i].from;
        const ambigTo = moves2[i].to;
        const ambigPiece = moves2[i].piece;
        if (piece === ambigPiece && from !== ambigFrom && to === ambigTo) {
          ambiguities++;
          if (rank(from) === rank(ambigFrom)) {
            sameRank++;
          }
          if (file(from) === file(ambigFrom)) {
            sameFile++;
          }
        }
      }
      if (ambiguities > 0) {
        if (sameRank > 0 && sameFile > 0) {
          return algebraic(from);
        } else if (sameFile > 0) {
          return algebraic(from).charAt(1);
        } else {
          return algebraic(from).charAt(0);
        }
      }
      return "";
    }
    function addMove(moves2, color, from, to, piece, captured = void 0, flags = BITS.NORMAL) {
      const r = rank(to);
      if (piece === PAWN && (r === RANK_1 || r === RANK_8)) {
        for (let i = 0; i < PROMOTIONS.length; i++) {
          const promotion = PROMOTIONS[i];
          moves2.push({
            color,
            from,
            to,
            piece,
            captured,
            promotion,
            flags: flags | BITS.PROMOTION
          });
        }
      } else {
        moves2.push({
          color,
          from,
          to,
          piece,
          captured,
          flags
        });
      }
    }
    function inferPieceType(san) {
      let pieceType = san.charAt(0);
      if (pieceType >= "a" && pieceType <= "h") {
        const matches = san.match(/[a-h]\d.*[a-h]\d/);
        if (matches) {
          return void 0;
        }
        return PAWN;
      }
      pieceType = pieceType.toLowerCase();
      if (pieceType === "o") {
        return KING;
      }
      return pieceType;
    }
    function strippedSan(move) {
      return move.replace(/=/, "").replace(/[+#]?[?!]*$/, "");
    }
    var Chess2 = class {
      _board = new Array(128);
      _turn = WHITE;
      _header = {};
      _kings = { w: EMPTY, b: EMPTY };
      _epSquare = -1;
      _halfMoves = 0;
      _moveNumber = 0;
      _history = [];
      _comments = {};
      _castling = { w: 0, b: 0 };
      _hash = 0n;
      // tracks number of times a position has been seen for repetition checking
      _positionCount = /* @__PURE__ */ new Map();
      constructor(fen = DEFAULT_POSITION, { skipValidation = false } = {}) {
        this.load(fen, { skipValidation });
      }
      clear({ preserveHeaders = false } = {}) {
        this._board = new Array(128);
        this._kings = { w: EMPTY, b: EMPTY };
        this._turn = WHITE;
        this._castling = { w: 0, b: 0 };
        this._epSquare = EMPTY;
        this._halfMoves = 0;
        this._moveNumber = 1;
        this._history = [];
        this._comments = {};
        this._header = preserveHeaders ? this._header : { ...HEADER_TEMPLATE };
        this._hash = this._computeHash();
        this._positionCount = /* @__PURE__ */ new Map();
        this._header["SetUp"] = null;
        this._header["FEN"] = null;
      }
      load(fen, { skipValidation = false, preserveHeaders = false } = {}) {
        let tokens = fen.split(/\s+/);
        if (tokens.length >= 2 && tokens.length < 6) {
          const adjustments = ["-", "-", "0", "1"];
          fen = tokens.concat(adjustments.slice(-(6 - tokens.length))).join(" ");
        }
        tokens = fen.split(/\s+/);
        if (!skipValidation) {
          const { ok, error } = validateFen(fen);
          if (!ok) {
            throw new Error(error);
          }
        }
        const position = tokens[0];
        let square = 0;
        this.clear({ preserveHeaders });
        for (let i = 0; i < position.length; i++) {
          const piece = position.charAt(i);
          if (piece === "/") {
            square += 8;
          } else if (isDigit(piece)) {
            square += parseInt(piece, 10);
          } else {
            const color = piece < "a" ? WHITE : BLACK;
            this._put({ type: piece.toLowerCase(), color }, algebraic(square));
            square++;
          }
        }
        this._turn = tokens[1];
        if (tokens[2].indexOf("K") > -1) {
          this._castling.w |= BITS.KSIDE_CASTLE;
        }
        if (tokens[2].indexOf("Q") > -1) {
          this._castling.w |= BITS.QSIDE_CASTLE;
        }
        if (tokens[2].indexOf("k") > -1) {
          this._castling.b |= BITS.KSIDE_CASTLE;
        }
        if (tokens[2].indexOf("q") > -1) {
          this._castling.b |= BITS.QSIDE_CASTLE;
        }
        this._epSquare = tokens[3] === "-" ? EMPTY : Ox88[tokens[3]];
        this._halfMoves = parseInt(tokens[4], 10);
        this._moveNumber = parseInt(tokens[5], 10);
        this._hash = this._computeHash();
        this._updateSetup(fen);
        this._incPositionCount();
      }
      fen({ forceEnpassantSquare = false } = {}) {
        let empty = 0;
        let fen = "";
        for (let i = Ox88.a8; i <= Ox88.h1; i++) {
          if (this._board[i]) {
            if (empty > 0) {
              fen += empty;
              empty = 0;
            }
            const { color, type: piece } = this._board[i];
            fen += color === WHITE ? piece.toUpperCase() : piece.toLowerCase();
          } else {
            empty++;
          }
          if (i + 1 & 136) {
            if (empty > 0) {
              fen += empty;
            }
            if (i !== Ox88.h1) {
              fen += "/";
            }
            empty = 0;
            i += 8;
          }
        }
        let castling = "";
        if (this._castling[WHITE] & BITS.KSIDE_CASTLE) {
          castling += "K";
        }
        if (this._castling[WHITE] & BITS.QSIDE_CASTLE) {
          castling += "Q";
        }
        if (this._castling[BLACK] & BITS.KSIDE_CASTLE) {
          castling += "k";
        }
        if (this._castling[BLACK] & BITS.QSIDE_CASTLE) {
          castling += "q";
        }
        castling = castling || "-";
        let epSquare = "-";
        if (this._epSquare !== EMPTY) {
          if (forceEnpassantSquare) {
            epSquare = algebraic(this._epSquare);
          } else {
            const bigPawnSquare = this._epSquare + (this._turn === WHITE ? 16 : -16);
            const squares = [bigPawnSquare + 1, bigPawnSquare - 1];
            for (const square of squares) {
              if (square & 136) {
                continue;
              }
              const color = this._turn;
              if (this._board[square]?.color === color && this._board[square]?.type === PAWN) {
                this._makeMove({
                  color,
                  from: square,
                  to: this._epSquare,
                  piece: PAWN,
                  captured: PAWN,
                  flags: BITS.EP_CAPTURE
                });
                const isLegal = !this._isKingAttacked(color);
                this._undoMove();
                if (isLegal) {
                  epSquare = algebraic(this._epSquare);
                  break;
                }
              }
            }
          }
        }
        return [
          fen,
          this._turn,
          castling,
          epSquare,
          this._halfMoves,
          this._moveNumber
        ].join(" ");
      }
      _pieceKey(i) {
        if (!this._board[i]) {
          return 0n;
        }
        const { color, type } = this._board[i];
        const colorIndex = {
          w: 0,
          b: 1
        }[color];
        const typeIndex = {
          p: 0,
          n: 1,
          b: 2,
          r: 3,
          q: 4,
          k: 5
        }[type];
        return PIECE_KEYS[colorIndex][typeIndex][i];
      }
      _epKey() {
        return this._epSquare === EMPTY ? 0n : EP_KEYS[this._epSquare & 7];
      }
      _castlingKey() {
        const index = this._castling.w >> 5 | this._castling.b >> 3;
        return CASTLING_KEYS[index];
      }
      _computeHash() {
        let hash = 0n;
        for (let i = Ox88.a8; i <= Ox88.h1; i++) {
          if (i & 136) {
            i += 7;
            continue;
          }
          if (this._board[i]) {
            hash ^= this._pieceKey(i);
          }
        }
        hash ^= this._epKey();
        hash ^= this._castlingKey();
        if (this._turn === "b") {
          hash ^= SIDE_KEY;
        }
        return hash;
      }
      /*
       * Called when the initial board setup is changed with put() or remove().
       * modifies the SetUp and FEN properties of the header object. If the FEN
       * is equal to the default position, the SetUp and FEN are deleted the setup
       * is only updated if history.length is zero, ie moves haven't been made.
       */
      _updateSetup(fen) {
        if (this._history.length > 0)
          return;
        if (fen !== DEFAULT_POSITION) {
          this._header["SetUp"] = "1";
          this._header["FEN"] = fen;
        } else {
          this._header["SetUp"] = null;
          this._header["FEN"] = null;
        }
      }
      reset() {
        this.load(DEFAULT_POSITION);
      }
      get(square) {
        return this._board[Ox88[square]];
      }
      findPiece(piece) {
        const squares = [];
        for (let i = Ox88.a8; i <= Ox88.h1; i++) {
          if (i & 136) {
            i += 7;
            continue;
          }
          if (!this._board[i] || this._board[i]?.color !== piece.color) {
            continue;
          }
          if (this._board[i].color === piece.color && this._board[i].type === piece.type) {
            squares.push(algebraic(i));
          }
        }
        return squares;
      }
      put({ type, color }, square) {
        if (this._put({ type, color }, square)) {
          this._updateCastlingRights();
          this._updateEnPassantSquare();
          this._updateSetup(this.fen());
          return true;
        }
        return false;
      }
      _set(sq, piece) {
        this._hash ^= this._pieceKey(sq);
        this._board[sq] = piece;
        this._hash ^= this._pieceKey(sq);
      }
      _put({ type, color }, square) {
        if (SYMBOLS.indexOf(type.toLowerCase()) === -1) {
          return false;
        }
        if (!(square in Ox88)) {
          return false;
        }
        const sq = Ox88[square];
        if (type == KING && !(this._kings[color] == EMPTY || this._kings[color] == sq)) {
          return false;
        }
        const currentPieceOnSquare = this._board[sq];
        if (currentPieceOnSquare && currentPieceOnSquare.type === KING) {
          this._kings[currentPieceOnSquare.color] = EMPTY;
        }
        this._set(sq, { type, color });
        if (type === KING) {
          this._kings[color] = sq;
        }
        return true;
      }
      _clear(sq) {
        this._hash ^= this._pieceKey(sq);
        delete this._board[sq];
      }
      remove(square) {
        const piece = this.get(square);
        this._clear(Ox88[square]);
        if (piece && piece.type === KING) {
          this._kings[piece.color] = EMPTY;
        }
        this._updateCastlingRights();
        this._updateEnPassantSquare();
        this._updateSetup(this.fen());
        return piece;
      }
      _updateCastlingRights() {
        this._hash ^= this._castlingKey();
        const whiteKingInPlace = this._board[Ox88.e1]?.type === KING && this._board[Ox88.e1]?.color === WHITE;
        const blackKingInPlace = this._board[Ox88.e8]?.type === KING && this._board[Ox88.e8]?.color === BLACK;
        if (!whiteKingInPlace || this._board[Ox88.a1]?.type !== ROOK || this._board[Ox88.a1]?.color !== WHITE) {
          this._castling.w &= -65;
        }
        if (!whiteKingInPlace || this._board[Ox88.h1]?.type !== ROOK || this._board[Ox88.h1]?.color !== WHITE) {
          this._castling.w &= -33;
        }
        if (!blackKingInPlace || this._board[Ox88.a8]?.type !== ROOK || this._board[Ox88.a8]?.color !== BLACK) {
          this._castling.b &= -65;
        }
        if (!blackKingInPlace || this._board[Ox88.h8]?.type !== ROOK || this._board[Ox88.h8]?.color !== BLACK) {
          this._castling.b &= -33;
        }
        this._hash ^= this._castlingKey();
      }
      _updateEnPassantSquare() {
        if (this._epSquare === EMPTY) {
          return;
        }
        const startSquare = this._epSquare + (this._turn === WHITE ? -16 : 16);
        const currentSquare = this._epSquare + (this._turn === WHITE ? 16 : -16);
        const attackers = [currentSquare + 1, currentSquare - 1];
        if (this._board[startSquare] !== null || this._board[this._epSquare] !== null || this._board[currentSquare]?.color !== swapColor(this._turn) || this._board[currentSquare]?.type !== PAWN) {
          this._hash ^= this._epKey();
          this._epSquare = EMPTY;
          return;
        }
        const canCapture = (square) => !(square & 136) && this._board[square]?.color === this._turn && this._board[square]?.type === PAWN;
        if (!attackers.some(canCapture)) {
          this._hash ^= this._epKey();
          this._epSquare = EMPTY;
        }
      }
      _attacked(color, square, verbose) {
        const attackers = [];
        for (let i = Ox88.a8; i <= Ox88.h1; i++) {
          if (i & 136) {
            i += 7;
            continue;
          }
          if (this._board[i] === void 0 || this._board[i].color !== color) {
            continue;
          }
          const piece = this._board[i];
          const difference = i - square;
          if (difference === 0) {
            continue;
          }
          const index = difference + 119;
          if (ATTACKS[index] & PIECE_MASKS[piece.type]) {
            if (piece.type === PAWN) {
              if (difference > 0 && piece.color === WHITE || difference <= 0 && piece.color === BLACK) {
                if (!verbose) {
                  return true;
                } else {
                  attackers.push(algebraic(i));
                }
              }
              continue;
            }
            if (piece.type === "n" || piece.type === "k") {
              if (!verbose) {
                return true;
              } else {
                attackers.push(algebraic(i));
                continue;
              }
            }
            const offset = RAYS[index];
            let j = i + offset;
            let blocked = false;
            while (j !== square) {
              if (this._board[j] != null) {
                blocked = true;
                break;
              }
              j += offset;
            }
            if (!blocked) {
              if (!verbose) {
                return true;
              } else {
                attackers.push(algebraic(i));
                continue;
              }
            }
          }
        }
        if (verbose) {
          return attackers;
        } else {
          return false;
        }
      }
      attackers(square, attackedBy) {
        if (!attackedBy) {
          return this._attacked(this._turn, Ox88[square], true);
        } else {
          return this._attacked(attackedBy, Ox88[square], true);
        }
      }
      _isKingAttacked(color) {
        const square = this._kings[color];
        return square === -1 ? false : this._attacked(swapColor(color), square);
      }
      hash() {
        return this._hash.toString(16);
      }
      isAttacked(square, attackedBy) {
        return this._attacked(attackedBy, Ox88[square]);
      }
      isCheck() {
        return this._isKingAttacked(this._turn);
      }
      inCheck() {
        return this.isCheck();
      }
      isCheckmate() {
        return this.isCheck() && this._moves().length === 0;
      }
      isStalemate() {
        return !this.isCheck() && this._moves().length === 0;
      }
      isInsufficientMaterial() {
        const pieces = {
          b: 0,
          n: 0,
          r: 0,
          q: 0,
          k: 0,
          p: 0
        };
        const bishops = [];
        let numPieces = 0;
        let squareColor = 0;
        for (let i = Ox88.a8; i <= Ox88.h1; i++) {
          squareColor = (squareColor + 1) % 2;
          if (i & 136) {
            i += 7;
            continue;
          }
          const piece = this._board[i];
          if (piece) {
            pieces[piece.type] = piece.type in pieces ? pieces[piece.type] + 1 : 1;
            if (piece.type === BISHOP) {
              bishops.push(squareColor);
            }
            numPieces++;
          }
        }
        if (numPieces === 2) {
          return true;
        } else if (
          // k vs. kn .... or .... k vs. kb
          numPieces === 3 && (pieces[BISHOP] === 1 || pieces[KNIGHT] === 1)
        ) {
          return true;
        } else if (numPieces === pieces[BISHOP] + 2) {
          let sum = 0;
          const len = bishops.length;
          for (let i = 0; i < len; i++) {
            sum += bishops[i];
          }
          if (sum === 0 || sum === len) {
            return true;
          }
        }
        return false;
      }
      isThreefoldRepetition() {
        return this._getPositionCount(this._hash) >= 3;
      }
      isDrawByFiftyMoves() {
        return this._halfMoves >= 100;
      }
      isDraw() {
        return this.isDrawByFiftyMoves() || this.isStalemate() || this.isInsufficientMaterial() || this.isThreefoldRepetition();
      }
      isGameOver() {
        return this.isCheckmate() || this.isDraw();
      }
      moves({ verbose = false, square = void 0, piece = void 0 } = {}) {
        const moves2 = this._moves({ square, piece });
        if (verbose) {
          return moves2.map((move) => new Move(this, move));
        } else {
          return moves2.map((move) => this._moveToSan(move, moves2));
        }
      }
      _moves({ legal = true, piece = void 0, square = void 0 } = {}) {
        const forSquare = square ? square.toLowerCase() : void 0;
        const forPiece = piece?.toLowerCase();
        const moves2 = [];
        const us = this._turn;
        const them = swapColor(us);
        let firstSquare = Ox88.a8;
        let lastSquare = Ox88.h1;
        let singleSquare = false;
        if (forSquare) {
          if (!(forSquare in Ox88)) {
            return [];
          } else {
            firstSquare = lastSquare = Ox88[forSquare];
            singleSquare = true;
          }
        }
        for (let from = firstSquare; from <= lastSquare; from++) {
          if (from & 136) {
            from += 7;
            continue;
          }
          if (!this._board[from] || this._board[from].color === them) {
            continue;
          }
          const { type } = this._board[from];
          let to;
          if (type === PAWN) {
            if (forPiece && forPiece !== type)
              continue;
            to = from + PAWN_OFFSETS[us][0];
            if (!this._board[to]) {
              addMove(moves2, us, from, to, PAWN);
              to = from + PAWN_OFFSETS[us][1];
              if (SECOND_RANK[us] === rank(from) && !this._board[to]) {
                addMove(moves2, us, from, to, PAWN, void 0, BITS.BIG_PAWN);
              }
            }
            for (let j = 2; j < 4; j++) {
              to = from + PAWN_OFFSETS[us][j];
              if (to & 136)
                continue;
              if (this._board[to]?.color === them) {
                addMove(moves2, us, from, to, PAWN, this._board[to].type, BITS.CAPTURE);
              } else if (to === this._epSquare) {
                addMove(moves2, us, from, to, PAWN, PAWN, BITS.EP_CAPTURE);
              }
            }
          } else {
            if (forPiece && forPiece !== type)
              continue;
            for (let j = 0, len = PIECE_OFFSETS[type].length; j < len; j++) {
              const offset = PIECE_OFFSETS[type][j];
              to = from;
              while (true) {
                to += offset;
                if (to & 136)
                  break;
                if (!this._board[to]) {
                  addMove(moves2, us, from, to, type);
                } else {
                  if (this._board[to].color === us)
                    break;
                  addMove(moves2, us, from, to, type, this._board[to].type, BITS.CAPTURE);
                  break;
                }
                if (type === KNIGHT || type === KING)
                  break;
              }
            }
          }
        }
        if (forPiece === void 0 || forPiece === KING) {
          if (!singleSquare || lastSquare === this._kings[us]) {
            if (this._castling[us] & BITS.KSIDE_CASTLE) {
              const castlingFrom = this._kings[us];
              const castlingTo = castlingFrom + 2;
              if (!this._board[castlingFrom + 1] && !this._board[castlingTo] && !this._attacked(them, this._kings[us]) && !this._attacked(them, castlingFrom + 1) && !this._attacked(them, castlingTo)) {
                addMove(moves2, us, this._kings[us], castlingTo, KING, void 0, BITS.KSIDE_CASTLE);
              }
            }
            if (this._castling[us] & BITS.QSIDE_CASTLE) {
              const castlingFrom = this._kings[us];
              const castlingTo = castlingFrom - 2;
              if (!this._board[castlingFrom - 1] && !this._board[castlingFrom - 2] && !this._board[castlingFrom - 3] && !this._attacked(them, this._kings[us]) && !this._attacked(them, castlingFrom - 1) && !this._attacked(them, castlingTo)) {
                addMove(moves2, us, this._kings[us], castlingTo, KING, void 0, BITS.QSIDE_CASTLE);
              }
            }
          }
        }
        if (!legal || this._kings[us] === -1) {
          return moves2;
        }
        const legalMoves = [];
        for (let i = 0, len = moves2.length; i < len; i++) {
          this._makeMove(moves2[i]);
          if (!this._isKingAttacked(us)) {
            legalMoves.push(moves2[i]);
          }
          this._undoMove();
        }
        return legalMoves;
      }
      move(move, { strict = false } = {}) {
        let moveObj = null;
        if (typeof move === "string") {
          moveObj = this._moveFromSan(move, strict);
        } else if (move === null) {
          moveObj = this._moveFromSan(SAN_NULLMOVE, strict);
        } else if (typeof move === "object") {
          const moves2 = this._moves();
          for (let i = 0, len = moves2.length; i < len; i++) {
            if (move.from === algebraic(moves2[i].from) && move.to === algebraic(moves2[i].to) && (!("promotion" in moves2[i]) || move.promotion === moves2[i].promotion)) {
              moveObj = moves2[i];
              break;
            }
          }
        }
        if (!moveObj) {
          if (typeof move === "string") {
            throw new Error(`Invalid move: ${move}`);
          } else {
            throw new Error(`Invalid move: ${JSON.stringify(move)}`);
          }
        }
        if (this.isCheck() && moveObj.flags & BITS.NULL_MOVE) {
          throw new Error("Null move not allowed when in check");
        }
        const prettyMove = new Move(this, moveObj);
        this._makeMove(moveObj);
        this._incPositionCount();
        return prettyMove;
      }
      _push(move) {
        this._history.push({
          move,
          kings: { b: this._kings.b, w: this._kings.w },
          turn: this._turn,
          castling: { b: this._castling.b, w: this._castling.w },
          epSquare: this._epSquare,
          halfMoves: this._halfMoves,
          moveNumber: this._moveNumber
        });
      }
      _movePiece(from, to) {
        this._hash ^= this._pieceKey(from);
        this._board[to] = this._board[from];
        delete this._board[from];
        this._hash ^= this._pieceKey(to);
      }
      _makeMove(move) {
        const us = this._turn;
        const them = swapColor(us);
        this._push(move);
        if (move.flags & BITS.NULL_MOVE) {
          if (us === BLACK) {
            this._moveNumber++;
          }
          this._halfMoves++;
          this._turn = them;
          this._epSquare = EMPTY;
          return;
        }
        this._hash ^= this._epKey();
        this._hash ^= this._castlingKey();
        if (move.captured) {
          this._hash ^= this._pieceKey(move.to);
        }
        this._movePiece(move.from, move.to);
        if (move.flags & BITS.EP_CAPTURE) {
          if (this._turn === BLACK) {
            this._clear(move.to - 16);
          } else {
            this._clear(move.to + 16);
          }
        }
        if (move.promotion) {
          this._clear(move.to);
          this._set(move.to, { type: move.promotion, color: us });
        }
        if (this._board[move.to].type === KING) {
          this._kings[us] = move.to;
          if (move.flags & BITS.KSIDE_CASTLE) {
            const castlingTo = move.to - 1;
            const castlingFrom = move.to + 1;
            this._movePiece(castlingFrom, castlingTo);
          } else if (move.flags & BITS.QSIDE_CASTLE) {
            const castlingTo = move.to + 1;
            const castlingFrom = move.to - 2;
            this._movePiece(castlingFrom, castlingTo);
          }
          this._castling[us] = 0;
        }
        if (this._castling[us]) {
          for (let i = 0, len = ROOKS[us].length; i < len; i++) {
            if (move.from === ROOKS[us][i].square && this._castling[us] & ROOKS[us][i].flag) {
              this._castling[us] ^= ROOKS[us][i].flag;
              break;
            }
          }
        }
        if (this._castling[them]) {
          for (let i = 0, len = ROOKS[them].length; i < len; i++) {
            if (move.to === ROOKS[them][i].square && this._castling[them] & ROOKS[them][i].flag) {
              this._castling[them] ^= ROOKS[them][i].flag;
              break;
            }
          }
        }
        this._hash ^= this._castlingKey();
        if (move.flags & BITS.BIG_PAWN) {
          let epSquare;
          if (us === BLACK) {
            epSquare = move.to - 16;
          } else {
            epSquare = move.to + 16;
          }
          if (!(move.to - 1 & 136) && this._board[move.to - 1]?.type === PAWN && this._board[move.to - 1]?.color === them || !(move.to + 1 & 136) && this._board[move.to + 1]?.type === PAWN && this._board[move.to + 1]?.color === them) {
            this._epSquare = epSquare;
            this._hash ^= this._epKey();
          } else {
            this._epSquare = EMPTY;
          }
        } else {
          this._epSquare = EMPTY;
        }
        if (move.piece === PAWN) {
          this._halfMoves = 0;
        } else if (move.flags & (BITS.CAPTURE | BITS.EP_CAPTURE)) {
          this._halfMoves = 0;
        } else {
          this._halfMoves++;
        }
        if (us === BLACK) {
          this._moveNumber++;
        }
        this._turn = them;
        this._hash ^= SIDE_KEY;
      }
      undo() {
        const hash = this._hash;
        const move = this._undoMove();
        if (move) {
          const prettyMove = new Move(this, move);
          this._decPositionCount(hash);
          return prettyMove;
        }
        return null;
      }
      _undoMove() {
        const old = this._history.pop();
        if (old === void 0) {
          return null;
        }
        this._hash ^= this._epKey();
        this._hash ^= this._castlingKey();
        const move = old.move;
        this._kings = old.kings;
        this._turn = old.turn;
        this._castling = old.castling;
        this._epSquare = old.epSquare;
        this._halfMoves = old.halfMoves;
        this._moveNumber = old.moveNumber;
        this._hash ^= this._epKey();
        this._hash ^= this._castlingKey();
        this._hash ^= SIDE_KEY;
        const us = this._turn;
        const them = swapColor(us);
        if (move.flags & BITS.NULL_MOVE) {
          return move;
        }
        this._movePiece(move.to, move.from);
        if (move.piece) {
          this._clear(move.from);
          this._set(move.from, { type: move.piece, color: us });
        }
        if (move.captured) {
          if (move.flags & BITS.EP_CAPTURE) {
            let index;
            if (us === BLACK) {
              index = move.to - 16;
            } else {
              index = move.to + 16;
            }
            this._set(index, { type: PAWN, color: them });
          } else {
            this._set(move.to, { type: move.captured, color: them });
          }
        }
        if (move.flags & (BITS.KSIDE_CASTLE | BITS.QSIDE_CASTLE)) {
          let castlingTo, castlingFrom;
          if (move.flags & BITS.KSIDE_CASTLE) {
            castlingTo = move.to + 1;
            castlingFrom = move.to - 1;
          } else {
            castlingTo = move.to - 2;
            castlingFrom = move.to + 1;
          }
          this._movePiece(castlingFrom, castlingTo);
        }
        return move;
      }
      pgn({ newline = "\n", maxWidth = 0 } = {}) {
        const result = [];
        let headerExists = false;
        for (const i in this._header) {
          const headerTag = this._header[i];
          if (headerTag)
            result.push(`[${i} "${this._header[i]}"]` + newline);
          headerExists = true;
        }
        if (headerExists && this._history.length) {
          result.push(newline);
        }
        const appendComment = (moveString2) => {
          const comment = this._comments[this.fen()];
          if (typeof comment !== "undefined") {
            const delimiter = moveString2.length > 0 ? " " : "";
            moveString2 = `${moveString2}${delimiter}{${comment}}`;
          }
          return moveString2;
        };
        const reversedHistory = [];
        while (this._history.length > 0) {
          reversedHistory.push(this._undoMove());
        }
        const moves2 = [];
        let moveString = "";
        if (reversedHistory.length === 0) {
          moves2.push(appendComment(""));
        }
        while (reversedHistory.length > 0) {
          moveString = appendComment(moveString);
          const move = reversedHistory.pop();
          if (!move) {
            break;
          }
          if (!this._history.length && move.color === "b") {
            const prefix = `${this._moveNumber}. ...`;
            moveString = moveString ? `${moveString} ${prefix}` : prefix;
          } else if (move.color === "w") {
            if (moveString.length) {
              moves2.push(moveString);
            }
            moveString = this._moveNumber + ".";
          }
          moveString = moveString + " " + this._moveToSan(move, this._moves({ legal: true }));
          this._makeMove(move);
        }
        if (moveString.length) {
          moves2.push(appendComment(moveString));
        }
        moves2.push(this._header.Result || "*");
        if (maxWidth === 0) {
          return result.join("") + moves2.join(" ");
        }
        const strip = function() {
          if (result.length > 0 && result[result.length - 1] === " ") {
            result.pop();
            return true;
          }
          return false;
        };
        const wrapComment = function(width, move) {
          for (const token of move.split(" ")) {
            if (!token) {
              continue;
            }
            if (width + token.length > maxWidth) {
              while (strip()) {
                width--;
              }
              result.push(newline);
              width = 0;
            }
            result.push(token);
            width += token.length;
            result.push(" ");
            width++;
          }
          if (strip()) {
            width--;
          }
          return width;
        };
        let currentWidth = 0;
        for (let i = 0; i < moves2.length; i++) {
          if (currentWidth + moves2[i].length > maxWidth) {
            if (moves2[i].includes("{")) {
              currentWidth = wrapComment(currentWidth, moves2[i]);
              continue;
            }
          }
          if (currentWidth + moves2[i].length > maxWidth && i !== 0) {
            if (result[result.length - 1] === " ") {
              result.pop();
            }
            result.push(newline);
            currentWidth = 0;
          } else if (i !== 0) {
            result.push(" ");
            currentWidth++;
          }
          result.push(moves2[i]);
          currentWidth += moves2[i].length;
        }
        return result.join("");
      }
      /**
       * @deprecated Use `setHeader` and `getHeaders` instead. This method will return null header tags (which is not what you want)
       */
      header(...args) {
        for (let i = 0; i < args.length; i += 2) {
          if (typeof args[i] === "string" && typeof args[i + 1] === "string") {
            this._header[args[i]] = args[i + 1];
          }
        }
        return this._header;
      }
      // TODO: value validation per spec
      setHeader(key, value) {
        this._header[key] = value ?? SEVEN_TAG_ROSTER[key] ?? null;
        return this.getHeaders();
      }
      removeHeader(key) {
        if (key in this._header) {
          this._header[key] = SEVEN_TAG_ROSTER[key] || null;
          return true;
        }
        return false;
      }
      // return only non-null headers (omit placemarker nulls)
      getHeaders() {
        const nonNullHeaders = {};
        for (const [key, value] of Object.entries(this._header)) {
          if (value !== null) {
            nonNullHeaders[key] = value;
          }
        }
        return nonNullHeaders;
      }
      loadPgn(pgn2, { strict = false, newlineChar = "\r?\n" } = {}) {
        if (newlineChar !== "\r?\n") {
          pgn2 = pgn2.replace(new RegExp(newlineChar, "g"), "\n");
        }
        const parsedPgn = peg$parse(pgn2);
        this.reset();
        const headers = parsedPgn.headers;
        let fen = "";
        for (const key in headers) {
          if (key.toLowerCase() === "fen") {
            fen = headers[key];
          }
          this.header(key, headers[key]);
        }
        if (!strict) {
          if (fen) {
            this.load(fen, { preserveHeaders: true });
          }
        } else {
          if (headers["SetUp"] === "1") {
            if (!("FEN" in headers)) {
              throw new Error("Invalid PGN: FEN tag must be supplied with SetUp tag");
            }
            this.load(headers["FEN"], { preserveHeaders: true });
          }
        }
        let node2 = parsedPgn.root;
        while (node2) {
          if (node2.move) {
            const move = this._moveFromSan(node2.move, strict);
            if (move == null) {
              throw new Error(`Invalid move in PGN: ${node2.move}`);
            } else {
              this._makeMove(move);
              this._incPositionCount();
            }
          }
          if (node2.comment !== void 0) {
            this._comments[this.fen()] = node2.comment;
          }
          node2 = node2.variations[0];
        }
        const result = parsedPgn.result;
        if (result && Object.keys(this._header).length && this._header["Result"] !== result) {
          this.setHeader("Result", result);
        }
      }
      /*
       * Convert a move from 0x88 coordinates to Standard Algebraic Notation
       * (SAN)
       *
       * @param {boolean} strict Use the strict SAN parser. It will throw errors
       * on overly disambiguated moves (see below):
       *
       * r1bqkbnr/ppp2ppp/2n5/1B1pP3/4P3/8/PPPP2PP/RNBQK1NR b KQkq - 2 4
       * 4. ... Nge7 is overly disambiguated because the knight on c6 is pinned
       * 4. ... Ne7 is technically the valid SAN
       */
      _moveToSan(move, moves2) {
        let output = "";
        if (move.flags & BITS.KSIDE_CASTLE) {
          output = "O-O";
        } else if (move.flags & BITS.QSIDE_CASTLE) {
          output = "O-O-O";
        } else if (move.flags & BITS.NULL_MOVE) {
          return SAN_NULLMOVE;
        } else {
          if (move.piece !== PAWN) {
            const disambiguator = getDisambiguator(move, moves2);
            output += move.piece.toUpperCase() + disambiguator;
          }
          if (move.flags & (BITS.CAPTURE | BITS.EP_CAPTURE)) {
            if (move.piece === PAWN) {
              output += algebraic(move.from)[0];
            }
            output += "x";
          }
          output += algebraic(move.to);
          if (move.promotion) {
            output += "=" + move.promotion.toUpperCase();
          }
        }
        this._makeMove(move);
        if (this.isCheck()) {
          if (this.isCheckmate()) {
            output += "#";
          } else {
            output += "+";
          }
        }
        this._undoMove();
        return output;
      }
      // convert a move from Standard Algebraic Notation (SAN) to 0x88 coordinates
      _moveFromSan(move, strict = false) {
        let cleanMove = strippedSan(move);
        if (!strict) {
          if (cleanMove === "0-0") {
            cleanMove = "O-O";
          } else if (cleanMove === "0-0-0") {
            cleanMove = "O-O-O";
          }
        }
        if (cleanMove == SAN_NULLMOVE) {
          const res = {
            color: this._turn,
            from: 0,
            to: 0,
            piece: "k",
            flags: BITS.NULL_MOVE
          };
          return res;
        }
        let pieceType = inferPieceType(cleanMove);
        let moves2 = this._moves({ legal: true, piece: pieceType });
        for (let i = 0, len = moves2.length; i < len; i++) {
          if (cleanMove === strippedSan(this._moveToSan(moves2[i], moves2))) {
            return moves2[i];
          }
        }
        if (strict) {
          return null;
        }
        let piece = void 0;
        let matches = void 0;
        let from = void 0;
        let to = void 0;
        let promotion = void 0;
        let overlyDisambiguated = false;
        matches = cleanMove.match(/([pnbrqkPNBRQK])?([a-h][1-8])x?-?([a-h][1-8])([qrbnQRBN])?/);
        if (matches) {
          piece = matches[1];
          from = matches[2];
          to = matches[3];
          promotion = matches[4];
          if (from.length == 1) {
            overlyDisambiguated = true;
          }
        } else {
          matches = cleanMove.match(/([pnbrqkPNBRQK])?([a-h]?[1-8]?)x?-?([a-h][1-8])([qrbnQRBN])?/);
          if (matches) {
            piece = matches[1];
            from = matches[2];
            to = matches[3];
            promotion = matches[4];
            if (from.length == 1) {
              overlyDisambiguated = true;
            }
          }
        }
        pieceType = inferPieceType(cleanMove);
        moves2 = this._moves({
          legal: true,
          piece: piece ? piece : pieceType
        });
        if (!to) {
          return null;
        }
        for (let i = 0, len = moves2.length; i < len; i++) {
          if (!from) {
            if (cleanMove === strippedSan(this._moveToSan(moves2[i], moves2)).replace("x", "")) {
              return moves2[i];
            }
          } else if ((!piece || piece.toLowerCase() == moves2[i].piece) && Ox88[from] == moves2[i].from && Ox88[to] == moves2[i].to && (!promotion || promotion.toLowerCase() == moves2[i].promotion)) {
            return moves2[i];
          } else if (overlyDisambiguated) {
            const square = algebraic(moves2[i].from);
            if ((!piece || piece.toLowerCase() == moves2[i].piece) && Ox88[to] == moves2[i].to && (from == square[0] || from == square[1]) && (!promotion || promotion.toLowerCase() == moves2[i].promotion)) {
              return moves2[i];
            }
          }
        }
        return null;
      }
      ascii() {
        let s = "   +------------------------+\n";
        for (let i = Ox88.a8; i <= Ox88.h1; i++) {
          if (file(i) === 0) {
            s += " " + "87654321"[rank(i)] + " |";
          }
          if (this._board[i]) {
            const piece = this._board[i].type;
            const color = this._board[i].color;
            const symbol = color === WHITE ? piece.toUpperCase() : piece.toLowerCase();
            s += " " + symbol + " ";
          } else {
            s += " . ";
          }
          if (i + 1 & 136) {
            s += "|\n";
            i += 8;
          }
        }
        s += "   +------------------------+\n";
        s += "     a  b  c  d  e  f  g  h";
        return s;
      }
      perft(depth) {
        const moves2 = this._moves({ legal: false });
        let nodes = 0;
        const color = this._turn;
        for (let i = 0, len = moves2.length; i < len; i++) {
          this._makeMove(moves2[i]);
          if (!this._isKingAttacked(color)) {
            if (depth - 1 > 0) {
              nodes += this.perft(depth - 1);
            } else {
              nodes++;
            }
          }
          this._undoMove();
        }
        return nodes;
      }
      setTurn(color) {
        if (this._turn == color) {
          return false;
        }
        this.move("--");
        return true;
      }
      turn() {
        return this._turn;
      }
      board() {
        const output = [];
        let row = [];
        for (let i = Ox88.a8; i <= Ox88.h1; i++) {
          if (this._board[i] == null) {
            row.push(null);
          } else {
            row.push({
              square: algebraic(i),
              type: this._board[i].type,
              color: this._board[i].color
            });
          }
          if (i + 1 & 136) {
            output.push(row);
            row = [];
            i += 8;
          }
        }
        return output;
      }
      squareColor(square) {
        if (square in Ox88) {
          const sq = Ox88[square];
          return (rank(sq) + file(sq)) % 2 === 0 ? "light" : "dark";
        }
        return null;
      }
      history({ verbose = false } = {}) {
        const reversedHistory = [];
        const moveHistory = [];
        while (this._history.length > 0) {
          reversedHistory.push(this._undoMove());
        }
        while (true) {
          const move = reversedHistory.pop();
          if (!move) {
            break;
          }
          if (verbose) {
            moveHistory.push(new Move(this, move));
          } else {
            moveHistory.push(this._moveToSan(move, this._moves()));
          }
          this._makeMove(move);
        }
        return moveHistory;
      }
      /*
       * Keeps track of position occurrence counts for the purpose of repetition
       * checking. Old positions are removed from the map if their counts are reduced to 0.
       */
      _getPositionCount(hash) {
        return this._positionCount.get(hash) ?? 0;
      }
      _incPositionCount() {
        this._positionCount.set(this._hash, (this._positionCount.get(this._hash) ?? 0) + 1);
      }
      _decPositionCount(hash) {
        const currentCount = this._positionCount.get(hash) ?? 0;
        if (currentCount === 1) {
          this._positionCount.delete(hash);
        } else {
          this._positionCount.set(hash, currentCount - 1);
        }
      }
      _pruneComments() {
        const reversedHistory = [];
        const currentComments = {};
        const copyComment = (fen) => {
          if (fen in this._comments) {
            currentComments[fen] = this._comments[fen];
          }
        };
        while (this._history.length > 0) {
          reversedHistory.push(this._undoMove());
        }
        copyComment(this.fen());
        while (true) {
          const move = reversedHistory.pop();
          if (!move) {
            break;
          }
          this._makeMove(move);
          copyComment(this.fen());
        }
        this._comments = currentComments;
      }
      getComment() {
        return this._comments[this.fen()];
      }
      setComment(comment) {
        this._comments[this.fen()] = comment.replace("{", "[").replace("}", "]");
      }
      /**
       * @deprecated Renamed to `removeComment` for consistency
       */
      deleteComment() {
        return this.removeComment();
      }
      removeComment() {
        const comment = this._comments[this.fen()];
        delete this._comments[this.fen()];
        return comment;
      }
      getComments() {
        this._pruneComments();
        return Object.keys(this._comments).map((fen) => {
          return { fen, comment: this._comments[fen] };
        });
      }
      /**
       * @deprecated Renamed to `removeComments` for consistency
       */
      deleteComments() {
        return this.removeComments();
      }
      removeComments() {
        this._pruneComments();
        return Object.keys(this._comments).map((fen) => {
          const comment = this._comments[fen];
          delete this._comments[fen];
          return { fen, comment };
        });
      }
      setCastlingRights(color, rights) {
        for (const side of [KING, QUEEN]) {
          if (rights[side] !== void 0) {
            if (rights[side]) {
              this._castling[color] |= SIDES[side];
            } else {
              this._castling[color] &= ~SIDES[side];
            }
          }
        }
        this._updateCastlingRights();
        const result = this.getCastlingRights(color);
        return (rights[KING] === void 0 || rights[KING] === result[KING]) && (rights[QUEEN] === void 0 || rights[QUEEN] === result[QUEEN]);
      }
      getCastlingRights(color) {
        return {
          [KING]: (this._castling[color] & SIDES[KING]) !== 0,
          [QUEEN]: (this._castling[color] & SIDES[QUEEN]) !== 0
        };
      }
      moveNumber() {
        return this._moveNumber;
      }
    };
    exports2.BISHOP = BISHOP;
    exports2.BLACK = BLACK;
    exports2.Chess = Chess2;
    exports2.DEFAULT_POSITION = DEFAULT_POSITION;
    exports2.KING = KING;
    exports2.KNIGHT = KNIGHT;
    exports2.Move = Move;
    exports2.PAWN = PAWN;
    exports2.QUEEN = QUEEN;
    exports2.ROOK = ROOK;
    exports2.SEVEN_TAG_ROSTER = SEVEN_TAG_ROSTER;
    exports2.SQUARES = SQUARES;
    exports2.WHITE = WHITE;
    exports2.validateFen = validateFen;
    exports2.xoroshiro128 = xoroshiro128;
  }
});

// ../../node_modules/jpeg-js/lib/encoder.js
var require_encoder = __commonJS({
  "../../node_modules/jpeg-js/lib/encoder.js"(exports2, module2) {
    var btoa2 = btoa2 || function(buf) {
      return Buffer.from(buf).toString("base64");
    };
    function JPEGEncoder(quality) {
      var self = this;
      var fround = Math.round;
      var ffloor = Math.floor;
      var YTable = new Array(64);
      var UVTable = new Array(64);
      var fdtbl_Y = new Array(64);
      var fdtbl_UV = new Array(64);
      var YDC_HT;
      var UVDC_HT;
      var YAC_HT;
      var UVAC_HT;
      var bitcode = new Array(65535);
      var category = new Array(65535);
      var outputfDCTQuant = new Array(64);
      var DU = new Array(64);
      var byteout = [];
      var bytenew = 0;
      var bytepos = 7;
      var YDU = new Array(64);
      var UDU = new Array(64);
      var VDU = new Array(64);
      var clt = new Array(256);
      var RGB_YUV_TABLE = new Array(2048);
      var currentQuality;
      var ZigZag = [
        0,
        1,
        5,
        6,
        14,
        15,
        27,
        28,
        2,
        4,
        7,
        13,
        16,
        26,
        29,
        42,
        3,
        8,
        12,
        17,
        25,
        30,
        41,
        43,
        9,
        11,
        18,
        24,
        31,
        40,
        44,
        53,
        10,
        19,
        23,
        32,
        39,
        45,
        52,
        54,
        20,
        22,
        33,
        38,
        46,
        51,
        55,
        60,
        21,
        34,
        37,
        47,
        50,
        56,
        59,
        61,
        35,
        36,
        48,
        49,
        57,
        58,
        62,
        63
      ];
      var std_dc_luminance_nrcodes = [0, 0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0];
      var std_dc_luminance_values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      var std_ac_luminance_nrcodes = [0, 0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 125];
      var std_ac_luminance_values = [
        1,
        2,
        3,
        0,
        4,
        17,
        5,
        18,
        33,
        49,
        65,
        6,
        19,
        81,
        97,
        7,
        34,
        113,
        20,
        50,
        129,
        145,
        161,
        8,
        35,
        66,
        177,
        193,
        21,
        82,
        209,
        240,
        36,
        51,
        98,
        114,
        130,
        9,
        10,
        22,
        23,
        24,
        25,
        26,
        37,
        38,
        39,
        40,
        41,
        42,
        52,
        53,
        54,
        55,
        56,
        57,
        58,
        67,
        68,
        69,
        70,
        71,
        72,
        73,
        74,
        83,
        84,
        85,
        86,
        87,
        88,
        89,
        90,
        99,
        100,
        101,
        102,
        103,
        104,
        105,
        106,
        115,
        116,
        117,
        118,
        119,
        120,
        121,
        122,
        131,
        132,
        133,
        134,
        135,
        136,
        137,
        138,
        146,
        147,
        148,
        149,
        150,
        151,
        152,
        153,
        154,
        162,
        163,
        164,
        165,
        166,
        167,
        168,
        169,
        170,
        178,
        179,
        180,
        181,
        182,
        183,
        184,
        185,
        186,
        194,
        195,
        196,
        197,
        198,
        199,
        200,
        201,
        202,
        210,
        211,
        212,
        213,
        214,
        215,
        216,
        217,
        218,
        225,
        226,
        227,
        228,
        229,
        230,
        231,
        232,
        233,
        234,
        241,
        242,
        243,
        244,
        245,
        246,
        247,
        248,
        249,
        250
      ];
      var std_dc_chrominance_nrcodes = [0, 0, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0];
      var std_dc_chrominance_values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      var std_ac_chrominance_nrcodes = [0, 0, 2, 1, 2, 4, 4, 3, 4, 7, 5, 4, 4, 0, 1, 2, 119];
      var std_ac_chrominance_values = [
        0,
        1,
        2,
        3,
        17,
        4,
        5,
        33,
        49,
        6,
        18,
        65,
        81,
        7,
        97,
        113,
        19,
        34,
        50,
        129,
        8,
        20,
        66,
        145,
        161,
        177,
        193,
        9,
        35,
        51,
        82,
        240,
        21,
        98,
        114,
        209,
        10,
        22,
        36,
        52,
        225,
        37,
        241,
        23,
        24,
        25,
        26,
        38,
        39,
        40,
        41,
        42,
        53,
        54,
        55,
        56,
        57,
        58,
        67,
        68,
        69,
        70,
        71,
        72,
        73,
        74,
        83,
        84,
        85,
        86,
        87,
        88,
        89,
        90,
        99,
        100,
        101,
        102,
        103,
        104,
        105,
        106,
        115,
        116,
        117,
        118,
        119,
        120,
        121,
        122,
        130,
        131,
        132,
        133,
        134,
        135,
        136,
        137,
        138,
        146,
        147,
        148,
        149,
        150,
        151,
        152,
        153,
        154,
        162,
        163,
        164,
        165,
        166,
        167,
        168,
        169,
        170,
        178,
        179,
        180,
        181,
        182,
        183,
        184,
        185,
        186,
        194,
        195,
        196,
        197,
        198,
        199,
        200,
        201,
        202,
        210,
        211,
        212,
        213,
        214,
        215,
        216,
        217,
        218,
        226,
        227,
        228,
        229,
        230,
        231,
        232,
        233,
        234,
        242,
        243,
        244,
        245,
        246,
        247,
        248,
        249,
        250
      ];
      function initQuantTables(sf) {
        var YQT = [
          16,
          11,
          10,
          16,
          24,
          40,
          51,
          61,
          12,
          12,
          14,
          19,
          26,
          58,
          60,
          55,
          14,
          13,
          16,
          24,
          40,
          57,
          69,
          56,
          14,
          17,
          22,
          29,
          51,
          87,
          80,
          62,
          18,
          22,
          37,
          56,
          68,
          109,
          103,
          77,
          24,
          35,
          55,
          64,
          81,
          104,
          113,
          92,
          49,
          64,
          78,
          87,
          103,
          121,
          120,
          101,
          72,
          92,
          95,
          98,
          112,
          100,
          103,
          99
        ];
        for (var i = 0; i < 64; i++) {
          var t = ffloor((YQT[i] * sf + 50) / 100);
          if (t < 1) {
            t = 1;
          } else if (t > 255) {
            t = 255;
          }
          YTable[ZigZag[i]] = t;
        }
        var UVQT = [
          17,
          18,
          24,
          47,
          99,
          99,
          99,
          99,
          18,
          21,
          26,
          66,
          99,
          99,
          99,
          99,
          24,
          26,
          56,
          99,
          99,
          99,
          99,
          99,
          47,
          66,
          99,
          99,
          99,
          99,
          99,
          99,
          99,
          99,
          99,
          99,
          99,
          99,
          99,
          99,
          99,
          99,
          99,
          99,
          99,
          99,
          99,
          99,
          99,
          99,
          99,
          99,
          99,
          99,
          99,
          99,
          99,
          99,
          99,
          99,
          99,
          99,
          99,
          99
        ];
        for (var j = 0; j < 64; j++) {
          var u = ffloor((UVQT[j] * sf + 50) / 100);
          if (u < 1) {
            u = 1;
          } else if (u > 255) {
            u = 255;
          }
          UVTable[ZigZag[j]] = u;
        }
        var aasf = [
          1,
          1.387039845,
          1.306562965,
          1.175875602,
          1,
          0.785694958,
          0.5411961,
          0.275899379
        ];
        var k = 0;
        for (var row = 0; row < 8; row++) {
          for (var col = 0; col < 8; col++) {
            fdtbl_Y[k] = 1 / (YTable[ZigZag[k]] * aasf[row] * aasf[col] * 8);
            fdtbl_UV[k] = 1 / (UVTable[ZigZag[k]] * aasf[row] * aasf[col] * 8);
            k++;
          }
        }
      }
      function computeHuffmanTbl(nrcodes, std_table) {
        var codevalue = 0;
        var pos_in_table = 0;
        var HT = new Array();
        for (var k = 1; k <= 16; k++) {
          for (var j = 1; j <= nrcodes[k]; j++) {
            HT[std_table[pos_in_table]] = [];
            HT[std_table[pos_in_table]][0] = codevalue;
            HT[std_table[pos_in_table]][1] = k;
            pos_in_table++;
            codevalue++;
          }
          codevalue *= 2;
        }
        return HT;
      }
      function initHuffmanTbl() {
        YDC_HT = computeHuffmanTbl(std_dc_luminance_nrcodes, std_dc_luminance_values);
        UVDC_HT = computeHuffmanTbl(std_dc_chrominance_nrcodes, std_dc_chrominance_values);
        YAC_HT = computeHuffmanTbl(std_ac_luminance_nrcodes, std_ac_luminance_values);
        UVAC_HT = computeHuffmanTbl(std_ac_chrominance_nrcodes, std_ac_chrominance_values);
      }
      function initCategoryNumber() {
        var nrlower = 1;
        var nrupper = 2;
        for (var cat = 1; cat <= 15; cat++) {
          for (var nr = nrlower; nr < nrupper; nr++) {
            category[32767 + nr] = cat;
            bitcode[32767 + nr] = [];
            bitcode[32767 + nr][1] = cat;
            bitcode[32767 + nr][0] = nr;
          }
          for (var nrneg = -(nrupper - 1); nrneg <= -nrlower; nrneg++) {
            category[32767 + nrneg] = cat;
            bitcode[32767 + nrneg] = [];
            bitcode[32767 + nrneg][1] = cat;
            bitcode[32767 + nrneg][0] = nrupper - 1 + nrneg;
          }
          nrlower <<= 1;
          nrupper <<= 1;
        }
      }
      function initRGBYUVTable() {
        for (var i = 0; i < 256; i++) {
          RGB_YUV_TABLE[i] = 19595 * i;
          RGB_YUV_TABLE[i + 256 >> 0] = 38470 * i;
          RGB_YUV_TABLE[i + 512 >> 0] = 7471 * i + 32768;
          RGB_YUV_TABLE[i + 768 >> 0] = -11059 * i;
          RGB_YUV_TABLE[i + 1024 >> 0] = -21709 * i;
          RGB_YUV_TABLE[i + 1280 >> 0] = 32768 * i + 8421375;
          RGB_YUV_TABLE[i + 1536 >> 0] = -27439 * i;
          RGB_YUV_TABLE[i + 1792 >> 0] = -5329 * i;
        }
      }
      function writeBits(bs) {
        var value = bs[0];
        var posval = bs[1] - 1;
        while (posval >= 0) {
          if (value & 1 << posval) {
            bytenew |= 1 << bytepos;
          }
          posval--;
          bytepos--;
          if (bytepos < 0) {
            if (bytenew == 255) {
              writeByte(255);
              writeByte(0);
            } else {
              writeByte(bytenew);
            }
            bytepos = 7;
            bytenew = 0;
          }
        }
      }
      function writeByte(value) {
        byteout.push(value);
      }
      function writeWord(value) {
        writeByte(value >> 8 & 255);
        writeByte(value & 255);
      }
      function fDCTQuant(data, fdtbl) {
        var d0, d1, d2, d3, d4, d5, d6, d7;
        var dataOff = 0;
        var i;
        var I8 = 8;
        var I64 = 64;
        for (i = 0; i < I8; ++i) {
          d0 = data[dataOff];
          d1 = data[dataOff + 1];
          d2 = data[dataOff + 2];
          d3 = data[dataOff + 3];
          d4 = data[dataOff + 4];
          d5 = data[dataOff + 5];
          d6 = data[dataOff + 6];
          d7 = data[dataOff + 7];
          var tmp0 = d0 + d7;
          var tmp7 = d0 - d7;
          var tmp1 = d1 + d6;
          var tmp6 = d1 - d6;
          var tmp2 = d2 + d5;
          var tmp5 = d2 - d5;
          var tmp3 = d3 + d4;
          var tmp4 = d3 - d4;
          var tmp10 = tmp0 + tmp3;
          var tmp13 = tmp0 - tmp3;
          var tmp11 = tmp1 + tmp2;
          var tmp12 = tmp1 - tmp2;
          data[dataOff] = tmp10 + tmp11;
          data[dataOff + 4] = tmp10 - tmp11;
          var z1 = (tmp12 + tmp13) * 0.707106781;
          data[dataOff + 2] = tmp13 + z1;
          data[dataOff + 6] = tmp13 - z1;
          tmp10 = tmp4 + tmp5;
          tmp11 = tmp5 + tmp6;
          tmp12 = tmp6 + tmp7;
          var z5 = (tmp10 - tmp12) * 0.382683433;
          var z2 = 0.5411961 * tmp10 + z5;
          var z4 = 1.306562965 * tmp12 + z5;
          var z3 = tmp11 * 0.707106781;
          var z11 = tmp7 + z3;
          var z13 = tmp7 - z3;
          data[dataOff + 5] = z13 + z2;
          data[dataOff + 3] = z13 - z2;
          data[dataOff + 1] = z11 + z4;
          data[dataOff + 7] = z11 - z4;
          dataOff += 8;
        }
        dataOff = 0;
        for (i = 0; i < I8; ++i) {
          d0 = data[dataOff];
          d1 = data[dataOff + 8];
          d2 = data[dataOff + 16];
          d3 = data[dataOff + 24];
          d4 = data[dataOff + 32];
          d5 = data[dataOff + 40];
          d6 = data[dataOff + 48];
          d7 = data[dataOff + 56];
          var tmp0p2 = d0 + d7;
          var tmp7p2 = d0 - d7;
          var tmp1p2 = d1 + d6;
          var tmp6p2 = d1 - d6;
          var tmp2p2 = d2 + d5;
          var tmp5p2 = d2 - d5;
          var tmp3p2 = d3 + d4;
          var tmp4p2 = d3 - d4;
          var tmp10p2 = tmp0p2 + tmp3p2;
          var tmp13p2 = tmp0p2 - tmp3p2;
          var tmp11p2 = tmp1p2 + tmp2p2;
          var tmp12p2 = tmp1p2 - tmp2p2;
          data[dataOff] = tmp10p2 + tmp11p2;
          data[dataOff + 32] = tmp10p2 - tmp11p2;
          var z1p2 = (tmp12p2 + tmp13p2) * 0.707106781;
          data[dataOff + 16] = tmp13p2 + z1p2;
          data[dataOff + 48] = tmp13p2 - z1p2;
          tmp10p2 = tmp4p2 + tmp5p2;
          tmp11p2 = tmp5p2 + tmp6p2;
          tmp12p2 = tmp6p2 + tmp7p2;
          var z5p2 = (tmp10p2 - tmp12p2) * 0.382683433;
          var z2p2 = 0.5411961 * tmp10p2 + z5p2;
          var z4p2 = 1.306562965 * tmp12p2 + z5p2;
          var z3p2 = tmp11p2 * 0.707106781;
          var z11p2 = tmp7p2 + z3p2;
          var z13p2 = tmp7p2 - z3p2;
          data[dataOff + 40] = z13p2 + z2p2;
          data[dataOff + 24] = z13p2 - z2p2;
          data[dataOff + 8] = z11p2 + z4p2;
          data[dataOff + 56] = z11p2 - z4p2;
          dataOff++;
        }
        var fDCTQuant2;
        for (i = 0; i < I64; ++i) {
          fDCTQuant2 = data[i] * fdtbl[i];
          outputfDCTQuant[i] = fDCTQuant2 > 0 ? fDCTQuant2 + 0.5 | 0 : fDCTQuant2 - 0.5 | 0;
        }
        return outputfDCTQuant;
      }
      function writeAPP0() {
        writeWord(65504);
        writeWord(16);
        writeByte(74);
        writeByte(70);
        writeByte(73);
        writeByte(70);
        writeByte(0);
        writeByte(1);
        writeByte(1);
        writeByte(0);
        writeWord(1);
        writeWord(1);
        writeByte(0);
        writeByte(0);
      }
      function writeAPP1(exifBuffer) {
        if (!exifBuffer) return;
        writeWord(65505);
        if (exifBuffer[0] === 69 && exifBuffer[1] === 120 && exifBuffer[2] === 105 && exifBuffer[3] === 102) {
          writeWord(exifBuffer.length + 2);
        } else {
          writeWord(exifBuffer.length + 5 + 2);
          writeByte(69);
          writeByte(120);
          writeByte(105);
          writeByte(102);
          writeByte(0);
        }
        for (var i = 0; i < exifBuffer.length; i++) {
          writeByte(exifBuffer[i]);
        }
      }
      function writeSOF0(width, height) {
        writeWord(65472);
        writeWord(17);
        writeByte(8);
        writeWord(height);
        writeWord(width);
        writeByte(3);
        writeByte(1);
        writeByte(17);
        writeByte(0);
        writeByte(2);
        writeByte(17);
        writeByte(1);
        writeByte(3);
        writeByte(17);
        writeByte(1);
      }
      function writeDQT() {
        writeWord(65499);
        writeWord(132);
        writeByte(0);
        for (var i = 0; i < 64; i++) {
          writeByte(YTable[i]);
        }
        writeByte(1);
        for (var j = 0; j < 64; j++) {
          writeByte(UVTable[j]);
        }
      }
      function writeDHT() {
        writeWord(65476);
        writeWord(418);
        writeByte(0);
        for (var i = 0; i < 16; i++) {
          writeByte(std_dc_luminance_nrcodes[i + 1]);
        }
        for (var j = 0; j <= 11; j++) {
          writeByte(std_dc_luminance_values[j]);
        }
        writeByte(16);
        for (var k = 0; k < 16; k++) {
          writeByte(std_ac_luminance_nrcodes[k + 1]);
        }
        for (var l = 0; l <= 161; l++) {
          writeByte(std_ac_luminance_values[l]);
        }
        writeByte(1);
        for (var m = 0; m < 16; m++) {
          writeByte(std_dc_chrominance_nrcodes[m + 1]);
        }
        for (var n = 0; n <= 11; n++) {
          writeByte(std_dc_chrominance_values[n]);
        }
        writeByte(17);
        for (var o = 0; o < 16; o++) {
          writeByte(std_ac_chrominance_nrcodes[o + 1]);
        }
        for (var p = 0; p <= 161; p++) {
          writeByte(std_ac_chrominance_values[p]);
        }
      }
      function writeCOM(comments) {
        if (typeof comments === "undefined" || comments.constructor !== Array) return;
        comments.forEach((e) => {
          if (typeof e !== "string") return;
          writeWord(65534);
          var l = e.length;
          writeWord(l + 2);
          var i;
          for (i = 0; i < l; i++)
            writeByte(e.charCodeAt(i));
        });
      }
      function writeSOS() {
        writeWord(65498);
        writeWord(12);
        writeByte(3);
        writeByte(1);
        writeByte(0);
        writeByte(2);
        writeByte(17);
        writeByte(3);
        writeByte(17);
        writeByte(0);
        writeByte(63);
        writeByte(0);
      }
      function processDU(CDU, fdtbl, DC, HTDC, HTAC) {
        var EOB = HTAC[0];
        var M16zeroes = HTAC[240];
        var pos;
        var I16 = 16;
        var I63 = 63;
        var I64 = 64;
        var DU_DCT = fDCTQuant(CDU, fdtbl);
        for (var j = 0; j < I64; ++j) {
          DU[ZigZag[j]] = DU_DCT[j];
        }
        var Diff = DU[0] - DC;
        DC = DU[0];
        if (Diff == 0) {
          writeBits(HTDC[0]);
        } else {
          pos = 32767 + Diff;
          writeBits(HTDC[category[pos]]);
          writeBits(bitcode[pos]);
        }
        var end0pos = 63;
        for (; end0pos > 0 && DU[end0pos] == 0; end0pos--) {
        }
        ;
        if (end0pos == 0) {
          writeBits(EOB);
          return DC;
        }
        var i = 1;
        var lng;
        while (i <= end0pos) {
          var startpos = i;
          for (; DU[i] == 0 && i <= end0pos; ++i) {
          }
          var nrzeroes = i - startpos;
          if (nrzeroes >= I16) {
            lng = nrzeroes >> 4;
            for (var nrmarker = 1; nrmarker <= lng; ++nrmarker)
              writeBits(M16zeroes);
            nrzeroes = nrzeroes & 15;
          }
          pos = 32767 + DU[i];
          writeBits(HTAC[(nrzeroes << 4) + category[pos]]);
          writeBits(bitcode[pos]);
          i++;
        }
        if (end0pos != I63) {
          writeBits(EOB);
        }
        return DC;
      }
      function initCharLookupTable() {
        var sfcc = String.fromCharCode;
        for (var i = 0; i < 256; i++) {
          clt[i] = sfcc(i);
        }
      }
      this.encode = function(image, quality2) {
        var time_start = (/* @__PURE__ */ new Date()).getTime();
        if (quality2) setQuality(quality2);
        byteout = new Array();
        bytenew = 0;
        bytepos = 7;
        writeWord(65496);
        writeAPP0();
        writeCOM(image.comments);
        writeAPP1(image.exifBuffer);
        writeDQT();
        writeSOF0(image.width, image.height);
        writeDHT();
        writeSOS();
        var DCY = 0;
        var DCU = 0;
        var DCV = 0;
        bytenew = 0;
        bytepos = 7;
        this.encode.displayName = "_encode_";
        var imageData = image.data;
        var width = image.width;
        var height = image.height;
        var quadWidth = width * 4;
        var tripleWidth = width * 3;
        var x, y = 0;
        var r, g, b;
        var start, p, col, row, pos;
        while (y < height) {
          x = 0;
          while (x < quadWidth) {
            start = quadWidth * y + x;
            p = start;
            col = -1;
            row = 0;
            for (pos = 0; pos < 64; pos++) {
              row = pos >> 3;
              col = (pos & 7) * 4;
              p = start + row * quadWidth + col;
              if (y + row >= height) {
                p -= quadWidth * (y + 1 + row - height);
              }
              if (x + col >= quadWidth) {
                p -= x + col - quadWidth + 4;
              }
              r = imageData[p++];
              g = imageData[p++];
              b = imageData[p++];
              YDU[pos] = (RGB_YUV_TABLE[r] + RGB_YUV_TABLE[g + 256 >> 0] + RGB_YUV_TABLE[b + 512 >> 0] >> 16) - 128;
              UDU[pos] = (RGB_YUV_TABLE[r + 768 >> 0] + RGB_YUV_TABLE[g + 1024 >> 0] + RGB_YUV_TABLE[b + 1280 >> 0] >> 16) - 128;
              VDU[pos] = (RGB_YUV_TABLE[r + 1280 >> 0] + RGB_YUV_TABLE[g + 1536 >> 0] + RGB_YUV_TABLE[b + 1792 >> 0] >> 16) - 128;
            }
            DCY = processDU(YDU, fdtbl_Y, DCY, YDC_HT, YAC_HT);
            DCU = processDU(UDU, fdtbl_UV, DCU, UVDC_HT, UVAC_HT);
            DCV = processDU(VDU, fdtbl_UV, DCV, UVDC_HT, UVAC_HT);
            x += 32;
          }
          y += 8;
        }
        if (bytepos >= 0) {
          var fillbits = [];
          fillbits[1] = bytepos + 1;
          fillbits[0] = (1 << bytepos + 1) - 1;
          writeBits(fillbits);
        }
        writeWord(65497);
        if (typeof module2 === "undefined") return new Uint8Array(byteout);
        return Buffer.from(byteout);
        var jpegDataUri = "data:image/jpeg;base64," + btoa2(byteout.join(""));
        byteout = [];
        var duration = (/* @__PURE__ */ new Date()).getTime() - time_start;
        return jpegDataUri;
      };
      function setQuality(quality2) {
        if (quality2 <= 0) {
          quality2 = 1;
        }
        if (quality2 > 100) {
          quality2 = 100;
        }
        if (currentQuality == quality2) return;
        var sf = 0;
        if (quality2 < 50) {
          sf = Math.floor(5e3 / quality2);
        } else {
          sf = Math.floor(200 - quality2 * 2);
        }
        initQuantTables(sf);
        currentQuality = quality2;
      }
      function init() {
        var time_start = (/* @__PURE__ */ new Date()).getTime();
        if (!quality) quality = 50;
        initCharLookupTable();
        initHuffmanTbl();
        initCategoryNumber();
        initRGBYUVTable();
        setQuality(quality);
        var duration = (/* @__PURE__ */ new Date()).getTime() - time_start;
      }
      init();
    }
    if (typeof module2 !== "undefined") {
      module2.exports = encode;
    } else if (typeof window !== "undefined") {
      window["jpeg-js"] = window["jpeg-js"] || {};
      window["jpeg-js"].encode = encode;
    }
    function encode(imgData, qu) {
      if (typeof qu === "undefined") qu = 50;
      var encoder = new JPEGEncoder(qu);
      var data = encoder.encode(imgData, qu);
      return {
        data,
        width: imgData.width,
        height: imgData.height
      };
    }
  }
});

// ../../node_modules/jpeg-js/lib/decoder.js
var require_decoder = __commonJS({
  "../../node_modules/jpeg-js/lib/decoder.js"(exports2, module2) {
    var JpegImage = (function jpegImage() {
      "use strict";
      var dctZigZag = new Int32Array([
        0,
        1,
        8,
        16,
        9,
        2,
        3,
        10,
        17,
        24,
        32,
        25,
        18,
        11,
        4,
        5,
        12,
        19,
        26,
        33,
        40,
        48,
        41,
        34,
        27,
        20,
        13,
        6,
        7,
        14,
        21,
        28,
        35,
        42,
        49,
        56,
        57,
        50,
        43,
        36,
        29,
        22,
        15,
        23,
        30,
        37,
        44,
        51,
        58,
        59,
        52,
        45,
        38,
        31,
        39,
        46,
        53,
        60,
        61,
        54,
        47,
        55,
        62,
        63
      ]);
      var dctCos1 = 4017;
      var dctSin1 = 799;
      var dctCos3 = 3406;
      var dctSin3 = 2276;
      var dctCos6 = 1567;
      var dctSin6 = 3784;
      var dctSqrt2 = 5793;
      var dctSqrt1d2 = 2896;
      function constructor() {
      }
      function buildHuffmanTable(codeLengths, values) {
        var k = 0, code = [], i, j, length = 16;
        while (length > 0 && !codeLengths[length - 1])
          length--;
        code.push({ children: [], index: 0 });
        var p = code[0], q;
        for (i = 0; i < length; i++) {
          for (j = 0; j < codeLengths[i]; j++) {
            p = code.pop();
            p.children[p.index] = values[k];
            while (p.index > 0) {
              if (code.length === 0)
                throw new Error("Could not recreate Huffman Table");
              p = code.pop();
            }
            p.index++;
            code.push(p);
            while (code.length <= i) {
              code.push(q = { children: [], index: 0 });
              p.children[p.index] = q.children;
              p = q;
            }
            k++;
          }
          if (i + 1 < length) {
            code.push(q = { children: [], index: 0 });
            p.children[p.index] = q.children;
            p = q;
          }
        }
        return code[0].children;
      }
      function decodeScan(data, offset, frame, components, resetInterval, spectralStart, spectralEnd, successivePrev, successive, opts) {
        var precision = frame.precision;
        var samplesPerLine = frame.samplesPerLine;
        var scanLines = frame.scanLines;
        var mcusPerLine = frame.mcusPerLine;
        var progressive = frame.progressive;
        var maxH = frame.maxH, maxV = frame.maxV;
        var startOffset2 = offset, bitsData = 0, bitsCount = 0;
        function readBit() {
          if (bitsCount > 0) {
            bitsCount--;
            return bitsData >> bitsCount & 1;
          }
          bitsData = data[offset++];
          if (bitsData == 255) {
            var nextByte = data[offset++];
            if (nextByte) {
              throw new Error("unexpected marker: " + (bitsData << 8 | nextByte).toString(16));
            }
          }
          bitsCount = 7;
          return bitsData >>> 7;
        }
        function decodeHuffman(tree2) {
          var node = tree2, bit;
          while ((bit = readBit()) !== null) {
            node = node[bit];
            if (typeof node === "number")
              return node;
            if (typeof node !== "object")
              throw new Error("invalid huffman sequence");
          }
          return null;
        }
        function receive(length) {
          var n2 = 0;
          while (length > 0) {
            var bit = readBit();
            if (bit === null) return;
            n2 = n2 << 1 | bit;
            length--;
          }
          return n2;
        }
        function receiveAndExtend(length) {
          var n2 = receive(length);
          if (n2 >= 1 << length - 1)
            return n2;
          return n2 + (-1 << length) + 1;
        }
        function decodeBaseline(component2, zz) {
          var t = decodeHuffman(component2.huffmanTableDC);
          var diff = t === 0 ? 0 : receiveAndExtend(t);
          zz[0] = component2.pred += diff;
          var k2 = 1;
          while (k2 < 64) {
            var rs = decodeHuffman(component2.huffmanTableAC);
            var s = rs & 15, r = rs >> 4;
            if (s === 0) {
              if (r < 15)
                break;
              k2 += 16;
              continue;
            }
            k2 += r;
            var z = dctZigZag[k2];
            zz[z] = receiveAndExtend(s);
            k2++;
          }
        }
        function decodeDCFirst(component2, zz) {
          var t = decodeHuffman(component2.huffmanTableDC);
          var diff = t === 0 ? 0 : receiveAndExtend(t) << successive;
          zz[0] = component2.pred += diff;
        }
        function decodeDCSuccessive(component2, zz) {
          zz[0] |= readBit() << successive;
        }
        var eobrun = 0;
        function decodeACFirst(component2, zz) {
          if (eobrun > 0) {
            eobrun--;
            return;
          }
          var k2 = spectralStart, e = spectralEnd;
          while (k2 <= e) {
            var rs = decodeHuffman(component2.huffmanTableAC);
            var s = rs & 15, r = rs >> 4;
            if (s === 0) {
              if (r < 15) {
                eobrun = receive(r) + (1 << r) - 1;
                break;
              }
              k2 += 16;
              continue;
            }
            k2 += r;
            var z = dctZigZag[k2];
            zz[z] = receiveAndExtend(s) * (1 << successive);
            k2++;
          }
        }
        var successiveACState = 0, successiveACNextValue;
        function decodeACSuccessive(component2, zz) {
          var k2 = spectralStart, e = spectralEnd, r = 0;
          while (k2 <= e) {
            var z = dctZigZag[k2];
            var direction = zz[z] < 0 ? -1 : 1;
            switch (successiveACState) {
              case 0:
                var rs = decodeHuffman(component2.huffmanTableAC);
                var s = rs & 15, r = rs >> 4;
                if (s === 0) {
                  if (r < 15) {
                    eobrun = receive(r) + (1 << r);
                    successiveACState = 4;
                  } else {
                    r = 16;
                    successiveACState = 1;
                  }
                } else {
                  if (s !== 1)
                    throw new Error("invalid ACn encoding");
                  successiveACNextValue = receiveAndExtend(s);
                  successiveACState = r ? 2 : 3;
                }
                continue;
              case 1:
              // skipping r zero items
              case 2:
                if (zz[z])
                  zz[z] += (readBit() << successive) * direction;
                else {
                  r--;
                  if (r === 0)
                    successiveACState = successiveACState == 2 ? 3 : 0;
                }
                break;
              case 3:
                if (zz[z])
                  zz[z] += (readBit() << successive) * direction;
                else {
                  zz[z] = successiveACNextValue << successive;
                  successiveACState = 0;
                }
                break;
              case 4:
                if (zz[z])
                  zz[z] += (readBit() << successive) * direction;
                break;
            }
            k2++;
          }
          if (successiveACState === 4) {
            eobrun--;
            if (eobrun === 0)
              successiveACState = 0;
          }
        }
        function decodeMcu(component2, decode3, mcu2, row, col) {
          var mcuRow = mcu2 / mcusPerLine | 0;
          var mcuCol = mcu2 % mcusPerLine;
          var blockRow = mcuRow * component2.v + row;
          var blockCol = mcuCol * component2.h + col;
          if (component2.blocks[blockRow] === void 0 && opts.tolerantDecoding)
            return;
          decode3(component2, component2.blocks[blockRow][blockCol]);
        }
        function decodeBlock(component2, decode3, mcu2) {
          var blockRow = mcu2 / component2.blocksPerLine | 0;
          var blockCol = mcu2 % component2.blocksPerLine;
          if (component2.blocks[blockRow] === void 0 && opts.tolerantDecoding)
            return;
          decode3(component2, component2.blocks[blockRow][blockCol]);
        }
        var componentsLength = components.length;
        var component, i, j, k, n;
        var decodeFn;
        if (progressive) {
          if (spectralStart === 0)
            decodeFn = successivePrev === 0 ? decodeDCFirst : decodeDCSuccessive;
          else
            decodeFn = successivePrev === 0 ? decodeACFirst : decodeACSuccessive;
        } else {
          decodeFn = decodeBaseline;
        }
        var mcu = 0, marker;
        var mcuExpected;
        if (componentsLength == 1) {
          mcuExpected = components[0].blocksPerLine * components[0].blocksPerColumn;
        } else {
          mcuExpected = mcusPerLine * frame.mcusPerColumn;
        }
        if (!resetInterval) resetInterval = mcuExpected;
        var h, v;
        while (mcu < mcuExpected) {
          for (i = 0; i < componentsLength; i++)
            components[i].pred = 0;
          eobrun = 0;
          if (componentsLength == 1) {
            component = components[0];
            for (n = 0; n < resetInterval; n++) {
              decodeBlock(component, decodeFn, mcu);
              mcu++;
            }
          } else {
            for (n = 0; n < resetInterval; n++) {
              for (i = 0; i < componentsLength; i++) {
                component = components[i];
                h = component.h;
                v = component.v;
                for (j = 0; j < v; j++) {
                  for (k = 0; k < h; k++) {
                    decodeMcu(component, decodeFn, mcu, j, k);
                  }
                }
              }
              mcu++;
              if (mcu === mcuExpected) break;
            }
          }
          if (mcu === mcuExpected) {
            do {
              if (data[offset] === 255) {
                if (data[offset + 1] !== 0) {
                  break;
                }
              }
              offset += 1;
            } while (offset < data.length - 2);
          }
          bitsCount = 0;
          marker = data[offset] << 8 | data[offset + 1];
          if (marker < 65280) {
            throw new Error("marker was not found");
          }
          if (marker >= 65488 && marker <= 65495) {
            offset += 2;
          } else
            break;
        }
        return offset - startOffset2;
      }
      function buildComponentData(frame, component) {
        var lines = [];
        var blocksPerLine = component.blocksPerLine;
        var blocksPerColumn = component.blocksPerColumn;
        var samplesPerLine = blocksPerLine << 3;
        var R = new Int32Array(64), r = new Uint8Array(64);
        function quantizeAndInverse(zz, dataOut, dataIn) {
          var qt = component.quantizationTable;
          var v0, v1, v2, v3, v4, v5, v6, v7, t;
          var p = dataIn;
          var i2;
          for (i2 = 0; i2 < 64; i2++)
            p[i2] = zz[i2] * qt[i2];
          for (i2 = 0; i2 < 8; ++i2) {
            var row = 8 * i2;
            if (p[1 + row] == 0 && p[2 + row] == 0 && p[3 + row] == 0 && p[4 + row] == 0 && p[5 + row] == 0 && p[6 + row] == 0 && p[7 + row] == 0) {
              t = dctSqrt2 * p[0 + row] + 512 >> 10;
              p[0 + row] = t;
              p[1 + row] = t;
              p[2 + row] = t;
              p[3 + row] = t;
              p[4 + row] = t;
              p[5 + row] = t;
              p[6 + row] = t;
              p[7 + row] = t;
              continue;
            }
            v0 = dctSqrt2 * p[0 + row] + 128 >> 8;
            v1 = dctSqrt2 * p[4 + row] + 128 >> 8;
            v2 = p[2 + row];
            v3 = p[6 + row];
            v4 = dctSqrt1d2 * (p[1 + row] - p[7 + row]) + 128 >> 8;
            v7 = dctSqrt1d2 * (p[1 + row] + p[7 + row]) + 128 >> 8;
            v5 = p[3 + row] << 4;
            v6 = p[5 + row] << 4;
            t = v0 - v1 + 1 >> 1;
            v0 = v0 + v1 + 1 >> 1;
            v1 = t;
            t = v2 * dctSin6 + v3 * dctCos6 + 128 >> 8;
            v2 = v2 * dctCos6 - v3 * dctSin6 + 128 >> 8;
            v3 = t;
            t = v4 - v6 + 1 >> 1;
            v4 = v4 + v6 + 1 >> 1;
            v6 = t;
            t = v7 + v5 + 1 >> 1;
            v5 = v7 - v5 + 1 >> 1;
            v7 = t;
            t = v0 - v3 + 1 >> 1;
            v0 = v0 + v3 + 1 >> 1;
            v3 = t;
            t = v1 - v2 + 1 >> 1;
            v1 = v1 + v2 + 1 >> 1;
            v2 = t;
            t = v4 * dctSin3 + v7 * dctCos3 + 2048 >> 12;
            v4 = v4 * dctCos3 - v7 * dctSin3 + 2048 >> 12;
            v7 = t;
            t = v5 * dctSin1 + v6 * dctCos1 + 2048 >> 12;
            v5 = v5 * dctCos1 - v6 * dctSin1 + 2048 >> 12;
            v6 = t;
            p[0 + row] = v0 + v7;
            p[7 + row] = v0 - v7;
            p[1 + row] = v1 + v6;
            p[6 + row] = v1 - v6;
            p[2 + row] = v2 + v5;
            p[5 + row] = v2 - v5;
            p[3 + row] = v3 + v4;
            p[4 + row] = v3 - v4;
          }
          for (i2 = 0; i2 < 8; ++i2) {
            var col = i2;
            if (p[1 * 8 + col] == 0 && p[2 * 8 + col] == 0 && p[3 * 8 + col] == 0 && p[4 * 8 + col] == 0 && p[5 * 8 + col] == 0 && p[6 * 8 + col] == 0 && p[7 * 8 + col] == 0) {
              t = dctSqrt2 * dataIn[i2 + 0] + 8192 >> 14;
              p[0 * 8 + col] = t;
              p[1 * 8 + col] = t;
              p[2 * 8 + col] = t;
              p[3 * 8 + col] = t;
              p[4 * 8 + col] = t;
              p[5 * 8 + col] = t;
              p[6 * 8 + col] = t;
              p[7 * 8 + col] = t;
              continue;
            }
            v0 = dctSqrt2 * p[0 * 8 + col] + 2048 >> 12;
            v1 = dctSqrt2 * p[4 * 8 + col] + 2048 >> 12;
            v2 = p[2 * 8 + col];
            v3 = p[6 * 8 + col];
            v4 = dctSqrt1d2 * (p[1 * 8 + col] - p[7 * 8 + col]) + 2048 >> 12;
            v7 = dctSqrt1d2 * (p[1 * 8 + col] + p[7 * 8 + col]) + 2048 >> 12;
            v5 = p[3 * 8 + col];
            v6 = p[5 * 8 + col];
            t = v0 - v1 + 1 >> 1;
            v0 = v0 + v1 + 1 >> 1;
            v1 = t;
            t = v2 * dctSin6 + v3 * dctCos6 + 2048 >> 12;
            v2 = v2 * dctCos6 - v3 * dctSin6 + 2048 >> 12;
            v3 = t;
            t = v4 - v6 + 1 >> 1;
            v4 = v4 + v6 + 1 >> 1;
            v6 = t;
            t = v7 + v5 + 1 >> 1;
            v5 = v7 - v5 + 1 >> 1;
            v7 = t;
            t = v0 - v3 + 1 >> 1;
            v0 = v0 + v3 + 1 >> 1;
            v3 = t;
            t = v1 - v2 + 1 >> 1;
            v1 = v1 + v2 + 1 >> 1;
            v2 = t;
            t = v4 * dctSin3 + v7 * dctCos3 + 2048 >> 12;
            v4 = v4 * dctCos3 - v7 * dctSin3 + 2048 >> 12;
            v7 = t;
            t = v5 * dctSin1 + v6 * dctCos1 + 2048 >> 12;
            v5 = v5 * dctCos1 - v6 * dctSin1 + 2048 >> 12;
            v6 = t;
            p[0 * 8 + col] = v0 + v7;
            p[7 * 8 + col] = v0 - v7;
            p[1 * 8 + col] = v1 + v6;
            p[6 * 8 + col] = v1 - v6;
            p[2 * 8 + col] = v2 + v5;
            p[5 * 8 + col] = v2 - v5;
            p[3 * 8 + col] = v3 + v4;
            p[4 * 8 + col] = v3 - v4;
          }
          for (i2 = 0; i2 < 64; ++i2) {
            var sample2 = 128 + (p[i2] + 8 >> 4);
            dataOut[i2] = sample2 < 0 ? 0 : sample2 > 255 ? 255 : sample2;
          }
        }
        requestMemoryAllocation(samplesPerLine * blocksPerColumn * 8);
        var i, j;
        for (var blockRow = 0; blockRow < blocksPerColumn; blockRow++) {
          var scanLine = blockRow << 3;
          for (i = 0; i < 8; i++)
            lines.push(new Uint8Array(samplesPerLine));
          for (var blockCol = 0; blockCol < blocksPerLine; blockCol++) {
            quantizeAndInverse(component.blocks[blockRow][blockCol], r, R);
            var offset = 0, sample = blockCol << 3;
            for (j = 0; j < 8; j++) {
              var line = lines[scanLine + j];
              for (i = 0; i < 8; i++)
                line[sample + i] = r[offset++];
            }
          }
        }
        return lines;
      }
      function clampTo8bit(a) {
        return a < 0 ? 0 : a > 255 ? 255 : a;
      }
      constructor.prototype = {
        load: function load(path) {
          var xhr = new XMLHttpRequest();
          xhr.open("GET", path, true);
          xhr.responseType = "arraybuffer";
          xhr.onload = (function() {
            var data = new Uint8Array(xhr.response || xhr.mozResponseArrayBuffer);
            this.parse(data);
            if (this.onload)
              this.onload();
          }).bind(this);
          xhr.send(null);
        },
        parse: function parse2(data) {
          var maxResolutionInPixels = this.opts.maxResolutionInMP * 1e3 * 1e3;
          var offset = 0, length = data.length;
          function readUint16() {
            var value = data[offset] << 8 | data[offset + 1];
            offset += 2;
            return value;
          }
          function readDataBlock() {
            var length2 = readUint16();
            var array = data.subarray(offset, offset + length2 - 2);
            offset += array.length;
            return array;
          }
          function prepareComponents(frame2) {
            var maxH2 = 1, maxV2 = 1;
            var component2, componentId2;
            for (componentId2 in frame2.components) {
              if (frame2.components.hasOwnProperty(componentId2)) {
                component2 = frame2.components[componentId2];
                if (maxH2 < component2.h) maxH2 = component2.h;
                if (maxV2 < component2.v) maxV2 = component2.v;
              }
            }
            var mcusPerLine = Math.ceil(frame2.samplesPerLine / 8 / maxH2);
            var mcusPerColumn = Math.ceil(frame2.scanLines / 8 / maxV2);
            for (componentId2 in frame2.components) {
              if (frame2.components.hasOwnProperty(componentId2)) {
                component2 = frame2.components[componentId2];
                var blocksPerLine = Math.ceil(Math.ceil(frame2.samplesPerLine / 8) * component2.h / maxH2);
                var blocksPerColumn = Math.ceil(Math.ceil(frame2.scanLines / 8) * component2.v / maxV2);
                var blocksPerLineForMcu = mcusPerLine * component2.h;
                var blocksPerColumnForMcu = mcusPerColumn * component2.v;
                var blocksToAllocate = blocksPerColumnForMcu * blocksPerLineForMcu;
                var blocks = [];
                requestMemoryAllocation(blocksToAllocate * 256);
                for (var i2 = 0; i2 < blocksPerColumnForMcu; i2++) {
                  var row = [];
                  for (var j2 = 0; j2 < blocksPerLineForMcu; j2++)
                    row.push(new Int32Array(64));
                  blocks.push(row);
                }
                component2.blocksPerLine = blocksPerLine;
                component2.blocksPerColumn = blocksPerColumn;
                component2.blocks = blocks;
              }
            }
            frame2.maxH = maxH2;
            frame2.maxV = maxV2;
            frame2.mcusPerLine = mcusPerLine;
            frame2.mcusPerColumn = mcusPerColumn;
          }
          var jfif = null;
          var adobe = null;
          var pixels = null;
          var frame, resetInterval;
          var quantizationTables = [], frames = [];
          var huffmanTablesAC = [], huffmanTablesDC = [];
          var fileMarker = readUint16();
          var malformedDataOffset = -1;
          this.comments = [];
          if (fileMarker != 65496) {
            throw new Error("SOI not found");
          }
          fileMarker = readUint16();
          while (fileMarker != 65497) {
            var i, j, l;
            switch (fileMarker) {
              case 65280:
                break;
              case 65504:
              // APP0 (Application Specific)
              case 65505:
              // APP1
              case 65506:
              // APP2
              case 65507:
              // APP3
              case 65508:
              // APP4
              case 65509:
              // APP5
              case 65510:
              // APP6
              case 65511:
              // APP7
              case 65512:
              // APP8
              case 65513:
              // APP9
              case 65514:
              // APP10
              case 65515:
              // APP11
              case 65516:
              // APP12
              case 65517:
              // APP13
              case 65518:
              // APP14
              case 65519:
              // APP15
              case 65534:
                var appData = readDataBlock();
                if (fileMarker === 65534) {
                  var comment = String.fromCharCode.apply(null, appData);
                  this.comments.push(comment);
                }
                if (fileMarker === 65504) {
                  if (appData[0] === 74 && appData[1] === 70 && appData[2] === 73 && appData[3] === 70 && appData[4] === 0) {
                    jfif = {
                      version: { major: appData[5], minor: appData[6] },
                      densityUnits: appData[7],
                      xDensity: appData[8] << 8 | appData[9],
                      yDensity: appData[10] << 8 | appData[11],
                      thumbWidth: appData[12],
                      thumbHeight: appData[13],
                      thumbData: appData.subarray(14, 14 + 3 * appData[12] * appData[13])
                    };
                  }
                }
                if (fileMarker === 65505) {
                  if (appData[0] === 69 && appData[1] === 120 && appData[2] === 105 && appData[3] === 102 && appData[4] === 0) {
                    this.exifBuffer = appData.subarray(5, appData.length);
                  }
                }
                if (fileMarker === 65518) {
                  if (appData[0] === 65 && appData[1] === 100 && appData[2] === 111 && appData[3] === 98 && appData[4] === 101 && appData[5] === 0) {
                    adobe = {
                      version: appData[6],
                      flags0: appData[7] << 8 | appData[8],
                      flags1: appData[9] << 8 | appData[10],
                      transformCode: appData[11]
                    };
                  }
                }
                break;
              case 65499:
                var quantizationTablesLength = readUint16();
                var quantizationTablesEnd = quantizationTablesLength + offset - 2;
                while (offset < quantizationTablesEnd) {
                  var quantizationTableSpec = data[offset++];
                  requestMemoryAllocation(64 * 4);
                  var tableData = new Int32Array(64);
                  if (quantizationTableSpec >> 4 === 0) {
                    for (j = 0; j < 64; j++) {
                      var z = dctZigZag[j];
                      tableData[z] = data[offset++];
                    }
                  } else if (quantizationTableSpec >> 4 === 1) {
                    for (j = 0; j < 64; j++) {
                      var z = dctZigZag[j];
                      tableData[z] = readUint16();
                    }
                  } else
                    throw new Error("DQT: invalid table spec");
                  quantizationTables[quantizationTableSpec & 15] = tableData;
                }
                break;
              case 65472:
              // SOF0 (Start of Frame, Baseline DCT)
              case 65473:
              // SOF1 (Start of Frame, Extended DCT)
              case 65474:
                readUint16();
                frame = {};
                frame.extended = fileMarker === 65473;
                frame.progressive = fileMarker === 65474;
                frame.precision = data[offset++];
                frame.scanLines = readUint16();
                frame.samplesPerLine = readUint16();
                frame.components = {};
                frame.componentsOrder = [];
                var pixelsInFrame = frame.scanLines * frame.samplesPerLine;
                if (pixelsInFrame > maxResolutionInPixels) {
                  var exceededAmount = Math.ceil((pixelsInFrame - maxResolutionInPixels) / 1e6);
                  throw new Error(`maxResolutionInMP limit exceeded by ${exceededAmount}MP`);
                }
                var componentsCount = data[offset++], componentId;
                var maxH = 0, maxV = 0;
                for (i = 0; i < componentsCount; i++) {
                  componentId = data[offset];
                  var h = data[offset + 1] >> 4;
                  var v = data[offset + 1] & 15;
                  var qId = data[offset + 2];
                  if (h <= 0 || v <= 0) {
                    throw new Error("Invalid sampling factor, expected values above 0");
                  }
                  frame.componentsOrder.push(componentId);
                  frame.components[componentId] = {
                    h,
                    v,
                    quantizationIdx: qId
                  };
                  offset += 3;
                }
                prepareComponents(frame);
                frames.push(frame);
                break;
              case 65476:
                var huffmanLength = readUint16();
                for (i = 2; i < huffmanLength; ) {
                  var huffmanTableSpec = data[offset++];
                  var codeLengths = new Uint8Array(16);
                  var codeLengthSum = 0;
                  for (j = 0; j < 16; j++, offset++) {
                    codeLengthSum += codeLengths[j] = data[offset];
                  }
                  requestMemoryAllocation(16 + codeLengthSum);
                  var huffmanValues = new Uint8Array(codeLengthSum);
                  for (j = 0; j < codeLengthSum; j++, offset++)
                    huffmanValues[j] = data[offset];
                  i += 17 + codeLengthSum;
                  (huffmanTableSpec >> 4 === 0 ? huffmanTablesDC : huffmanTablesAC)[huffmanTableSpec & 15] = buildHuffmanTable(codeLengths, huffmanValues);
                }
                break;
              case 65501:
                readUint16();
                resetInterval = readUint16();
                break;
              case 65500:
                readUint16();
                readUint16();
                break;
              case 65498:
                var scanLength = readUint16();
                var selectorsCount = data[offset++];
                var components = [], component;
                for (i = 0; i < selectorsCount; i++) {
                  component = frame.components[data[offset++]];
                  var tableSpec = data[offset++];
                  component.huffmanTableDC = huffmanTablesDC[tableSpec >> 4];
                  component.huffmanTableAC = huffmanTablesAC[tableSpec & 15];
                  components.push(component);
                }
                var spectralStart = data[offset++];
                var spectralEnd = data[offset++];
                var successiveApproximation = data[offset++];
                var processed = decodeScan(
                  data,
                  offset,
                  frame,
                  components,
                  resetInterval,
                  spectralStart,
                  spectralEnd,
                  successiveApproximation >> 4,
                  successiveApproximation & 15,
                  this.opts
                );
                offset += processed;
                break;
              case 65535:
                if (data[offset] !== 255) {
                  offset--;
                }
                break;
              default:
                if (data[offset - 3] == 255 && data[offset - 2] >= 192 && data[offset - 2] <= 254) {
                  offset -= 3;
                  break;
                } else if (fileMarker === 224 || fileMarker == 225) {
                  if (malformedDataOffset !== -1) {
                    throw new Error(`first unknown JPEG marker at offset ${malformedDataOffset.toString(16)}, second unknown JPEG marker ${fileMarker.toString(16)} at offset ${(offset - 1).toString(16)}`);
                  }
                  malformedDataOffset = offset - 1;
                  const nextOffset = readUint16();
                  if (data[offset + nextOffset - 2] === 255) {
                    offset += nextOffset - 2;
                    break;
                  }
                }
                throw new Error("unknown JPEG marker " + fileMarker.toString(16));
            }
            fileMarker = readUint16();
          }
          if (frames.length != 1)
            throw new Error("only single frame JPEGs supported");
          for (var i = 0; i < frames.length; i++) {
            var cp = frames[i].components;
            for (var j in cp) {
              cp[j].quantizationTable = quantizationTables[cp[j].quantizationIdx];
              delete cp[j].quantizationIdx;
            }
          }
          this.width = frame.samplesPerLine;
          this.height = frame.scanLines;
          this.jfif = jfif;
          this.adobe = adobe;
          this.components = [];
          for (var i = 0; i < frame.componentsOrder.length; i++) {
            var component = frame.components[frame.componentsOrder[i]];
            this.components.push({
              lines: buildComponentData(frame, component),
              scaleX: component.h / frame.maxH,
              scaleY: component.v / frame.maxV
            });
          }
        },
        getData: function getData(width, height) {
          var scaleX = this.width / width, scaleY = this.height / height;
          var component1, component2, component3, component4;
          var component1Line, component2Line, component3Line, component4Line;
          var x, y;
          var offset = 0;
          var Y, Cb, Cr, K, C, M, Ye, R, G, B;
          var colorTransform;
          var dataLength = width * height * this.components.length;
          requestMemoryAllocation(dataLength);
          var data = new Uint8Array(dataLength);
          switch (this.components.length) {
            case 1:
              component1 = this.components[0];
              for (y = 0; y < height; y++) {
                component1Line = component1.lines[0 | y * component1.scaleY * scaleY];
                for (x = 0; x < width; x++) {
                  Y = component1Line[0 | x * component1.scaleX * scaleX];
                  data[offset++] = Y;
                }
              }
              break;
            case 2:
              component1 = this.components[0];
              component2 = this.components[1];
              for (y = 0; y < height; y++) {
                component1Line = component1.lines[0 | y * component1.scaleY * scaleY];
                component2Line = component2.lines[0 | y * component2.scaleY * scaleY];
                for (x = 0; x < width; x++) {
                  Y = component1Line[0 | x * component1.scaleX * scaleX];
                  data[offset++] = Y;
                  Y = component2Line[0 | x * component2.scaleX * scaleX];
                  data[offset++] = Y;
                }
              }
              break;
            case 3:
              colorTransform = true;
              if (this.adobe && this.adobe.transformCode)
                colorTransform = true;
              else if (typeof this.opts.colorTransform !== "undefined")
                colorTransform = !!this.opts.colorTransform;
              component1 = this.components[0];
              component2 = this.components[1];
              component3 = this.components[2];
              for (y = 0; y < height; y++) {
                component1Line = component1.lines[0 | y * component1.scaleY * scaleY];
                component2Line = component2.lines[0 | y * component2.scaleY * scaleY];
                component3Line = component3.lines[0 | y * component3.scaleY * scaleY];
                for (x = 0; x < width; x++) {
                  if (!colorTransform) {
                    R = component1Line[0 | x * component1.scaleX * scaleX];
                    G = component2Line[0 | x * component2.scaleX * scaleX];
                    B = component3Line[0 | x * component3.scaleX * scaleX];
                  } else {
                    Y = component1Line[0 | x * component1.scaleX * scaleX];
                    Cb = component2Line[0 | x * component2.scaleX * scaleX];
                    Cr = component3Line[0 | x * component3.scaleX * scaleX];
                    R = clampTo8bit(Y + 1.402 * (Cr - 128));
                    G = clampTo8bit(Y - 0.3441363 * (Cb - 128) - 0.71413636 * (Cr - 128));
                    B = clampTo8bit(Y + 1.772 * (Cb - 128));
                  }
                  data[offset++] = R;
                  data[offset++] = G;
                  data[offset++] = B;
                }
              }
              break;
            case 4:
              if (!this.adobe)
                throw new Error("Unsupported color mode (4 components)");
              colorTransform = false;
              if (this.adobe && this.adobe.transformCode)
                colorTransform = true;
              else if (typeof this.opts.colorTransform !== "undefined")
                colorTransform = !!this.opts.colorTransform;
              component1 = this.components[0];
              component2 = this.components[1];
              component3 = this.components[2];
              component4 = this.components[3];
              for (y = 0; y < height; y++) {
                component1Line = component1.lines[0 | y * component1.scaleY * scaleY];
                component2Line = component2.lines[0 | y * component2.scaleY * scaleY];
                component3Line = component3.lines[0 | y * component3.scaleY * scaleY];
                component4Line = component4.lines[0 | y * component4.scaleY * scaleY];
                for (x = 0; x < width; x++) {
                  if (!colorTransform) {
                    C = component1Line[0 | x * component1.scaleX * scaleX];
                    M = component2Line[0 | x * component2.scaleX * scaleX];
                    Ye = component3Line[0 | x * component3.scaleX * scaleX];
                    K = component4Line[0 | x * component4.scaleX * scaleX];
                  } else {
                    Y = component1Line[0 | x * component1.scaleX * scaleX];
                    Cb = component2Line[0 | x * component2.scaleX * scaleX];
                    Cr = component3Line[0 | x * component3.scaleX * scaleX];
                    K = component4Line[0 | x * component4.scaleX * scaleX];
                    C = 255 - clampTo8bit(Y + 1.402 * (Cr - 128));
                    M = 255 - clampTo8bit(Y - 0.3441363 * (Cb - 128) - 0.71413636 * (Cr - 128));
                    Ye = 255 - clampTo8bit(Y + 1.772 * (Cb - 128));
                  }
                  data[offset++] = 255 - C;
                  data[offset++] = 255 - M;
                  data[offset++] = 255 - Ye;
                  data[offset++] = 255 - K;
                }
              }
              break;
            default:
              throw new Error("Unsupported color mode");
          }
          return data;
        },
        copyToImageData: function copyToImageData(imageData, formatAsRGBA) {
          var width = imageData.width, height = imageData.height;
          var imageDataArray = imageData.data;
          var data = this.getData(width, height);
          var i = 0, j = 0, x, y;
          var Y, K, C, M, R, G, B;
          switch (this.components.length) {
            case 1:
              for (y = 0; y < height; y++) {
                for (x = 0; x < width; x++) {
                  Y = data[i++];
                  imageDataArray[j++] = Y;
                  imageDataArray[j++] = Y;
                  imageDataArray[j++] = Y;
                  if (formatAsRGBA) {
                    imageDataArray[j++] = 255;
                  }
                }
              }
              break;
            case 3:
              for (y = 0; y < height; y++) {
                for (x = 0; x < width; x++) {
                  R = data[i++];
                  G = data[i++];
                  B = data[i++];
                  imageDataArray[j++] = R;
                  imageDataArray[j++] = G;
                  imageDataArray[j++] = B;
                  if (formatAsRGBA) {
                    imageDataArray[j++] = 255;
                  }
                }
              }
              break;
            case 4:
              for (y = 0; y < height; y++) {
                for (x = 0; x < width; x++) {
                  C = data[i++];
                  M = data[i++];
                  Y = data[i++];
                  K = data[i++];
                  R = 255 - clampTo8bit(C * (1 - K / 255) + K);
                  G = 255 - clampTo8bit(M * (1 - K / 255) + K);
                  B = 255 - clampTo8bit(Y * (1 - K / 255) + K);
                  imageDataArray[j++] = R;
                  imageDataArray[j++] = G;
                  imageDataArray[j++] = B;
                  if (formatAsRGBA) {
                    imageDataArray[j++] = 255;
                  }
                }
              }
              break;
            default:
              throw new Error("Unsupported color mode");
          }
        }
      };
      var totalBytesAllocated = 0;
      var maxMemoryUsageBytes = 0;
      function requestMemoryAllocation(increaseAmount = 0) {
        var totalMemoryImpactBytes = totalBytesAllocated + increaseAmount;
        if (totalMemoryImpactBytes > maxMemoryUsageBytes) {
          var exceededAmount = Math.ceil((totalMemoryImpactBytes - maxMemoryUsageBytes) / 1024 / 1024);
          throw new Error(`maxMemoryUsageInMB limit exceeded by at least ${exceededAmount}MB`);
        }
        totalBytesAllocated = totalMemoryImpactBytes;
      }
      constructor.resetMaxMemoryUsage = function(maxMemoryUsageBytes_) {
        totalBytesAllocated = 0;
        maxMemoryUsageBytes = maxMemoryUsageBytes_;
      };
      constructor.getBytesAllocated = function() {
        return totalBytesAllocated;
      };
      constructor.requestMemoryAllocation = requestMemoryAllocation;
      return constructor;
    })();
    if (typeof module2 !== "undefined") {
      module2.exports = decode2;
    } else if (typeof window !== "undefined") {
      window["jpeg-js"] = window["jpeg-js"] || {};
      window["jpeg-js"].decode = decode2;
    }
    function decode2(jpegData, userOpts = {}) {
      var defaultOpts = {
        // "undefined" means "Choose whether to transform colors based on the image’s color model."
        colorTransform: void 0,
        useTArray: false,
        formatAsRGBA: true,
        tolerantDecoding: true,
        maxResolutionInMP: 100,
        // Don't decode more than 100 megapixels
        maxMemoryUsageInMB: 512
        // Don't decode if memory footprint is more than 512MB
      };
      var opts = { ...defaultOpts, ...userOpts };
      var arr = new Uint8Array(jpegData);
      var decoder = new JpegImage();
      decoder.opts = opts;
      JpegImage.resetMaxMemoryUsage(opts.maxMemoryUsageInMB * 1024 * 1024);
      decoder.parse(arr);
      var channels = opts.formatAsRGBA ? 4 : 3;
      var bytesNeeded = decoder.width * decoder.height * channels;
      try {
        JpegImage.requestMemoryAllocation(bytesNeeded);
        var image = {
          width: decoder.width,
          height: decoder.height,
          exifBuffer: decoder.exifBuffer,
          data: opts.useTArray ? new Uint8Array(bytesNeeded) : Buffer.alloc(bytesNeeded)
        };
        if (decoder.comments.length > 0) {
          image["comments"] = decoder.comments;
        }
      } catch (err) {
        if (err instanceof RangeError) {
          throw new Error("Could not allocate enough memory for the image. Required: " + bytesNeeded);
        }
        if (err instanceof ReferenceError) {
          if (err.message === "Buffer is not defined") {
            throw new Error("Buffer is not globally defined in this environment. Consider setting useTArray to true");
          }
        }
        throw err;
      }
      decoder.copyToImageData(image, opts.formatAsRGBA);
      return image;
    }
  }
});

// ../../node_modules/jpeg-js/index.js
var require_jpeg_js = __commonJS({
  "../../node_modules/jpeg-js/index.js"(exports2, module2) {
    var encode = require_encoder();
    var decode2 = require_decoder();
    module2.exports = {
      encode,
      decode: decode2
    };
  }
});

// ../../node_modules/pngjs/lib/chunkstream.js
var require_chunkstream = __commonJS({
  "../../node_modules/pngjs/lib/chunkstream.js"(exports2, module2) {
    "use strict";
    var util = require("util");
    var Stream = require("stream");
    var ChunkStream = module2.exports = function() {
      Stream.call(this);
      this._buffers = [];
      this._buffered = 0;
      this._reads = [];
      this._paused = false;
      this._encoding = "utf8";
      this.writable = true;
    };
    util.inherits(ChunkStream, Stream);
    ChunkStream.prototype.read = function(length, callback) {
      this._reads.push({
        length: Math.abs(length),
        // if length < 0 then at most this length
        allowLess: length < 0,
        func: callback
      });
      process.nextTick(
        function() {
          this._process();
          if (this._paused && this._reads && this._reads.length > 0) {
            this._paused = false;
            this.emit("drain");
          }
        }.bind(this)
      );
    };
    ChunkStream.prototype.write = function(data, encoding) {
      if (!this.writable) {
        this.emit("error", new Error("Stream not writable"));
        return false;
      }
      let dataBuffer;
      if (Buffer.isBuffer(data)) {
        dataBuffer = data;
      } else {
        dataBuffer = Buffer.from(data, encoding || this._encoding);
      }
      this._buffers.push(dataBuffer);
      this._buffered += dataBuffer.length;
      this._process();
      if (this._reads && this._reads.length === 0) {
        this._paused = true;
      }
      return this.writable && !this._paused;
    };
    ChunkStream.prototype.end = function(data, encoding) {
      if (data) {
        this.write(data, encoding);
      }
      this.writable = false;
      if (!this._buffers) {
        return;
      }
      if (this._buffers.length === 0) {
        this._end();
      } else {
        this._buffers.push(null);
        this._process();
      }
    };
    ChunkStream.prototype.destroySoon = ChunkStream.prototype.end;
    ChunkStream.prototype._end = function() {
      if (this._reads.length > 0) {
        this.emit("error", new Error("Unexpected end of input"));
      }
      this.destroy();
    };
    ChunkStream.prototype.destroy = function() {
      if (!this._buffers) {
        return;
      }
      this.writable = false;
      this._reads = null;
      this._buffers = null;
      this.emit("close");
    };
    ChunkStream.prototype._processReadAllowingLess = function(read) {
      this._reads.shift();
      let smallerBuf = this._buffers[0];
      if (smallerBuf.length > read.length) {
        this._buffered -= read.length;
        this._buffers[0] = smallerBuf.slice(read.length);
        read.func.call(this, smallerBuf.slice(0, read.length));
      } else {
        this._buffered -= smallerBuf.length;
        this._buffers.shift();
        read.func.call(this, smallerBuf);
      }
    };
    ChunkStream.prototype._processRead = function(read) {
      this._reads.shift();
      let pos = 0;
      let count = 0;
      let data = Buffer.alloc(read.length);
      while (pos < read.length) {
        let buf = this._buffers[count++];
        let len = Math.min(buf.length, read.length - pos);
        buf.copy(data, pos, 0, len);
        pos += len;
        if (len !== buf.length) {
          this._buffers[--count] = buf.slice(len);
        }
      }
      if (count > 0) {
        this._buffers.splice(0, count);
      }
      this._buffered -= read.length;
      read.func.call(this, data);
    };
    ChunkStream.prototype._process = function() {
      try {
        while (this._buffered > 0 && this._reads && this._reads.length > 0) {
          let read = this._reads[0];
          if (read.allowLess) {
            this._processReadAllowingLess(read);
          } else if (this._buffered >= read.length) {
            this._processRead(read);
          } else {
            break;
          }
        }
        if (this._buffers && !this.writable) {
          this._end();
        }
      } catch (ex) {
        this.emit("error", ex);
      }
    };
  }
});

// ../../node_modules/pngjs/lib/interlace.js
var require_interlace = __commonJS({
  "../../node_modules/pngjs/lib/interlace.js"(exports2) {
    "use strict";
    var imagePasses = [
      {
        // pass 1 - 1px
        x: [0],
        y: [0]
      },
      {
        // pass 2 - 1px
        x: [4],
        y: [0]
      },
      {
        // pass 3 - 2px
        x: [0, 4],
        y: [4]
      },
      {
        // pass 4 - 4px
        x: [2, 6],
        y: [0, 4]
      },
      {
        // pass 5 - 8px
        x: [0, 2, 4, 6],
        y: [2, 6]
      },
      {
        // pass 6 - 16px
        x: [1, 3, 5, 7],
        y: [0, 2, 4, 6]
      },
      {
        // pass 7 - 32px
        x: [0, 1, 2, 3, 4, 5, 6, 7],
        y: [1, 3, 5, 7]
      }
    ];
    exports2.getImagePasses = function(width, height) {
      let images = [];
      let xLeftOver = width % 8;
      let yLeftOver = height % 8;
      let xRepeats = (width - xLeftOver) / 8;
      let yRepeats = (height - yLeftOver) / 8;
      for (let i = 0; i < imagePasses.length; i++) {
        let pass = imagePasses[i];
        let passWidth = xRepeats * pass.x.length;
        let passHeight = yRepeats * pass.y.length;
        for (let j = 0; j < pass.x.length; j++) {
          if (pass.x[j] < xLeftOver) {
            passWidth++;
          } else {
            break;
          }
        }
        for (let j = 0; j < pass.y.length; j++) {
          if (pass.y[j] < yLeftOver) {
            passHeight++;
          } else {
            break;
          }
        }
        if (passWidth > 0 && passHeight > 0) {
          images.push({ width: passWidth, height: passHeight, index: i });
        }
      }
      return images;
    };
    exports2.getInterlaceIterator = function(width) {
      return function(x, y, pass) {
        let outerXLeftOver = x % imagePasses[pass].x.length;
        let outerX = (x - outerXLeftOver) / imagePasses[pass].x.length * 8 + imagePasses[pass].x[outerXLeftOver];
        let outerYLeftOver = y % imagePasses[pass].y.length;
        let outerY = (y - outerYLeftOver) / imagePasses[pass].y.length * 8 + imagePasses[pass].y[outerYLeftOver];
        return outerX * 4 + outerY * width * 4;
      };
    };
  }
});

// ../../node_modules/pngjs/lib/paeth-predictor.js
var require_paeth_predictor = __commonJS({
  "../../node_modules/pngjs/lib/paeth-predictor.js"(exports2, module2) {
    "use strict";
    module2.exports = function paethPredictor(left, above, upLeft) {
      let paeth = left + above - upLeft;
      let pLeft = Math.abs(paeth - left);
      let pAbove = Math.abs(paeth - above);
      let pUpLeft = Math.abs(paeth - upLeft);
      if (pLeft <= pAbove && pLeft <= pUpLeft) {
        return left;
      }
      if (pAbove <= pUpLeft) {
        return above;
      }
      return upLeft;
    };
  }
});

// ../../node_modules/pngjs/lib/filter-parse.js
var require_filter_parse = __commonJS({
  "../../node_modules/pngjs/lib/filter-parse.js"(exports2, module2) {
    "use strict";
    var interlaceUtils = require_interlace();
    var paethPredictor = require_paeth_predictor();
    function getByteWidth(width, bpp, depth) {
      let byteWidth = width * bpp;
      if (depth !== 8) {
        byteWidth = Math.ceil(byteWidth / (8 / depth));
      }
      return byteWidth;
    }
    var Filter = module2.exports = function(bitmapInfo, dependencies) {
      let width = bitmapInfo.width;
      let height = bitmapInfo.height;
      let interlace = bitmapInfo.interlace;
      let bpp = bitmapInfo.bpp;
      let depth = bitmapInfo.depth;
      this.read = dependencies.read;
      this.write = dependencies.write;
      this.complete = dependencies.complete;
      this._imageIndex = 0;
      this._images = [];
      if (interlace) {
        let passes = interlaceUtils.getImagePasses(width, height);
        for (let i = 0; i < passes.length; i++) {
          this._images.push({
            byteWidth: getByteWidth(passes[i].width, bpp, depth),
            height: passes[i].height,
            lineIndex: 0
          });
        }
      } else {
        this._images.push({
          byteWidth: getByteWidth(width, bpp, depth),
          height,
          lineIndex: 0
        });
      }
      if (depth === 8) {
        this._xComparison = bpp;
      } else if (depth === 16) {
        this._xComparison = bpp * 2;
      } else {
        this._xComparison = 1;
      }
    };
    Filter.prototype.start = function() {
      this.read(
        this._images[this._imageIndex].byteWidth + 1,
        this._reverseFilterLine.bind(this)
      );
    };
    Filter.prototype._unFilterType1 = function(rawData, unfilteredLine, byteWidth) {
      let xComparison = this._xComparison;
      let xBiggerThan = xComparison - 1;
      for (let x = 0; x < byteWidth; x++) {
        let rawByte = rawData[1 + x];
        let f1Left = x > xBiggerThan ? unfilteredLine[x - xComparison] : 0;
        unfilteredLine[x] = rawByte + f1Left;
      }
    };
    Filter.prototype._unFilterType2 = function(rawData, unfilteredLine, byteWidth) {
      let lastLine = this._lastLine;
      for (let x = 0; x < byteWidth; x++) {
        let rawByte = rawData[1 + x];
        let f2Up = lastLine ? lastLine[x] : 0;
        unfilteredLine[x] = rawByte + f2Up;
      }
    };
    Filter.prototype._unFilterType3 = function(rawData, unfilteredLine, byteWidth) {
      let xComparison = this._xComparison;
      let xBiggerThan = xComparison - 1;
      let lastLine = this._lastLine;
      for (let x = 0; x < byteWidth; x++) {
        let rawByte = rawData[1 + x];
        let f3Up = lastLine ? lastLine[x] : 0;
        let f3Left = x > xBiggerThan ? unfilteredLine[x - xComparison] : 0;
        let f3Add = Math.floor((f3Left + f3Up) / 2);
        unfilteredLine[x] = rawByte + f3Add;
      }
    };
    Filter.prototype._unFilterType4 = function(rawData, unfilteredLine, byteWidth) {
      let xComparison = this._xComparison;
      let xBiggerThan = xComparison - 1;
      let lastLine = this._lastLine;
      for (let x = 0; x < byteWidth; x++) {
        let rawByte = rawData[1 + x];
        let f4Up = lastLine ? lastLine[x] : 0;
        let f4Left = x > xBiggerThan ? unfilteredLine[x - xComparison] : 0;
        let f4UpLeft = x > xBiggerThan && lastLine ? lastLine[x - xComparison] : 0;
        let f4Add = paethPredictor(f4Left, f4Up, f4UpLeft);
        unfilteredLine[x] = rawByte + f4Add;
      }
    };
    Filter.prototype._reverseFilterLine = function(rawData) {
      let filter = rawData[0];
      let unfilteredLine;
      let currentImage = this._images[this._imageIndex];
      let byteWidth = currentImage.byteWidth;
      if (filter === 0) {
        unfilteredLine = rawData.slice(1, byteWidth + 1);
      } else {
        unfilteredLine = Buffer.alloc(byteWidth);
        switch (filter) {
          case 1:
            this._unFilterType1(rawData, unfilteredLine, byteWidth);
            break;
          case 2:
            this._unFilterType2(rawData, unfilteredLine, byteWidth);
            break;
          case 3:
            this._unFilterType3(rawData, unfilteredLine, byteWidth);
            break;
          case 4:
            this._unFilterType4(rawData, unfilteredLine, byteWidth);
            break;
          default:
            throw new Error("Unrecognised filter type - " + filter);
        }
      }
      this.write(unfilteredLine);
      currentImage.lineIndex++;
      if (currentImage.lineIndex >= currentImage.height) {
        this._lastLine = null;
        this._imageIndex++;
        currentImage = this._images[this._imageIndex];
      } else {
        this._lastLine = unfilteredLine;
      }
      if (currentImage) {
        this.read(currentImage.byteWidth + 1, this._reverseFilterLine.bind(this));
      } else {
        this._lastLine = null;
        this.complete();
      }
    };
  }
});

// ../../node_modules/pngjs/lib/filter-parse-async.js
var require_filter_parse_async = __commonJS({
  "../../node_modules/pngjs/lib/filter-parse-async.js"(exports2, module2) {
    "use strict";
    var util = require("util");
    var ChunkStream = require_chunkstream();
    var Filter = require_filter_parse();
    var FilterAsync = module2.exports = function(bitmapInfo) {
      ChunkStream.call(this);
      let buffers = [];
      let that = this;
      this._filter = new Filter(bitmapInfo, {
        read: this.read.bind(this),
        write: function(buffer) {
          buffers.push(buffer);
        },
        complete: function() {
          that.emit("complete", Buffer.concat(buffers));
        }
      });
      this._filter.start();
    };
    util.inherits(FilterAsync, ChunkStream);
  }
});

// ../../node_modules/pngjs/lib/constants.js
var require_constants = __commonJS({
  "../../node_modules/pngjs/lib/constants.js"(exports2, module2) {
    "use strict";
    module2.exports = {
      PNG_SIGNATURE: [137, 80, 78, 71, 13, 10, 26, 10],
      TYPE_IHDR: 1229472850,
      TYPE_IEND: 1229278788,
      TYPE_IDAT: 1229209940,
      TYPE_PLTE: 1347179589,
      TYPE_tRNS: 1951551059,
      // eslint-disable-line camelcase
      TYPE_gAMA: 1732332865,
      // eslint-disable-line camelcase
      // color-type bits
      COLORTYPE_GRAYSCALE: 0,
      COLORTYPE_PALETTE: 1,
      COLORTYPE_COLOR: 2,
      COLORTYPE_ALPHA: 4,
      // e.g. grayscale and alpha
      // color-type combinations
      COLORTYPE_PALETTE_COLOR: 3,
      COLORTYPE_COLOR_ALPHA: 6,
      COLORTYPE_TO_BPP_MAP: {
        0: 1,
        2: 3,
        3: 1,
        4: 2,
        6: 4
      },
      GAMMA_DIVISION: 1e5
    };
  }
});

// ../../node_modules/pngjs/lib/crc.js
var require_crc = __commonJS({
  "../../node_modules/pngjs/lib/crc.js"(exports2, module2) {
    "use strict";
    var crcTable = [];
    (function() {
      for (let i = 0; i < 256; i++) {
        let currentCrc = i;
        for (let j = 0; j < 8; j++) {
          if (currentCrc & 1) {
            currentCrc = 3988292384 ^ currentCrc >>> 1;
          } else {
            currentCrc = currentCrc >>> 1;
          }
        }
        crcTable[i] = currentCrc;
      }
    })();
    var CrcCalculator = module2.exports = function() {
      this._crc = -1;
    };
    CrcCalculator.prototype.write = function(data) {
      for (let i = 0; i < data.length; i++) {
        this._crc = crcTable[(this._crc ^ data[i]) & 255] ^ this._crc >>> 8;
      }
      return true;
    };
    CrcCalculator.prototype.crc32 = function() {
      return this._crc ^ -1;
    };
    CrcCalculator.crc32 = function(buf) {
      let crc = -1;
      for (let i = 0; i < buf.length; i++) {
        crc = crcTable[(crc ^ buf[i]) & 255] ^ crc >>> 8;
      }
      return crc ^ -1;
    };
  }
});

// ../../node_modules/pngjs/lib/parser.js
var require_parser2 = __commonJS({
  "../../node_modules/pngjs/lib/parser.js"(exports2, module2) {
    "use strict";
    var constants = require_constants();
    var CrcCalculator = require_crc();
    var Parser = module2.exports = function(options, dependencies) {
      this._options = options;
      options.checkCRC = options.checkCRC !== false;
      this._hasIHDR = false;
      this._hasIEND = false;
      this._emittedHeadersFinished = false;
      this._palette = [];
      this._colorType = 0;
      this._chunks = {};
      this._chunks[constants.TYPE_IHDR] = this._handleIHDR.bind(this);
      this._chunks[constants.TYPE_IEND] = this._handleIEND.bind(this);
      this._chunks[constants.TYPE_IDAT] = this._handleIDAT.bind(this);
      this._chunks[constants.TYPE_PLTE] = this._handlePLTE.bind(this);
      this._chunks[constants.TYPE_tRNS] = this._handleTRNS.bind(this);
      this._chunks[constants.TYPE_gAMA] = this._handleGAMA.bind(this);
      this.read = dependencies.read;
      this.error = dependencies.error;
      this.metadata = dependencies.metadata;
      this.gamma = dependencies.gamma;
      this.transColor = dependencies.transColor;
      this.palette = dependencies.palette;
      this.parsed = dependencies.parsed;
      this.inflateData = dependencies.inflateData;
      this.finished = dependencies.finished;
      this.simpleTransparency = dependencies.simpleTransparency;
      this.headersFinished = dependencies.headersFinished || function() {
      };
    };
    Parser.prototype.start = function() {
      this.read(constants.PNG_SIGNATURE.length, this._parseSignature.bind(this));
    };
    Parser.prototype._parseSignature = function(data) {
      let signature2 = constants.PNG_SIGNATURE;
      for (let i = 0; i < signature2.length; i++) {
        if (data[i] !== signature2[i]) {
          this.error(new Error("Invalid file signature"));
          return;
        }
      }
      this.read(8, this._parseChunkBegin.bind(this));
    };
    Parser.prototype._parseChunkBegin = function(data) {
      let length = data.readUInt32BE(0);
      let type = data.readUInt32BE(4);
      let name = "";
      for (let i = 4; i < 8; i++) {
        name += String.fromCharCode(data[i]);
      }
      let ancillary = Boolean(data[4] & 32);
      if (!this._hasIHDR && type !== constants.TYPE_IHDR) {
        this.error(new Error("Expected IHDR on beggining"));
        return;
      }
      this._crc = new CrcCalculator();
      this._crc.write(Buffer.from(name));
      if (this._chunks[type]) {
        return this._chunks[type](length);
      }
      if (!ancillary) {
        this.error(new Error("Unsupported critical chunk type " + name));
        return;
      }
      this.read(length + 4, this._skipChunk.bind(this));
    };
    Parser.prototype._skipChunk = function() {
      this.read(8, this._parseChunkBegin.bind(this));
    };
    Parser.prototype._handleChunkEnd = function() {
      this.read(4, this._parseChunkEnd.bind(this));
    };
    Parser.prototype._parseChunkEnd = function(data) {
      let fileCrc = data.readInt32BE(0);
      let calcCrc = this._crc.crc32();
      if (this._options.checkCRC && calcCrc !== fileCrc) {
        this.error(new Error("Crc error - " + fileCrc + " - " + calcCrc));
        return;
      }
      if (!this._hasIEND) {
        this.read(8, this._parseChunkBegin.bind(this));
      }
    };
    Parser.prototype._handleIHDR = function(length) {
      this.read(length, this._parseIHDR.bind(this));
    };
    Parser.prototype._parseIHDR = function(data) {
      this._crc.write(data);
      let width = data.readUInt32BE(0);
      let height = data.readUInt32BE(4);
      let depth = data[8];
      let colorType = data[9];
      let compr = data[10];
      let filter = data[11];
      let interlace = data[12];
      if (depth !== 8 && depth !== 4 && depth !== 2 && depth !== 1 && depth !== 16) {
        this.error(new Error("Unsupported bit depth " + depth));
        return;
      }
      if (!(colorType in constants.COLORTYPE_TO_BPP_MAP)) {
        this.error(new Error("Unsupported color type"));
        return;
      }
      if (compr !== 0) {
        this.error(new Error("Unsupported compression method"));
        return;
      }
      if (filter !== 0) {
        this.error(new Error("Unsupported filter method"));
        return;
      }
      if (interlace !== 0 && interlace !== 1) {
        this.error(new Error("Unsupported interlace method"));
        return;
      }
      this._colorType = colorType;
      let bpp = constants.COLORTYPE_TO_BPP_MAP[this._colorType];
      this._hasIHDR = true;
      this.metadata({
        width,
        height,
        depth,
        interlace: Boolean(interlace),
        palette: Boolean(colorType & constants.COLORTYPE_PALETTE),
        color: Boolean(colorType & constants.COLORTYPE_COLOR),
        alpha: Boolean(colorType & constants.COLORTYPE_ALPHA),
        bpp,
        colorType
      });
      this._handleChunkEnd();
    };
    Parser.prototype._handlePLTE = function(length) {
      this.read(length, this._parsePLTE.bind(this));
    };
    Parser.prototype._parsePLTE = function(data) {
      this._crc.write(data);
      let entries = Math.floor(data.length / 3);
      for (let i = 0; i < entries; i++) {
        this._palette.push([data[i * 3], data[i * 3 + 1], data[i * 3 + 2], 255]);
      }
      this.palette(this._palette);
      this._handleChunkEnd();
    };
    Parser.prototype._handleTRNS = function(length) {
      this.simpleTransparency();
      this.read(length, this._parseTRNS.bind(this));
    };
    Parser.prototype._parseTRNS = function(data) {
      this._crc.write(data);
      if (this._colorType === constants.COLORTYPE_PALETTE_COLOR) {
        if (this._palette.length === 0) {
          this.error(new Error("Transparency chunk must be after palette"));
          return;
        }
        if (data.length > this._palette.length) {
          this.error(new Error("More transparent colors than palette size"));
          return;
        }
        for (let i = 0; i < data.length; i++) {
          this._palette[i][3] = data[i];
        }
        this.palette(this._palette);
      }
      if (this._colorType === constants.COLORTYPE_GRAYSCALE) {
        this.transColor([data.readUInt16BE(0)]);
      }
      if (this._colorType === constants.COLORTYPE_COLOR) {
        this.transColor([
          data.readUInt16BE(0),
          data.readUInt16BE(2),
          data.readUInt16BE(4)
        ]);
      }
      this._handleChunkEnd();
    };
    Parser.prototype._handleGAMA = function(length) {
      this.read(length, this._parseGAMA.bind(this));
    };
    Parser.prototype._parseGAMA = function(data) {
      this._crc.write(data);
      this.gamma(data.readUInt32BE(0) / constants.GAMMA_DIVISION);
      this._handleChunkEnd();
    };
    Parser.prototype._handleIDAT = function(length) {
      if (!this._emittedHeadersFinished) {
        this._emittedHeadersFinished = true;
        this.headersFinished();
      }
      this.read(-length, this._parseIDAT.bind(this, length));
    };
    Parser.prototype._parseIDAT = function(length, data) {
      this._crc.write(data);
      if (this._colorType === constants.COLORTYPE_PALETTE_COLOR && this._palette.length === 0) {
        throw new Error("Expected palette not found");
      }
      this.inflateData(data);
      let leftOverLength = length - data.length;
      if (leftOverLength > 0) {
        this._handleIDAT(leftOverLength);
      } else {
        this._handleChunkEnd();
      }
    };
    Parser.prototype._handleIEND = function(length) {
      this.read(length, this._parseIEND.bind(this));
    };
    Parser.prototype._parseIEND = function(data) {
      this._crc.write(data);
      this._hasIEND = true;
      this._handleChunkEnd();
      if (this.finished) {
        this.finished();
      }
    };
  }
});

// ../../node_modules/pngjs/lib/bitmapper.js
var require_bitmapper = __commonJS({
  "../../node_modules/pngjs/lib/bitmapper.js"(exports2) {
    "use strict";
    var interlaceUtils = require_interlace();
    var pixelBppMapper = [
      // 0 - dummy entry
      function() {
      },
      // 1 - L
      // 0: 0, 1: 0, 2: 0, 3: 0xff
      function(pxData, data, pxPos, rawPos) {
        if (rawPos === data.length) {
          throw new Error("Ran out of data");
        }
        let pixel = data[rawPos];
        pxData[pxPos] = pixel;
        pxData[pxPos + 1] = pixel;
        pxData[pxPos + 2] = pixel;
        pxData[pxPos + 3] = 255;
      },
      // 2 - LA
      // 0: 0, 1: 0, 2: 0, 3: 1
      function(pxData, data, pxPos, rawPos) {
        if (rawPos + 1 >= data.length) {
          throw new Error("Ran out of data");
        }
        let pixel = data[rawPos];
        pxData[pxPos] = pixel;
        pxData[pxPos + 1] = pixel;
        pxData[pxPos + 2] = pixel;
        pxData[pxPos + 3] = data[rawPos + 1];
      },
      // 3 - RGB
      // 0: 0, 1: 1, 2: 2, 3: 0xff
      function(pxData, data, pxPos, rawPos) {
        if (rawPos + 2 >= data.length) {
          throw new Error("Ran out of data");
        }
        pxData[pxPos] = data[rawPos];
        pxData[pxPos + 1] = data[rawPos + 1];
        pxData[pxPos + 2] = data[rawPos + 2];
        pxData[pxPos + 3] = 255;
      },
      // 4 - RGBA
      // 0: 0, 1: 1, 2: 2, 3: 3
      function(pxData, data, pxPos, rawPos) {
        if (rawPos + 3 >= data.length) {
          throw new Error("Ran out of data");
        }
        pxData[pxPos] = data[rawPos];
        pxData[pxPos + 1] = data[rawPos + 1];
        pxData[pxPos + 2] = data[rawPos + 2];
        pxData[pxPos + 3] = data[rawPos + 3];
      }
    ];
    var pixelBppCustomMapper = [
      // 0 - dummy entry
      function() {
      },
      // 1 - L
      // 0: 0, 1: 0, 2: 0, 3: 0xff
      function(pxData, pixelData, pxPos, maxBit) {
        let pixel = pixelData[0];
        pxData[pxPos] = pixel;
        pxData[pxPos + 1] = pixel;
        pxData[pxPos + 2] = pixel;
        pxData[pxPos + 3] = maxBit;
      },
      // 2 - LA
      // 0: 0, 1: 0, 2: 0, 3: 1
      function(pxData, pixelData, pxPos) {
        let pixel = pixelData[0];
        pxData[pxPos] = pixel;
        pxData[pxPos + 1] = pixel;
        pxData[pxPos + 2] = pixel;
        pxData[pxPos + 3] = pixelData[1];
      },
      // 3 - RGB
      // 0: 0, 1: 1, 2: 2, 3: 0xff
      function(pxData, pixelData, pxPos, maxBit) {
        pxData[pxPos] = pixelData[0];
        pxData[pxPos + 1] = pixelData[1];
        pxData[pxPos + 2] = pixelData[2];
        pxData[pxPos + 3] = maxBit;
      },
      // 4 - RGBA
      // 0: 0, 1: 1, 2: 2, 3: 3
      function(pxData, pixelData, pxPos) {
        pxData[pxPos] = pixelData[0];
        pxData[pxPos + 1] = pixelData[1];
        pxData[pxPos + 2] = pixelData[2];
        pxData[pxPos + 3] = pixelData[3];
      }
    ];
    function bitRetriever(data, depth) {
      let leftOver = [];
      let i = 0;
      function split() {
        if (i === data.length) {
          throw new Error("Ran out of data");
        }
        let byte = data[i];
        i++;
        let byte8, byte7, byte6, byte5, byte4, byte3, byte2, byte1;
        switch (depth) {
          default:
            throw new Error("unrecognised depth");
          case 16:
            byte2 = data[i];
            i++;
            leftOver.push((byte << 8) + byte2);
            break;
          case 4:
            byte2 = byte & 15;
            byte1 = byte >> 4;
            leftOver.push(byte1, byte2);
            break;
          case 2:
            byte4 = byte & 3;
            byte3 = byte >> 2 & 3;
            byte2 = byte >> 4 & 3;
            byte1 = byte >> 6 & 3;
            leftOver.push(byte1, byte2, byte3, byte4);
            break;
          case 1:
            byte8 = byte & 1;
            byte7 = byte >> 1 & 1;
            byte6 = byte >> 2 & 1;
            byte5 = byte >> 3 & 1;
            byte4 = byte >> 4 & 1;
            byte3 = byte >> 5 & 1;
            byte2 = byte >> 6 & 1;
            byte1 = byte >> 7 & 1;
            leftOver.push(byte1, byte2, byte3, byte4, byte5, byte6, byte7, byte8);
            break;
        }
      }
      return {
        get: function(count) {
          while (leftOver.length < count) {
            split();
          }
          let returner = leftOver.slice(0, count);
          leftOver = leftOver.slice(count);
          return returner;
        },
        resetAfterLine: function() {
          leftOver.length = 0;
        },
        end: function() {
          if (i !== data.length) {
            throw new Error("extra data found");
          }
        }
      };
    }
    function mapImage8Bit(image, pxData, getPxPos, bpp, data, rawPos) {
      let imageWidth = image.width;
      let imageHeight = image.height;
      let imagePass = image.index;
      for (let y = 0; y < imageHeight; y++) {
        for (let x = 0; x < imageWidth; x++) {
          let pxPos = getPxPos(x, y, imagePass);
          pixelBppMapper[bpp](pxData, data, pxPos, rawPos);
          rawPos += bpp;
        }
      }
      return rawPos;
    }
    function mapImageCustomBit(image, pxData, getPxPos, bpp, bits, maxBit) {
      let imageWidth = image.width;
      let imageHeight = image.height;
      let imagePass = image.index;
      for (let y = 0; y < imageHeight; y++) {
        for (let x = 0; x < imageWidth; x++) {
          let pixelData = bits.get(bpp);
          let pxPos = getPxPos(x, y, imagePass);
          pixelBppCustomMapper[bpp](pxData, pixelData, pxPos, maxBit);
        }
        bits.resetAfterLine();
      }
    }
    exports2.dataToBitMap = function(data, bitmapInfo) {
      let width = bitmapInfo.width;
      let height = bitmapInfo.height;
      let depth = bitmapInfo.depth;
      let bpp = bitmapInfo.bpp;
      let interlace = bitmapInfo.interlace;
      let bits;
      if (depth !== 8) {
        bits = bitRetriever(data, depth);
      }
      let pxData;
      if (depth <= 8) {
        pxData = Buffer.alloc(width * height * 4);
      } else {
        pxData = new Uint16Array(width * height * 4);
      }
      let maxBit = Math.pow(2, depth) - 1;
      let rawPos = 0;
      let images;
      let getPxPos;
      if (interlace) {
        images = interlaceUtils.getImagePasses(width, height);
        getPxPos = interlaceUtils.getInterlaceIterator(width, height);
      } else {
        let nonInterlacedPxPos = 0;
        getPxPos = function() {
          let returner = nonInterlacedPxPos;
          nonInterlacedPxPos += 4;
          return returner;
        };
        images = [{ width, height }];
      }
      for (let imageIndex = 0; imageIndex < images.length; imageIndex++) {
        if (depth === 8) {
          rawPos = mapImage8Bit(
            images[imageIndex],
            pxData,
            getPxPos,
            bpp,
            data,
            rawPos
          );
        } else {
          mapImageCustomBit(
            images[imageIndex],
            pxData,
            getPxPos,
            bpp,
            bits,
            maxBit
          );
        }
      }
      if (depth === 8) {
        if (rawPos !== data.length) {
          throw new Error("extra data found");
        }
      } else {
        bits.end();
      }
      return pxData;
    };
  }
});

// ../../node_modules/pngjs/lib/format-normaliser.js
var require_format_normaliser = __commonJS({
  "../../node_modules/pngjs/lib/format-normaliser.js"(exports2, module2) {
    "use strict";
    function dePalette(indata, outdata, width, height, palette) {
      let pxPos = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let color = palette[indata[pxPos]];
          if (!color) {
            throw new Error("index " + indata[pxPos] + " not in palette");
          }
          for (let i = 0; i < 4; i++) {
            outdata[pxPos + i] = color[i];
          }
          pxPos += 4;
        }
      }
    }
    function replaceTransparentColor(indata, outdata, width, height, transColor) {
      let pxPos = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let makeTrans = false;
          if (transColor.length === 1) {
            if (transColor[0] === indata[pxPos]) {
              makeTrans = true;
            }
          } else if (transColor[0] === indata[pxPos] && transColor[1] === indata[pxPos + 1] && transColor[2] === indata[pxPos + 2]) {
            makeTrans = true;
          }
          if (makeTrans) {
            for (let i = 0; i < 4; i++) {
              outdata[pxPos + i] = 0;
            }
          }
          pxPos += 4;
        }
      }
    }
    function scaleDepth(indata, outdata, width, height, depth) {
      let maxOutSample = 255;
      let maxInSample = Math.pow(2, depth) - 1;
      let pxPos = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          for (let i = 0; i < 4; i++) {
            outdata[pxPos + i] = Math.floor(
              indata[pxPos + i] * maxOutSample / maxInSample + 0.5
            );
          }
          pxPos += 4;
        }
      }
    }
    module2.exports = function(indata, imageData, skipRescale = false) {
      let depth = imageData.depth;
      let width = imageData.width;
      let height = imageData.height;
      let colorType = imageData.colorType;
      let transColor = imageData.transColor;
      let palette = imageData.palette;
      let outdata = indata;
      if (colorType === 3) {
        dePalette(indata, outdata, width, height, palette);
      } else {
        if (transColor) {
          replaceTransparentColor(indata, outdata, width, height, transColor);
        }
        if (depth !== 8 && !skipRescale) {
          if (depth === 16) {
            outdata = Buffer.alloc(width * height * 4);
          }
          scaleDepth(indata, outdata, width, height, depth);
        }
      }
      return outdata;
    };
  }
});

// ../../node_modules/pngjs/lib/parser-async.js
var require_parser_async = __commonJS({
  "../../node_modules/pngjs/lib/parser-async.js"(exports2, module2) {
    "use strict";
    var util = require("util");
    var zlib = require("zlib");
    var ChunkStream = require_chunkstream();
    var FilterAsync = require_filter_parse_async();
    var Parser = require_parser2();
    var bitmapper = require_bitmapper();
    var formatNormaliser = require_format_normaliser();
    var ParserAsync = module2.exports = function(options) {
      ChunkStream.call(this);
      this._parser = new Parser(options, {
        read: this.read.bind(this),
        error: this._handleError.bind(this),
        metadata: this._handleMetaData.bind(this),
        gamma: this.emit.bind(this, "gamma"),
        palette: this._handlePalette.bind(this),
        transColor: this._handleTransColor.bind(this),
        finished: this._finished.bind(this),
        inflateData: this._inflateData.bind(this),
        simpleTransparency: this._simpleTransparency.bind(this),
        headersFinished: this._headersFinished.bind(this)
      });
      this._options = options;
      this.writable = true;
      this._parser.start();
    };
    util.inherits(ParserAsync, ChunkStream);
    ParserAsync.prototype._handleError = function(err) {
      this.emit("error", err);
      this.writable = false;
      this.destroy();
      if (this._inflate && this._inflate.destroy) {
        this._inflate.destroy();
      }
      if (this._filter) {
        this._filter.destroy();
        this._filter.on("error", function() {
        });
      }
      this.errord = true;
    };
    ParserAsync.prototype._inflateData = function(data) {
      if (!this._inflate) {
        if (this._bitmapInfo.interlace) {
          this._inflate = zlib.createInflate();
          this._inflate.on("error", this.emit.bind(this, "error"));
          this._filter.on("complete", this._complete.bind(this));
          this._inflate.pipe(this._filter);
        } else {
          let rowSize = (this._bitmapInfo.width * this._bitmapInfo.bpp * this._bitmapInfo.depth + 7 >> 3) + 1;
          let imageSize = rowSize * this._bitmapInfo.height;
          let chunkSize = Math.max(imageSize, zlib.Z_MIN_CHUNK);
          this._inflate = zlib.createInflate({ chunkSize });
          let leftToInflate = imageSize;
          let emitError = this.emit.bind(this, "error");
          this._inflate.on("error", function(err) {
            if (!leftToInflate) {
              return;
            }
            emitError(err);
          });
          this._filter.on("complete", this._complete.bind(this));
          let filterWrite = this._filter.write.bind(this._filter);
          this._inflate.on("data", function(chunk) {
            if (!leftToInflate) {
              return;
            }
            if (chunk.length > leftToInflate) {
              chunk = chunk.slice(0, leftToInflate);
            }
            leftToInflate -= chunk.length;
            filterWrite(chunk);
          });
          this._inflate.on("end", this._filter.end.bind(this._filter));
        }
      }
      this._inflate.write(data);
    };
    ParserAsync.prototype._handleMetaData = function(metaData) {
      this._metaData = metaData;
      this._bitmapInfo = Object.create(metaData);
      this._filter = new FilterAsync(this._bitmapInfo);
    };
    ParserAsync.prototype._handleTransColor = function(transColor) {
      this._bitmapInfo.transColor = transColor;
    };
    ParserAsync.prototype._handlePalette = function(palette) {
      this._bitmapInfo.palette = palette;
    };
    ParserAsync.prototype._simpleTransparency = function() {
      this._metaData.alpha = true;
    };
    ParserAsync.prototype._headersFinished = function() {
      this.emit("metadata", this._metaData);
    };
    ParserAsync.prototype._finished = function() {
      if (this.errord) {
        return;
      }
      if (!this._inflate) {
        this.emit("error", "No Inflate block");
      } else {
        this._inflate.end();
      }
    };
    ParserAsync.prototype._complete = function(filteredData) {
      if (this.errord) {
        return;
      }
      let normalisedBitmapData;
      try {
        let bitmapData = bitmapper.dataToBitMap(filteredData, this._bitmapInfo);
        normalisedBitmapData = formatNormaliser(
          bitmapData,
          this._bitmapInfo,
          this._options.skipRescale
        );
        bitmapData = null;
      } catch (ex) {
        this._handleError(ex);
        return;
      }
      this.emit("parsed", normalisedBitmapData);
    };
  }
});

// ../../node_modules/pngjs/lib/bitpacker.js
var require_bitpacker = __commonJS({
  "../../node_modules/pngjs/lib/bitpacker.js"(exports2, module2) {
    "use strict";
    var constants = require_constants();
    module2.exports = function(dataIn, width, height, options) {
      let outHasAlpha = [constants.COLORTYPE_COLOR_ALPHA, constants.COLORTYPE_ALPHA].indexOf(
        options.colorType
      ) !== -1;
      if (options.colorType === options.inputColorType) {
        let bigEndian = (function() {
          let buffer = new ArrayBuffer(2);
          new DataView(buffer).setInt16(
            0,
            256,
            true
            /* littleEndian */
          );
          return new Int16Array(buffer)[0] !== 256;
        })();
        if (options.bitDepth === 8 || options.bitDepth === 16 && bigEndian) {
          return dataIn;
        }
      }
      let data = options.bitDepth !== 16 ? dataIn : new Uint16Array(dataIn.buffer);
      let maxValue = 255;
      let inBpp = constants.COLORTYPE_TO_BPP_MAP[options.inputColorType];
      if (inBpp === 4 && !options.inputHasAlpha) {
        inBpp = 3;
      }
      let outBpp = constants.COLORTYPE_TO_BPP_MAP[options.colorType];
      if (options.bitDepth === 16) {
        maxValue = 65535;
        outBpp *= 2;
      }
      let outData = Buffer.alloc(width * height * outBpp);
      let inIndex = 0;
      let outIndex = 0;
      let bgColor = options.bgColor || {};
      if (bgColor.red === void 0) {
        bgColor.red = maxValue;
      }
      if (bgColor.green === void 0) {
        bgColor.green = maxValue;
      }
      if (bgColor.blue === void 0) {
        bgColor.blue = maxValue;
      }
      function getRGBA() {
        let red;
        let green;
        let blue;
        let alpha = maxValue;
        switch (options.inputColorType) {
          case constants.COLORTYPE_COLOR_ALPHA:
            alpha = data[inIndex + 3];
            red = data[inIndex];
            green = data[inIndex + 1];
            blue = data[inIndex + 2];
            break;
          case constants.COLORTYPE_COLOR:
            red = data[inIndex];
            green = data[inIndex + 1];
            blue = data[inIndex + 2];
            break;
          case constants.COLORTYPE_ALPHA:
            alpha = data[inIndex + 1];
            red = data[inIndex];
            green = red;
            blue = red;
            break;
          case constants.COLORTYPE_GRAYSCALE:
            red = data[inIndex];
            green = red;
            blue = red;
            break;
          default:
            throw new Error(
              "input color type:" + options.inputColorType + " is not supported at present"
            );
        }
        if (options.inputHasAlpha) {
          if (!outHasAlpha) {
            alpha /= maxValue;
            red = Math.min(
              Math.max(Math.round((1 - alpha) * bgColor.red + alpha * red), 0),
              maxValue
            );
            green = Math.min(
              Math.max(Math.round((1 - alpha) * bgColor.green + alpha * green), 0),
              maxValue
            );
            blue = Math.min(
              Math.max(Math.round((1 - alpha) * bgColor.blue + alpha * blue), 0),
              maxValue
            );
          }
        }
        return { red, green, blue, alpha };
      }
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let rgba = getRGBA(data, inIndex);
          switch (options.colorType) {
            case constants.COLORTYPE_COLOR_ALPHA:
            case constants.COLORTYPE_COLOR:
              if (options.bitDepth === 8) {
                outData[outIndex] = rgba.red;
                outData[outIndex + 1] = rgba.green;
                outData[outIndex + 2] = rgba.blue;
                if (outHasAlpha) {
                  outData[outIndex + 3] = rgba.alpha;
                }
              } else {
                outData.writeUInt16BE(rgba.red, outIndex);
                outData.writeUInt16BE(rgba.green, outIndex + 2);
                outData.writeUInt16BE(rgba.blue, outIndex + 4);
                if (outHasAlpha) {
                  outData.writeUInt16BE(rgba.alpha, outIndex + 6);
                }
              }
              break;
            case constants.COLORTYPE_ALPHA:
            case constants.COLORTYPE_GRAYSCALE: {
              let grayscale = (rgba.red + rgba.green + rgba.blue) / 3;
              if (options.bitDepth === 8) {
                outData[outIndex] = grayscale;
                if (outHasAlpha) {
                  outData[outIndex + 1] = rgba.alpha;
                }
              } else {
                outData.writeUInt16BE(grayscale, outIndex);
                if (outHasAlpha) {
                  outData.writeUInt16BE(rgba.alpha, outIndex + 2);
                }
              }
              break;
            }
            default:
              throw new Error("unrecognised color Type " + options.colorType);
          }
          inIndex += inBpp;
          outIndex += outBpp;
        }
      }
      return outData;
    };
  }
});

// ../../node_modules/pngjs/lib/filter-pack.js
var require_filter_pack = __commonJS({
  "../../node_modules/pngjs/lib/filter-pack.js"(exports2, module2) {
    "use strict";
    var paethPredictor = require_paeth_predictor();
    function filterNone(pxData, pxPos, byteWidth, rawData, rawPos) {
      for (let x = 0; x < byteWidth; x++) {
        rawData[rawPos + x] = pxData[pxPos + x];
      }
    }
    function filterSumNone(pxData, pxPos, byteWidth) {
      let sum = 0;
      let length = pxPos + byteWidth;
      for (let i = pxPos; i < length; i++) {
        sum += Math.abs(pxData[i]);
      }
      return sum;
    }
    function filterSub(pxData, pxPos, byteWidth, rawData, rawPos, bpp) {
      for (let x = 0; x < byteWidth; x++) {
        let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
        let val = pxData[pxPos + x] - left;
        rawData[rawPos + x] = val;
      }
    }
    function filterSumSub(pxData, pxPos, byteWidth, bpp) {
      let sum = 0;
      for (let x = 0; x < byteWidth; x++) {
        let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
        let val = pxData[pxPos + x] - left;
        sum += Math.abs(val);
      }
      return sum;
    }
    function filterUp(pxData, pxPos, byteWidth, rawData, rawPos) {
      for (let x = 0; x < byteWidth; x++) {
        let up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
        let val = pxData[pxPos + x] - up;
        rawData[rawPos + x] = val;
      }
    }
    function filterSumUp(pxData, pxPos, byteWidth) {
      let sum = 0;
      let length = pxPos + byteWidth;
      for (let x = pxPos; x < length; x++) {
        let up = pxPos > 0 ? pxData[x - byteWidth] : 0;
        let val = pxData[x] - up;
        sum += Math.abs(val);
      }
      return sum;
    }
    function filterAvg(pxData, pxPos, byteWidth, rawData, rawPos, bpp) {
      for (let x = 0; x < byteWidth; x++) {
        let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
        let up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
        let val = pxData[pxPos + x] - (left + up >> 1);
        rawData[rawPos + x] = val;
      }
    }
    function filterSumAvg(pxData, pxPos, byteWidth, bpp) {
      let sum = 0;
      for (let x = 0; x < byteWidth; x++) {
        let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
        let up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
        let val = pxData[pxPos + x] - (left + up >> 1);
        sum += Math.abs(val);
      }
      return sum;
    }
    function filterPaeth(pxData, pxPos, byteWidth, rawData, rawPos, bpp) {
      for (let x = 0; x < byteWidth; x++) {
        let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
        let up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
        let upleft = pxPos > 0 && x >= bpp ? pxData[pxPos + x - (byteWidth + bpp)] : 0;
        let val = pxData[pxPos + x] - paethPredictor(left, up, upleft);
        rawData[rawPos + x] = val;
      }
    }
    function filterSumPaeth(pxData, pxPos, byteWidth, bpp) {
      let sum = 0;
      for (let x = 0; x < byteWidth; x++) {
        let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
        let up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
        let upleft = pxPos > 0 && x >= bpp ? pxData[pxPos + x - (byteWidth + bpp)] : 0;
        let val = pxData[pxPos + x] - paethPredictor(left, up, upleft);
        sum += Math.abs(val);
      }
      return sum;
    }
    var filters = {
      0: filterNone,
      1: filterSub,
      2: filterUp,
      3: filterAvg,
      4: filterPaeth
    };
    var filterSums = {
      0: filterSumNone,
      1: filterSumSub,
      2: filterSumUp,
      3: filterSumAvg,
      4: filterSumPaeth
    };
    module2.exports = function(pxData, width, height, options, bpp) {
      let filterTypes;
      if (!("filterType" in options) || options.filterType === -1) {
        filterTypes = [0, 1, 2, 3, 4];
      } else if (typeof options.filterType === "number") {
        filterTypes = [options.filterType];
      } else {
        throw new Error("unrecognised filter types");
      }
      if (options.bitDepth === 16) {
        bpp *= 2;
      }
      let byteWidth = width * bpp;
      let rawPos = 0;
      let pxPos = 0;
      let rawData = Buffer.alloc((byteWidth + 1) * height);
      let sel = filterTypes[0];
      for (let y = 0; y < height; y++) {
        if (filterTypes.length > 1) {
          let min = Infinity;
          for (let i = 0; i < filterTypes.length; i++) {
            let sum = filterSums[filterTypes[i]](pxData, pxPos, byteWidth, bpp);
            if (sum < min) {
              sel = filterTypes[i];
              min = sum;
            }
          }
        }
        rawData[rawPos] = sel;
        rawPos++;
        filters[sel](pxData, pxPos, byteWidth, rawData, rawPos, bpp);
        rawPos += byteWidth;
        pxPos += byteWidth;
      }
      return rawData;
    };
  }
});

// ../../node_modules/pngjs/lib/packer.js
var require_packer = __commonJS({
  "../../node_modules/pngjs/lib/packer.js"(exports2, module2) {
    "use strict";
    var constants = require_constants();
    var CrcStream = require_crc();
    var bitPacker = require_bitpacker();
    var filter = require_filter_pack();
    var zlib = require("zlib");
    var Packer = module2.exports = function(options) {
      this._options = options;
      options.deflateChunkSize = options.deflateChunkSize || 32 * 1024;
      options.deflateLevel = options.deflateLevel != null ? options.deflateLevel : 9;
      options.deflateStrategy = options.deflateStrategy != null ? options.deflateStrategy : 3;
      options.inputHasAlpha = options.inputHasAlpha != null ? options.inputHasAlpha : true;
      options.deflateFactory = options.deflateFactory || zlib.createDeflate;
      options.bitDepth = options.bitDepth || 8;
      options.colorType = typeof options.colorType === "number" ? options.colorType : constants.COLORTYPE_COLOR_ALPHA;
      options.inputColorType = typeof options.inputColorType === "number" ? options.inputColorType : constants.COLORTYPE_COLOR_ALPHA;
      if ([
        constants.COLORTYPE_GRAYSCALE,
        constants.COLORTYPE_COLOR,
        constants.COLORTYPE_COLOR_ALPHA,
        constants.COLORTYPE_ALPHA
      ].indexOf(options.colorType) === -1) {
        throw new Error(
          "option color type:" + options.colorType + " is not supported at present"
        );
      }
      if ([
        constants.COLORTYPE_GRAYSCALE,
        constants.COLORTYPE_COLOR,
        constants.COLORTYPE_COLOR_ALPHA,
        constants.COLORTYPE_ALPHA
      ].indexOf(options.inputColorType) === -1) {
        throw new Error(
          "option input color type:" + options.inputColorType + " is not supported at present"
        );
      }
      if (options.bitDepth !== 8 && options.bitDepth !== 16) {
        throw new Error(
          "option bit depth:" + options.bitDepth + " is not supported at present"
        );
      }
    };
    Packer.prototype.getDeflateOptions = function() {
      return {
        chunkSize: this._options.deflateChunkSize,
        level: this._options.deflateLevel,
        strategy: this._options.deflateStrategy
      };
    };
    Packer.prototype.createDeflate = function() {
      return this._options.deflateFactory(this.getDeflateOptions());
    };
    Packer.prototype.filterData = function(data, width, height) {
      let packedData = bitPacker(data, width, height, this._options);
      let bpp = constants.COLORTYPE_TO_BPP_MAP[this._options.colorType];
      let filteredData = filter(packedData, width, height, this._options, bpp);
      return filteredData;
    };
    Packer.prototype._packChunk = function(type, data) {
      let len = data ? data.length : 0;
      let buf = Buffer.alloc(len + 12);
      buf.writeUInt32BE(len, 0);
      buf.writeUInt32BE(type, 4);
      if (data) {
        data.copy(buf, 8);
      }
      buf.writeInt32BE(
        CrcStream.crc32(buf.slice(4, buf.length - 4)),
        buf.length - 4
      );
      return buf;
    };
    Packer.prototype.packGAMA = function(gamma) {
      let buf = Buffer.alloc(4);
      buf.writeUInt32BE(Math.floor(gamma * constants.GAMMA_DIVISION), 0);
      return this._packChunk(constants.TYPE_gAMA, buf);
    };
    Packer.prototype.packIHDR = function(width, height) {
      let buf = Buffer.alloc(13);
      buf.writeUInt32BE(width, 0);
      buf.writeUInt32BE(height, 4);
      buf[8] = this._options.bitDepth;
      buf[9] = this._options.colorType;
      buf[10] = 0;
      buf[11] = 0;
      buf[12] = 0;
      return this._packChunk(constants.TYPE_IHDR, buf);
    };
    Packer.prototype.packIDAT = function(data) {
      return this._packChunk(constants.TYPE_IDAT, data);
    };
    Packer.prototype.packIEND = function() {
      return this._packChunk(constants.TYPE_IEND, null);
    };
  }
});

// ../../node_modules/pngjs/lib/packer-async.js
var require_packer_async = __commonJS({
  "../../node_modules/pngjs/lib/packer-async.js"(exports2, module2) {
    "use strict";
    var util = require("util");
    var Stream = require("stream");
    var constants = require_constants();
    var Packer = require_packer();
    var PackerAsync = module2.exports = function(opt) {
      Stream.call(this);
      let options = opt || {};
      this._packer = new Packer(options);
      this._deflate = this._packer.createDeflate();
      this.readable = true;
    };
    util.inherits(PackerAsync, Stream);
    PackerAsync.prototype.pack = function(data, width, height, gamma) {
      this.emit("data", Buffer.from(constants.PNG_SIGNATURE));
      this.emit("data", this._packer.packIHDR(width, height));
      if (gamma) {
        this.emit("data", this._packer.packGAMA(gamma));
      }
      let filteredData = this._packer.filterData(data, width, height);
      this._deflate.on("error", this.emit.bind(this, "error"));
      this._deflate.on(
        "data",
        function(compressedData) {
          this.emit("data", this._packer.packIDAT(compressedData));
        }.bind(this)
      );
      this._deflate.on(
        "end",
        function() {
          this.emit("data", this._packer.packIEND());
          this.emit("end");
        }.bind(this)
      );
      this._deflate.end(filteredData);
    };
  }
});

// ../../node_modules/pngjs/lib/sync-inflate.js
var require_sync_inflate = __commonJS({
  "../../node_modules/pngjs/lib/sync-inflate.js"(exports2, module2) {
    "use strict";
    var assert = require("assert").ok;
    var zlib = require("zlib");
    var util = require("util");
    var kMaxLength = require("buffer").kMaxLength;
    function Inflate(opts) {
      if (!(this instanceof Inflate)) {
        return new Inflate(opts);
      }
      if (opts && opts.chunkSize < zlib.Z_MIN_CHUNK) {
        opts.chunkSize = zlib.Z_MIN_CHUNK;
      }
      zlib.Inflate.call(this, opts);
      this._offset = this._offset === void 0 ? this._outOffset : this._offset;
      this._buffer = this._buffer || this._outBuffer;
      if (opts && opts.maxLength != null) {
        this._maxLength = opts.maxLength;
      }
    }
    function createInflate(opts) {
      return new Inflate(opts);
    }
    function _close(engine, callback) {
      if (callback) {
        process.nextTick(callback);
      }
      if (!engine._handle) {
        return;
      }
      engine._handle.close();
      engine._handle = null;
    }
    Inflate.prototype._processChunk = function(chunk, flushFlag, asyncCb) {
      if (typeof asyncCb === "function") {
        return zlib.Inflate._processChunk.call(this, chunk, flushFlag, asyncCb);
      }
      let self = this;
      let availInBefore = chunk && chunk.length;
      let availOutBefore = this._chunkSize - this._offset;
      let leftToInflate = this._maxLength;
      let inOff = 0;
      let buffers = [];
      let nread = 0;
      let error;
      this.on("error", function(err) {
        error = err;
      });
      function handleChunk(availInAfter, availOutAfter) {
        if (self._hadError) {
          return;
        }
        let have = availOutBefore - availOutAfter;
        assert(have >= 0, "have should not go down");
        if (have > 0) {
          let out = self._buffer.slice(self._offset, self._offset + have);
          self._offset += have;
          if (out.length > leftToInflate) {
            out = out.slice(0, leftToInflate);
          }
          buffers.push(out);
          nread += out.length;
          leftToInflate -= out.length;
          if (leftToInflate === 0) {
            return false;
          }
        }
        if (availOutAfter === 0 || self._offset >= self._chunkSize) {
          availOutBefore = self._chunkSize;
          self._offset = 0;
          self._buffer = Buffer.allocUnsafe(self._chunkSize);
        }
        if (availOutAfter === 0) {
          inOff += availInBefore - availInAfter;
          availInBefore = availInAfter;
          return true;
        }
        return false;
      }
      assert(this._handle, "zlib binding closed");
      let res;
      do {
        res = this._handle.writeSync(
          flushFlag,
          chunk,
          // in
          inOff,
          // in_off
          availInBefore,
          // in_len
          this._buffer,
          // out
          this._offset,
          //out_off
          availOutBefore
        );
        res = res || this._writeState;
      } while (!this._hadError && handleChunk(res[0], res[1]));
      if (this._hadError) {
        throw error;
      }
      if (nread >= kMaxLength) {
        _close(this);
        throw new RangeError(
          "Cannot create final Buffer. It would be larger than 0x" + kMaxLength.toString(16) + " bytes"
        );
      }
      let buf = Buffer.concat(buffers, nread);
      _close(this);
      return buf;
    };
    util.inherits(Inflate, zlib.Inflate);
    function zlibBufferSync(engine, buffer) {
      if (typeof buffer === "string") {
        buffer = Buffer.from(buffer);
      }
      if (!(buffer instanceof Buffer)) {
        throw new TypeError("Not a string or buffer");
      }
      let flushFlag = engine._finishFlushFlag;
      if (flushFlag == null) {
        flushFlag = zlib.Z_FINISH;
      }
      return engine._processChunk(buffer, flushFlag);
    }
    function inflateSync(buffer, opts) {
      return zlibBufferSync(new Inflate(opts), buffer);
    }
    module2.exports = exports2 = inflateSync;
    exports2.Inflate = Inflate;
    exports2.createInflate = createInflate;
    exports2.inflateSync = inflateSync;
  }
});

// ../../node_modules/pngjs/lib/sync-reader.js
var require_sync_reader = __commonJS({
  "../../node_modules/pngjs/lib/sync-reader.js"(exports2, module2) {
    "use strict";
    var SyncReader = module2.exports = function(buffer) {
      this._buffer = buffer;
      this._reads = [];
    };
    SyncReader.prototype.read = function(length, callback) {
      this._reads.push({
        length: Math.abs(length),
        // if length < 0 then at most this length
        allowLess: length < 0,
        func: callback
      });
    };
    SyncReader.prototype.process = function() {
      while (this._reads.length > 0 && this._buffer.length) {
        let read = this._reads[0];
        if (this._buffer.length && (this._buffer.length >= read.length || read.allowLess)) {
          this._reads.shift();
          let buf = this._buffer;
          this._buffer = buf.slice(read.length);
          read.func.call(this, buf.slice(0, read.length));
        } else {
          break;
        }
      }
      if (this._reads.length > 0) {
        throw new Error("There are some read requests waitng on finished stream");
      }
      if (this._buffer.length > 0) {
        throw new Error("unrecognised content at end of stream");
      }
    };
  }
});

// ../../node_modules/pngjs/lib/filter-parse-sync.js
var require_filter_parse_sync = __commonJS({
  "../../node_modules/pngjs/lib/filter-parse-sync.js"(exports2) {
    "use strict";
    var SyncReader = require_sync_reader();
    var Filter = require_filter_parse();
    exports2.process = function(inBuffer, bitmapInfo) {
      let outBuffers = [];
      let reader = new SyncReader(inBuffer);
      let filter = new Filter(bitmapInfo, {
        read: reader.read.bind(reader),
        write: function(bufferPart) {
          outBuffers.push(bufferPart);
        },
        complete: function() {
        }
      });
      filter.start();
      reader.process();
      return Buffer.concat(outBuffers);
    };
  }
});

// ../../node_modules/pngjs/lib/parser-sync.js
var require_parser_sync = __commonJS({
  "../../node_modules/pngjs/lib/parser-sync.js"(exports2, module2) {
    "use strict";
    var hasSyncZlib = true;
    var zlib = require("zlib");
    var inflateSync = require_sync_inflate();
    if (!zlib.deflateSync) {
      hasSyncZlib = false;
    }
    var SyncReader = require_sync_reader();
    var FilterSync = require_filter_parse_sync();
    var Parser = require_parser2();
    var bitmapper = require_bitmapper();
    var formatNormaliser = require_format_normaliser();
    module2.exports = function(buffer, options) {
      if (!hasSyncZlib) {
        throw new Error(
          "To use the sync capability of this library in old node versions, please pin pngjs to v2.3.0"
        );
      }
      let err;
      function handleError(_err_) {
        err = _err_;
      }
      let metaData;
      function handleMetaData(_metaData_) {
        metaData = _metaData_;
      }
      function handleTransColor(transColor) {
        metaData.transColor = transColor;
      }
      function handlePalette(palette) {
        metaData.palette = palette;
      }
      function handleSimpleTransparency() {
        metaData.alpha = true;
      }
      let gamma;
      function handleGamma(_gamma_) {
        gamma = _gamma_;
      }
      let inflateDataList = [];
      function handleInflateData(inflatedData2) {
        inflateDataList.push(inflatedData2);
      }
      let reader = new SyncReader(buffer);
      let parser = new Parser(options, {
        read: reader.read.bind(reader),
        error: handleError,
        metadata: handleMetaData,
        gamma: handleGamma,
        palette: handlePalette,
        transColor: handleTransColor,
        inflateData: handleInflateData,
        simpleTransparency: handleSimpleTransparency
      });
      parser.start();
      reader.process();
      if (err) {
        throw err;
      }
      let inflateData = Buffer.concat(inflateDataList);
      inflateDataList.length = 0;
      let inflatedData;
      if (metaData.interlace) {
        inflatedData = zlib.inflateSync(inflateData);
      } else {
        let rowSize = (metaData.width * metaData.bpp * metaData.depth + 7 >> 3) + 1;
        let imageSize = rowSize * metaData.height;
        inflatedData = inflateSync(inflateData, {
          chunkSize: imageSize,
          maxLength: imageSize
        });
      }
      inflateData = null;
      if (!inflatedData || !inflatedData.length) {
        throw new Error("bad png - invalid inflate data response");
      }
      let unfilteredData = FilterSync.process(inflatedData, metaData);
      inflateData = null;
      let bitmapData = bitmapper.dataToBitMap(unfilteredData, metaData);
      unfilteredData = null;
      let normalisedBitmapData = formatNormaliser(
        bitmapData,
        metaData,
        options.skipRescale
      );
      metaData.data = normalisedBitmapData;
      metaData.gamma = gamma || 0;
      return metaData;
    };
  }
});

// ../../node_modules/pngjs/lib/packer-sync.js
var require_packer_sync = __commonJS({
  "../../node_modules/pngjs/lib/packer-sync.js"(exports2, module2) {
    "use strict";
    var hasSyncZlib = true;
    var zlib = require("zlib");
    if (!zlib.deflateSync) {
      hasSyncZlib = false;
    }
    var constants = require_constants();
    var Packer = require_packer();
    module2.exports = function(metaData, opt) {
      if (!hasSyncZlib) {
        throw new Error(
          "To use the sync capability of this library in old node versions, please pin pngjs to v2.3.0"
        );
      }
      let options = opt || {};
      let packer = new Packer(options);
      let chunks = [];
      chunks.push(Buffer.from(constants.PNG_SIGNATURE));
      chunks.push(packer.packIHDR(metaData.width, metaData.height));
      if (metaData.gamma) {
        chunks.push(packer.packGAMA(metaData.gamma));
      }
      let filteredData = packer.filterData(
        metaData.data,
        metaData.width,
        metaData.height
      );
      let compressedData = zlib.deflateSync(
        filteredData,
        packer.getDeflateOptions()
      );
      filteredData = null;
      if (!compressedData || !compressedData.length) {
        throw new Error("bad png - invalid compressed data response");
      }
      chunks.push(packer.packIDAT(compressedData));
      chunks.push(packer.packIEND());
      return Buffer.concat(chunks);
    };
  }
});

// ../../node_modules/pngjs/lib/png-sync.js
var require_png_sync = __commonJS({
  "../../node_modules/pngjs/lib/png-sync.js"(exports2) {
    "use strict";
    var parse2 = require_parser_sync();
    var pack = require_packer_sync();
    exports2.read = function(buffer, options) {
      return parse2(buffer, options || {});
    };
    exports2.write = function(png, options) {
      return pack(png, options);
    };
  }
});

// ../../node_modules/pngjs/lib/png.js
var require_png = __commonJS({
  "../../node_modules/pngjs/lib/png.js"(exports2) {
    "use strict";
    var util = require("util");
    var Stream = require("stream");
    var Parser = require_parser_async();
    var Packer = require_packer_async();
    var PNGSync = require_png_sync();
    var PNG2 = exports2.PNG = function(options) {
      Stream.call(this);
      options = options || {};
      this.width = options.width | 0;
      this.height = options.height | 0;
      this.data = this.width > 0 && this.height > 0 ? Buffer.alloc(4 * this.width * this.height) : null;
      if (options.fill && this.data) {
        this.data.fill(0);
      }
      this.gamma = 0;
      this.readable = this.writable = true;
      this._parser = new Parser(options);
      this._parser.on("error", this.emit.bind(this, "error"));
      this._parser.on("close", this._handleClose.bind(this));
      this._parser.on("metadata", this._metadata.bind(this));
      this._parser.on("gamma", this._gamma.bind(this));
      this._parser.on(
        "parsed",
        function(data) {
          this.data = data;
          this.emit("parsed", data);
        }.bind(this)
      );
      this._packer = new Packer(options);
      this._packer.on("data", this.emit.bind(this, "data"));
      this._packer.on("end", this.emit.bind(this, "end"));
      this._parser.on("close", this._handleClose.bind(this));
      this._packer.on("error", this.emit.bind(this, "error"));
    };
    util.inherits(PNG2, Stream);
    PNG2.sync = PNGSync;
    PNG2.prototype.pack = function() {
      if (!this.data || !this.data.length) {
        this.emit("error", "No data provided");
        return this;
      }
      process.nextTick(
        function() {
          this._packer.pack(this.data, this.width, this.height, this.gamma);
        }.bind(this)
      );
      return this;
    };
    PNG2.prototype.parse = function(data, callback) {
      if (callback) {
        let onParsed, onError;
        onParsed = function(parsedData) {
          this.removeListener("error", onError);
          this.data = parsedData;
          callback(null, this);
        }.bind(this);
        onError = function(err) {
          this.removeListener("parsed", onParsed);
          callback(err, null);
        }.bind(this);
        this.once("parsed", onParsed);
        this.once("error", onError);
      }
      this.end(data);
      return this;
    };
    PNG2.prototype.write = function(data) {
      this._parser.write(data);
      return true;
    };
    PNG2.prototype.end = function(data) {
      this._parser.end(data);
    };
    PNG2.prototype._metadata = function(metadata) {
      this.width = metadata.width;
      this.height = metadata.height;
      this.emit("metadata", metadata);
    };
    PNG2.prototype._gamma = function(gamma) {
      this.gamma = gamma;
    };
    PNG2.prototype._handleClose = function() {
      if (!this._parser.writable && !this._packer.readable) {
        this.emit("close");
      }
    };
    PNG2.bitblt = function(src, dst, srcX, srcY, width, height, deltaX, deltaY) {
      srcX |= 0;
      srcY |= 0;
      width |= 0;
      height |= 0;
      deltaX |= 0;
      deltaY |= 0;
      if (srcX > src.width || srcY > src.height || srcX + width > src.width || srcY + height > src.height) {
        throw new Error("bitblt reading outside image");
      }
      if (deltaX > dst.width || deltaY > dst.height || deltaX + width > dst.width || deltaY + height > dst.height) {
        throw new Error("bitblt writing outside image");
      }
      for (let y = 0; y < height; y++) {
        src.data.copy(
          dst.data,
          (deltaY + y) * dst.width + deltaX << 2,
          (srcY + y) * src.width + srcX << 2,
          (srcY + y) * src.width + srcX + width << 2
        );
      }
    };
    PNG2.prototype.bitblt = function(dst, srcX, srcY, width, height, deltaX, deltaY) {
      PNG2.bitblt(this, dst, srcX, srcY, width, height, deltaX, deltaY);
      return this;
    };
    PNG2.adjustGamma = function(src) {
      if (src.gamma) {
        for (let y = 0; y < src.height; y++) {
          for (let x = 0; x < src.width; x++) {
            let idx = src.width * y + x << 2;
            for (let i = 0; i < 3; i++) {
              let sample = src.data[idx + i] / 255;
              sample = Math.pow(sample, 1 / 2.2 / src.gamma);
              src.data[idx + i] = Math.round(sample * 255);
            }
          }
        }
        src.gamma = 0;
      }
    };
    PNG2.prototype.adjustGamma = function() {
      PNG2.adjustGamma(this);
    };
  }
});

// src/main.ts
var import_promises = require("node:fs/promises");
var import_node_path = require("node:path");

// ../core/src/types.ts
var BLOCK_IDS = ["stats", "activity", "languages", "projects", "city", "game"];
var COMPANIONS = ["snake", "chess", "none"];
var FONT_CHOICES = ["sans", "serif", "mono", "rounded", "humanist", "classic", "typewriter", "handwriting", "impact"];
var TEXT_SIZE_MIN = 80;
var TEXT_SIZE_MAX = 130;
var THEME_MODES = ["auto", "dark", "light"];

// ../core/src/util.ts
var XML_ENTITIES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};
function xmlEscape(text10) {
  return text10.replace(/[&<>"']/g, (c2) => XML_ENTITIES[c2] ?? c2);
}
function escapeMarkdown(text10) {
  return text10.replace(/[\\`*_{}[\]()#+\-.!|<>&~]/g, "\\$&");
}
function truncate(text10, max) {
  const clean = text10.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(0, max - 1)).trimEnd()}\u2026`;
}
function wrap(text10, width, maxLines) {
  const words = text10.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines = [];
  let current = "";
  for (const raw of words) {
    const word = raw.length > width ? `${raw.slice(0, width - 1)}\u2026` : raw;
    if (current && current.length + 1 + word.length > width) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1] ?? "";
  while (last.length + 1 > width && last.includes(" ")) last = last.slice(0, last.lastIndexOf(" "));
  kept[maxLines - 1] = `${truncate(last, width - 1)}\u2026`;
  return kept;
}
function timeAgo(thenIso, nowIso) {
  const then = Date.parse(thenIso);
  const now = Date.parse(nowIso);
  if (!Number.isFinite(then) || !Number.isFinite(now)) return null;
  const days = Math.floor(now / 864e5) - Math.floor(then / 864e5);
  if (days < 1) return "today";
  if (days < 7) return days === 1 ? "yesterday" : `${days} days ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return months === 1 ? "1 month ago" : `${months} months ago`;
  }
  const years = Math.floor(days / 365);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}
function formatNumber(n) {
  return n.toLocaleString("en-US");
}
var USERNAME = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
function isValidUsername(name) {
  return USERNAME.test(name);
}
function safeUrl(value) {
  const raw = value?.trim();
  if (!raw) return null;
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

// ../core/src/github.ts
var GitHubError = class extends Error {
  constructor(message, kind, resetAt) {
    super(message);
    this.kind = kind;
    this.resetAt = resetAt;
    this.name = "GitHubError";
  }
  kind;
  resetAt;
};
var TOP_REPOS = 6;
var ACTIVE_WINDOW_DAYS = 90;
var API = "https://api.github.com";
var PAGE_SIZE = 100;
function blankToNull(value) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
async function request(path, opts) {
  const doFetch = opts.fetch ?? fetch;
  const headers = { Accept: "application/vnd.github+json" };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  let response;
  try {
    response = await doFetch(`${API}${path}`, { headers });
  } catch {
    throw new GitHubError("Could not reach GitHub. Check your connection and try again.", "network");
  }
  if (response.ok) return await response.json();
  if (response.status === 404) {
    throw new GitHubError("That GitHub user was not found.", "not-found");
  }
  const exhausted = response.headers.get("x-ratelimit-remaining") === "0";
  if (response.status === 429 || response.status === 403 && exhausted) {
    const reset = Number(response.headers.get("x-ratelimit-reset"));
    throw new GitHubError(
      "GitHub rate limit reached.",
      "rate-limit",
      Number.isFinite(reset) && reset > 0 ? new Date(reset * 1e3) : void 0
    );
  }
  throw new GitHubError(`GitHub returned an unexpected error (${response.status}).`, "unknown");
}
function languageShares(repos) {
  const counts = /* @__PURE__ */ new Map();
  for (const repo of repos) {
    if (repo.language) counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
  }
  const total = [...counts.values()].reduce((sum, n) => sum + n, 0);
  if (total === 0) return [];
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name, count]) => ({ name, percent: Math.round(count / total * 100) }));
}
function licenseOf(repo) {
  const id = repo.license?.spdx_id?.trim();
  return id && id !== "NOASSERTION" ? id : null;
}
function summarise(repo) {
  return {
    name: repo.name,
    description: blankToNull(repo.description),
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    language: repo.language,
    url: repo.html_url,
    pushedAt: repo.pushed_at ?? null,
    license: licenseOf(repo)
  };
}
async function fetchProfile(username, opts = {}) {
  if (!isValidUsername(username)) {
    throw new GitHubError("That is not a valid GitHub username.", "invalid-username");
  }
  const user = await request(`/users/${username}`, opts);
  const repos = [];
  const maxPages = opts.maxRepoPages ?? 3;
  for (let page = 1; page <= maxPages; page++) {
    const batch = await request(
      `/users/${username}/repos?per_page=${PAGE_SIZE}&type=owner&sort=pushed&page=${page}`,
      opts
    );
    repos.push(...batch);
    if (batch.length < PAGE_SIZE) break;
  }
  const now = (opts.now ?? (() => /* @__PURE__ */ new Date()))();
  const cutoff = now.getTime() - ACTIVE_WINDOW_DAYS * 864e5;
  const own = repos.filter((repo) => !repo.fork);
  const activeRepos = own.filter((repo) => {
    const pushed = repo.pushed_at ? Date.parse(repo.pushed_at) : NaN;
    return !repo.archived && Number.isFinite(pushed) && pushed >= cutoff;
  }).length;
  const topRepos = own.filter((repo) => !repo.archived).sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, TOP_REPOS).map(summarise);
  const recentRepos = own.filter((repo) => !repo.archived && Number.isFinite(Date.parse(repo.pushed_at ?? ""))).sort((a, b) => Date.parse(b.pushed_at) - Date.parse(a.pushed_at) || a.name.localeCompare(b.name)).slice(0, TOP_REPOS).map(summarise);
  return {
    login: user.login,
    name: blankToNull(user.name),
    avatarUrl: user.avatar_url,
    bio: blankToNull(user.bio),
    company: blankToNull(user.company),
    location: blankToNull(user.location),
    website: blankToNull(user.blog),
    url: user.html_url,
    followers: user.followers,
    following: user.following,
    publicRepos: user.public_repos,
    totalStars: own.reduce((sum, repo) => sum + repo.stargazers_count, 0),
    totalForks: own.reduce((sum, repo) => sum + repo.forks_count, 0),
    activeRepos,
    fetchedAt: now.toISOString(),
    createdAt: user.created_at,
    languages: languageShares(own).slice(0, 5),
    topRepos,
    recentRepos
  };
}

// ../core/src/contributions.ts
var DATE = /^\d{4}-\d{2}-\d{2}$/;
var MAX_DAYS = 400;
var MS_PER_DAY = 864e5;
var GRAPHQL = "https://api.github.com/graphql";
var CONTRIBUTIONS_QUERY = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel } }
      }
    }
  }
}`;
var LEVELS = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4
};
function asRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value : null;
}
function isRealDate(date) {
  if (!DATE.test(date)) return false;
  const time = Date.parse(`${date}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === date;
}
function dayNumber(date) {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1) / MS_PER_DAY;
}
function computeStreaks(days) {
  let longest = 0;
  let run = 0;
  let activeDays = 0;
  days.forEach((day, index) => {
    if (day.count <= 0) {
      run = 0;
      return;
    }
    activeDays++;
    const previous = days[index - 1];
    const continues = previous !== void 0 && previous.count > 0 && dayNumber(day.date) - dayNumber(previous.date) === 1;
    run = continues ? run + 1 : 1;
    longest = Math.max(longest, run);
  });
  let end = days.length - 1;
  if (end >= 0 && (days[end]?.count ?? 0) === 0) end--;
  let current = 0;
  for (let i = end; i >= 0; i--) {
    const day = days[i];
    if (!day || day.count <= 0) break;
    const next = days[i + 1];
    if (next && next.count > 0 && dayNumber(next.date) - dayNumber(day.date) !== 1) break;
    current++;
  }
  return { current, longest, activeDays };
}
function weeklyTotals(days) {
  const weeks = [];
  days.forEach((day, index) => {
    const weekday = (/* @__PURE__ */ new Date(`${day.date}T00:00:00Z`)).getUTCDay();
    if (index === 0 || weekday === 0) weeks.push(0);
    weeks[weeks.length - 1] = (weeks[weeks.length - 1] ?? 0) + day.count;
  });
  return weeks;
}
function recentWeeks(days, count) {
  return count > 0 ? weeklyTotals(days).slice(-count) : [];
}
var MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];
function busiestMonth(days) {
  const totals = /* @__PURE__ */ new Map();
  for (const day of days) {
    const key = day.date.slice(0, 7);
    totals.set(key, (totals.get(key) ?? 0) + day.count);
  }
  let best = null;
  for (const [key, total] of totals) {
    if (total > 0 && (!best || total > best.total)) best = { key, total };
  }
  if (!best) return null;
  return { name: MONTH_NAMES[Number(best.key.slice(5, 7)) - 1] ?? best.key, total: best.total };
}
function invalid(reason) {
  return new GitHubError(`The contribution data was not valid: ${reason}.`, "unknown");
}
function buildContributions(input2) {
  if (input2.length === 0) throw invalid("it had no days");
  if (input2.length > MAX_DAYS) throw invalid("it had too many days");
  const days = [...input2].sort((a, b) => a.date.localeCompare(b.date));
  for (let i = 1; i < days.length; i++) {
    if (days[i]?.date === days[i - 1]?.date) throw invalid("a date appeared twice");
  }
  const { current, longest, activeDays } = computeStreaks(days);
  return {
    from: days[0].date,
    to: days[days.length - 1].date,
    total: days.reduce((sum, day) => sum + day.count, 0),
    activeDays,
    currentStreak: current,
    longestStreak: longest,
    days
  };
}
function parseCalendarResponse(body) {
  const root = asRecord(body);
  const errors = Array.isArray(root?.errors) ? root.errors : [];
  const type = asRecord(errors[0])?.type;
  if (type === "NOT_FOUND") throw new GitHubError("That GitHub user was not found.", "not-found");
  if (type === "RATE_LIMITED") throw new GitHubError("GitHub rate limit reached.", "rate-limit");
  const user = asRecord(asRecord(root?.data)?.user);
  if (!user) {
    if (errors.length > 0) throw new GitHubError("GitHub returned an error.", "unknown");
    throw new GitHubError("That GitHub user was not found.", "not-found");
  }
  const weeks = asRecord(asRecord(user.contributionsCollection)?.contributionCalendar)?.weeks;
  if (!Array.isArray(weeks)) throw invalid("the calendar was missing");
  const days = [];
  for (const week of weeks) {
    const list = asRecord(week)?.contributionDays;
    if (!Array.isArray(list)) throw invalid("a week was missing its days");
    for (const raw of list) {
      const day = asRecord(raw);
      const date = day?.date;
      const count = day?.contributionCount;
      if (typeof date !== "string" || !isRealDate(date) || typeof count !== "number") throw invalid("a day was malformed");
      days.push({ date, count, level: LEVELS[String(day?.contributionLevel)] ?? 0 });
    }
  }
  return buildContributions(days);
}
function statusError(status, headers) {
  if (status === 401) return new GitHubError("GitHub did not accept the token.", "unauthorized");
  const exhausted = headers.get("x-ratelimit-remaining") === "0";
  if (status === 429 || status === 403 && exhausted) {
    const reset = Number(headers.get("x-ratelimit-reset"));
    return new GitHubError(
      "GitHub rate limit reached.",
      "rate-limit",
      Number.isFinite(reset) && reset > 0 ? new Date(reset * 1e3) : void 0
    );
  }
  if (status === 404) return new GitHubError("That GitHub user was not found.", "not-found");
  return new GitHubError(`GitHub returned an unexpected error (${status}).`, "unknown");
}
async function fetchContributions(username, opts = {}) {
  if (!isValidUsername(username)) throw new GitHubError("That is not a valid GitHub username.", "invalid-username");
  if (!opts.token) throw new GitHubError("A token is needed to read contributions.", "unauthorized");
  let response;
  try {
    response = await (opts.fetch ?? fetch)(GRAPHQL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${opts.token}`,
        "Content-Type": "application/json",
        "User-Agent": "livebio"
      },
      body: JSON.stringify({ query: CONTRIBUTIONS_QUERY, variables: { login: username } })
    });
  } catch {
    throw new GitHubError("Could not reach GitHub. Check your connection and try again.", "network");
  }
  if (!response.ok) {
    const error = statusError(response.status, response.headers);
    if (error.kind === "unknown") {
      const detail = (await response.text().catch(() => "")).replace(/\s+/g, " ").slice(0, 200);
      if (detail) error.message = `${error.message} ${detail}`;
    }
    throw error;
  }
  let body;
  try {
    body = await response.json();
  } catch {
    throw invalid("GitHub sent something that was not JSON");
  }
  return parseCalendarResponse(body);
}

// ../core/src/config.ts
var import_yaml = __toESM(require_dist(), 1);

// ../core/src/color.ts
function rgbToHsl(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === rn) h = (gn - bn) / d % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}
function hslToHex(h, s, l) {
  const c2 = (1 - Math.abs(2 * l - 1)) * s;
  const x = c2 * (1 - Math.abs(h / 60 % 2 - 1));
  const m = l - c2 / 2;
  const sector = Math.floor((h % 360 + 360) % 360 / 60);
  const [r, g, b] = [
    [c2, x, 0],
    [x, c2, 0],
    [0, c2, x],
    [0, x, c2],
    [x, 0, c2],
    [c2, 0, x]
  ][sector] ?? [0, 0, 0];
  const hex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${hex(r ?? 0)}${hex(g ?? 0)}${hex(b ?? 0)}`;
}
function hueOf(tint) {
  return tint ? rgbToHsl(tint[0], tint[1], tint[2])[0] : void 0;
}
var FALLBACK_ACCENTS = {
  dark: ["#3fb950", "#58a6ff", "#bc8cff", "#e3b341", "#39c5cf"],
  light: ["#1a7f37", "#0969da", "#8250df", "#9a6700", "#1b7c83"]
};
function accentColors(tint, variant) {
  if (!tint) return FALLBACK_ACCENTS[variant];
  const [hue] = rgbToHsl(tint[0], tint[1], tint[2]);
  const lightness = variant === "dark" ? 0.62 : 0.42;
  return [0, 38, -38, 90, -90].map((offset) => hslToHex((hue + offset + 360) % 360, 0.72, lightness));
}
function tintForHue(hue) {
  const hex = hslToHex(hue, 0.72, 0.5);
  return [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
}

// ../core/src/live/style.ts
var PRESETS = [
  "aurora",
  "sunrise",
  "night",
  "space",
  "arcade",
  "chalk",
  "editor",
  "blueprint",
  "paper",
  "terminal",
  "glow",
  "plain"
];
var c = (hue, s, l) => hslToHex((hue % 360 + 360) % 360, s, l);
var RECIPES = {
  aurora: { font: "sans", radius: 22, texture: "none", cell: "round", gap: 3, glow: true, frame: "glass", pieces: "glow", hueShift: 0, bg: { dark: [0.07, 0.14], light: [0.96, 0.9], drift: 30, sat: 0.5 }, ink: { dark: ["#eaf6f3", "#8fb5ae"], light: ["#10302c", "#4b6f69"] } },
  sunrise: { font: "sans", radius: 24, texture: "none", cell: "round", gap: 3, glow: false, frame: "flat", pieces: "solid", hueShift: 0, fixedHue: void 0, bg: { dark: [0.09, 0.2], light: [0.96, 0.88], drift: 38, sat: 0.6 }, ink: { dark: ["#fff7ee", "#d6bfb0"], light: ["#2a1b14", "#7a5a4a"] } },
  night: { font: "sans", radius: 20, texture: "stars", cell: "square", gap: 3, glow: false, frame: "glass", pieces: "solid", hueShift: 0, bg: { dark: [0.07, 0.17], light: [0.95, 0.86], drift: 22, sat: 0.5 }, ink: { dark: ["#eef0ff", "#9aa0c8"], light: ["#1d2140", "#5b6190"] } },
  space: { font: "sans", radius: 20, texture: "stars", cell: "round", gap: 4, glow: true, frame: "glass", pieces: "glow", hueShift: 25, bg: { dark: [0.05, 0.13], light: [0.96, 0.88], drift: 25, sat: 0.5 }, ink: { dark: ["#eef0ff", "#9aa0c8"], light: ["#1d2140", "#5b6190"] } },
  arcade: { font: "mono", radius: 14, texture: "grid", cell: "square", gap: 2, glow: true, frame: "terminal", pieces: "glow", hueShift: 0, fixedHue: 135, bg: { dark: [0.05, 0.09], light: [0.95, 0.9], drift: 10, sat: 0.4 }, ink: { dark: ["#d9ffe6", "#79b78f"], light: ["#0d3a1f", "#3f7a58"] } },
  chalk: { font: "serif", radius: 16, texture: "lines", cell: "round", gap: 3, glow: false, frame: "chalk", pieces: "outline", hueShift: 0, bg: { dark: [0.14, 0.16], light: [0.98, 0.96], drift: 0, sat: 0.2 }, ink: { dark: ["#f2efe4", "#a9bdb6"], light: ["#27304d", "#6a7191"] } },
  editor: { font: "mono", radius: 14, texture: "none", cell: "square", gap: 3, glow: false, frame: "flat", pieces: "solid", hueShift: 0, fixedHue: 142, bg: { dark: [0.07, 0.09], light: [1, 0.97], drift: 0, sat: 0.2 }, ink: { dark: ["#e6edf3", "#8b98a9"], light: ["#1b2430", "#5f6c7d"] } },
  blueprint: { font: "mono", radius: 10, texture: "grid", cell: "diamond", gap: 3, glow: false, frame: "blueprint", pieces: "outline", hueShift: 0, fixedHue: 205, bg: { dark: [0.1, 0.14], light: [0.96, 0.92], drift: 8, sat: 0.55 }, ink: { dark: ["#dbeeff", "#86a9c9"], light: ["#0f2a45", "#4a6d8c"] } },
  paper: { font: "serif", radius: 8, texture: "none", cell: "square", gap: 3, glow: false, frame: "wood", pieces: "solid", hueShift: 0, bg: { dark: [0.09, 0.11], light: [0.97, 0.94], drift: 0, sat: 0.12 }, ink: { dark: ["#ecebe6", "#9a978f"], light: ["#1c1b19", "#68655d"] } },
  terminal: { font: "mono", radius: 12, texture: "lines", cell: "square", gap: 2, glow: true, frame: "terminal", pieces: "glow", hueShift: 0, fixedHue: 125, bg: { dark: [0.04, 0.07], light: [0.94, 0.9], drift: 6, sat: 0.35 }, ink: { dark: ["#b9ffc9", "#5fa874"], light: ["#0f3d1d", "#3d7a52"] } },
  glow: { font: "mono", radius: 18, texture: "grid", cell: "round", gap: 3, glow: true, frame: "glass", pieces: "glow", hueShift: 150, bg: { dark: [0.06, 0.12], light: [0.96, 0.9], drift: 30, sat: 0.5 }, ink: { dark: ["#e6fff9", "#86b8ae"], light: ["#0d3b34", "#3f7a70"] } },
  plain: { font: "sans", radius: 8, texture: "none", cell: "square", gap: 2, glow: false, frame: "flat", pieces: "solid", hueShift: 0, fixedHue: 220, bg: { dark: [0.1, 0.12], light: [1, 0.97], drift: 0, sat: 0.08 }, ink: { dark: ["#e7e9ee", "#8d93a1"], light: ["#1f232b", "#6b7280"] } }
};
function styleFor(preset, variant, pictureHue, shift = 0) {
  const r = RECIPES[preset];
  const dark = variant === "dark";
  const hue = (r.fixedHue ?? pictureHue + r.hueShift) + shift;
  const [bgA, bgB] = dark ? r.bg.dark : r.bg.light;
  const [fg, muted] = dark ? r.ink.dark : r.ink.light;
  const accent2 = c(hue, 0.78, dark ? 0.6 : 0.4);
  const accent22 = c(hue + 40, 0.82, dark ? 0.64 : 0.42);
  const levels = [1, 2, 3, 4].map((level) => {
    const t = level / 4;
    const l = dark ? 0.3 + 0.34 * t : 0.72 - 0.34 * t;
    return [c(hue, 0.74, l), c(hue, 0.7, l - 0.08), c(hue, 0.66, l - 0.17)];
  });
  const peakHue = hue + 42;
  const peakL = dark ? 0.68 : 0.46;
  const tint = (l, s = 0.4) => c(hue, s, l);
  const chess = (() => {
    const base = { highlight: c(hue + 20, 0.9, dark ? 0.55 : 0.55) };
    switch (r.frame) {
      case "wood":
        return { ...base, frame: "wood", light: dark ? "#c9b280" : "#ecdcb4", dark: dark ? "#7a5535" : "#b08a5e", frameFill: dark ? "#3a2616" : "#7a5535", frameStroke: dark ? "#6d4a2c" : "#4e3420", coord: dark ? "#b9a074" : "#e8d8b0", pieces: "solid", white: { fill: "#fbf6e8", stroke: "#2b2118" }, black: { fill: "#2e2a26", stroke: "#e9dcc0" } };
      case "flat":
        return { ...base, frame: "flat", light: tint(dark ? 0.3 : 0.9, 0.15), dark: tint(dark ? 0.18 : 0.74, 0.2), frameFill: tint(dark ? 0.12 : 0.82, 0.18), frameStroke: tint(dark ? 0.3 : 0.65, 0.2), coord: muted, pieces: "solid", white: { fill: dark ? "#f5f5f5" : "#ffffff", stroke: dark ? "#12141a" : "#1a1d24" }, black: { fill: dark ? "#20232c" : "#2a2e38", stroke: dark ? "#e8e8ee" : "#ffffff" } };
      case "blueprint":
        return { ...base, frame: "blueprint", light: dark ? "rgba(120,190,255,0.10)" : "rgba(30,100,190,0.10)", dark: "rgba(0,0,0,0)", frameFill: "rgba(0,0,0,0)", frameStroke: accent2, coord: muted, pieces: "outline", white: { fill: "rgba(0,0,0,0)", stroke: dark ? "#bfe3ff" : "#0f3a66" }, black: { fill: dark ? "rgba(120,190,255,0.28)" : "rgba(30,100,190,0.3)", stroke: dark ? "#7fb8f0" : "#1c5a9e" } };
      case "chalk":
        return { ...base, frame: "chalk", light: dark ? "rgba(255,255,255,0.09)" : "rgba(90,110,170,0.12)", dark: "rgba(0,0,0,0)", frameFill: "rgba(0,0,0,0)", frameStroke: dark ? "#e9e5d6" : "#27304d", coord: muted, pieces: "outline", white: { fill: "rgba(0,0,0,0)", stroke: dark ? "#f4f0e2" : "#27304d" }, black: { fill: dark ? "rgba(244,240,226,0.5)" : "rgba(39,48,77,0.55)", stroke: dark ? "#f4f0e2" : "#27304d" } };
      case "terminal":
        return { ...base, frame: "terminal", light: tint(dark ? 0.14 : 0.82, 0.45), dark: tint(dark ? 0.07 : 0.7, 0.4), frameFill: tint(dark ? 0.05 : 0.88, 0.35), frameStroke: accent2, coord: muted, pieces: "glow", white: { fill: tint(dark ? 0.78 : 0.9, 0.8), stroke: tint(dark ? 0.9 : 0.3, 0.9) }, black: { fill: tint(dark ? 0.3 : 0.28, 0.7), stroke: tint(dark ? 0.6 : 0.15, 0.85) } };
      default:
        return { ...base, frame: "glass", light: tint(dark ? 0.24 : 0.84, 0.35), dark: tint(dark ? 0.14 : 0.7, 0.4), frameFill: tint(dark ? 0.08 : 0.9, 0.35), frameStroke: accent2, coord: muted, pieces: r.pieces, white: { fill: c(hue, 0.7, dark ? 0.84 : 0.97), stroke: c(hue, 0.7, dark ? 0.5 : 0.25) }, black: { fill: c(hue, 0.5, dark ? 0.32 : 0.28), stroke: c(hue, 0.6, dark ? 0.7 : 0.15) } };
    }
  })();
  return {
    preset,
    variant,
    font: r.font,
    bgTop: c(hue, r.bg.sat, bgA),
    bgBottom: c(hue + r.bg.drift, r.bg.sat + 0.05, bgB),
    border: c(hue, 0.4, dark ? 0.26 : 0.78),
    fg,
    muted,
    accent: accent2,
    accent2: accent22,
    radius: r.radius,
    texture: r.texture,
    snake: {
      cell: r.cell,
      gap: r.gap,
      track: c(hue, 0.25, dark ? 0.16 : 0.86),
      cellColor: c(hue, 0.78, dark ? 0.58 : 0.42),
      body: c(hue + 55, 0.8, dark ? 0.6 : 0.42),
      head: c(hue + 55, 0.9, dark ? 0.74 : 0.34),
      glow: r.glow
    },
    city: {
      top: levels[3][0],
      left: levels[3][1],
      right: levels[3][2],
      slab: c(hue, 0.3, dark ? 0.15 : 0.93),
      slabSide: c(hue, 0.3, dark ? 0.09 : 0.8),
      line: c(hue, 0.4, dark ? 0.32 : 0.7),
      levels,
      peak: [c(peakHue, 0.85, peakL), c(peakHue, 0.8, peakL - 0.08), c(peakHue, 0.75, peakL - 0.17)]
    },
    chess
  };
}

// ../core/src/config.ts
var ConfigError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "ConfigError";
  }
};
var MAX_TEXT = 200;
function defaultConfig(username, template = "showcase") {
  return {
    username,
    template,
    theme: "auto",
    motion: true,
    credit: true,
    blocks: [...BLOCK_IDS],
    text: {}
  };
}
function expectBoolean(value, field, fallback) {
  if (value === void 0) return fallback;
  if (typeof value !== "boolean") throw new ConfigError(`"${field}" must be true or false.`);
  return value;
}
function optionalText(value, field) {
  if (value === void 0 || value === null) return void 0;
  if (typeof value !== "string") throw new ConfigError(`"${field}" must be text.`);
  const trimmed = value.trim();
  if (trimmed.length > MAX_TEXT) throw new ConfigError(`"${field}" must be at most ${MAX_TEXT} characters.`);
  return trimmed || void 0;
}
function parseCustom(value) {
  if (value === void 0 || value === null) return void 0;
  if (typeof value !== "object" || Array.isArray(value)) throw new ConfigError('"custom" must be a set of key: value settings.');
  const raw = value;
  const custom = {};
  if (raw.hue !== void 0) {
    if (typeof raw.hue !== "number" || !Number.isInteger(raw.hue) || raw.hue < 0 || raw.hue > 359) {
      throw new ConfigError('"custom.hue" must be a whole number from 0 to 359.');
    }
    custom.hue = raw.hue;
  }
  if (raw.look !== void 0) {
    if (!PRESETS.includes(raw.look)) throw new ConfigError(`"custom.look" must be one of: ${PRESETS.join(", ")}.`);
    custom.look = raw.look;
  }
  if (raw.companion !== void 0) {
    if (!COMPANIONS.includes(raw.companion)) {
      throw new ConfigError(`"custom.companion" must be one of: ${COMPANIONS.join(", ")}.`);
    }
    custom.companion = raw.companion;
  }
  if (raw.font !== void 0) {
    if (!FONT_CHOICES.includes(raw.font)) throw new ConfigError(`"custom.font" must be one of: ${FONT_CHOICES.join(", ")}.`);
    custom.font = raw.font;
  }
  if (raw.textColor !== void 0) {
    if (typeof raw.textColor !== "string" || !/^#[0-9a-fA-F]{6}$/.test(raw.textColor)) {
      throw new ConfigError('"custom.textColor" must be a colour written as #rrggbb.');
    }
    custom.textColor = raw.textColor.toLowerCase();
  }
  if (raw.textSize !== void 0) {
    if (typeof raw.textSize !== "number" || !Number.isInteger(raw.textSize) || raw.textSize < TEXT_SIZE_MIN || raw.textSize > TEXT_SIZE_MAX) {
      throw new ConfigError(`"custom.textSize" must be a whole number from ${TEXT_SIZE_MIN} to ${TEXT_SIZE_MAX} (a percentage).`);
    }
    custom.textSize = raw.textSize;
  }
  if (raw.timelapse !== void 0) {
    if (typeof raw.timelapse !== "boolean") throw new ConfigError('"custom.timelapse" must be true or false.');
    custom.timelapse = raw.timelapse;
  }
  return Object.keys(custom).length > 0 ? custom : void 0;
}
function parseConfig(input2) {
  if (typeof input2 !== "object" || input2 === null || Array.isArray(input2)) {
    throw new ConfigError("The config must be a set of key: value settings.");
  }
  const raw = input2;
  const username = raw.username;
  if (typeof username !== "string" || !isValidUsername(username)) {
    throw new ConfigError('"username" must be a valid GitHub username.');
  }
  const template = raw.template ?? "showcase";
  if (typeof template !== "string" || !template) throw new ConfigError('"template" must be a template id.');
  const theme = raw.theme ?? "auto";
  if (!THEME_MODES.includes(theme)) {
    throw new ConfigError(`"theme" must be one of: ${THEME_MODES.join(", ")}.`);
  }
  let blocks = [...BLOCK_IDS];
  if (raw.blocks !== void 0) {
    if (!Array.isArray(raw.blocks)) throw new ConfigError('"blocks" must be a list.');
    const unknown = raw.blocks.filter((b) => !BLOCK_IDS.includes(b));
    if (unknown.length > 0) {
      throw new ConfigError(`Unknown block: ${String(unknown[0])}. Choose from: ${BLOCK_IDS.join(", ")}.`);
    }
    blocks = [...new Set(raw.blocks)];
  }
  const textRaw = raw.text ?? {};
  if (typeof textRaw !== "object" || textRaw === null || Array.isArray(textRaw)) {
    throw new ConfigError('"text" must be a set of key: value settings.');
  }
  const text10 = {};
  const headline = optionalText(textRaw.headline, "text.headline");
  const bio = optionalText(textRaw.bio, "text.bio");
  if (headline) text10.headline = headline;
  if (bio) text10.bio = bio;
  const custom = parseCustom(raw.custom);
  return {
    username,
    template,
    theme,
    motion: expectBoolean(raw.motion, "motion", true),
    credit: expectBoolean(raw.credit, "credit", true),
    blocks,
    text: text10,
    ...custom ? { custom } : {}
  };
}
function parseConfigYaml(source) {
  let data;
  try {
    data = (0, import_yaml.parse)(source);
  } catch (error) {
    throw new ConfigError(`The config is not valid YAML: ${error.message}`);
  }
  return parseConfig(data);
}
function needsContributions(config) {
  return config.blocks.some((block) => block === "activity" || block === "city" || block === "game");
}

// ../core/src/credit.ts
var CREDIT_TEXT = "livebio by illusivehacks";
var FONT = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";
var SIZE = 15;
var CELL = 9.2;
var HEIGHT = 34;
var BASELINE = 22;
var PERIOD = 4.6;
var NOISE = ["#", "%", "@", "$", "&", "/", "\\", "<", ">", "0", "1", "*", "?", "+", "=", "~"];
var CREDIT_WIDTH = Math.ceil(CREDIT_TEXT.length * CELL) + 8;
var COLORS = {
  dark: { fg: "#e6edf3", red: "#ff3b6b", cyan: "#27e1f0" },
  light: { fg: "#1f2328", red: "#e11d48", cyan: "#0891b2" }
};
function seeded(seed) {
  let state = 2166136261;
  for (const char of seed) state = Math.imul(state ^ char.charCodeAt(0), 16777619) >>> 0;
  return () => {
    state = Math.imul(state ^ state >>> 15, 2246822507) >>> 0;
    state = Math.imul(state ^ state >>> 13, 3266489909) >>> 0;
    return ((state ^= state >>> 16) >>> 0) / 4294967296;
  };
}
function creditSvg(variant, motion) {
  const { fg, red, cyan } = COLORS[variant];
  const rand = seeded("livebio-credit");
  const chars = [...CREDIT_TEXT];
  const layer = (cls, x, glyph, fill, extra = "") => `<text class="${cls}" x="${x.toFixed(1)}" y="${BASELINE}" fill="${fill}"${extra}>${xmlEscape(glyph)}</text>`;
  const groups = chars.map((char, index) => {
    if (char === " ") return "";
    const x = 4 + index * CELL;
    const delay = (rand() * 2.4).toFixed(2);
    const noise = NOISE[Math.floor(rand() * NOISE.length)];
    const style = motion ? ` style="--d:${delay}s"` : "";
    return `<g class="g"${style}>` + layer("r", x, char, red) + layer("b", x, char, cyan) + layer("w", x, char, fg) + (motion ? layer("a", x, noise, fg) : "") + `</g>`;
  }).join("");
  const css = motion ? `text{font-family:${FONT};font-size:${SIZE}px;font-weight:700}
.r{transform:translate(-1px,0);opacity:.75}.b{transform:translate(1px,0);opacity:.75}.a{opacity:0}
.g,.r,.b,.w,.a{animation-duration:${PERIOD}s;animation-delay:var(--d);animation-iteration-count:infinite;animation-timing-function:steps(1,end)}
.g{animation-name:g}.r{animation-name:r}.b{animation-name:b}.w{animation-name:w}.a{animation-name:a}
@keyframes g{0%,84%{transform:none}86%{transform:translate(2px,-1px) skewX(-10deg)}88%{transform:translate(-2px,1px) skewX(8deg)}90%{transform:translate(1px,0)}92%,100%{transform:none}}
@keyframes r{0%,84%{transform:translate(-1px,0)}86%{transform:translate(-5px,1px)}88%{transform:translate(-3px,-1px)}90%{transform:translate(4px,0)}92%,100%{transform:translate(-1px,0)}}
@keyframes b{0%,84%{transform:translate(1px,0)}86%{transform:translate(5px,-1px)}88%{transform:translate(3px,1px)}90%{transform:translate(-4px,0)}92%,100%{transform:translate(1px,0)}}
@keyframes w{0%,85%{opacity:1}86%,89%{opacity:0}90%,100%{opacity:1}}
@keyframes a{0%,85%{opacity:0}86%,89%{opacity:1}90%,100%{opacity:0}}
@media (prefers-reduced-motion:reduce){.g,.r,.b,.w,.a{animation:none}.a{opacity:0}.w{opacity:1}}` : `text{font-family:${FONT};font-size:${SIZE}px;font-weight:700}
.r{transform:translate(-1px,0);opacity:.75}.b{transform:translate(1px,0);opacity:.75}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CREDIT_WIDTH}" height="${HEIGHT}" viewBox="0 0 ${CREDIT_WIDTH} ${HEIGHT}" role="img" aria-labelledby="t">
<title id="t">${xmlEscape(CREDIT_TEXT)}</title>
<style>
${css}
</style>
${groups}
</svg>
`;
}

// ../core/src/readme.ts
var REPO_URL = "https://github.com/illusive7ai/livebio";
var ASSET_DIR = "livebio";
var MARKER_START = "<!-- livebio:start -->";
var MARKER_END = "<!-- livebio:end -->";
function creditFooter(theme = "auto") {
  return ['<div align="center">', `<a href="${REPO_URL}">`, pictureTag("credit", theme, CREDIT_TEXT, CREDIT_WIDTH), "</a>", "</div>"].join("\n");
}
function wrapReadme(body, config) {
  const parts = [MARKER_START, body.trim()];
  if (config.credit) parts.push(creditFooter(config.theme));
  parts.push(MARKER_END);
  return `${parts.join("\n\n")}
`;
}
function applyToReadme(existing, generated) {
  if (existing) {
    const start = existing.indexOf(MARKER_START);
    const end = existing.indexOf(MARKER_END);
    if (start !== -1 && end > start) {
      const block = generated.trim();
      return `${existing.slice(0, start)}${block}${existing.slice(end + MARKER_END.length)}`;
    }
  }
  return generated;
}
function insertBlocks(readme, blocks, theme = "auto") {
  if (blocks.length === 0) return readme;
  const extra = blocks.join("\n\n");
  const credit = creditFooter(theme);
  const at2 = readme.indexOf(credit);
  if (at2 !== -1) return `${readme.slice(0, at2)}${extra}

${readme.slice(at2)}`;
  const end = readme.lastIndexOf(MARKER_END);
  if (end !== -1) return `${readme.slice(0, end)}${extra}

${readme.slice(end)}`;
  return `${readme.trimEnd()}

${extra}
`;
}
function assetPath(base, variant) {
  return `${ASSET_DIR}/${base}-${variant}.svg`;
}
function pictureTag(base, theme, alt, width) {
  const altText = xmlEscape(alt);
  if (theme === "auto") {
    return [
      "<picture>",
      `  <source media="(prefers-color-scheme: dark)" srcset="${assetPath(base, "dark")}">`,
      `  <img alt="${altText}" src="${assetPath(base, "light")}" width="${width}">`,
      "</picture>"
    ].join("\n");
  }
  return `<img alt="${altText}" src="${assetPath(base, theme)}" width="${width}">`;
}
function staleAssets(existing, written) {
  const keep = new Set(written.map((path) => path.replace(/\\/g, "/")));
  const inFolder = new RegExp(`^${ASSET_DIR}/[^/]+\\.svg$`);
  return existing.map((path) => path.replace(/\\/g, "/")).filter((path) => inFolder.test(path) && !keep.has(path));
}

// ../core/src/themes.ts
var palettes = {
  dark: {
    bg: "#0d1117",
    panel: "#161b22",
    fg: "#e6edf3",
    muted: "#9198a1",
    accent: "#3fb950",
    accent2: "#58a6ff",
    border: "#30363d",
    track: "#21262d"
  },
  light: {
    bg: "#ffffff",
    panel: "#f6f8fa",
    fg: "#1f2328",
    muted: "#59636e",
    accent: "#1a7f37",
    accent2: "#0969da",
    border: "#d1d9e0",
    track: "#e6eaef"
  }
};
function variantsFor(theme) {
  return theme === "auto" ? ["dark", "light"] : [theme];
}

// ../core/src/templates/shared.ts
var FONT2 = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";
var FONT_SANS = "'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif";
var FONT_SERIF = "Georgia, 'Iowan Old Style', 'Palatino Linotype', 'Times New Roman', serif";
var SAFE_DATA_URI = /^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/;
function rise(markup, motion, delay) {
  if (!markup || !motion) return markup;
  return `<g class="rise" style="animation-delay:${delay.toFixed(2)}s">${markup}</g>`;
}
function motionCss(motion) {
  if (!motion) return "";
  return `.ln{animation:in .01s steps(1) both}
@keyframes in{from{opacity:0}to{opacity:1}}
.cursor{animation:blink 1.1s steps(1) infinite}
@keyframes blink{50%{opacity:0}}
@media (prefers-reduced-motion:reduce){.ln,.cursor{animation:none}}`;
}
function stagger(markup, motion, delay) {
  if (!markup || !motion) return markup;
  return `<g class="ln" style="animation-delay:${delay.toFixed(2)}s">${markup}</g>`;
}
function seeded2(text10) {
  let state = 2166136261;
  for (const char of text10) state = Math.imul(state ^ char.charCodeAt(0), 16777619) >>> 0;
  return () => {
    state = Math.imul(state ^ state >>> 15, 2246822507) >>> 0;
    state = Math.imul(state ^ state >>> 13, 3266489909) >>> 0;
    return ((state ^= state >>> 16) >>> 0) / 4294967296;
  };
}
function plural(count, noun) {
  return `${formatNumber(count)} ${noun}${count === 1 ? "" : "s"}`;
}
function describeProfile(profile, config, extra, options = {}) {
  const parts = [`${profile.name ?? profile.login} on GitHub`];
  if (extra) parts.push(extra);
  if (config.blocks.includes("stats")) {
    parts.push(
      `${formatNumber(profile.publicRepos)} repositories`,
      `${formatNumber(profile.totalStars)} stars`,
      `${formatNumber(profile.followers)} followers`
    );
  }
  const activity = profile.contributions;
  if (options.activity && config.blocks.includes("activity") && activity) {
    parts.push(
      `${formatNumber(activity.total)} contributions in the past year`,
      `a ${plural(activity.currentStreak, "day")} current streak`
    );
  }
  const languages = profile.languages.slice(0, 3).map((l) => l.name);
  if (config.blocks.includes("languages") && languages.length > 0) parts.push(`mostly ${languages.join(", ")}`);
  return parts.join(", ");
}
function imageReadme(profile, config, base, width, alt) {
  const website = safeUrl(profile.website);
  const links = [`[GitHub](<${profile.url}>)`];
  if (website) links.push(`[Website](<${website}>)`);
  const body = [
    `<div align="center">
${pictureTag(base, config.theme, alt, width)}
</div>`,
    `<div align="center">

${links.join(" \xB7 ")}

</div>`
  ];
  return wrapReadme(body.join("\n\n"), config);
}

// ../core/src/live/frame.ts
var CARD_WIDTH = 900;
var num = (value) => String(Math.round(value * 100) / 100 || 0);
function fontFamily(style) {
  return style.font === "mono" ? FONT2 : style.font === "serif" ? FONT_SERIF : FONT_SANS;
}
function baseCss(style) {
  return `text{font-family:${fontFamily(style)}}.mono{font-family:${FONT2}}`;
}
function cardBackground(style, height, seed) {
  const w = CARD_WIDTH;
  const id = "lv-bg";
  const defs = `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${style.bgTop}"/><stop offset="1" stop-color="${style.bgBottom}"/></linearGradient>`;
  let texture = "";
  if (style.texture === "stars" && style.variant === "dark") {
    const random = seeded2(`sky:${seed}`);
    texture = Array.from({ length: 60 }, () => {
      const x = random() * w;
      const y = random() * height;
      const r = 0.4 + random() * 1.1;
      return `<circle cx="${num(x)}" cy="${num(y)}" r="${num(r)}" fill="#ffffff" fill-opacity="${num(0.2 + random() * 0.55)}"/>`;
    }).join("");
  } else if (style.texture === "grid") {
    texture = `<pattern id="lv-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="${style.accent}" stroke-opacity="0.12"/></pattern><rect width="${w}" height="${height}" rx="${style.radius}" fill="url(#lv-grid)"/>`;
  } else if (style.texture === "lines") {
    texture = `<pattern id="lv-lines" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 5.500H6" stroke="${style.fg}" stroke-opacity="${style.variant === "dark" ? 0.05 : 0.06}"/></pattern><rect width="${w}" height="${height}" rx="${style.radius}" fill="url(#lv-lines)"/>`;
  }
  const markup = `<rect width="${w}" height="${height}" rx="${style.radius}" fill="url(#${id})"/>` + texture + `<rect x="0.5" y="0.5" width="${w - 1}" height="${height - 1}" rx="${style.radius}" fill="none" stroke="${style.border}"/>`;
  return { defs, markup };
}
function liveBadge(style, x, y, motion) {
  const dot = `<circle class="${motion ? "lv-live" : ""}" cx="${x}" cy="${y - 4}" r="3.500" fill="${style.accent}"/>`;
  return dot + `<text class="mono" x="${x + 10}" y="${y}" font-size="11" font-weight="700" letter-spacing="2" fill="${style.accent}">LIVE</text>`;
}
var LIVE_BADGE_CSS = `.lv-live{animation:lv-pulse 1.6s ease-in-out infinite}@keyframes lv-pulse{50%{opacity:.3}}`;
function label(style, text10, x, y, anchor = "start") {
  return `<text class="mono" x="${x}" y="${y}" text-anchor="${anchor}" font-size="11.500" font-weight="700" letter-spacing="2.400" fill="${style.accent}">${xmlEscape(text10)}</text>`;
}
function svgDocument(style, height, title, defs, css, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${height}" viewBox="0 0 ${CARD_WIDTH} ${height}" role="img" aria-labelledby="t">
<title id="t">${xmlEscape(title)}</title>
<defs>${defs}</defs>
<style>
${baseCss(style)}
${css}
</style>
${body}
</svg>
`;
}

// ../core/src/live/pieces.ts
var PIECE_BOX = 45;
var BASE = '<path d="M11 38.500v-3.500h23v3.500z"/>';
var SHAPES = {
  p: '<circle cx="22.5" cy="13" r="5.200"/><path d="M16.800 35c.3-6.500 2-9.800 5.700-13 3.700 3.200 5.400 6.500 5.700 13z"/><path d="M13.500 38.500v-3.500h18v3.500z"/>',
  r: BASE + '<path d="M14 35V20h17v15z"/><path d="M12.500 20v-9.500h4.200v3h3.800v-3h4v3h3.800v-3h4.200V20z"/>',
  n: BASE + '<path d="M13 35c0-8.500 3.500-14 8.500-17.500-2.400-.2-4.500.4-6.200 2l-2.800-3.200c1.600-4.800 5.400-7.800 9.800-9l.9-3.100 3.300 2.900c6.200 1.100 10 6.500 10 15.400V35z"/>',
  b: '<circle cx="22.500" cy="7.500" r="2.800"/><path d="M22.500 11c-5.200 3.800-8.200 8-8.200 12.500 0 3 1.500 5.200 4.200 6.800-.6 1.800-.9 3.500-.9 4.700h9.800c0-1.200-.3-2.900-.9-4.700 2.700-1.600 4.200-3.800 4.200-6.800 0-4.500-3-8.700-8.200-12.500z"/><path d="M11 38.500v-3.500h23v3.500z"/>',
  q: BASE + '<path d="M12 35l-3-17.500 6.500 7 3.500-12 3.500 12 3.500-12 3.500 12 6.500-7-3 17.500z"/><circle cx="9" cy="16" r="2.200"/><circle cx="16" cy="10.500" r="2.200"/><circle cx="22.500" cy="8.500" r="2.200"/><circle cx="29" cy="10.500" r="2.200"/><circle cx="36" cy="16" r="2.200"/>',
  k: BASE + '<path d="M13.500 35c0-8.500 3-12.500 9-15.500 6 3 9 7 9 15.500z"/><path d="M22.500 4v9M18.200 8.200h8.600" fill="none" stroke-width="2.600" stroke-linecap="round"/><path d="M15 21h15v4H15z"/>'
};
var DETAILS = {
  n: '<circle cx="20.500" cy="14.500" r="1.500" stroke="none"/>',
  b: '<path d="M19.300 18.800h6.400M22.500 15.600v6.400" fill="none" stroke-width="1.600" stroke-linecap="round"/>'
};
function pieceMarkup(type, look, size) {
  const scale = size / PIECE_BOX;
  const halo = look.mode === "glow" ? ` filter="url(#chs-glow)"` : "";
  const fill = look.mode === "outline" ? look.fill : look.fill;
  return `<g transform="scale(${Math.round(scale * 1e3) / 1e3})"${halo} fill="${fill}" stroke="${look.stroke}" stroke-width="1.500" stroke-linejoin="round">` + SHAPES[type] + `<g fill="${look.stroke}" stroke="${look.stroke}">${DETAILS[type] ?? ""}</g></g>`;
}

// ../core/src/live/replay.ts
var import_chess = __toESM(require_chess(), 1);
var FILES = "abcdefgh";
function replayGame(sans2, ply, animate) {
  const total = Math.max(0, Math.min(ply, sans2.length));
  const shown = Math.max(0, Math.min(animate, total));
  const chess = new import_chess.Chess();
  for (let i = 0; i < total - shown; i++) chess.move(sans2[i]);
  const pieces = [];
  const onSquare = /* @__PURE__ */ new Map();
  for (const row of chess.board()) {
    for (const cell2 of row) {
      if (!cell2) continue;
      const track = {
        id: `${cell2.color}${cell2.type}${cell2.square}`,
        type: cell2.type,
        color: cell2.color,
        start: cell2.square,
        end: cell2.square,
        steps: []
      };
      pieces.push(track);
      onSquare.set(cell2.square, track);
    }
  }
  const moves2 = [];
  for (let i = 0; i < shown; i++) {
    const halfMove = total - shown + i;
    const move = chess.move(sans2[halfMove]);
    moves2.push({ san: move.san, from: move.from, to: move.to, color: move.color, number: Math.floor(halfMove / 2) + 1 });
    const mover = onSquare.get(move.from);
    if (!mover) throw new Error(`No piece on ${move.from} for ${move.san}`);
    if (move.captured) {
      const takenSquare = move.flags.includes("e") ? `${move.to[0]}${move.from[1]}` : move.to;
      const taken = onSquare.get(takenSquare);
      if (taken) {
        taken.end = null;
        taken.steps.push({ at: i, square: null });
        onSquare.delete(takenSquare);
      }
    }
    onSquare.delete(move.from);
    mover.end = move.to;
    mover.steps.push({ at: i, square: move.to });
    onSquare.set(move.to, mover);
    if (move.flags.includes("k") || move.flags.includes("q")) {
      const rank = move.from[1];
      const rookFrom = `${move.flags.includes("k") ? "h" : "a"}${rank}`;
      const rookTo = `${move.flags.includes("k") ? "f" : "d"}${rank}`;
      const rook = onSquare.get(rookFrom);
      if (rook) {
        onSquare.delete(rookFrom);
        rook.end = rookTo;
        rook.steps.push({ at: i, square: rookTo });
        onSquare.set(rookTo, rook);
      }
    }
    if (move.promotion) {
      mover.end = null;
      mover.steps.push({ at: i, square: null });
      const promoted = {
        id: `${move.color}${move.promotion}${move.to}-promoted-${i}`,
        type: move.promotion,
        color: move.color,
        start: null,
        end: move.to,
        steps: [{ at: i, square: move.to, appears: true }]
      };
      pieces.push(promoted);
      onSquare.set(move.to, promoted);
    }
  }
  return {
    pieces,
    moves: moves2,
    turn: chess.turn(),
    check: chess.isCheck(),
    checkmate: chess.isCheckmate(),
    fen: chess.fen()
  };
}
function squareIndex(square) {
  return { file: FILES.indexOf(square[0]), rank: Number(square[1]) - 1 };
}

// ../core/src/live/games.ts
var moves = (text10) => text10.split(" ");
var GAMES = [
  {
    id: "opera",
    title: "The Opera Game",
    white: "Paul Morphy",
    black: "Duke Karl of Brunswick and Count Isouard",
    place: "Paris",
    year: "1858",
    result: "1-0",
    moves: moves(
      "e4 e5 Nf3 d6 d4 Bg4 dxe5 Bxf3 Qxf3 dxe5 Bc4 Nf6 Qb3 Qe7 Nc3 c6 Bg5 b5 Nxb5 cxb5 Bxb5+ Nbd7 O-O-O Rd8 Rxd7 Rxd7 Rd1 Qe6 Bxd7+ Nxd7 Qb8+ Nxb8 Rd8#"
    )
  },
  {
    id: "immortal",
    title: "The Immortal Game",
    white: "Adolf Anderssen",
    black: "Lionel Kieseritzky",
    place: "London",
    year: "1851",
    result: "1-0",
    moves: moves(
      "e4 e5 f4 exf4 Bc4 Qh4+ Kf1 b5 Bxb5 Nf6 Nf3 Qh6 d3 Nh5 Nh4 Qg5 Nf5 c6 g4 Nf6 Rg1 cxb5 h4 Qg6 h5 Qg5 Qf3 Ng8 Bxf4 Qf6 Nc3 Bc5 Nd5 Qxb2 Bd6 Bxg1 e5 Qxa1+ Ke2 Na6 Nxg7+ Kd8 Qf6+ Nxf6 Be7#"
    )
  },
  {
    id: "evergreen",
    title: "The Evergreen Game",
    white: "Adolf Anderssen",
    black: "Jean Dufresne",
    place: "Berlin",
    year: "1852",
    result: "1-0",
    moves: moves(
      "e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4 c3 Ba5 d4 exd4 O-O d3 Qb3 Qf6 e5 Qg6 Re1 Nge7 Ba3 b5 Qxb5 Rb8 Qa4 Bb6 Nbd2 Bb7 Ne4 Qf5 Bxd3 Qh5 Nf6+ gxf6 exf6 Rg8 Rad1 Qxf3 Rxe7+ Nxe7 Qxd7+ Kxd7 Bf5+ Ke8 Bd7+ Kf8 Bxe7#"
    )
  },
  {
    id: "century",
    title: "The Game of the Century",
    white: "Donald Byrne",
    black: "Bobby Fischer",
    place: "New York",
    year: "1956",
    result: "0-1",
    moves: moves(
      "Nf3 Nf6 c4 g6 Nc3 Bg7 d4 O-O Bf4 d5 Qb3 dxc4 Qxc4 c6 e4 Nbd7 Rd1 Nb6 Qc5 Bg4 Bg5 Na4 Qa3 Nxc3 bxc3 Nxe4 Bxe7 Qb6 Bc4 Nxc3 Bc5 Rfe8+ Kf1 Be6 Bxb6 Bxc4+ Kg1 Ne2+ Kf1 Nxd4+ Kg1 Ne2+ Kf1 Nc3+ Kg1 axb6 Qb4 Ra4 Qxb6 Nxd1 h3 Rxa2 Kh2 Nxf2 Re1 Rxe1 Qd8+ Bf8 Nxe1 Bd5 Nf3 Ne4 Qb8 b5 h4 h5 Ne5 Kg7 Kg1 Bc5+ Kf1 Ng3+ Ke1 Bb4+ Kd1 Bb3+ Kc1 Ne2+ Kb1 Nc3+ Kc1 Rc2#"
    )
  },
  {
    id: "legal",
    title: "L\xE9gal\u2019s Mate",
    white: "Sire de L\xE9gal",
    black: "Saint Brie",
    place: "Paris",
    year: "c. 1750",
    result: "1-0",
    moves: moves("e4 e5 Nf3 d6 Bc4 Bg4 Nc3 g6 Nxe5 Bxd1 Bxf7+ Ke7 Nd5#")
  }
];

// ../core/src/live/schedule.ts
var PLIES_PER_DAY = 2;
var PAUSE_PLIES = 6;
function dayNumber2(iso) {
  const time = Date.parse(iso);
  return Number.isFinite(time) ? Math.floor(time / 864e5) : 0;
}
function playlistFor(login, games = GAMES) {
  const random = seeded2(`chess:${login.toLowerCase()}`);
  const order = [...games];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}
function startOffset(login, cycle) {
  return Math.floor(seeded2(`start:${login.toLowerCase()}`)() * cycle);
}
function scheduleGame(login, nowIso, games = GAMES) {
  const order = playlistFor(login, games);
  const lengths = order.map((game) => game.moves.length + PAUSE_PLIES);
  const cycle = lengths.reduce((sum, n) => sum + n, 0);
  const tick = dayNumber2(nowIso) * PLIES_PER_DAY + startOffset(login, cycle);
  let position = (tick % cycle + cycle) % cycle;
  for (let index = 0; index < order.length; index++) {
    const game = order[index];
    const length = lengths[index];
    if (position < length) {
      const ply = Math.min(position, game.moves.length);
      return { game, ply, finished: position >= game.moves.length, index };
    }
    position -= length;
  }
  return { game: order[0], ply: 0, finished: false, index: 0 };
}

// ../core/src/live/chess.ts
var PAD = 44;
var SQ = 48;
var BOARD = SQ * 8;
var FRAME = 16;
var OUTER = BOARD + FRAME * 2;
var HEIGHT2 = OUTER + 68;
var ANIMATED_PLIES = 4;
var MOVE_SECONDS = 1.6;
var HOLD_SECONDS = 4.2;
var FILE_NAMES = "abcdefgh";
function recentMoveLines(sans2, ply, plies = 6) {
  const upTo = Math.max(0, Math.min(ply, sans2.length));
  const from = Math.max(0, upTo - plies);
  const lines = [];
  for (let i = from; i < upTo; i++) {
    const number = Math.floor(i / 2) + 1;
    const white = i % 2 === 0;
    if (white) lines.push(`${number}. ${sans2[i]}`);
    else if (lines.length > 0 && lines[lines.length - 1].startsWith(`${number}. `)) lines[lines.length - 1] += ` ${sans2[i]}`;
    else lines.push(`${number}... ${sans2[i]}`);
  }
  return lines;
}
function statusText(state, replay) {
  const { game, ply, finished } = state;
  if (finished) {
    const winner = game.result === "1-0" ? "White" : "Black";
    return `Checkmate. ${winner} wins, ${game.result.replace("-", "\u2013")}`;
  }
  if (ply === 0) return "A new game is about to begin";
  const number = Math.floor(ply / 2) + 1;
  const side = replay.turn === "w" ? "White" : "Black";
  return `Move ${number}, ${side} to play${replay.check ? ", check" : ""}`;
}
function squareXY(square, bx, by) {
  const { file, rank } = squareIndex(square);
  return { x: bx + file * SQ, y: by + (7 - rank) * SQ };
}
function pieceTimeline(track, bx, by, moveSeconds = MOVE_SECONDS) {
  const eps = 0.02;
  const first = track.start ? squareXY(track.start, bx, by) : squareXY(track.steps[0]?.square ?? "a1", bx, by);
  let at2 = { x: first.x, y: first.y };
  let seen = track.start ? 1 : 0;
  const stops = [{ t: 0, ...at2, o: seen }];
  for (const step of track.steps) {
    const leave = step.at * moveSeconds + moveSeconds * 0.1;
    const arrive = step.at * moveSeconds + moveSeconds * 0.75;
    if (step.appears && step.square) {
      at2 = squareXY(step.square, bx, by);
      stops.push({ t: arrive - eps, ...at2, o: 0 }, { t: arrive, ...at2, o: 1 });
      seen = 1;
    } else if (step.square) {
      const next = squareXY(step.square, bx, by);
      stops.push({ t: leave, ...at2, o: seen }, { t: arrive, ...next, o: seen });
      at2 = next;
    } else {
      stops.push({ t: arrive, ...at2, o: seen }, { t: arrive + eps, ...at2, o: 0 });
      seen = 0;
    }
  }
  return stops;
}
function liveState(login, nowIso, pinned) {
  const state = pinned ?? scheduleGame(login, nowIso);
  const replay = replayGame(state.game.moves, state.ply, ANIMATED_PLIES);
  return { state, replay };
}
function renderChess(opts) {
  const { style, motion } = opts;
  const { state, replay } = liveState(opts.login, opts.nowIso, opts.state);
  const { game } = state;
  const chess = style.chess;
  const bx = CARD_WIDTH - PAD - OUTER + FRAME;
  const by = (HEIGHT2 - OUTER) / 2 + FRAME;
  const bg = cardBackground(style, HEIGHT2, opts.login);
  let board2 = `<rect x="${bx - FRAME}" y="${by - FRAME}" width="${OUTER}" height="${OUTER}" rx="${chess.frame === "terminal" || chess.frame === "blueprint" ? 4 : 14}" fill="${chess.frameFill}" stroke="${chess.frameStroke}" stroke-width="${chess.frame === "wood" ? 2.5 : 1.5}"${chess.frame === "chalk" ? ' stroke-dasharray="7 5"' : ""}/>`;
  if (chess.frame === "glass") {
    board2 += `<rect x="${bx - FRAME + 5}" y="${by - FRAME + 5}" width="${OUTER - 10}" height="${OUTER - 10}" rx="10" fill="none" stroke="${chess.frameStroke}" stroke-opacity="0.45"/>`;
  }
  for (let file = 0; file < 8; file++) {
    for (let rank = 0; rank < 8; rank++) {
      const dark = (file + rank) % 2 === 0;
      board2 += `<rect x="${bx + file * SQ}" y="${by + (7 - rank) * SQ}" width="${SQ}" height="${SQ}" fill="${dark ? chess.dark : chess.light}"/>`;
    }
  }
  const last = replay.moves[replay.moves.length - 1];
  if (last) {
    for (const square of [last.from, last.to]) {
      const p = squareXY(square, bx, by);
      board2 += `<rect x="${p.x}" y="${p.y}" width="${SQ}" height="${SQ}" fill="${chess.highlight}" fill-opacity="0.32"/>`;
    }
  }
  for (let i = 0; i < 8; i++) {
    board2 += `<text class="mono" x="${bx + i * SQ + SQ / 2}" y="${by + BOARD + 12}" text-anchor="middle" font-size="10" font-weight="700" fill="${chess.coord}">${FILE_NAMES[i]}</text><text class="mono" x="${bx - 8}" y="${by + (7 - i) * SQ + SQ / 2 + 3.5}" text-anchor="middle" font-size="10" font-weight="700" fill="${chess.coord}">${i + 1}</text>`;
  }
  const animate = motion && replay.moves.length > 0;
  const total = replay.moves.length * MOVE_SECONDS + HOLD_SECONDS;
  let keyframes = "";
  let pieces = "";
  replay.pieces.forEach((track, index) => {
    const rest = track.end ?? track.steps.filter((s) => s.square).pop()?.square ?? track.start;
    if (!rest) return;
    const p = squareXY(rest, bx, by);
    const look = { ...track.color === "w" ? chess.white : chess.black, mode: chess.pieces };
    const body = pieceMarkup(track.type, look, SQ);
    const visible = track.end ? "" : ' opacity="0"';
    const moves2 = track.steps.length > 0 && animate;
    let style_ = "";
    let cls = "";
    if (moves2) {
      const stops = pieceTimeline(track, bx, by);
      stops.push({ ...stops[stops.length - 1], t: total });
      const frames = stops.map((s) => `${num(s.t / total * 100)}%{transform:translate(${num(s.x)}px,${num(s.y)}px);opacity:${s.o}}`).join("");
      keyframes += `@keyframes chs-m${index}{${frames}}`;
      cls = ' class="chs-a"';
      style_ = ` style="animation:chs-m${index} ${num(total)}s linear infinite"`;
    }
    pieces += `<g${cls}${style_} transform="translate(${p.x} ${p.y})"${visible}>${body}</g>`;
  });
  const loopFade = animate ? ` class="chs-pieces" style="animation:chs-loop ${num(total)}s linear infinite"` : "";
  board2 += `<g${loopFade}>${pieces}</g>`;
  const css = (motion ? LIVE_BADGE_CSS : "") + (animate ? `@keyframes chs-loop{0%{opacity:0}4%,93%{opacity:1}100%{opacity:0}}${keyframes}@media (prefers-reduced-motion:reduce){.lv-live,.chs-pieces,.chs-a{animation:none!important}}` : "");
  const lines = recentMoveLines(game.moves, state.ply, 6);
  let text10 = liveBadge(style, PAD, 52, motion) + label(style, state.finished ? "CHESS, FINAL POSITION" : "CHESS, A GAME IN PROGRESS", PAD, 92);
  text10 += `<text x="${PAD}" y="134" font-size="28" font-weight="800" fill="${style.fg}">${xmlEscape(truncate(game.title, 26))}</text>`;
  const players = [`White: ${game.white}`, `Black: ${game.black}`].flatMap((line) => wrap(line, 40, 2));
  players.forEach((line, i) => {
    text10 += `<text x="${PAD}" y="${164 + i * 20}" font-size="14" fill="${style.muted}">${xmlEscape(line)}</text>`;
  });
  const afterPlayers = 164 + players.length * 20;
  text10 += `<text class="mono" x="${PAD}" y="${afterPlayers + 6}" font-size="12.500" fill="${style.muted}">${xmlEscape(`${game.place}, ${game.year}`)}</text>`;
  text10 += `<text x="${PAD}" y="${afterPlayers + 42}" font-size="16.500" font-weight="700" fill="${style.fg}">${xmlEscape(statusText(state, replay))}</text>`;
  const movesY = afterPlayers + 84;
  if (lines.length > 0) {
    text10 += label(style, "LATEST MOVES", PAD, movesY);
    lines.slice(-3).forEach((line, i) => {
      text10 += `<text class="mono" x="${PAD}" y="${movesY + 24 + i * 22}" font-size="14" fill="${style.fg}">${xmlEscape(line)}</text>`;
    });
  }
  text10 += `<text class="mono" x="${PAD}" y="${HEIGHT2 - 30}" font-size="11.500" fill="${style.muted}">two moves a day, played automatically</text>`;
  const glow = chess.pieces === "glow" ? `<filter id="chs-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.800" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` : "";
  const title = `A live chess game: ${game.title}, ${game.white} against ${game.black}, ${game.place} ${game.year}. ${statusText(state, replay)}.`;
  return svgDocument(style, HEIGHT2, title, bg.defs + glow, css, bg.markup + text10 + board2);
}

// ../core/src/templates/city.ts
var WIDTH = 900;
var PAD2 = 36;
var COS = Math.cos(Math.PI / 6);
var SIN = 0.5;
var ROWS = 7;
var MAX_CELL = 14;
var MAX_HEIGHT = 120;
var MIN_HEIGHT = 4;
var GAP = 0.14;
var SLAB_DEPTH = 10;
var SLAB_MARGIN = 0.45;
var FLAG_ROOM = 46;
var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function layoutCity(days) {
  if (days.length === 0) return { cols: 0, buildings: [] };
  const first = (/* @__PURE__ */ new Date(`${days[0]?.date}T00:00:00Z`)).getUTCDay();
  const cols = Math.ceil((first + days.length) / ROWS);
  const peak = Math.max(...days.map((day) => day.count), 1);
  const buildings = [];
  days.forEach((day, index) => {
    if (day.count <= 0) return;
    buildings.push({
      col: Math.floor((first + index) / ROWS),
      row: (first + index) % ROWS,
      count: day.count,
      level: day.level,
      date: day.date,
      // Square-root scaling keeps quiet days visible next to a very busy one.
      height: MIN_HEIGHT + Math.sqrt(day.count / peak) * (MAX_HEIGHT - MIN_HEIGHT)
    });
  });
  buildings.sort((a, b) => a.col + a.row - (b.col + b.row) || a.col - b.col);
  return { cols, buildings };
}
var num2 = (value) => String(Math.round(value * 10) / 10 || 0);
function shortDate(date) {
  const [, month, day] = date.split("-");
  return `${MONTHS[Number(month) - 1] ?? ""} ${Number(day)}`.trim();
}
function lookFor(variant, hue) {
  const dark = variant === "dark";
  const faces = [1, 2, 3, 4].map((level) => {
    const t = level / 4;
    const lightness = dark ? 0.3 + 0.34 * t : 0.72 - 0.34 * t;
    return {
      top: hslToHex(hue, 0.74, lightness),
      left: hslToHex(hue, 0.7, lightness - 0.08),
      right: hslToHex(hue, 0.66, lightness - 0.17)
    };
  });
  const peakHue = (hue + 42) % 360;
  const peakL = dark ? 0.68 : 0.46;
  return {
    skyTop: dark ? hslToHex(hue, 0.5, 0.07) : hslToHex(hue, 0.6, 0.95),
    skyBottom: dark ? hslToHex((hue + 22) % 360, 0.5, 0.17) : hslToHex((hue + 24) % 360, 0.75, 0.86),
    slabTop: dark ? hslToHex(hue, 0.3, 0.15) : hslToHex(hue, 0.25, 0.93),
    slabSide: dark ? hslToHex(hue, 0.3, 0.09) : hslToHex(hue, 0.2, 0.8),
    slabLine: dark ? hslToHex(hue, 0.4, 0.32) : hslToHex(hue, 0.3, 0.7),
    fg: dark ? "#eef0ff" : "#1d2140",
    muted: dark ? "#9aa0c8" : "#5b6190",
    glow: hslToHex(hue, 0.85, dark ? 0.5 : 0.7),
    faces,
    peak: {
      top: hslToHex(peakHue, 0.85, peakL),
      left: hslToHex(peakHue, 0.8, peakL - 0.08),
      right: hslToHex(peakHue, 0.75, peakL - 0.17)
    }
  };
}
function renderSvg(profile, config, variant) {
  const look = lookFor(variant, hueOf(profile.avatar?.grid.tint) ?? 215);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const parts = [];
  let step = 0;
  const next = () => step++ * 0.1;
  const uri = profile.avatar?.dataUri;
  const hasPhoto = Boolean(uri && SAFE_DATA_URI.test(uri));
  const textX = hasPhoto ? PAD2 + 64 : PAD2;
  const subline2 = [
    profile.name ? `@${profile.login}` : "",
    config.text.headline ? truncate(config.text.headline, 46) : ""
  ].filter(Boolean);
  let header = "";
  if (hasPhoto && uri) {
    header += `<clipPath id="face"><circle cx="${PAD2 + 24}" cy="${PAD2 + 24}" r="24"/></clipPath><image href="${uri}" x="${PAD2}" y="${PAD2}" width="48" height="48" preserveAspectRatio="xMidYMid slice" clip-path="url(#face)"/><circle cx="${PAD2 + 24}" cy="${PAD2 + 24}" r="26" fill="none" stroke="${look.glow}" stroke-width="2"/>`;
  }
  header += `<text x="${textX}" y="${PAD2 + 24}" font-size="28" font-weight="800" fill="${look.fg}">${xmlEscape(truncate(profile.name ?? profile.login, 26))}</text>`;
  if (subline2.length > 0) {
    header += `<text x="${textX}" y="${PAD2 + 46}" font-size="14" fill="${look.muted}">${xmlEscape(subline2.join("  \xB7  "))}</text>`;
  }
  if (blocks.has("stats")) {
    const stats = [
      [formatNumber(profile.publicRepos), "REPOS"],
      [formatNumber(profile.totalStars), "STARS"],
      [formatNumber(profile.followers), "FOLLOWERS"]
    ];
    stats.forEach(([value, caption], index) => {
      const x = WIDTH - PAD2 - (stats.length - 1 - index) * 104;
      header += `<text x="${x}" y="${PAD2 + 22}" text-anchor="end" font-size="22" font-weight="800" fill="${look.fg}">${xmlEscape(value)}</text><text class="mono" x="${x}" y="${PAD2 + 40}" text-anchor="end" font-size="10" letter-spacing="1.2" fill="${look.muted}">${caption}</text>`;
    });
  }
  parts.push(rise(header, motion, next()));
  let cursor = PAD2 + 64;
  const wantsCity = blocks.has("activity");
  const activity = profile.contributions;
  const { cols, buildings } = layoutCity(activity?.days ?? []);
  if (wantsCity && activity && cols > 0) {
    const m = SLAB_MARGIN;
    const size = Math.min(MAX_CELL, (WIDTH - PAD2 * 2 - 8) / ((cols + ROWS + 2 * m) * COS));
    const ox = WIDTH / 2 - (cols - ROWS) / 2 * COS * size;
    const peak = buildings.length > 0 ? buildings.reduce((best, b) => b.count > best.count || b.count === best.count && b.date > best.date ? b : best, buildings[0]) : void 0;
    const rawY = (u, v, z = 0) => (u + v) * SIN * size - z;
    let reach = rawY(-m, -m);
    for (const b of buildings) reach = Math.min(reach, rawY(b.col + GAP, b.row + GAP, b.height));
    if (peak) reach = Math.min(reach, rawY(peak.col + 0.5, peak.row + 0.5, peak.height) - FLAG_ROOM);
    const oy = cursor + 6 - reach;
    const at2 = (u, v, z = 0) => [ox + (u - v) * COS * size, oy + rawY(u, v, z)];
    const poly = (points) => `M${points.map(([x, y]) => `${num2(x)} ${num2(y)}`).join("L")}Z`;
    const slabTop = poly([at2(-m, -m), at2(cols + m, -m), at2(cols + m, ROWS + m), at2(-m, ROWS + m)]);
    const leftSide = poly([at2(-m, ROWS + m), at2(cols + m, ROWS + m), at2(cols + m, ROWS + m, -SLAB_DEPTH), at2(-m, ROWS + m, -SLAB_DEPTH)]);
    const rightSide = poly([at2(cols + m, -m), at2(cols + m, ROWS + m), at2(cols + m, ROWS + m, -SLAB_DEPTH), at2(cols + m, -m, -SLAB_DEPTH)]);
    const streets = [];
    for (let u = 0; u <= cols; u++) streets.push(`M${num2(at2(u, 0)[0])} ${num2(at2(u, 0)[1])}L${num2(at2(u, ROWS)[0])} ${num2(at2(u, ROWS)[1])}`);
    for (let v = 0; v <= ROWS; v++) streets.push(`M${num2(at2(0, v)[0])} ${num2(at2(0, v)[1])}L${num2(at2(cols, v)[0])} ${num2(at2(cols, v)[1])}`);
    const towers = buildings.map((b) => {
      const u0 = b.col + GAP;
      const u1 = b.col + 1 - GAP;
      const v0 = b.row + GAP;
      const v1 = b.row + 1 - GAP;
      const h = b.height;
      const cls = b === peak ? "p" : String(Math.min(4, Math.max(1, b.level || 1)));
      const delay = motion ? ` style="animation-delay:${(0.2 + (b.col + b.row) * 0.011).toFixed(3)}s"` : "";
      return `<g class="b"${delay}><path class="l${cls}" d="${poly([at2(u0, v1), at2(u1, v1), at2(u1, v1, h), at2(u0, v1, h)])}"/><path class="r${cls}" d="${poly([at2(u1, v0), at2(u1, v1), at2(u1, v1, h), at2(u1, v0, h)])}"/><path class="t${cls}" d="${poly([at2(u0, v0, h), at2(u1, v0, h), at2(u1, v1, h), at2(u0, v1, h)])}"/></g>`;
    }).join("");
    let flag = "";
    if (peak) {
      const [px, py] = at2(peak.col + 0.5, peak.row + 0.5, peak.height);
      const labelX = Math.min(WIDTH - PAD2 - 70, Math.max(PAD2 + 70, px));
      flag = `<path d="M${num2(px)} ${num2(py - 3)}L${num2(px)} ${num2(py - 24)}" stroke="${look.fg}" stroke-opacity="0.6"/><text class="mono" x="${num2(labelX)}" y="${num2(py - 30)}" text-anchor="middle" font-size="12" font-weight="700" fill="${look.fg}">${xmlEscape(shortDate(peak.date))}: ${xmlEscape(formatNumber(peak.count))}</text>`;
    }
    const cityMarkup = `<path d="${slabTop}" fill="${look.slabTop}"/><path d="${leftSide}" fill="${look.slabSide}"/><path d="${rightSide}" fill="${look.slabSide}" fill-opacity="0.75"/><path d="${streets.join("")}" fill="none" stroke="${look.slabLine}" stroke-opacity="0.35" stroke-width="0.6"/>` + towers + flag;
    parts.push(rise(cityMarkup, motion, next()));
    cursor = at2(cols + m, ROWS + m, -SLAB_DEPTH)[1] + 30;
    const month = busiestMonth(activity.days);
    const captions = [
      [`${formatNumber(activity.total)} contributions in the past year`, plural(activity.activeDays, "active day")],
      [`current streak ${plural(activity.currentStreak, "day")}`, `longest ${plural(activity.longestStreak, "day")}`, month ? `busiest month ${month.name}` : null]
    ].map((items) => items.filter((v) => Boolean(v)).join("  \xB7  "));
    const lines = captions.map(
      (line, index) => `<text class="mono" x="${WIDTH / 2}" y="${num2(cursor + index * 20)}" text-anchor="middle" font-size="12.5" fill="${look.muted}">${xmlEscape(truncate(line, 80))}</text>`
    ).join("");
    parts.push(rise(lines, motion, next()));
    cursor += 20 + 26;
  } else if (wantsCity) {
    const top = cursor + 20;
    const note = `<rect x="${PAD2}" y="${top}" width="${WIDTH - PAD2 * 2}" height="150" rx="16" fill="${look.slabTop}" stroke="${look.slabLine}" stroke-opacity="0.5"/><text x="${WIDTH / 2}" y="${top + 70}" text-anchor="middle" font-size="16" font-weight="700" fill="${look.fg}">Your contribution city appears here</text><text x="${WIDTH / 2}" y="${top + 96}" text-anchor="middle" font-size="13" fill="${look.muted}">It is built from GitHub activity, which is added at your first automatic update.</text>`;
    parts.push(rise(note, motion, next()));
    cursor = top + 150 + 28;
  }
  const footer = [];
  if (blocks.has("languages") && profile.languages.length > 0) {
    footer.push(
      `<text class="mono" x="${PAD2}" y="${num2(cursor)}" font-size="12.5" fill="${look.muted}">written in  <tspan fill="${look.fg}">${xmlEscape(profile.languages.slice(0, 4).map((l) => `${truncate(l.name, 14)} ${l.percent}%`).join("   "))}</tspan></text>`
    );
    cursor += 24;
  }
  if (blocks.has("projects") && profile.topRepos.length > 0) {
    const names = profile.topRepos.slice(0, 3).map((r) => `\u2605 ${formatNumber(r.stars)} ${truncate(r.name, 22)}`).join("    ");
    footer.push(
      `<text class="mono" x="${PAD2}" y="${num2(cursor)}" font-size="12.5" fill="${look.muted}">top projects  <tspan fill="${look.fg}">${xmlEscape(truncate(names, 90))}</tspan></text>`
    );
    cursor += 24;
  }
  if (footer.length > 0) parts.push(rise(footer.join(""), motion, next()));
  const height = Math.ceil(cursor + PAD2 - 14);
  const random = seeded2(profile.login);
  const stars3 = variant === "dark" ? Array.from({ length: 46 }, () => {
    const x = random() * WIDTH;
    const y = random() * Math.min(height * 0.55, 330);
    const r = 0.5 + random() * 1.1;
    const o = 0.25 + random() * 0.55;
    return `<circle cx="${num2(x)}" cy="${num2(y)}" r="${num2(r)}" fill="#ffffff" fill-opacity="${num2(o)}"/>`;
  }).join("") : "";
  const faceCss = look.faces.map((f, i) => `.t${i + 1}{fill:${f.top}}.l${i + 1}{fill:${f.left}}.r${i + 1}{fill:${f.right}}`).join("") + `.tp{fill:${look.peak.top}}.lp{fill:${look.peak.left}}.rp{fill:${look.peak.right}}`;
  const motionCss2 = motion ? `.rise{animation:rise .6s ease both}
@keyframes rise{from{opacity:0}}
.b{transform-box:fill-box;transform-origin:50% 100%;animation:grow .8s cubic-bezier(.2,.8,.2,1) both}
@keyframes grow{from{transform:scaleY(0)}}
@media (prefers-reduced-motion:reduce){.rise,.b{animation:none}}` : "";
  const title = `${profile.name ?? profile.login} (@${profile.login}) on GitHub`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" role="img" aria-labelledby="t">
<title id="t">${xmlEscape(title)}</title>
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${look.skyTop}"/><stop offset="1" stop-color="${look.skyBottom}"/></linearGradient>
<radialGradient id="glow" cx="0.5" cy="1.05" r="0.75"><stop offset="0" stop-color="${look.glow}" stop-opacity="${variant === "dark" ? 0.3 : 0.22}"/><stop offset="1" stop-color="${look.glow}" stop-opacity="0"/></radialGradient>
</defs>
<style>
text{font-family:${FONT_SANS}}
.mono{font-family:${FONT2}}
${faceCss}
${motionCss2}
</style>
<rect width="${WIDTH}" height="${height}" rx="20" fill="url(#sky)"/>
${stars3}
<rect width="${WIDTH}" height="${height}" rx="20" fill="url(#glow)"/>
${parts.filter(Boolean).join("\n")}
</svg>
`;
}
var city = {
  id: "city",
  name: "Contribution city",
  description: "Every day of your past year as a building in an isometric city, taller on busier days, under your own sky.",
  tags: ["image", "isometric", "3d", "activity", "animated"],
  needsAvatar: true,
  render(profile, config) {
    const assets = variantsFor(config.theme).map((variant) => ({
      path: assetPath("city", variant),
      content: renderSvg(profile, config, variant)
    }));
    const drawn = config.blocks.includes("activity") && profile.contributions && profile.contributions.days.length > 0;
    const extra = drawn ? "an isometric city with one building for each active day, taller on busier days" : void 0;
    return { readme: imageReadme(profile, config, "city", WIDTH, describeProfile(profile, config, extra, { activity: true })), assets };
  }
};

// ../core/src/live/timelapse.ts
var TIMELAPSE_SECONDS = 18;
var BUILD_START = 3;
var BUILD_END = 84;
var HOLD_UNTIL = 94;
var RISE = 1.6;
var MONTH_NAMES2 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function at(index, count) {
  return count <= 1 ? BUILD_START : BUILD_START + (BUILD_END - BUILD_START) * index / (count - 1);
}
function planTimelapse(days, columnOf) {
  const columns = /* @__PURE__ */ new Map();
  const monthsByKey = /* @__PURE__ */ new Map();
  let running = 0;
  days.forEach((day, index) => {
    const column = columnOf(day.date);
    if (column !== void 0 && !columns.has(column)) columns.set(column, at(index, days.length));
    running += day.count;
    const key = day.date.slice(0, 7);
    const existing = monthsByKey.get(key);
    if (existing) existing.total = running;
    else {
      const [year, month] = key.split("-");
      monthsByKey.set(key, { label: `${MONTH_NAMES2[Number(month) - 1] ?? ""} ${year}`, first: index, total: running });
    }
  });
  const list = [...monthsByKey.values()];
  const months = list.map((m, i) => ({
    label: m.label,
    total: m.total,
    from: i === 0 ? 0 : at(m.first, days.length),
    to: i === list.length - 1 ? HOLD_UNTIL : at(list[i + 1].first, days.length)
  }));
  return { columns, months };
}
var pct = (value) => String(Math.round(value * 100) / 100);
function timelapseCss(plan, peakAt) {
  const t = `${TIMELAPSE_SECONDS}s`;
  let css = `.tl-fade{animation:tl-fade ${t} linear infinite both}@keyframes tl-fade{0%,${HOLD_UNTIL}%{opacity:1}99%,100%{opacity:0}}`;
  for (const [column, start] of plan.columns) {
    css += `.tl${column}{transform-box:fill-box;transform-origin:50% 100%;animation:tl${column} ${t} linear infinite both}`;
    css += `@keyframes tl${column}{0%,${pct(start)}%{transform:scaleY(0)}${pct(start + RISE)}%,100%{transform:scaleY(1)}}`;
  }
  plan.months.forEach((m, i) => {
    css += `.tm${i}{opacity:0;animation:tm${i} ${t} linear infinite both}`;
    const rise3 = m.from === 0 ? `0%,${pct(m.to)}%{opacity:1}` : `0%,${pct(m.from)}%{opacity:0}${pct(m.from + 0.01)}%,${pct(m.to)}%{opacity:1}`;
    const fall = i === plan.months.length - 1 ? "99%,100%{opacity:0}" : `${pct(m.to + 0.01)}%,100%{opacity:0}`;
    css += `@keyframes tm${i}{${rise3}${fall}}`;
  });
  if (peakAt !== void 0) {
    css += `.tl-flag{animation:tl-flag ${t} linear infinite both}@keyframes tl-flag{0%,${pct(peakAt + RISE)}%{opacity:0}${pct(peakAt + RISE + 0.5)}%,${HOLD_UNTIL}%{opacity:1}99%,100%{opacity:0}}`;
  }
  css += `@media (prefers-reduced-motion:reduce){[class^=tl]{animation:none!important}.tm${plan.months.length - 1}{animation:none;opacity:1}}`;
  return css;
}

// ../core/src/live/cityCard.ts
var PAD3 = 44;
var TEXT_WIDTH = 230;
var FLAG_ROOM2 = 40;
var MONTHS2 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function shortDate2(date) {
  const [, month, day] = date.split("-");
  return `${MONTHS2[Number(month) - 1] ?? ""} ${Number(day)}`.trim();
}
function renderCityCard(opts) {
  const { style, motion, contributions } = opts;
  const replay = Boolean(opts.timelapse && motion && contributions && contributions.days.length > 0);
  const title = contributions ? `${replay ? "Time-lapse of the contribution city" : "Contribution city"} for @${opts.login}: ${contributions.total} contributions in the past year, one building for each active day` : `Contribution city for @${opts.login}, shown once contribution data is available`;
  if (!contributions || contributions.days.length === 0) {
    const height2 = 220;
    const bg2 = cardBackground(style, height2, opts.login);
    const body = bg2.markup + label(style, "CONTRIBUTION CITY", PAD3, 52) + `<text x="${CARD_WIDTH / 2}" y="${height2 / 2 + 4}" text-anchor="middle" font-size="16" font-weight="700" fill="${style.fg}">Your contribution city appears here</text><text x="${CARD_WIDTH / 2}" y="${height2 / 2 + 30}" text-anchor="middle" font-size="13" fill="${style.muted}">It is built from your GitHub activity, which is added at your first automatic update.</text>`;
    return svgDocument(style, height2, title, bg2.defs, "", body);
  }
  const { cols, buildings } = layoutCity(contributions.days);
  const colOfDate = new Map(buildings.map((b) => [b.date, b.col]));
  const plan = replay ? planTimelapse(contributions.days, (date) => colOfDate.get(date)) : void 0;
  const regionX = PAD3 + TEXT_WIDTH + 24;
  const regionW = CARD_WIDTH - PAD3 - regionX;
  const m = SLAB_MARGIN;
  const size = Math.min(MAX_CELL, regionW / ((cols + ROWS + 2 * m) * COS));
  const k = size / MAX_CELL;
  const ox = regionX + regionW / 2 - (cols - ROWS) / 2 * COS * size;
  const peak = buildings.length > 0 ? buildings.reduce((best, b) => b.count > best.count || b.count === best.count && b.date > best.date ? b : best, buildings[0]) : void 0;
  const rawY = (u, v, z = 0) => (u + v) * SIN * size - z;
  let reach = rawY(-m, -m);
  for (const b of buildings) reach = Math.min(reach, rawY(b.col + GAP, b.row + GAP, b.height * k));
  if (peak) reach = Math.min(reach, rawY(peak.col + 0.5, peak.row + 0.5, peak.height * k) - FLAG_ROOM2);
  const top = 40;
  const oy = top - reach;
  const at2 = (u, v, z = 0) => [ox + (u - v) * COS * size, oy + rawY(u, v, z)];
  const poly = (points) => `M${points.map(([x, y]) => `${num(x)} ${num(y)}`).join("L")}Z`;
  const slabBottom = at2(cols + m, ROWS + m, -SLAB_DEPTH)[1];
  const height = Math.max(Math.ceil(slabBottom + 40), 330);
  const bg = cardBackground(style, height, opts.login);
  const city2 = style.city;
  const slabTop = poly([at2(-m, -m), at2(cols + m, -m), at2(cols + m, ROWS + m), at2(-m, ROWS + m)]);
  const leftSide = poly([at2(-m, ROWS + m), at2(cols + m, ROWS + m), at2(cols + m, ROWS + m, -SLAB_DEPTH), at2(-m, ROWS + m, -SLAB_DEPTH)]);
  const rightSide = poly([at2(cols + m, -m), at2(cols + m, ROWS + m), at2(cols + m, ROWS + m, -SLAB_DEPTH), at2(cols + m, -m, -SLAB_DEPTH)]);
  const streets = [];
  for (let u = 0; u <= cols; u++) streets.push(`M${num(at2(u, 0)[0])} ${num(at2(u, 0)[1])}L${num(at2(u, ROWS)[0])} ${num(at2(u, ROWS)[1])}`);
  for (let v = 0; v <= ROWS; v++) streets.push(`M${num(at2(0, v)[0])} ${num(at2(0, v)[1])}L${num(at2(cols, v)[0])} ${num(at2(cols, v)[1])}`);
  const towers = buildings.map((b) => {
    const u0 = b.col + GAP;
    const u1 = b.col + 1 - GAP;
    const v0 = b.row + GAP;
    const v1 = b.row + 1 - GAP;
    const h = b.height * k;
    const isPeak = b === peak;
    const colors = isPeak ? city2.peak : city2.levels[Math.min(3, Math.max(0, (b.level || 1) - 1))];
    const delay = motion && !plan ? ` style="animation-delay:${(0.2 + (b.col + b.row) * 0.011).toFixed(3)}s"` : "";
    return `<g class="${plan ? `tl${b.col}` : "cty-b"}"${delay}><path d="${poly([at2(u0, v1), at2(u1, v1), at2(u1, v1, h), at2(u0, v1, h)])}" fill="${colors[1]}"/><path d="${poly([at2(u1, v0), at2(u1, v1), at2(u1, v1, h), at2(u1, v0, h)])}" fill="${colors[2]}"/><path d="${poly([at2(u0, v0, h), at2(u1, v0, h), at2(u1, v1, h), at2(u0, v1, h)])}" fill="${colors[0]}"/></g>`;
  }).join("");
  let flag = "";
  if (peak) {
    const [px, py] = at2(peak.col + 0.5, peak.row + 0.5, peak.height * k);
    const labelX = Math.min(CARD_WIDTH - PAD3 - 60, Math.max(regionX + 40, px));
    flag = `<g${plan ? ' class="tl-flag"' : ""}><path d="M${num(px)} ${num(py - 3)}L${num(px)} ${num(py - 22)}" stroke="${style.fg}" stroke-opacity="0.6"/><text class="mono" x="${num(labelX)}" y="${num(py - 28)}" text-anchor="middle" font-size="11.500" font-weight="700" fill="${style.fg}">${xmlEscape(shortDate2(peak.date))}: ${xmlEscape(formatNumber(peak.count))}</text></g>`;
  }
  const month = busiestMonth(contributions.days);
  let text10 = liveBadge(style, PAD3, 52, motion) + label(style, "CONTRIBUTION CITY", PAD3, 90);
  if (plan) {
    plan.months.forEach((m2, i) => {
      text10 += `<g class="tm${i}"><text x="${PAD3}" y="146" font-size="52" font-weight="800" fill="${style.accent}">${xmlEscape(formatNumber(m2.total))}</text><text class="mono" x="${PAD3 + TEXT_WIDTH}" y="52" text-anchor="end" font-size="12" font-weight="700" letter-spacing="1.500" fill="${style.fg}">${xmlEscape(m2.label.toUpperCase())}</text></g>`;
    });
    text10 += `<text x="${PAD3}" y="172" font-size="14.500" font-weight="600" fill="${style.fg}">contributions so far, ending at ${xmlEscape(formatNumber(contributions.total))}</text>`;
  } else {
    text10 += `<text x="${PAD3}" y="146" font-size="52" font-weight="800" fill="${style.accent}">${xmlEscape(formatNumber(contributions.total))}</text>`;
    text10 += `<text x="${PAD3}" y="172" font-size="14.500" font-weight="600" fill="${style.fg}">contributions in the last year</text>`;
  }
  const facts = [
    plural(contributions.activeDays, "active day"),
    peak ? `Busiest day: ${formatNumber(peak.count)}` : null,
    `Current streak: ${plural(contributions.currentStreak, "day")}`,
    `Longest streak: ${plural(contributions.longestStreak, "day")}`,
    month ? `Busiest month: ${month.name}` : null
  ].filter((v) => Boolean(v));
  facts.forEach((fact2, i) => {
    text10 += `<text x="${PAD3}" y="${204 + i * 24}" font-size="13.500" font-weight="600" fill="${style.muted}">${xmlEscape(fact2)}</text>`;
  });
  text10 += `<text class="mono" x="${PAD3}" y="${height - 36}" font-size="12" font-weight="700" fill="${style.fg}">@${xmlEscape(opts.login)}</text>`;
  text10 += `<text class="mono" x="${PAD3}" y="${height - 18}" font-size="10.500" fill="${style.muted}">one building for every active day</text>`;
  const css = (motion ? LIVE_BADGE_CSS : "") + (plan ? timelapseCss(plan, peak ? colStart(plan, peak.col) : void 0) : motion ? `.cty-b{transform-box:fill-box;transform-origin:50% 100%;animation:cty-grow .8s cubic-bezier(.2,.8,.2,1) both}@keyframes cty-grow{from{transform:scaleY(0)}}@media (prefers-reduced-motion:reduce){.cty-b,.lv-live{animation:none}}` : "");
  const scene = `<path d="${slabTop}" fill="${city2.slab}"/><path d="${leftSide}" fill="${city2.slabSide}"/><path d="${rightSide}" fill="${city2.slabSide}" fill-opacity="0.75"/><path d="${streets.join("")}" fill="none" stroke="${city2.line}" stroke-opacity="0.35" stroke-width="0.6"/>` + (plan ? `<g class="tl-fade">${towers}${flag}</g>` : towers + flag);
  return svgDocument(style, height, title, bg.defs, css, bg.markup + scene + text10);
}
function colStart(plan, col) {
  return plan.columns.get(col);
}

// ../core/src/templates/snake.ts
var WIDTH2 = 900;
var PAD4 = 36;
var ROWS2 = 7;
var CELL2 = 11;
var STEP = 14;
var STEP_SECONDS = 0.075;
var BODY = 5;
var BUCKET = 4;
function planSnake(days) {
  if (days.length === 0) return { cols: 0, path: [], cells: [] };
  const first = (/* @__PURE__ */ new Date(`${days[0]?.date}T00:00:00Z`)).getUTCDay();
  const cols = Math.ceil((first + days.length) / ROWS2);
  const path = [];
  for (let col = 0; col < cols; col++) {
    for (let i = 0; i < ROWS2; i++) path.push([col, col % 2 === 0 ? i : ROWS2 - 1 - i]);
  }
  const lastRow = path[path.length - 1]?.[1] ?? 0;
  path.push([cols, lastRow]);
  for (let row = lastRow - 1; row >= -1; row--) path.push([cols, row]);
  for (let col = cols - 1; col >= 0; col--) path.push([col, -1]);
  const stepOf = /* @__PURE__ */ new Map();
  path.forEach(([col, row], index) => stepOf.set(`${col},${row}`, index));
  const cells2 = days.map((day, index) => {
    const col = Math.floor((first + index) / ROWS2);
    const row = (first + index) % ROWS2;
    return { col, row, count: day.count, level: day.level, step: stepOf.get(`${col},${row}`) ?? 0 };
  });
  return { cols, path, cells: cells2 };
}
var num3 = (value) => String(Math.round(value * 100) / 100 || 0);
function lookFor2(variant, hue) {
  const dark = variant === "dark";
  return {
    bgTop: dark ? hslToHex(hue, 0.35, 0.07) : hslToHex(hue, 0.4, 0.96),
    bgBottom: dark ? hslToHex(hue, 0.4, 0.12) : hslToHex(hue, 0.5, 0.9),
    fg: dark ? "#eef0ff" : "#1d2140",
    muted: dark ? "#9aa0c8" : "#5b6190",
    track: dark ? hslToHex(hue, 0.25, 0.2) : hslToHex(hue, 0.2, 0.84),
    cell: hslToHex(hue, 0.75, dark ? 0.58 : 0.45),
    body: hslToHex((hue + 55) % 360, 0.8, dark ? 0.6 : 0.42),
    head: hslToHex((hue + 55) % 360, 0.9, dark ? 0.72 : 0.34)
  };
}
function renderSvg2(profile, config, variant) {
  const look = lookFor2(variant, hueOf(profile.avatar?.grid.tint) ?? 130);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const parts = [];
  let step = 0;
  const next = () => step++ * 0.1;
  const subline2 = [profile.name ? `@${profile.login}` : "", config.text.headline ? truncate(config.text.headline, 46) : ""].filter(Boolean);
  let header = `<text x="${PAD4}" y="${PAD4 + 24}" font-size="28" font-weight="800" fill="${look.fg}">${xmlEscape(truncate(profile.name ?? profile.login, 28))}</text>`;
  if (subline2.length > 0) {
    header += `<text x="${PAD4}" y="${PAD4 + 46}" font-size="14" fill="${look.muted}">${xmlEscape(subline2.join("  \xB7  "))}</text>`;
  }
  if (blocks.has("stats")) {
    const stats = [
      [formatNumber(profile.publicRepos), "REPOS"],
      [formatNumber(profile.totalStars), "STARS"],
      [formatNumber(profile.followers), "FOLLOWERS"]
    ];
    stats.forEach(([value, caption], index) => {
      const x = WIDTH2 - PAD4 - (stats.length - 1 - index) * 104;
      header += `<text x="${x}" y="${PAD4 + 22}" text-anchor="end" font-size="22" font-weight="800" fill="${look.fg}">${xmlEscape(value)}</text><text class="mono" x="${x}" y="${PAD4 + 40}" text-anchor="end" font-size="10" letter-spacing="1.2" fill="${look.muted}">${caption}</text>`;
    });
  }
  parts.push(rise(header, motion, next()));
  let cursor = PAD4 + 64;
  const wantsGrid = blocks.has("activity");
  const activity = profile.contributions;
  const plan = planSnake(activity?.days ?? []);
  let css = "";
  if (wantsGrid && activity && plan.cols > 0) {
    const gridWidth = plan.cols * STEP - (STEP - CELL2);
    const x0 = Math.round((WIDTH2 - gridWidth) / 2);
    const y0 = cursor + STEP + 6;
    const at2 = (col, row) => [x0 + col * STEP, y0 + row * STEP];
    const length = plan.path.length;
    const period = length * STEP_SECONDS;
    const levelOpacity = [0, 0.3, 0.5, 0.75, 1];
    const buckets = /* @__PURE__ */ new Set();
    const cells2 = plan.cells.map((cell2) => {
      const [x, y] = at2(cell2.col, cell2.row);
      const active = cell2.count > 0;
      const fill = active ? `fill="${look.cell}" fill-opacity="${levelOpacity[Math.min(4, Math.max(1, cell2.level || 1))]}"` : `fill="${look.track}"`;
      let cls = "";
      if (active && motion) {
        const bucket = Math.floor(cell2.step / BUCKET);
        buckets.add(bucket);
        cls = ` class="c e${bucket}"`;
      }
      return `<rect${cls} x="${x}" y="${y}" width="${CELL2}" height="${CELL2}" rx="2.5" ${fill}/>`;
    }).join("");
    const poseAt = (index) => at2(...plan.path[(index % length + length) % length] ?? [0, 0]);
    const segments = Array.from({ length: BODY + 1 }, (_v, i) => {
      const size = i === 0 ? CELL2 : CELL2 - Math.min(3, i * 0.5);
      const inset = (CELL2 - size) / 2;
      const [px, py] = poseAt(BODY - i);
      const fill = i === 0 ? look.head : look.body;
      const opacity = i === 0 ? 1 : Math.max(0.35, 1 - i * 0.13);
      const delay = motion ? ` style="animation-delay:-${num3((length - i) * STEP_SECONDS)}s"` : "";
      return `<rect class="s" x="${num3(inset)}" y="${num3(inset)}" width="${num3(size)}" height="${num3(size)}" rx="${i === 0 ? 4 : 3}" fill="${fill}" fill-opacity="${num3(opacity)}" transform="translate(${px} ${py})"${delay}/>`;
    });
    const snake2 = segments.reverse().join("");
    parts.push(rise(cells2 + snake2, false, 0));
    if (motion) {
      const slither = Array.from({ length: length + 1 }, (_v, index) => {
        const [px, py] = poseAt(index);
        return `${num3(index / length * 100)}%{transform:translate(${px}px,${py}px)}`;
      }).join("");
      const eaten = [...buckets].sort((a, b) => a - b).map((bucket) => {
        const vanish = ((bucket + 1) * BUCKET - 1) / length * 100;
        return `@keyframes e${bucket}{0%,${num3(vanish)}%{opacity:1}${num3(vanish + 0.01)}%,100%{opacity:0}}.e${bucket}{animation-name:e${bucket}}`;
      }).join("");
      css = `.s{animation:slither ${num3(period)}s linear infinite}@keyframes slither{${slither}}.c{animation-duration:${num3(period)}s;animation-iteration-count:infinite;animation-timing-function:linear}` + eaten + `@media (prefers-reduced-motion:reduce){.s,.c{animation:none}}`;
    }
    cursor = y0 + ROWS2 * STEP + 18;
    const captions = [
      [`${formatNumber(activity.total)} contributions in the past year`, plural(activity.activeDays, "active day")],
      [`current streak ${plural(activity.currentStreak, "day")}`, `longest ${plural(activity.longestStreak, "day")}`]
    ].map((items) => items.join("  \xB7  "));
    parts.push(
      rise(
        captions.map((line, index) => `<text class="mono" x="${WIDTH2 / 2}" y="${num3(cursor + index * 20)}" text-anchor="middle" font-size="12.5" fill="${look.muted}">${xmlEscape(line)}</text>`).join(""),
        motion,
        next()
      )
    );
    cursor += 20 + 22;
  } else if (wantsGrid) {
    const top = cursor + 16;
    parts.push(
      rise(
        `<text x="${WIDTH2 / 2}" y="${top + 54}" text-anchor="middle" font-size="16" font-weight="700" fill="${look.fg}">Your snake appears here</text><text x="${WIDTH2 / 2}" y="${top + 80}" text-anchor="middle" font-size="13" fill="${look.muted}">It crosses your contribution graph, which is added at your first automatic update.</text>`,
        motion,
        next()
      )
    );
    cursor = top + 120;
  }
  if (blocks.has("languages") && profile.languages.length > 0) {
    const text10 = profile.languages.slice(0, 4).map((l) => `${truncate(l.name, 14)} ${l.percent}%`).join("   ");
    parts.push(
      rise(
        `<text class="mono" x="${PAD4}" y="${num3(cursor)}" font-size="12.5" fill="${look.muted}">written in  <tspan fill="${look.fg}">${xmlEscape(text10)}</tspan></text>`,
        motion,
        next()
      )
    );
    cursor += 24;
  }
  const height = Math.ceil(cursor + PAD4 - 18);
  const title = `${profile.name ?? profile.login} (@${profile.login}) on GitHub`;
  const entrance = motion ? `.rise{animation:rise .6s ease both}@keyframes rise{from{opacity:0}}@media (prefers-reduced-motion:reduce){.rise{animation:none}}` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH2}" height="${height}" viewBox="0 0 ${WIDTH2} ${height}" role="img" aria-labelledby="t">
<title id="t">${xmlEscape(title)}</title>
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${look.bgTop}"/><stop offset="1" stop-color="${look.bgBottom}"/></linearGradient>
</defs>
<style>
text{font-family:${FONT_SANS}}
.mono{font-family:${FONT2}}
${entrance}
${css}
</style>
<rect width="${WIDTH2}" height="${height}" rx="20" fill="url(#bg)"/>
${parts.filter(Boolean).join("\n")}
</svg>
`;
}
var snake = {
  id: "snake",
  name: "Snake trail",
  description: "A snake slithers across your contribution graph and eats every active day, then starts over.",
  tags: ["animated", "game", "activity"],
  needsAvatar: false,
  render(profile, config) {
    const assets = variantsFor(config.theme).map((variant) => ({
      path: assetPath("snake", variant),
      content: renderSvg2(profile, config, variant)
    }));
    const drawn = config.blocks.includes("activity") && profile.contributions && profile.contributions.days.length > 0;
    const extra = drawn ? "an animated snake crossing the contribution graph and eating the active days" : void 0;
    return { readme: imageReadme(profile, config, "snake", WIDTH2, describeProfile(profile, config, extra, { activity: true })), assets };
  }
};

// ../core/src/live/snakeCard.ts
var PAD5 = 44;
var ROWS3 = 7;
var MAX_STEP = 18;
var STEP_SECONDS2 = 0.075;
var BODY2 = 5;
var BUCKET2 = 4;
function cellShape(shape, x, y, size, attrs, cls = "") {
  const c2 = cls ? ` class="${cls}"` : "";
  if (shape === "round") {
    return `<circle${c2} cx="${num(x + size / 2)}" cy="${num(y + size / 2)}" r="${num(size / 2)}" ${attrs}/>`;
  }
  if (shape === "diamond") {
    const h = size / 2;
    const cx = x + h;
    const cy = y + h;
    return `<path${c2} d="M${num(cx)} ${num(cy - h)}L${num(cx + h)} ${num(cy)}L${num(cx)} ${num(cy + h)}L${num(cx - h)} ${num(cy)}Z" ${attrs}/>`;
  }
  return `<rect${c2} x="${num(x)}" y="${num(y)}" width="${num(size)}" height="${num(size)}" rx="${num(size * 0.22)}" ${attrs}/>`;
}
function renderSnakeCard(opts) {
  const { style, motion, contributions } = opts;
  const title = contributions ? `An animated snake crossing the contribution graph of @${opts.login}, eating the active days among ${contributions.total} contributions` : `A contribution snake for @${opts.login}, shown once contribution data is available`;
  if (!contributions || contributions.days.length === 0) {
    const height2 = 200;
    const bg2 = cardBackground(style, height2, opts.login);
    const body = bg2.markup + label(style, "SNAKE TRAIL", PAD5, 52) + `<text x="${CARD_WIDTH / 2}" y="${height2 / 2 + 4}" text-anchor="middle" font-size="16" font-weight="700" fill="${style.fg}">Your snake appears here</text><text x="${CARD_WIDTH / 2}" y="${height2 / 2 + 30}" text-anchor="middle" font-size="13" fill="${style.muted}">It crosses your contribution graph, which is added at your first automatic update.</text>`;
    return svgDocument(style, height2, title, bg2.defs, "", body);
  }
  const plan = planSnake(contributions.days);
  const sn = style.snake;
  const step = Math.min(MAX_STEP, Math.floor((CARD_WIDTH - PAD5 * 2) / (plan.cols + 1)));
  const cell2 = step - sn.gap;
  const gridW = plan.cols * step - sn.gap;
  const x0 = Math.round((CARD_WIDTH - gridW) / 2);
  const headerH = 96;
  const y0 = headerH + step + 8;
  const height = y0 + ROWS3 * step + 70;
  const bg = cardBackground(style, height, opts.login);
  const at2 = (col, row) => [x0 + col * step, y0 + row * step];
  const length = plan.path.length;
  const period = length * STEP_SECONDS2;
  const opacities = [0, 0.3, 0.5, 0.75, 1];
  const glow = sn.glow ? ' filter="url(#snk-glow)"' : "";
  const buckets = /* @__PURE__ */ new Set();
  const cells2 = plan.cells.map((c2) => {
    const [x, y] = at2(c2.col, c2.row);
    const active = c2.count > 0;
    const attrs = active ? `fill="${sn.cellColor}" fill-opacity="${opacities[Math.min(4, Math.max(1, c2.level || 1))]}"` : `fill="${sn.track}"`;
    let cls = "";
    if (active && motion) {
      const bucket = Math.floor(c2.step / BUCKET2);
      buckets.add(bucket);
      cls = `snk-c snk-e${bucket}`;
    }
    return cellShape(sn.cell, x, y, cell2, attrs, cls);
  }).join("");
  const poseAt = (index) => at2(...plan.path[(index % length + length) % length] ?? [0, 0]);
  const segments = Array.from({ length: BODY2 + 1 }, (_v, i) => {
    const size = i === 0 ? cell2 : cell2 - Math.min(cell2 * 0.3, i * 0.6);
    const inset = (cell2 - size) / 2;
    const [px, py] = poseAt(BODY2 - i);
    const fill = i === 0 ? sn.head : sn.body;
    const opacity = i === 0 ? 1 : Math.max(0.35, 1 - i * 0.13);
    const delay = motion ? ` style="animation-delay:-${num((length - i) * STEP_SECONDS2)}s"` : "";
    const shape = cellShape(sn.cell, inset, inset, size, `fill="${fill}" fill-opacity="${num(opacity)}"${glow}`);
    const eyes = i === 0 && cell2 >= 9 ? `<circle cx="${num(cell2 * 0.32)}" cy="${num(cell2 * 0.42)}" r="${num(cell2 * 0.09)}" fill="${style.bgTop}"/><circle cx="${num(cell2 * 0.68)}" cy="${num(cell2 * 0.42)}" r="${num(cell2 * 0.09)}" fill="${style.bgTop}"/>` : "";
    return `<g class="snk-s" transform="translate(${px} ${py})"${delay}>${shape}${eyes}</g>`;
  });
  const snake2 = segments.reverse().join("");
  let css = motion ? LIVE_BADGE_CSS : "";
  if (motion) {
    const slither = Array.from({ length: length + 1 }, (_v, index) => {
      const [px, py] = poseAt(index);
      return `${num(index / length * 100)}%{transform:translate(${px}px,${py}px)}`;
    }).join("");
    const eaten = [...buckets].sort((a, b) => a - b).map((bucket) => {
      const vanish = ((bucket + 1) * BUCKET2 - 1) / length * 100;
      return `@keyframes snk-k${bucket}{0%,${num(vanish)}%{opacity:1}${num(vanish + 0.01)}%,100%{opacity:0}}.snk-e${bucket}{animation-name:snk-k${bucket}}`;
    }).join("");
    css += `.snk-s{animation:snk-slither ${num(period)}s linear infinite}@keyframes snk-slither{${slither}}.snk-c{animation-duration:${num(period)}s;animation-iteration-count:infinite;animation-timing-function:linear}` + eaten + `@media (prefers-reduced-motion:reduce){.snk-s,.snk-c,.lv-live{animation:none!important}}`;
  }
  const defs = bg.defs + (sn.glow ? `<filter id="snk-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.600" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` : "");
  let text10 = label(style, "SNAKE TRAIL", PAD5, 46);
  text10 += `<text x="${PAD5}" y="76" font-size="22" font-weight="800" fill="${style.fg}">${xmlEscape(formatNumber(contributions.total))} contributions, one continuous run</text>`;
  text10 += liveBadge(style, CARD_WIDTH - PAD5 - 42, 46, motion);
  const capY = y0 + ROWS3 * step + 30;
  text10 += `<text class="mono" x="${PAD5}" y="${capY}" font-size="12" fill="${style.muted}">${xmlEscape(`${plural(contributions.activeDays, "active day")}  \xB7  current streak ${plural(contributions.currentStreak, "day")}  \xB7  longest ${plural(contributions.longestStreak, "day")}`)}</text>`;
  text10 += `<text class="mono" x="${CARD_WIDTH - PAD5}" y="${capY}" text-anchor="end" font-size="11" fill="${style.muted}">@${xmlEscape(opts.login)}</text>`;
  return svgDocument(style, height, title, defs, css, bg.markup + text10 + cells2 + snake2);
}

// ../core/src/live/compose.ts
var DEFAULT_HUE = {
  aurora: 170,
  sunrise: 22,
  night: 215,
  space: 262,
  arcade: 135,
  chalk: 160,
  editor: 142,
  blueprint: 205,
  paper: 30,
  terminal: 125,
  glow: 175,
  plain: 220
};
function withLive(base, spec) {
  return {
    ...base,
    needsAvatar: true,
    render(profile, config) {
      const out = base.render(profile, config);
      const preset = config.custom?.look ?? spec.preset;
      const chosen = config.custom?.companion;
      const companion = chosen === void 0 ? spec.companion : chosen === "none" ? null : chosen;
      const wantCity = spec.city && config.blocks.includes("city");
      const wantGame = companion !== null && config.blocks.includes("game");
      if (!wantCity && !wantGame) return out;
      const hue = hueOf(profile.avatar?.grid.tint) ?? DEFAULT_HUE[preset];
      const nowIso = profile.fetchedAt ?? profile.createdAt;
      const login = profile.login;
      const assets = [];
      const pictures = [];
      const picture = (kind, alt) => pictures.push(`<div align="center">
${pictureTag(`${base.id}-${kind}`, config.theme, alt, CARD_WIDTH)}
</div>`);
      if (wantCity) {
        const days = profile.contributions?.days ?? [];
        const peak = days.reduce((best, d) => Math.max(best, d.count), 0);
        picture(
          "city",
          profile.contributions ? `Contribution city: ${profile.contributions.total} contributions in the past year across ${profile.contributions.activeDays} active days${peak > 0 ? `, busiest day ${peak}` : ""}, one building for each active day` : "Contribution city, shown once contribution data is available"
        );
      }
      if (wantGame && companion === "snake") {
        picture(
          "snake",
          profile.contributions ? `An animated snake crossing the contribution graph and eating the active days, among ${profile.contributions.total} contributions in the past year` : "A contribution snake, shown once contribution data is available"
        );
      }
      if (wantGame && companion === "chess") {
        const { state, replay } = liveState(login, nowIso);
        picture("chess", `A live chess game: ${state.game.title}, ${state.game.white} against ${state.game.black}. ${statusText(state, replay)}`);
      }
      for (const variant of variantsFor(config.theme)) {
        const style = styleFor(preset, variant, hue, spec.shift ?? 0);
        if (wantCity) {
          assets.push({
            path: assetPath(`${base.id}-city`, variant),
            content: renderCityCard({ login, contributions: profile.contributions, style, motion: config.motion, timelapse: config.custom?.timelapse === true })
          });
        }
        if (wantGame && companion === "snake") {
          assets.push({
            path: assetPath(`${base.id}-snake`, variant),
            content: renderSnakeCard({ login, contributions: profile.contributions, style, motion: config.motion })
          });
        }
        if (wantGame && companion === "chess") {
          assets.push({
            path: assetPath(`${base.id}-chess`, variant),
            content: renderChess({ login, nowIso, style, motion: config.motion })
          });
        }
      }
      return { readme: insertBlocks(out.readme, pictures, config.theme), assets: [...out.assets, ...assets] };
    }
  };
}

// ../core/src/templates/kit.ts
var W = 900;
var PAD6 = 36;
function lookOf(hue, variant, profile) {
  const picture = hueOf(profile.avatar?.grid.tint);
  const second = picture ?? (hue + 40) % 360;
  if (variant === "dark") {
    return {
      bg: hslToHex(hue, 0.4, 0.07),
      panel: hslToHex(hue, 0.32, 0.115),
      border: hslToHex(hue, 0.28, 0.21),
      track: hslToHex(hue, 0.26, 0.17),
      fg: hslToHex(hue, 0.2, 0.93),
      muted: hslToHex(hue, 0.14, 0.67),
      accent: hslToHex(hue, 0.85, 0.6),
      accent2: hslToHex(second, 0.8, 0.64)
    };
  }
  return {
    bg: hslToHex(hue, 0.3, 0.97),
    panel: "#ffffff",
    border: hslToHex(hue, 0.25, 0.87),
    track: hslToHex(hue, 0.25, 0.92),
    fg: hslToHex(hue, 0.4, 0.14),
    muted: hslToHex(hue, 0.14, 0.38),
    accent: hslToHex(hue, 0.75, 0.38),
    accent2: hslToHex(second, 0.7, 0.4)
  };
}
var mono = (text10, x, y, fill, extra = "") => `<text class="mono" x="${x}" y="${y}" fill="${fill}" ${extra}>${xmlEscape(text10)}</text>`;
var sans = (text10, x, y, fill, extra = "") => `<text x="${x}" y="${y}" fill="${fill}" ${extra}>${xmlEscape(text10)}</text>`;
var label2 = (look, text10, x, y) => mono(text10, x, y, look.accent, 'font-size="11.5" font-weight="700" letter-spacing="2"');
var num4 = (n) => String(Math.round(n * 100) / 100);
function shell(o) {
  const { look, variant } = o;
  const height = Math.ceil(o.height);
  const r = o.radius ?? 18;
  const [gx, gy] = o.glow ?? [0.92, 0];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${height}" viewBox="0 0 ${W} ${height}" role="img" aria-labelledby="t">
<title id="t">${xmlEscape(o.title)}</title>
<defs>
<pattern id="kg" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="${look.accent}" stroke-opacity="${variant === "dark" ? 0.07 : 0.07}"/></pattern>
<radialGradient id="kglow" cx="${gx}" cy="${gy}" r="0.85"><stop offset="0" stop-color="${look.accent}" stop-opacity="${variant === "dark" ? 0.22 : 0.13}"/><stop offset="1" stop-color="${look.accent}" stop-opacity="0"/></radialGradient>
${o.defs ?? ""}
</defs>
<style>
text{font-family:${FONT_SANS}}
.mono{font-family:${FONT2}}
${o.css ?? ""}
</style>
<rect width="${W}" height="${height}" rx="${r}" fill="${look.bg}"/>
${o.grid === false ? "" : `<rect width="${W}" height="${height}" rx="${r}" fill="url(#kg)"/>`}
<rect width="${W}" height="${height}" rx="${r}" fill="url(#kglow)"/>
<rect x="0.5" y="0.5" width="${W - 1}" height="${height - 1}" rx="${r}" fill="none" stroke="${look.border}"/>
${o.body}
</svg>
`;
}
function riseCss(motion) {
  if (!motion) return "";
  return `.rise{animation:rise .6s ease both}
@keyframes rise{from{opacity:0;transform:translateY(6px)}}
.bar{transform-box:fill-box;transform-origin:50% 100%;animation:grow .7s cubic-bezier(.2,.7,.2,1) both}
@keyframes grow{from{transform:scaleY(0)}}
@media (prefers-reduced-motion:reduce){.rise,.bar{animation:none}}`;
}
function enter(markup, motion, delay) {
  if (!markup || !motion) return markup;
  return `<g class="rise" style="animation-delay:${delay.toFixed(2)}s">${markup}</g>`;
}
function portrait(profile, look, cx, cy, r) {
  const uri = profile.avatar?.dataUri;
  if (uri && SAFE_DATA_URI.test(uri)) {
    return `<clipPath id="pt"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath><image href="${uri}" x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" preserveAspectRatio="xMidYMid slice" clip-path="url(#pt)"/><circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="none" stroke="${look.accent}" stroke-width="2"/>`;
  }
  const initial = [...profile.name ?? profile.login][0]?.toUpperCase() ?? "?";
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${look.accent}"/><text x="${cx}" y="${cy + r * 0.34}" text-anchor="middle" font-size="${Math.round(r * 0.95)}" font-weight="800" fill="${look.bg}">${xmlEscape(initial)}</text>`;
}
function panel(look, x, y, w, h, accent2 = true) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${look.panel}" stroke="${look.border}"/>` + (accent2 ? `<rect x="${x + 18}" y="${y}" width="36" height="3" rx="1.5" fill="${look.accent}"/>` : "");
}
function langBars(look, languages, x, y, w, rows = 4) {
  const shown = languages.slice(0, rows);
  const markup = shown.map((language, index) => {
    const top = y + index * 26;
    const fill = index % 2 === 0 ? look.accent : look.accent2;
    return sans(truncate(language.name, 18), x, top + 10, look.fg, 'font-size="12.5"') + mono(`${language.percent}%`, x + w, top + 10, look.muted, 'font-size="11.5" text-anchor="end"') + `<rect x="${x}" y="${top + 16}" width="${w}" height="5" rx="2.5" fill="${look.track}"/><rect x="${x}" y="${top + 16}" width="${num4(Math.max(4, w * language.percent / 100))}" height="5" rx="2.5" fill="${fill}"/>`;
  }).join("");
  return { markup, height: shown.length * 26 };
}
function weekBars(look, days, x, y, w, h, motion) {
  const weeks = weeklyTotals(days);
  if (weeks.length === 0) return "";
  const peak = Math.max(...weeks, 1);
  const peakIndex = weeks.indexOf(Math.max(...weeks));
  const gap = 2;
  const bar = (w - gap * (weeks.length - 1)) / weeks.length;
  return weeks.map((total, index) => {
    const height = Math.max(2, total / peak * h);
    const fill = total === 0 ? look.track : index === peakIndex ? look.accent2 : look.accent;
    const delay = motion ? ` style="animation-delay:${(0.2 + index * 0.012).toFixed(3)}s"` : "";
    return `<rect class="bar" x="${num4(x + index * (bar + gap))}" y="${num4(y + h - height)}" width="${num4(bar)}" height="${num4(height)}" rx="1.5" fill="${fill}"${total === 0 ? "" : ' fill-opacity="0.9"'}${delay}/>`;
  }).join("") + `<rect x="${x}" y="${y + h + 1}" width="${w}" height="1" fill="${look.border}"/>`;
}
function heatStrip(look, days, x, y, w) {
  if (days.length === 0) return { markup: "", height: 0 };
  const first = (/* @__PURE__ */ new Date(`${days[0]?.date}T00:00:00Z`)).getUTCDay();
  const cols = Math.ceil((first + days.length) / 7);
  const gap = 2;
  const cell2 = Math.max(2, (w - gap * (cols - 1)) / cols);
  const opacities = [0, 0.3, 0.5, 0.75, 1];
  const markup = days.map((day, index) => {
    const col = Math.floor((first + index) / 7);
    const row = (first + index) % 7;
    const attrs = day.level === 0 ? `fill="${look.track}"` : `fill="${look.accent}" fill-opacity="${opacities[day.level]}"`;
    return `<rect x="${num4(x + col * (cell2 + gap))}" y="${num4(y + row * (cell2 + gap))}" width="${num4(cell2)}" height="${num4(cell2)}" rx="1.5" ${attrs}/>`;
  }).join("");
  return { markup, height: 7 * cell2 + 6 * gap };
}
var REPO_ROW = 58;
function repoRow(look, repo, profile, x, y, w) {
  const updated = repo.pushedAt && profile.fetchedAt ? timeAgo(repo.pushedAt, profile.fetchedAt) : null;
  const meta = [repo.language, repo.license, updated ? `updated ${updated}` : null].filter((v) => Boolean(v));
  const desc = repo.description ? wrap(repo.description, Math.max(24, Math.floor((w - 190) / 6.3)), 1)[0] : null;
  return `<rect x="${x}" y="${y}" width="${w}" height="${REPO_ROW - 8}" rx="12" fill="${look.panel}" stroke="${look.border}"/>` + sans(truncate(repo.name, 28), x + 16, y + 22, look.accent, 'font-size="14.5" font-weight="700"') + (desc ? sans(desc, x + 16, y + 40, look.muted, 'font-size="12"') : meta.length > 0 ? mono(truncate(meta.join("  \xB7  "), 60), x + 16, y + 40, look.muted, 'font-size="11"') : "") + mono(`\u2605 ${formatNumber(repo.stars)}`, x + w - 16, y + 22, look.fg, 'font-size="12.5" font-weight="700" text-anchor="end"') + mono(`forks ${formatNumber(repo.forks)}`, x + w - 16, y + 40, look.muted, 'font-size="11" text-anchor="end"');
}
function reposIn(profile, languages) {
  const wanted2 = new Set(languages.map((l) => l.toLowerCase()));
  return profile.topRepos.filter((r) => r.language && wanted2.has(r.language.toLowerCase())).sort((a, b) => b.stars - a.stars);
}
function shareIn(profile, languages) {
  const wanted2 = new Set(languages.map((l) => l.toLowerCase()));
  return profile.languages.filter((l) => wanted2.has(l.name.toLowerCase())).reduce((sum, l) => sum + l.percent, 0);
}

// ../core/src/templates/arcade.ts
var ROWS4 = 7;
var SECONDS_PER_COLUMN = 0.16;
var HOLD_SECONDS2 = 3;
function gridOf(days) {
  if (days.length === 0) return { cols: 0, cells: [] };
  const first = (/* @__PURE__ */ new Date(`${days[0]?.date}T00:00:00Z`)).getUTCDay();
  const cols = Math.ceil((first + days.length) / ROWS4);
  const cells2 = days.map((day, index) => ({ col: Math.floor((first + index) / ROWS4), row: (first + index) % ROWS4, count: day.count, level: day.level }));
  return { cols, cells: cells2 };
}
function zapFraction(col, cols) {
  return (col + 1) / (cols + 1) * 0.88;
}
function planRunner(days) {
  const weeks = weeklyTotals(days);
  const peak = Math.max(...weeks, 1);
  const last = Math.max(weeks.length - 1, 1);
  const orbs = weeks.flatMap((total, week) => total > 0 ? [{ week, at: week / last * 0.88, total }] : []);
  return { weeks, peak, orbs };
}
function planBreakout(days) {
  const { cols, cells: cells2 } = gridOf(days);
  const rows = ROWS4 + 4;
  const alive = new Set(cells2.filter((c2) => c2.count > 0).map((c2) => `${c2.col},${c2.row}`));
  const path = [];
  const hits = /* @__PURE__ */ new Map();
  if (cols === 0) return { path, hits, cols, rows };
  let x = 0;
  let y = rows - 1;
  let dy = -1;
  const dx = 0.5;
  for (let step = 0; x <= cols - 0.5; step++) {
    path.push({ x, y });
    const key = `${Math.floor(x)},${Math.floor(y)}`;
    if (y < ROWS4 && alive.delete(key)) hits.set(key, step);
    x += dx;
    y += dy;
    if (y <= 0) dy = 1;
    if (y >= rows - 1) dy = -1;
    y = Math.min(rows - 1, Math.max(0, y));
  }
  return { path, hits, cols, rows };
}
var INSET = PAD6;
function telemetry(profile, blocks, look, x, y, extra = []) {
  const lines = [`@${profile.login}`];
  if (blocks.has("stats")) lines.push(`${formatNumber(profile.totalStars)} stars`, `${formatNumber(profile.followers)} followers`, `${formatNumber(profile.publicRepos)} repos`);
  lines.push(...extra);
  return lines.map((line, i) => mono(truncate(line, 30), x, y + i * 20, i === 0 ? look.fg : look.muted, `font-size="${i === 0 ? 14 : 12.5}"${i === 0 ? ' font-weight="700"' : ""}`)).join("");
}
function stars(look, w, h, seed, motion) {
  const rand = seeded2(seed);
  return Array.from({ length: 70 }, (_v, i) => {
    const twinkle = motion && i % 4 === 0 ? ` class="tw" style="animation-delay:${(rand() * 3).toFixed(1)}s"` : "";
    return `<circle cx="${num4(rand() * w)}" cy="${num4(rand() * h)}" r="${num4(0.5 + rand() * 1.1)}" fill="${look.fg}" fill-opacity="${num4(0.2 + rand() * 0.5)}"${twinkle}/>`;
  }).join("");
}
function shooter(profile, config, look, days, y0, blocks) {
  const { cols, cells: cells2 } = gridOf(days);
  const gx = 300;
  const gw = W - PAD6 - gx;
  const step = Math.max(4, Math.min(12, Math.floor(gw / cols)));
  const cell2 = step - 2;
  const motion = config.motion;
  const total = cols * SECONDS_PER_COLUMN + HOLD_SECONDS2;
  const gridW = cols * step;
  const top = y0 + 14;
  const shipY = top + ROWS4 * step + 46;
  const height = shipY + 30 - y0;
  const opacities = [0, 0.3, 0.5, 0.75, 1];
  const buckets = /* @__PURE__ */ new Set();
  const grid = cells2.map((c2) => {
    const x = gx + c2.col * step;
    const y = top + c2.row * step;
    if (c2.count === 0) return `<rect x="${x}" y="${y}" width="${cell2}" height="${cell2}" rx="1.5" fill="${look.track}"/>`;
    buckets.add(c2.col);
    const cls = motion ? ` class="z z${c2.col}"` : "";
    return `<rect${cls} x="${x}" y="${y}" width="${cell2}" height="${cell2}" rx="2" fill="${look.accent}" fill-opacity="${opacities[Math.min(4, Math.max(1, c2.level))]}"/>`;
  }).join("");
  const shipX = (col) => gx + col * step + cell2 / 2;
  const ship = (x) => `M${num4(x)} ${shipY - 14}l9 20h-18z`;
  let css = "";
  let beams = "";
  let ships = `<path d="${ship(shipX(0))}" fill="${look.fg}"/><path d="M${num4(shipX(0) - 4)} ${shipY + 6}h8l-4 7z" fill="${look.accent2}"/>`;
  if (motion) {
    const f = (col) => num4(zapFraction(col, cols) * 100);
    css += `.ship{animation:ar-fly ${num4(total)}s linear infinite}@keyframes ar-fly{0%{transform:translateX(0)}88%{transform:translateX(${num4(gridW - step)}px)}100%{transform:translateX(0)}}`;
    css += `.z{animation-duration:${num4(total)}s;animation-iteration-count:infinite;animation-timing-function:linear}`;
    css += `.bm{opacity:0;animation-duration:${num4(total)}s;animation-iteration-count:infinite;animation-timing-function:linear}`;
    for (const col of [...buckets].sort((a, b) => a - b)) {
      css += `@keyframes ar-z${col}{0%,${f(col)}%{opacity:1}${num4(Number(f(col)) + 0.01)}%,99.9%{opacity:0}100%{opacity:1}}.z${col}{animation-name:ar-z${col}}`;
      css += `@keyframes ar-b${col}{0%,${num4(Number(f(col)) - 0.6)}%{opacity:0}${f(col)}%{opacity:1}${num4(Number(f(col)) + 1.2)}%,100%{opacity:0}}.b${col}{animation-name:ar-b${col}}`;
      beams += `<rect class="bm b${col}" x="${num4(shipX(col) - 0.75)}" y="${top - 6}" width="1.5" height="${shipY - 16 - top + 6}" fill="${look.accent2}"/>`;
    }
    css += `.tw{animation:ar-tw 2.4s ease-in-out infinite}@keyframes ar-tw{50%{opacity:.15}}@media (prefers-reduced-motion:reduce){.ship,.z,.bm,.tw{animation:none!important}.bm{opacity:0}}`;
    ships = `<g class="ship">${ships}</g>`;
  }
  const label4 = mono("TELEMETRY", INSET, y0 + 22, look.accent, 'font-size="11.5" font-weight="700" letter-spacing="2"');
  const markup = stars(look, W, 400, `${profile.login}:shooter`, motion) + label4 + telemetry(profile, blocks, look, INSET, y0 + 48, profile.contributions ? [`${formatNumber(profile.contributions.total)} shots`] : []) + grid + beams + ships;
  return { markup, css, height };
}
function runner(profile, config, look, days, y0, blocks) {
  const plan = planRunner(days);
  const motion = config.motion;
  const n = plan.weeks.length;
  const x0 = PAD6;
  const gw = W - PAD6 * 2;
  const bar = gw / n;
  const base = y0 + 190;
  const terrainH = (total2) => 8 + total2 / plan.peak * 70;
  const jetY = (week) => {
    const near = [-2, -1, 0, 1, 2].map((d) => plan.weeks[week + d] ?? 0);
    return base - terrainH(Math.max(...near)) - 30;
  };
  const jetX = (week) => x0 + week * bar + bar / 2;
  const total = n * SECONDS_PER_COLUMN + HOLD_SECONDS2;
  const terrain = plan.weeks.map((w, i) => `<rect x="${num4(x0 + i * bar + 0.5)}" y="${num4(base - terrainH(w))}" width="${num4(Math.max(1, bar - 1))}" height="${num4(terrainH(w))}" rx="1.5" fill="${look.accent}" fill-opacity="${w === 0 ? 0.08 : 0.28}"/>`).join("");
  let css = "";
  const orbs = plan.orbs.map((o) => {
    const cls = motion ? ` class="o o${o.week}"` : "";
    if (motion) css += `@keyframes ar-o${o.week}{0%,${num4(o.at * 100)}%{opacity:1}${num4(o.at * 100 + 0.01)}%,99.9%{opacity:0}100%{opacity:1}}.o${o.week}{animation-name:ar-o${o.week}}`;
    return `<circle${cls} cx="${num4(jetX(o.week))}" cy="${num4(jetY(o.week) + 4)}" r="${num4(3 + Math.min(3, o.total / plan.peak * 3))}" fill="${look.accent2}"/>`;
  }).join("");
  const jetShape = (x, y) => `<path d="M${num4(x - 12)} ${num4(y)}l24 -4l-8 -5v-5l-8 5l-12 -1z" fill="${look.fg}"/><circle cx="${num4(x - 14)}" cy="${num4(y - 2)}" r="3" fill="${look.accent}"/>`;
  let jet = jetShape(jetX(0), jetY(0));
  if (motion) {
    const stops = Array.from({ length: n }, (_v, w) => `${num4(w / Math.max(n - 1, 1) * 88)}%{transform:translate(${num4(jetX(w) - jetX(0))}px,${num4(jetY(w) - jetY(0))}px)}`).join("");
    css += `.jet{animation:ar-jet ${num4(total)}s linear infinite}@keyframes ar-jet{${stops}100%{transform:translate(0,0)}}`;
    css += `.o{animation-duration:${num4(total)}s;animation-iteration-count:infinite;animation-timing-function:linear}`;
    css += `@media (prefers-reduced-motion:reduce){.jet,.o{animation:none!important}}`;
    jet = `<g class="jet">${jet}</g>`;
  }
  const height = base - y0 + 36;
  const markup = mono("JET RUNNER", PAD6, y0 + 22, look.accent, 'font-size="11.5" font-weight="700" letter-spacing="2"') + mono(truncate([`@${profile.login}`, blocks.has("stats") ? `${formatNumber(profile.totalStars)} stars` : "", profile.contributions ? `${formatNumber(profile.contributions.total)} contributions` : ""].filter(Boolean).join("  \xB7  "), 80), PAD6, y0 + 44, look.muted, 'font-size="12.5"') + terrain + orbs + jet + `<rect x="${PAD6}" y="${base + 1}" width="${gw}" height="1" fill="${look.border}"/>` + mono(`${plural(plan.orbs.length, "active week")} collected on the run`, PAD6, base + 22, look.muted, 'font-size="11.5"');
  return { markup, css, height };
}
function signal(profile, config, look, days, y0, blocks) {
  const plan = planBreakout(days);
  const { cells: cells2 } = gridOf(days);
  const motion = config.motion;
  const gx = 30 + 250;
  const gw = W - PAD6 - gx;
  const step = Math.max(4, Math.min(12, Math.floor(gw / plan.cols)));
  const cell2 = step - 2;
  const top = y0 + 14;
  const bottom = top + plan.rows * step;
  const steps = plan.path.length;
  const total = Math.max(steps * 0.06, 4) + HOLD_SECONDS2;
  const opacities = [0, 0.3, 0.5, 0.75, 1];
  const px = (x) => gx + x * step;
  const py = (y) => top + y * step;
  let css = "";
  const buckets = /* @__PURE__ */ new Set();
  const bricks = cells2.map((c2) => {
    const x = px(c2.col);
    const y = py(c2.row);
    if (c2.count === 0) return `<rect x="${x}" y="${y}" width="${cell2}" height="${cell2}" rx="1" fill="${look.track}" fill-opacity="0.6"/>`;
    const hit = plan.hits.get(`${c2.col},${c2.row}`);
    let cls = "";
    if (motion && hit !== void 0) {
      const bucket = Math.floor(hit / 4);
      buckets.add(bucket);
      cls = ` class="k k${bucket}"`;
    }
    return `<rect${cls} x="${x}" y="${y}" width="${cell2}" height="${cell2}" rx="1" fill="${c2.level === 4 ? look.accent2 : look.accent}" fill-opacity="${opacities[Math.min(4, Math.max(1, c2.level))]}"/>`;
  }).join("");
  const ballAt = (i) => plan.path[Math.min(i, steps - 1)] ?? { x: 0, y: plan.rows - 1 };
  let ball = `<circle cx="${num4(px(ballAt(0).x))}" cy="${num4(py(ballAt(0).y))}" r="3.2" fill="${look.fg}"/>`;
  let paddle = `<rect x="${num4(px(0) - 14)}" y="${num4(bottom + 4)}" width="30" height="5" rx="2.5" fill="${look.accent}"/>`;
  if (motion && steps > 1) {
    const frames = (f) => plan.path.map((p, i) => `${num4(i / (steps - 1) * 88)}%{transform:translate(${f(p)})}`).join("");
    const first = ballAt(0);
    css += `.ball{animation:ar-ball ${num4(total)}s linear infinite}@keyframes ar-ball{${frames((p) => `${num4((p.x - first.x) * step)}px,${num4((p.y - first.y) * step)}px`)}100%{transform:translate(0,0)}}`;
    css += `.pad{animation:ar-pad ${num4(total)}s linear infinite}@keyframes ar-pad{${frames((p) => `${num4((p.x - first.x) * step)}px,0`)}100%{transform:translate(0,0)}}`;
    css += `.k{animation-duration:${num4(total)}s;animation-iteration-count:infinite;animation-timing-function:linear}`;
    for (const bucket of [...buckets].sort((a, b) => a - b)) {
      const at2 = ((bucket * 4 + 3) / (steps - 1) * 88).toFixed(2);
      css += `@keyframes ar-k${bucket}{0%,${at2}%{opacity:1}${num4(Number(at2) + 0.01)}%,99.9%{opacity:0}100%{opacity:1}}.k${bucket}{animation-name:ar-k${bucket}}`;
    }
    css += `@media (prefers-reduced-motion:reduce){.ball,.pad,.k{animation:none!important}}`;
    ball = `<g class="ball">${ball}</g>`;
    paddle = `<g class="pad">${paddle}</g>`;
  }
  const hud = [
    mono("PLAYABLE SIGNAL", PAD6, y0 + 22, look.accent, 'font-size="11.5" font-weight="700" letter-spacing="2"'),
    mono(`PLAYER  @${truncate(profile.login, 18)}`, PAD6, y0 + 52, look.fg, 'font-size="13" font-weight="700"'),
    profile.contributions ? mono(`SCORE   ${formatNumber(profile.contributions.total)}`, PAD6, y0 + 74, look.muted, 'font-size="12.5"') : "",
    profile.contributions ? mono(`STREAK  ${profile.contributions.currentStreak}`, PAD6, y0 + 94, look.muted, 'font-size="12.5"') : "",
    blocks.has("stats") ? mono(`STARS   ${formatNumber(profile.totalStars)}`, PAD6, y0 + 114, look.muted, 'font-size="12.5"') : ""
  ].join("");
  const height = bottom + 24 - y0;
  return { markup: hud + bricks + ball + paddle, css, height };
}
var SPECS = [
  { id: "spaceshooter", name: "Space Shooter", description: "Terminal telemetry and a ship that zaps your active days, column by column, then starts over.", tags: ["animated", "game", "space"], hue: 262, game: "shooter" },
  { id: "jetrunner", name: "Jet Runner", description: "A jet flies your year as terrain, one bar per week, and collects an orb for every week you were active.", tags: ["animated", "game", "sky"], hue: 18, game: "runner" },
  { id: "playablesignal", name: "Playable Signal", description: "Your contribution days as bricks and a ball clearing them: a tiny arcade cabinet for your activity.", tags: ["animated", "game", "arcade"], hue: 140, game: "signal" }
];
function renderSvg3(spec, profile, config, variant) {
  const look = lookOf(spec.hue, variant, profile);
  const blocks = new Set(config.blocks);
  const days = blocks.has("activity") && profile.contributions ? profile.contributions.days : [];
  const y0 = PAD6;
  let part;
  if (days.length === 0) {
    const name = spec.name.toUpperCase();
    const height2 = 190;
    part = {
      markup: mono(name, PAD6, y0 + 22, look.accent, 'font-size="11.5" font-weight="700" letter-spacing="2"') + telemetry(profile, blocks, look, PAD6, y0 + 52) + sans(blocks.has("activity") ? "Your game appears here" : "Turn on the activity section to play", 360, y0 + 70, look.fg, 'font-size="18" font-weight="700"') + sans(blocks.has("activity") ? "It is played on your contribution calendar, added at your first automatic update." : "The game is drawn from your contribution calendar.", 360, y0 + 94, look.muted, 'font-size="12.5"'),
      css: "",
      height: height2
    };
  } else if (spec.game === "shooter") part = shooter(profile, config, look, days, y0, blocks);
  else if (spec.game === "runner") part = runner(profile, config, look, days, y0, blocks);
  else part = signal(profile, config, look, days, y0, blocks);
  const head = `<text x="${W - PAD6}" y="${y0 + part.height + 8}" text-anchor="end" class="mono" font-size="11" fill="${look.muted}">${xmlEscape(profile.name ?? profile.login)}</text>`;
  const height = y0 + part.height + PAD6 - 6;
  return shell({
    height,
    look,
    variant,
    title: `${spec.name}: ${profile.name ?? profile.login} (@${profile.login}) as a game on their contribution calendar`,
    css: part.css,
    body: part.markup + head,
    glow: [0.5, 1]
  });
}
function templateOf(spec) {
  return {
    id: spec.id,
    name: spec.name,
    description: spec.description,
    tags: spec.tags,
    needsAvatar: false,
    render(profile, config) {
      const assets = variantsFor(config.theme).map((variant) => ({ path: assetPath(spec.id, variant), content: renderSvg3(spec, profile, config, variant) }));
      return { readme: imageReadme(profile, config, spec.id, W, describeProfile(profile, config, `played as ${spec.name.toLowerCase()} on a contribution calendar`, { activity: true })), assets };
    }
  };
}
var arcadeTemplates = SPECS.map(templateOf);

// ../core/src/avatar.ts
var RAMP = " .:-=+*#%@";
var CELL_ASPECT = 0.6;
var OPAQUE_AT = 64;
var TINT_SHARE = 0.03;
var SHARPEN = 1.1;
function gridFromRgba(rgba, width, height) {
  const count = width * height;
  const luma = new Array(count);
  const alpha = new Array(count);
  let tintR = 0;
  let tintG = 0;
  let tintB = 0;
  let tinted = 0;
  for (let i = 0; i < count; i++) {
    const r = rgba[i * 4] ?? 0;
    const g = rgba[i * 4 + 1] ?? 0;
    const b = rgba[i * 4 + 2] ?? 0;
    const a = rgba[i * 4 + 3] ?? 255;
    luma[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    alpha[i] = a;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (a >= 128 && max > 64 && (max - min) / max > 0.35) {
      tintR += r;
      tintG += g;
      tintB += b;
      tinted++;
    }
  }
  const grid = { width, height, luma, alpha };
  if (tinted >= count * TINT_SHARE) {
    grid.tint = [Math.round(tintR / tinted), Math.round(tintG / tinted), Math.round(tintB / tinted)];
  }
  return grid;
}
function percentile(sorted, p) {
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(p * (sorted.length - 1))))] ?? 0;
}
function asciiPortrait(grid, cols, tone) {
  const rows = Math.max(1, Math.round(cols * (grid.height / grid.width) * CELL_ASPECT));
  const cells2 = [];
  for (let row = 0; row < rows; row++) {
    const y0 = Math.floor(row * grid.height / rows);
    const y1 = Math.max(y0 + 1, Math.floor((row + 1) * grid.height / rows));
    for (let col = 0; col < cols; col++) {
      const x0 = Math.floor(col * grid.width / cols);
      const x1 = Math.max(x0 + 1, Math.floor((col + 1) * grid.width / cols));
      let weighted = 0;
      let alphaSum = 0;
      let samples = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const index = y * grid.width + x;
          const a = grid.alpha[index] ?? 0;
          weighted += (grid.luma[index] ?? 0) * a;
          alphaSum += a;
          samples++;
        }
      }
      cells2.push({
        luma: alphaSum > 0 ? weighted / alphaSum : 0,
        opaque: samples > 0 && alphaSum / samples >= OPAQUE_AT
      });
    }
  }
  const sharpened = cells2.map((cell2, index) => {
    if (!cell2.opaque) return cell2.luma;
    const row = Math.floor(index / cols);
    const col = index % cols;
    let sum = 0;
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const r = row + dy;
        const c2 = col + dx;
        if (r < 0 || r >= rows || c2 < 0 || c2 >= cols) continue;
        const neighbour = cells2[r * cols + c2];
        if (neighbour?.opaque) {
          sum += neighbour.luma;
          count++;
        }
      }
    }
    return cell2.luma + SHARPEN * (cell2.luma - sum / count);
  });
  const sorted = sharpened.filter((_luma, index) => cells2[index]?.opaque).sort((a, b) => a - b);
  const low = percentile(sorted, 0.02);
  const high = percentile(sorted, 0.98);
  const span = high - low;
  const last = RAMP.length - 1;
  const lines = [];
  for (let row = 0; row < rows; row++) {
    let line = "";
    for (let col = 0; col < cols; col++) {
      const index = row * cols + col;
      if (!cells2[index]?.opaque) {
        line += " ";
        continue;
      }
      const level = span < 8 ? 0.5 : Math.min(1, Math.max(0, ((sharpened[index] ?? 0) - low) / span)) ** 0.9;
      line += RAMP[Math.round((tone === "dark" ? level : 1 - level) * last)] ?? " ";
    }
    lines.push(line.trimEnd());
  }
  return lines;
}

// ../core/src/templates/showpieces.ts
function fitSize(text10, width, max, min = 18, factor = 0.6) {
  return Math.max(min, Math.min(max, Math.floor(width / (Math.max(text10.length, 1) * factor))));
}
var subline = (profile, config, look) => {
  const parts = [`<tspan fill="${look.muted}">@${xmlEscape(profile.login)}</tspan>`];
  if (config.text.headline) parts.push(`<tspan fill="${look.accent}" font-weight="600">${xmlEscape(truncate(config.text.headline, 46))}</tspan>`);
  return parts.join(`<tspan fill="${look.muted}">  \xB7  </tspan>`);
};
function altFor(profile, config, extra) {
  return describeProfile(profile, config, extra, { activity: true });
}
function build(id, name, description, tags, svg, needsAvatar = true) {
  return {
    id,
    name,
    description,
    tags,
    needsAvatar,
    render(profile, config) {
      const assets = variantsFor(config.theme).map((variant) => ({ path: assetPath(id, variant), content: svg(profile, config, variant) }));
      return { readme: imageReadme(profile, config, id, W, altFor(profile, config)), assets };
    }
  };
}
function cinematicSvg(profile, config, variant) {
  const look = lookOf(232, variant, profile);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const rand = seeded2(`${profile.login}:cinema`);
  const bar = 34;
  const height = 470;
  const stageTop = bar;
  const stageBottom = height - bar;
  let step = 0;
  const next = () => step++ * 0.12;
  const dust = Array.from({ length: 16 }, (_v, i) => {
    const x = rand() * W;
    const y = stageTop + rand() * (stageBottom - stageTop);
    const delay = motion ? ` style="animation-delay:-${(rand() * 14).toFixed(1)}s"` : "";
    return `<circle class="dust" cx="${num4(x)}" cy="${num4(y)}" r="${num4(0.8 + rand() * 1.6)}" fill="${look.fg}" fill-opacity="${num4(0.1 + rand() * 0.25)}"${delay}/>`;
  }).join("");
  const name = profile.name ?? profile.login;
  const fs = fitSize(name, 430, 54, 26);
  const bio = config.text.bio ?? profile.bio;
  let title = `<text x="${PAD6}" y="${stageTop + 124}" font-size="${fs}" font-weight="800" fill="${look.fg}">${xmlEscape(truncate(name, 26))}</text>`;
  title += `<text x="${PAD6}" y="${stageTop + 124 + 30}" font-size="15" xml:space="preserve">${subline(profile, config, look)}</text>`;
  if (bio) wrap(bio, 46, 3).forEach((line, i) => title += sans(line, PAD6, stageTop + 192 + i * 21, look.fg, 'font-size="13.5" fill-opacity="0.78"'));
  title += label2(look, "NOW SHOWING", PAD6, stageTop + 74);
  let widgets = "";
  const rx = 520;
  if (blocks.has("languages") && profile.languages.length > 0) {
    const r = 29;
    const c2 = 2 * Math.PI * r;
    widgets += profile.languages.slice(0, 3).map((language, i) => {
      const cx = rx + 40 + i * 112;
      const cy = stageTop + 84;
      const target = c2 * (1 - language.percent / 100);
      const style = motion ? ` style="--c:${num4(c2)};animation-delay:${(0.4 + i * 0.25).toFixed(2)}s"` : "";
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${look.track}" stroke-width="7"/><circle class="ring" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${i % 2 ? look.accent2 : look.accent}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${num4(c2)}" stroke-dashoffset="${num4(target)}" transform="rotate(-90 ${cx} ${cy})"${style}/>` + mono(`${language.percent}%`, cx, cy + 4, look.fg, 'font-size="12" font-weight="700" text-anchor="middle"') + sans(truncate(language.name, 12), cx, cy + r + 22, look.muted, 'font-size="11.5" text-anchor="middle"');
    }).join("");
  }
  if (blocks.has("activity") && profile.contributions) {
    const weeks = weeklyTotals(profile.contributions.days);
    const peak = Math.max(...weeks, 1);
    const w = 340;
    const h = 64;
    const y0 = stageTop + 190;
    const pts = weeks.map((total, i) => `${i === 0 ? "M" : "L"}${num4(rx + i / Math.max(weeks.length - 1, 1) * w)} ${num4(y0 + h - total / peak * h)}`).join("");
    const month = busiestMonth(profile.contributions.days);
    widgets += label2(look, "ACTIVITY", rx, y0 - 14) + `<path d="${pts}" fill="none" stroke="${look.accent}" stroke-width="2.2" stroke-linejoin="round" pathLength="1"${motion ? ' class="draw"' : ""}/><rect x="${rx}" y="${y0 + h + 1}" width="${w}" height="1" fill="${look.border}"/>` + mono(truncate(`${formatNumber(profile.contributions.total)} contributions${month ? `  \xB7  busiest ${month.name}` : ""}`, 56), rx, y0 + h + 22, look.muted, 'font-size="11.5"');
  }
  if (blocks.has("stats")) {
    const tiles = [[formatNumber(profile.totalStars), "STARS"], [formatNumber(profile.followers), "FOLLOWERS"], [formatNumber(profile.publicRepos), "REPOS"]];
    widgets += tiles.map(([value, caption], i) => {
      const x = rx + i * 116;
      const y = stageBottom - 78;
      return `<rect x="${x}" y="${y}" width="106" height="58" rx="10" fill="${look.panel}" stroke="${look.border}"/>` + sans(value, x + 14, y + 29, look.fg, 'font-size="20" font-weight="800"') + mono(caption, x + 14, y + 47, look.muted, 'font-size="9.5" letter-spacing="1"');
    }).join("");
  }
  const css = riseCss(motion) + (motion ? `.dust{animation:dust 14s linear infinite}@keyframes dust{from{transform:translateY(0)}to{transform:translateY(-46px)}}.ring{animation:ring 1.4s cubic-bezier(.3,.7,.2,1) both}@keyframes ring{from{stroke-dashoffset:var(--c)}}.draw{stroke-dasharray:1;animation:draw 2.4s ease-out .6s both}@keyframes draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}.beam{animation:beam 9s ease-in-out infinite}@keyframes beam{0%{transform:translateX(-260px)}60%,100%{transform:translateX(1000px)}}@media (prefers-reduced-motion:reduce){.dust,.ring,.draw,.beam{animation:none}.draw{stroke-dasharray:none}}` : "");
  const defs = `<linearGradient id="cb" x1="0" x2="1"><stop offset="0" stop-color="${look.fg}" stop-opacity="0"/><stop offset="0.5" stop-color="${look.fg}" stop-opacity="0.07"/><stop offset="1" stop-color="${look.fg}" stop-opacity="0"/></linearGradient>`;
  const letterbox = `<rect width="${W}" height="${bar}" fill="#000"/><rect y="${height - bar}" width="${W}" height="${bar}" fill="#000"/>` + mono(`@${profile.login}`, PAD6, 22, "#9aa3b2", 'font-size="11" letter-spacing="2"') + mono(`github.com/${profile.login}`, W - PAD6, height - 13, "#9aa3b2", 'font-size="11" text-anchor="end"');
  const body = `<clipPath id="stage"><rect y="${stageTop}" width="${W}" height="${stageBottom - stageTop}"/></clipPath><g clip-path="url(#stage)">${dust}<rect class="beam" x="0" y="${stageTop}" width="220" height="${stageBottom - stageTop}" fill="url(#cb)" transform="skewX(-18)"/></g>` + enter(title, motion, next()) + enter(widgets, motion, next()) + letterbox;
  return shell({ height, look, variant, title: `${name} (@${profile.login}) on GitHub`, css, defs, body, radius: 14, glow: [0.15, 0.4] });
}
function wowSvg(profile, config, variant) {
  const look = lookOf(285, variant, profile);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const art = profile.avatar ? asciiPortrait(profile.avatar.grid, 34, variant) : [];
  const artLine = 9.4;
  const artW = art.length > 0 ? 200 : 0;
  const x0 = art.length > 0 ? PAD6 + artW + 40 : PAD6;
  const room = W - PAD6 - x0;
  const word = truncate((profile.name ?? profile.login).toUpperCase(), 18);
  const fs = fitSize(word, room - 24, 76, 28, 0.66);
  const depth = 14;
  const baseY = PAD6 + 40 + fs;
  const layers = Array.from({ length: depth }, (_v, i) => {
    const k = depth - i;
    const shade = variant === "dark" ? `hsl(${285 - k * 2}, 55%, ${14 + (depth - k) * 1.4}%)` : `hsl(${285 - k * 2}, 40%, ${70 - (depth - k) * 2}%)`;
    return `<text x="${num4(x0 + k * 1.15)}" y="${num4(baseY + k * 1.15)}" font-size="${fs}" font-weight="900" fill="${shade}">${xmlEscape(word)}</text>`;
  }).join("");
  const face = `<text x="${x0}" y="${baseY}" font-size="${fs}" font-weight="900" fill="${look.accent}">${xmlEscape(word)}</text><text x="${x0}" y="${baseY}" font-size="${fs}" font-weight="900" fill="none" stroke="${look.fg}" stroke-opacity="0.5" stroke-width="0.8">${xmlEscape(word)}</text>`;
  const wordmark = `<g${motion ? ' class="float"' : ""}>${layers}${face}</g>`;
  let y = baseY + depth + 38;
  let info = `<text x="${x0}" y="${y}" font-size="15" xml:space="preserve">${subline(profile, config, look)}</text>`;
  y += 28;
  const bio = config.text.bio ?? profile.bio;
  if (bio) wrap(bio, Math.floor(room / 7.4), 3).forEach((line) => {
    info += sans(line, x0, y, look.fg, 'font-size="13.5" fill-opacity="0.8"');
    y += 20;
  });
  y += 14;
  if (blocks.has("stats")) {
    const facts = [["STARS", formatNumber(profile.totalStars)], ["FOLLOWERS", formatNumber(profile.followers)], ["REPOSITORIES", formatNumber(profile.publicRepos)]];
    facts.forEach(([k, v], i) => info += mono(k, x0, y + i * 22, look.muted, 'font-size="11" letter-spacing="1.5"') + mono(v, x0 + 130, y + i * 22, look.fg, 'font-size="13" font-weight="700"'));
    y += 3 * 22;
  }
  if (blocks.has("languages") && profile.languages.length > 0) {
    info += mono(truncate(profile.languages.slice(0, 4).map((l) => `${l.name} ${l.percent}%`).join("  \xB7  "), Math.floor(room / 7.2)), x0, y + 6, look.accent2, 'font-size="12"');
    y += 26;
  }
  const artBlock = art.map((line, i) => `<text class="mono" x="${PAD6}" y="${PAD6 + 12 + i * artLine}" font-size="9" fill="${look.accent2}" fill-opacity="0.85" xml:space="preserve">${xmlEscape(line)}</text>`).join("");
  const height = Math.max(PAD6 * 2 + art.length * artLine, y + PAD6 - 6, 300);
  const css = motion ? `.float{animation:float 7s ease-in-out infinite}@keyframes float{50%{transform:translate(3px,-5px)}}@media (prefers-reduced-motion:reduce){.float{animation:none}}` : "";
  return shell({ height, look, variant, title: `${profile.name ?? profile.login} (@${profile.login}) on GitHub`, css, body: artBlock + wordmark + info, glow: [0.7, 0.1] });
}
function signatureSvg(profile, config, variant) {
  const look = lookOf(218, variant, profile);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const name = truncate(profile.name ?? profile.login, 22);
  const fs = fitSize(name, 520, 76, 34, 0.5);
  const hand = "'Segoe Script','Lucida Handwriting','Brush Script MT','Snell Roundhand','Apple Chancery',cursive";
  const baseY = PAD6 + 28 + fs;
  const bio = config.text.bio ?? profile.bio;
  const portraitSize = 46;
  let step = 0;
  const next = () => step++ * 0.12;
  const reveal = motion ? ` clip-path="url(#sig)"` : "";
  let head = portrait(profile, look, W - PAD6 - portraitSize, PAD6 + portraitSize + 6, portraitSize) + `<clipPath id="sig"><rect class="wipe" x="${PAD6 - 6}" y="${PAD6}" width="640" height="${fs + 60}"/></clipPath><text x="${PAD6}" y="${baseY}" font-family="${hand}" font-style="italic" font-size="${fs}" fill="${look.fg}"${reveal}>${xmlEscape(name)}</text><path class="flourish" d="M${PAD6} ${baseY + 16}C${PAD6 + 120} ${baseY + 6} ${PAD6 + 260} ${baseY + 24} ${PAD6 + 420} ${baseY + 10}S${PAD6 + 560} ${baseY + 8} ${PAD6 + 600} ${baseY + 14}" fill="none" stroke="${look.accent}" stroke-width="2.4" stroke-linecap="round" pathLength="1"/>`;
  let y = baseY + 52;
  head += `<text x="${PAD6}" y="${y}" font-size="15" xml:space="preserve">${subline(profile, config, look)}</text>`;
  y += 24;
  if (bio) wrap(bio, 78, 2).forEach((line) => {
    head += sans(line, PAD6, y, look.fg, 'font-size="13.5" fill-opacity="0.78"');
    y += 20;
  });
  y += 14;
  let widgets = "";
  if (blocks.has("stats")) {
    const tiles = [[formatNumber(profile.totalStars), "STARS EARNED"], [formatNumber(profile.followers), "FOLLOWERS"], [formatNumber(profile.publicRepos), "REPOSITORIES"], [formatNumber(profile.following), "FOLLOWING"]];
    const w = (W - PAD6 * 2 - 3 * 14) / 4;
    widgets += tiles.map(([value, caption], i) => {
      const x = PAD6 + i * (w + 14);
      return panel(look, x, y, w, 78) + sans(value, x + 18, y + 40, look.fg, 'font-size="26" font-weight="800"') + mono(caption, x + 18, y + 62, look.muted, 'font-size="10" letter-spacing="1"');
    }).join("");
    y += 78 + 22;
  }
  const half = (W - PAD6 * 2 - 16) / 2;
  const row = y;
  let rowH = 0;
  if (blocks.has("activity") && profile.contributions) {
    const a = profile.contributions;
    const heat = heatStrip(look, a.days, PAD6 + 18, row + 44, half - 36);
    const h = 44 + heat.height + 38;
    widgets += panel(look, PAD6, row, half, h) + label2(look, "ACTIVITY", PAD6 + 18, row + 28) + heat.markup + mono(truncate(`${formatNumber(a.total)} contributions  \xB7  streak ${plural(a.currentStreak, "day")}`, 50), PAD6 + 18, row + 44 + heat.height + 22, look.muted, 'font-size="11.5"');
    rowH = Math.max(rowH, h);
  }
  if (blocks.has("languages") && profile.languages.length > 0) {
    const x = PAD6 + half + 16;
    const bars = langBars(look, profile.languages, x + 18, row + 44, half - 36, 4);
    const h = 44 + bars.height + 16;
    widgets += panel(look, x, row, half, Math.max(h, rowH || h)) + label2(look, "WRITTEN IN", x + 18, row + 28) + bars.markup;
    rowH = Math.max(rowH, h);
  }
  const height = (rowH > 0 ? row + rowH : y - 22 + 0) + PAD6;
  const css = riseCss(motion) + (motion ? `.wipe{animation:wipe 2.2s steps(48,end) both}@keyframes wipe{from{width:0}}.flourish{stroke-dasharray:1;animation:flo 1.4s ease-out 1.8s both}@keyframes flo{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}@media (prefers-reduced-motion:reduce){.wipe,.flourish{animation:none}.flourish{stroke-dasharray:none}}` : "");
  return shell({ height: Math.max(height, 260), look, variant, title: `${profile.name ?? profile.login} (@${profile.login}) on GitHub`, css, body: head + enter(widgets, motion, next()) });
}
function capTipSvg(profile, config, variant) {
  const look = lookOf(48, variant, profile);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const rand = seeded2(`${profile.login}:cap`);
  const cx = W / 2;
  const cy = 168;
  const r = 62;
  const confetti = Array.from({ length: 28 }, (_v, i) => {
    const x = 30 + rand() * (W - 60);
    const y = 20 + rand() * 250;
    const colour = [look.accent, look.accent2, look.fg][i % 3];
    const delay = motion ? ` style="animation-delay:-${(rand() * 8).toFixed(1)}s"` : "";
    return `<rect class="conf" x="${num4(x)}" y="${num4(y)}" width="${num4(4 + rand() * 4)}" height="${num4(2 + rand() * 3)}" rx="1" fill="${colour}" fill-opacity="${num4(0.3 + rand() * 0.4)}" transform="rotate(${num4(rand() * 180)} ${num4(x)} ${num4(y)})"${delay}/>`;
  }).join("");
  const hat = `<g class="cap" style="transform-origin:${cx + 50}px ${cy - r + 6}px"><path d="M${cx - 48} ${cy - r - 4}h96l-8 20q-40 12 -80 0z" fill="${look.panel}" stroke="${look.accent}" stroke-width="2"/><path d="M${cx} ${cy - r - 34}L${cx + 82} ${cy - r - 10}L${cx} ${cy - r + 10}L${cx - 82} ${cy - r - 10}Z" fill="${look.accent}"/><path d="M${cx + 66} ${cy - r - 5}v34" stroke="${look.accent2}" stroke-width="2.4" stroke-linecap="round"/><circle cx="${cx + 66}" cy="${cy - r + 31}" r="4" fill="${look.accent2}"/></g>`;
  const name = truncate(profile.name ?? profile.login, 26);
  const thanks = [];
  if (blocks.has("stats")) {
    if (profile.totalStars > 0) thanks.push(`${formatNumber(profile.totalStars)} ${profile.totalStars === 1 ? "star" : "stars"}`);
    if (profile.followers > 0) thanks.push(`${formatNumber(profile.followers)} ${profile.followers === 1 ? "follower" : "followers"}`);
  }
  const line = thanks.length > 0 ? `Thank you for ${thanks.join(" and ")}` : "Thanks for stopping by";
  let text10 = `<text x="${cx}" y="${cy + r + 52}" text-anchor="middle" font-size="30" font-weight="800" fill="${look.fg}">${xmlEscape(name)}</text><text x="${cx}" y="${cy + r + 76}" text-anchor="middle" font-size="14" fill="${look.muted}">@${xmlEscape(profile.login)}</text><text x="${cx}" y="${cy + r + 112}" text-anchor="middle" font-size="19" font-weight="700" fill="${look.accent}">${xmlEscape(line)}</text>`;
  let height = cy + r + 150;
  if (blocks.has("languages") && profile.languages.length > 0) {
    const chips3 = profile.languages.slice(0, 5).map((l) => `${truncate(l.name, 14)}`);
    const widths = chips3.map((c2) => 26 + c2.length * 7.4);
    const total = widths.reduce((s, w) => s + w, 0) + (chips3.length - 1) * 8;
    let x = cx - total / 2;
    text10 += chips3.map((c2, i) => {
      const w = widths[i];
      const out = `<rect x="${num4(x)}" y="${height - 14}" width="${num4(w)}" height="28" rx="14" fill="${look.panel}" stroke="${look.border}"/>` + sans(c2, x + w / 2, height + 5, look.fg, 'font-size="12.5" text-anchor="middle"');
      x += w + 8;
      return out;
    }).join("");
    height += 44;
  }
  height += PAD6 - 6;
  const css = motion ? `.cap{animation:tip 3.6s ease-in-out infinite}@keyframes tip{0%,55%,100%{transform:rotate(0) translateY(0)}20%{transform:rotate(-16deg) translateY(-6px)}35%{transform:rotate(-16deg) translateY(-6px)}}.conf{animation:fall 8s linear infinite}@keyframes fall{from{transform:translateY(-14px)}to{transform:translateY(14px)}}@media (prefers-reduced-motion:reduce){.cap,.conf{animation:none}}` : "";
  return shell({ height, look, variant, title: `${profile.name ?? profile.login} (@${profile.login}) on GitHub`, css, body: confetti + portrait(profile, look, cx, cy, r) + hat + text10, glow: [0.5, 0.3] });
}
var cinematic = build("cinematic", "Cinematic", "Animated widgets and full motion: a letterboxed title card with rings that fill, a line that draws itself and drifting light.", ["animated", "dark", "widescreen"], cinematicSvg);
var wow = build("wow", "Wow Profile", "Your name as a deep, floating wordmark beside an ASCII portrait made from your own profile picture.", ["dark", "ascii", "wordmark"], wowSvg);
var signature = build("signature", "Signature Profile", "Your name written out by hand, a flourish drawn under it, and your numbers set out like a letterhead.", ["animated", "handwritten", "stats"], signatureSvg);
var captip = build("captip", "Signature Cap Tip", "A thank-you card: your picture with a hat that tips, confetti, and the stars and followers you have been given.", ["animated", "thanks", "playful"], capTipSvg);

// ../core/src/templates/artwork.ts
function build2(id, name, description, tags, svg, needsAvatar) {
  return {
    id,
    name,
    description,
    tags,
    needsAvatar,
    render(profile, config) {
      const assets = variantsFor(config.theme).map((variant) => ({ path: assetPath(id, variant), content: svg(profile, config, variant) }));
      return { readme: imageReadme(profile, config, id, W, describeProfile(profile, config, void 0, { activity: id === "erased" })), assets };
    }
  };
}
function creativeSvg(profile, config, variant) {
  const tint = profile.avatar?.grid.tint;
  const colours = tint ? accentColors(tint, variant) : FALLBACK_ACCENTS[variant];
  const look = lookOf(tint ? 0 : 280, variant, profile);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const rand = seeded2(`${profile.login}:art`);
  const pick = (i) => colours[i % colours.length];
  const art = 340;
  const drift = () => motion ? ` class="dr" style="--dx:${num4((rand() - 0.5) * 36)}px;--dy:${num4((rand() - 0.5) * 28)}px;animation-duration:${num4(14 + rand() * 14)}s"` : "";
  let shapes = "";
  for (let i = 0; i < 7; i++) shapes += `<circle${drift()} cx="${num4(rand() * W)}" cy="${num4(rand() * art)}" r="${num4(50 + rand() * 100)}" fill="${pick(i)}" fill-opacity="${num4(0.28 + rand() * 0.3)}"/>`;
  for (let i = 0; i < 5; i++) {
    const w = 120 + rand() * 150;
    const h = 36 + rand() * 54;
    const x = rand() * (W - w);
    const y = rand() * (art - h);
    shapes += `<rect${drift()} x="${num4(x)}" y="${num4(y)}" width="${num4(w)}" height="${num4(h)}" rx="${num4(h / 2)}" fill="${pick(i + 2)}" fill-opacity="${num4(0.3 + rand() * 0.25)}" transform="rotate(${num4(rand() * 70 - 35)} ${num4(x + w / 2)} ${num4(y + h / 2)})"/>`;
  }
  for (let i = 0; i < 4; i++) {
    const r = 60 + rand() * 90;
    shapes += `<path${drift()} d="M${num4(rand() * W)} ${num4(rand() * art)}a${num4(r)} ${num4(r)} 0 0 1 ${num4(r)} ${num4(-r * 0.6)}" fill="none" stroke="${pick(i + 1)}" stroke-opacity="0.7" stroke-width="${num4(5 + rand() * 9)}" stroke-linecap="round"/>`;
  }
  for (let i = 0; i < 26; i++) shapes += `<circle cx="${num4(rand() * W)}" cy="${num4(rand() * art)}" r="${num4(1 + rand() * 2.2)}" fill="${look.fg}" fill-opacity="${num4(0.25 + rand() * 0.4)}"/>`;
  const name = truncate(profile.name ?? profile.login, 24);
  const fs = fitSize(name, 440, 50, 26, 0.58);
  const bio = config.text.bio ?? profile.bio;
  const tag = config.text.headline ? truncate(config.text.headline, 46) : bio ? truncate(bio, 60) : "";
  const plateH = tag ? 124 : 100;
  let plate = `<rect x="${PAD6}" y="${art - plateH - 24}" width="520" height="${plateH}" rx="20" fill="${look.bg}" fill-opacity="0.78"/>` + sans(name, PAD6 + 26, art - plateH - 24 + 20 + fs, look.fg, `font-size="${fs}" font-weight="800"`) + sans(`@${profile.login}`, PAD6 + 26, art - plateH - 24 + 20 + fs + 26, look.muted, 'font-size="14"');
  if (tag) plate += sans(tag, PAD6 + 26, art - plateH - 24 + 20 + fs + 50, look.fg, 'font-size="13.5" fill-opacity="0.8"');
  let dabs = "";
  if (blocks.has("languages") && profile.languages.length > 0) {
    const shown = profile.languages.slice(0, 4);
    const w = 74 * shown.length + 14;
    dabs += `<rect x="${W - PAD6 - w}" y="${PAD6 - 12}" width="${w}" height="92" rx="18" fill="${look.bg}" fill-opacity="0.72"/>`;
    shown.forEach((l, i) => {
      const cx = W - PAD6 - 44 - i * 74;
      dabs += `<circle cx="${cx}" cy="${PAD6 + 22}" r="${num4(8 + l.percent / 100 * 18)}" fill="${pick(i)}"/>` + mono(truncate(l.name, 9), cx, PAD6 + 58, look.fg, 'font-size="10" text-anchor="middle"') + mono(`${l.percent}%`, cx, PAD6 + 71, look.muted, 'font-size="9.5" text-anchor="middle"');
    });
  }
  let works = "";
  let height = art + 24;
  const repos = blocks.has("projects") ? profile.topRepos.slice(0, 3) : [];
  if (repos.length > 0) {
    const gap = 16;
    const w = (W - PAD6 * 2 - gap * (repos.length - 1)) / repos.length;
    const top = art + 40;
    works += label2(look, "SELECTED WORKS", PAD6, art + 22);
    works += repos.map((repo, i) => {
      const x = PAD6 + i * (w + gap);
      const desc = repo.description ? wrap(repo.description, Math.floor((w - 40) / 6.2), 1)[0] ?? "" : "";
      return `<rect x="${num4(x)}" y="${top}" width="${num4(w)}" height="112" rx="6" fill="${look.panel}" stroke="${pick(i)}" stroke-width="2.5"/><rect x="${num4(x + 7)}" y="${top + 7}" width="${num4(w - 14)}" height="98" rx="3" fill="none" stroke="${look.border}"/><text x="${num4(x + 20)}" y="${top + 38}" font-family="${FONT_SERIF}" font-style="italic" font-size="18" fill="${look.fg}">${xmlEscape(truncate(repo.name, 22))}</text>` + (desc ? sans(desc, x + 20, top + 60, look.muted, 'font-size="12"') : "") + mono(`\u2605 ${formatNumber(repo.stars)}   forks ${formatNumber(repo.forks)}`, x + 20, top + 88, look.fg, 'font-size="11.5"');
    }).join("");
    height = top + 112 + PAD6;
  }
  const css = riseCss(motion) + (motion ? `.dr{animation:dr 20s ease-in-out infinite}@keyframes dr{50%{transform:translate(var(--dx),var(--dy))}}@media (prefers-reduced-motion:reduce){.dr{animation:none}}` : "");
  const body = `<clipPath id="cl"><rect width="${W}" height="${art}"/></clipPath><g clip-path="url(#cl)">${shapes}</g>` + plate + dabs + enter(works, motion, 0.2);
  return shell({ height, look, variant, title: `${profile.name ?? profile.login} (@${profile.login}) on GitHub`, css, body, grid: false, glow: [0.5, 1] });
}
function erasedSvg(profile, config, variant) {
  const look = lookOf(168, variant, profile);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const days = blocks.has("activity") && profile.contributions ? profile.contributions.days : [];
  const { cols, cells: cells2 } = gridOf(days);
  const name = truncate(profile.name ?? profile.login, 20);
  const inner = W - PAD6 * 2;
  const top = PAD6 + 12;
  const step = cols > 0 ? Math.max(5, Math.min(18, Math.floor(inner / cols))) : 15;
  const band = 7 * step;
  const gx = PAD6 + (inner - cols * step) / 2;
  const fs = fitSize(name, inner, Math.floor(band * 1.05), 36, 0.6);
  const total = Math.max(cols * 0.15, 4) + 3;
  let css = riseCss(motion);
  let dots = "";
  let eraser = "";
  if (cols > 0) {
    const radius = [0, 0.3, 0.42, 0.54, 0.66].map((k) => k * step);
    const buckets = /* @__PURE__ */ new Set();
    dots = cells2.map((c2) => {
      const cx = gx + c2.col * step + step / 2;
      const cy = top + c2.row * step + step / 2;
      const r = c2.count === 0 ? step * 0.1 : radius[Math.min(4, Math.max(1, c2.level || 1))] ?? 0.4 * step;
      const fill = c2.count === 0 ? look.fg : c2.level === 4 ? look.accent2 : look.accent;
      buckets.add(c2.col);
      return `<circle${motion ? ` class="e e${c2.col}"` : ""} cx="${num4(cx)}" cy="${num4(cy)}" r="${num4(r)}" fill="${fill}" fill-opacity="${c2.count === 0 ? 0.25 : 0.95}"/>`;
    }).join("");
    if (motion) {
      css += `.e{animation-duration:${num4(total)}s;animation-iteration-count:infinite;animation-timing-function:linear}`;
      for (const col of [...buckets].sort((a, b) => a - b)) {
        const f = num4(zapFraction(col, cols) * 100);
        css += `@keyframes er${col}{0%,${f}%{opacity:1}${num4(Number(f) + 0.01)}%,99.9%{opacity:0}100%{opacity:1}}.e${col}{animation-name:er${col}}`;
      }
      css += `.er{animation:erase ${num4(total)}s linear infinite}@keyframes erase{0%{transform:translateX(0)}88%{transform:translateX(${num4(cols * step)}px)}100%{transform:translateX(0)}}`;
      css += `@media (prefers-reduced-motion:reduce){.e,.er{animation:none!important}}`;
      eraser = `<rect class="er" x="${num4(gx - step * 1.2)}" y="${top - 8}" width="${num4(step * 1.4)}" height="${band + 16}" rx="5" fill="${look.fg}" fill-opacity="0.9"/>`;
    }
  }
  const baseline = top + band * 0.5 + fs * 0.36;
  const big = `<text x="${W / 2}" y="${num4(baseline)}" text-anchor="middle" font-size="${fs}" font-weight="900" fill="${look.fg}" fill-opacity="${cols > 0 ? 0.92 : 1}">${xmlEscape(name)}</text>`;
  let y = top + band + 44;
  let info = sans(name, PAD6, y, look.fg, 'font-size="22" font-weight="800"');
  info += `<text x="${PAD6}" y="${y + 24}" font-size="14" xml:space="preserve"><tspan fill="${look.muted}">@${xmlEscape(profile.login)}</tspan>${config.text.headline ? `<tspan fill="${look.muted}">  \xB7  </tspan><tspan fill="${look.accent}" font-weight="600">${xmlEscape(truncate(config.text.headline, 46))}</tspan>` : ""}</text>`;
  y += 24;
  const bio = config.text.bio ?? profile.bio;
  if (bio) {
    info += sans(truncate(bio, 84), PAD6, y + 24, look.fg, 'font-size="13.5" fill-opacity="0.78"');
    y += 24;
  }
  if (blocks.has("stats")) {
    const facts = [`${formatNumber(profile.totalStars)} stars`, `${formatNumber(profile.followers)} followers`, `${formatNumber(profile.publicRepos)} repos`];
    if (profile.contributions && blocks.has("activity")) facts.push(`${formatNumber(profile.contributions.total)} contributions`);
    info += mono(facts.join("   \xB7   "), PAD6, y + 30, look.muted, 'font-size="12.5"');
    y += 30;
  }
  if (cols === 0) {
    info += mono(blocks.has("activity") ? "Your contribution dots appear here after the first automatic update." : "Turn on the activity section to see your contribution dots.", PAD6, y + 28, look.muted, 'font-size="11.5"');
    y += 28;
  }
  return shell({ height: y + PAD6, look, variant, title: `${profile.name ?? profile.login} (@${profile.login}) on GitHub`, css, body: big + dots + eraser + enter(info, motion, 0.15), glow: [0.5, 0.2] });
}
var creative = build2("creative", "Creative Portfolio", "Colourful work with a point of view: generative art drawn from your own picture\u2019s colours, with your projects framed beneath it.", ["art", "colourful", "portfolio"], creativeSvg, true);
var erased = build2("erased", "Erased", "Expressive contribution activity: a field of dots, one for each day, wiped away by an eraser to reveal your name.", ["animated", "dots", "expressive"], erasedSvg, false);

// ../core/src/templates/make.ts
function imageTemplate(id, name, description, tags, svg, options = {}) {
  return {
    id,
    name,
    description,
    tags,
    needsAvatar: options.needsAvatar ?? true,
    render(profile, config) {
      const assets = variantsFor(config.theme).map((variant) => ({ path: assetPath(id, variant), content: svg(profile, config, variant) }));
      const alt = describeProfile(profile, config, options.extra?.(profile, config), { activity: options.activity ?? false });
      return { readme: imageReadme(profile, config, id, W, alt), assets };
    }
  };
}
function svgDoc(d) {
  const r = d.radius ?? 14;
  const height = Math.ceil(d.height);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${height}" viewBox="0 0 ${W} ${height}" role="img" aria-labelledby="t">
<title id="t">${xmlEscape(d.title)}</title>
<defs>
${d.defs ?? ""}
</defs>
<style>
text{font-family:${FONT_SANS}}
.mono{font-family:${FONT2}}
.serif{font-family:${FONT_SERIF}}
${d.css ?? ""}
</style>
<rect width="${W}" height="${height}" rx="${r}" fill="${d.bg}"/>
${d.body}
${d.stroke ? `<rect x="0.5" y="0.5" width="${W - 1}" height="${height - 1}" rx="${r}" fill="none" stroke="${d.stroke}"/>` : ""}
</svg>
`;
}
function hashOf(text10) {
  let h = 2166136261;
  for (const ch of text10) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h;
}
function langColor(name, variant) {
  return hslToHex(hashOf(name.toLowerCase()) % 360, 0.62, variant === "dark" ? 0.6 : 0.42);
}
function isoDate(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}
var initialOf = (profile) => [...profile.name ?? profile.login][0]?.toUpperCase() ?? "?";
function pictureBox(profile, fill, ink, x, y, w, h, rx, id) {
  const uri = profile.avatar?.dataUri;
  if (uri && SAFE_DATA_URI.test(uri)) {
    return `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/></clipPath><image href="${uri}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>`;
  }
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/><text x="${x + w / 2}" y="${y + h / 2 + Math.min(w, h) * 0.17}" text-anchor="middle" font-size="${Math.round(Math.min(w, h) * 0.5)}" font-weight="800" fill="${ink}">${xmlEscape(initialOf(profile))}</text>`;
}
function yearsBetween(from, to) {
  if (!from || !to) return null;
  const a = Date.parse(from);
  const b = Date.parse(to);
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return null;
  return Math.floor((b - a) / (365.25 * 864e5));
}

// ../core/src/templates/interfaces.ts
var hueFor = (profile, fallback) => hueOf(profile.avatar?.grid.tint) ?? fallback;
var text = (value, x, y, size, fill, extra = "") => `<text x="${num4(x)}" y="${num4(y)}" font-size="${size}" fill="${fill}" ${extra}>${xmlEscape(value)}</text>`;
function isFresh(repo, fetchedAt) {
  if (!repo.pushedAt || !fetchedAt) return false;
  const pushed = Date.parse(repo.pushedAt);
  const read = Date.parse(fetchedAt);
  if (Number.isNaN(pushed) || Number.isNaN(read) || pushed > read) return false;
  return read - pushed <= ACTIVE_WINDOW_DAYS * 864e5;
}
function playerSvg(profile, config, variant) {
  const dark = variant === "dark";
  const hue = hueFor(profile, 300);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const bg = dark ? hslToHex(hue, 0.45, 0.09) : hslToHex(hue, 0.5, 0.93);
  const card2 = dark ? hslToHex(hue, 0.35, 0.14) : "#ffffff";
  const ink = dark ? "#f3eefc" : "#231a33";
  const muted = dark ? "#a99fc0" : "#7c7192";
  const accent2 = hslToHex(hue, 0.8, dark ? 0.66 : 0.5);
  const name = profile.name ?? profile.login;
  const tracks = blocks.has("projects") ? profile.topRepos.slice(0, 5) : [];
  const weeks = blocks.has("activity") && profile.contributions ? recentWeeks(profile.contributions.days, 26) : [];
  const listTop = weeks.length > 0 ? 248 : 160;
  const height = Math.max(420, listTop + Math.max(tracks.length, 1) * 36 + 40);
  let body = `<rect x="22" y="22" width="856" height="${height - 44}" rx="18" fill="${card2}"/>`;
  const discX = 200;
  const discY = 190;
  let disc = `<g class="spin"><circle cx="${discX + 64}" cy="${discY}" r="112" fill="${dark ? "#08060d" : "#22192f"}"/>`;
  for (const r of [100, 88, 76, 64]) disc += `<circle cx="${discX + 64}" cy="${discY}" r="${r}" fill="none" stroke="#ffffff" stroke-opacity="0.07"/>`;
  disc += `<circle cx="${discX + 64}" cy="${discY}" r="34" fill="${accent2}"/><circle cx="${discX + 64}" cy="${discY}" r="5" fill="${card2}"/>`;
  disc += `<path d="M${discX + 64} ${discY - 34}a34 34 0 0 1 34 34" fill="none" stroke="#ffffff" stroke-opacity="0.45" stroke-width="2"/></g>`;
  body += disc;
  body += `<rect x="50" y="68" width="244" height="244" rx="14" fill="${accent2}" fill-opacity="0.35"/>`;
  body += pictureBox(profile, accent2, card2, 54, 72, 236, 236, 12, "np");
  if (blocks.has("stats")) body += text(`\u2665  ${formatNumber(profile.followers)} followers`, 54, 348, 14, ink, 'font-weight="700"');
  const cy = 378;
  body += `<g fill="${ink}"><path d="M120 ${cy - 9}v18l-14-9zM106 ${cy - 9}v18" stroke="${ink}" stroke-width="2.5"/>`;
  body += `<circle cx="172" cy="${cy}" r="18" fill="${accent2}"/><path d="M167 ${cy - 8}l14 8l-14 8z" fill="${card2}"/>`;
  body += `<path d="M224 ${cy - 9}v18l14-9zM238 ${cy - 9}v18" stroke="${ink}" stroke-width="2.5"/></g>`;
  body += text("NOW PLAYING", 384, 66, 11, accent2, 'letter-spacing="3.4" font-weight="800"');
  body += text(truncate(name, 22), 384, 104, 32, ink, 'font-weight="800"');
  body += text(`@${truncate(profile.login, 28)}`, 384, 128, 14, muted, 'class="mono"');
  let y = 152;
  if (weeks.length > 0) {
    const peak = Math.max(...weeks, 1);
    const bw = 10;
    weeks.forEach((count, i) => {
      const h = Math.max(3, count / peak * 46);
      const delay = (i * 0.13 % 1.1).toFixed(2);
      body += `<rect class="eq" style="animation-delay:${delay}s" x="${384 + i * (bw + 7)}" y="${num4(y + 52 - h)}" width="${bw}" height="${num4(h)}" rx="3" fill="${accent2}" fill-opacity="${num4(0.4 + count / peak * 0.6)}"/>`;
    });
    body += text(`${plural(profile.contributions.activeDays, "active day")} this year`, 384, y + 74, 11.5, muted, 'class="mono"');
  }
  y = listTop;
  if (tracks.length === 0) body += text(blocks.has("projects") ? "No tracks yet." : "The projects section is switched off.", 384, y + 22, 14, muted, 'font-style="italic"');
  tracks.forEach((repo, i) => {
    const ty = y + i * 36;
    body += `<path d="M384 ${ty + 28}H850" stroke="${ink}" stroke-opacity="0.08"/>`;
    body += i === 0 ? `<path d="M386 ${ty + 6}l11 6l-11 6z" fill="${accent2}"/>` : text(String(i + 1), 386, ty + 18, 13, muted, 'class="mono"');
    body += text(truncate(repo.name, 24), 412, ty + 18, 15, i === 0 ? accent2 : ink, 'font-weight="700"');
    if (repo.language) body += text(truncate(repo.language, 14), 660, ty + 18, 12.5, muted);
    body += text(`\u2605 ${formatNumber(repo.stars)}`, 850, ty + 18, 13, ink, 'class="mono" text-anchor="end" font-weight="700"');
  });
  const css = riseCss(motion) + (motion ? `.spin{transform-origin:${discX + 64}px ${discY}px;animation:spin 9s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.eq{transform-box:fill-box;transform-origin:bottom;animation:eq 1.1s ease-in-out infinite alternate}@keyframes eq{from{transform:scaleY(.45)}to{transform:scaleY(1)}}@media (prefers-reduced-motion:reduce){.spin,.eq{animation:none}}` : "");
  return svgDoc({ height, title: `${name} on GitHub, as a music player`, bg, radius: 18, css, body: rise(body, motion, 0.05) });
}
var player = imageTemplate(
  "player",
  "Now playing",
  "A music player: your photo as the cover, repositories as tracks and your weeks as an equaliser.",
  ["creative", "interface", "fun"],
  playerSvg,
  { extra: () => "shown as a music player with repositories as tracks" }
);
function inboxSvg(profile, config, variant) {
  const dark = variant === "dark";
  const hue = hueFor(profile, 212);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const bg = dark ? "#14161b" : "#e9ecf1";
  const win = dark ? "#1b1e25" : "#ffffff";
  const side = dark ? "#171a20" : "#f4f6f9";
  const ink = dark ? "#e8eaf0" : "#1d2330";
  const muted = dark ? "#8b93a3" : "#6c7587";
  const line = dark ? "#2a2f39" : "#e3e7ee";
  const accent2 = hslToHex(hue, 0.75, dark ? 0.64 : 0.46);
  const name = profile.name ?? profile.login;
  const mails = blocks.has("projects") ? profile.topRepos.slice(0, 5) : [];
  const unread = mails.filter((r) => isFresh(r, profile.fetchedAt)).length;
  const rowH = 62;
  const top = 84;
  const height = Math.max(400, top + Math.max(mails.length, 1) * rowH + 40);
  let body = `<rect x="22" y="22" width="856" height="${height - 44}" rx="12" fill="${win}" stroke="${line}"/>`;
  body += `<rect x="22" y="22" width="856" height="50" rx="12" fill="${side}"/><rect x="22" y="56" width="856" height="16" fill="${side}"/><path d="M22 72H878" stroke="${line}"/>`;
  body += `<circle cx="46" cy="47" r="5" fill="#ff5f57"/><circle cx="64" cy="47" r="5" fill="#febc2e"/><circle cx="82" cy="47" r="5" fill="#28c840"/>`;
  body += `<rect x="300" y="33" width="300" height="28" rx="14" fill="${bg}"/>`;
  body += text(`Search in @${truncate(profile.login, 24)}`, 320, 52, 12.5, muted);
  body += pictureBox(profile, accent2, win, 832, 36, 28, 28, 14, "ib");
  body += `<rect x="22" y="72" width="170" height="${height - 94}" fill="${side}"/><rect x="22" y="${height - 34}" width="170" height="12" rx="12" fill="${side}"/><path d="M192 72V${height - 22}" stroke="${line}"/>`;
  const folders = [["Inbox", unread > 0 ? String(unread) : ""]];
  if (blocks.has("stats")) folders.push(["Starred", formatNumber(profile.totalStars)], ["Followers", formatNumber(profile.followers)], ["Repositories", formatNumber(profile.publicRepos)]);
  if (blocks.has("languages") && profile.languages.length > 0) folders.push(["Languages", String(profile.languages.length)]);
  folders.forEach(([label4, count], i) => {
    const fy = 92 + i * 36;
    if (i === 0) body += `<rect x="32" y="${fy - 2}" width="150" height="30" rx="8" fill="${accent2}" fill-opacity="0.16"/>`;
    body += text(label4, 48, fy + 18, 13.5, i === 0 ? accent2 : ink, `font-weight="${i === 0 ? 800 : 500}"`);
    if (count) body += text(count, 172, fy + 18, 12, i === 0 ? accent2 : muted, 'class="mono" text-anchor="end" font-weight="700"');
  });
  if (mails.length === 0) body += text(blocks.has("projects") ? "No messages." : "The projects section is switched off.", 220, top + 30, 14, muted, 'font-style="italic"');
  mails.forEach((repo, i) => {
    const my2 = top + i * rowH;
    const fresh = isFresh(repo, profile.fetchedAt);
    if (i === 0) body += `<rect x="193" y="${my2}" width="403" height="${rowH}" fill="${accent2}" fill-opacity="0.09"/>`;
    body += `<path d="M193 ${my2 + rowH}H596" stroke="${line}"/>`;
    if (fresh) body += `<circle cx="209" cy="${my2 + 24}" r="4.5" fill="${accent2}"/>`;
    body += text(truncate(repo.language ?? "Repository", 18), 224, my2 + 24, 13, ink, `font-weight="${fresh ? 800 : 600}"`);
    const ago = repo.pushedAt && profile.fetchedAt ? timeAgo(repo.pushedAt, profile.fetchedAt) : null;
    if (ago) body += text(ago, 584, my2 + 24, 11.5, muted, 'text-anchor="end"');
    body += text(truncate(repo.name, 34), 224, my2 + 42, 13, fresh ? ink : muted, `font-weight="${fresh ? 700 : 500}"`);
    if (repo.description) body += text(truncate(repo.description, 44), 224, my2 + 57 - 2, 11.5, muted);
  });
  const px = 620;
  body += `<path d="M596 72V${height - 22}" stroke="${line}"/>`;
  body += text(`About ${truncate(name, 20)}`, px, 108, 17, ink, 'font-weight="800"');
  body += text(`@${truncate(profile.login, 26)}`, px, 130, 12.5, accent2, 'class="mono"');
  const bio = config.text.bio ?? profile.bio;
  const lines = bio ? wrap(bio, 34, 7) : ["This profile has no bio."];
  lines.forEach((part, i) => {
    body += text(part, px, 164 + i * 20, 13.5, bio ? ink : muted, bio ? "" : 'font-style="italic"');
  });
  let my = 164 + lines.length * 20 + 14;
  const facts = [];
  if (profile.location) facts.push(`Location: ${truncate(profile.location, 24)}`);
  const joined3 = isoDate(profile.createdAt);
  if (joined3) facts.push(`Member since ${joined3}`);
  for (const fact2 of facts) {
    body += text(fact2, px, my, 12.5, muted);
    my += 20;
  }
  const css = riseCss(motion);
  return svgDoc({ height, title: `${name} on GitHub, as an inbox`, bg, radius: 14, css, body: rise(body, motion, 0.05) });
}
var inbox = imageTemplate(
  "inbox",
  "Inbox",
  "A mail client: each repository is a message, unread when it was pushed to recently.",
  ["creative", "interface", "projects"],
  inboxSvg,
  { extra: () => "shown as a mail inbox with repositories as messages" }
);
function retroWindow(x, y, w, h, title, face, titleA, titleB) {
  let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${face}" stroke="#000"/>`;
  out += `<path d="M${x + 1} ${y + h - 1}V${y + 1}H${x + w - 1}" fill="none" stroke="#ffffff"/><path d="M${x + w - 1} ${y + 1}V${y + h - 1}H${x + 1}" fill="none" stroke="#7b7b7b"/>`;
  out += `<defs><linearGradient id="tb${x}${y}" x1="0" x2="1"><stop offset="0" stop-color="${titleA}"/><stop offset="1" stop-color="${titleB}"/></linearGradient></defs>`;
  out += `<rect x="${x + 3}" y="${y + 3}" width="${w - 6}" height="20" fill="url(#tb${x}${y})"/>`;
  out += text(truncate(title, Math.floor((w - 50) / 7.4)), x + 9, y + 18, 12.5, "#ffffff", 'font-weight="700"');
  out += `<rect x="${x + w - 22}" y="${y + 5}" width="16" height="16" fill="${face}" stroke="#000"/>` + text("\xD7", x + w - 17, y + 18, 14, "#000", 'font-weight="700"');
  return out;
}
function desktopSvg(profile, config, variant) {
  const dark = variant === "dark";
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const bg = dark ? "#0c3b3b" : "#008080";
  const face = dark ? "#a8a8a8" : "#c0c0c0";
  const titleA = dark ? "#0a0a60" : "#000080";
  const titleB = dark ? "#3565a8" : "#1084d0";
  const name = profile.name ?? profile.login;
  const bio = config.text.bio ?? profile.bio;
  const repos = blocks.has("projects") ? profile.topRepos.slice(0, 5) : [];
  const weeks = blocks.has("activity") && profile.contributions ? recentWeeks(profile.contributions.days, 30) : [];
  const height = 500;
  let body = "";
  repos.forEach((repo, i) => {
    const x = 40;
    const y = 36 + i * 82;
    body += `<path d="M${x} ${y + 8}h14l4 5h22v26h-40z" fill="#f4d34a" stroke="#000"/><path d="M${x + 1} ${y + 17}h38" stroke="#fff3b0"/>`;
    body += text(truncate(repo.name, 13), x + 20, y + 58, 11.5, "#ffffff", 'text-anchor="middle" font-weight="600"');
  });
  body += retroWindow(150, 30, 400, 230, `About ${truncate(profile.login, 18)}.txt - Notepad`, face, titleA, titleB);
  body += `<rect x="156" y="52" width="388" height="200" fill="#ffffff" stroke="#7b7b7b"/>`;
  const lines = [[name, 'font-weight="800"'], [`@${profile.login}`, ""]];
  if (profile.location) lines.push([`Location: ${truncate(profile.location, 30)}`, ""]);
  const joined3 = isoDate(profile.createdAt);
  if (joined3) lines.push([`Member since: ${joined3}`, ""]);
  if (blocks.has("stats")) lines.push([`${formatNumber(profile.followers)} followers, ${formatNumber(profile.totalStars)} stars`, ""]);
  for (const part of bio ? wrap(bio, 46, 3) : []) lines.push([part, 'font-style="italic"']);
  lines.slice(0, 9).forEach(([value, extra], i) => {
    body += text(value, 166, 74 + i * 20, 13.5, "#000", `class="mono" ${extra}`);
  });
  body += retroWindow(590, 80, 280, 250, "Languages.exe", face, titleA, titleB);
  body += `<rect x="596" y="102" width="268" height="222" fill="${face}"/>`;
  const langs = blocks.has("languages") ? profile.languages.slice(0, 5) : [];
  if (langs.length === 0) body += text(blocks.has("languages") ? "Nothing to show." : "Switched off.", 610, 130, 13, "#000", 'class="mono"');
  langs.forEach((lang, i) => {
    const y = 120 + i * 40;
    body += text(`${truncate(lang.name, 12)}  ${Math.round(lang.percent)}%`, 610, y + 4, 12.5, "#000", 'class="mono"');
    body += `<rect x="610" y="${y + 10}" width="240" height="16" fill="#ffffff" stroke="#7b7b7b"/>`;
    const cells2 = Math.max(1, Math.round(lang.percent / 100 * 20));
    for (let c2 = 0; c2 < cells2; c2++) body += `<rect x="${612 + c2 * 11.8}" y="${y + 12}" width="9" height="12" fill="${langColor(lang.name, variant)}"/>`;
  });
  if (weeks.length > 0) {
    body += retroWindow(150, 290, 400, 150, "Activity.exe", face, titleA, titleB);
    body += `<rect x="156" y="312" width="388" height="122" fill="#000"/>`;
    const peak = Math.max(...weeks, 1);
    weeks.forEach((count, i) => {
      const h = Math.max(2, count / peak * 90);
      body += `<rect x="${164 + i * 12.4}" y="${num4(424 - h)}" width="9" height="${num4(h)}" fill="#33ff33"/>`;
    });
    body += text(`last ${weeks.length} weeks`, 166, 328, 11, "#33ff33", 'class="mono"');
  }
  const bar = height - 36;
  body += `<rect x="0" y="${bar}" width="${W}" height="36" fill="${face}"/><path d="M0 ${bar + 1}H${W}" stroke="#fff"/>`;
  body += `<rect x="6" y="${bar + 5}" width="82" height="26" fill="${face}" stroke="#000"/>` + text("Start", 36, bar + 24, 14, "#000", 'font-weight="800"');
  body += `<path d="M12 ${bar + 11}h8v8h-8zM22 ${bar + 11}h8v8h-8zM12 ${bar + 21}h8v8h-8zM22 ${bar + 21}h8v8h-8z" fill="#e0412e"/>`;
  body += `<rect x="98" y="${bar + 5}" width="170" height="26" fill="${dark ? "#8c8c8c" : "#dcdcdc"}" stroke="#000"/>` + text(truncate(`About ${profile.login}.txt`, 22), 108, bar + 23, 12, "#000");
  const clock = profile.fetchedAt && !Number.isNaN(Date.parse(profile.fetchedAt)) ? new Date(profile.fetchedAt).toISOString().slice(11, 16) : "";
  if (clock) {
    body += `<rect x="${W - 98}" y="${bar + 5}" width="90" height="26" fill="${face}" stroke="#7b7b7b"/>` + text(`${clock} UTC`, W - 53, bar + 23, 12, "#000", 'class="mono" text-anchor="middle"');
  }
  return svgDoc({ height, title: `${name} on GitHub, as a retro desktop`, bg, radius: 12, css: riseCss(motion), body: rise(body, motion, 0.05) });
}
var desktop = imageTemplate(
  "desktop",
  "Retro desktop",
  "A 90s desktop: a folder for each repository, a notepad about you and a taskbar.",
  ["creative", "interface", "fun"],
  desktopSvg,
  { extra: () => "shown as a retro computer desktop with folders for repositories" }
);
var SWEEP = 120;
var DECADES = 6;
function dialFraction(value) {
  if (!Number.isFinite(value) || value < 1) return 0;
  return Math.min(1, Math.log10(value) / DECADES);
}
var polar = (cx, cy, r, deg) => [cx + r * Math.sin(deg * Math.PI / 180), cy - r * Math.cos(deg * Math.PI / 180)];
var arc = (cx, cy, r, from, to) => {
  const [x1, y1] = polar(cx, cy, r, from);
  const [x2, y2] = polar(cx, cy, r, to);
  return `M${num4(x1)} ${num4(y1)}A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${num4(x2)} ${num4(y2)}`;
};
function cockpitSvg(profile, config, variant) {
  const dark = variant === "dark";
  const hue = hueFor(profile, 150);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const bg = dark ? "#0d0f10" : "#d6d9d7";
  const panel2 = dark ? "#171a1b" : "#eef0ee";
  const face = dark ? "#0a0c0d" : "#ffffff";
  const ink = dark ? "#e6ece8" : "#1a201d";
  const muted = dark ? "#7e8a84" : "#69756e";
  const accent2 = hslToHex(hue, 0.8, dark ? 0.58 : 0.38);
  const warn = hslToHex((hue + 150) % 360, 0.85, dark ? 0.6 : 0.42);
  const name = profile.name ?? profile.login;
  const dials = [];
  if (blocks.has("stats")) dials.push(["STARS", profile.totalStars], ["FOLLOWERS", profile.followers], ["REPOSITORIES", profile.publicRepos]);
  if (blocks.has("activity") && profile.contributions) dials.push(["CONTRIBUTIONS", profile.contributions.total]);
  else if (blocks.has("stats") && profile.totalForks !== void 0) dials.push(["FORKS", profile.totalForks]);
  const langs = blocks.has("languages") ? profile.languages.slice(0, 5) : [];
  const height = 410;
  let body = `<rect x="18" y="18" width="864" height="${height - 36}" rx="16" fill="${panel2}" stroke="${muted}" stroke-opacity="0.4"/>`;
  for (const [x, y] of [[34, 34], [866, 34], [34, height - 34], [866, height - 34]]) body += `<circle cx="${x}" cy="${y}" r="4" fill="${muted}" fill-opacity="0.5"/>`;
  body += text(truncate(name, 28).toUpperCase(), 60, 58, 14, ink, 'letter-spacing="4" font-weight="800"');
  body += text(`@${profile.login}`, 840, 58, 13, muted, 'class="mono" text-anchor="end"');
  if (dials.length === 0) body += text("All the dials are switched off.", 60, 160, 15, muted, 'font-style="italic"');
  const r = 86;
  dials.forEach(([label4, value], i) => {
    const cx = 450 + (i - (dials.length - 1) / 2) * 212;
    const cy = 176;
    const frac = dialFraction(value);
    body += `<circle cx="${cx}" cy="${cy}" r="${r + 12}" fill="${face}" stroke="${muted}" stroke-opacity="0.55" stroke-width="3"/>`;
    body += `<path d="${arc(cx, cy, r - 6, -SWEEP, SWEEP)}" fill="none" stroke="${muted}" stroke-opacity="0.25" stroke-width="8" stroke-linecap="round"/>`;
    if (frac > 0) body += `<path d="${arc(cx, cy, r - 6, -SWEEP, -SWEEP + frac * 2 * SWEEP)}" fill="none" stroke="${accent2}" stroke-width="8" stroke-linecap="round"/>`;
    for (let d = 0; d <= DECADES; d++) {
      const deg = -SWEEP + d / DECADES * 2 * SWEEP;
      const [x1, y1] = polar(cx, cy, r - 17, deg);
      const [x2, y2] = polar(cx, cy, r - 26, deg);
      const [lx, ly] = polar(cx, cy, r - 38, deg);
      body += `<path d="M${num4(x1)} ${num4(y1)}L${num4(x2)} ${num4(y2)}" stroke="${muted}" stroke-width="2"/>`;
      body += text(["0", "10", "100", "1k", "10k", "100k", "1M"][d], lx, ly + 3.5, 9.5, muted, 'class="mono" text-anchor="middle"');
    }
    const needle = -SWEEP + frac * 2 * SWEEP;
    body += `<g class="needle" style="transform:rotate(${num4(needle)}deg);transform-origin:${cx}px ${cy}px"><path d="M${cx} ${cy + 12}L${cx} ${cy - r + 22}" stroke="${warn}" stroke-width="3.5" stroke-linecap="round"/></g>`;
    body += `<circle cx="${cx}" cy="${cy}" r="9" fill="${ink}"/><circle cx="${cx}" cy="${cy}" r="3.5" fill="${face}"/>`;
    body += `<rect x="${cx - 52}" y="${cy + 38}" width="104" height="28" rx="5" fill="${face}" stroke="${muted}" stroke-opacity="0.5"/>`;
    body += text(formatNumber(value), cx, cy + 58, 17, accent2, 'class="mono" text-anchor="middle" font-weight="800"');
    body += text(label4, cx, cy + 118, 11, muted, 'text-anchor="middle" letter-spacing="3" font-weight="800"');
  });
  if (dials.length > 0) body += text("LOG SCALE: EACH TICK IS TEN TIMES THE LAST", 450, 322, 9.5, muted, 'class="mono" text-anchor="middle" letter-spacing="2"');
  langs.forEach((lang, i) => {
    const x = 450 + (i - (langs.length - 1) / 2) * 164;
    const color = langColor(lang.name, variant);
    body += `<rect x="${x - 74}" y="340" width="148" height="34" rx="17" fill="${face}" stroke="${color}" stroke-opacity="0.7"/>`;
    body += `<circle cx="${x - 54}" cy="357" r="6" fill="${color}"/>`;
    body += text(truncate(lang.name, 10), x - 40, 362, 12.5, ink, 'font-weight="700"');
    body += text(`${Math.round(lang.percent)}%`, x + 64, 362, 11.5, muted, 'class="mono" text-anchor="end"');
  });
  const css = riseCss(motion) + (motion ? `.needle{animation:sweep 1.8s cubic-bezier(.2,.8,.2,1) both}@keyframes sweep{from{transform:rotate(-${SWEEP}deg)}}@media (prefers-reduced-motion:reduce){.needle{animation:none}}` : "");
  return svgDoc({ height, title: `${name} on GitHub, as a cockpit panel`, bg, radius: 16, css, body: rise(body, motion, 0.05) });
}
var cockpit = imageTemplate(
  "cockpit",
  "Cockpit",
  "Dial gauges with sweeping needles for stars, followers, repositories and contributions.",
  ["creative", "interface", "stats"],
  cockpitSvg,
  { activity: false, extra: () => "shown as cockpit dials on a logarithmic scale" }
);
var interfaceTemplates = [player, inbox, desktop, cockpit];

// ../core/src/templates/worlds.ts
var hueFor2 = (profile, fallback) => hueOf(profile.avatar?.grid.tint) ?? fallback;
var text2 = (value, x, y, size, fill, extra = "") => `<text x="${num4(x)}" y="${num4(y)}" font-size="${size}" fill="${fill}" ${extra}>${xmlEscape(value)}</text>`;
function repositories(count) {
  return `${formatNumber(count)} ${count === 1 ? "repository" : "repositories"}`;
}
function starScale(stars3) {
  if (!(stars3 > 0)) return 0;
  return Math.min(1, Math.log10(stars3 + 1) / 4);
}
function ringValues(contributions) {
  if (!contributions || contributions.days.length === 0) return [];
  const clamp = (n) => Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
  const recent = contributions.days.slice(-30);
  const active30 = recent.filter((d) => d.count > 0).length;
  return [
    { label: "STREAK", fraction: clamp(contributions.longestStreak > 0 ? contributions.currentStreak / contributions.longestStreak : 0), caption: `${contributions.currentStreak} of ${contributions.longestStreak} days, the best streak` },
    { label: "ACTIVE DAYS", fraction: clamp(contributions.activeDays / contributions.days.length), caption: `${contributions.activeDays} of ${contributions.days.length} days` },
    { label: "LAST 30 DAYS", fraction: clamp(active30 / Math.max(1, recent.length)), caption: `${active30} of ${recent.length} days` }
  ];
}
function ringsSvg(profile, config, variant) {
  const dark = variant === "dark";
  const hue = hueFor2(profile, 340);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const bg = dark ? "#000000" : "#f2f2f7";
  const ink = dark ? "#ffffff" : "#111114";
  const muted = dark ? "#8e8e99" : "#6c6c78";
  const name = profile.name ?? profile.login;
  const rings2 = blocks.has("activity") ? ringValues(profile.contributions) : [];
  const colors = [0, 120, 200].map((offset) => hslToHex((hue + offset) % 360, 0.95, dark ? 0.55 : 0.5));
  const cx = 270;
  const cy = 215;
  const radii = [150, 114, 78];
  const height = 430;
  let body = "";
  radii.forEach((r, i) => {
    body += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${colors[i]}" stroke-opacity="0.2" stroke-width="28"/>`;
    const ring = rings2[i];
    if (ring && ring.fraction > 0) {
      body += `<circle class="ring" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${colors[i]}" stroke-width="28" stroke-linecap="round" pathLength="1" stroke-dasharray="${num4(ring.fraction)} 1" transform="rotate(-90 ${cx} ${cy})" style="animation-delay:${(0.2 + i * 0.25).toFixed(2)}s"/>`;
    }
  });
  body += pictureBox(profile, colors[0], bg, cx - 46, cy - 46, 92, 92, 46, "ar");
  body += text2(truncate(name, 22), 520, 92, 26, ink, 'font-weight="800"') + text2(`@${profile.login}`, 520, 114, 13, muted, 'class="mono"');
  if (rings2.length === 0) body += text2(blocks.has("activity") ? "The rings fill after the first automatic update, once the calendar is available." : "The activity section is switched off.", 520, 170, 14, muted, 'font-style="italic"');
  rings2.forEach((ring, i) => {
    const y = 168 + i * 74;
    body += `<circle cx="532" cy="${y - 6}" r="8" fill="${colors[i]}"/>`;
    body += text2(ring.label, 552, y - 8, 11, muted, 'letter-spacing="3" font-weight="800"');
    body += text2(`${Math.round(ring.fraction * 100)}%`, 552, y + 24, 30, colors[i], 'font-weight="800"');
    body += text2(ring.caption, 640, y + 22, 12.5, ink, 'class="mono"');
  });
  if (blocks.has("stats")) body += text2(`${formatNumber(profile.totalStars)} stars  \xB7  ${formatNumber(profile.followers)} followers  \xB7  ${repositories(profile.publicRepos)}`, 520, height - 40, 12.5, muted, 'class="mono"');
  const css = riseCss(motion) + (motion ? `.ring{animation:fill 1.4s ease-out both}@keyframes fill{from{stroke-dasharray:0 1}}@media (prefers-reduced-motion:reduce){.ring{animation:none}}` : "");
  return svgDoc({ height, title: `${name} on GitHub, as activity rings`, bg, radius: 14, css, body });
}
var rings = imageTemplate("rings", "Activity rings", "Three rings that fill with real shares of your activity: your streak, your active days and the last 30 days.", ["creative", "activity", "stats"], ringsSvg, {
  extra: () => "shown as three activity rings"
});
function branchAngles(count, spread = 62) {
  if (count <= 0) return [];
  if (count === 1) return [0];
  return Array.from({ length: count }, (_v, i) => -spread + i / (count - 1) * spread * 2);
}
function quadPoint(p0, p1, p2, t) {
  const u = 1 - t;
  return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
}
function treeSvg(profile, config, variant) {
  const dark = variant === "dark";
  const hue = hueFor2(profile, 120);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const sky = dark ? "#0f1a22" : "#e7f3f7";
  const ground = dark ? "#1a2a1d" : "#9ccc83";
  const bark = dark ? "#6b4a32" : "#7a5236";
  const ink = dark ? "#e8f0ea" : "#20301f";
  const muted = dark ? "#8fa596" : "#4b6b4d";
  const name = profile.name ?? profile.login;
  const langs = blocks.has("languages") ? profile.languages.slice(0, 5) : [];
  const repos = blocks.has("projects") ? profile.topRepos : [];
  const height = 560;
  const root = [450, 480];
  const angles = branchAngles(langs.length, 76);
  let body = text2(truncate(name, 24), 36, 52, 24, ink, 'font-weight="800"') + text2(`@${profile.login}`, 36, 74, 13, muted, 'class="mono"');
  body += `<path d="M0 ${root[1] - 6}Q225 ${root[1] - 30} 450 ${root[1] - 8}T900 ${root[1] - 14}V${height}H0Z" fill="${ground}"/>`;
  body += pictureBox(profile, hslToHex(hue, 0.5, 0.5), "#fff", 36, 96, 70, 70, 35, "tr");
  if (langs.length === 0) body += text2(blocks.has("languages") ? "No branches yet." : "The languages section is switched off.", 450, 250, 15, muted, 'text-anchor="middle" font-style="italic"');
  let shown = 0;
  let canopy = "";
  let branches = "";
  langs.forEach((lang, i) => {
    const a = angles[i] * Math.PI / 180;
    const len = 190 + lang.percent * 2.2;
    const tip = [root[0] + Math.sin(a) * len * 0.92, root[1] - 60 - Math.cos(a) * len * 0.92];
    const ctrl = [root[0] + Math.sin(a) * len * 0.12, root[1] - 60 - len * 0.7];
    const start = [root[0], root[1] - 60];
    const color = langColor(lang.name, variant);
    branches += `<path d="M${num4(start[0])} ${num4(start[1])}Q${num4(ctrl[0])} ${num4(ctrl[1])} ${num4(tip[0])} ${num4(tip[1])}" fill="none" stroke="${bark}" stroke-width="${num4(4 + lang.percent * 0.14)}" stroke-linecap="round"/>`;
    const here = repos.filter((r) => r.language === lang.name).slice(0, 3);
    here.forEach((repo, j) => {
      const t = here.length === 1 ? 0.58 : 0.4 + j / (here.length - 1) * 0.28;
      const [px, py] = quadPoint(start, ctrl, tip, t);
      const r = 9 + starScale(repo.stars) * 16;
      const side = Math.sin(a) >= 0 ? 1 : -1;
      const x = px + side * (r + 10 + j % 2 * 6);
      canopy += `<g class="leaf" style="animation-delay:${(0.3 + i * 0.12 + j * 0.06).toFixed(2)}s"><circle cx="${num4(x)}" cy="${num4(py)}" r="${num4(r)}" fill="${color}" fill-opacity="0.92"/>`;
      canopy += text2(truncate(repo.name, 14), x, py - r - 5, 11, ink, 'text-anchor="middle" font-weight="700"');
      canopy += text2(`\u2605 ${formatNumber(repo.stars)}`, x, py + 4, 10, "#ffffff", 'class="mono" text-anchor="middle" font-weight="700"') + `</g>`;
      shown += 1;
    });
    canopy += text2(`${truncate(lang.name, 12)} ${Math.round(lang.percent)}%`, tip[0] + Math.sin(a) * 56, tip[1] - 10, 14, color, 'text-anchor="middle" font-weight="800"');
  });
  body += `<path d="M${root[0] - 20} ${root[1]}L${root[0] - 10} ${root[1] - 64}H${root[0] + 10}L${root[0] + 20} ${root[1]}Z" fill="${bark}"/>`;
  body += branches + canopy;
  const other = repos.length - shown;
  body += text2(`branch = language, thicker for a bigger share \xB7 leaf = repository, bigger for more stars (log scale)${other > 0 ? ` \xB7 ${repositories(other)} in other languages not shown` : ""}`, 36, height - 20, 10.5, muted, 'class="mono"');
  const css = riseCss(motion) + (motion ? `.leaf{animation:grow .6s ease-out both}@keyframes grow{from{opacity:0;transform:scale(.6)}}@media (prefers-reduced-motion:reduce){.leaf{animation:none}}` : "");
  return svgDoc({ height, title: `${name} on GitHub, as a tree of languages`, bg: sky, radius: 14, css, body });
}
var tree = imageTemplate("tree", "Language tree", "A tree with a branch for each language, thicker for a bigger share, and a leaf for each repository.", ["creative", "nature", "languages"], treeSvg, {
  extra: () => "shown as a tree with a branch for each language and a leaf for each repository"
});
function fishLength(stars3) {
  return Math.round(54 + starScale(stars3) * 96);
}
function fishSvg(profile, config, variant) {
  const dark = variant === "dark";
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const top = dark ? "#06223a" : "#6ec6ea";
  const bottom = dark ? "#031321" : "#2a86b5";
  const sand = dark ? "#3a3524" : "#e6d49a";
  const ink = "#ffffff";
  const name = profile.name ?? profile.login;
  const repos = blocks.has("projects") ? profile.topRepos.slice(0, 6) : [];
  const langs = blocks.has("languages") ? profile.languages.slice(0, 5) : [];
  const height = 470;
  const defs = `<linearGradient id="water" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>`;
  let body = `<rect width="900" height="${height}" fill="url(#water)"/>`;
  for (let i = 0; i < 26; i++) {
    const h = hashOf(`${profile.login}:bubble:${i}`);
    body += `<circle cx="${h % 900}" cy="${(h >>> 9) % 330 + 20}" r="${1.5 + h % 4}" fill="#fff" fill-opacity="0.18"/>`;
  }
  body += text2(truncate(name, 24), 36, 54, 24, ink, 'font-weight="800"') + text2(`@${profile.login}`, 36, 76, 13, "#cfe9f5", 'class="mono"');
  if (repos.length === 0) body += text2(blocks.has("projects") ? "The tank is empty." : "The projects section is switched off.", 36, 150, 15, "#cfe9f5", 'font-style="italic"');
  repos.forEach((repo, i) => {
    const len = fishLength(repo.stars);
    const h = len * 0.5;
    const h0 = hashOf(`${profile.login}:fish:${repo.name}`);
    const laneY = 140 + Math.floor(i / 3) * 120;
    const x = 50 + i % 3 * 280 + (h0 >>> 3) % 60;
    const right = (h0 & 1) === 0;
    const color = repo.language ? langColor(repo.language, variant) : "#9aa7b4";
    const sway = motion ? ` class="swim" style="--d:${right ? 34 : -34}px;animation-duration:${(5 + h0 % 5).toFixed(0)}s;animation-delay:${(-(h0 % 4)).toFixed(0)}s"` : "";
    const dir = right ? 1 : -1;
    const bx = x + len / 2;
    body += `<g${sway}><g transform="translate(${num4(bx)} ${laneY}) scale(${dir} 1)">`;
    body += `<path d="M${num4(-len / 2)} 0Q${num4(-len * 0.1)} ${num4(-h)} ${num4(len / 2 - 10)} 0Q${num4(-len * 0.1)} ${num4(h)} ${num4(-len / 2)} 0Z" fill="${color}"/>`;
    body += `<path d="M${num4(len / 2 - 14)} 0L${num4(len / 2 + 22)} ${num4(-h * 0.7)}L${num4(len / 2 + 22)} ${num4(h * 0.7)}Z" fill="${color}" fill-opacity="0.85"/>`;
    body += `<circle cx="${num4(-len / 2 + len * 0.22)}" cy="${num4(-h * 0.1)}" r="${num4(Math.max(3, h * 0.12))}" fill="#fff"/><circle cx="${num4(-len / 2 + len * 0.22 - 1)}" cy="${num4(-h * 0.1)}" r="${num4(Math.max(1.5, h * 0.06))}" fill="#10243a"/>`;
    body += `</g>`;
    body += text2(`${truncate(repo.name, 16)}  \u2605 ${formatNumber(repo.stars)}`, bx, laneY + h + 14, 11.5, ink, 'text-anchor="middle" font-weight="700"') + `</g>`;
  });
  body += `<path d="M0 ${height - 70}Q225 ${height - 90} 450 ${height - 72}T900 ${height - 78}V${height}H0Z" fill="${sand}"/>`;
  langs.forEach((lang, i) => {
    const x = 70 + i * 165;
    const h = 26 + lang.percent * 1.8;
    const color = langColor(lang.name, variant);
    for (let b = 0; b < 3; b++) body += `<path d="M${x + b * 14} ${height - 70}q${b % 2 ? 14 : -14} ${num4(-h * 0.5)} 0 ${num4(-h * (0.7 + b * 0.15))}" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round"/>`;
    body += text2(`${truncate(lang.name, 12)} ${Math.round(lang.percent)}%`, x + 16, height - 28, 12.5, "#10243a", 'text-anchor="middle" font-weight="800"');
  });
  body += text2("fish length = stars (log scale) \xB7 colour = main language \xB7 seaweed height = share of code", 36, height - 8, 10, "#10243a", 'class="mono"');
  const css = riseCss(motion) + (motion ? `.swim{animation:swim 6s ease-in-out infinite alternate}@keyframes swim{to{transform:translateX(var(--d))}}@media (prefers-reduced-motion:reduce){.swim{animation:none}}` : "");
  return svgDoc({ height, title: `${name} on GitHub, as an aquarium of repositories`, bg: bottom, radius: 14, defs, css, body });
}
var aquarium = imageTemplate("aquarium", "Aquarium", "A fish tank with a fish for each repository, longer for more stars, over seaweed for your languages.", ["creative", "nature", "projects"], fishSvg, {
  extra: () => "shown as an aquarium with a fish for each repository"
});
function blobPath(seed, cx, cy, radius) {
  const points = 9;
  const pts = [];
  for (let i = 0; i < points; i++) {
    const a = i / points * Math.PI * 2;
    const r = radius * (0.72 + hashOf(`${seed}:${i}`) % 100 / 100 * 0.5);
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.82]);
  }
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = `M${num4(mid(pts[points - 1], pts[0])[0])} ${num4(mid(pts[points - 1], pts[0])[1])}`;
  for (let i = 0; i < points; i++) {
    const next = pts[(i + 1) % points];
    const m = mid(pts[i], next);
    d += `Q${num4(pts[i][0])} ${num4(pts[i][1])} ${num4(m[0])} ${num4(m[1])}`;
  }
  return `${d}Z`;
}
var ISLAND_SLOTS = [[250, 230], [560, 190], [430, 370], [700, 340], [150, 400], [770, 170]];
function islandSvg(profile, config, variant) {
  const dark = variant === "dark";
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const sea = dark ? "#10222e" : "#cfe6ea";
  const seaLine = dark ? "#1c3a4c" : "#a9ccd3";
  const paper = dark ? "#1a2d3a" : "#efe1bb";
  const ink = dark ? "#e7dcc0" : "#4a3520";
  const name = profile.name ?? profile.login;
  const repos = blocks.has("projects") ? [...profile.topRepos.slice(0, 6)].sort((a, b) => b.stars - a.stars) : [];
  const langs = blocks.has("languages") ? profile.languages.slice(0, 4) : [];
  const height = 520;
  let body = `<rect width="900" height="${height}" fill="${sea}"/>`;
  for (let i = 0; i < 14; i++) body += `<path d="M0 ${40 + i * 36}q75 -10 150 0t150 0t150 0t150 0t150 0t150 0" fill="none" stroke="${seaLine}" stroke-width="1.4"/>`;
  body += `<g><rect x="30" y="28" width="300" height="74" rx="6" fill="${paper}" stroke="${ink}" stroke-width="2"/><rect x="36" y="34" width="288" height="62" rx="3" fill="none" stroke="${ink}" stroke-opacity="0.5"/>`;
  body += text2(truncate(name, 22), 180, 62, 24, ink, 'class="serif" text-anchor="middle" font-style="italic" font-weight="700"') + text2(`@${profile.login}`, 180, 84, 12, ink, 'class="mono" text-anchor="middle"') + `</g>`;
  if (repos.length === 0) body += text2(blocks.has("projects") ? "No islands charted yet." : "The projects section is switched off.", 450, 270, 16, ink, 'class="serif" text-anchor="middle" font-style="italic"');
  const spots = repos.map((_r, i) => ISLAND_SLOTS[i]);
  if (repos.length > 1) body += `<path d="M${spots.map(([x, y]) => `${x} ${y}`).join("L")}" fill="none" stroke="${ink}" stroke-opacity="0.55" stroke-width="2" stroke-dasharray="3 7" stroke-linecap="round"/>`;
  repos.forEach((repo, i) => {
    const [x, y] = spots[i];
    const radius = 30 + starScale(repo.stars) * 52;
    const color = repo.language ? langColor(repo.language, variant) : "#9a8f78";
    body += `<g class="isle" style="animation-delay:${(0.1 + i * 0.1).toFixed(2)}s"><path d="${blobPath(`${profile.login}:${repo.name}`, x, y, radius * 1.2)}" fill="${seaLine}" fill-opacity="0.9"/>`;
    body += `<path d="${blobPath(`${profile.login}:${repo.name}`, x, y, radius)}" fill="${color}" fill-opacity="0.85" stroke="${ink}" stroke-width="1.6"/>`;
    if (i === 0) body += `<path d="M${x - 9} ${y - 9}l18 18M${x + 9} ${y - 9}l-18 18" stroke="#b3261e" stroke-width="4" stroke-linecap="round"/>`;
    body += text2(truncate(repo.name, 18), x, y + radius * 0.82 + 22, 14, ink, 'class="serif" text-anchor="middle" font-style="italic" font-weight="700"');
    body += text2(`\u2605 ${formatNumber(repo.stars)}`, x, y + radius * 0.82 + 38, 11, ink, 'class="mono" text-anchor="middle"') + `</g>`;
  });
  const ccx = 820;
  const ccy = 440;
  body += `<g stroke="${ink}" fill="${ink}"><path d="M${ccx} ${ccy - 44}L${ccx + 8} ${ccy}L${ccx} ${ccy + 44}L${ccx - 8} ${ccy}Z" fill-opacity="0.8"/><path d="M${ccx - 44} ${ccy}L${ccx} ${ccy - 8}L${ccx + 44} ${ccy}L${ccx} ${ccy + 8}Z" fill-opacity="0.35"/></g>` + text2("N", ccx, ccy - 52, 14, ink, 'class="serif" text-anchor="middle" font-weight="700"');
  langs.forEach((lang, i) => {
    body += `<rect x="700" y="${40 + i * 20}" width="14" height="14" rx="3" fill="${langColor(lang.name, variant)}" stroke="${ink}" stroke-opacity="0.6"/>` + text2(`${truncate(lang.name, 14)} ${Math.round(lang.percent)}%`, 722, 52 + i * 20, 12, ink, 'class="serif"');
  });
  body += text2("island size = stars (log scale) \xB7 colour = main language \xB7 the X marks the most starred repository", 36, height - 12, 10.5, ink, 'class="mono"');
  const css = riseCss(motion) + (motion ? `.isle{animation:rise .6s ease-out both}@keyframes rise{from{opacity:0;transform:translateY(10px)}}@media (prefers-reduced-motion:reduce){.isle{animation:none}}` : "");
  return svgDoc({ height, title: `${name} on GitHub, as a treasure map of repositories`, bg: sea, radius: 14, css, body });
}
var island = imageTemplate("island", "Island map", "A treasure map: an island for each repository, bigger for more stars, with an X on the most starred.", ["creative", "map", "projects"], islandSvg, {
  extra: () => "shown as a treasure map with an island for each repository"
});
var CHIP_SLOTS = [
  { x: 120, y: 120 },
  { x: 700, y: 120 },
  { x: 80, y: 330 },
  { x: 740, y: 330 },
  { x: 330, y: 400 },
  { x: 510, y: 400 }
];
function chipWidth(stars3) {
  return Math.round(100 + starScale(stars3) * 50);
}
function circuitSvg(profile, config, variant) {
  const dark = variant === "dark";
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const board2 = dark ? "#06261a" : "#1c7a4f";
  const boardEdge = dark ? "#0b3a28" : "#13613e";
  const chip = dark ? "#15171c" : "#1d2026";
  const pin = "#d9c27a";
  const text1 = "#e8eef0";
  const name = profile.name ?? profile.login;
  const repos = blocks.has("projects") ? profile.topRepos.slice(0, 6) : [];
  const height = 520;
  const core = { x: 450, y: 250, w: 250, h: 130 };
  let body = `<rect width="900" height="${height}" fill="${board2}"/>`;
  for (let i = 0; i < 8; i++) body += `<path d="M${30 + i * 120} 10V${height - 10}" stroke="${boardEdge}" stroke-width="1"/>`;
  let traces = "";
  let chips3 = "";
  repos.forEach((repo, i) => {
    const slot = CHIP_SLOTS[i];
    const w = chipWidth(repo.stars);
    const color = repo.language ? langColor(repo.language, variant) : "#b6c0c8";
    const h = 66;
    const cx = slot.x + w / 2;
    const cy = slot.y + h / 2;
    const toX = cx < core.x ? core.x - core.w / 2 : cx > core.x ? core.x + core.w / 2 : core.x;
    const startX = cx < core.x ? slot.x + w : cx > core.x ? slot.x : cx;
    const midX = startX + (toX - startX) * 0.55;
    const endY = core.y - core.h / 2 + 22 + i % 3 * 43;
    traces += `<path d="M${num4(startX)} ${num4(cy)}H${num4(midX)}L${num4(midX + (toX > startX ? 24 : -24))} ${num4(endY)}H${num4(toX)}" fill="none" stroke="${color}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" class="trace"/>`;
    const lit = isFresh(repo, profile.fetchedAt);
    chips3 += `<g class="chip" style="animation-delay:${(0.1 + i * 0.1).toFixed(2)}s"><rect x="${slot.x}" y="${slot.y}" width="${w}" height="${h}" rx="5" fill="${chip}" stroke="${color}" stroke-width="2"/>`;
    for (let p = 0; p < 6; p++) chips3 += `<rect x="${slot.x + 8 + p * ((w - 16) / 6)}" y="${slot.y - 6}" width="6" height="6" fill="${pin}"/><rect x="${slot.x + 8 + p * ((w - 16) / 6)}" y="${slot.y + h}" width="6" height="6" fill="${pin}"/>`;
    chips3 += text2(truncate(repo.name, 14), slot.x + 8, slot.y + 24, 13, text1, 'class="mono" font-weight="800"') + text2(`\u2605 ${formatNumber(repo.stars)}`, slot.x + 8, slot.y + 42, 11.5, pin, 'class="mono"');
    chips3 += text2(truncate(repo.language ?? "\u2014", 12), slot.x + 8, slot.y + 58, 10, color, 'class="mono"');
    chips3 += `<circle cx="${slot.x + w - 14}" cy="${slot.y + 14}" r="5" fill="${lit ? "#4dff88" : "#3a4a40"}"${lit && motion ? ' class="led"' : ""}/></g>`;
  });
  body += traces;
  body += `<rect x="${core.x - core.w / 2}" y="${core.y - core.h / 2}" width="${core.w}" height="${core.h}" rx="8" fill="${chip}" stroke="${pin}" stroke-width="2.5"/>`;
  for (let p = 0; p < 10; p++) body += `<rect x="${core.x - core.w / 2 + 14 + p * 24}" y="${core.y - core.h / 2 - 7}" width="7" height="7" fill="${pin}"/><rect x="${core.x - core.w / 2 + 14 + p * 24}" y="${core.y + core.h / 2}" width="7" height="7" fill="${pin}"/>`;
  body += pictureBox(profile, "#2e5d8a", "#ffffff", core.x - core.w / 2 + 12, core.y - core.h / 2 + 12, 52, 52, 4, "cc");
  body += text2(truncate(name, 14), core.x - core.w / 2 + 72, core.y - core.h / 2 + 34, 14, text1, 'class="mono" font-weight="800"') + text2(`@${truncate(profile.login, 14)}`, core.x - core.w / 2 + 72, core.y - core.h / 2 + 52, 11, pin, 'class="mono"');
  if (blocks.has("stats")) body += text2(`${formatNumber(profile.totalStars)} stars \xB7 ${formatNumber(profile.followers)} followers`, core.x, core.y + core.h / 2 - 16, 10.5, text1, 'class="mono" text-anchor="middle"');
  body += chips3;
  for (const [sx, sy] of [[26, 26], [874, 26], [26, height - 26], [874, height - 26]]) body += `<circle cx="${sx}" cy="${sy}" r="9" fill="${boardEdge}" stroke="${pin}" stroke-width="2"/><path d="M${sx - 5} ${sy}h10" stroke="${pin}"/>`;
  if (repos.length === 0) body += text2(blocks.has("projects") ? "No chips are fitted yet." : "The projects section is switched off.", 450, 120, 14, text1, 'class="mono" text-anchor="middle"');
  body += text2("chip width = stars \xB7 trace colour = main language \xB7 a lit LED means pushed to in the last 90 days", 36, height - 14, 10.5, text1, 'class="mono" fill-opacity="0.85"');
  const css = riseCss(motion) + (motion ? `.chip{animation:fitin .5s ease-out both}@keyframes fitin{from{opacity:0;transform:scale(.94)}}.led{animation:blink 1.6s ease-in-out infinite alternate}@keyframes blink{from{opacity:.4}}@media (prefers-reduced-motion:reduce){.chip,.led{animation:none}}` : "");
  return svgDoc({ height, title: `${name} on GitHub, as a circuit board of repositories`, bg: board2, radius: 14, css, body });
}
var circuit = imageTemplate("circuit", "Circuit board", "A circuit board: you as the main chip, a chip for each repository, and an LED that lights when it was pushed to lately.", ["creative", "device", "projects"], circuitSvg, {
  extra: () => "shown as a circuit board with a chip for each repository"
});
var worldTemplates = [rings, tree, aquarium, island, circuit];

// ../core/src/templates/devices.ts
var hueFor3 = (profile, fallback) => hueOf(profile.avatar?.grid.tint) ?? fallback;
var text3 = (value, x, y, size, fill, extra = "") => `<text x="${num4(x)}" y="${num4(y)}" font-size="${size}" fill="${fill}" ${extra}>${xmlEscape(value)}</text>`;
function cells(value, length, align = "left") {
  const chars = [...value.toUpperCase()].slice(0, length);
  const pad = Array.from({ length: length - chars.length }, () => " ");
  return align === "left" ? [...chars, ...pad] : [...pad, ...chars];
}
function boardStatus(pushedAt, fetchedAt, isFreshFn) {
  if (!pushedAt || Number.isNaN(Date.parse(pushedAt))) return "";
  return isFreshFn(pushedAt, fetchedAt) ? "ACTIVE" : "IDLE";
}
function departuresSvg(profile, config, variant) {
  const dark = variant === "dark";
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const bg = dark ? "#090b0e" : "#dfe3e8";
  const tile = dark ? "#171b21" : "#1e2630";
  const ink = dark ? "#ffcf4a" : "#f4f6f8";
  const dim = dark ? "#8a7a3a" : "#9aa6b4";
  const good = dark ? "#6ee79a" : "#8ff0b3";
  const name = profile.name ?? profile.login;
  const repos = blocks.has("projects") ? profile.topRepos.slice(0, 6) : [];
  const read = profile.fetchedAt && !Number.isNaN(Date.parse(profile.fetchedAt)) ? new Date(profile.fetchedAt).toISOString().slice(11, 16) : "";
  const langs = blocks.has("languages") ? profile.languages.slice(0, 4) : [];
  const px = 19;
  const rowH = 42;
  const x0 = 46;
  const cols = [["DESTINATION", 16, "left"], ["GATE", 10, "left"], ["STARS", 6, "right"], ["STATUS", 6, "left"]];
  const gap = 18;
  const top = 128;
  const height = top + Math.max(repos.length, 1) * rowH + (langs.length > 0 ? 80 : 44);
  let body = `<rect x="22" y="22" width="856" height="${height - 44}" rx="12" fill="${dark ? "#10141a" : "#ffffff"}" stroke="${dark ? "#252c36" : "#b8c0ca"}" stroke-width="2"/>`;
  body += pictureBox(profile, ink, "#000000", 46, 40, 44, 44, 22, "db");
  body += text3("DEPARTURES", 106, 66, 26, ink, 'font-weight="800" letter-spacing="6"');
  body += text3(`@${truncate(profile.login, 24)}  \xB7  ${truncate(name, 24)}`, 106, 86, 12.5, dim, 'class="mono"');
  if (read) body += text3(`${read} UTC`, 852, 66, 26, ink, 'class="mono" text-anchor="end" font-weight="700"');
  let cx = x0;
  for (const [label4, length] of cols) {
    body += text3(label4, cx, top - 8, 10, dim, 'letter-spacing="3" font-weight="800"');
    cx += length * px + gap;
  }
  if (repos.length === 0) body += text3(blocks.has("projects") ? "NO DEPARTURES TODAY" : "THE PROJECTS SECTION IS SWITCHED OFF", x0, top + 28, 18, dim, 'class="mono" font-weight="700"');
  repos.forEach((repo, r) => {
    const y = top + r * rowH;
    const status = boardStatus(repo.pushedAt, profile.fetchedAt, (pushed, read2) => isFresh({ ...repo, pushedAt: pushed }, read2));
    const values = [cells(repo.name, 16), cells(repo.language ?? "", 10), cells(formatNumber(repo.stars), 6, "right"), cells(status, 6)];
    let x = x0;
    values.forEach((chars, c2) => {
      chars.forEach((ch, i) => {
        const delay = (0.05 * r + 0.012 * (i + c2 * 6)).toFixed(3);
        body += `<g class="flap" style="animation-delay:${delay}s"><rect x="${x + i * px}" y="${y}" width="${px - 2}" height="32" rx="3" fill="${tile}"/>`;
        body += `<path d="M${x + i * px} ${y + 16}h${px - 2}" stroke="#000" stroke-opacity="0.55"/>`;
        if (ch !== " ") body += `<text x="${x + i * px + (px - 2) / 2}" y="${y + 23}" text-anchor="middle" font-size="19" font-weight="800" class="mono" fill="${c2 === 3 ? status === "ACTIVE" ? good : dim : ink}">${xmlEscape(ch)}</text>`;
        body += `</g>`;
      });
      x += cols[c2][1] * px + gap;
    });
  });
  if (langs.length > 0) {
    body += text3(`MADE WITH  ${langs.map((l) => `${l.name.toUpperCase()} ${Math.round(l.percent)}%`).join("   ")}`, x0, height - 40, 12.5, dim, 'class="mono" font-weight="700"');
  }
  const css = riseCss(motion) + (motion ? `.flap{transform-box:fill-box;transform-origin:center;animation:flip .45s ease-out both}@keyframes flip{from{transform:scaleY(.05);opacity:.2}}@media (prefers-reduced-motion:reduce){.flap{animation:none}}` : "");
  return svgDoc({ height, title: `${name} on GitHub, as a departures board`, bg, radius: 14, css, body });
}
var departures = imageTemplate("departures", "Departures board", "An airport split-flap board: a row for each repository, with its language, stars and whether it is active.", ["creative", "device", "projects"], departuresSvg, {
  extra: () => "shown as an airport departures board with a row for each repository"
});
function handheldSvg(profile, config, variant) {
  const dark = variant === "dark";
  const hue = hueFor3(profile, 280);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const desk = dark ? "#14121a" : "#d8d4e0";
  const shell2 = dark ? "#3a3548" : "#cfcac0";
  const shellEdge = dark ? "#262232" : "#a9a498";
  const bezel = dark ? "#1c1a26" : "#5b586a";
  const lcd = dark ? "#8bac0f" : "#9bbc0f";
  const lcdInk = "#0f380f";
  const lcdDim = "#306230";
  const accent2 = hslToHex(hue, 0.55, dark ? 0.5 : 0.42);
  const name = profile.name ?? profile.login;
  const years = yearsBetween(profile.createdAt, profile.fetchedAt);
  const repos = blocks.has("projects") ? profile.topRepos.slice(0, 3) : [];
  const langs = blocks.has("languages") ? profile.languages.slice(0, 3).map((l) => l.name) : [];
  const height = 520;
  const sx = 258;
  const sy = 70;
  const sw = 384;
  const sh = 312;
  let body = `<rect x="90" y="30" width="720" height="${height - 50}" rx="30" fill="${shellEdge}"/><rect x="90" y="24" width="720" height="${height - 50}" rx="30" fill="${shell2}"/>`;
  body += `<rect x="${sx - 30}" y="${sy - 26}" width="${sw + 60}" height="${sh + 80}" rx="14" fill="${bezel}"/>`;
  body += text3("PROFILE-PAD", sx + sw / 2, sy - 6, 11, dark ? "#9a94b0" : "#cfcce0", 'text-anchor="middle" letter-spacing="5" font-weight="800"');
  body += `<rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="${lcd}"/>`;
  let y = sy + 36;
  body += text3(truncate(name.toUpperCase(), 20), sx + 18, y, 21, lcdInk, 'class="mono" font-weight="800"');
  y += 24;
  body += text3(`@${truncate(profile.login, 24)}`, sx + 18, y, 14, lcdDim, 'class="mono" font-weight="700"');
  const facts = [];
  if (years !== null) facts.push(`YRS ${years}`);
  if (blocks.has("stats")) facts.push(`REPOS ${formatNumber(profile.publicRepos)}`, `STARS ${formatNumber(profile.totalStars)}`, `FANS ${formatNumber(profile.followers)}`);
  facts.slice(0, 4).forEach((fact2, i) => {
    body += text3(fact2, sx + 18 + i % 2 * 180, y + 32 + Math.floor(i / 2) * 24, 15, lcdInk, 'class="mono" font-weight="800"');
  });
  y += 32 + Math.ceil(Math.min(4, facts.length) / 2) * 24 + 14;
  if (langs.length > 0) {
    body += text3(`TYPE: ${langs.join("/").toUpperCase()}`, sx + 18, y, 13, lcdDim, 'class="mono" font-weight="800"');
    y += 22;
  }
  if (repos.length > 0) {
    body += `<path d="M${sx + 14} ${y - 8}H${sx + sw - 14}" stroke="${lcdInk}" stroke-width="2"/>`;
    body += text3("MOVES", sx + 18, y + 12, 12, lcdDim, 'class="mono" font-weight="800" letter-spacing="3"');
    repos.forEach((repo, i) => {
      body += text3(`${i === 0 ? "\u25B6" : " "} ${truncate(repo.name.toUpperCase(), 15)}`, sx + 18, y + 34 + i * 22, 15, lcdInk, 'class="mono" font-weight="800"');
      body += text3(formatNumber(repo.stars), sx + sw - 18, y + 34 + i * 22, 15, lcdInk, 'class="mono" text-anchor="end" font-weight="800"');
    });
  }
  for (let line = 0; line < sh; line += 3) body += `<path d="M${sx} ${sy + line}h${sw}" stroke="#000" stroke-opacity="0.07"/>`;
  const dx = 168;
  const dy = 300;
  body += `<path d="M${dx - 15} ${dy - 45}h30v30h30v30h-30v30h-30v-30h-30v-30h30z" fill="${bezel}"/>`;
  body += `<circle cx="${735}" cy="${dy - 5}" r="26" fill="${accent2}"/><circle cx="${679}" cy="${dy + 20}" r="26" fill="${accent2}"/>`;
  body += text3("A", 735, dy + 3, 17, "#ffffff", 'text-anchor="middle" font-weight="800"') + text3("B", 679, dy + 28, 17, "#ffffff", 'text-anchor="middle" font-weight="800"');
  for (const [px, label4] of [[390, "SELECT"], [510, "START"]]) {
    body += `<rect x="${px - 34}" y="${sy + sh + 52}" width="68" height="16" rx="8" fill="${bezel}" transform="rotate(-20 ${px} ${sy + sh + 60})"/>`;
    body += text3(label4, px, sy + sh + 90, 10, dark ? "#9a94b0" : "#6c6880", 'text-anchor="middle" letter-spacing="2" font-weight="800"');
  }
  for (let i = 0; i < 5; i++) body += `<rect x="${704 + i * 16}" y="410" width="7" height="46" rx="3.5" fill="${shellEdge}" transform="rotate(-20 ${708 + i * 16} 433)"/>`;
  body += `<circle cx="${sx - 10}" cy="${sy + 100}" r="5" fill="${motion ? "#e0342b" : "#8a2a24"}" class="led"/>`;
  const css = riseCss(motion) + (motion ? `.led{animation:glow 2.2s ease-in-out infinite alternate}@keyframes glow{from{opacity:.35}to{opacity:1}}@media (prefers-reduced-motion:reduce){.led{animation:none}}` : "");
  return svgDoc({ height, title: `${name} on GitHub, as a handheld console`, bg: desk, radius: 14, css, body: rise(body, motion, 0.05) });
}
var handheld = imageTemplate("handheld", "Handheld console", "A green-screen handheld: your name, numbers and best repositories as moves.", ["creative", "device", "fun"], handheldSvg, {
  extra: () => "shown as a handheld game console with a green screen"
});
function neonSvg(profile, config, variant) {
  const dark = variant === "dark";
  const hue = hueFor3(profile, 320);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const wall = dark ? "#1a1114" : "#b9694f";
  const brick = dark ? "#2a1a1d" : "#c97a5f";
  const mortar = dark ? "#120b0d" : "#a45a42";
  const name = (profile.name ?? profile.login).trim();
  const main2 = hslToHex(hue, 1, dark ? 0.62 : 0.55);
  const second = hslToHex((hue + 150) % 360, 1, dark ? 0.62 : 0.5);
  const off = dark ? "#5a4a52" : "#e8d3c8";
  const height = 440;
  const size = Math.max(44, Math.min(120, Math.floor(780 / (Math.max(name.length, 1) * 0.62))));
  let bricks = "";
  for (let r = 0; r < Math.ceil(height / 30); r++) {
    for (let c2 = -1; c2 < 10; c2++) bricks += `<rect x="${c2 * 100 + r % 2 * 50 + 2}" y="${r * 30 + 2}" width="96" height="26" fill="${brick}" fill-opacity="${0.6 + hashOf(`${profile.login}:${r}:${c2}`) % 5 * 0.08}"/>`;
  }
  const defs = `<filter id="glow" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="${dark ? 7 : 0.01}"/></filter>`;
  let body = `<rect width="900" height="${height}" fill="${mortar}"/>${bricks}`;
  if (dark) body += `<rect width="900" height="${height}" fill="#000" fill-opacity="0.3"/>`;
  const tube = (value, x2, y2, fs, color, extra = "", cls = "") => {
    const t = xmlEscape(value);
    const lit = dark;
    let out = "";
    if (lit) out += `<text x="${x2}" y="${y2}" font-size="${fs}" fill="none" stroke="${color}" stroke-width="${Math.max(3, fs / 9)}" filter="url(#glow)" ${extra}>${t}</text>`;
    out += `<text${cls} x="${x2}" y="${y2}" font-size="${fs}" fill="none" stroke="${lit ? color : off}" stroke-width="${Math.max(1.6, fs / 18)}" stroke-linejoin="round" ${extra}>${t}</text>`;
    if (lit) out += `<text x="${x2}" y="${y2}" font-size="${fs}" fill="none" stroke="#ffffff" stroke-opacity="0.8" stroke-width="${Math.max(0.6, fs / 60)}" ${extra}>${t}</text>`;
    return out;
  };
  body += tube(truncate(name, 24).toUpperCase(), 450, 170, size, main2, 'text-anchor="middle" font-weight="800" letter-spacing="3"', ' class="flicker"');
  body += tube(`@${profile.login}`, 450, 232, 34, second, 'text-anchor="middle" font-weight="700" letter-spacing="4"');
  const items = [];
  if (blocks.has("stats")) items.push([`${formatNumber(profile.totalStars)} STARS`, main2], [`${formatNumber(profile.followers)} FOLLOWERS`, second]);
  if (blocks.has("languages")) for (const [i, l] of profile.languages.slice(0, 3).entries()) items.push([l.name.toUpperCase(), i % 2 ? main2 : second]);
  let x = 70;
  let y = 312;
  items.forEach(([label4, color]) => {
    const w = label4.length * 17 + 40;
    if (x + w > 840) {
      x = 70;
      y += 62;
    }
    body += `<rect x="${x}" y="${y - 30}" width="${w}" height="44" rx="22" fill="none" stroke="${dark ? color : off}" stroke-width="3"${dark ? ' filter="url(#glow)"' : ""}/><rect x="${x}" y="${y - 30}" width="${w}" height="44" rx="22" fill="none" stroke="${dark ? color : off}" stroke-width="2"/>`;
    body += text3(label4, x + w / 2, y, 21, dark ? color : "#8a6a5e", 'text-anchor="middle" font-weight="700" letter-spacing="2"');
    x += w + 18;
  });
  const css = riseCss(motion) + (motion ? `.flicker{animation:flick 5s steps(1) infinite}@keyframes flick{0%,92%,96%,100%{opacity:1}93%,95%{opacity:.25}94%{opacity:.8}}@media (prefers-reduced-motion:reduce){.flicker{animation:none}}` : "");
  return svgDoc({ height, title: `${name} on GitHub, as a neon sign`, bg: wall, radius: 14, css, defs, body });
}
var neon = imageTemplate("neon", "Neon sign", "A glowing neon sign on a brick wall: your name, handle and numbers in tube light. It is unlit in the light theme.", ["creative", "device", "fun"], neonSvg, {
  extra: () => "shown as a neon sign on a brick wall"
});
var STICKER_SLOTS = [
  { x: 190, y: 160 },
  { x: 330, y: 120 },
  { x: 470, y: 170 },
  { x: 610, y: 120 },
  { x: 740, y: 190 },
  { x: 150, y: 300 },
  { x: 290, y: 280 },
  { x: 440, y: 330 },
  { x: 590, y: 290 },
  { x: 730, y: 350 },
  { x: 220, y: 410 },
  { x: 590, y: 420 }
];
function laptopSvg(profile, config, variant) {
  const dark = variant === "dark";
  const hue = hueFor3(profile, 200);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const desk = dark ? "#15171c" : "#d9dde3";
  const lid = dark ? "#8b919b" : "#c9ced6";
  const lidEdge = dark ? "#5d626b" : "#9aa1ab";
  const name = profile.name ?? profile.login;
  const langs = blocks.has("languages") ? profile.languages.slice(0, 5) : [];
  const repos = blocks.has("projects") ? profile.topRepos.slice(0, 5) : [];
  const height = 560;
  const stickers = [];
  const sticker = (i, draw) => {
    const slot2 = STICKER_SLOTS[i];
    if (!slot2) return;
    const rot = (hashOf(`${profile.login}:sticker:${i}`) % 21 - 10) * 0.9;
    stickers.push(`<g class="stk" style="animation-delay:${(0.1 + i * 0.07).toFixed(2)}s" transform="rotate(${num4(rot)} ${slot2.x} ${slot2.y})">${draw(slot2.x, slot2.y)}</g>`);
  };
  let slot = 0;
  sticker(slot++, (x, y) => `<circle cx="${x}" cy="${y}" r="60" fill="#fff"/>${pictureBox(profile, hslToHex(hue, 0.6, 0.5), "#ffffff", x - 54, y - 54, 108, 108, 54, "ls")}`);
  langs.forEach((lang) => {
    const r = 34 + lang.percent * 0.42;
    sticker(slot++, (x, y) => `<circle cx="${x}" cy="${y}" r="${num4(r + 5)}" fill="#fff"/><circle cx="${x}" cy="${y}" r="${num4(r)}" fill="${langColor(lang.name, variant)}"/>${text3(truncate(lang.name, 10), x, y - 2, Math.max(9, Math.min(20, r * 1.7 / (Math.min(lang.name.length, 10) * 0.62))), "#ffffff", 'text-anchor="middle" font-weight="800"')}${text3(`${Math.round(lang.percent)}%`, x, y + 17, 13, "#ffffff", 'class="mono" text-anchor="middle" font-weight="700"')}`);
  });
  repos.forEach((repo) => {
    const w = Math.min(190, 60 + repo.name.length * 9);
    sticker(slot++, (x, y) => `<rect x="${x - w / 2 - 5}" y="${y - 31}" width="${w + 10}" height="62" rx="14" fill="#fff"/><rect x="${x - w / 2}" y="${y - 26}" width="${w}" height="52" rx="10" fill="${repo.language ? langColor(repo.language, variant) : "#6b7280"}" fill-opacity="0.95"/>${text3(truncate(repo.name, 16), x, y - 3, 15, "#ffffff", 'text-anchor="middle" font-weight="800"')}${text3(`\u2605 ${formatNumber(repo.stars)}`, x, y + 16, 12.5, "#ffffff", 'class="mono" text-anchor="middle" font-weight="700"')}`);
  });
  if (blocks.has("stats")) sticker(slot++, (x, y) => `<path d="M${x} ${y + 40}C${x - 90} ${y - 20} ${x - 40} ${y - 70} ${x} ${y - 28}C${x + 40} ${y - 70} ${x + 90} ${y - 20} ${x} ${y + 40}Z" fill="#fff" stroke="#fff" stroke-width="10" stroke-linejoin="round"/><path d="M${x} ${y + 40}C${x - 90} ${y - 20} ${x - 40} ${y - 70} ${x} ${y - 28}C${x + 40} ${y - 70} ${x + 90} ${y - 20} ${x} ${y + 40}Z" fill="#e0425a"/>${text3(formatNumber(profile.followers), x, y + 2, 19, "#ffffff", 'text-anchor="middle" font-weight="800"')}${text3("followers", x, y + 19, 10.5, "#ffffff", 'text-anchor="middle" font-weight="700"')}`);
  sticker(slot++, (x, y) => `<rect x="${x - 70}" y="${y - 20}" width="140" height="40" rx="20" fill="#fff"/><rect x="${x - 65}" y="${y - 15}" width="130" height="30" rx="15" fill="#16181d"/>${text3(`@${truncate(profile.login, 14)}`, x, y + 5, 14, "#ffffff", 'class="mono" text-anchor="middle" font-weight="700"')}`);
  let body = `<rect x="70" y="30" width="760" height="470" rx="26" fill="${lidEdge}"/><rect x="70" y="24" width="760" height="470" rx="26" fill="${lid}"/>`;
  body += `<path d="M96 40H804" stroke="#fff" stroke-opacity="0.35" stroke-width="2"/>`;
  body += stickers.join("");
  body += `<path d="M30 500H870L850 530H50Z" fill="${lidEdge}"/><rect x="380" y="500" width="140" height="8" rx="4" fill="${dark ? "#40444c" : "#8a919b"}"/>`;
  const css = riseCss(motion) + (motion ? `.stk{transform-box:fill-box;transform-origin:center;animation:peel .45s ease-out both}@keyframes peel{from{opacity:0;transform:scale(1.3)}}@media (prefers-reduced-motion:reduce){.stk{animation:none}}` : "");
  return svgDoc({ height, title: `${name} on GitHub, as a laptop covered in stickers`, bg: desk, radius: 14, css, body });
}
var laptop = imageTemplate("laptop", "Laptop stickers", "A laptop lid covered in die-cut stickers: your photo, a round sticker for each language and one for each repository.", ["creative", "device", "fun"], laptopSvg, {
  extra: () => "shown as a laptop lid covered in stickers"
});
function daysSinceActive(contributions) {
  if (!contributions || contributions.days.length === 0) return null;
  const days = contributions.days;
  const last = [...days].reverse().find((d) => d.count > 0);
  if (!last) return null;
  const gap = Math.round((Date.parse(`${days[days.length - 1].date}T00:00:00Z`) - Date.parse(`${last.date}T00:00:00Z`)) / 864e5);
  return Number.isFinite(gap) && gap >= 0 ? gap : null;
}
function petMood(contributions) {
  if (!contributions || contributions.days.length === 0) return "unknown";
  const gap = daysSinceActive(contributions);
  if (gap === null) return "hungry";
  if (gap <= 1) return "happy";
  if (gap <= 7) return "content";
  if (gap <= 30) return "sleepy";
  return "hungry";
}
var PET = [
  "....XXXXXX....",
  "..XXXXXXXXXX..",
  ".XXXXXXXXXXXX.",
  "XXXXXXXXXXXXXX",
  "XXXXXXXXXXXXXX",
  "XXXXXXXXXXXXXX",
  "XXXXXXXXXXXXXX",
  ".XXXXXXXXXXXX.",
  "..XXXXXXXXXX..",
  "...XX....XX..."
];
function petSvg(profile, config, variant) {
  const dark = variant === "dark";
  const hue = hueFor3(profile, 150);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const sky = dark ? "#161a2b" : "#bfe3f5";
  const hill = dark ? "#1f3a2a" : "#8fd18a";
  const panel2 = dark ? "#0f1220" : "#ffffff";
  const ink = dark ? "#eef1ff" : "#1d2433";
  const muted = dark ? "#8d96b8" : "#5d6785";
  const body = hslToHex(hue, 0.7, dark ? 0.6 : 0.62);
  const edge = hslToHex(hue, 0.7, dark ? 0.35 : 0.38);
  const name = profile.name ?? profile.login;
  const activity = blocks.has("activity") ? profile.contributions : void 0;
  const mood = petMood(activity);
  const gap = daysSinceActive(activity);
  const cell2 = 15;
  const ox = 120;
  const oy = 150;
  let art = `<g class="${mood === "happy" ? "hop" : mood === "sleepy" ? "doze" : ""}">`;
  PET.forEach((row, r) => {
    [...row].forEach((ch, c2) => {
      if (ch === "X") art += `<rect x="${ox + c2 * cell2}" y="${oy + r * cell2}" width="${cell2}" height="${cell2}" fill="${body}"/>`;
    });
  });
  art += `<rect x="${ox + 4 * cell2}" y="${oy}" width="${6 * cell2}" height="3" fill="${edge}"/>`;
  const eye = (c2) => {
    const x = ox + c2 * cell2;
    const y = oy + 4 * cell2;
    if (mood === "sleepy") return `<rect x="${x}" y="${y + 6}" width="${cell2 * 2}" height="4" fill="${edge}"/>`;
    if (mood === "hungry") return `<rect x="${x}" y="${y}" width="${cell2}" height="${cell2}" fill="${edge}"/><rect x="${x + cell2}" y="${y + cell2}" width="${cell2}" height="${cell2}" fill="${edge}"/>`;
    return `<rect x="${x}" y="${y}" width="${cell2 * 2}" height="${cell2 * 2}" fill="#1d2433"/><rect x="${x + 3}" y="${y + 3}" width="5" height="5" fill="#ffffff"/>`;
  };
  art += eye(3) + eye(9);
  const my = oy + 7 * cell2;
  if (mood === "happy") art += `<path d="M${ox + 5 * cell2} ${my}h${4 * cell2}v${cell2}h${-cell2}v${cell2}h${-2 * cell2}v${-cell2}h${-cell2}z" fill="#1d2433"/>`;
  else if (mood === "content") art += `<rect x="${ox + 5 * cell2}" y="${my + 4}" width="${4 * cell2}" height="${cell2 * 0.5}" fill="#1d2433"/>`;
  else if (mood === "sleepy") art += `<rect x="${ox + 6 * cell2}" y="${my + 4}" width="${2 * cell2}" height="${cell2 * 0.6}" fill="#1d2433"/>`;
  else if (mood === "hungry") art += `<path d="M${ox + 5 * cell2} ${my + cell2}h${cell2}v${-cell2}h${2 * cell2}v${cell2}h${cell2}v${cell2 * 0.6}h${-4 * cell2}z" fill="#1d2433"/>`;
  else art += `<rect x="${ox + 6 * cell2}" y="${my + 4}" width="${2 * cell2}" height="${cell2 * 0.5}" fill="#1d2433"/>`;
  art += `</g>`;
  if (mood === "sleepy") art += `<text x="${ox + 15 * cell2}" y="${oy + 2 * cell2}" font-size="26" font-weight="800" fill="${muted}" class="mono">z</text><text x="${ox + 16.5 * cell2}" y="${oy - 4}" font-size="20" font-weight="800" fill="${muted}" class="mono">z</text>`;
  const message = mood === "unknown" ? "Waiting for activity data." : activity && activity.currentStreak > 0 ? `I am on a ${activity.currentStreak}-day streak!` : gap === null ? "No activity this year." : gap === 0 ? "You were active today!" : `I last saw activity ${plural(gap, "day")} before the data ends.`;
  let scene = `<rect x="0" y="0" width="900" height="400" fill="${sky}"/>`;
  scene += `<ellipse cx="${ox + 7 * cell2}" cy="${oy + 10 * cell2 + 22}" rx="${9 * cell2}" ry="28" fill="${hill}"/>`;
  scene += art;
  let side = `<rect x="440" y="40" width="404" height="320" rx="16" fill="${panel2}"/>`;
  side += text3(truncate(name, 22), 464, 82, 24, ink, 'font-weight="800"');
  side += text3(`@${truncate(profile.login, 26)}`, 464, 104, 13, muted, 'class="mono"');
  side += `<rect x="464" y="124" width="356" height="48" rx="12" fill="${body}" fill-opacity="0.25"/>` + text3(truncate(message, 40), 478, 154, 16, ink, 'font-weight="700"');
  const bars = [];
  if (activity) {
    bars.push(["STREAK", activity.longestStreak > 0 ? activity.currentStreak / activity.longestStreak : 0, `${activity.currentStreak} of ${activity.longestStreak} days (best)`]);
    bars.push(["ACTIVE DAYS", activity.days.length > 0 ? activity.activeDays / activity.days.length : 0, `${activity.activeDays} of ${activity.days.length} days`]);
    const recent = activity.days.slice(-30);
    const active = recent.filter((d) => d.count > 0).length;
    bars.push(["LAST 30 DAYS", recent.length > 0 ? active / recent.length : 0, `${active} of ${recent.length} days`]);
  }
  if (bars.length === 0) side += text3(blocks.has("activity") ? "Activity appears after the first automatic update." : "The activity section is switched off.", 464, 210, 13, muted, 'font-style="italic"');
  bars.forEach(([label4, frac, caption], i) => {
    const y = 206 + i * 52;
    side += text3(label4, 464, y, 11, muted, 'letter-spacing="3" font-weight="800"') + text3(caption, 820, y, 12, ink, 'class="mono" text-anchor="end"');
    side += `<rect x="464" y="${y + 8}" width="356" height="14" rx="7" fill="${muted}" fill-opacity="0.25"/><rect x="464" y="${y + 8}" width="${num4(Math.max(0, Math.min(1, frac)) * 356)}" height="14" rx="7" fill="${body}"/>`;
  });
  const css = riseCss(motion) + (motion ? `.hop{animation:hop .9s ease-in-out infinite alternate}@keyframes hop{to{transform:translateY(-16px)}}.doze{animation:doze 3s ease-in-out infinite alternate}@keyframes doze{to{transform:translateY(4px)}}@media (prefers-reduced-motion:reduce){.hop,.doze{animation:none}}` : "");
  return svgDoc({ height: 400, title: `${name} on GitHub, as a pixel pet`, bg: sky, radius: 14, css, body: rise(scene + side, motion, 0.05) });
}
var pet = imageTemplate("pet", "Pixel pet", "A pixel pet whose mood follows your real activity: happy when you coded lately, sleepy when you have not.", ["creative", "device", "activity"], petSvg, {
  extra: () => "shown as a pixel pet whose mood follows recent activity"
});
var deviceTemplates = [departures, handheld, neon, laptop, pet];

// ../core/src/templates/dataart.ts
var hueFor4 = (profile, fallback) => hueOf(profile.avatar?.grid.tint) ?? fallback;
var text4 = (value, x, y, size, fill, extra = "") => `<text x="${num4(x)}" y="${num4(y)}" font-size="${size}" fill="${fill}" ${extra}>${xmlEscape(value)}</text>`;
function metroLines(profile, maxLines = 6) {
  return profile.languages.slice(0, maxLines).map((language) => ({
    language,
    stations: profile.topRepos.filter((repo) => repo.language === language.name).slice(0, 3)
  }));
}
function metroSvg(profile, config, variant) {
  const dark = variant === "dark";
  const hue = hueFor4(profile, 200);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const bg = dark ? "#101319" : "#f3f1ea";
  const ink = dark ? "#eef1f6" : "#1b1f27";
  const muted = dark ? "#8590a3" : "#6b7280";
  const name = profile.name ?? profile.login;
  const lines = blocks.has("languages") ? metroLines(profile) : [];
  const hub2 = { x: 450, y: 232 };
  const slots = [[1, 1], [-1, 1], [1, 0], [-1, 2], [1, 2], [-1, 0]];
  let body = text4("GITHUB TRANSIT", 36, 52, 11, muted, 'letter-spacing="4" font-weight="800"');
  body += text4(truncate(name, 30), 36, 82, 26, ink, 'font-weight="800"');
  body += text4(`@${profile.login}`, 36, 104, 13, muted, 'class="mono"');
  if (lines.length === 0) body += text4(blocks.has("languages") ? "No lines are open yet." : "The languages section is switched off.", 36, 150, 14, muted, 'font-style="italic"');
  let stations = "";
  lines.forEach((line, i) => {
    const [side, slot] = slots[i];
    const color = langColor(line.language.name, variant);
    const dy = (slot - 1) * 118;
    const yEnd = hub2.y + dy;
    const xBend = hub2.x + side * 78;
    const xTurn = xBend + side * Math.abs(dy);
    const xEnd = hub2.x + side * 388;
    const d = `M${hub2.x} ${hub2.y}H${xBend}L${xTurn} ${yEnd}H${xEnd}`;
    body += `<path d="${d}" fill="none" stroke="${color}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"${motion ? ' class="draw" pathLength="1"' : ""} style="animation-delay:${(0.2 + i * 0.25).toFixed(2)}s"/>`;
    body += `<rect x="${xEnd - side * 3 - 3}" y="${yEnd - 16}" width="6" height="32" rx="3" fill="${color}"/>`;
    body += text4(`${truncate(line.language.name, 14)} ${Math.round(line.language.percent)}%`, xEnd + side * 2, yEnd - 24, 12.5, color, `text-anchor="${side === 1 ? "end" : "start"}" font-weight="800"`);
    const first = xTurn + side * 50;
    const last = xEnd - side * 44;
    line.stations.forEach((repo, j) => {
      const t = line.stations.length === 1 ? 0.5 : j / (line.stations.length - 1);
      const x = first + (last - first) * t;
      stations += `<circle cx="${num4(x)}" cy="${yEnd}" r="8" fill="${dark ? "#101319" : "#ffffff"}" stroke="${ink}" stroke-width="3.5"/>`;
      stations += text4(truncate(repo.name, 14), x, yEnd + 30, 12, ink, 'text-anchor="middle" font-weight="700"');
      stations += text4(`\u2605 ${formatNumber(repo.stars)}`, x, yEnd + 45, 10.5, muted, 'class="mono" text-anchor="middle"');
    });
  });
  body += stations;
  body += `<circle cx="${hub2.x}" cy="${hub2.y}" r="30" fill="${dark ? "#101319" : "#ffffff"}" stroke="${ink}" stroke-width="5"/>`;
  body += pictureBox(profile, hslToHex(hue, 0.6, 0.5), "#ffffff", hub2.x - 22, hub2.y - 22, 44, 44, 22, "mm");
  if (blocks.has("stats")) body += text4(`${formatNumber(profile.publicRepos)} repositories  \xB7  ${formatNumber(profile.totalStars)} stars`, 450, 408, 12, muted, 'class="mono" text-anchor="middle"');
  const css = riseCss(motion) + (motion ? `.draw{stroke-dasharray:1;stroke-dashoffset:0;animation:draw 1.2s ease-out both}@keyframes draw{from{stroke-dashoffset:1}}@media (prefers-reduced-motion:reduce){.draw{animation:none}}` : "");
  return svgDoc({ height: 440, title: `${name} on GitHub, as a transit map`, bg, radius: 14, css, body: rise(body, motion, 0.05) });
}
var metro = imageTemplate(
  "metro",
  "Metro map",
  "A transit map: a line for each language, a station for each repository, you at the interchange.",
  ["creative", "data", "languages"],
  metroSvg,
  { extra: () => "shown as a transit map with a line for each language and a station for each repository" }
);
function symbolOf(name) {
  const letters = [...name].filter((c2) => /[\p{L}\p{N}]/u.test(c2));
  if (letters.length === 0) return "?";
  return (letters[0].toUpperCase() + (letters[1] ?? "").toLowerCase()).slice(0, 2);
}
function ranksByStars(repos) {
  const order = repos.map((_r, i) => i).sort((a, b) => repos[b].stars - repos[a].stars || a - b);
  const ranks = new Array(repos.length);
  order.forEach((index, rank) => {
    ranks[index] = rank + 1;
  });
  return ranks;
}
function elementsSvg(profile, config, variant) {
  const dark = variant === "dark";
  const hue = hueFor4(profile, 260);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const bg = dark ? "#0f1216" : "#f5f4ef";
  const ink = dark ? "#eef0f4" : "#1d2127";
  const muted = dark ? "#8a92a1" : "#6a7080";
  const name = profile.name ?? profile.login;
  const repos = blocks.has("projects") ? profile.topRepos.slice(0, 6) : [];
  const ranks = ranksByStars(repos);
  const langs = blocks.has("languages") ? profile.languages.slice(0, 6) : [];
  let body = text4("THE PERIODIC TABLE OF", 36, 50, 11, muted, 'letter-spacing="4" font-weight="800"');
  body += text4(truncate(name, 28).toUpperCase(), 36, 84, 30, ink, 'font-weight="800" letter-spacing="1"');
  body += text4(`@${profile.login}`, 864, 84, 13, muted, 'class="mono" text-anchor="end"');
  const tw = 128;
  const th = 156;
  const gap = 12;
  const x0 = 450 - (repos.length * tw + (repos.length - 1) * gap) / 2;
  if (repos.length === 0 && blocks.has("projects")) body += text4("No elements discovered yet.", 36, 150, 14, muted, 'font-style="italic"');
  repos.forEach((repo, i) => {
    const x = x0 + i * (tw + gap);
    const y = 112;
    const color = repo.language ? langColor(repo.language, variant) : hslToHex(hue, 0.4, dark ? 0.55 : 0.5);
    body += `<g class="el" style="animation-delay:${(0.1 + i * 0.1).toFixed(2)}s">`;
    body += `<rect x="${x}" y="${y}" width="${tw}" height="${th}" rx="8" fill="${color}" fill-opacity="${dark ? 0.16 : 0.14}" stroke="${color}" stroke-width="2"/>`;
    body += text4(String(ranks[i]), x + 10, y + 22, 14, ink, 'class="mono" font-weight="700"');
    body += text4(formatNumber(repo.stars), x + tw - 10, y + 22, 12.5, muted, 'class="mono" text-anchor="end"');
    body += text4(symbolOf(repo.name), x + tw / 2, y + 90, 52, color, 'text-anchor="middle" font-weight="800"');
    body += text4(truncate(repo.name, 15), x + tw / 2, y + 122, 13.5, ink, 'text-anchor="middle" font-weight="700"');
    body += text4(repo.language ? truncate(repo.language, 16) : "unclassified", x + tw / 2, y + 142, 11, muted, 'text-anchor="middle"');
    body += `</g>`;
  });
  if (langs.length > 0) {
    body += text4("LANGUAGES", 36, 318, 11, muted, 'letter-spacing="4" font-weight="800"');
    const sw = 100;
    const sx0 = 450 - (langs.length * sw + (langs.length - 1) * 12) / 2;
    langs.forEach((lang, i) => {
      const x = sx0 + i * (sw + 12);
      const color = langColor(lang.name, variant);
      body += `<rect x="${x}" y="330" width="${sw}" height="82" rx="8" fill="${color}" fill-opacity="${dark ? 0.16 : 0.14}" stroke="${color}" stroke-width="1.5"/>`;
      body += text4(`${Math.round(lang.percent)}%`, x + sw - 8, 348, 11.5, muted, 'class="mono" text-anchor="end"');
      body += text4(symbolOf(lang.name), x + sw / 2, 384, 28, color, 'text-anchor="middle" font-weight="800"');
      body += text4(truncate(lang.name, 12), x + sw / 2, 403, 10.5, ink, 'text-anchor="middle" font-weight="700"');
    });
  }
  body += text4("number = rank by stars \xB7 top right = stars \xB7 bottom = main language", 36, 436, 10.5, muted, 'class="mono"');
  const css = riseCss(motion) + (motion ? `.el{animation:pop .5s ease-out both}@keyframes pop{from{opacity:0;transform:translateY(10px)}}@media (prefers-reduced-motion:reduce){.el{animation:none}}` : "");
  return svgDoc({ height: 456, title: `${name} on GitHub, as a periodic table of repositories`, bg, radius: 14, css, body });
}
var elements = imageTemplate(
  "elements",
  "Elements",
  "A periodic table of your repositories: a symbol, a rank by stars and a tile for each language.",
  ["creative", "data", "projects"],
  elementsSvg,
  { extra: () => "shown as a periodic table of repositories" }
);
function squarify(values, box) {
  const total = values.reduce((sum, v) => sum + Math.max(0, v), 0);
  const out = values.map(() => ({ x: box.x, y: box.y, w: 0, h: 0 }));
  if (values.length === 0 || total <= 0) return out;
  const order = values.map((_v, i) => i).sort((a, b) => values[b] - values[a] || a - b);
  const scale = box.w * box.h / total;
  let { x, y, w, h } = box;
  const worst = (areas, side) => {
    const sum = areas.reduce((a, b) => a + b, 0);
    const max = Math.max(...areas);
    const min = Math.min(...areas);
    return Math.max(side * side * max / (sum * sum), sum * sum / (side * side * min));
  };
  let at2 = 0;
  while (at2 < order.length) {
    const side = Math.min(w, h);
    const row = [at2];
    let areas = [Math.max(0, values[order[at2]]) * scale];
    while (at2 + row.length < order.length) {
      const next = Math.max(0, values[order[at2 + row.length]]) * scale;
      if (areas.every((a) => a > 0) && next > 0 && worst([...areas, next], side) > worst(areas, side)) break;
      row.push(at2 + row.length);
      areas = [...areas, next];
    }
    const sum = areas.reduce((a, b) => a + b, 0);
    if (w >= h) {
      const rowW = h > 0 ? sum / h : 0;
      let cy = y;
      row.forEach((slot, k) => {
        const rh = sum > 0 ? areas[k] / sum * h : 0;
        out[order[slot]] = { x, y: cy, w: rowW, h: rh };
        cy += rh;
      });
      x += rowW;
      w -= rowW;
    } else {
      const rowH = w > 0 ? sum / w : 0;
      let cx = x;
      row.forEach((slot, k) => {
        const rw = sum > 0 ? areas[k] / sum * w : 0;
        out[order[slot]] = { x: cx, y, w: rw, h: rowH };
        cx += rw;
      });
      y += rowH;
      h -= rowH;
    }
    at2 += row.length;
  }
  return out;
}
function treemapSvg(profile, config, variant) {
  const dark = variant === "dark";
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const bg = dark ? "#0e1115" : "#eceae4";
  const ink = dark ? "#f1f3f7" : "#1a1d23";
  const muted = dark ? "#8a93a3" : "#666d7b";
  const name = profile.name ?? profile.login;
  const repos = blocks.has("projects") ? profile.topRepos.slice(0, 6) : [];
  const langs = blocks.has("languages") ? profile.languages.slice(0, 6) : [];
  let body = text4(truncate(name, 30), 36, 54, 24, ink, 'font-weight="800"');
  body += text4(`@${profile.login}`, 864, 54, 13, muted, 'class="mono" text-anchor="end"');
  const area = { x: 36, y: 76, w: 828, h: langs.length > 0 ? 290 : 330 };
  if (repos.length === 0) body += text4(blocks.has("projects") ? "Nothing to measure yet." : "The projects section is switched off.", 36, 120, 14, muted, 'font-style="italic"');
  const boxes = squarify(repos.map((r) => r.stars + 1), area);
  repos.forEach((repo, i) => {
    const b = boxes[i];
    if (b.w < 4 || b.h < 4) return;
    const color = repo.language ? langColor(repo.language, variant) : muted;
    const inset = 2;
    const x = b.x + inset;
    const y = b.y + inset;
    const w = b.w - inset * 2;
    const h = b.h - inset * 2;
    body += `<g class="tile" style="animation-delay:${(0.08 * i).toFixed(2)}s">`;
    body += `<rect x="${num4(x)}" y="${num4(y)}" width="${num4(w)}" height="${num4(h)}" rx="6" fill="${color}" fill-opacity="${dark ? 0.2 : 0.17}" stroke="${color}" stroke-width="1.5"/>`;
    if (w > 70 && h > 26 && h <= 62) {
      body += text4(truncate(`${repo.name}  \u2605 ${formatNumber(repo.stars)}`, Math.max(4, Math.floor(w / 7.4))), x + 10, y + h / 2 + 4.5, 12.5, ink, 'font-weight="800"');
    } else if (w > 70 && h > 62) {
      const size = Math.max(12, Math.min(24, w / 9, (h - 30) / 1.7));
      body += text4(truncate(repo.name, Math.max(4, Math.floor(w / (size * 0.58)))), x + 12, y + 14 + size, size, ink, 'font-weight="800"');
      body += text4(`\u2605 ${formatNumber(repo.stars)}`, x + 12, y + 32 + size, Math.max(11, size * 0.62), color, 'class="mono" font-weight="700"');
      if (repo.description && h > 110 && w > 150) {
        wrap(repo.description, Math.floor(w / 7), 2).forEach((part, j) => {
          body += text4(part, x + 12, y + 62 + size + j * 16, 12, muted);
        });
      }
    }
    body += `</g>`;
  });
  if (langs.length > 0) {
    let cx = 36;
    const total = langs.reduce((s, l) => s + l.percent, 0);
    langs.forEach((lang) => {
      const w = total > 0 ? lang.percent / total * 828 : 0;
      const color = langColor(lang.name, variant);
      body += `<rect x="${num4(cx + 1)}" y="380" width="${num4(Math.max(0, w - 2))}" height="30" rx="4" fill="${color}" fill-opacity="${dark ? 0.85 : 0.9}"/>`;
      if (w > 62) body += text4(`${truncate(lang.name, Math.floor(w / 8))} ${Math.round(lang.percent)}%`, cx + 9, 400, 11.5, dark ? "#0b0d10" : "#ffffff", 'font-weight="800"');
      cx += w;
    });
  }
  body += text4("area = stars + 1 \xB7 colour = main language", 36, 436, 10.5, muted, 'class="mono"');
  const css = riseCss(motion) + (motion ? `.tile{animation:grow .55s ease-out both}@keyframes grow{from{opacity:0;transform:scale(.96)}}@media (prefers-reduced-motion:reduce){.tile{animation:none}}` : "");
  return svgDoc({ height: 456, title: `${name} on GitHub, as a treemap of repositories`, bg, radius: 14, css, body });
}
var treemap = imageTemplate(
  "treemap",
  "Treemap",
  "Your repositories as tiles, each as large as its stars, over a bar of your languages.",
  ["creative", "data", "projects"],
  treemapSvg,
  { extra: () => "shown as a treemap with repository tiles sized by stars" }
);
var SPINE_MIN = 120;
var SPINE_MAX = 205;
function spineHeight(stars3, mostStars) {
  if (!(mostStars > 0) || !(stars3 > 0)) return SPINE_MIN;
  const share = Math.log10(stars3 + 1) / Math.log10(mostStars + 1);
  return Math.round(SPINE_MIN + Math.min(1, Math.max(0, share)) * (SPINE_MAX - SPINE_MIN));
}
function shelfSvg(profile, config, variant) {
  const dark = variant === "dark";
  const hue = hueFor4(profile, 28);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const wall = dark ? "#1b1612" : "#e9dcc6";
  const wood = dark ? "#3a2a1c" : "#9a6b3f";
  const woodDark = dark ? "#251a11" : "#7a5230";
  const ink = dark ? "#f1e6d2" : "#2b1d0f";
  const muted = dark ? "#a89677" : "#7b6240";
  const name = profile.name ?? profile.login;
  const repos = blocks.has("projects") ? profile.topRepos.slice(0, 6) : [];
  const langs = blocks.has("languages") ? profile.languages.slice(0, 5) : [];
  const most = Math.max(0, ...repos.map((r) => r.stars));
  const shelfY = 330;
  let body = "";
  body += `<rect x="46" y="48" width="150" height="176" rx="4" fill="${woodDark}"/>`;
  body += pictureBox(profile, hslToHex(hue, 0.5, 0.5), "#ffffff", 58, 60, 126, 152, 2, "bs");
  body += text4(truncate(name, 16), 121, 252, 15, ink, 'text-anchor="middle" font-weight="800"');
  body += text4(`@${truncate(profile.login, 20)}`, 121, 272, 12, muted, 'class="mono" text-anchor="middle"');
  if (blocks.has("stats")) body += text4(`${formatNumber(profile.followers)} followers`, 121, 292, 11.5, muted, 'text-anchor="middle"');
  let x = 236;
  if (repos.length === 0) body += text4(blocks.has("projects") ? "The shelf is empty." : "The projects section is switched off.", 240, 280, 14, muted, 'font-style="italic"');
  repos.forEach((repo, i) => {
    const h = spineHeight(repo.stars, most);
    const w = Math.min(86, Math.max(48, 26 + repo.name.length * 5));
    const color = repo.language ? langColor(repo.language, variant) : hslToHex(hue, 0.3, 0.45);
    const y = shelfY - h;
    body += `<g class="book" style="animation-delay:${(0.1 + i * 0.09).toFixed(2)}s">`;
    body += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${color}"/>`;
    body += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#000" fill-opacity="${dark ? 0.28 : 0.12}"/>`;
    body += `<rect x="${x + 6}" y="${y + 14}" width="${w - 12}" height="3" fill="#ffffff" fill-opacity="0.55"/><rect x="${x + 6}" y="${y + h - 18}" width="${w - 12}" height="3" fill="#ffffff" fill-opacity="0.55"/>`;
    body += `<text x="${x + w / 2 + 5}" y="${y + h - 30}" font-size="${w > 60 ? 14 : 13}" font-weight="800" fill="#ffffff" transform="rotate(-90 ${x + w / 2 + 5} ${y + h - 30})" text-anchor="start">${xmlEscape(truncate(repo.name, Math.max(6, Math.floor((h - 60) / 8.2))))}</text>`;
    body += `</g>`;
    x += w + 5;
  });
  body += `<rect x="30" y="${shelfY}" width="840" height="16" rx="3" fill="${wood}"/><rect x="30" y="${shelfY + 16}" width="840" height="6" fill="${woodDark}"/>`;
  if (langs.length > 0) {
    let sy = shelfY;
    const total = langs.reduce((s, l) => s + l.percent, 0) || 1;
    const stackH = 190;
    langs.forEach((lang) => {
      const h = Math.max(14, Math.round(lang.percent / total * stackH));
      sy -= h;
      const color = langColor(lang.name, variant);
      body += `<rect x="690" y="${sy}" width="156" height="${h - 2}" rx="3" fill="${color}"/><rect x="690" y="${sy}" width="156" height="${h - 2}" rx="3" fill="#000" fill-opacity="${dark ? 0.25 : 0.1}"/>`;
      if (h >= 17) body += text4(`${truncate(lang.name, 12)}  ${Math.round(lang.percent)}%`, 700, sy + h / 2 + 3.5, 11.5, "#ffffff", 'font-weight="800"');
    });
  }
  body += text4("height = stars (log scale) \xB7 stack thickness = share of code", 36, 380, 10.5, muted, 'class="mono"');
  const css = riseCss(motion) + (motion ? `.book{animation:slide .55s ease-out both}@keyframes slide{from{opacity:0;transform:translateY(-14px)}}@media (prefers-reduced-motion:reduce){.book{animation:none}}` : "");
  return svgDoc({ height: 400, title: `${name} on GitHub, as a bookshelf of repositories`, bg: wall, radius: 14, css, body });
}
var shelf = imageTemplate(
  "shelf",
  "Bookshelf",
  "Your repositories as book spines, as tall as their stars, with your languages stacked beside them.",
  ["creative", "data", "projects"],
  shelfSvg,
  { extra: () => "shown as a bookshelf with a spine for each repository" }
);
var dataArtTemplates = [metro, elements, treemap, shelf];

// ../core/src/templates/documents.ts
var hueFor5 = (profile, fallback) => hueOf(profile.avatar?.grid.tint) ?? fallback;
var text5 = (value, x, y, size, fill, extra = "") => `<text x="${num4(x)}" y="${num4(y)}" font-size="${size}" fill="${fill}" ${extra}>${xmlEscape(value)}</text>`;
function mrzLine(value, length = 44) {
  const clean = value.toUpperCase().replace(/[^A-Z0-9]+/g, "<");
  return clean.slice(0, length).padEnd(length, "<");
}
function passportSvg(profile, config, variant) {
  const dark = variant === "dark";
  const hue = hueFor5(profile, 215);
  const blocks = new Set(config.blocks);
  const motion = config.motion;
  const desk = dark ? hslToHex(hue, 0.25, 0.08) : hslToHex(hue, 0.2, 0.86);
  const page = dark ? hslToHex(40, 0.16, 0.15) : "#f6efdc";
  const ink = dark ? "#ece2c8" : "#2a2418";
  const muted = dark ? "#a39a82" : "#7a6f55";
  const rule = dark ? "#3b3526" : "#d8ccab";
  const seal = hslToHex(hue, 0.55, dark ? 0.62 : 0.34);
  const name = profile.name ?? profile.login;
  const issued = isoDate(profile.createdAt);
  let body = `<rect x="22" y="22" width="856" height="396" rx="12" fill="${page}" stroke="${rule}"/>`;
  body += `<path d="M450 22V418" stroke="${rule}" stroke-width="2"/><path d="M446 22V418" stroke="${ink}" stroke-opacity="0.07" stroke-width="8"/>`;
  body += text5("GITHUB PASSPORT", 56, 62, 11, seal, 'letter-spacing="3" font-weight="800"');
  body += text5("PASSEPORT \xB7 PASAPORTE \xB7 PASS", 56, 78, 8.5, muted, 'letter-spacing="1.6"');
  body += pictureBox(profile, seal, page, 56, 102, 150, 184, 6, "pp");
  body += `<rect x="56.5" y="102.5" width="149" height="183" rx="6" fill="none" stroke="${ink}" stroke-opacity="0.35"/>`;
  const fields = [["NAME", truncate(name, 22)], ["LOGIN", `@${truncate(profile.login, 20)}`]];
  if (issued) fields.push(["ISSUED (MEMBER SINCE)", issued]);
  if (profile.location) fields.push(["PLACE OF RESIDENCE", truncate(profile.location, 24)]);
  if (blocks.has("stats")) fields.push(["FOLLOWERS", formatNumber(profile.followers)]);
  fields.slice(0, 5).forEach(([caption, value], i) => {
    const y = 112 + i * 37;
    body += text5(caption, 228, y, 8.5, muted, 'letter-spacing="1.4" font-weight="700"');
    body += text5(value, 228, y + 18, 15, ink, 'font-weight="700"');
    body += `<path d="M228 ${y + 24}H430" stroke="${rule}"/>`;
  });
  const mrz1 = mrzLine(`P<GHB${name.replace(/\s+/g, "<<")}`);
  const mrz2 = mrzLine(`${profile.login}<${(issued ?? "").replace(/-/g, "")}`);
  body += `<rect x="40" y="326" width="396" height="68" rx="4" fill="${ink}" fill-opacity="0.05"/>`;
  body += text5(mrz1, 54, 354, 11.5, ink, 'class="mono" letter-spacing="0.5"');
  body += text5(mrz2, 54, 378, 11.5, ink, 'class="mono" letter-spacing="0.5"');
  body += text5("ENTRIES \xB7 LANGUAGES", 482, 62, 11, seal, 'letter-spacing="3" font-weight="800"');
  const langs = blocks.has("languages") ? profile.languages.slice(0, 6) : [];
  if (langs.length === 0) {
    body += text5(blocks.has("languages") ? "No stamps yet." : "The languages section is switched off.", 482, 130, 13, muted, 'font-style="italic"');
  }
  langs.forEach((lang, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const cx = 540 + col * 118;
    const cy = 150 + row * 128;
    const tilt = (hashOf(`${profile.login}:${lang.name}`) % 25 - 12) * 0.9;
    const color = langColor(lang.name, variant);
    const stamp = `<g transform="rotate(${num4(tilt)} ${cx} ${cy})" class="stamp" style="animation-delay:${(0.2 + i * 0.18).toFixed(2)}s"><circle cx="${cx}" cy="${cy}" r="50" fill="none" stroke="${color}" stroke-width="3" stroke-opacity="0.85"/><circle cx="${cx}" cy="${cy}" r="43" fill="none" stroke="${color}" stroke-width="1" stroke-opacity="0.85"/>` + text5(truncate(lang.name, 11).toUpperCase(), cx, cy - 6, 11.5, color, 'text-anchor="middle" font-weight="800" letter-spacing="0.8"') + text5(`${Math.round(lang.percent)}%`, cx, cy + 17, 18, color, 'text-anchor="middle" font-weight="800"') + `</g>`;
    body += stamp;
  });
  if (blocks.has("stats")) {
    const line = `${formatNumber(profile.publicRepos)} repositories  \xB7  ${formatNumber(profile.totalStars)} stars`;
    body += `<path d="M482 372H842" stroke="${rule}"/>`;
    body += text5(line, 482, 396, 12.5, muted, 'class="mono"');
  }
  const css = riseCss(motion) + (motion ? `.stamp{transform-box:fill-box;transform-origin:center;animation:slam .5s cubic-bezier(.2,.9,.3,1.4) both}@keyframes slam{from{opacity:0;transform:scale(1.9)}}@media (prefers-reduced-motion:reduce){.stamp{animation:none}}` : "");
  return svgDoc({ height: 440, title: `${name} on GitHub, as a passport`, bg: desk, radius: 14, css, body: rise(body, motion, 0) });
}
var passport = imageTemplate(
  "passport",
  "Passport",
  "An open passport with your photo and a stamp for every language you use.",
  ["creative", "document", "fun"],
  passportSvg,
  { extra: () => "shown as an open passport with a stamp for each language" }
);
function receiptSvg(profile, config, variant) {
  const dark = variant === "dark";
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const desk = dark ? "#15171c" : "#d9dde3";
  const paper = dark ? "#ecebe6" : "#fbfaf6";
  const ink = "#26282d";
  const faint = "#7d8088";
  const left = 300;
  const right = 600;
  const lh = 19;
  const repos = blocks.has("projects") ? profile.topRepos.slice(0, 5) : [];
  const date = isoDate(profile.fetchedAt);
  const name = profile.name ?? profile.login;
  const lines = [];
  let y = 74;
  const centre = (value, size = 13, weight = 600, fill = ink) => {
    lines.push(text5(value, 450, y, size, fill, `class="mono" text-anchor="middle" font-weight="${weight}"`));
    y += lh;
  };
  const dashes = () => {
    lines.push(`<path d="M${left} ${y - 5}H${right}" stroke="${faint}" stroke-dasharray="4 3"/>`);
    y += 12;
  };
  const row = (a, b, size = 12.5, weight = 500) => {
    lines.push(text5(a, left, y, size, ink, `class="mono" font-weight="${weight}"`));
    lines.push(text5(b, right, y, size, ink, `class="mono" text-anchor="end" font-weight="${weight}"`));
    y += lh;
  };
  centre("GITHUB  GENERAL  STORE", 14, 800);
  centre(`@${truncate(profile.login, 28)}`, 12.5, 500, faint);
  if (profile.location) centre(truncate(profile.location, 36), 12, 500, faint);
  y += 4;
  dashes();
  if (date) row("DATE", date);
  row("CUSTOMER", truncate(name, 24).toUpperCase());
  dashes();
  if (repos.length > 0) {
    row("ITEM", "STARS", 11, 800);
    for (const repo of repos) {
      row(truncate(repo.name, 26), formatNumber(repo.stars));
      if (repo.description) {
        lines.push(text5(truncate(repo.description, 40), left + 10, y - 2, 10.5, faint, 'class="mono"'));
        y += 15;
      }
    }
    dashes();
    row(`SUBTOTAL (${plural(repos.length, "item")})`, formatNumber(repos.reduce((sum, r) => sum + r.stars, 0)));
  }
  if (blocks.has("stats")) {
    row("TOTAL STARS", formatNumber(profile.totalStars), 14, 800);
    row("REPOSITORIES", formatNumber(profile.publicRepos));
    row("FOLLOWERS", formatNumber(profile.followers));
  }
  if (blocks.has("languages") && profile.languages.length > 0) {
    dashes();
    const tags = profile.languages.slice(0, 4).map((l) => `${l.name} ${Math.round(l.percent)}%`).join("  ");
    for (const part of wrap(`MADE WITH: ${tags}`, 38, 2)) {
      lines.push(text5(part, left, y, 11.5, ink, 'class="mono"'));
      y += 16;
    }
  }
  dashes();
  centre("THANK YOU FOR VISITING", 12.5, 700);
  y += 6;
  let bars = "";
  let bx = 340;
  const seed = hashOf(profile.login);
  for (let i = 0; bx < 560; i++) {
    const w = 1 + (seed >>> i % 24 ^ i * 7) % 4;
    if (i % 2 === 0) bars += `<rect x="${bx}" y="${y}" width="${w}" height="38" fill="${ink}"/>`;
    bx += w + 1;
  }
  lines.push(bars);
  y += 52;
  lines.push(text5(profile.login.toUpperCase(), 450, y, 10.5, faint, 'class="mono" text-anchor="middle" letter-spacing="3"'));
  y += 30;
  const height = y + 36;
  const across = (sign, dir) => {
    let d = "";
    for (let x = left - 20; x < right + 20; x += 10) d += `l${5 * sign} ${5 * dir}l${5 * sign} ${-5 * dir}`;
    return d;
  };
  const shape = `M${left - 20} 52${across(1, -1)}V${height - 40}${across(-1, 1)}Z`;
  const slot = `<rect x="260" y="26" width="380" height="24" rx="12" fill="${dark ? "#05060a" : "#8b909a"}"/>`;
  const paperShape = `<path d="${shape}" fill="${paper}"/><path d="${shape}" fill="none" stroke="#000" stroke-opacity="0.12"/>`;
  const printed = motion ? `<g class="print">${lines.join("")}</g>` : lines.join("");
  const css = motion ? `.print{animation:printout 2.4s steps(30) both}@keyframes printout{from{clip-path:inset(0 0 100% 0)}to{clip-path:inset(0 0 0 0)}}@media (prefers-reduced-motion:reduce){.print{animation:none}}` : "";
  return svgDoc({
    height,
    title: `${name} on GitHub, as a till receipt`,
    bg: desk,
    css,
    body: `${paperShape}${slot}${printed}`
  });
}
var receipt = imageTemplate(
  "receipt",
  "Receipt",
  "A thermal till receipt that prints your best repositories as items, with a total.",
  ["creative", "document", "fun"],
  receiptSvg,
  { extra: () => "shown as a till receipt listing repositories as items" }
);
function sheetSvg(profile, config, variant) {
  const dark = variant === "dark";
  const hue = hueFor5(profile, 28);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const bg = dark ? "#1d1710" : "#efe2c3";
  const sheet2 = dark ? "#261d12" : "#f7edd3";
  const ink = dark ? "#ead9b4" : "#3a2a14";
  const muted = dark ? "#a8946b" : "#7b6540";
  const line = dark ? "#4b3a22" : "#cdb78a";
  const accent2 = hslToHex(hue, 0.6, dark ? 0.62 : 0.36);
  const name = profile.name ?? profile.login;
  const since = isoDate(profile.createdAt)?.slice(0, 4);
  const years = yearsBetween(profile.createdAt, profile.fetchedAt);
  const bio = config.text.bio ?? profile.bio;
  const height = 470;
  let body = `<rect x="18" y="18" width="864" height="${height - 36}" rx="10" fill="${sheet2}" stroke="${line}" stroke-width="2"/>`;
  body += `<rect x="28" y="28" width="844" height="${height - 56}" rx="6" fill="none" stroke="${line}"/>`;
  body += pictureBox(profile, accent2, sheet2, 52, 54, 112, 112, 8, "cp");
  body += `<rect x="52" y="54" width="112" height="112" rx="8" fill="none" stroke="${accent2}" stroke-width="2.5"/>`;
  body += text5(truncate(name, 16), 182, 84, name.length > 12 ? 20 : 24, ink, 'class="serif" font-weight="700"');
  body += text5(`@${truncate(profile.login, 22)}`, 182, 106, 13, muted, 'class="mono"');
  if (since) body += text5(`Adventuring since ${since}`, 182, 130, 13, ink, 'class="serif" font-style="italic"');
  if (profile.location) body += text5(`Hails from ${truncate(profile.location, 22)}`, 182, 150, 13, ink, 'class="serif" font-style="italic"');
  const tiles = [];
  if (blocks.has("stats")) {
    tiles.push(["ALLIES", formatNumber(profile.followers)], ["RENOWN", formatNumber(profile.totalStars)], ["REALMS", formatNumber(profile.publicRepos)]);
    if (years !== null) tiles.push(["YEARS", formatNumber(years)]);
    else if (profile.totalForks !== void 0) tiles.push(["SPOILS", formatNumber(profile.totalForks)]);
  }
  tiles.forEach(([caption, value], i) => {
    const x = 52 + i % 2 * 132;
    const y = 190 + Math.floor(i / 2) * 82;
    body += `<rect x="${x}" y="${y}" width="120" height="70" rx="6" fill="${accent2}" fill-opacity="0.1" stroke="${accent2}" stroke-opacity="0.6"/>`;
    body += text5(value, x + 60, y + 38, 26, ink, 'class="serif" text-anchor="middle" font-weight="700"');
    body += text5(caption, x + 60, y + 58, 9.5, muted, 'text-anchor="middle" letter-spacing="2.4" font-weight="700"');
  });
  body += text5("SKILLS", 376, 70, 12, accent2, 'letter-spacing="4" font-weight="800"');
  body += `<path d="M376 80H600" stroke="${line}"/>`;
  const skills = blocks.has("languages") ? profile.languages.slice(0, 6) : [];
  if (skills.length === 0) body += text5(blocks.has("languages") ? "No skills listed." : "Skills are switched off.", 376, 108, 13, muted, 'class="serif" font-style="italic"');
  skills.forEach((lang, i) => {
    const y = 106 + i * 40;
    body += text5(truncate(lang.name, 16), 376, y, 13.5, ink, 'class="serif" font-weight="600"');
    body += text5(`${Math.round(lang.percent)}%`, 600, y, 12.5, muted, 'class="mono" text-anchor="end"');
    body += `<rect x="376" y="${y + 8}" width="224" height="8" rx="4" fill="${ink}" fill-opacity="0.1"/>`;
    body += `<rect x="376" y="${y + 8}" width="${num4(Math.max(6, 224 * lang.percent / 100))}" height="8" rx="4" fill="${langColor(lang.name, variant)}"/>`;
  });
  body += text5("QUESTS", 636, 70, 12, accent2, 'letter-spacing="4" font-weight="800"');
  body += `<path d="M636 80H846" stroke="${line}"/>`;
  const quests = blocks.has("projects") ? profile.topRepos.slice(0, 4) : [];
  if (quests.length === 0) body += text5(blocks.has("projects") ? "No quests yet." : "Quests are switched off.", 636, 108, 13, muted, 'class="serif" font-style="italic"');
  let qy = 104;
  for (const repo of quests) {
    body += text5(truncate(repo.name, 18), 636, qy, 14, ink, 'class="serif" font-weight="700"');
    body += text5(`\u2605 ${formatNumber(repo.stars)}`, 846, qy, 12, accent2, 'class="mono" text-anchor="end" font-weight="700"');
    const described = repo.description ? wrap(repo.description, 32, 2) : [];
    described.forEach((part, j) => {
      body += text5(part, 636, qy + 17 + j * 15, 11.5, muted, 'class="serif" font-style="italic"');
    });
    qy += 30 + described.length * 15;
  }
  body += `<path d="M52 374H846" stroke="${line}"/>`;
  body += text5("LEGEND", 52, 398, 10.5, accent2, 'letter-spacing="3.6" font-weight="800"');
  const legend = bio ? wrap(bio, 92, 2) : ["Nothing has been written here yet."];
  legend.forEach((part, i) => {
    body += text5(part, 52, 418 + i * 15, 12.5, ink, 'class="serif" font-style="italic"');
  });
  return svgDoc({ height, title: `${name} on GitHub, as a character sheet`, bg, radius: 14, css: riseCss(motion), body: rise(body, motion, 0.05) });
}
var sheet = imageTemplate(
  "sheet",
  "Character sheet",
  "A fantasy character sheet: allies, renown, skills, quests and a legend.",
  ["creative", "document", "fun"],
  sheetSvg,
  { extra: () => "shown as a fantasy character sheet with skills and quests" }
);
var MONTHS3 = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
var WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
function calendarMonth(profile) {
  const date = isoDate(profile.contributions?.to) ?? isoDate(profile.fetchedAt);
  if (!date) return null;
  return { year: Number(date.slice(0, 4)), month: Number(date.slice(5, 7)) - 1, today: date };
}
function calendarSvg(profile, config, variant) {
  const dark = variant === "dark";
  const hue = hueFor5(profile, 8);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const bg = dark ? "#16161a" : "#e6e3dc";
  const page = dark ? "#202026" : "#fffdf8";
  const ink = dark ? "#ecebf0" : "#25232b";
  const muted = dark ? "#8d8c98" : "#8a8693";
  const line = dark ? "#34343d" : "#e3dfd6";
  const accent2 = hslToHex(hue, 0.7, dark ? 0.62 : 0.46);
  const name = profile.name ?? profile.login;
  const when = calendarMonth(profile);
  const activity = blocks.has("activity") ? profile.contributions : void 0;
  const counts = new Map((activity?.days ?? []).map((d) => [d.date, d]));
  const levels = [0.14, 0.34, 0.5, 0.64].map((l, i) => hslToHex(hue, 0.55 + i * 0.1, dark ? l : 1 - l * 0.85));
  const first = when ? new Date(Date.UTC(when.year, when.month, 1)) : null;
  const lead = first ? (first.getUTCDay() + 6) % 7 : 0;
  const length = when ? new Date(Date.UTC(when.year, when.month + 1, 0)).getUTCDate() : 0;
  const gx = 58;
  const gy = 196;
  const cw = 112;
  const ch = 60;
  const bottom = gy + Math.ceil((lead + length) / 7) * ch;
  const height = when ? bottom + 100 : 280;
  let body = `<rect x="28" y="40" width="844" height="${height - 60}" rx="10" fill="${page}" stroke="${line}"/>`;
  body += `<rect x="28" y="40" width="844" height="96" rx="10" fill="${accent2}"/><rect x="28" y="110" width="844" height="26" fill="${accent2}"/>`;
  for (let i = 0; i < 14; i++) {
    const x = 70 + i * 60;
    body += `<rect x="${x - 4}" y="24" width="8" height="30" rx="4" fill="${dark ? "#0b0b0e" : "#4a4750"}"/><circle cx="${x}" cy="46" r="5" fill="${bg}"/>`;
  }
  body += pictureBox(profile, page, accent2, 52, 62, 62, 62, 31, "wc");
  body += `<circle cx="83" cy="93" r="30" fill="none" stroke="#fff" stroke-opacity="0.8" stroke-width="2"/>`;
  body += text5(truncate(name, 24), 130, 90, 20, "#ffffff", 'font-weight="700"');
  body += text5(`@${truncate(profile.login, 24)}`, 130, 110, 12.5, "#ffffff", 'class="mono" fill-opacity="0.85"');
  if (!when) {
    body += text5("The calendar appears after the first automatic update.", 60, 200, 15, muted, 'font-style="italic"');
    return svgDoc({ height, title: `${name} on GitHub, as a wall calendar`, bg, radius: 14, css: riseCss(motion), body });
  }
  body += text5(MONTHS3[when.month].toUpperCase(), 848, 92, 34, "#ffffff", 'text-anchor="end" font-weight="800" letter-spacing="3"');
  body += text5(String(when.year), 848, 114, 14, "#ffffff", 'text-anchor="end" letter-spacing="4" fill-opacity="0.85"');
  WEEKDAYS.forEach((day, i) => {
    body += text5(day, gx + i * cw + cw / 2 - 4, 168, 10.5, i > 4 ? accent2 : muted, 'text-anchor="middle" letter-spacing="2" font-weight="700"');
  });
  for (let d = 1; d <= length; d++) {
    const slot = lead + d - 1;
    const x = gx + slot % 7 * cw;
    const y = gy + Math.floor(slot / 7) * ch;
    const iso = `${when.year}-${String(when.month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const day = counts.get(iso);
    const future = iso > when.today;
    let fill = "none";
    let numberFill = future ? muted : ink;
    if (day && day.count > 0) {
      fill = levels[Math.min(3, Math.max(0, day.level - 1))];
      numberFill = dark ? "#ffffff" : day.level >= 3 ? "#ffffff" : ink;
    }
    body += `<rect x="${x + 2}" y="${y + 2}" width="${cw - 4}" height="${ch - 4}" rx="6" fill="${fill}" stroke="${iso === when.today ? accent2 : line}" stroke-width="${iso === when.today ? 2.5 : 1}"${activity && !day && !future ? ' stroke-dasharray="3 3"' : ""}/>`;
    body += text5(String(d), x + 12, y + 22, 14, numberFill, 'font-weight="700"');
    if (day && day.count > 0) body += text5(String(day.count), x + cw - 12, y + ch - 12, 12, numberFill, 'class="mono" text-anchor="end" font-weight="700"');
  }
  let month = 0;
  let active = 0;
  for (const day of activity?.days ?? []) {
    if (day.date.startsWith(`${when.year}-${String(when.month + 1).padStart(2, "0")}`)) {
      month += day.count;
      if (day.count > 0) active += 1;
    }
  }
  const notes = [];
  if (activity) {
    notes.push(`${formatNumber(month)} contributions this month`, `${plural(active, "active day")} this month`, `${plural(activity.currentStreak, "day")} current streak`, `${plural(activity.longestStreak, "day")} longest streak this year`);
  } else if (blocks.has("activity")) {
    notes.push("Contribution colours appear after the first automatic update.");
  }
  const noteY = bottom + 34;
  body += `<path d="M56 ${bottom + 12}H844" stroke="${line}"/>`;
  notes.forEach((note, i) => {
    body += text5(note, 56 + i % 2 * 400, noteY + Math.floor(i / 2) * 22, 13, i === 0 ? ink : muted, `class="mono" font-weight="${i === 0 ? 700 : 500}"`);
  });
  return svgDoc({ height, title: `${name} on GitHub, as a wall calendar`, bg, radius: 14, css: riseCss(motion), body: rise(body, motion, 0.05) });
}
var calendar = imageTemplate(
  "calendar",
  "Wall calendar",
  "A wall calendar page with every day coloured by your real contributions.",
  ["creative", "document", "activity"],
  calendarSvg,
  { activity: true, extra: () => "shown as a wall calendar page" }
);
var documentTemplates = [passport, receipt, sheet, calendar];

// ../core/src/templates/brief.ts
var WIDTH3 = 900;
var PAD7 = 44;
var PHOTO = 96;
var PHOTO_GAP = 28;
var COL_GAP = 40;
var WORK_WIDTH = 540;
var PAPER = {
  light: { bg: "#fbfaf6", fg: "#1c1b19", muted: "#68655d", rule: "#dedad0", track: "#ebe7dc" },
  dark: { bg: "#14161a", fg: "#ecebe6", muted: "#9a978f", rule: "#2c2f35", track: "#23262c" }
};
function label3(text10, x, y, color) {
  return `<text x="${x}" y="${y}" font-size="12" font-weight="700" letter-spacing="1.8" fill="${color}">${xmlEscape(text10)}</text>`;
}
function renderSvg4(profile, config, variant) {
  const t = PAPER[variant];
  const accent2 = profile.avatar?.grid.tint ? accentColors(profile.avatar.grid.tint, variant)[0] ?? t.fg : FALLBACK_ACCENTS[variant][1] ?? t.fg;
  const motion = config.motion;
  const parts = [];
  let step = 0;
  const next = () => step++ * 0.1;
  const uri = profile.avatar?.dataUri;
  const hasPhoto = Boolean(uri && SAFE_DATA_URI.test(uri));
  const textWidth = hasPhoto ? WIDTH3 - PAD7 * 2 - PHOTO - PHOTO_GAP : WIDTH3 - PAD7 * 2;
  let y = PAD7 + 38;
  const header = [
    `<text x="${PAD7}" y="${y}" class="serif" font-size="42" font-weight="700" fill="${t.fg}">${xmlEscape(truncate(profile.name ?? profile.login, Math.floor(textWidth / 22)))}</text>`
  ];
  if (config.text.headline) {
    y += 34;
    header.push(
      `<text x="${PAD7}" y="${y}" font-size="19" font-weight="600" fill="${accent2}">${xmlEscape(truncate(config.text.headline, Math.floor(textWidth / 10)))}</text>`
    );
  }
  const website = safeUrl(profile.website)?.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const contact = [profile.company, profile.location, website].filter((v) => Boolean(v));
  if (contact.length > 0) {
    y += 28;
    header.push(
      `<text x="${PAD7}" y="${y}" font-size="14" fill="${t.muted}">${xmlEscape(truncate(contact.join("  \xB7  "), Math.floor(textWidth / 7.4)))}</text>`
    );
  }
  const bio = config.text.bio ?? profile.bio;
  if (bio) {
    wrap(bio, Math.floor(textWidth / 7.6), 3).forEach((line, index) => {
      y += index === 0 ? 32 : 22;
      header.push(`<text x="${PAD7}" y="${y}" font-size="15" fill="${t.fg}" fill-opacity="0.85">${xmlEscape(line)}</text>`);
    });
  }
  if (hasPhoto && uri) {
    const x = WIDTH3 - PAD7 - PHOTO;
    header.push(
      `<clipPath id="photo"><rect x="${x}" y="${PAD7}" width="${PHOTO}" height="${PHOTO}" rx="16"/></clipPath><image href="${uri}" x="${x}" y="${PAD7}" width="${PHOTO}" height="${PHOTO}" preserveAspectRatio="xMidYMid slice" clip-path="url(#photo)"/><rect x="${x + 0.5}" y="${PAD7 + 0.5}" width="${PHOTO - 1}" height="${PHOTO - 1}" rx="16" fill="none" stroke="${t.rule}"/>`
    );
  }
  const headerBottom = Math.max(y, hasPhoto ? PAD7 + PHOTO : 0) + 28;
  parts.push(rise(header.join(""), motion, next()));
  parts.push(
    `<rect x="${PAD7}" y="${headerBottom}" width="${WIDTH3 - PAD7 * 2}" height="1" fill="${t.rule}"/><rect x="${PAD7}" y="${headerBottom - 1}" width="56" height="3" fill="${accent2}"/>`
  );
  let cursor = headerBottom + 32;
  if (config.blocks.includes("stats")) {
    const since = new Date(profile.createdAt).getUTCFullYear();
    const cells2 = [
      [formatNumber(profile.publicRepos), "REPOSITORIES"],
      [formatNumber(profile.totalStars), "STARS EARNED"],
      [formatNumber(profile.followers), "FOLLOWERS"]
    ];
    if (Number.isFinite(since)) cells2.push([String(since), "MEMBER SINCE"]);
    const cellWidth = (WIDTH3 - PAD7 * 2) / cells2.length;
    const markup = cells2.map(([value, caption], index) => {
      const x = PAD7 + index * cellWidth + (index > 0 ? 22 : 0);
      const divider = index > 0 ? `<rect x="${(PAD7 + index * cellWidth).toFixed(1)}" y="${cursor}" width="1" height="54" fill="${t.rule}"/>` : "";
      return divider + `<text x="${x.toFixed(1)}" y="${cursor + 34}" class="serif" font-size="34" font-weight="700" fill="${t.fg}">${xmlEscape(value)}</text><text x="${x.toFixed(1)}" y="${cursor + 54}" font-size="11" letter-spacing="1.3" fill="${t.muted}">${caption}</text>`;
    }).join("");
    parts.push(rise(markup, motion, next()));
    cursor += 54 + 22;
    parts.push(`<rect x="${PAD7}" y="${cursor}" width="${WIDTH3 - PAD7 * 2}" height="1" fill="${t.rule}"/>`);
    cursor += 32;
  }
  const showWork = config.blocks.includes("projects") && profile.topRepos.length > 0;
  const showStack = config.blocks.includes("languages") && profile.languages.length > 0;
  const workWidth = showStack ? WORK_WIDTH : WIDTH3 - PAD7 * 2;
  const stackX = showWork ? PAD7 + WORK_WIDTH + COL_GAP : PAD7;
  const stackWidth = showWork ? WIDTH3 - PAD7 - stackX : 360;
  let bottom = cursor;
  if (showWork) {
    let iy = cursor + 36;
    const work = [label3("SELECTED WORK", PAD7, cursor + 8, accent2)];
    for (const repo of profile.topRepos.slice(0, 4)) {
      work.push(
        `<text x="${PAD7}" y="${iy}" font-size="16" font-weight="700" fill="${t.fg}">${xmlEscape(truncate(repo.name, Math.floor((workWidth - 80) / 9)))}</text><text x="${PAD7 + workWidth}" y="${iy}" text-anchor="end" font-size="13" fill="${t.muted}">\u2605 ${xmlEscape(formatNumber(repo.stars))}</text>`
      );
      let ly = iy;
      if (repo.description) {
        for (const line of wrap(repo.description, Math.floor(workWidth / 6.9), 2)) {
          ly += 20;
          work.push(`<text x="${PAD7}" y="${ly}" font-size="13.5" fill="${t.muted}">${xmlEscape(line)}</text>`);
        }
      }
      if (repo.language) {
        ly += 20;
        work.push(`<text x="${PAD7}" y="${ly}" font-size="12.5" fill="${accent2}">${xmlEscape(repo.language)}</text>`);
      }
      work.push(`<rect x="${PAD7}" y="${ly + 14}" width="${workWidth}" height="1" fill="${t.rule}"/>`);
      iy = ly + 14 + 30;
    }
    parts.push(rise(work.join(""), motion, next()));
    bottom = Math.max(bottom, iy - 30);
  }
  if (showStack) {
    const stack = [label3("STACK", stackX, cursor + 8, accent2)];
    let sy = cursor + 38;
    for (const language of profile.languages) {
      const filled = Math.max(3, language.percent / 100 * stackWidth);
      stack.push(
        `<text x="${stackX}" y="${sy}" font-size="14" fill="${t.fg}">${xmlEscape(truncate(language.name, 22))}</text><text x="${stackX + stackWidth}" y="${sy}" text-anchor="end" font-size="14" fill="${t.muted}">${language.percent}%</text><rect x="${stackX}" y="${sy + 9}" width="${stackWidth}" height="4" rx="2" fill="${t.track}"/><rect x="${stackX}" y="${sy + 9}" width="${filled.toFixed(1)}" height="4" rx="2" fill="${accent2}"/>`
      );
      sy += 38;
    }
    stack.push(`<text x="${stackX}" y="${sy + 2}" font-size="11.5" fill="${t.muted}">By number of repositories</text>`);
    parts.push(rise(stack.join(""), motion, next()));
    bottom = Math.max(bottom, sy + 8);
  }
  const footerY = bottom + 18;
  parts.push(
    rise(
      `<rect x="${PAD7}" y="${footerY}" width="${WIDTH3 - PAD7 * 2}" height="1" fill="${t.rule}"/><text x="${PAD7}" y="${footerY + 28}" font-size="13" fill="${t.muted}">github.com/${xmlEscape(profile.login)}</text>`,
      motion,
      next()
    )
  );
  const height = footerY + 28 + PAD7 - 12;
  const title = `${profile.name ?? profile.login} (@${profile.login}) on GitHub`;
  const css = motion ? `.rise{animation:rise .6s ease both}
@keyframes rise{from{opacity:0;transform:translateY(6px)}}
@media (prefers-reduced-motion:reduce){.rise{animation:none}}` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH3}" height="${height}" viewBox="0 0 ${WIDTH3} ${height}" role="img" aria-labelledby="t">
<title id="t">${xmlEscape(title)}</title>
<style>
text{font-family:${FONT_SANS}}
.serif{font-family:${FONT_SERIF}}
${css}
</style>
<rect width="${WIDTH3}" height="${height}" rx="6" fill="${t.bg}"/>
<rect x="0.5" y="0.5" width="${WIDTH3 - 1}" height="${height - 1}" rx="6" fill="none" stroke="${t.rule}"/>
${parts.filter(Boolean).join("\n")}
</svg>
`;
}
var brief = {
  id: "brief",
  name: "Recruiter brief",
  description: "A calm, paper-style one-page brief you can scan in ten seconds: who you are, proof of work, your stack.",
  tags: ["light", "clean", "professional", "resume"],
  needsAvatar: true,
  render(profile, config) {
    const assets = variantsFor(config.theme).map((variant) => ({
      path: assetPath("brief", variant),
      content: renderSvg4(profile, config, variant)
    }));
    return { readme: imageReadme(profile, config, "brief", WIDTH3, describeProfile(profile, config)), assets };
  }
};

// ../core/src/templates/buildlog.ts
var WIDTH4 = 900;
var PAD8 = 44;
var AXIS_X = 168;
var CONTENT_X = 196;
var SPARK_WEEKS = 26;
var MAX_ENTRIES = 6;
var MONTHS4 = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function shortDay(pushedAt) {
  const time = Date.parse(pushedAt);
  if (!Number.isFinite(time)) return null;
  const d = new Date(time);
  return `${MONTHS4[d.getUTCMonth()].slice(0, 3)} ${d.getUTCDate()}`;
}
function groupByMonth(repos, limit = MAX_ENTRIES) {
  const dated = repos.map((repo) => ({ repo, time: Date.parse(repo.pushedAt ?? "") })).filter((entry) => Number.isFinite(entry.time)).sort((a, b) => b.time - a.time || a.repo.name.localeCompare(b.repo.name)).slice(0, limit);
  const groups = [];
  for (const { repo, time } of dated) {
    const d = new Date(time);
    const label4 = `${MONTHS4[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
    const last = groups[groups.length - 1];
    if (last && last.label === label4) last.items.push(repo);
    else groups.push({ label: label4, items: [repo] });
  }
  return groups;
}
var num5 = (value) => String(Math.round(value * 10) / 10 || 0);
function lookFor3(variant, hue) {
  const dark = variant === "dark";
  return {
    bg: dark ? "#0d1117" : "#ffffff",
    panel: dark ? "#141b26" : "#f3f6fa",
    fg: dark ? "#e6edf3" : "#1b2430",
    muted: dark ? "#8b98a9" : "#5f6c7d",
    line: dark ? "#2a3546" : "#d3dbe6",
    accent: hslToHex(hue, 0.7, dark ? 0.58 : 0.4),
    accent2: hslToHex((hue + 40) % 360, 0.75, dark ? 0.62 : 0.42)
  };
}
function renderSvg5(profile, config, variant) {
  const look = lookFor3(variant, hueOf(profile.avatar?.grid.tint) ?? 165);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const parts = [];
  let step = 0;
  const next = () => step++ * 0.09;
  const recent = profile.recentRepos ?? [];
  const latest = recent.find((r) => r.pushedAt && Number.isFinite(Date.parse(r.pushedAt)));
  const latestAgo = latest?.pushedAt && profile.fetchedAt ? timeAgo(latest.pushedAt, profile.fetchedAt) : null;
  let header = `<text class="mono" x="${PAD8}" y="${PAD8 + 4}" font-size="12.5" letter-spacing="2" fill="${look.accent}">BUILD LOG</text><text x="${PAD8}" y="${PAD8 + 44}" font-size="36" font-weight="800" fill="${look.fg}">${xmlEscape(truncate(profile.name ?? profile.login, 28))}</text>`;
  const sub2 = [profile.name ? `@${profile.login}` : "", config.text.headline ? truncate(config.text.headline, 56) : ""].filter(Boolean).join("  \xB7  ");
  if (sub2) header += `<text x="${PAD8}" y="${PAD8 + 70}" font-size="14.5" fill="${look.muted}">${xmlEscape(sub2)}</text>`;
  if (blocks.has("stats")) {
    const facts = [];
    if (latestAgo) facts.push([latestAgo, "LAST PUSH"]);
    if (profile.activeRepos !== void 0) facts.push([formatNumber(profile.activeRepos), "ACTIVE, 90 DAYS"]);
    facts.push([formatNumber(profile.publicRepos), "REPOSITORIES"]);
    facts.forEach(([value, caption], index) => {
      const x = WIDTH4 - PAD8 - (facts.length - 1 - index) * 150;
      header += `<text x="${x}" y="${PAD8 + 26}" text-anchor="end" font-size="21" font-weight="800" fill="${look.fg}">${xmlEscape(value)}</text><text class="mono" x="${x}" y="${PAD8 + 44}" text-anchor="end" font-size="10" letter-spacing="1.2" fill="${look.muted}">${xmlEscape(caption)}</text>`;
    });
  }
  parts.push(rise(header, motion, next()));
  let cursor = PAD8 + 96;
  const activity = profile.contributions;
  if (blocks.has("activity") && activity) {
    const weeks = recentWeeks(activity.days, SPARK_WEEKS);
    const peak = Math.max(...weeks, 1);
    const width = WIDTH4 - PAD8 * 2;
    const barW = (width - 4 * (weeks.length - 1)) / weeks.length;
    const bars = weeks.map((total, index) => {
      const h = Math.max(2, total / peak * 38);
      return `<rect x="${num5(PAD8 + index * (barW + 4))}" y="${num5(cursor + 38 - h)}" width="${num5(barW)}" height="${num5(h)}" rx="2" fill="${index === weeks.length - 1 ? look.accent2 : look.accent}" fill-opacity="${total === 0 ? 0.25 : 0.9}"/>`;
    }).join("");
    const sum = weeks.reduce((a, b) => a + b, 0);
    parts.push(
      rise(
        bars + `<text class="mono" x="${PAD8}" y="${cursor + 58}" font-size="11.5" fill="${look.muted}">${xmlEscape(`${formatNumber(sum)} contributions in the last ${weeks.length} weeks  \xB7  current streak ${plural(activity.currentStreak, "day")}`)}</text>`,
        motion,
        next()
      )
    );
    cursor += 58 + 36;
  }
  if (blocks.has("projects")) {
    const groups = groupByMonth(recent);
    if (groups.length > 0) {
      const dots = [];
      let markup = "";
      let y = cursor;
      for (const group of groups) {
        markup += `<text class="mono" x="${CONTENT_X}" y="${y}" font-size="12" font-weight="700" letter-spacing="1.6" fill="${look.accent}">${xmlEscape(group.label.toUpperCase())}</text>`;
        y += 30;
        for (const repo of group.items) {
          const lines = repo.description ? wrap(repo.description, 78, 2) : [];
          const day = repo.pushedAt ? shortDay(repo.pushedAt) : null;
          const ago = repo.pushedAt && profile.fetchedAt ? timeAgo(repo.pushedAt, profile.fetchedAt) : null;
          dots.push(y - 5);
          markup += (day ? `<text class="mono" x="${AXIS_X - 22}" y="${y}" text-anchor="end" font-size="13" font-weight="700" fill="${look.fg}">${xmlEscape(day)}</text>` : "") + (ago ? `<text class="mono" x="${AXIS_X - 22}" y="${y + 17}" text-anchor="end" font-size="10.5" fill="${look.muted}">${xmlEscape(ago)}</text>` : "") + `<circle class="dot" cx="${AXIS_X}" cy="${y - 5}" r="6" fill="${look.bg}" stroke="${look.accent}" stroke-width="2.5"/><text x="${CONTENT_X}" y="${y}" font-size="17" font-weight="700" fill="${look.fg}">${xmlEscape(truncate(repo.name, 52))}</text>`;
          const tags = [repo.language, repo.stars > 0 ? `\u2605 ${formatNumber(repo.stars)}` : null, repo.license].filter((v) => Boolean(v));
          let ly = y;
          if (tags.length > 0) {
            ly += 19;
            markup += `<text class="mono" x="${CONTENT_X}" y="${ly}" font-size="11.5" fill="${look.accent2}">${xmlEscape(tags.join("  \xB7  "))}</text>`;
          }
          for (const line of lines) {
            ly += 19;
            markup += `<text x="${CONTENT_X}" y="${ly}" font-size="13.5" fill="${look.muted}">${xmlEscape(line)}</text>`;
          }
          y = Math.max(ly, y + 17) + 30;
        }
        y += 4;
      }
      const first = dots[0] ?? cursor;
      const last = dots[dots.length - 1] ?? first;
      const axis = `<rect class="axis" x="${AXIS_X - 1}" y="${num5(first)}" width="2" height="${num5(Math.max(0, last - first))}" fill="url(#axis)"/>`;
      parts.push(rise(axis + markup, motion, next()));
      cursor = y;
    } else {
      parts.push(
        rise(
          `<text x="${WIDTH4 / 2}" y="${cursor + 40}" text-anchor="middle" font-size="16" font-weight="700" fill="${look.fg}">Your build log appears here</text><text x="${WIDTH4 / 2}" y="${cursor + 66}" text-anchor="middle" font-size="13" fill="${look.muted}">It lists the repositories you pushed to most recently.</text>`,
          motion,
          next()
        )
      );
      cursor += 110;
    }
  }
  if (blocks.has("languages") && profile.languages.length > 0) {
    const text10 = profile.languages.slice(0, 4).map((l) => `${truncate(l.name, 14)} ${l.percent}%`).join("   ");
    parts.push(
      rise(
        `<text class="mono" x="${PAD8}" y="${num5(cursor)}" font-size="12.5" fill="${look.muted}">built with  <tspan fill="${look.fg}">${xmlEscape(text10)}</tspan></text>`,
        motion,
        next()
      )
    );
    cursor += 24;
  }
  const height = Math.ceil(cursor + PAD8 - 22);
  const title = `${profile.name ?? profile.login} (@${profile.login}) on GitHub`;
  const css = motion ? `.rise{animation:rise .6s ease both}@keyframes rise{from{opacity:0;transform:translateX(-6px)}}.dot{transform-box:fill-box;transform-origin:center;animation:pop .45s cubic-bezier(.3,1.6,.5,1) .3s both}@keyframes pop{from{transform:scale(0)}}@media (prefers-reduced-motion:reduce){.rise,.dot{animation:none}}` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH4}" height="${height}" viewBox="0 0 ${WIDTH4} ${height}" role="img" aria-labelledby="t">
<title id="t">${xmlEscape(title)}</title>
<defs>
<linearGradient id="axis" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${look.accent}"/><stop offset="1" stop-color="${look.line}"/></linearGradient>
</defs>
<style>
text{font-family:${FONT_SANS}}
.mono{font-family:${FONT2}}
${css}
</style>
<rect width="${WIDTH4}" height="${height}" rx="14" fill="${look.bg}"/>
<rect x="0.5" y="0.5" width="${WIDTH4 - 1}" height="${height - 1}" rx="14" fill="none" stroke="${look.line}"/>
${parts.filter(Boolean).join("\n")}
</svg>
`;
}
var buildlog = {
  id: "buildlog",
  name: "Build log",
  description: "A release-notes style timeline of what you updated most recently, grouped by month.",
  tags: ["timeline", "changelog", "recent", "animated"],
  needsAvatar: false,
  render(profile, config) {
    const assets = variantsFor(config.theme).map((variant) => ({
      path: assetPath("buildlog", variant),
      content: renderSvg5(profile, config, variant)
    }));
    const entries = config.blocks.includes("projects") ? groupByMonth(profile.recentRepos ?? []).flatMap((g) => g.items) : [];
    const extra = entries.length > 0 ? `a timeline of recent work: ${entries.map((r) => r.name).join(", ")}` : void 0;
    return { readme: imageReadme(profile, config, "buildlog", WIDTH4, describeProfile(profile, config, extra, { activity: false })), assets };
  }
};

// ../core/src/templates/charts.ts
var hueFor6 = (profile, fallback) => hueOf(profile.avatar?.grid.tint) ?? fallback;
var text6 = (value, x, y, size, fill, extra = "") => `<text x="${num4(x)}" y="${num4(y)}" font-size="${size}" fill="${fill}" ${extra}>${xmlEscape(value)}</text>`;
function blipRadius(stars3, radius) {
  const inner = radius * 0.12;
  return inner + (1 - starScale(stars3)) * (radius * 0.84 - inner);
}
function sonarSvg(profile, config, variant) {
  const dark = variant === "dark";
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const bg = dark ? "#03100a" : "#d5e4da";
  const screen = dark ? "#041a10" : "#eaf4ee";
  const line = dark ? "#0f5a35" : "#9fc2ae";
  const glow = dark ? "#37ff8b" : "#0b7a40";
  const ink = dark ? "#cfeedd" : "#133a26";
  const name = profile.name ?? profile.login;
  const repos = blocks.has("projects") ? profile.topRepos.slice(0, 6) : [];
  const langs = blocks.has("languages") ? profile.languages.slice(0, 5) : [];
  const cx = 290;
  const cy = 262;
  const R = 220;
  const height = 540;
  const defs = `<linearGradient id="sweep" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="${glow}" stop-opacity="0"/><stop offset="1" stop-color="${glow}" stop-opacity="${dark ? 0.55 : 0.4}"/></linearGradient><clipPath id="disc"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath>`;
  let body = `<circle cx="${cx}" cy="${cy}" r="${R + 10}" fill="${screen}" stroke="${line}" stroke-width="3"/>`;
  for (const f of [0.25, 0.5, 0.75, 1]) body += `<circle cx="${cx}" cy="${cy}" r="${R * f}" fill="none" stroke="${line}" stroke-width="1.2"/>`;
  body += `<path d="M${cx - R} ${cy}H${cx + R}M${cx} ${cy - R}V${cy + R}" stroke="${line}" stroke-width="1.2"/>`;
  body += `<g clip-path="url(#disc)"><g class="sweep" style="transform-origin:${cx}px ${cy}px"><path d="M${cx} ${cy}L${cx + R} ${cy}A${R} ${R} 0 0 0 ${num4(cx + R * Math.cos(-0.9))} ${num4(cy + R * Math.sin(-0.9))}Z" fill="url(#sweep)"/></g></g>`;
  body += `<circle cx="${cx}" cy="${cy}" r="4" fill="${glow}"/>`;
  repos.forEach((repo, i) => {
    const angle = i / repos.length * Math.PI * 2 + hashOf(`${profile.login}:${repo.name}`) % 100 / 100 * (Math.PI / repos.length) * 0.8 - Math.PI / 2;
    const r = blipRadius(repo.stars, R);
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    const color = repo.language ? langColor(repo.language, variant) : glow;
    const size = 5 + starScale(repo.stars) * 9;
    body += `<g class="blip" style="animation-delay:${(i * 0.5).toFixed(1)}s"><circle cx="${num4(x)}" cy="${num4(y)}" r="${num4(size + 5)}" fill="${color}" fill-opacity="0.22"/><circle cx="${num4(x)}" cy="${num4(y)}" r="${num4(size)}" fill="${color}"/>`;
    body += text6(truncate(repo.name, 14), x + size + 8, y + 4, 12, ink, 'class="mono" font-weight="700"') + `</g>`;
  });
  body += text6("SONAR", 580, 80, 12, glow, 'letter-spacing="6" font-weight="800"') + text6(truncate(name, 22), 580, 114, 26, ink, 'font-weight="800"') + text6(`@${profile.login}`, 580, 136, 13, glow, 'class="mono"');
  if (repos.length === 0) body += text6(blocks.has("projects") ? "Nothing on the screen." : "The projects section is switched off.", 580, 190, 14, ink, 'font-style="italic"');
  repos.forEach((repo, i) => {
    const y = 184 + i * 28;
    body += `<circle cx="588" cy="${y - 4}" r="5" fill="${repo.language ? langColor(repo.language, variant) : glow}"/>` + text6(truncate(repo.name, 20), 604, y, 14, ink, 'class="mono" font-weight="700"') + text6(`\u2605 ${formatNumber(repo.stars)}`, 860, y, 13, glow, 'class="mono" text-anchor="end"');
  });
  if (langs.length > 0) {
    for (const [i, part] of wrap(langs.map((l) => `${l.name} ${Math.round(l.percent)}%`).join("  \xB7  "), 38, 3).entries()) body += text6(part, 580, 184 + Math.max(repos.length, 1) * 28 + 24 + i * 18, 12, ink, 'class="mono"');
  }
  body += text6("closer to the centre = more stars (log scale) \xB7 the angle of a blip means nothing", 36, height - 14, 10.5, ink, 'class="mono"');
  const css = riseCss(motion) + (motion ? `.sweep{animation:turn 6s linear infinite}@keyframes turn{to{transform:rotate(360deg)}}.blip{animation:ping 6s ease-out infinite}@keyframes ping{0%{opacity:1}60%{opacity:.35}100%{opacity:1}}@media (prefers-reduced-motion:reduce){.sweep,.blip{animation:none}}` : "");
  return svgDoc({ height, title: `${name} on GitHub, as a sonar screen of repositories`, bg, radius: 14, defs, css, body });
}
var sonar = imageTemplate("sonar", "Sonar", "A sonar screen with a blip for each repository: the more stars, the closer to the centre.", ["creative", "device", "projects"], sonarSvg, {
  extra: () => "shown as a sonar screen with a blip for each repository"
});
function wordBox(word) {
  return { w: Math.ceil([...word.text].length * word.size * 0.6 + 8), h: Math.ceil(word.size * 1.05 + 6) };
}
var overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
function placeWords(words, width, height) {
  const placed = [];
  const dropped = [];
  const order = [...words].sort((a, b) => b.size - a.size || a.text.localeCompare(b.text));
  for (const word of order) {
    const { w, h } = wordBox(word);
    let found = false;
    for (let step = 0; step < 6e3 && !found; step++) {
      const angle = step * 0.3;
      const radius = 1.6 * angle;
      const x = width / 2 + Math.cos(angle) * radius * 1.6 - w / 2;
      const y = height / 2 + Math.sin(angle) * radius - h / 2;
      if (x < 0 || y < 0 || x + w > width || y + h > height) {
        if (radius > width) break;
        continue;
      }
      const candidate = { ...word, x, y, w, h };
      if (!placed.some((p) => overlaps(candidate, p))) {
        placed.push(candidate);
        found = true;
      }
    }
    if (!found) dropped.push(word);
  }
  return { placed, dropped };
}
function cloudSvg(profile, config, variant) {
  const dark = variant === "dark";
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const bg = dark ? "#0d0e14" : "#f6f5f1";
  const ink = dark ? "#eceef6" : "#1a1b22";
  const muted = dark ? "#8b90a3" : "#6a6f80";
  const name = profile.name ?? profile.login;
  const words = [];
  if (blocks.has("projects")) for (const repo of profile.topRepos.slice(0, 12)) words.push({ text: truncate(repo.name, 22), size: Math.round(22 + starScale(repo.stars) * 50), color: repo.language ? langColor(repo.language, variant) : muted, upper: false });
  if (blocks.has("languages")) for (const l of profile.languages.slice(0, 8)) words.push({ text: l.name.toUpperCase(), size: Math.round(20 + Math.min(100, l.percent) / 100 * 56), color: langColor(l.name, variant), upper: true });
  const W3 = 828;
  const H = 360;
  const { placed, dropped } = placeWords(words, W3, H);
  const style = new Map(words.map((w) => [`${w.text}:${w.size}`, w]));
  const height = 470;
  let body = text6(truncate(name, 26), 36, 54, 26, ink, 'font-weight="800"') + text6(`@${profile.login}`, 36, 76, 13, muted, 'class="mono"');
  if (words.length === 0) body += text6(blocks.has("projects") || blocks.has("languages") ? "There are no words yet." : "The projects and languages sections are switched off.", 36, 140, 15, muted, 'font-style="italic"');
  placed.forEach((p, i) => {
    const s = style.get(`${p.text}:${p.size}`);
    body += `<text class="w" style="animation-delay:${(i * 0.04).toFixed(2)}s" x="${num4(36 + p.x + p.w / 2)}" y="${num4(90 + p.y + p.h * 0.76)}" text-anchor="middle" font-size="${p.size}" font-weight="${s.upper ? 800 : 600}" ${s.upper ? 'letter-spacing="1" ' : ""}fill="${s.color}">${xmlEscape(p.text)}</text>`;
  });
  body += text6(`size = stars for repositories, share of code for the CAPITALS (languages)${dropped.length > 0 ? ` \xB7 ${dropped.length} more did not fit` : ""}`, 36, height - 16, 10.5, muted, 'class="mono"');
  const css = riseCss(motion) + (motion ? `.w{animation:pop .5s ease-out both}@keyframes pop{from{opacity:0}}@media (prefers-reduced-motion:reduce){.w{animation:none}}` : "");
  return svgDoc({ height, title: `${name} on GitHub, as a word cloud of repositories and languages`, bg, radius: 14, css, body });
}
var cloud = imageTemplate("cloud", "Word cloud", "Your repository names and languages as a word cloud, sized by stars and by share of code.", ["creative", "art", "projects"], cloudSvg, {
  extra: () => "shown as a word cloud of repository names and languages"
});
function timelinePositions(start, end, dates) {
  const span = end - start;
  return dates.map((d) => Number.isFinite(d) && span > 0 && d >= start && d <= end ? (d - start) / span : null);
}
function yearTicks(start, end) {
  const out = [];
  if (!(end > start)) return out;
  for (let y = new Date(start).getUTCFullYear() + 1; y <= new Date(end).getUTCFullYear(); y++) {
    const t = Date.UTC(y, 0, 1);
    if (t > start && t < end) out.push({ year: y, at: (t - start) / (end - start) });
  }
  return out;
}
function spreadLabels(xs, widths, min, max, gap = 8) {
  const out = xs.map((x, i) => Math.max(min + widths[i] / 2, Math.min(max - widths[i] / 2, x)));
  for (let i = 1; i < out.length; i++) out[i] = Math.max(out[i], out[i - 1] + (widths[i - 1] + widths[i]) / 2 + gap);
  for (let i = out.length - 1; i >= 0; i--) {
    const limit = i === out.length - 1 ? max - widths[i] / 2 : out[i + 1] - (widths[i] + widths[i + 1]) / 2 - gap;
    if (out[i] > limit) out[i] = limit;
  }
  return out;
}
function timelineSvg(profile, config, variant) {
  const dark = variant === "dark";
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const bg = dark ? "#0e1116" : "#f4f1ea";
  const ink = dark ? "#eef0f4" : "#1f2228";
  const muted = dark ? "#8a92a1" : "#6d7280";
  const accent2 = hslToHex(hueFor6(profile, 210), 0.7, dark ? 0.62 : 0.45);
  const name = profile.name ?? profile.login;
  const start = Date.parse(profile.createdAt);
  const pushes = (blocks.has("projects") ? [...profile.topRepos, ...profile.recentRepos ?? []] : []).filter((r, i, all) => r.pushedAt && all.findIndex((o) => o.name === r.name) === i);
  const lastPush = Math.max(0, ...pushes.map((r) => Date.parse(r.pushedAt)).filter(Number.isFinite));
  const readAt = profile.fetchedAt ? Date.parse(profile.fetchedAt) : NaN;
  const end = Number.isFinite(readAt) ? readAt : lastPush;
  const height = 470;
  const x0 = 60;
  const x1 = 840;
  const lineY = 230;
  let body = text6(truncate(name, 26), 36, 54, 26, ink, 'font-weight="800"') + text6(`@${profile.login}`, 36, 76, 13, muted, 'class="mono"');
  if (!Number.isFinite(start) || !(end > start)) {
    body += text6("A timeline needs the date the account was created and the date the data was read.", 36, 150, 15, muted, 'font-style="italic"');
    return svgDoc({ height: 240, title: `${name} on GitHub, as a timeline`, bg, radius: 14, css: riseCss(motion), body });
  }
  const at2 = (fraction) => x0 + fraction * (x1 - x0);
  body += `<path d="M${x0} ${lineY}H${x1}" stroke="${muted}" stroke-width="3" stroke-linecap="round"/>`;
  for (const tick of yearTicks(start, end)) body += `<path d="M${num4(at2(tick.at))} ${lineY - 8}v16" stroke="${muted}" stroke-width="1.5"/>` + text6(String(tick.year), at2(tick.at), lineY + 28, 11, muted, 'class="mono" text-anchor="middle"');
  const pos = timelinePositions(start, end, pushes.map((r) => Date.parse(r.pushedAt)));
  const markers = pushes.map((repo, i) => ({ repo, at: pos[i] })).filter((m) => m.at !== null).sort((a, b) => a.at - b.at);
  const labels = markers.map((m) => truncate(m.repo.name, 16));
  const widths = labels.map((l) => l.length * 7.4 + 12);
  const sides = [0, 1].map((side) => markers.map((m, i) => ({ m, i })).filter(({ i }) => i % 2 === side));
  sides.forEach((group, side) => {
    const dots = group.map(({ m }) => at2(m.at));
    const ws = group.map(({ i }) => widths[i]);
    const centres = spreadLabels(dots, ws, 40, 860);
    group.forEach(({ m, i }, k) => {
      const x = at2(m.at);
      const lx = centres[k];
      const up = side === 0;
      const y = up ? lineY - 70 : lineY + 84;
      body += `<g class="mk" style="animation-delay:${(0.2 + i * 0.12).toFixed(2)}s"><path d="M${num4(x)} ${lineY}L${num4(lx)} ${up ? y + 20 : y - 16}" stroke="${accent2}" stroke-width="1.5"/><circle cx="${num4(x)}" cy="${lineY}" r="6" fill="${accent2}"/>`;
      body += text6(labels[i], lx, y, 12.5, ink, 'text-anchor="middle" font-weight="700"') + text6(isoDate(m.repo.pushedAt) ?? "", lx, y + 14, 10.5, muted, 'class="mono" text-anchor="middle"') + `</g>`;
    });
  });
  body += `<circle cx="${x0}" cy="${lineY}" r="9" fill="${ink}"/>` + text6("Joined GitHub", x0, lineY + 150, 13, ink, 'font-weight="800"') + text6(isoDate(profile.createdAt) ?? "", x0, lineY + 166, 11, muted, 'class="mono"');
  body += `<circle cx="${x1}" cy="${lineY}" r="9" fill="${ink}"/>` + text6(Number.isFinite(readAt) ? "Data read" : "Last push", x1, lineY + 150, 13, ink, 'text-anchor="end" font-weight="800"') + text6(new Date(end).toISOString().slice(0, 10), x1, lineY + 166, 11, muted, 'class="mono" text-anchor="end"');
  body += text6("each dot is the most recent push to a repository; only dates GitHub gave are shown", 36, height - 16, 10.5, muted, 'class="mono"');
  const css = riseCss(motion) + (motion ? `.mk{animation:drop .5s ease-out both}@keyframes drop{from{opacity:0;transform:translateY(-8px)}}@media (prefers-reduced-motion:reduce){.mk{animation:none}}` : "");
  return svgDoc({ height, title: `${name} on GitHub, as a timeline`, bg, radius: 14, css, body });
}
var timeline = imageTemplate("timeline", "Timeline", "A timeline from the day you joined to today, with a dot where each repository was last pushed to.", ["creative", "projects", "history"], timelineSvg, {
  extra: () => "shown as a timeline from joining GitHub to the latest pushes"
});
function arcPath(cx, cy, r0, r1, a0, a1) {
  const sweep = Math.min(a1 - a0, Math.PI * 2 - 1e-4);
  const end = a0 + sweep;
  const p = (r, a) => `${num4(cx + Math.sin(a) * r)} ${num4(cy - Math.cos(a) * r)}`;
  const large = sweep > Math.PI ? 1 : 0;
  return `M${p(r1, a0)}A${r1} ${r1} 0 ${large} 1 ${p(r1, end)}L${p(r0, end)}A${r0} ${r0} 0 ${large} 0 ${p(r0, a0)}Z`;
}
function splitCircle(shares) {
  const valid = shares.filter((s) => Number.isFinite(s.share) && s.share > 0);
  const total = valid.reduce((sum, s) => sum + s.share, 0);
  if (total <= 0) return [];
  let at2 = 0;
  return valid.map((s) => {
    const from = at2;
    at2 += s.share / total * Math.PI * 2;
    return { name: s.name, from, to: at2 };
  });
}
function sunburstSvg(profile, config, variant) {
  const dark = variant === "dark";
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const bg = dark ? "#0c0d12" : "#f5f4f0";
  const ink = dark ? "#eef0f6" : "#1b1d26";
  const muted = dark ? "#8a8fa2" : "#6a6f80";
  const name = profile.name ?? profile.login;
  const langs = blocks.has("languages") ? profile.languages.slice(0, 6) : [];
  const repos = blocks.has("projects") ? profile.topRepos.slice(0, 8) : [];
  const cx = 300;
  const cy = 260;
  const height = 520;
  const gap = 0.012;
  let body = "";
  const spans = splitCircle(langs.map((l) => ({ name: l.name, share: l.percent })));
  spans.forEach((span, i) => {
    body += `<path class="seg" style="animation-delay:${(i * 0.08).toFixed(2)}s" d="${arcPath(cx, cy, 72, 130, span.from + gap, span.to - gap)}" fill="${langColor(span.name, variant)}"/>`;
    const mid = (span.from + span.to) / 2;
    if (span.to - span.from > 0.28) body += text6(truncate(span.name, 10), cx + Math.sin(mid) * 101, cy - Math.cos(mid) * 101 + 4, 11, "#ffffff", 'text-anchor="middle" font-weight="800"');
  });
  let onRing = 0;
  for (const span of spans) {
    const here = repos.filter((r) => r.language === span.name);
    if (here.length === 0) continue;
    const parts = splitCircle(here.map((r) => ({ name: r.name, share: r.stars + 1 })));
    const room = (span.to - span.from) * Math.min(1, here.length / Math.max(1, profile.topRepos.filter((r) => r.language === span.name).length));
    parts.forEach((part) => {
      const a0 = span.from + part.from / (Math.PI * 2) * room;
      const a1 = span.from + part.to / (Math.PI * 2) * room;
      body += `<path class="seg" d="${arcPath(cx, cy, 136, 196, a0 + gap, a1 - gap)}" fill="${langColor(span.name, variant)}" fill-opacity="0.62"/>`;
      onRing += 1;
      const mid = (a0 + a1) / 2;
      if (a1 - a0 > 0.5) body += text6(truncate(part.name, 11), cx + Math.sin(mid) * 166, cy - Math.cos(mid) * 166 + 4, 10.5, "#ffffff", 'text-anchor="middle" font-weight="800"');
    });
  }
  body += pictureBox(profile, "#456", "#fff", cx - 48, cy - 48, 96, 96, 48, "sb");
  if (spans.length === 0) body += text6(blocks.has("languages") ? "No languages to draw." : "The languages section is switched off.", 580, 150, 14, muted, 'font-style="italic"');
  body += text6(truncate(name, 22), 580, 90, 26, ink, 'font-weight="800"') + text6(`@${profile.login}`, 580, 112, 13, muted, 'class="mono"');
  spans.forEach((span, i) => {
    const y = 160 + i * 26;
    body += `<rect x="580" y="${y - 12}" width="14" height="14" rx="3" fill="${langColor(span.name, variant)}"/>` + text6(truncate(span.name, 16), 604, y, 14, ink, 'font-weight="700"') + text6(`${Math.round((span.to - span.from) / (Math.PI * 2) * 100)}%`, 860, y, 13, muted, 'class="mono" text-anchor="end"');
  });
  const listed = repos.filter((r) => spans.some((s) => s.name === r.language));
  listed.slice(0, 4).forEach((repo, i) => {
    body += text6(`${truncate(repo.name, 20)}  \u2605 ${formatNumber(repo.stars)}`, 580, 160 + spans.length * 26 + 30 + i * 20, 12, muted, 'class="mono"');
  });
  const off = repos.length - onRing;
  body += text6(`inner ring = share of code \xB7 outer ring = repositories of that language, wider for more stars${off > 0 ? ` \xB7 ${off} not on a language ring` : ""}`, 36, height - 14, 10.5, muted, 'class="mono"');
  const css = riseCss(motion) + (motion ? `.seg{animation:fade .6s ease-out both}@keyframes fade{from{opacity:0}}@media (prefers-reduced-motion:reduce){.seg{animation:none}}` : "");
  return svgDoc({ height, title: `${name} on GitHub, as a sunburst of languages and repositories`, bg, radius: 14, css, body });
}
var sunburst = imageTemplate("sunburst", "Sunburst", "Two rings: your languages by share, and around them the repositories written in each, wider for more stars.", ["creative", "languages", "projects"], sunburstSvg, {
  extra: () => "shown as a sunburst of languages with repositories around them"
});
function mosaicLevels(grid, size, levels) {
  const out = [];
  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c2 = 0; c2 < size; c2++) {
      const x0 = Math.floor(c2 * grid.width / size);
      const x1 = Math.max(x0 + 1, Math.floor((c2 + 1) * grid.width / size));
      const y0 = Math.floor(r * grid.height / size);
      const y1 = Math.max(y0 + 1, Math.floor((r + 1) * grid.height / size));
      let luma = 0;
      let alpha = 0;
      let count = 0;
      for (let y = y0; y < y1 && y < grid.height; y++) {
        for (let x = x0; x < x1 && x < grid.width; x++) {
          const i = y * grid.width + x;
          luma += grid.luma[i] ?? 0;
          alpha += grid.alpha[i] ?? 255;
          count += 1;
        }
      }
      if (count === 0 || alpha / count < 128) row.push(null);
      else row.push(Math.max(0, Math.min(levels - 1, Math.floor(luma / count / 256 * levels))));
    }
    out.push(row);
  }
  return out;
}
function mosaicSvg(profile, config, variant) {
  const dark = variant === "dark";
  const hue = hueFor6(profile, 12);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const bg = dark ? "#14151a" : "#e9e7e2";
  const base = dark ? "#1f2128" : "#d5d2ca";
  const ink = dark ? "#f1f2f6" : "#1c1d24";
  const muted = dark ? "#8d92a3" : "#6b6f7e";
  const name = profile.name ?? profile.login;
  const grid = profile.avatar?.grid;
  const size = 28;
  const cell2 = 15;
  const ox = 46;
  const oy = 46;
  const levels = 6;
  const ramp = Array.from({ length: levels }, (_v, i) => hslToHex(hue, 0.7, (dark ? 0.12 : 0.18) + i / (levels - 1) * (dark ? 0.62 : 0.68)));
  const height = Math.max(size * cell2 + 92, 520);
  let body = `<rect x="${ox - 8}" y="${oy - 8}" width="${size * cell2 + 16}" height="${size * cell2 + 16}" rx="6" fill="${base}"/>`;
  const rows = grid ? mosaicLevels(grid, size, levels) : [];
  if (!grid) body += text6("Your photo appears here once it has loaded.", ox + 20, oy + 120, 13, muted, 'font-style="italic"');
  rows.forEach((row, r) => {
    row.forEach((level, c2) => {
      if (level === null) return;
      const x = ox + c2 * cell2;
      const y = oy + r * cell2;
      body += `<rect x="${x}" y="${y}" width="${cell2 - 1}" height="${cell2 - 1}" rx="2" fill="${ramp[level]}"/><circle cx="${num4(x + (cell2 - 1) / 2)}" cy="${num4(y + (cell2 - 1) / 2)}" r="${num4(cell2 * 0.28)}" fill="#fff" fill-opacity="${dark ? 0.16 : 0.28}"/>`;
    });
  });
  const tx = ox + size * cell2 + 50;
  body += text6("BUILT FROM", tx, 74, 11, muted, 'letter-spacing="5" font-weight="800"') + text6(truncate(name, 20), tx, 114, 30, ink, 'font-weight="800"') + text6(`@${profile.login}`, tx, 138, 13, muted, 'class="mono"');
  const bricks = [];
  if (blocks.has("stats")) bricks.push(["STARS", formatNumber(profile.totalStars)], ["FOLLOWERS", formatNumber(profile.followers)], ["REPOS", formatNumber(profile.publicRepos)]);
  bricks.forEach(([label4, value], i) => {
    const x = tx + i % 2 * 190;
    const y = 180 + Math.floor(i / 2) * 96;
    body += `<g class="brick" style="animation-delay:${(0.2 + i * 0.1).toFixed(2)}s"><rect x="${x}" y="${y}" width="176" height="80" rx="6" fill="${ramp[3 + i % 3 - 1]}"/>`;
    for (let s = 0; s < 4; s++) body += `<circle cx="${x + 24 + s * 42}" cy="${y + 12}" r="6" fill="#ffffff" fill-opacity="0.28"/>`;
    body += text6(value, x + 16, y + 56, 28, "#ffffff", 'font-weight="800"') + text6(label4, x + 162, y + 70, 10, "#ffffff", 'text-anchor="end" letter-spacing="2" font-weight="800" fill-opacity="0.85"') + `</g>`;
  });
  if (profile.languages.length > 0 && blocks.has("languages")) body += text6(profile.languages.slice(0, 4).map((l) => `${l.name} ${Math.round(l.percent)}%`).join("  \xB7  "), tx, 180 + Math.ceil(bricks.length / 2) * 96 + 20, 12, muted, 'class="mono"');
  body += text6(`${size} \xD7 ${size} bricks \xB7 each brick is the brightness of that part of your photo, in your photo's colour`, 36, height - 16, 10.5, muted, 'class="mono"');
  const css = riseCss(motion) + (motion ? `.brick{animation:snap .5s ease-out both}@keyframes snap{from{opacity:0;transform:translateY(-12px)}}@media (prefers-reduced-motion:reduce){.brick{animation:none}}` : "");
  return svgDoc({ height, title: `${name} on GitHub, as a brick mosaic of their photo`, bg, radius: 14, css, body });
}
var mosaic = imageTemplate("mosaic", "Brick mosaic", "Your own profile photo rebuilt from bricks, with your numbers as bricks beside it.", ["creative", "art", "fun"], mosaicSvg, {
  extra: () => "shown as a brick mosaic built from the profile photo"
});
var chartTemplates = [sonar, cloud, timeline, sunburst, mosaic];

// ../core/src/templates/editorial.ts
var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var MONTHS5 = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function longDate(iso) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return `${DAYS[date.getUTCDay()]}, ${date.getUTCDate()} ${MONTHS5[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}
function breakName(name, width, maxLines) {
  const parts = name.match(/[^-_]+[-_]?|[-_]/g) ?? [name];
  const lines = [];
  let line = "";
  for (const part of parts) {
    if (line && (line + part).length > width) {
      lines.push(line);
      line = "";
    }
    line += part;
  }
  if (line) lines.push(line);
  const kept = lines.slice(0, maxLines).map((l) => l.length > width ? l.slice(0, width - 1) + "\u2026" : l);
  if (lines.length > maxLines) kept[maxLines - 1] = kept[maxLines - 1].replace(/.?$/, "\u2026");
  return kept;
}
function paperLook(variant) {
  return variant === "dark" ? { bg: "#1a1814", panel: "#221f1a", border: "#4a443a", fg: "#ece6d6", muted: "#a79f8d", track: "#2c2822", accent: "#e0634f", accent2: "#c9a45c" } : { bg: "#f6f1e4", panel: "#fbf8ef", border: "#bdb39c", fg: "#1d1a14", muted: "#665e4e", track: "#e6dfcd", accent: "#b3331f", accent2: "#8a6a1f" };
}
function frontPageSvg(profile, config, variant) {
  const look = paperLook(variant);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const serif = (text10, x, y2, size2, extra = "", fill = look.fg) => `<text x="${x}" y="${y2}" font-family="${FONT_SERIF}" font-size="${size2}" fill="${fill}" ${extra}>${xmlEscape(text10)}</text>`;
  let step = 0;
  const next = () => step++ * 0.1;
  const title = `THE ${truncate(profile.login.toUpperCase(), 18)} GAZETTE`;
  const size = Math.max(26, Math.min(46, Math.floor(780 / (title.length * 0.68))));
  const rule = (y2, h = 1) => `<rect x="${PAD6}" y="${y2}" width="${W - PAD6 * 2}" height="${h}" fill="${look.fg}" fill-opacity="0.75"/>`;
  const created = Number(profile.createdAt.slice(0, 4));
  const date = longDate(profile.fetchedAt);
  let head = serif(title, W / 2, PAD6 + size, size, 'font-weight="700" text-anchor="middle" letter-spacing="2"') + rule(PAD6 + size + 14, 3) + rule(PAD6 + size + 20) + (Number.isFinite(created) && created > 1970 ? serif(`Established ${created}`, PAD6, PAD6 + size + 42, 12.5, 'font-style="italic"', look.muted) : "") + (date ? serif(date, W / 2, PAD6 + size + 42, 12.5, 'text-anchor="middle"', look.muted) : "") + serif(`github.com/${profile.login}`, W - PAD6, PAD6 + size + 42, 12.5, 'text-anchor="end" font-style="italic"', look.muted) + rule(PAD6 + size + 52);
  let y = PAD6 + size + 82;
  const lead = blocks.has("projects") ? profile.topRepos[0] : void 0;
  const colTop = y;
  const colGap = 26;
  const leadW = 396;
  const midX = PAD6 + leadW + colGap;
  const midW = 190;
  const lastX = midX + midW + colGap;
  const lastW = W - PAD6 - lastX;
  let body = "";
  let colBottom = colTop;
  const byline = profile.name ?? profile.login;
  if (lead) {
    const headline = breakName(lead.name, 20, 3);
    body += label2(look, "LEAD STORY", PAD6, colTop + 4);
    headline.forEach((line, i) => body += serif(line, PAD6, colTop + 38 + i * 32, 29, 'font-weight="700"'));
    let by = colTop + 38 + headline.length * 32 + 4;
    body += serif(`By ${truncate(byline, 30)}`, PAD6, by + 4, 12, 'font-style="italic"', look.muted);
    by += 28;
    const text10 = lead.description ?? `A project by ${byline}.`;
    wrap(text10, 52, 5).forEach((line) => {
      body += serif(line, PAD6, by, 14.5);
      by += 21;
    });
    by += 6;
    body += serif(`\u2605 ${formatNumber(lead.stars)} stars  \xB7  ${formatNumber(lead.forks)} forks${lead.language ? `  \xB7  ${truncate(lead.language, 16)}` : ""}`, PAD6, by, 12.5, 'font-weight="700"', look.accent);
    colBottom = Math.max(colBottom, by + 10);
  } else if (blocks.has("stats") || blocks.has("languages")) {
    body += label2(look, "ABOUT", PAD6, colTop + 4);
    const bio = config.text.bio ?? profile.bio;
    const intro = bio ? wrap(bio, 44, 6) : [];
    intro.forEach((line, i) => body += serif(line, PAD6, colTop + 36 + i * 24, 17));
    colBottom = Math.max(colBottom, colTop + 36 + intro.length * 24);
  }
  if (blocks.has("stats")) {
    body += label2(look, "BY THE NUMBERS", midX, colTop + 4);
    const rows = [["Repositories", formatNumber(profile.publicRepos)], ["Stars", formatNumber(profile.totalStars)], ["Followers", formatNumber(profile.followers)], ["Following", formatNumber(profile.following)]];
    if (profile.totalForks !== void 0) rows.splice(2, 0, ["Forks", formatNumber(profile.totalForks)]);
    rows.forEach(([k, v], i) => {
      const ry = colTop + 34 + i * 30;
      body += serif(k, midX, ry, 14) + serif(v, midX + midW, ry, 15, 'font-weight="700" text-anchor="end"') + `<rect x="${midX}" y="${ry + 8}" width="${midW}" height="1" fill="${look.border}"/>`;
    });
    colBottom = Math.max(colBottom, colTop + 34 + rows.length * 30);
  }
  if (blocks.has("languages") && profile.languages.length > 0) {
    body += label2(look, "LANGUAGES", lastX, colTop + 4);
    profile.languages.slice(0, 5).forEach((l, i) => {
      const ry = colTop + 34 + i * 30;
      body += serif(truncate(l.name, 14), lastX, ry, 14) + serif(`${l.percent}%`, lastX + lastW, ry, 14, 'text-anchor="end"', look.muted) + `<rect x="${lastX}" y="${ry + 8}" width="${lastW}" height="3" fill="${look.track}"/><rect x="${lastX}" y="${ry + 8}" width="${num4(Math.max(2, lastW * l.percent / 100))}" height="3" fill="${look.accent}"/>`;
    });
    colBottom = Math.max(colBottom, colTop + 34 + Math.min(5, profile.languages.length) * 30);
  }
  const colHeight = colBottom - colTop + 6;
  body += `<rect x="${PAD6 + leadW + colGap / 2}" y="${colTop - 12}" width="1" height="${colHeight}" fill="${look.border}"/><rect x="${midX + midW + colGap / 2}" y="${colTop - 12}" width="1" height="${colHeight}" fill="${look.border}"/>`;
  y = colBottom + 22;
  let strip = "";
  if (blocks.has("activity") && profile.contributions) {
    const a = profile.contributions;
    const weeks = weeklyTotals(a.days);
    const peak = Math.max(...weeks, 1);
    const w = W - PAD6 * 2;
    const bar = w / weeks.length;
    const h = 46;
    const month = busiestMonth(a.days);
    strip = rule(y - 8) + label2(look, "THE YEAR IN BRIEF", PAD6, y + 16) + weeks.map((total, i) => `<rect class="bar" x="${num4(PAD6 + i * bar + 0.5)}" y="${num4(y + 28 + h - Math.max(1, total / peak * h))}" width="${num4(Math.max(1, bar - 1.5))}" height="${num4(Math.max(1, total / peak * h))}" fill="${look.fg}" fill-opacity="${total === 0 ? 0.15 : 0.8}"/>`).join("") + serif(`${formatNumber(a.total)} contributions in the past year; a ${a.currentStreak}-day streak at press time, ${a.longestStreak} at best${month ? `; busiest in ${month.name}` : ""}.`, PAD6, y + 28 + h + 22, 13, 'font-style="italic"', look.muted);
    y += 28 + h + 40;
  }
  const height = Math.max(y + PAD6 - 10, 300);
  const css = riseCss(motion);
  return shell({ height, look, variant, title: `${title.toLowerCase()}: ${profile.name ?? profile.login} (@${profile.login}) on GitHub`, css, body: enter(head, motion, next()) + enter(body, motion, next()) + enter(strip, motion, next()), grid: false, radius: 6, glow: [0.5, 0] });
}
var frontpage = {
  id: "frontpage",
  name: "Front Page",
  description: "Your profile as a newspaper: a masthead, your lead project as the headline, the numbers in a column and the year in brief.",
  tags: ["paper", "serif", "editorial"],
  needsAvatar: false,
  render(profile, config) {
    const assets = variantsFor(config.theme).map((variant) => ({ path: assetPath("frontpage", variant), content: frontPageSvg(profile, config, variant) }));
    const lead = config.blocks.includes("projects") ? profile.topRepos[0] : void 0;
    return { readme: imageReadme(profile, config, "frontpage", W, describeProfile(profile, config, lead ? `lead story ${lead.name}` : void 0, { activity: true })), assets };
  }
};
function hubSvg(profile, config, variant) {
  const look = lookOf(200, variant, profile);
  const motion = config.motion;
  const r = 38;
  const textX = PAD6 + r * 2 + 28;
  const bio = config.text.bio ?? profile.bio;
  const sub2 = [`<tspan fill="${look.muted}">@${xmlEscape(profile.login)}</tspan>`];
  if (config.text.headline) sub2.push(`<tspan fill="${look.accent}" font-weight="600">${xmlEscape(truncate(config.text.headline, 46))}</tspan>`);
  const body = panel(look, PAD6 - 14, PAD6 - 14, W - PAD6 * 2 + 28, r * 2 + 28, true) + portrait(profile, look, PAD6 + r, PAD6 + r, r) + sans(truncate(profile.name ?? profile.login, 28), textX, PAD6 + 30, look.fg, 'font-size="28" font-weight="800"') + `<text x="${textX}" y="${PAD6 + 54}" font-size="14" xml:space="preserve">${sub2.join(`<tspan fill="${look.muted}">  \xB7  </tspan>`)}</text>` + (bio ? sans(truncate(bio, 76), textX, PAD6 + 76, look.fg, 'font-size="13" fill-opacity="0.78"') : "") + mono("OPEN A SECTION BELOW", W - PAD6 - 6, PAD6 + 22, look.accent, 'font-size="10.5" font-weight="700" letter-spacing="2" text-anchor="end"') + [0, 1, 2].map((i) => `<path d="M${W - PAD6 - 24 - i * 22} ${PAD6 + 40}l6 6l6 -6" fill="none" stroke="${look.accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${motion ? ` class="nudge" style="animation-delay:${(i * 0.2).toFixed(1)}s"` : ""}/>`).join("");
  const css = motion ? `.nudge{animation:nudge 1.6s ease-in-out infinite}@keyframes nudge{50%{transform:translateY(4px)}}@media (prefers-reduced-motion:reduce){.nudge{animation:none}}` : "";
  return shell({ height: r * 2 + PAD6 * 2 - 4, look, variant, title: `${profile.name ?? profile.login} (@${profile.login}) on GitHub`, css, body, glow: [0.9, 0.2] });
}
var cell = (text10) => escapeMarkdown(text10).replace(/\r?\n/g, " ");
function section(title, body, open) {
  return `<details${open ? " open" : ""}>
<summary><b>${title}</b></summary>

${body}

</details>`;
}
function projectRow(repo) {
  const url = safeUrl(repo.url)?.replace(/\|/g, "%7C");
  const name = url ? `[${cell(truncate(repo.name, 40))}](<${url}>)` : cell(truncate(repo.name, 40));
  return `| ${name} | ${formatNumber(repo.stars)} | ${formatNumber(repo.forks)} | ${repo.description ? cell(truncate(repo.description, 90)) : ""} |`;
}
function hubSections(profile, config) {
  const blocks = new Set(config.blocks);
  const sections = [];
  if (blocks.has("stats")) {
    const rows = [["Repositories", formatNumber(profile.publicRepos)], ["Stars earned", formatNumber(profile.totalStars)]];
    if (profile.totalForks !== void 0) rows.push(["Forks", formatNumber(profile.totalForks)]);
    rows.push(["Followers", formatNumber(profile.followers)], ["Following", formatNumber(profile.following)]);
    const year = profile.createdAt.slice(0, 4);
    if (/^\d{4}$/.test(year)) rows.push(["On GitHub since", year]);
    sections.push(section("Numbers", `| | |
|---|---:|
${rows.map(([k, v]) => `| ${k} | ${v} |`).join("\n")}`, true));
  }
  if (blocks.has("languages") && profile.languages.length > 0) {
    const rows = profile.languages.slice(0, 6).map((l) => `| ${cell(l.name)} | ${"\u2588".repeat(Math.max(1, Math.round(l.percent / 5)))} ${l.percent}% |`);
    sections.push(section("Languages", `| Language | Share of repositories |
|---|---|
${rows.join("\n")}`, false));
  }
  if (blocks.has("projects") && profile.topRepos.length > 0) {
    sections.push(section("Projects", `| Project | Stars | Forks | About |
|---|---:|---:|---|
${profile.topRepos.slice(0, 6).map(projectRow).join("\n")}`, false));
  }
  if (blocks.has("activity") && profile.contributions) {
    const a = profile.contributions;
    const month = busiestMonth(a.days);
    const lines = [`- **${formatNumber(a.total)}** contributions in the past year, on ${plural(a.activeDays, "active day")}`, `- Current streak: **${plural(a.currentStreak, "day")}**`, `- Longest streak: **${plural(a.longestStreak, "day")}**`];
    if (month) lines.push(`- Busiest month: **${month.name}**`);
    sections.push(section("Activity", lines.join("\n"), false));
  }
  return sections;
}
var hub = {
  id: "hub",
  name: "Everything Hub",
  description: "Every section folds away, so nothing is too long: a small banner and then Numbers, Languages, Projects and Activity.",
  tags: ["collapsible", "markdown", "compact"],
  needsAvatar: true,
  render(profile, config) {
    const assets = variantsFor(config.theme).map((variant) => ({ path: assetPath("hub", variant), content: hubSvg(profile, config, variant) }));
    const website = safeUrl(profile.website);
    const links = [`[GitHub](<${profile.url}>)`];
    if (website) links.push(`[Website](<${website}>)`);
    const alt = describeProfile(profile, { ...config, blocks: [] }, void 0);
    const body = [
      `<div align="center">
${pictureTag("hub", config.theme, alt, W)}
</div>`,
      `<div align="center">

${links.join(" \xB7 ")}

</div>`,
      ...hubSections(profile, config)
    ];
    return { readme: wrapReadme(body.join("\n\n"), config), assets };
  }
};

// ../core/src/templates/galaxy.ts
var WIDTH5 = 900;
var PAD9 = 36;
var MAX_PLANETS = 6;
var FIRST_ORBIT = 76;
var ORBIT_STEP = 28;
var MIN_PLANET = 5;
var MAX_PLANET = 18;
var SUN = 34;
var GOLDEN_ANGLE = 137.508;
var BASE_PERIOD = 22;
var PERIOD_STEP = 11;
var LEGEND_ROW = 48;
function moonsFor(forks) {
  if (forks >= 100) return 3;
  if (forks >= 10) return 2;
  return forks >= 1 ? 1 : 0;
}
function layoutGalaxy(repos) {
  const shown = [...repos].sort((a, b) => b.stars - a.stars || a.name.localeCompare(b.name)).slice(0, MAX_PLANETS);
  const peak = Math.max(...shown.map((repo) => repo.stars), 1);
  return shown.map((repo, index) => ({
    name: repo.name,
    stars: repo.stars,
    forks: repo.forks,
    language: repo.language,
    orbit: FIRST_ORBIT + index * ORBIT_STEP,
    size: MIN_PLANET + Math.sqrt(repo.stars / peak) * (MAX_PLANET - MIN_PLANET),
    angle: index * GOLDEN_ANGLE % 360,
    period: BASE_PERIOD + index * PERIOD_STEP,
    moons: moonsFor(repo.forks)
  }));
}
function languageHue(language) {
  let hash = 2166136261;
  for (const char of language.toLowerCase()) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return hash % 360;
}
var num6 = (value) => String(Math.round(value * 10) / 10 || 0);
function lookFor4(variant, hue) {
  const dark = variant === "dark";
  return {
    skyTop: dark ? hslToHex(hue, 0.5, 0.05) : hslToHex(hue, 0.6, 0.96),
    skyBottom: dark ? hslToHex((hue + 25) % 360, 0.5, 0.13) : hslToHex((hue + 25) % 360, 0.7, 0.88),
    fg: dark ? "#eef0ff" : "#1d2140",
    muted: dark ? "#9aa0c8" : "#5b6190",
    glow: hslToHex(hue, 0.9, dark ? 0.55 : 0.6),
    ring: dark ? "#9aa0c8" : "#5b6190",
    none: dark ? "#8b93b8" : "#7a82a6"
  };
}
function renderSvg6(profile, config, variant) {
  const look = lookFor4(variant, hueOf(profile.avatar?.grid.tint) ?? 225);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const colorOf = (language) => language ? hslToHex(languageHue(language), 0.72, variant === "dark" ? 0.62 : 0.44) : look.none;
  const parts = [];
  let step = 0;
  const next = () => step++ * 0.1;
  const subline2 = [profile.name ? `@${profile.login}` : "", config.text.headline ? truncate(config.text.headline, 46) : ""].filter(Boolean);
  let header = `<text x="${PAD9}" y="${PAD9 + 24}" font-size="28" font-weight="800" fill="${look.fg}">${xmlEscape(truncate(profile.name ?? profile.login, 28))}</text>`;
  if (subline2.length > 0) {
    header += `<text x="${PAD9}" y="${PAD9 + 46}" font-size="14" fill="${look.muted}">${xmlEscape(subline2.join("  \xB7  "))}</text>`;
  }
  if (blocks.has("stats")) {
    const stats = [
      [formatNumber(profile.publicRepos), "REPOS"],
      [formatNumber(profile.totalStars), "STARS"],
      [formatNumber(profile.followers), "FOLLOWERS"]
    ];
    stats.forEach(([value, caption], index) => {
      const x = WIDTH5 - PAD9 - (stats.length - 1 - index) * 104;
      header += `<text x="${x}" y="${PAD9 + 22}" text-anchor="end" font-size="22" font-weight="800" fill="${look.fg}">${xmlEscape(value)}</text><text class="mono" x="${x}" y="${PAD9 + 40}" text-anchor="end" font-size="10" letter-spacing="1.2" fill="${look.muted}">${caption}</text>`;
    });
  }
  parts.push(rise(header, motion, next()));
  let cursor = PAD9 + 64;
  let bottom = cursor;
  const planets = blocks.has("projects") ? layoutGalaxy(profile.topRepos) : [];
  if (planets.length > 0) {
    const reach = Math.max(...planets.map((p) => p.orbit + p.size + (p.moons > 0 ? p.size + 8 : 0))) + 12;
    const cx = PAD9 + reach + 4;
    const cy = cursor + 8 + reach;
    const legendX = cx + reach + 36;
    const legendWidth = WIDTH5 - PAD9 - legendX;
    const uri = profile.avatar?.dataUri;
    const hasPhoto = Boolean(uri && SAFE_DATA_URI.test(uri));
    const initial = [...profile.name ?? profile.login][0]?.toUpperCase() ?? "?";
    const sun = `<circle class="sun" cx="${cx}" cy="${cy}" r="${SUN * 2.6}" fill="url(#sun)"/>` + (hasPhoto && uri ? `<clipPath id="face"><circle cx="${cx}" cy="${cy}" r="${SUN}"/></clipPath><image href="${uri}" x="${cx - SUN}" y="${cy - SUN}" width="${SUN * 2}" height="${SUN * 2}" preserveAspectRatio="xMidYMid slice" clip-path="url(#face)"/>` : `<circle cx="${cx}" cy="${cy}" r="${SUN}" fill="${look.glow}"/><text x="${cx}" y="${cy + 12}" text-anchor="middle" font-size="34" font-weight="800" fill="#ffffff">${xmlEscape(initial)}</text>`) + `<circle cx="${cx}" cy="${cy}" r="${SUN + 3}" fill="none" stroke="${look.glow}" stroke-width="2"/>`;
    const rings2 = planets.map((p) => `<circle cx="${cx}" cy="${cy}" r="${p.orbit}" fill="none" stroke="${look.ring}" stroke-opacity="0.22" stroke-dasharray="2 5"/>`).join("");
    const bodies = planets.map((p) => {
      const color = colorOf(p.language);
      const px = cx + p.orbit;
      const moons = Array.from({ length: p.moons }, (_v, k) => {
        const distance = p.size + 6 + k * 3;
        return `<g transform="rotate(${num6(360 / p.moons * k)})"><g class="moon" style="animation-duration:${num6(3.5 + k * 1.3)}s"><circle cx="${num6(distance)}" cy="0" r="2.2" fill="${look.fg}" fill-opacity="0.85"/></g></g>`;
      }).join("");
      return `<g transform="rotate(${num6(p.angle)} ${cx} ${cy})"><g class="orbit" style="transform-origin:${cx}px ${cy}px;animation-duration:${p.period}s"><g transform="translate(${num6(px)} ${cy})"><circle r="${num6(p.size)}" fill="${color}"/><circle cx="${num6(-p.size * 0.3)}" cy="${num6(-p.size * 0.3)}" r="${num6(p.size * 0.42)}" fill="#ffffff" fill-opacity="0.22"/>` + moons + `</g></g></g>`;
    }).join("");
    parts.push(rise(rings2 + sun + bodies, motion, next()));
    const legendTop = cy - planets.length * LEGEND_ROW / 2 - 24;
    const rows = planets.map((p, index) => {
      const y = legendTop + index * LEGEND_ROW;
      const meta = [`\u2605 ${formatNumber(p.stars)}`, p.language, p.forks > 0 ? `${formatNumber(p.forks)} forks` : null].filter((v) => Boolean(v)).join("  \xB7  ");
      return `<circle cx="${legendX + 6}" cy="${num6(y + 6)}" r="6" fill="${colorOf(p.language)}"/><text x="${legendX + 20}" y="${num6(y + 11)}" font-size="14.5" font-weight="700" fill="${look.fg}">${xmlEscape(truncate(p.name, Math.max(8, Math.floor((legendWidth - 20) / 8.4))))}</text><text class="mono" x="${legendX + 20}" y="${num6(y + 29)}" font-size="11.5" fill="${look.muted}">${xmlEscape(truncate(meta, Math.floor((legendWidth - 20) / 6.9)))}</text>`;
    }).join("");
    const keyY = legendTop + planets.length * LEGEND_ROW + 14;
    const key = ["size shows stars", "closest to the sun is most starred", "a moon is a fork: 1, 10+, 100+"].map((line, index) => `<text class="mono" x="${legendX}" y="${num6(keyY + index * 17)}" font-size="11" fill="${look.muted}" fill-opacity="0.85">${xmlEscape(line)}</text>`).join("");
    parts.push(rise(rows + key, motion, next()));
    bottom = Math.max(cy + reach, keyY + 3 * 17);
  } else if (blocks.has("projects")) {
    const top = cursor + 20;
    parts.push(
      rise(
        `<text x="${WIDTH5 / 2}" y="${top + 60}" text-anchor="middle" font-size="16" font-weight="700" fill="${look.fg}">Your project galaxy appears here</text><text x="${WIDTH5 / 2}" y="${top + 86}" text-anchor="middle" font-size="13" fill="${look.muted}">Each planet is one of your most-starred public repositories.</text>`,
        motion,
        next()
      )
    );
    bottom = top + 120;
  }
  cursor = bottom + 28;
  if (blocks.has("languages") && profile.languages.length > 0) {
    const text10 = profile.languages.slice(0, 4).map((l) => `${truncate(l.name, 14)} ${l.percent}%`).join("   ");
    parts.push(
      rise(
        `<text class="mono" x="${PAD9}" y="${num6(cursor)}" font-size="12.5" fill="${look.muted}">written in  <tspan fill="${look.fg}">${xmlEscape(text10)}</tspan></text>`,
        motion,
        next()
      )
    );
    cursor += 24;
  }
  const height = Math.ceil(cursor + PAD9 - 18);
  const random = seeded2(profile.login);
  const stars3 = variant === "dark" ? Array.from({ length: 70 }, () => {
    const x = random() * WIDTH5;
    const y = random() * height;
    const r = 0.4 + random() * 1.1;
    const o = 0.2 + random() * 0.6;
    return `<circle cx="${num6(x)}" cy="${num6(y)}" r="${num6(r)}" fill="#ffffff" fill-opacity="${num6(o)}"/>`;
  }).join("") : "";
  const css = motion ? `.rise{animation:rise .6s ease both}
@keyframes rise{from{opacity:0}}
.orbit{animation:spin 30s linear infinite}
.moon{transform-origin:0 0;animation:spin 4s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.sun{animation:glow 5s ease-in-out infinite}
@keyframes glow{50%{opacity:.55}}
@media (prefers-reduced-motion:reduce){.rise,.orbit,.moon,.sun{animation:none}}` : "";
  const title = `${profile.name ?? profile.login} (@${profile.login}) on GitHub`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH5}" height="${height}" viewBox="0 0 ${WIDTH5} ${height}" role="img" aria-labelledby="t">
<title id="t">${xmlEscape(title)}</title>
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${look.skyTop}"/><stop offset="1" stop-color="${look.skyBottom}"/></linearGradient>
<radialGradient id="sun"><stop offset="0" stop-color="${look.glow}" stop-opacity="${variant === "dark" ? 0.55 : 0.4}"/><stop offset="1" stop-color="${look.glow}" stop-opacity="0"/></radialGradient>
</defs>
<style>
text{font-family:${FONT_SANS}}
.mono{font-family:${FONT2}}
${css}
</style>
<rect width="${WIDTH5}" height="${height}" rx="20" fill="url(#sky)"/>
${stars3}
${parts.filter(Boolean).join("\n")}
</svg>
`;
}
var galaxy = {
  id: "galaxy",
  name: "Repo galaxy",
  description: "Your projects as planets around your profile picture: bigger for more stars, moons for forks, slowly orbiting.",
  tags: ["image", "space", "projects", "animated"],
  needsAvatar: true,
  render(profile, config) {
    const assets = variantsFor(config.theme).map((variant) => ({
      path: assetPath("galaxy", variant),
      content: renderSvg6(profile, config, variant)
    }));
    const planets = config.blocks.includes("projects") ? layoutGalaxy(profile.topRepos) : [];
    const extra = planets.length > 0 ? `a galaxy with one planet for each project: ${planets.map((p) => p.name).join(", ")}` : void 0;
    return { readme: imageReadme(profile, config, "galaxy", WIDTH5, describeProfile(profile, config, extra)), assets };
  }
};

// ../core/src/templates/launchpad.ts
var WIDTH6 = 900;
var PAD10 = 40;
var PHOTO2 = 112;
var WEEKS = 12;
var GAP2 = 16;
function pickProjects(repos) {
  const ranked = [...repos].sort((a, b) => b.stars - a.stars || a.name.localeCompare(b.name));
  return { featured: ranked[0] ?? null, others: ranked.slice(1, 3) };
}
var num7 = (value) => String(Math.round(value * 10) / 10 || 0);
function lookFor5(variant, hue) {
  const dark = variant === "dark";
  return {
    skyTop: dark ? hslToHex(hue, 0.55, 0.09) : hslToHex(hue, 0.7, 0.96),
    skyBottom: dark ? hslToHex((hue + 38) % 360, 0.6, 0.2) : hslToHex((hue + 38) % 360, 0.8, 0.88),
    panel: dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.7)",
    border: dark ? "rgba(255,255,255,0.14)" : "rgba(20,24,60,0.12)",
    fg: dark ? "#fff7ee" : "#2a1b14",
    muted: dark ? "#d6bfb0" : "#7a5a4a",
    accent: hslToHex(hue, 0.95, dark ? 0.62 : 0.46),
    accent2: hslToHex((hue + 38) % 360, 0.95, dark ? 0.66 : 0.5),
    track: dark ? "rgba(255,255,255,0.1)" : "rgba(20,24,60,0.08)"
  };
}
function chips(repo, profile) {
  const updated = repo.pushedAt && profile.fetchedAt ? timeAgo(repo.pushedAt, profile.fetchedAt) : null;
  return [repo.language, repo.forks > 0 ? `${formatNumber(repo.forks)} forks` : null, repo.license, updated ? `updated ${updated}` : null].filter(
    (v) => Boolean(v)
  );
}
function renderSvg7(profile, config, variant) {
  const look = lookFor5(variant, hueOf(profile.avatar?.grid.tint) ?? 22);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const parts = [];
  let step = 0;
  const next = () => step++ * 0.1;
  const uri = profile.avatar?.dataUri;
  const hasPhoto = Boolean(uri && SAFE_DATA_URI.test(uri));
  const textWidth = hasPhoto ? WIDTH6 - PAD10 * 2 - PHOTO2 - 24 : WIDTH6 - PAD10 * 2;
  const bio = config.text.bio ?? profile.bio;
  let hero = `<text class="mono" x="${PAD10}" y="${PAD10 + 12}" font-size="13" letter-spacing="2" fill="${look.accent}">@${xmlEscape(profile.login.toUpperCase())}</text>`;
  hero += `<text x="${PAD10}" y="${PAD10 + 62}" font-size="48" font-weight="800" fill="${look.fg}">${xmlEscape(truncate(profile.name ?? profile.login, Math.floor(textWidth / 28)))}</text>`;
  let y = PAD10 + 62;
  if (config.text.headline) {
    y += 36;
    hero += `<text x="${PAD10}" y="${y}" font-size="21" font-weight="600" fill="${look.accent2}">${xmlEscape(truncate(config.text.headline, Math.floor(textWidth / 11)))}</text>`;
  }
  if (bio) {
    wrap(bio, Math.floor(textWidth / 7.8), 2).forEach((line, index) => {
      y += index === 0 ? 30 : 22;
      hero += `<text x="${PAD10}" y="${y}" font-size="15" fill="${look.muted}">${xmlEscape(line)}</text>`;
    });
  }
  if (hasPhoto && uri) {
    const x = WIDTH6 - PAD10 - PHOTO2;
    hero += `<clipPath id="photo"><rect x="${x}" y="${PAD10 - 6}" width="${PHOTO2}" height="${PHOTO2}" rx="28"/></clipPath><image href="${uri}" x="${x}" y="${PAD10 - 6}" width="${PHOTO2}" height="${PHOTO2}" preserveAspectRatio="xMidYMid slice" clip-path="url(#photo)"/><rect x="${x}" y="${PAD10 - 6}" width="${PHOTO2}" height="${PHOTO2}" rx="28" fill="none" stroke="${look.accent}" stroke-width="2.5"/>`;
  }
  parts.push(rise(hero, motion, next()));
  const heroBottom = Math.max(y, hasPhoto ? PAD10 + PHOTO2 : 0);
  let cursor = heroBottom + 40;
  if (blocks.has("stats")) {
    const stats = [[formatNumber(profile.totalStars), "STARS EARNED"]];
    if (profile.activeRepos !== void 0) stats.push([formatNumber(profile.activeRepos), "PROJECTS ACTIVE, LAST 90 DAYS"]);
    stats.push([formatNumber(profile.followers), "FOLLOWERS"]);
    const width = (WIDTH6 - PAD10 * 2) / stats.length;
    const markup = stats.map(([value, caption], index) => {
      const x = PAD10 + index * width;
      return `<text x="${num7(x)}" y="${cursor + 38}" font-size="46" font-weight="800" fill="${look.fg}">${xmlEscape(value)}</text><text class="mono" x="${num7(x)}" y="${cursor + 62}" font-size="10.5" letter-spacing="1.2" fill="${look.muted}">${xmlEscape(caption)}</text>`;
    }).join("");
    parts.push(rise(markup, motion, next()));
    cursor += 62 + 34;
  }
  const { featured, others } = blocks.has("projects") ? pickProjects(profile.topRepos) : { featured: null, others: [] };
  if (featured) {
    const w = WIDTH6 - PAD10 * 2;
    const desc = featured.description ? wrap(featured.description, Math.floor((w - 250) / 8), 2) : [];
    let card2 = `<rect x="${PAD10}" y="${cursor}" width="${w}" height="160" rx="22" fill="${look.panel}" stroke="${look.border}"/><rect x="${PAD10 + 24}" y="${cursor}" width="64" height="4" rx="2" fill="${look.accent}"/><text x="${PAD10 + 28}" y="${cursor + 52}" font-size="28" font-weight="800" fill="${look.fg}">${xmlEscape(truncate(featured.name, Math.floor((w - 250) / 15)))}</text><text class="mono" x="${PAD10 + w - 28}" y="${cursor + 56}" text-anchor="end" font-size="44" font-weight="800" fill="${look.accent}">\u2605 ${xmlEscape(formatNumber(featured.stars))}</text>`;
    desc.forEach((line, index) => {
      card2 += `<text x="${PAD10 + 28}" y="${cursor + 84 + index * 21}" font-size="14.5" fill="${look.muted}">${xmlEscape(line)}</text>`;
    });
    card2 += `<text class="mono" x="${PAD10 + 28}" y="${cursor + 142}" font-size="12.5" fill="${look.muted}">${xmlEscape(truncate(chips(featured, profile).join("  \xB7  "), 96))}</text>`;
    parts.push(rise(card2, motion, next()));
    cursor += 160 + GAP2;
  }
  if (others.length > 0) {
    const w = others.length === 1 ? WIDTH6 - PAD10 * 2 : Math.floor((WIDTH6 - PAD10 * 2 - GAP2) / 2);
    const cards = others.map((repo, index) => {
      const x = PAD10 + index * (w + GAP2);
      return `<rect x="${x}" y="${cursor}" width="${w}" height="92" rx="18" fill="${look.panel}" stroke="${look.border}"/><text x="${x + 22}" y="${cursor + 36}" font-size="17" font-weight="700" fill="${look.fg}">${xmlEscape(truncate(repo.name, Math.floor((w - 150) / 9.5)))}</text><text class="mono" x="${x + w - 22}" y="${cursor + 37}" text-anchor="end" font-size="18" font-weight="700" fill="${look.accent2}">\u2605 ${xmlEscape(formatNumber(repo.stars))}</text><text class="mono" x="${x + 22}" y="${cursor + 66}" font-size="12" fill="${look.muted}">${xmlEscape(truncate(chips(repo, profile).join("  \xB7  "), Math.floor((w - 44) / 7)))}</text>`;
    }).join("");
    parts.push(rise(cards, motion, next()));
    cursor += 92;
  }
  if (featured) cursor += 34;
  const activity = profile.contributions;
  if (blocks.has("activity") && activity) {
    const weeks = recentWeeks(activity.days, WEEKS);
    const peak = Math.max(...weeks, 1);
    const barW = 22;
    const bars = weeks.map((total, index) => {
      const h = Math.max(3, total / peak * 56);
      const x = PAD10 + index * (barW + 7);
      const fill = index === weeks.length - 1 ? look.accent2 : look.accent;
      return `<rect x="${x}" y="${num7(cursor + 56 - h)}" width="${barW}" height="${num7(h)}" rx="4" fill="${total === 0 ? look.track : fill}"/>`;
    }).join("");
    const sum = weeks.reduce((a, b) => a + b, 0);
    const textX = PAD10 + weeks.length * (barW + 7) + 22;
    const markup = bars + `<text x="${textX}" y="${cursor + 22}" font-size="26" font-weight="800" fill="${look.fg}">${xmlEscape(formatNumber(sum))}</text><text class="mono" x="${textX}" y="${cursor + 42}" font-size="11.5" fill="${look.muted}">contributions in the last ${weeks.length} weeks</text><text class="mono" x="${textX}" y="${cursor + 60}" font-size="11.5" fill="${look.muted}">current streak ${xmlEscape(plural(activity.currentStreak, "day"))}</text>`;
    parts.push(rise(markup, motion, next()));
    cursor += 56 + 34;
  }
  if (blocks.has("languages") && profile.languages.length > 0) {
    const text10 = profile.languages.slice(0, 4).map((l) => `${truncate(l.name, 14)} ${l.percent}%`).join("   ");
    parts.push(
      rise(
        `<text class="mono" x="${PAD10}" y="${num7(cursor)}" font-size="12.5" fill="${look.muted}">built with  <tspan fill="${look.fg}">${xmlEscape(text10)}</tspan></text>`,
        motion,
        next()
      )
    );
    cursor += 24;
  }
  const height = Math.ceil(cursor + PAD10 - 22);
  const title = `${profile.name ?? profile.login} (@${profile.login}) on GitHub`;
  const css = motion ? `.rise{animation:rise .6s ease both}@keyframes rise{from{opacity:0;transform:translateY(8px)}}.trail{stroke-dashoffset:0;animation:draw 2.4s ease-out both}@keyframes draw{from{stroke-dashoffset:900}}@media (prefers-reduced-motion:reduce){.rise,.trail{animation:none}}` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH6}" height="${height}" viewBox="0 0 ${WIDTH6} ${height}" role="img" aria-labelledby="t">
<title id="t">${xmlEscape(title)}</title>
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${look.skyTop}"/><stop offset="1" stop-color="${look.skyBottom}"/></linearGradient>
<radialGradient id="sun" cx="0.92" cy="0.05" r="0.7"><stop offset="0" stop-color="${look.accent}" stop-opacity="${variant === "dark" ? 0.4 : 0.3}"/><stop offset="1" stop-color="${look.accent}" stop-opacity="0"/></radialGradient>
</defs>
<style>
text{font-family:${FONT_SANS}}
.mono{font-family:${FONT2}}
${css}
</style>
<rect width="${WIDTH6}" height="${height}" rx="24" fill="url(#sky)"/>
<rect width="${WIDTH6}" height="${height}" rx="24" fill="url(#sun)"/>
<path class="trail" d="M${Math.round(WIDTH6 * 0.42)} ${heroBottom + 24} C ${Math.round(WIDTH6 * 0.62)} ${heroBottom + 20}, ${Math.round(WIDTH6 * 0.8)} ${Math.round(heroBottom * 0.55)}, ${WIDTH6 + 20} 14" fill="none" stroke="${look.accent}" stroke-opacity="0.22" stroke-width="2" stroke-dasharray="3 9" stroke-dashoffset="0"/>
${parts.filter(Boolean).join("\n")}
</svg>
`;
}
var launchpad = {
  id: "launchpad",
  name: "Launchpad",
  description: "A bold, hero-first page for people shipping products: one featured project, big numbers and recent momentum.",
  tags: ["bold", "warm", "products", "animated"],
  needsAvatar: true,
  render(profile, config) {
    const assets = variantsFor(config.theme).map((variant) => ({
      path: assetPath("launchpad", variant),
      content: renderSvg7(profile, config, variant)
    }));
    const { featured } = config.blocks.includes("projects") ? pickProjects(profile.topRepos) : { featured: null };
    const extra = featured ? `featuring ${featured.name}` : void 0;
    return { readme: imageReadme(profile, config, "launchpad", WIDTH6, describeProfile(profile, config, extra)), assets };
  }
};

// ../core/src/templates/learning.ts
var WIDTH7 = 900;
var PAD11 = 48;
var HABIT_WEEKS = 12;
var DOT = 7;
var DOT_STEP = 22;
var MONTHS6 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function habitGrid(days, weeks) {
  if (days.length === 0 || weeks <= 0) return [];
  const first = (/* @__PURE__ */ new Date(`${days[0]?.date}T00:00:00Z`)).getUTCDay();
  const cols = Math.ceil((first + days.length) / 7);
  const grid = Array.from({ length: cols }, () => Array(7).fill(null));
  days.forEach((day, index) => {
    const slot = first + index;
    grid[Math.floor(slot / 7)][slot % 7] = { date: day.date, count: day.count };
  });
  return grid.slice(-weeks);
}
function blocksFor(percent) {
  if (percent <= 0) return 0;
  return Math.min(10, Math.max(1, Math.round(percent / 10)));
}
function formatDate(iso) {
  const time = iso ? Date.parse(iso) : NaN;
  if (!Number.isFinite(time)) return null;
  const date = new Date(time);
  return `${MONTHS6[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}
var num8 = (value) => String(Math.round(value * 10) / 10 || 0);
function lookFor6(variant, hue) {
  const dark = variant === "dark";
  return {
    paper: dark ? "#1c2a29" : "#fffdf5",
    grid: dark ? "#cfe3dc" : "#6b8cc7",
    gridOpacity: dark ? 0.07 : 0.16,
    margin: dark ? "#e8a09a" : "#e0645c",
    ink: dark ? "#f2efe4" : "#27304d",
    muted: dark ? "#a9bdb6" : "#6a7191",
    marker: hslToHex(hue, 0.75, dark ? 0.66 : 0.45),
    highlight: dark ? "#f2d96b" : "#ffe45e",
    highlightOpacity: dark ? 0.32 : 0.7,
    ring: dark ? "#7f9b93" : "#9aa3c4"
  };
}
function renderSvg8(profile, config, variant) {
  const look = lookFor6(variant, hueOf(profile.avatar?.grid.tint) ?? 215);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const parts = [];
  let step = 0;
  const next = () => step++ * 0.1;
  const left = PAD11 + 36;
  const heading = (text10, x, y) => {
    const width = text10.length * 9.2 + 16;
    return `<rect x="${x - 6}" y="${y - 14}" width="${num8(width)}" height="19" rx="3" fill="${look.highlight}" fill-opacity="${look.highlightOpacity}"/><text class="mono" x="${x}" y="${y}" font-size="13" font-weight="700" letter-spacing="1.8" fill="${look.ink}">${xmlEscape(text10)}</text>`;
  };
  const updated = formatDate(profile.fetchedAt);
  let title = `<text class="serif" x="${left}" y="${PAD11 + 38}" font-size="40" font-weight="700" font-style="italic" fill="${look.ink}">${xmlEscape(truncate(profile.name ?? profile.login, 28))}</text>`;
  const sub2 = ["learning log", `@${profile.login}`, updated ? `updated ${updated}` : null].filter(Boolean).join("  \xB7  ");
  title += `<text class="mono" x="${left}" y="${PAD11 + 64}" font-size="12.5" fill="${look.muted}">${xmlEscape(sub2)}</text>`;
  if (config.text.headline) {
    title += `<text x="${left}" y="${PAD11 + 92}" font-size="17" fill="${look.ink}">${xmlEscape(truncate(config.text.headline, 80))}</text>`;
  }
  parts.push(rise(title, motion, next()));
  let cursor = PAD11 + (config.text.headline ? 128 : 100);
  if (blocks.has("stats")) {
    const year = new Date(profile.createdAt).getUTCFullYear();
    const facts = [
      `${formatNumber(profile.publicRepos)} repositories`,
      `${formatNumber(profile.totalStars)} stars`,
      Number.isFinite(year) ? `on GitHub since ${year}` : null
    ].filter((v) => Boolean(v));
    let x = left;
    const notes = facts.map((fact2, index) => {
      const width = Math.ceil(fact2.length * 7.6) + 28;
      const tilt = index % 2 === 0 ? -1.2 : 1;
      const markup = `<g transform="rotate(${tilt} ${num8(x + width / 2)} ${cursor + 16})"><rect x="${num8(x)}" y="${cursor}" width="${width}" height="32" rx="3" fill="${look.highlight}" fill-opacity="${look.highlightOpacity * 0.85}"/><text x="${num8(x + 14)}" y="${cursor + 21}" font-size="14" font-weight="600" fill="${look.ink}">${xmlEscape(fact2)}</text></g>`;
      x += width + 14;
      return markup;
    }).join("");
    parts.push(rise(notes, motion, next()));
    cursor += 32 + 40;
  }
  const colTop = cursor;
  let bottom = cursor;
  const rightX = left + 440;
  if (blocks.has("languages") && profile.languages.length > 0) {
    let y = colTop;
    let markup = heading("LANGUAGES I WRITE IN", left, y);
    y += 32;
    profile.languages.slice(0, 5).forEach((language, row) => {
      const filled = blocksFor(language.percent);
      const cells2 = Array.from({ length: 10 }, (_v, i) => {
        const on = i < filled;
        const delay = motion ? ` style="animation-delay:${(0.3 + row * 0.12 + i * 0.03).toFixed(2)}s"` : "";
        return `<rect class="${on ? "blk" : ""}" x="${left + 150 + i * 17}" y="${y - 12}" width="13" height="16" rx="2" fill="${on ? look.marker : "none"}" ${on ? "" : `stroke="${look.ring}" stroke-opacity="0.6"`}${on ? delay : ""}/>`;
      }).join("");
      markup += `<text x="${left}" y="${y}" font-size="15" font-weight="600" fill="${look.ink}">${xmlEscape(truncate(language.name, 14))}</text>` + cells2 + `<text class="mono" x="${left + 150 + 10 * 17 + 6}" y="${y}" font-size="12.5" fill="${look.muted}">${language.percent}%</text>`;
      y += 30;
    });
    markup += `<text class="mono" x="${left}" y="${y + 4}" font-size="11.5" fill="${look.muted}">${xmlEscape(`${plural(profile.languages.length, "language")} across my repositories, by number of repositories`)}</text>`;
    parts.push(rise(markup, motion, next()));
    bottom = Math.max(bottom, y + 4);
  }
  const activity = profile.contributions;
  if (blocks.has("activity") && activity) {
    const grid = habitGrid(activity.days, HABIT_WEEKS);
    const gx = rightX + 8;
    const gy = colTop + 40;
    let markup = heading("HABIT TRACKER", rightX, colTop);
    let real = 0;
    let busy = 0;
    grid.forEach((week, col) => {
      week.forEach((day, row) => {
        if (!day) return;
        real++;
        const x = gx + col * DOT_STEP;
        const y = gy + row * DOT_STEP;
        const delay = motion ? ` style="animation-delay:${(0.3 + col * 0.05 + row * 0.01).toFixed(2)}s"` : "";
        if (day.count > 0) {
          busy++;
          markup += `<circle class="dot" cx="${x}" cy="${y}" r="${DOT}" fill="${look.marker}"${delay}/>`;
        } else {
          markup += `<circle cx="${x}" cy="${y}" r="${DOT - 1.5}" fill="none" stroke="${look.ring}" stroke-opacity="0.7" stroke-width="1.5"/>`;
        }
      });
    });
    const captionY = gy + 7 * DOT_STEP + 10;
    markup += `<text class="mono" x="${rightX}" y="${captionY}" font-size="12.5" fill="${look.ink}">${busy} of the last ${real} days had activity</text><text class="mono" x="${rightX}" y="${captionY + 20}" font-size="12.5" fill="${look.muted}">current streak ${xmlEscape(plural(activity.currentStreak, "day"))}</text>`;
    parts.push(rise(markup, motion, next()));
    bottom = Math.max(bottom, captionY + 20);
  }
  cursor = bottom + 44;
  const recent = (profile.recentRepos ?? []).slice(0, 3);
  if (blocks.has("projects") && recent.length > 0) {
    let y = cursor;
    let markup = heading("RECENTLY WORKED ON", left, y);
    y += 34;
    for (const repo of recent) {
      const ago = repo.pushedAt && profile.fetchedAt ? timeAgo(repo.pushedAt, profile.fetchedAt) : null;
      markup += `<rect x="${left}" y="${y - 15}" width="18" height="18" rx="3" fill="none" stroke="${look.ink}" stroke-width="1.6"/><path d="M${left + 4} ${y - 6} l4 4 l7 -10" fill="none" stroke="${look.marker}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><text x="${left + 32}" y="${y}" font-size="16" font-weight="700" fill="${look.ink}">${xmlEscape(truncate(repo.name, 34))}</text>`;
      const detail = [ago ? `updated ${ago}` : null, repo.language].filter(Boolean).join("  \xB7  ");
      if (detail) markup += `<text class="mono" x="${WIDTH7 - PAD11}" y="${y}" text-anchor="end" font-size="12" fill="${look.muted}">${xmlEscape(detail)}</text>`;
      if (repo.description) {
        const [line] = wrap(repo.description, 96, 1);
        markup += `<text x="${left + 32}" y="${y + 20}" font-size="13" fill="${look.muted}">${xmlEscape(line ?? "")}</text>`;
        y += 52;
      } else {
        y += 34;
      }
    }
    parts.push(rise(markup, motion, next()));
    cursor = y;
  }
  const height = Math.ceil(cursor + PAD11 - 12);
  const title2 = `${profile.name ?? profile.login} (@${profile.login}) on GitHub`;
  const css = motion ? `.rise{animation:rise .6s ease both}@keyframes rise{from{opacity:0}}.dot,.blk{transform-box:fill-box;transform-origin:center;animation:pop .4s cubic-bezier(.3,1.6,.5,1) both}@keyframes pop{from{transform:scale(0)}}@media (prefers-reduced-motion:reduce){.rise,.dot,.blk{animation:none}}` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH7}" height="${height}" viewBox="0 0 ${WIDTH7} ${height}" role="img" aria-labelledby="t">
<title id="t">${xmlEscape(title2)}</title>
<defs>
<pattern id="paper" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="${look.grid}" stroke-opacity="${look.gridOpacity}"/></pattern>
</defs>
<style>
text{font-family:${FONT_SANS}}
.mono{font-family:${FONT2}}
.serif{font-family:${FONT_SERIF}}
${css}
</style>
<rect width="${WIDTH7}" height="${height}" rx="16" fill="${look.paper}"/>
<rect width="${WIDTH7}" height="${height}" rx="16" fill="url(#paper)"/>
<rect x="${PAD11 + 18}" y="0" width="2" height="${height}" fill="${look.margin}" fill-opacity="0.55"/>
${parts.filter(Boolean).join("\n")}
</svg>
`;
}
var learning = {
  id: "learning",
  name: "Learning log",
  description: "A notebook page: the languages you write in, a habit tracker of the last twelve weeks, and what you worked on lately.",
  tags: ["notebook", "chalkboard", "habits", "animated"],
  needsAvatar: false,
  render(profile, config) {
    const assets = variantsFor(config.theme).map((variant) => ({
      path: assetPath("learning", variant),
      content: renderSvg8(profile, config, variant)
    }));
    const extra = config.blocks.includes("activity") && profile.contributions ? "with a twelve-week habit tracker" : void 0;
    return { readme: imageReadme(profile, config, "learning", WIDTH7, describeProfile(profile, config, extra)), assets };
  }
};

// ../core/src/templates/lens.ts
function motif(c2, x, y, w, h) {
  const { look, motion } = c2;
  const rand = seeded2(`${c2.profile.login}:${c2.spec.id}`);
  const o = 'opacity="0.55"';
  switch (c2.spec.motif) {
    case "swatches":
      return [0, 1, 2, 3, 4].map((i) => `<rect x="${num4(x + w - 40 - i * 46)}" y="${num4(y + 10 + i % 2 * 14)}" width="34" height="34" rx="9" fill="${i % 2 ? look.accent2 : look.accent}" fill-opacity="${num4(0.18 + i * 0.12)}"/>`).join("");
    case "pipeline": {
      const xs = [0, 1, 2, 3].map((i) => x + w - 220 + i * 70);
      const cy = y + h / 2;
      const dot = motion ? `<circle r="4" fill="${look.accent2}"><animateMotion dur="4s" repeatCount="indefinite" path="M${xs[0]} ${cy}L${xs[3]} ${cy}"/></circle>` : "";
      return `<path d="M${xs[0]} ${cy}L${xs[3]} ${cy}" stroke="${look.border}" stroke-width="2" stroke-dasharray="4 5"/>` + xs.map((px) => `<rect x="${px - 9}" y="${cy - 9}" width="18" height="18" rx="5" fill="${look.panel}" stroke="${look.accent}"/>`).join("") + dot;
    }
    case "scatter":
      return Array.from({ length: 26 }, (_v, i) => {
        const px = x + w - 250 + i / 25 * 240;
        const py = y + h - 14 - i / 25 * (h - 40) - rand() * 34;
        return `<circle cx="${num4(px)}" cy="${num4(py)}" r="${num4(2 + rand() * 2.5)}" fill="${i % 3 ? look.accent : look.accent2}" fill-opacity="0.5"/>`;
      }).join("") + `<path d="M${x + w - 250} ${y + h - 14}L${x + w - 10} ${y + 22}" stroke="${look.accent}" stroke-opacity="0.35" stroke-dasharray="3 4"/>`;
    case "racks":
      return [0, 1, 2, 3].map((i) => {
        const py = y + 8 + i * 22;
        const led = motion ? ` style="animation-delay:${(i * 0.4).toFixed(1)}s"` : "";
        return `<rect x="${x + w - 230}" y="${py}" width="220" height="16" rx="4" fill="${look.panel}" stroke="${look.border}"/><circle class="pulse" cx="${x + w - 216}" cy="${py + 8}" r="3" fill="${i % 2 ? look.accent2 : look.accent}"${led}/>`;
      }).join("");
    case "rocket":
      return Array.from({ length: 9 }, (_v, i) => `<circle cx="${num4(x + w - 230 + i * 20)}" cy="${num4(y + h - 20 - i * 7)}" r="${num4(1.5 + i * 0.35)}" fill="${look.accent}" fill-opacity="${num4(0.12 + i * 0.07)}"/>`).join("") + `<path d="M${x + w - 36} ${y + h - 88}l12 30l-12 -7l-12 7z" fill="${look.accent2}" fill-opacity="0.7"/>`;
    case "spot":
      return [70, 48, 26].map((r, i) => `<circle cx="${x + w - 90}" cy="${y + h / 2}" r="${r}" fill="none" stroke="${i === 2 ? look.accent2 : look.accent}" stroke-opacity="${num4(0.18 + i * 0.12)}"/>`).join("") + `<circle cx="${x + w - 90}" cy="${y + h / 2}" r="7" fill="${look.accent2}" fill-opacity="0.8"/>`;
    case "rings":
      return [60, 42, 24].map((r) => `<circle cx="${x + w - 90}" cy="${y + h / 2}" r="${r}" fill="none" stroke="${look.accent2}" stroke-opacity="0.3" stroke-dasharray="3 5"/>`).join("") + [0, 1, 2].map((i) => `<circle cx="${num4(x + w - 90 + Math.cos(i * 2.1) * 42)}" cy="${num4(y + h / 2 + Math.sin(i * 2.1) * 42)}" r="4" fill="${look.accent}"/>`).join("");
    case "tree": {
      const bx = x + w - 140;
      const by = y + h - 8;
      return `<path d="M${bx} ${by}V${y + 40}M${bx} ${y + 70}L${bx - 52} ${y + 30}M${bx} ${y + 56}L${bx + 52} ${y + 16}M${bx} ${y + 88}L${bx + 44} ${y + 60}" stroke="${look.accent}" stroke-opacity="0.45" stroke-width="2" fill="none"/>` + [[bx - 52, y + 30], [bx + 52, y + 16], [bx + 44, y + 60], [bx, y + 40]].map(([px, py]) => `<circle cx="${px}" cy="${py}" r="5" fill="${look.accent2}" fill-opacity="0.8"/>`).join("");
    }
    case "rhythm": {
      const pts = Array.from({ length: 24 }, (_v, i) => `${i === 0 ? "M" : "L"}${num4(x + w - 250 + i * 10.4)} ${num4(y + h / 2 + Math.sin(i / 2.2) * 22 + (rand() - 0.5) * 10)}`);
      return `<path d="${pts.join("")}" fill="none" stroke="${look.accent}" stroke-width="2" stroke-opacity="0.5"/>`;
    }
    case "checks":
      return [0, 1, 2, 3].map((i) => `<circle cx="${x + w - 200 + i * 52}" cy="${y + h / 2}" r="13" fill="none" stroke="${look.accent}" stroke-opacity="0.5"/><path d="M${x + w - 207 + i * 52} ${y + h / 2}l5 5l9 -10" fill="none" stroke="${look.accent2}" stroke-width="2" stroke-linecap="round"/>`).join("");
    case "sweep":
      return `<rect x="${x + w - 250}" y="${y + 20}" width="240" height="${h - 40}" rx="12" fill="none" stroke="${look.border}"/>` + [0, 1, 2].map((i) => `<rect x="${x + w - 236}" y="${y + 36 + i * 22}" width="${150 - i * 30}" height="8" rx="4" fill="${i === 1 ? look.accent2 : look.accent}" fill-opacity="0.45"/>`).join("");
    case "columns":
      return [0, 1, 2].map((i) => `<rect x="${x + w - 190 + i * 62}" y="${y + 14}" width="44" height="${h - 28}" rx="8" fill="none" stroke="${i === 1 ? look.accent : look.border}" stroke-dasharray="${i === 1 ? "0" : "4 4"}" ${o}/>`).join("");
  }
}
function sub(c2) {
  const { profile, look, config } = c2;
  const parts = [`<tspan fill="${look.muted}">@${xmlEscape(profile.login)}</tspan>`];
  if (config.text.headline) parts.push(`<tspan fill="${look.accent}" font-weight="600">${xmlEscape(truncate(config.text.headline, 44))}</tspan>`);
  return parts.join(`<tspan fill="${look.muted}">  \xB7  </tspan>`);
}
function activityCaption(profile) {
  const a = profile.contributions;
  if (!a) return null;
  const month = busiestMonth(a.days);
  return [`${formatNumber(a.total)} contributions`, `streak ${plural(a.currentStreak, "day")}`, month ? `busiest ${month.name}` : null].filter(Boolean).join("  \xB7  ");
}
function dash(c2) {
  const { profile, look, motion, blocks, plan, config } = c2;
  const parts = [];
  let step = 0;
  const next = () => step++ * 0.09;
  const name = truncate(profile.name ?? profile.login, 28);
  const bio = config.text.bio ?? profile.bio;
  const textX = PAD6 + 38 * 2 + 26;
  const showStats = blocks.has("stats");
  let header = motif(c2, 0, PAD6 - 10, W - PAD6 - 190, 118) + portrait(profile, look, PAD6 + 38, PAD6 + 40, 38);
  if (plan.kicker) header += label2(look, plan.kicker, textX, PAD6 + 8);
  header += sans(name, textX, PAD6 + 38, look.fg, 'font-size="28" font-weight="800"') + `<text x="${textX}" y="${PAD6 + 62}" font-size="14" xml:space="preserve">${sub(c2)}</text>`;
  if (bio) header += sans(truncate(bio, 70), textX, PAD6 + 84, look.fg, 'font-size="13" fill-opacity="0.8"');
  if (showStats && plan.hero) {
    header += sans(plan.hero.value, W - PAD6, PAD6 + 52, look.fg, 'font-size="46" font-weight="800" text-anchor="end"') + mono(plan.hero.label, W - PAD6, PAD6 + 74, look.muted, 'font-size="10.5" letter-spacing="1" text-anchor="end"');
  }
  parts.push(enter(header, motion, next()));
  let cursor = PAD6 + 118;
  const panes = [];
  if (showStats && plan.facts.length > 0) {
    panes.push({
      title: "SIGNAL",
      draw: (x, y) => plan.facts.slice(0, 3).map((f, i) => sans(f.value, x, y + 22 + i * 44, look.fg, 'font-size="24" font-weight="800"') + mono(f.label, x, y + 38 + i * 44, look.muted, 'font-size="10" letter-spacing="1"')).join("")
    });
  }
  if (blocks.has("languages") && profile.languages.length > 0) {
    panes.push({ title: "STACK", draw: (x, y, w) => langBars(look, profile.languages, x, y + 2, w, 4).markup });
  }
  if (blocks.has("activity") && profile.contributions) {
    const a = profile.contributions;
    panes.push({
      title: "RHYTHM",
      draw: (x, y, w) => weekBars(look, a.days, x, y + 4, w, 78, motion) + mono(`${formatNumber(a.total)} contributions`, x, y + 112, look.fg, 'font-size="12" font-weight="700"') + mono(`streak ${plural(a.currentStreak, "day")}, best ${plural(a.longestStreak, "day")}`, x, y + 130, look.muted, 'font-size="11"')
    });
  }
  if (panes.length > 0) {
    const gap = 16;
    const w = (W - PAD6 * 2 - gap * (panes.length - 1)) / panes.length;
    const h = 186;
    const markup = panes.map((p, i) => {
      const x = PAD6 + i * (w + gap);
      return panel(look, x, cursor, w, h) + label2(look, p.title, x + 18, cursor + 28) + p.draw(x + 18, cursor + 44, w - 36);
    }).join("");
    parts.push(enter(markup, motion, next()));
    cursor += h + 24;
  }
  const repoSection = blocks.has("projects") ? plan.sections.find((s) => s.repos && s.repos.length > 0) : void 0;
  if (repoSection?.repos) {
    const rows = repoSection.repos.slice(0, 4);
    const markup = label2(look, repoSection.title, PAD6, cursor + 8) + rows.map((r, i) => repoRow(look, r, profile, PAD6, cursor + 22 + i * REPO_ROW, W - PAD6 * 2)).join("");
    parts.push(enter(markup, motion, next()));
    cursor += 22 + rows.length * REPO_ROW + 14;
  }
  return { body: parts.join("\n"), height: Math.max(cursor - 14 + PAD6, 300) };
}
function board(c2) {
  const { profile, look, motion, blocks, plan, config } = c2;
  const parts = [];
  let step = 0;
  const next = () => step++ * 0.09;
  const leftW = 290;
  const rightX = PAD6 + leftW + 30;
  const rightW = W - PAD6 - rightX;
  const showStats = blocks.has("stats");
  let ly = PAD6;
  let left = portrait(profile, look, PAD6 + 46, PAD6 + 46, 46);
  ly = PAD6 + 120;
  if (plan.kicker) {
    left += label2(look, plan.kicker, PAD6, ly - 6);
    ly += 18;
  }
  left += sans(truncate(profile.name ?? profile.login, 20), PAD6, ly + 12, look.fg, 'font-size="26" font-weight="800"') + `<text x="${PAD6}" y="${ly + 36}" font-size="13.5" xml:space="preserve">${sub(c2)}</text>`;
  ly += 56;
  const bio = config.text.bio ?? profile.bio;
  if (bio) {
    wrap(bio, 38, 3).forEach((line, i) => left += sans(line, PAD6, ly + i * 18, look.fg, 'font-size="13" fill-opacity="0.8"'));
    ly += wrap(bio, 38, 3).length * 18 + 8;
  }
  if (showStats && plan.hero) {
    left += sans(plan.hero.value, PAD6, ly + 46, look.fg, 'font-size="46" font-weight="800"') + mono(plan.hero.label, PAD6, ly + 66, look.muted, 'font-size="10.5" letter-spacing="1"');
    ly += 90;
  }
  if (showStats) {
    plan.facts.slice(0, 3).forEach((f, i) => {
      left += mono(f.label, PAD6, ly + 14 + i * 24, look.muted, 'font-size="10.5" letter-spacing="1"') + mono(f.value, PAD6 + leftW, ly + 14 + i * 24, look.fg, 'font-size="13" font-weight="700" text-anchor="end"') + `<rect x="${PAD6}" y="${ly + 21 + i * 24}" width="${leftW}" height="1" fill="${look.border}"/>`;
    });
    ly += plan.facts.slice(0, 3).length * 24 + 12;
  }
  const motifTop = ly + 4;
  left = motif(c2, PAD6, motifTop, leftW + 20, 100) + left;
  ly = motifTop + 104;
  parts.push(enter(left, motion, next()));
  let ry = PAD6;
  for (const section2 of plan.sections) {
    let markup = "";
    let used = 0;
    if (section2.repos && section2.repos.length > 0 && blocks.has("projects")) {
      const rows = section2.repos.slice(0, 5);
      markup = label2(look, section2.title, rightX, ry + 8) + rows.map((r, i) => repoRow(look, r, profile, rightX, ry + 22 + i * REPO_ROW, rightW)).join("");
      used = 22 + rows.length * REPO_ROW + 14;
    } else if (section2.checks && section2.checks.length > 0 && showStats) {
      const h = 22 + section2.checks.length * 30 + 12;
      markup = label2(look, section2.title, rightX, ry + 8) + panel(look, rightX, ry + 18, rightW, h - 14 + 2, false) + section2.checks.map((line, i) => `<circle cx="${rightX + 24}" cy="${ry + 44 + i * 30}" r="9" fill="${look.accent}" fill-opacity="0.18"/><path d="M${rightX + 19.5} ${ry + 44 + i * 30}l3.5 3.5l6 -7" fill="none" stroke="${look.accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` + sans(truncate(line, 62), rightX + 44, ry + 48.5 + i * 30, look.fg, 'font-size="13.5"')).join("");
      used = h + 16;
    } else if (section2.text) {
      const lines = wrap(section2.text, Math.floor(rightW / 8), 3);
      markup = label2(look, section2.title, rightX, ry + 8) + lines.map((line, i) => sans(line, rightX, ry + 36 + i * 22, look.fg, 'font-size="16" font-weight="600"')).join("");
      used = 36 + lines.length * 22 + 10;
    }
    if (markup) {
      parts.push(enter(markup, motion, next()));
      ry += used;
    }
  }
  if (blocks.has("activity") && profile.contributions) {
    const heat = heatStrip(look, profile.contributions.days, rightX + 16, ry + 44, rightW - 32);
    const h = 44 + heat.height + 40;
    const caption = activityCaption(profile);
    const markup = label2(look, "ACTIVITY, PAST YEAR", rightX, ry + 8) + panel(look, rightX, ry + 18, rightW, h - 18, false) + heat.markup + (caption ? mono(truncate(caption, 80), rightX + 16, ry + 44 + heat.height + 22, look.muted, 'font-size="11.5"') : "");
    parts.push(enter(markup, motion, next()));
    ry += h + 8;
  }
  return { body: parts.join("\n"), height: Math.max(ly, ry) + PAD6 - 8 };
}
function renderSvg9(spec, profile, config, variant) {
  const look = lookOf(spec.hue, variant, profile);
  const plan = spec.plan(profile, config);
  const c2 = { profile, config, look, variant, motion: config.motion, blocks: new Set(config.blocks), plan, spec };
  const { body, height } = spec.layout === "dash" ? dash(c2) : board(c2);
  const animated2 = spec.animated && config.motion;
  const sweep = animated2 ? `<rect class="sweep" x="-160" y="0" width="120" height="${height}" fill="url(#sw)"/>` : "";
  const css = riseCss(config.motion) + (config.motion ? `.pulse{animation:pulse 1.8s ease-in-out infinite}@keyframes pulse{50%{opacity:.25}}` + (animated2 ? `.sweep{animation:sweep 6s linear infinite}@keyframes sweep{to{transform:translateX(1100px)}}` : "") + `@media (prefers-reduced-motion:reduce){.pulse,.sweep{animation:none}}` : "");
  const defs = animated2 ? `<linearGradient id="sw" x1="0" x2="1"><stop offset="0" stop-color="${look.accent}" stop-opacity="0"/><stop offset="0.5" stop-color="${look.accent}" stop-opacity="0.12"/><stop offset="1" stop-color="${look.accent}" stop-opacity="0"/></linearGradient>` : "";
  return shell({
    height,
    look,
    variant,
    title: `${profile.name ?? profile.login} (@${profile.login}) on GitHub`,
    css,
    defs,
    body: body + sweep
  });
}
function lensTemplate(spec) {
  return {
    id: spec.id,
    name: spec.name,
    description: spec.description,
    tags: spec.tags,
    needsAvatar: true,
    render(profile, config) {
      const assets = variantsFor(config.theme).map((variant) => ({
        path: assetPath(spec.id, variant),
        content: renderSvg9(spec, profile, config, variant)
      }));
      const projects = config.blocks.includes("projects") && profile.topRepos.length > 0 ? `top projects ${profile.topRepos.slice(0, 4).map((r) => r.name).join(", ")}` : void 0;
      return { readme: imageReadme(profile, config, spec.id, W, describeProfile(profile, config, projects, { activity: true })), assets };
    }
  };
}

// ../core/src/templates/lenses.ts
var WEB = ["TypeScript", "JavaScript", "CSS", "SCSS", "Less", "HTML", "Vue", "Svelte", "Astro", "Elm", "CoffeeScript"];
var SERVICES = ["Go", "Rust", "Java", "Kotlin", "Scala", "C#", "Elixir", "Erlang", "Ruby", "PHP", "Python", "C", "C++", "Haskell", "Clojure", "Zig"];
var INFRA = ["Shell", "HCL", "Dockerfile", "Makefile", "Nix", "PowerShell", "Jsonnet", "Starlark", "Bicep"];
var DATA = ["Python", "Jupyter Notebook", "R", "Julia", "SQL", "MATLAB", "TeX", "Stata"];
var stars2 = (repos) => repos.reduce((sum, r) => sum + r.stars, 0);
var fact = (label4, value, show = true) => show && value !== void 0 && value !== "" ? [{ label: label4, value: typeof value === "number" ? formatNumber(value) : value }] : [];
function languagePlan(profile, languages, kicker, matchedTitle, matchedCaption) {
  const matched = reposIn(profile, languages);
  const share = shareIn(profile, languages);
  const hasMatch = matched.length > 0;
  return {
    ...hasMatch ? { kicker } : {},
    hero: hasMatch ? { value: formatNumber(stars2(matched)), label: matchedCaption } : { value: formatNumber(profile.totalStars), label: "STARS EARNED" },
    facts: [
      ...fact("TOP REPOS IN THIS AREA", matched.length, hasMatch),
      ...fact("SHARE OF REPOS IN THIS AREA", `${share}%`, share > 0),
      ...fact("FOLLOWERS", profile.followers)
    ].slice(0, 3),
    sections: [{ title: hasMatch ? matchedTitle : "TOP PROJECTS", repos: (hasMatch ? matched : profile.topRepos).slice(0, 4) }]
  };
}
var frontend = {
  id: "frontend",
  name: "Frontend",
  description: "Interface craft and shipped work: your web-language projects up front, with stars and your stack.",
  tags: ["dark", "web", "projects"],
  hue: 205,
  layout: "dash",
  motif: "swatches",
  plan: (p) => languagePlan(p, WEB, "WEB INTERFACE WORK", "WEB PROJECTS", "STARS ON WEB PROJECTS")
};
var backend = {
  id: "backend",
  name: "Backend",
  description: "Systems thinking, made clear: your service and systems projects, their reach, and the rhythm behind them.",
  tags: ["dark", "systems", "projects"],
  hue: 28,
  layout: "dash",
  motif: "racks",
  plan: (p) => languagePlan(p, SERVICES, "SERVICES AND SYSTEMS", "SERVICE PROJECTS", "STARS ON THESE PROJECTS")
};
var devops = {
  id: "devops",
  name: "DevOps",
  description: "Reliable systems and delivery: infrastructure and automation repos, plus how recently you have been shipping.",
  tags: ["dark", "infrastructure", "projects"],
  hue: 150,
  layout: "dash",
  motif: "pipeline",
  plan(p) {
    const base = languagePlan(p, INFRA, "INFRASTRUCTURE AND DELIVERY", "INFRASTRUCTURE PROJECTS", "STARS ON THESE PROJECTS");
    const active = p.activeRepos;
    if (active !== void 0 && active > 0) {
      base.facts = [...fact(`REPOS ACTIVE, LAST ${ACTIVE_WINDOW_DAYS} DAYS`, active), ...base.facts].slice(0, 3);
    }
    return base;
  }
};
var datalab = {
  id: "datalab",
  name: "Data Lab",
  description: "Evidence, experiments, insight: notebooks and data projects up front, with the numbers behind them.",
  tags: ["dark", "data", "projects"],
  hue: 268,
  layout: "dash",
  motif: "scatter",
  plan: (p) => languagePlan(p, DATA, "DATA AND ANALYSIS", "DATA PROJECTS", "STARS ON DATA PROJECTS")
};
var indie = {
  id: "indie",
  name: "Indie Hacker",
  description: "Builds, launches and momentum: what you updated lately, your streak, and how many projects are moving.",
  tags: ["dark", "momentum", "projects"],
  hue: 350,
  layout: "dash",
  motif: "rocket",
  plan(p) {
    const dated = p.topRepos.filter((r) => r.pushedAt).sort((a, b) => (b.pushedAt ?? "").localeCompare(a.pushedAt ?? ""));
    const streak = p.contributions?.currentStreak;
    return {
      ...p.activeRepos !== void 0 || streak !== void 0 ? { kicker: "BUILDS AND MOMENTUM" } : {},
      hero: p.activeRepos !== void 0 ? { value: formatNumber(p.activeRepos), label: `REPOS ACTIVE, LAST ${ACTIVE_WINDOW_DAYS} DAYS` } : { value: formatNumber(p.totalStars), label: "STARS EARNED" },
      facts: [
        ...fact("CURRENT STREAK", streak !== void 0 ? plural(streak, "day") : void 0),
        ...fact("CONTRIBUTIONS, PAST YEAR", p.contributions?.total),
        ...fact("PUBLIC REPOSITORIES", p.publicRepos)
      ].slice(0, 3),
      sections: [{ title: dated.length > 0 ? "UPDATED MOST RECENTLY" : "TOP PROJECTS", repos: (dated.length > 0 ? dated : p.topRepos).slice(0, 4) }]
    };
  }
};
var animated = {
  id: "animatedfrontend",
  name: "Animated Frontend",
  description: "Web craft with a technical visual system: a sweeping light and pulsing marks over your interface projects.",
  tags: ["animated", "web", "teal"],
  hue: 172,
  layout: "dash",
  motif: "sweep",
  animated: true,
  plan: (p) => languagePlan(p, WEB, "WEB INTERFACE WORK", "WEB PROJECTS", "STARS ON WEB PROJECTS")
};
var product = {
  id: "product",
  name: "Product Engineer",
  description: "Outcomes, highlights and shipped work: your most-starred projects as a short, confident list.",
  tags: ["dark", "highlights", "projects"],
  hue: 222,
  layout: "board",
  motif: "spot",
  plan: (p) => ({
    hero: { value: formatNumber(p.totalStars), label: "STARS ACROSS PROJECTS" },
    facts: [...fact("PUBLIC REPOSITORIES", p.publicRepos), ...fact("FOLLOWERS", p.followers), ...fact(`REPOS ACTIVE, LAST ${ACTIVE_WINDOW_DAYS} DAYS`, p.activeRepos)].slice(0, 3),
    sections: [{ title: "HIGHLIGHTS", repos: p.topRepos.slice(0, 4) }]
  })
};
var advocate = {
  id: "advocate",
  name: "Advocate",
  description: "A memorable identity for community-facing work: your audience, your reach and your most-starred projects.",
  tags: ["dark", "community", "reach"],
  hue: 330,
  layout: "board",
  motif: "rings",
  plan: (p) => ({
    hero: { value: formatNumber(p.followers), label: "FOLLOWERS" },
    facts: [...fact("STARS EARNED", p.totalStars), ...fact("FORKS OF YOUR REPOS", p.totalForks), ...fact("FOLLOWING", p.following)].slice(0, 3),
    sections: [{ title: "MOST STARRED", repos: p.topRepos.slice(0, 4) }]
  })
};
var framework = {
  id: "framework",
  name: "Framework Creator",
  description: "Ecosystem-scale work with technical proof: your projects ranked by how many people forked them.",
  tags: ["dark", "ecosystem", "projects"],
  hue: 190,
  layout: "board",
  motif: "tree",
  plan(p) {
    const forked = [...p.topRepos].sort((a, b) => b.forks - a.forks);
    const forks = p.totalForks;
    return {
      hero: forks !== void 0 ? { value: formatNumber(forks), label: "FORKS OF YOUR REPOS" } : { value: formatNumber(p.totalStars), label: "STARS EARNED" },
      facts: [...fact("STARS EARNED", p.totalStars, forks !== void 0), ...fact("PUBLIC REPOSITORIES", p.publicRepos), ...fact("FOLLOWERS", p.followers)].slice(0, 3),
      sections: [{ title: "MOST FORKED", repos: forked.slice(0, 4) }]
    };
  }
};
var ossbuilder = {
  id: "ossbuilder",
  name: "OSS Builder",
  description: "A deep open-source catalogue with contribution rhythm: every top project, its licence and its freshness.",
  tags: ["dark", "open source", "catalogue"],
  hue: 138,
  layout: "board",
  motif: "rhythm",
  plan(p) {
    const licensed = p.topRepos.filter((r) => r.license).length;
    return {
      hero: { value: formatNumber(p.publicRepos), label: "PUBLIC REPOSITORIES" },
      facts: [
        ...fact("STARS EARNED", p.totalStars),
        ...fact("TOP REPOS WITH A LICENCE", licensed, licensed > 0),
        ...fact("CONTRIBUTIONS, PAST YEAR", p.contributions?.total)
      ].slice(0, 3),
      sections: [{ title: "CATALOGUE", repos: p.topRepos.slice(0, 5) }]
    };
  }
};
var ossproof = {
  id: "ossproof",
  name: "Open-Source Proof",
  description: "Open-source credibility in plain checks: only the things your public data can back up, each with its number.",
  tags: ["dark", "open source", "proof"],
  hue: 236,
  layout: "board",
  motif: "checks",
  plan(p) {
    const licensed = p.topRepos.filter((r) => r.license).length;
    const checks = [
      p.totalStars > 0 ? `${formatNumber(p.totalStars)} stars earned across public repositories` : "",
      p.totalForks !== void 0 && p.totalForks > 0 ? `${formatNumber(p.totalForks)} forks by other people` : "",
      licensed > 0 ? `${licensed} of the top ${p.topRepos.length} repositories declare a licence` : "",
      p.activeRepos !== void 0 && p.activeRepos > 0 ? `${formatNumber(p.activeRepos)} ${p.activeRepos === 1 ? "repository" : "repositories"} pushed to in the last ${ACTIVE_WINDOW_DAYS} days` : "",
      p.contributions && p.contributions.currentStreak > 0 ? `A ${p.contributions.currentStreak}-day contribution streak right now` : "",
      p.followers > 0 ? `${formatNumber(p.followers)} people follow the work` : ""
    ].filter(Boolean);
    return {
      hero: { value: formatNumber(p.totalStars), label: "STARS EARNED" },
      facts: [...fact("PUBLIC REPOSITORIES", p.publicRepos), ...fact("FOLLOWERS", p.followers)],
      sections: [{ title: "PROOF POINTS", checks }, { title: "PROJECTS", repos: p.topRepos.slice(0, 3) }]
    };
  }
};
var founder = {
  id: "founder",
  name: "Founder",
  description: "Vision, product and proof: your own words, your lead project, and the numbers that stand behind it.",
  tags: ["dark", "product", "proof"],
  hue: 40,
  layout: "board",
  motif: "columns",
  plan(p, config) {
    const vision = config.text.headline ?? config.text.bio ?? p.bio ?? void 0;
    const lead = p.topRepos[0];
    return {
      hero: { value: formatNumber(p.totalStars), label: "STARS EARNED" },
      facts: [...fact("FOLLOWERS", p.followers), ...fact("PUBLIC REPOSITORIES", p.publicRepos), ...fact("CONTRIBUTIONS, PAST YEAR", p.contributions?.total)].slice(0, 3),
      sections: [
        ...vision ? [{ title: "VISION", text: vision }] : [],
        ...lead ? [{ title: "PRODUCT", repos: [lead] }] : []
      ]
    };
  }
};
var lensTemplates = [frontend, backend, devops, datalab, indie, animated, product, advocate, framework, ossbuilder, ossproof, founder].map(lensTemplate);

// ../core/src/templates/maintainer.ts
var WIDTH8 = 900;
var PAD12 = 36;
var AVATAR = 76;
var TILE_GAP = 16;
var TILE_HEIGHT = 140;
var SECTION_GAP = 30;
var CHART_HEIGHT = 70;
var BAR_GAP = 3;
var PALETTE = {
  dark: { bg: "#0b1220", panel: "#111a2e", border: "#22304d", fg: "#e7ecf6", muted: "#93a0ba", track: "#1a2540", grid: "#7c93c4" },
  light: { bg: "#f4f7fc", panel: "#ffffff", border: "#d6dfee", fg: "#0f1b33", muted: "#5a6987", track: "#e6ecf6", grid: "#3b5bb0" }
};
var mono2 = (text10, x, y, fill, extra = "") => `<text class="mono" x="${x}" y="${y}" fill="${fill}" ${extra}>${xmlEscape(text10)}</text>`;
function sectionLabel(text10, y, color) {
  return mono2(text10, PAD12, y, color, 'font-size="12" font-weight="700" letter-spacing="2"');
}
function repoTile(repo, x, y, width, profile, t, accent2) {
  const parts = [
    `<rect x="${x}" y="${y}" width="${width}" height="${TILE_HEIGHT}" rx="14" fill="${t.panel}" stroke="${t.border}"/>`
  ];
  const nameRoom = Math.floor((width - 36) / 9.4) - (repo.language ? Math.ceil(repo.language.length * 0.8) + 2 : 0);
  parts.push(
    `<text x="${x + 18}" y="${y + 32}" font-size="15.5" font-weight="700" fill="${accent2}">${xmlEscape(truncate(repo.name, Math.max(10, nameRoom)))}</text>`
  );
  if (repo.language) {
    const label4 = truncate(repo.language, 16);
    const right = x + width - 18;
    parts.push(
      `<circle cx="${right - label4.length * 7.2 - 12}" cy="${y + 27.5}" r="4" fill="${accent2}"/>` + mono2(label4, right, y + 32, t.muted, 'font-size="12" text-anchor="end"')
    );
  }
  if (repo.description) {
    wrap(repo.description, Math.max(20, Math.floor((width - 36) / 6.5)), 2).forEach((line, index) => {
      parts.push(
        `<text x="${x + 18}" y="${y + 56 + index * 19}" font-size="13" fill="${t.muted}">${xmlEscape(line)}</text>`
      );
    });
  }
  parts.push(
    `<text class="mono" x="${x + 18}" y="${y + 106}" font-size="12" fill="${t.muted}" xml:space="preserve"><tspan fill="${t.fg}" font-weight="700">\u2605 ${xmlEscape(formatNumber(repo.stars))}</tspan>   forks <tspan fill="${t.fg}" font-weight="700">${xmlEscape(formatNumber(repo.forks))}</tspan></text>`
  );
  const updated = repo.pushedAt && profile.fetchedAt ? timeAgo(repo.pushedAt, profile.fetchedAt) : null;
  const facts = [repo.license, updated ? `updated ${updated}` : null].filter((v) => Boolean(v));
  if (facts.length > 0) {
    parts.push(mono2(facts.join("  \xB7  "), x + 18, y + 127, t.muted, 'font-size="11.5"'));
  }
  return parts.join("");
}
function renderSvg10(profile, config, variant) {
  const t = PALETTE[variant];
  const tint = profile.avatar?.grid.tint;
  const palette = tint ? accentColors(tint, variant) : FALLBACK_ACCENTS[variant];
  const accent2 = (tint ? palette[0] : palette[1]) ?? t.fg;
  const accent22 = (tint ? palette[1] : palette[0]) ?? accent2;
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const parts = [];
  let step = 0;
  const next = () => step++ * 0.09;
  const uri = profile.avatar?.dataUri;
  const hasPhoto = Boolean(uri && SAFE_DATA_URI.test(uri));
  const cx = PAD12 + AVATAR / 2;
  const cy = PAD12 + AVATAR / 2;
  const initial = [...profile.name ?? profile.login][0]?.toUpperCase() ?? "?";
  const portrait2 = hasPhoto && uri ? `<clipPath id="portrait"><circle cx="${cx}" cy="${cy}" r="${AVATAR / 2}"/></clipPath><image href="${uri}" x="${PAD12}" y="${PAD12}" width="${AVATAR}" height="${AVATAR}" preserveAspectRatio="xMidYMid slice" clip-path="url(#portrait)"/><circle cx="${cx}" cy="${cy}" r="${AVATAR / 2 + 4}" fill="none" stroke="${accent2}" stroke-width="2"/>` : `<circle cx="${cx}" cy="${cy}" r="${AVATAR / 2}" fill="${accent2}"/><text x="${cx}" y="${cy + 12}" text-anchor="middle" font-size="34" font-weight="800" fill="${t.bg}">${xmlEscape(initial)}</text>`;
  const textX = PAD12 + AVATAR + 24;
  const bio = config.text.bio ?? profile.bio;
  const subline2 = [
    profile.name ? `<tspan fill="${t.muted}">@${xmlEscape(profile.login)}</tspan>` : "",
    config.text.headline ? `<tspan fill="${accent2}" font-weight="600">${xmlEscape(truncate(config.text.headline, 50))}</tspan>` : ""
  ].filter(Boolean);
  const header = portrait2 + `<text x="${textX}" y="${PAD12 + 30}" font-size="30" font-weight="800" fill="${t.fg}">${xmlEscape(truncate(profile.name ?? profile.login, 30))}</text>` + (subline2.length > 0 ? `<text x="${textX}" y="${PAD12 + 54}" font-size="14.5" xml:space="preserve">${subline2.join('<tspan fill="' + t.muted + '">  \xB7  </tspan>')}</text>` : "") + (bio ? `<text x="${textX}" y="${PAD12 + 76}" font-size="13.5" fill="${t.fg}" fill-opacity="0.8">${xmlEscape(truncate(bio, 88))}</text>` : "") + mono2(`github.com/${profile.login}`, WIDTH8 - PAD12, PAD12 + 22, t.muted, 'font-size="12.5" text-anchor="end"');
  parts.push(rise(header, motion, next()));
  let cursor = PAD12 + AVATAR + 32;
  if (blocks.has("stats")) {
    const cells2 = [[formatNumber(profile.totalStars), "STARS EARNED"]];
    if (profile.totalForks !== void 0) cells2.push([formatNumber(profile.totalForks), "FORKS"]);
    cells2.push([formatNumber(profile.publicRepos), "REPOSITORIES"]);
    if (profile.activeRepos !== void 0) cells2.push([formatNumber(profile.activeRepos), `ACTIVE, LAST ${ACTIVE_WINDOW_DAYS} DAYS`]);
    if (cells2.length < 4) cells2.push([formatNumber(profile.followers), "FOLLOWERS"]);
    const shown = cells2.slice(0, 4);
    const cellWidth = (WIDTH8 - PAD12 * 2) / shown.length;
    const markup = `<rect x="${PAD12}" y="${cursor}" width="${WIDTH8 - PAD12 * 2}" height="88" rx="16" fill="${t.panel}" stroke="${t.border}"/><rect x="${PAD12 + 20}" y="${cursor}" width="44" height="3" rx="1.5" fill="${accent2}"/>` + shown.map(([value, caption], index) => {
      const x = PAD12 + index * cellWidth + 24;
      const divider = index > 0 ? `<rect x="${(PAD12 + index * cellWidth).toFixed(1)}" y="${cursor + 18}" width="1" height="52" fill="${t.border}"/>` : "";
      return divider + `<text x="${x.toFixed(1)}" y="${cursor + 47}" font-size="30" font-weight="800" fill="${t.fg}">${xmlEscape(value)}</text>` + mono2(caption, Number(x.toFixed(1)), cursor + 68, t.muted, 'font-size="10.5" letter-spacing="1"');
    }).join("");
    parts.push(rise(markup, motion, next()));
    cursor += 88 + SECTION_GAP;
  }
  if (blocks.has("projects") && profile.topRepos.length > 0) {
    const repos = profile.topRepos.slice(0, 4);
    const half = Math.floor((WIDTH8 - PAD12 * 2 - TILE_GAP) / 2);
    const top = cursor + 24;
    const tiles = repos.map((repo, index) => {
      const alone = index === repos.length - 1 && repos.length % 2 === 1;
      const width = alone ? WIDTH8 - PAD12 * 2 : half;
      const x = PAD12 + index % 2 * (half + TILE_GAP);
      const y = top + Math.floor(index / 2) * (TILE_HEIGHT + TILE_GAP);
      return repoTile(repo, x, y, width, profile, t, accent2);
    }).join("");
    parts.push(rise(sectionLabel("PROJECTS", cursor + 10, accent2) + tiles, motion, next()));
    const rows = Math.ceil(repos.length / 2);
    cursor = top + rows * TILE_HEIGHT + (rows - 1) * TILE_GAP + SECTION_GAP;
  }
  if (blocks.has("activity") && profile.contributions) {
    const activity = profile.contributions;
    const weeks = weeklyTotals(activity.days);
    const peak = Math.max(...weeks, 1);
    const peakIndex = weeks.indexOf(Math.max(...weeks));
    const width = WIDTH8 - PAD12 * 2;
    const barWidth = (width - BAR_GAP * (weeks.length - 1)) / weeks.length;
    const top = cursor + 24;
    const bars = weeks.map((total, index) => {
      const height2 = Math.max(2, total / peak * CHART_HEIGHT);
      const x = PAD12 + index * (barWidth + BAR_GAP);
      const fill = total === 0 ? t.track : index === peakIndex ? accent22 : accent2;
      const delay = motion ? ` style="animation-delay:${(0.25 + index * 0.012).toFixed(3)}s"` : "";
      return `<rect class="bar" x="${x.toFixed(2)}" y="${(top + CHART_HEIGHT - height2).toFixed(2)}" width="${barWidth.toFixed(2)}" height="${height2.toFixed(2)}" rx="1.5" fill="${fill}"${total === 0 ? "" : ' fill-opacity="0.9"'}${delay}/>`;
    }).join("");
    const month = busiestMonth(activity.days);
    const caption = [
      `${formatNumber(activity.total)} contributions`,
      `current streak ${plural(activity.currentStreak, "day")}`,
      `longest streak ${plural(activity.longestStreak, "day")}`,
      month ? `busiest month ${month.name} (${formatNumber(month.total)})` : null
    ].filter((v) => Boolean(v)).join("  \xB7  ");
    const markup = sectionLabel("PULSE, PAST YEAR", cursor + 10, accent2) + `<rect x="${PAD12}" y="${top + CHART_HEIGHT + 1}" width="${width}" height="1" fill="${t.border}"/>` + bars + mono2(truncate(caption, 120), PAD12, top + CHART_HEIGHT + 26, t.muted, 'font-size="12"');
    parts.push(rise(markup, motion, next()));
    cursor = top + CHART_HEIGHT + 26 + 8 + SECTION_GAP;
  }
  if (blocks.has("languages") && profile.languages.length > 0) {
    let x = PAD12 + 112;
    const items = [];
    profile.languages.forEach((language, index) => {
      const label4 = `${truncate(language.name, 14)} ${language.percent}%`;
      const width = 16 + Math.ceil(label4.length * 7) + 22;
      if (x + width > WIDTH8 - PAD12) return;
      const shade = (tint ? palette : [accent2, accent22])[index % (tint ? palette.length : 2)] ?? accent2;
      items.push(
        `<circle cx="${x + 4}" cy="${cursor - 4}" r="4" fill="${shade}"/><text x="${x + 16}" y="${cursor}" font-size="13" fill="${t.fg}" fill-opacity="0.85">${xmlEscape(label4)}</text>`
      );
      x += width;
    });
    parts.push(rise(sectionLabel("WRITTEN IN", cursor, accent2) + items.join(""), motion, next()));
    cursor += 10 + SECTION_GAP;
  }
  const height = cursor - SECTION_GAP + PAD12;
  const title = `${profile.name ?? profile.login} (@${profile.login}) on GitHub`;
  const css = motion ? `.rise{animation:rise .6s ease both}
@keyframes rise{from{opacity:0;transform:translateY(6px)}}
.bar{transform-box:fill-box;transform-origin:50% 100%;animation:grow .7s cubic-bezier(.2,.7,.2,1) both}
@keyframes grow{from{transform:scaleY(0)}}
@media (prefers-reduced-motion:reduce){.rise,.bar{animation:none}}` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH8}" height="${height}" viewBox="0 0 ${WIDTH8} ${height}" role="img" aria-labelledby="t">
<title id="t">${xmlEscape(title)}</title>
<defs>
<pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="${t.grid}" stroke-opacity="${variant === "dark" ? 0.09 : 0.08}"/></pattern>
<radialGradient id="glow" cx="0.92" cy="0" r="0.8"><stop offset="0" stop-color="${accent2}" stop-opacity="${variant === "dark" ? 0.2 : 0.12}"/><stop offset="1" stop-color="${accent2}" stop-opacity="0"/></radialGradient>
</defs>
<style>
text{font-family:${FONT_SANS}}
.mono{font-family:${FONT2}}
${css}
</style>
<rect width="${WIDTH8}" height="${height}" rx="18" fill="${t.bg}"/>
<rect width="${WIDTH8}" height="${height}" rx="18" fill="url(#grid)"/>
<rect width="${WIDTH8}" height="${height}" rx="18" fill="url(#glow)"/>
<rect x="0.5" y="0.5" width="${WIDTH8 - 1}" height="${height - 1}" rx="18" fill="none" stroke="${t.border}"/>
${parts.filter(Boolean).join("\n")}
</svg>
`;
}
var maintainer = {
  id: "maintainer",
  name: "Open-source maintainer",
  description: "A project board for your open-source work: impact, repository tiles with licences and freshness, and a weekly pulse.",
  tags: ["dark", "blueprint", "open source", "projects"],
  needsAvatar: true,
  render(profile, config) {
    const assets = variantsFor(config.theme).map((variant) => ({
      path: assetPath("maintainer", variant),
      content: renderSvg10(profile, config, variant)
    }));
    const projects = config.blocks.includes("projects") && profile.topRepos.length > 0 ? `top projects ${profile.topRepos.slice(0, 4).map((r) => r.name).join(", ")}` : void 0;
    const alt = describeProfile(profile, config, projects, { activity: true });
    return { readme: imageReadme(profile, config, "maintainer", WIDTH8, alt), assets };
  }
};

// ../core/src/templates/minimal.ts
var minimal = {
  id: "minimal",
  name: "Minimal",
  description: "Plain Markdown with no images. Loads instantly and works everywhere.",
  tags: ["light", "text", "fast"],
  render(profile, config) {
    const sections = [`# ${escapeMarkdown(profile.name ?? profile.login)}`];
    if (config.text.headline) sections.push(`**${escapeMarkdown(config.text.headline)}**`);
    const bio = config.text.bio ?? profile.bio;
    if (bio) sections.push(escapeMarkdown(bio));
    const website = safeUrl(profile.website);
    const facts = [
      profile.company && `Works at ${escapeMarkdown(profile.company)}`,
      profile.location && `Based in ${escapeMarkdown(profile.location)}`,
      website && `[${escapeMarkdown(website.replace(/^https?:\/\//, "").replace(/\/$/, ""))}](<${website}>)`
    ].filter((fact2) => Boolean(fact2));
    if (facts.length > 0) sections.push(facts.map((fact2) => `- ${fact2}`).join("\n"));
    for (const block of config.blocks) {
      if (block === "stats") {
        sections.push(
          [
            "| Repositories | Stars | Followers | Following |",
            "| ---: | ---: | ---: | ---: |",
            `| ${formatNumber(profile.publicRepos)} | ${formatNumber(profile.totalStars)} | ${formatNumber(profile.followers)} | ${formatNumber(profile.following)} |`
          ].join("\n")
        );
      } else if (block === "languages" && profile.languages.length > 0) {
        const items = profile.languages.map((l) => `${escapeMarkdown(l.name)} ${l.percent}%`);
        sections.push(`**Languages:** ${items.join(" \xB7 ")}`);
      } else if (block === "projects" && profile.topRepos.length > 0) {
        const items = profile.topRepos.slice(0, 4).map((repo) => {
          const description = repo.description ? ` \u2014 ${escapeMarkdown(repo.description)}` : "";
          return `- [${escapeMarkdown(repo.name)}](<${repo.url}>) (\u2605 ${formatNumber(repo.stars)})${description}`;
        });
        sections.push(["**Projects**", "", ...items].join("\n"));
      }
    }
    return { readme: wrapReadme(sections.join("\n\n"), config), assets: [] };
  }
};

// ../core/src/templates/neofetch.ts
var WIDTH9 = 900;
var PAD13 = 28;
var TOP = 70;
var ART_COLS = 56;
var ART_SIZE = 10;
var ART_LINE = 10;
var ART_WIDTH = Math.ceil(ART_COLS * ART_SIZE * 0.62);
var GAP3 = 36;
var INFO_SIZE = 13;
var INFO_LINE = 21;
var LABEL_WIDTH = 11;
var VALUE_MAX = 44;
var CHAR_WIDTH = 7.9;
var ART_STEP = 0.025;
var INFO_STEP = 0.11;
var MONTHS7 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var SWATCHES = {
  dark: ["#f85149", "#e3b341", "#3fb950", "#58a6ff", "#bc8cff", "#39c5cf", "#e6edf3", "#9198a1"],
  light: ["#cf222e", "#9a6700", "#1a7f37", "#0969da", "#8250df", "#1b7c83", "#1f2328", "#59636e"]
};
function joined(createdAt) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;
  return `${MONTHS7[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}
function infoLines(profile, config) {
  const lines = [{ kind: "title" }, { kind: "blank" }];
  const field = (label4, value) => {
    if (value) lines.push({ kind: "field", label: label4, value: truncate(value, VALUE_MAX) });
  };
  const gap = () => {
    if (lines.length > 2 && lines[lines.length - 1]?.kind !== "blank") lines.push({ kind: "blank" });
  };
  field("Name", profile.name);
  field("Role", config.text.headline);
  const bio = config.text.bio ?? profile.bio;
  if (bio) {
    wrap(bio, VALUE_MAX, 3).forEach((part, index) => {
      lines.push({ kind: "field", label: index === 0 ? "About" : "", value: part });
    });
  }
  field("Company", profile.company);
  field("Location", profile.location);
  field("Website", safeUrl(profile.website)?.replace(/^https?:\/\//, "").replace(/\/$/, ""));
  field("Joined", joined(profile.createdAt));
  for (const block of config.blocks) {
    if (block === "stats") {
      gap();
      field("Repos", formatNumber(profile.publicRepos));
      field("Stars", formatNumber(profile.totalStars));
      field("Followers", formatNumber(profile.followers));
      field("Following", formatNumber(profile.following));
    } else if (block === "activity" && profile.contributions) {
      const activity = profile.contributions;
      gap();
      field("Streak", `${plural(activity.currentStreak, "day")} (best ${formatNumber(activity.longestStreak)})`);
      field("Past year", `${formatNumber(activity.total)} contributions`);
    } else if (block === "languages" && profile.languages.length > 0) {
      gap();
      field("Languages", profile.languages.slice(0, 3).map((l) => l.name).join(", "));
    } else if (block === "projects" && profile.topRepos.length > 0) {
      gap();
      profile.topRepos.slice(0, 2).forEach((repo, index) => {
        field(index === 0 ? "Projects" : "", `\u2605 ${formatNumber(repo.stars)}  ${repo.name}`);
      });
    }
  }
  while (lines[lines.length - 1]?.kind === "blank") lines.pop();
  return lines;
}
function renderInfo(line, y, x, p, login) {
  const base = `x="${x}" y="${y}" xml:space="preserve"`;
  switch (line.kind) {
    case "blank":
      return "";
    case "title": {
      const ruleWidth = Math.round((login.length + 7) * CHAR_WIDTH);
      return `<text ${base} fill="${p.accent}" font-weight="700">${xmlEscape(login)}<tspan fill="${p.muted}">@</tspan>github</text><rect x="${x}" y="${y + 8}" width="${ruleWidth}" height="1" fill="${p.border}"/>`;
    }
    case "field":
      return `<text ${base} fill="${p.accent2}" font-weight="700">${xmlEscape(line.label.padEnd(LABEL_WIDTH))}<tspan fill="${p.fg}" font-weight="400">${xmlEscape(line.value)}</tspan></text>`;
  }
}
function renderSvg11(profile, config, variant) {
  const p = palettes[variant];
  const art = profile.avatar ? asciiPortrait(profile.avatar.grid, ART_COLS, variant) : [];
  const info = infoLines(profile, config);
  const infoX = art.length > 0 ? PAD13 + ART_WIDTH + GAP3 : PAD13;
  const infoHeight = info.length * INFO_LINE;
  const swatchY = TOP + infoHeight + 14;
  const contentHeight = Math.max(art.length * ART_LINE, infoHeight + 14 + 16);
  const height = TOP + contentHeight + PAD13;
  const label4 = `${profile.name ?? profile.login} (@${profile.login}) on GitHub`;
  const motion = config.motion;
  const prompt = stagger(
    `<text x="${PAD13}" y="42" xml:space="preserve" fill="${p.fg}"><tspan fill="${p.accent}">${xmlEscape(profile.login)}@github</tspan><tspan fill="${p.muted}">:~$</tspan> neofetch</text>`,
    motion,
    0
  );
  const portrait2 = art.map((row, index) => {
    if (!row) return "";
    const y = TOP + (index + 1) * ART_LINE - 2;
    return stagger(
      `<text class="art" x="${PAD13}" y="${y}" xml:space="preserve" fill="url(#art)">${xmlEscape(row)}</text>`,
      motion,
      0.3 + index * ART_STEP
    );
  }).filter(Boolean).join("\n");
  const details = info.map((line, index) => {
    const y = TOP + (index + 1) * INFO_LINE - 6;
    return stagger(renderInfo(line, y, infoX, p, profile.login), motion, 0.3 + index * INFO_STEP);
  }).filter(Boolean).join("\n");
  const swatches = SWATCHES[variant].map((color, index) => `<rect x="${infoX + index * 28}" y="${swatchY}" width="24" height="14" rx="3" fill="${color}"/>`).join("");
  const swatchRow = stagger(swatches, motion, 0.3 + info.length * INFO_STEP);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH9}" height="${height}" viewBox="0 0 ${WIDTH9} ${height}" role="img" aria-labelledby="t">
<title id="t">${xmlEscape(label4)}</title>
<defs>
<linearGradient id="art" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="${p.accent2}"/><stop offset="1" stop-color="${p.accent}"/></linearGradient>
<linearGradient id="edge" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${p.accent}"/><stop offset="1" stop-color="${p.accent2}"/></linearGradient>
<radialGradient id="glow" cx="0.12" cy="0.1" r="0.9"><stop offset="0" stop-color="${p.accent}" stop-opacity="${variant === "dark" ? 0.16 : 0.1}"/><stop offset="1" stop-color="${p.accent}" stop-opacity="0"/></radialGradient>
</defs>
<style>
text{font-family:${FONT2};font-size:${INFO_SIZE}px}
.art{font-size:${ART_SIZE}px;font-weight:700}
${motionCss(motion)}
</style>
<rect x="0.5" y="0.5" width="${WIDTH9 - 1}" height="${height - 1}" rx="14" fill="${p.bg}" stroke="${p.border}"/>
<rect x="0.5" y="0.5" width="${WIDTH9 - 1}" height="${height - 1}" rx="14" fill="url(#glow)"/>
<rect x="14" y="1" width="${WIDTH9 - 28}" height="2" rx="1" fill="url(#edge)"/>
${prompt}
${portrait2}
${details}
${swatchRow}
</svg>
`;
}
var neofetch = {
  id: "neofetch",
  name: "Neofetch",
  description: "Your profile picture as ASCII art beside a system-info style summary.",
  tags: ["dark", "terminal", "ascii", "portrait", "animated"],
  needsAvatar: true,
  render(profile, config) {
    const assets = variantsFor(config.theme).map((variant) => ({
      path: assetPath("neofetch", variant),
      content: renderSvg11(profile, config, variant)
    }));
    const extra = profile.avatar ? "with an ASCII portrait of the profile picture" : void 0;
    const alt = describeProfile(profile, config, extra, { activity: true });
    return { readme: imageReadme(profile, config, "neofetch", WIDTH9, alt), assets };
  }
};

// ../core/src/templates/paper.ts
var hueFor7 = (profile, fallback) => hueOf(profile.avatar?.grid.tint) ?? fallback;
var text7 = (value, x, y, size, fill, extra = "") => `<text x="${num4(x)}" y="${num4(y)}" font-size="${size}" fill="${fill}" ${extra}>${xmlEscape(value)}</text>`;
function listWords(items) {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
function wantedSvg(profile, config, variant) {
  const dark = variant === "dark";
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const wood = dark ? "#2a1d12" : "#8a6238";
  const plank = dark ? "#1f150d" : "#6e4d2b";
  const paper = dark ? "#cdb78a" : "#ecd9a8";
  const ink = "#2b1b0c";
  const red = "#8c1c13";
  const name = profile.name ?? profile.login;
  const langs = blocks.has("languages") ? profile.languages.slice(0, 3).map((l) => l.name) : [];
  const since = isoDate(profile.createdAt)?.slice(0, 4);
  const height = 610;
  let body = "";
  for (let i = 0; i < 7; i++) body += `<rect x="0" y="${i * 100}" width="900" height="2" fill="${plank}"/>`;
  const px = 170;
  const pw = 560;
  body += `<g transform="rotate(-1.2 450 290)">`;
  body += `<rect x="${px + 6}" y="30" width="${pw}" height="550" fill="#000" fill-opacity="0.35"/><rect x="${px}" y="24" width="${pw}" height="550" fill="${paper}"/>`;
  body += `<rect x="${px + 14}" y="38" width="${pw - 28}" height="522" fill="none" stroke="${ink}" stroke-width="3"/><rect x="${px + 20}" y="44" width="${pw - 40}" height="510" fill="none" stroke="${ink}"/>`;
  body += text7("WANTED", 450, 112, 68, ink, 'class="serif" text-anchor="middle" font-weight="800" letter-spacing="8"');
  body += text7("FOR SHIPPING GOOD CODE", 450, 138, 12, red, 'text-anchor="middle" letter-spacing="5" font-weight="800"');
  body += `<rect x="320" y="156" width="260" height="206" fill="${ink}"/>`;
  body += pictureBox(profile, "#a07a45", paper, 326, 162, 248, 194, 0, "wp");
  body += `<rect x="326" y="162" width="248" height="194" fill="#8a5a1f" fill-opacity="${dark ? 0.35 : 0.28}"/>`;
  body += text7(truncate(name, 22).toUpperCase(), 450, 396, 30, ink, 'class="serif" text-anchor="middle" font-weight="800" letter-spacing="2"');
  body += text7(`@${profile.login}`, 450, 417, 13, ink, 'class="mono" text-anchor="middle"');
  if (langs.length > 0) {
    for (const [i, part] of wrap(`FOR WRITING ${listWords(langs).toUpperCase()}`, 44, 2).entries()) body += text7(part, 450, 446 + i * 17, 14, ink, 'class="serif" text-anchor="middle" font-weight="700"');
  }
  if (blocks.has("stats")) {
    body += text7("REWARD", 450, 494, 11, red, 'text-anchor="middle" letter-spacing="6" font-weight="800"');
    body += text7(`\u2605 ${formatNumber(profile.totalStars)} STARS`, 450, 522, 24, red, 'class="serif" text-anchor="middle" font-weight="800"');
  }
  const foot = [profile.location ? `LAST SEEN IN ${truncate(profile.location, 24).toUpperCase()}` : null, since ? `ON GITHUB SINCE ${since}` : null].filter((v) => Boolean(v));
  if (foot.length > 0) body += text7(foot.join("  \xB7  "), 450, 548, 10.5, ink, 'class="mono" text-anchor="middle"');
  for (const [nx, ny] of [[px + 28, 54], [px + pw - 28, 54], [px + 28, 544], [px + pw - 28, 544]]) body += `<circle cx="${nx}" cy="${ny}" r="6" fill="#3a3a3a"/><circle cx="${nx - 1.5}" cy="${ny - 1.5}" r="2" fill="#bdbdbd"/>`;
  body += `</g>`;
  return svgDoc({ height, title: `${name} on GitHub, as a wanted poster`, bg: wood, radius: 14, css: riseCss(motion), body: rise(body, motion, 0.05) });
}
var wanted = imageTemplate("wanted", "Wanted poster", "A wild-west wanted poster: your photo, your languages as the crime and your stars as the reward.", ["creative", "paper", "fun"], wantedSvg, {
  extra: () => "shown as a wanted poster"
});
function recipeSvg(profile, config, variant) {
  const dark = variant === "dark";
  const hue = hueFor7(profile, 12);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const desk = dark ? "#1c1815" : "#d9cdbb";
  const card2 = dark ? "#2a2420" : "#fffaf0";
  const ink = dark ? "#f1e6d3" : "#3a2c1c";
  const muted = dark ? "#a8967c" : "#8a7458";
  const rule = dark ? "#4a3e33" : "#e5d5b5";
  const red = hslToHex(hue, 0.65, dark ? 0.62 : 0.45);
  const name = profile.name ?? profile.login;
  const years = yearsBetween(profile.createdAt, profile.fetchedAt);
  const langs = blocks.has("languages") ? profile.languages.slice(0, 6) : [];
  const repos = blocks.has("projects") ? profile.topRepos.slice(0, 4) : [];
  let stepsHeight = 0;
  const steps = repos.map((repo) => {
    const desc = repo.description ? wrap(repo.description, 34, 2) : [];
    stepsHeight += 30 + desc.length * 15;
    return { repo, desc };
  });
  const height = Math.max(440, 220 + Math.max(langs.length * 30, stepsHeight) + 50);
  let body = `<g transform="rotate(-0.6 450 ${height / 2})"><rect x="40" y="30" width="820" height="${height - 52}" fill="#000" fill-opacity="0.22"/><rect x="34" y="24" width="820" height="${height - 52}" rx="4" fill="${card2}"/>`;
  body += `<path d="M34 78H854" stroke="${red}" stroke-width="2.5"/>`;
  for (let y2 = 108; y2 < height - 40; y2 += 30) body += `<path d="M34 ${y2}H854" stroke="${rule}"/>`;
  body += `<path d="M84 24V${height - 28}" stroke="${red}" stroke-opacity="0.45"/>`;
  body += text7("FROM THE KITCHEN OF", 110, 48, 10.5, muted, 'letter-spacing="4" font-weight="800"');
  body += text7(truncate(`${name}\u2019s GitHub profile`, 38), 110, 70, 26, ink, 'class="serif" font-style="italic" font-weight="700"');
  const meta = [years !== null ? `Prep time: ${plural(years, "year")} on GitHub` : null, blocks.has("stats") ? `Serves: ${plural(profile.followers, "follower")}` : null].filter((v) => Boolean(v));
  meta.forEach((part, i) => {
    body += text7(part, 110, 98 + i * 0, 12.5, muted, `class="mono" ${i === 0 ? "" : `transform="translate(${i * 250} 0)"`}`);
  });
  body += pictureBox(profile, red, card2, 740, 34, 100, 74, 3, "rc");
  body += `<rect x="740" y="34" width="100" height="74" fill="none" stroke="${ink}" stroke-opacity="0.35"/>`;
  body += text7("INGREDIENTS", 110, 150, 12, red, 'letter-spacing="4" font-weight="800"');
  if (langs.length === 0) body += text7(blocks.has("languages") ? "None listed." : "Switched off.", 110, 186, 14, muted, 'class="serif" font-style="italic"');
  langs.forEach((lang, i) => {
    const y2 = 186 + i * 30;
    body += `<rect x="112" y="${y2 - 12}" width="13" height="13" fill="none" stroke="${ink}" stroke-opacity="0.6"/>`;
    body += text7(`${Math.round(lang.percent)}%`, 140, y2, 15, red, 'class="mono" font-weight="700"');
    body += text7(truncate(lang.name, 16), 190, y2, 17, ink, 'class="serif"');
    body += `<rect x="300" y="${y2 - 7}" width="${num4(lang.percent / 100 * 100)}" height="5" rx="2.5" fill="${langColor(lang.name, variant)}"/>`;
  });
  body += `<path d="M436 120V${height - 50}" stroke="${rule}" stroke-width="1.5"/>`;
  body += text7("DIRECTIONS", 462, 150, 12, red, 'letter-spacing="4" font-weight="800"');
  if (steps.length === 0) body += text7(blocks.has("projects") ? "No steps yet." : "Switched off.", 462, 186, 14, muted, 'class="serif" font-style="italic"');
  let y = 186;
  steps.forEach(({ repo, desc }, i) => {
    body += text7(`${i + 1}.`, 462, y, 17, red, 'class="serif" font-weight="800"');
    body += text7(truncate(repo.name, 22), 486, y, 17, ink, 'class="serif" font-weight="700"');
    body += text7(`\u2605 ${formatNumber(repo.stars)}`, 840, y, 13, muted, 'class="mono" text-anchor="end"');
    desc.forEach((part, j) => {
      body += text7(part, 486, y + 17 + j * 15, 12.5, muted, 'class="serif" font-style="italic"');
    });
    y += 30 + desc.length * 15;
  });
  body += `<circle cx="780" cy="${height - 74}" r="34" fill="none" stroke="#7a4a1d" stroke-opacity="0.18" stroke-width="5"/>`;
  body += `</g>`;
  return svgDoc({ height, title: `${name} on GitHub, as a recipe card`, bg: desk, radius: 14, css: riseCss(motion), body: rise(body, motion, 0.05) });
}
var recipe = imageTemplate("recipe", "Recipe card", "A recipe card: languages as the ingredients and repositories as the steps.", ["creative", "paper", "fun"], recipeSvg, {
  extra: () => "shown as a recipe card with languages as ingredients"
});
function nutritionSvg(profile, config, variant) {
  const dark = variant === "dark";
  const hue = hueFor7(profile, 140);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const bg = dark ? hslToHex(hue, 0.35, 0.12) : hslToHex(hue, 0.55, 0.88);
  const box = hslToHex(hue, 0.6, dark ? 0.3 : 0.5);
  const name = profile.name ?? profile.login;
  const bio = config.text.bio ?? profile.bio;
  const since = isoDate(profile.createdAt)?.slice(0, 4);
  const read = isoDate(profile.fetchedAt);
  const lx = 478;
  const lw = 386;
  const rows = [];
  if (blocks.has("stats")) {
    rows.push(["Stars", formatNumber(profile.totalStars)], ["Followers", formatNumber(profile.followers)], ["Following", formatNumber(profile.following)]);
    if (profile.totalForks !== void 0) rows.push(["Forks", formatNumber(profile.totalForks)]);
  }
  if (blocks.has("activity") && profile.contributions) rows.push(["Contributions this year", formatNumber(profile.contributions.total)], ["Active days", formatNumber(profile.contributions.activeDays)]);
  const ingredients = blocks.has("languages") ? profile.languages.slice(0, 6).map((l) => `${l.name} (${Math.round(l.percent)}%)`) : [];
  const ingredientLines = ingredients.length > 0 ? wrap(`INGREDIENTS: ${ingredients.join(", ")}.`, 44, 4) : [];
  const height = 112 + 40 + 86 + rows.length * 28 + (ingredientLines.length > 0 ? 40 + ingredientLines.length * 17 : 0) + 56;
  let body = "";
  body += `<rect x="36" y="36" width="410" height="${height - 72}" rx="10" fill="${box}"/>`;
  body += text7("GITHUB PROFILE", 62, 78, 12, "#ffffff", 'letter-spacing="6" font-weight="800" fill-opacity="0.85"');
  const nameLines = wrap(truncate(name, 40), 14, 3);
  const nameSize = Math.min(50, Math.floor(360 / (Math.max(...nameLines.map((l) => l.length), 1) * 0.66)));
  nameLines.forEach((part, i) => {
    body += text7(part.toUpperCase(), 62, 150 + i * (nameSize + 8), nameSize, "#ffffff", 'font-weight="800"');
  });
  body += text7(`@${profile.login}`, 62, height - 112, 15, "#ffffff", 'class="mono" fill-opacity="0.9"');
  if (bio) wrap(bio, 40, 3).forEach((part, i) => {
    body += text7(part, 62, height - 84 + i * 18, 13.5, "#ffffff", 'font-style="italic" fill-opacity="0.92"');
  });
  if (since) body += `<circle cx="392" cy="${height - 110}" r="38" fill="#ffd23f"/>` + text7("SINCE", 392, height - 114, 10, "#3a2a00", 'text-anchor="middle" letter-spacing="2" font-weight="800"') + text7(since, 392, height - 96, 18, "#3a2a00", 'text-anchor="middle" font-weight="800"');
  let y = 36;
  body += `<rect x="${lx}" y="36" width="${lw}" height="${height - 72}" fill="#ffffff" stroke="#000" stroke-width="3"/>`;
  const ink = "#000000";
  y += 44;
  body += text7("Nutrition Facts", lx + 14, y, 36, ink, 'font-weight="900"');
  y += 10;
  body += `<path d="M${lx + 8} ${y}H${lx + lw - 8}" stroke="${ink}" stroke-width="1.5"/>`;
  y += 22;
  body += text7("Serving size", lx + 14, y, 15, ink, 'font-weight="700"') + text7("1 profile", lx + lw - 14, y, 15, ink, 'text-anchor="end" font-weight="700"');
  y += 10;
  body += `<path d="M${lx + 8} ${y}H${lx + lw - 8}" stroke="${ink}" stroke-width="9"/>`;
  y += 22;
  body += text7("Amount per profile", lx + 14, y, 12, ink, 'font-weight="700"');
  y += 14;
  body += `<path d="M${lx + 8} ${y}H${lx + lw - 8}" stroke="${ink}" stroke-width="3"/>`;
  y += 30;
  body += text7("Repositories", lx + 14, y, 22, ink, 'font-weight="900"') + text7(formatNumber(profile.publicRepos), lx + lw - 14, y, 26, ink, 'text-anchor="end" font-weight="900"');
  y += 10;
  body += `<path d="M${lx + 8} ${y}H${lx + lw - 8}" stroke="${ink}" stroke-width="1"/>`;
  rows.forEach(([label4, value]) => {
    y += 21;
    body += text7(label4, lx + 14, y, 15, ink, 'font-weight="700"') + text7(value, lx + lw - 14, y, 15, ink, 'text-anchor="end" font-weight="700"');
    y += 7;
    body += `<path d="M${lx + 8} ${y}H${lx + lw - 8}" stroke="${ink}" stroke-width="1"/>`;
  });
  y += 4;
  body += `<path d="M${lx + 8} ${y}H${lx + lw - 8}" stroke="${ink}" stroke-width="9"/>`;
  ingredientLines.forEach((part, i) => {
    body += text7(part, lx + 14, y + 26 + i * 17, 12.5, ink, 'font-weight="600"');
  });
  if (read) body += text7(`* Public data from GitHub, read ${read}.`, lx + 14, height - 50, 10.5, "#444", 'class="mono"');
  return svgDoc({ height, title: `${name} on GitHub, as a nutrition label`, bg, radius: 14, css: riseCss(motion), body: rise(body, motion, 0.05) });
}
var nutrition = imageTemplate("nutrition", "Nutrition label", "A nutrition facts label for your profile, with your languages as the ingredients.", ["creative", "paper", "stats"], nutritionSvg, {
  activity: false,
  extra: () => "shown as a nutrition facts label"
});
function postcardSvg(profile, config, variant) {
  const dark = variant === "dark";
  const hue = hueFor7(profile, 205);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const table = dark ? "#1a2128" : "#cfd8de";
  const card2 = dark ? "#e9e3d4" : "#fbf7ec";
  const ink = "#2c2a26";
  const blue = hslToHex(hue, 0.6, 0.42);
  const red = "#c4443a";
  const name = profile.name ?? profile.login;
  const bio = config.text.bio ?? profile.bio;
  const read = isoDate(profile.fetchedAt);
  const place = profile.location ? truncate(profile.location, 22) : "GitHub";
  const height = 500;
  let body = `<g transform="rotate(1 450 250)"><rect x="60" y="40" width="780" height="420" fill="#000" fill-opacity="0.3"/><rect x="54" y="34" width="780" height="420" fill="${card2}"/>`;
  for (let i = 0; i < 39; i++) body += `<path d="M${54 + i * 20} 34h10l-8 7h-10z" fill="${i % 2 ? blue : red}"/><path d="M${54 + i * 20} 454h10l-8 -7h-10z" fill="${i % 2 ? red : blue}"/>`;
  body += `<path d="M444 62V426" stroke="${ink}" stroke-opacity="0.35" stroke-width="2"/>`;
  body += text7(`Greetings from ${place}!`, 76, 100, 30, blue, 'class="serif" font-style="italic" font-weight="700"');
  const message = bio ? wrap(bio, 40, 6) : [];
  for (let i = 0; i < 8; i++) body += `<path d="M76 ${150 + i * 30}H424" stroke="${ink}" stroke-opacity="0.22"/>`;
  message.forEach((part, i) => {
    body += text7(part, 80, 144 + i * 30, 17, ink, 'class="serif" font-style="italic"');
  });
  if (message.length === 0) body += text7("(no message written yet)", 80, 144, 15, "#8a8576", 'class="serif" font-style="italic"');
  body += text7(`\u2014 ${truncate(name, 22)}`, 424, 150 + Math.max(1, message.length) * 30 + 8, 18, ink, 'class="serif" text-anchor="end" font-style="italic" font-weight="700"');
  if (blocks.has("stats")) body += text7(`${formatNumber(profile.publicRepos)} repositories \xB7 ${formatNumber(profile.totalStars)} stars \xB7 ${formatNumber(profile.followers)} followers`, 76, 424, 11.5, "#6e6a5e", 'class="mono"');
  body += `<rect x="722" y="58" width="98" height="116" fill="${card2}" stroke="${red}" stroke-width="2" stroke-dasharray="4 3"/>`;
  body += pictureBox(profile, blue, card2, 732, 68, 78, 82, 2, "pc");
  body += text7("GITHUB", 771, 166, 10, red, 'text-anchor="middle" letter-spacing="3" font-weight="800"');
  if (read) {
    body += `<g transform="rotate(-10 662 120)"><circle cx="662" cy="120" r="46" fill="none" stroke="${ink}" stroke-opacity="0.55" stroke-width="2.5"/><circle cx="662" cy="120" r="38" fill="none" stroke="${ink}" stroke-opacity="0.4"/>`;
    body += text7("POSTED", 662, 112, 10, ink, 'text-anchor="middle" letter-spacing="3" font-weight="800" fill-opacity="0.65"') + text7(read, 662, 130, 11.5, ink, 'class="mono" text-anchor="middle" font-weight="700" fill-opacity="0.65"') + `</g>`;
  }
  const address = [truncate(name, 24), `@${truncate(profile.login, 24)}`, `github.com/${truncate(profile.login, 18)}`, profile.location ? truncate(profile.location, 24) : null].filter((v) => Boolean(v));
  address.forEach((part, i) => {
    body += `<path d="M474 ${238 + i * 38}H816" stroke="${ink}" stroke-opacity="0.4"/>`;
    body += text7(part, 480, 232 + i * 38, 17, ink, `class="serif" ${i === 0 ? 'font-weight="700"' : 'font-style="italic"'}`);
  });
  body += `</g>`;
  return svgDoc({ height, title: `${name} on GitHub, as a postcard`, bg: table, radius: 14, css: riseCss(motion), body: rise(body, motion, 0.05) });
}
var postcard = imageTemplate("postcard", "Postcard", "A postcard: greetings from your location, your bio as the message and your photo as the stamp.", ["creative", "paper", "fun"], postcardSvg, {
  extra: () => "shown as a postcard"
});
var CUTOUT_FONTS = ["Georgia, serif", "'Courier New', monospace", "'Segoe UI', sans-serif", "Impact, Haettenschweiler, sans-serif", "'Times New Roman', serif"];
function cutout(seed, dark) {
  const h = hashOf(seed);
  const palette = dark ? [["#f3e9c9", "#1b1b1b"], ["#1b1b1b", "#f3e9c9"], ["#d94f4f", "#fff6e0"], ["#3f7fd9", "#fff6e0"], ["#f0c14b", "#1b1b1b"], ["#5fb98a", "#10241a"]] : [["#fffdf3", "#1b1b1b"], ["#1b1b1b", "#fffdf3"], ["#e2574c", "#fffdf3"], ["#2f6fd0", "#fffdf3"], ["#f6c945", "#1b1b1b"], ["#58b887", "#0e2218"]];
  const [bg, fg] = palette[h % palette.length];
  return { font: CUTOUT_FONTS[(h >>> 4) % CUTOUT_FONTS.length], bg, fg, rot: (h >>> 8) % 13 - 6, dy: (h >>> 12) % 9 - 4, weight: (h >>> 16) % 2 ? 800 : 500 };
}
function ransomSvg(profile, config, variant) {
  const dark = variant === "dark";
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const table = dark ? "#16181c" : "#c9ccd2";
  const sheet2 = dark ? "#d8d2c0" : "#f4f1e8";
  const name = (profile.name ?? profile.login).replace(/\s+/g, " ").slice(0, 14);
  let x = 90;
  let letters = "";
  [...name].forEach((ch, i) => {
    if (ch === " ") {
      x += 30;
      return;
    }
    const c2 = cutout(`${profile.login}:${i}:${ch}`, dark);
    const w = 50 + hashOf(`${profile.login}:w:${i}`) % 14;
    const h = 70 + hashOf(`${profile.login}:h:${i}`) % 14;
    letters += `<g class="cut" style="animation-delay:${(0.1 + i * 0.06).toFixed(2)}s" transform="rotate(${c2.rot} ${x + w / 2} ${130 + h / 2})"><rect x="${x}" y="${130 + c2.dy}" width="${w}" height="${h}" fill="${c2.bg}" stroke="#000" stroke-opacity="0.25"/>`;
    letters += `<text x="${x + w / 2}" y="${130 + c2.dy + h * 0.74}" text-anchor="middle" font-size="${Math.round(h * 0.74)}" font-family="${c2.font}" font-weight="${c2.weight}" fill="${c2.fg}">${xmlEscape(ch.toUpperCase())}</text></g>`;
    x += w + 6;
  });
  const fit = Math.min(1, 720 / Math.max(1, x - 90));
  if (fit < 1) letters = `<g transform="translate(90 130) scale(${fit.toFixed(3)}) translate(-90 -130)">${letters}</g>`;
  const scraps = [];
  if (blocks.has("stats")) scraps.push(`${formatNumber(profile.totalStars)} STARS`, `${formatNumber(profile.followers)} FOLLOWERS`, `${formatNumber(profile.publicRepos)} REPOS`);
  if (blocks.has("languages")) for (const l of profile.languages.slice(0, 3)) scraps.push(`${l.name.toUpperCase()} ${Math.round(l.percent)}%`);
  let sx = 90;
  let sy = 262;
  let scrapMarkup = "";
  scraps.forEach((label4, i) => {
    const c2 = cutout(`${profile.login}:scrap:${i}`, dark);
    const w = label4.length * 17 + 26;
    if (sx + w > 810) {
      sx = 90;
      sy += 76;
    }
    scrapMarkup += `<g class="cut" style="animation-delay:${(0.6 + i * 0.07).toFixed(2)}s" transform="rotate(${c2.rot} ${sx + w / 2} ${sy + 25})"><rect x="${sx}" y="${sy + c2.dy}" width="${w}" height="50" fill="${c2.bg}" stroke="#000" stroke-opacity="0.25"/>`;
    scrapMarkup += `<text x="${sx + w / 2}" y="${sy + c2.dy + 34}" text-anchor="middle" font-size="26" font-family="${c2.font}" font-weight="${c2.weight}" fill="${c2.fg}">${xmlEscape(label4)}</text></g>`;
    sx += w + 14;
  });
  const bottom = scraps.length > 0 ? sy + 76 : 262;
  const height = bottom + 120;
  let body = `<g transform="rotate(-0.8 450 250)"><rect x="60" y="34" width="780" height="${height - 70}" fill="${sheet2}"/>`;
  body += letters + scrapMarkup;
  body += `<rect x="90" y="${bottom + 4}" width="${Math.min(700, profile.login.length * 15 + 150)}" height="32" fill="#1b1b1b"/>`;
  body += text7(`NOTE FROM @${profile.login.toUpperCase()}`, 104, bottom + 26, 15, "#f3e9c9", 'class="mono" letter-spacing="3" font-weight="700"');
  body += `</g>`;
  const css = riseCss(motion) + (motion ? `.cut{animation:stick .4s ease-out both}@keyframes stick{from{opacity:0;transform:scale(1.25)}}@media (prefers-reduced-motion:reduce){.cut{animation:none}}` : "");
  return svgDoc({ height, title: `${profile.name ?? profile.login} on GitHub, as a ransom note`, bg: table, radius: 14, css, body });
}
var ransom = imageTemplate("ransom", "Ransom note", "Your name cut from magazines, with your numbers pasted on as scraps.", ["creative", "paper", "fun"], ransomSvg, {
  extra: () => "shown as a ransom note with letters cut from magazines"
});
var paperTemplates = [wanted, recipe, nutrition, postcard, ransom];

// ../core/src/templates/scrapbook.ts
var hueFor8 = (profile, fallback) => hueOf(profile.avatar?.grid.tint) ?? fallback;
var text8 = (value, x, y, size, fill, extra = "") => `<text x="${num4(x)}" y="${num4(y)}" font-size="${size}" fill="${fill}" ${extra}>${xmlEscape(value)}</text>`;
function tiltOf(seed, spread) {
  return (hashOf(seed) % (spread * 2 + 1) - spread) * 0.9;
}
function cardSvg(profile, config, variant) {
  const dark = variant === "dark";
  const hue = hueFor8(profile, 265);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const desk = dark ? "#0d0b14" : "#e4e0ee";
  const paper = dark ? "#1a1526" : "#fbf8ef";
  const ink = dark ? "#f3eefc" : "#241d33";
  const muted = dark ? "#a79dc0" : "#6f6584";
  const gold = hslToHex(42, 0.85, dark ? 0.6 : 0.5);
  const accent2 = hslToHex(hue, 0.7, dark ? 0.65 : 0.45);
  const name = profile.name ?? profile.login;
  const bio = config.text.bio ?? profile.bio;
  const since = isoDate(profile.createdAt)?.slice(0, 4);
  const main2 = blocks.has("languages") ? profile.languages[0] : void 0;
  const attacks = blocks.has("projects") ? profile.topRepos.slice(0, 3) : [];
  const cx = 450;
  const cw = 360;
  const x = cx - cw / 2;
  const y = 28;
  const ch = 520;
  const height = ch + 56;
  const defs = `<linearGradient id="rb" x1="0" x2="1" y1="0" y2="0.3">` + ["#ff5f8a", "#ffd35f", "#7dffb0", "#5fd2ff", "#b08dff", "#ff5f8a"].map((c2, i) => `<stop offset="${i / 5}" stop-color="${c2}"/>`).join("") + `</linearGradient><linearGradient id="gold" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="${gold}"/><stop offset="0.5" stop-color="${dark ? "#fff1b8" : "#fff4c2"}"/><stop offset="1" stop-color="${gold}"/></linearGradient><clipPath id="face"><rect x="${x + 8}" y="${y + 8}" width="${cw - 16}" height="${ch - 16}" rx="16"/></clipPath><pattern id="back" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M0 7L7 0L14 7L7 14Z" fill="none" stroke="${accent2}" stroke-opacity="0.5"/></pattern>`;
  let body = "";
  for (const [dx, rot] of [[-196, -9], [196, 8]]) {
    body += `<g transform="rotate(${rot} ${cx + dx} ${y + ch / 2})"><rect x="${x + dx + 30}" y="${y + 40}" width="${cw - 60}" height="${ch - 80}" rx="18" fill="${paper}" stroke="url(#gold)" stroke-width="4"/>`;
    body += `<rect x="${x + dx + 44}" y="${y + 54}" width="${cw - 88}" height="${ch - 108}" rx="10" fill="url(#back)"/>`;
    body += text8(`@${truncate(profile.login, 16)}`, cx + dx, y + ch / 2 + 4, 15, ink, 'class="mono" text-anchor="middle" font-weight="700"') + `</g>`;
  }
  body += `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="22" fill="url(#gold)"/>`;
  body += `<rect x="${x + 8}" y="${y + 8}" width="${cw - 16}" height="${ch - 16}" rx="16" fill="${paper}"/>`;
  body += text8(truncate(name, 18), x + 24, y + 44, 21, ink, 'font-weight="800"');
  if (blocks.has("stats")) body += text8(`HP ${formatNumber(profile.followers)}`, x + cw - 24, y + 44, 17, "#e0425a", 'class="mono" text-anchor="end" font-weight="800"');
  body += `<rect x="${x + 22}" y="${y + 60}" width="${cw - 44}" height="194" rx="6" fill="${accent2}" fill-opacity="0.25" stroke="${gold}" stroke-width="3"/>`;
  body += pictureBox(profile, accent2, paper, x + 26, y + 64, cw - 52, 186, 4, "tc");
  const line = [main2 ? `${main2.name} type` : null, since ? `since ${since}` : null].filter((v) => Boolean(v)).join("  \xB7  ");
  if (line) body += text8(truncate(line, 40), x + 24, y + 276, 11.5, muted, 'class="mono" font-style="italic"');
  if (attacks.length === 0) body += text8(blocks.has("projects") ? "No attacks learned yet." : "Attacks are switched off.", x + 24, y + 316, 13, muted, 'font-style="italic"');
  attacks.forEach((repo, i) => {
    const ay = y + 306 + i * 52;
    body += `<path d="M${x + 24} ${ay - 12}H${x + cw - 24}" stroke="${muted}" stroke-opacity="0.35"/>`;
    body += `<circle cx="${x + 38}" cy="${ay + 10}" r="9" fill="${repo.language ? langColor(repo.language, variant) : muted}"/>`;
    body += text8(truncate(repo.name, 17), x + 58, ay + 14, 15.5, ink, 'font-weight="800"');
    if (repo.description) body += text8(truncate(repo.description, 36), x + 58, ay + 30, 10.5, muted);
    body += text8(formatNumber(repo.stars), x + cw - 26, ay + 16, 22, ink, 'text-anchor="end" font-weight="800"');
  });
  const flavour = bio ? wrap(bio, 46, 2) : [];
  if (flavour.length > 0) {
    body += `<rect x="${x + 22}" y="${y + ch - 78}" width="${cw - 44}" height="42" rx="6" fill="${accent2}" fill-opacity="0.12"/>`;
    flavour.forEach((part, i) => {
      body += text8(part, x + 32, y + ch - 58 + i * 15, 11, ink, 'class="serif" font-style="italic"');
    });
  }
  body += text8(`Illus. @${truncate(profile.login, 20)}`, x + 24, y + ch - 20, 10, muted, 'class="mono"');
  if (profile.location) body += text8(truncate(profile.location, 22), x + cw - 24, y + ch - 20, 10, muted, 'class="mono" text-anchor="end"');
  body += `<g clip-path="url(#face)"><rect class="holo" x="${cx - 220}" y="${y - 20}" width="150" height="${ch + 40}" fill="url(#rb)" fill-opacity="${dark ? 0.2 : 0.22}" transform="skewX(-18)"/></g>`;
  const css = riseCss(motion) + (motion ? `.holo{animation:foil 4.5s ease-in-out infinite alternate}@keyframes foil{from{transform:translateX(0) skewX(-18deg)}to{transform:translateX(420px) skewX(-18deg)}}@media (prefers-reduced-motion:reduce){.holo{animation:none}}` : "");
  return svgDoc({ height, title: `${name} on GitHub, as a trading card`, bg: desk, radius: 14, css, defs, body: rise(body, motion, 0.05) });
}
var card = imageTemplate(
  "card",
  "Trading card",
  "A holographic trading card: HP from followers, an attack for each repository, damage from stars.",
  ["creative", "scrapbook", "fun"],
  cardSvg,
  { extra: () => "shown as a holographic trading card with an attack for each repository" }
);
function polaroidSvg(profile, config, variant) {
  const dark = variant === "dark";
  const hue = hueFor8(profile, 30);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const cork = dark ? "#3b2d20" : "#c89a6a";
  const frame = dark ? "#ece8df" : "#fffdf8";
  const ink = "#3a2f26";
  const name = profile.name ?? profile.login;
  const bio = config.text.bio ?? profile.bio;
  const repos = blocks.has("projects") ? profile.topRepos.slice(0, 3) : [];
  const langs = blocks.has("languages") ? profile.languages.slice(0, 5) : [];
  const height = 520;
  let body = "";
  for (let i = 0; i < 150; i++) {
    const h = hashOf(`${profile.login}:cork:${i}`);
    body += `<circle cx="${h % 900}" cy="${(h >>> 10) % height}" r="${1 + h % 3 * 0.7}" fill="${dark ? "#5a4531" : "#a97b4d"}" fill-opacity="0.45"/>`;
  }
  const pin = (px, py, color) => `<circle cx="${px}" cy="${py}" r="7" fill="${color}"/><circle cx="${px - 2}" cy="${py - 2}" r="2.4" fill="#fff" fill-opacity="0.6"/>`;
  const polaroid = (px, py, rot, photo, caption, sub2, pinColor, delay) => {
    let out = `<g class="pol" transform="rotate(${num4(rot)} ${px + 100} ${py + 120})" style="animation-delay:${delay.toFixed(2)}s">`;
    out += `<rect x="${px + 4}" y="${py + 6}" width="200" height="246" fill="#000" fill-opacity="0.28"/>`;
    out += `<rect x="${px}" y="${py}" width="200" height="246" fill="${frame}"/>${photo}`;
    out += text8(truncate(caption, 18), px + 100, py + 214, 17, ink, 'class="serif" text-anchor="middle" font-style="italic" font-weight="700"');
    if (sub2) out += text8(sub2, px + 100, py + 233, 11.5, "#7d6f60", 'class="mono" text-anchor="middle"');
    out += pin(px + 100, py + 10, pinColor) + `</g>`;
    return out;
  };
  const xs = [44, 262, 480, 698];
  body += polaroid(xs[0], 40, tiltOf(`${profile.login}:0`, 4), pictureBox(profile, hslToHex(hue, 0.5, 0.5), frame, xs[0] + 12, 56, 176, 148, 2, "pw"), name, `@${profile.login}`, "#d94141", 0.1);
  repos.forEach((repo, i) => {
    const px = xs[i + 1];
    const color = repo.language ? langColor(repo.language, variant) : hslToHex(hue, 0.3, 0.5);
    const art = `<rect x="${px + 12}" y="56" width="176" height="148" fill="${color}" fill-opacity="0.85"/><rect x="${px + 12}" y="56" width="176" height="148" fill="#000" fill-opacity="0.12"/>` + text8(symbolOf(repo.name), px + 100, 150, 64, "#ffffff", 'text-anchor="middle" font-weight="800" fill-opacity="0.92"') + text8(`\u2605 ${formatNumber(repo.stars)}`, px + 178, 196, 13, "#ffffff", 'class="mono" text-anchor="end" font-weight="700"');
    body += polaroid(px, 40 + (i % 2 === 0 ? 14 : -4), tiltOf(`${profile.login}:${i + 1}`, 4), art, repo.name, repo.language, ["#3f7fd9", "#3aa86b", "#e0a52e"][i], 0.2 + i * 0.12);
  });
  const noteY = 322;
  body += `<g class="pol" transform="rotate(${num4(tiltOf(`${profile.login}:note`, 3))} 190 ${noteY + 80})" style="animation-delay:0.6s">`;
  body += `<rect x="64" y="${noteY + 5}" width="270" height="158" fill="#000" fill-opacity="0.25"/><rect x="60" y="${noteY}" width="270" height="158" fill="#ffe27a"/>`;
  body += text8("ABOUT", 80, noteY + 30, 11, "#8a6b00", 'letter-spacing="4" font-weight="800"');
  const lines = bio ? wrap(bio, 29, 4) : ["(nothing written here yet)"];
  lines.forEach((part, i) => {
    body += text8(part, 80, noteY + 56 + i * 21, 16, "#4a3b00", `class="serif" font-style="italic"${bio ? "" : ' fill-opacity="0.6"'}`);
  });
  if (profile.location) body += text8(truncate(profile.location, 30), 80, noteY + 148, 12.5, "#8a6b00", 'class="mono"');
  body += pin(195, noteY + 8, "#d94141") + `</g>`;
  if (blocks.has("stats")) {
    body += `<g class="pol" transform="rotate(${num4(tiltOf(`${profile.login}:index`, 3))} 520 ${noteY + 70})" style="animation-delay:0.7s"><rect x="364" y="${noteY + 4}" width="300" height="130" fill="#000" fill-opacity="0.22"/><rect x="360" y="${noteY}" width="300" height="130" fill="#fffdf6"/>`;
    for (let r = 0; r < 4; r++) body += `<path d="M360 ${noteY + 40 + r * 22}H660" stroke="#9db8e8" stroke-opacity="0.7"/>`;
    body += `<path d="M386 ${noteY}V${noteY + 130}" stroke="#e9a1a1"/>`;
    const facts = [["followers", formatNumber(profile.followers)], ["stars", formatNumber(profile.totalStars)], ["repositories", formatNumber(profile.publicRepos)]];
    facts.forEach(([label4, value], i) => {
      body += text8(value, 400, noteY + 36 + i * 28, 20, "#27408b", 'class="serif" font-weight="700"') + text8(label4, 500, noteY + 36 + i * 28, 14, "#7d6f60", 'class="serif" font-style="italic"');
    });
    body += `</g>`;
  }
  langs.forEach((lang, i) => {
    const ty = noteY + 6 + i * 30;
    const color = langColor(lang.name, variant);
    body += `<g transform="rotate(${num4(tiltOf(`${profile.login}:tape:${i}`, 3))} 760 ${ty + 12})"><rect x="690" y="${ty}" width="170" height="24" fill="${color}" fill-opacity="0.92"/>`;
    body += text8(`${truncate(lang.name, 12)}  ${Math.round(lang.percent)}%`, 775, ty + 17, 12.5, "#ffffff", 'text-anchor="middle" font-weight="800"') + `</g>`;
  });
  const css = riseCss(motion) + (motion ? `.pol{animation:drop .55s ease-out both}@keyframes drop{from{opacity:0;transform:translateY(-16px)}}@media (prefers-reduced-motion:reduce){.pol{animation:none}}` : "");
  return svgDoc({ height, title: `${name} on GitHub, as a wall of polaroids`, bg: cork, radius: 14, css, body });
}
var polaroids = imageTemplate(
  "polaroids",
  "Polaroid wall",
  "A corkboard of pinned polaroids: you, your best repositories, a note and strips of tape for languages.",
  ["creative", "scrapbook", "fun"],
  polaroidSvg,
  { extra: () => "shown as a corkboard of polaroids, with a note and an index card" }
);
function comicSvg(profile, config, variant) {
  const dark = variant === "dark";
  const hue = hueFor8(profile, 12);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const sheet2 = dark ? "#15151b" : "#f4efe3";
  const panel2 = dark ? "#22222c" : "#fffdf6";
  const ink = dark ? "#f2f2f6" : "#16161d";
  const line = dark ? "#f2f2f6" : "#16161d";
  const dot = dark ? "#ffffff" : "#000000";
  const accent2 = hslToHex(hue, 0.85, dark ? 0.6 : 0.5);
  const yellow = "#ffd23f";
  const name = profile.name ?? profile.login;
  const bio = config.text.bio ?? profile.bio;
  const repos = blocks.has("projects") ? profile.topRepos.slice(0, 3) : [];
  const langs = blocks.has("languages") ? profile.languages.slice(0, 4) : [];
  const g = 14;
  const top = 24;
  const h1 = 232;
  const h2 = 232;
  const height = top + h1 + g + h2 + 24;
  const wA = 548;
  const wB = 828 - wA - g;
  const defs = `<pattern id="ht" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="4.5" cy="4.5" r="1.7" fill="${dot}" fill-opacity="${dark ? 0.16 : 0.18}"/></pattern>`;
  const frame = (px, py, w, h, fill) => `<rect x="${px}" y="${py}" width="${w}" height="${h}" fill="${fill}"/><rect x="${px}" y="${py}" width="${w}" height="${h}" fill="url(#ht)"/><rect x="${px}" y="${py}" width="${w}" height="${h}" fill="none" stroke="${line}" stroke-width="4"/>`;
  const caption = (px, py, value) => {
    const w = Math.min(280, value.length * 8.4 + 20);
    return `<rect x="${px}" y="${py}" width="${w}" height="24" fill="${yellow}" stroke="${line}" stroke-width="2.5"/>` + text8(value, px + 10, py + 17, 12.5, "#16161d", 'font-weight="800" letter-spacing="1"');
  };
  let body = "";
  const p1 = { x: 36, y: top };
  body += frame(p1.x, p1.y, wA, h1, panel2);
  body += caption(p1.x + 10, p1.y + 10, `MEET ${truncate(name, 22).toUpperCase()}`);
  body += pictureBox(profile, accent2, panel2, p1.x + 24, p1.y + 52, 150, 150, 6, "cm");
  body += `<rect x="${p1.x + 24}" y="${p1.y + 52}" width="150" height="150" fill="url(#ht)"/><rect x="${p1.x + 24}" y="${p1.y + 52}" width="150" height="150" fill="none" stroke="${line}" stroke-width="3.5"/>`;
  if (bio) {
    const lines = wrap(bio, 30, 4);
    const bh = lines.length * 22 + 26;
    const bx = p1.x + 204;
    const by = p1.y + 60;
    body += `<path d="M${bx} ${by}h300a14 14 0 0 1 14 14v${bh - 14}a14 14 0 0 1 -14 14h-250l-26 22l6 -22h-30a14 14 0 0 1 -14 -14v${-(bh - 14)}a14 14 0 0 1 14 -14z" fill="#ffffff" stroke="${line}" stroke-width="3"/>`;
    lines.forEach((part, i) => {
      body += text8(part, bx + 18, by + 30 + i * 22, 16, "#16161d", 'font-weight="700"');
    });
  }
  body += text8(`@${profile.login}`, p1.x + wA - 16, p1.y + h1 - 14, 13, ink, 'class="mono" text-anchor="end" font-weight="700"');
  const p2 = { x: 36 + wA + g, y: top };
  body += frame(p2.x, p2.y, wB, h1, accent2);
  if (blocks.has("stats")) {
    const cx = p2.x + wB / 2;
    const cy = p2.y + h1 / 2 + 4;
    let star = "";
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * Math.PI * 2;
      const r = i % 2 === 0 ? 100 : 66;
      star += `${i === 0 ? "M" : "L"}${num4(cx + Math.cos(a) * r * 1.05)} ${num4(cy + Math.sin(a) * r * 0.9)}`;
    }
    body += `<path d="${star}Z" fill="${yellow}" stroke="${line}" stroke-width="3.5"/>`;
    body += text8(formatNumber(profile.totalStars), cx, cy + 8, 40, "#16161d", 'text-anchor="middle" font-weight="800"');
    body += text8("STARS!", cx, cy + 32, 17, "#16161d", 'text-anchor="middle" font-weight="800" letter-spacing="3"');
    body += text8(`${formatNumber(profile.followers)} followers`, cx, p2.y + h1 - 14, 13, "#ffffff", 'text-anchor="middle" font-weight="800"');
  } else {
    body += text8("The numbers are switched off.", p2.x + 20, p2.y + 120, 14, "#ffffff", 'font-style="italic" font-weight="700"');
  }
  const p3 = { x: 36, y: top + h1 + g };
  body += frame(p3.x, p3.y, wB, h2, panel2);
  body += caption(p3.x + 10, p3.y + 10, "THE TOOLS");
  if (langs.length === 0) body += text8(blocks.has("languages") ? "No tools yet." : "Switched off.", p3.x + 20, p3.y + 80, 14, ink, 'font-style="italic"');
  langs.forEach((lang, i) => {
    const by = p3.y + 48 + i * 44;
    const color = langColor(lang.name, variant);
    body += `<rect x="${p3.x + 16}" y="${by}" width="${wB - 32}" height="34" rx="17" fill="${color}" stroke="${line}" stroke-width="3"/>`;
    body += text8(truncate(lang.name, 12), p3.x + 36, by + 23, 15, "#ffffff", 'font-weight="800"');
    body += text8(`${Math.round(lang.percent)}%`, p3.x + wB - 36, by + 23, 15, "#ffffff", 'text-anchor="end" font-weight="800"');
  });
  const p4 = { x: 36 + wB + g, y: top + h1 + g };
  body += frame(p4.x, p4.y, wA, h2, panel2);
  body += caption(p4.x + 10, p4.y + 10, "MEANWHILE, IN THE REPOSITORIES...");
  if (repos.length === 0) body += text8(blocks.has("projects") ? "Nothing to report." : "Switched off.", p4.x + 20, p4.y + 90, 14, ink, 'font-style="italic"');
  repos.forEach((repo, i) => {
    const ry = p4.y + 48 + i * 58;
    body += `<rect x="${p4.x + 16}" y="${ry}" width="${wA - 32}" height="48" fill="#ffffff" stroke="${line}" stroke-width="2.5"/>`;
    body += text8(truncate(repo.name, 22), p4.x + 28, ry + 21, 16, "#16161d", 'font-weight="800"');
    if (repo.description) body += text8(truncate(repo.description, 52), p4.x + 28, ry + 38, 11.5, "#4a4a55");
    body += text8(`\u2605 ${formatNumber(repo.stars)}`, p4.x + wA - 28, ry + 21, 15, "#16161d", 'class="mono" text-anchor="end" font-weight="800"');
  });
  const css = riseCss(motion);
  return svgDoc({ height, title: `${name} on GitHub, as a comic strip`, bg: sheet2, radius: 14, css, defs, body: rise(body, motion, 0.05) });
}
var comic = imageTemplate(
  "comic",
  "Comic strip",
  "Four halftone panels: meet you, your stars in a burst, your tools and your repositories.",
  ["creative", "scrapbook", "fun"],
  comicSvg,
  { extra: () => "shown as a four-panel comic strip" }
);
var scrapbookTemplates = [card, polaroids, comic];

// ../core/src/templates/signals.ts
var hueFor9 = (profile, fallback) => hueOf(profile.avatar?.grid.tint) ?? fallback;
var text9 = (value, x, y, size, fill, extra = "") => `<text x="${num4(x)}" y="${num4(y)}" font-size="${size}" fill="${fill}" ${extra}>${xmlEscape(value)}</text>`;
var MONTHS8 = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
var waiting = (blocks) => blocks.has("activity") ? "This appears after the first automatic update, once the contribution calendar is available." : "The activity section is switched off.";
function daysOf(profile, config) {
  return config.blocks.includes("activity") && profile.contributions ? profile.contributions.days : [];
}
function weekStarts(days) {
  const starts = [];
  days.forEach((day, index) => {
    if (index === 0 || (/* @__PURE__ */ new Date(`${day.date}T00:00:00Z`)).getUTCDay() === 0) starts.push(day.date);
  });
  return starts;
}
function stemHeight(count, peak, max) {
  if (!(count > 0) || !(peak > 0)) return 0;
  return Math.round(14 + Math.sqrt(Math.min(1, count / peak)) * (max - 14));
}
function gardenSvg(profile, config, variant) {
  const dark = variant === "dark";
  const hue = hueFor9(profile, 330);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const days = daysOf(profile, config);
  const name = profile.name ?? profile.login;
  const skyTop = dark ? "#0d1424" : "#9fd4f2";
  const skyBottom = dark ? "#1c2b3f" : "#e2f4fb";
  const ground = dark ? "#173222" : "#6fbf6a";
  const groundDark = dark ? "#0f2418" : "#4fa353";
  const ink = dark ? "#e8f1ec" : "#16331f";
  const muted = dark ? "#90a89a" : "#3f6a4a";
  const height = 440;
  const grassY = 340;
  const defs = `<linearGradient id="sky" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${skyTop}"/><stop offset="1" stop-color="${skyBottom}"/></linearGradient>`;
  let body = `<rect width="900" height="${height}" fill="url(#sky)"/>`;
  body += `<circle cx="800" cy="80" r="${dark ? 26 : 36}" fill="${dark ? "#f5f0d0" : "#ffd23f"}" fill-opacity="${dark ? 0.9 : 1}"/>`;
  body += `<path d="M0 ${grassY - 18}Q225 ${grassY - 44} 450 ${grassY - 20}T900 ${grassY - 24}V${height}H0Z" fill="${groundDark}"/><rect x="0" y="${grassY}" width="900" height="${height - grassY}" fill="${ground}"/>`;
  body += text9(`${truncate(name, 24)}\u2019s garden`, 36, 52, 24, ink, 'font-weight="800"');
  body += text9(`@${profile.login}`, 36, 74, 13, muted, 'class="mono"');
  if (days.length === 0) {
    body += text9(waiting(blocks), 36, 150, 15, muted, 'font-style="italic"');
    return svgDoc({ height, title: `${name} on GitHub, as a garden`, bg: skyBottom, radius: 14, defs, css: riseCss(motion), body });
  }
  const weeks = weeklyTotals(days);
  const starts = weekStarts(days);
  const peak = Math.max(...weeks, 0);
  const step = 820 / weeks.length;
  const palette = [0, 40, 200, 290, 340].map((offset) => hslToHex((hue + offset) % 360, 0.8, dark ? 0.65 : 0.55));
  let flowers = "";
  weeks.forEach((count, i) => {
    const x = 50 + (i + 0.5) * step;
    const h = stemHeight(count, peak, 220);
    const sway = motion ? ` class="sway" style="animation-delay:${(i * 0.17 % 2.6).toFixed(2)}s;transform-origin:${num4(x)}px ${grassY}px"` : "";
    if (h === 0) {
      flowers += `<path d="M${num4(x)} ${grassY}v-7" stroke="${groundDark}" stroke-width="2.5" stroke-linecap="round"/>`;
      return;
    }
    const color = palette[hashOf(`${profile.login}:${i}`) % palette.length];
    const r = 5 + Math.sqrt(count / peak) * 11;
    const top = grassY - h;
    flowers += `<g${sway}><path d="M${num4(x)} ${grassY}V${num4(top)}" stroke="${dark ? "#3f9a5a" : "#2e8a4a"}" stroke-width="2.5" stroke-linecap="round"/>`;
    for (let p = 0; p < 6; p++) {
      const a = p / 6 * Math.PI * 2;
      flowers += `<circle cx="${num4(x + Math.cos(a) * r * 0.9)}" cy="${num4(top + Math.sin(a) * r * 0.9)}" r="${num4(r * 0.62)}" fill="${color}"/>`;
    }
    flowers += `<circle cx="${num4(x)}" cy="${num4(top)}" r="${num4(Math.max(2.5, r * 0.42))}" fill="#ffd23f"/></g>`;
  });
  body += flowers;
  let last = "";
  starts.forEach((date, i) => {
    const key = date.slice(0, 7);
    const lateStart = i === 0 && weeks.length > 6 && date.slice(8) > "20";
    if (key === last || lateStart) return;
    last = key;
    body += text9(MONTHS8[Number(date.slice(5, 7)) - 1], 50 + (i + 0.5) * step, grassY + 26, 11, dark ? "#bfe3c9" : "#ffffff", 'class="mono" text-anchor="middle" font-weight="700"');
  });
  const active = days.filter((d) => d.count > 0).length;
  body += text9(`${plural(active, "active day")} \xB7 one flower for each week, taller for a busier week`, 36, height - 28, 12, dark ? "#bfe3c9" : "#ffffff", 'class="mono"');
  const css = riseCss(motion) + (motion ? `.sway{animation:sway 2.6s ease-in-out infinite alternate}@keyframes sway{from{transform:rotate(-2.2deg)}to{transform:rotate(2.2deg)}}@media (prefers-reduced-motion:reduce){.sway{animation:none}}` : "");
  return svgDoc({ height, title: `${name} on GitHub, as a garden of contributions`, bg: skyBottom, radius: 14, defs, css, body });
}
var garden = imageTemplate("garden", "Garden", "A garden with a flower for every week of the year, taller in busier weeks.", ["creative", "activity", "nature"], gardenSvg, {
  activity: true,
  extra: () => "shown as a garden with a flower for each week"
});
function monthlySeries(days, months = 12) {
  const rows = [];
  for (const d of days) {
    const key = d.date.slice(0, 7);
    let row = rows[rows.length - 1];
    if (!row || row.key !== key) {
      row = { key, label: `${MONTHS8[Number(key.slice(5, 7)) - 1] ?? "???"} ${key.slice(0, 4)}`, days: [], total: 0 };
      rows.push(row);
    }
    row.days.push({ day: Number(d.date.slice(8, 10)), count: d.count });
    row.total += d.count;
  }
  return rows.slice(-months);
}
function ridgeSvg(profile, config, variant) {
  const dark = variant === "dark";
  const hue = hueFor9(profile, 200);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const days = daysOf(profile, config);
  const bg = dark ? "#0a0b0e" : "#f4f3ef";
  const line = dark ? "#f2f2f2" : "#111111";
  const muted = dark ? "#8a8f9a" : "#6b7080";
  const name = profile.name ?? profile.login;
  const rows = monthlySeries(days, 12);
  const rowH = 38;
  const top = 128;
  const height = Math.max(260, top + Math.max(rows.length, 1) * rowH + 90);
  const peak = Math.max(...days.map((d) => d.count), 0);
  const left = 150;
  const right = 760;
  let body = text9("CONTRIBUTIONS, MONTH BY MONTH", 36, 52, 11, muted, 'letter-spacing="5" font-weight="800"');
  body += text9(truncate(name, 28), 36, 86, 28, line, 'font-weight="800"');
  body += text9(`@${profile.login}`, 36, 108, 13, muted, 'class="mono"');
  if (rows.length === 0 || peak === 0) {
    body += text9(rows.length === 0 ? waiting(blocks) : "No contributions in this period, so the lines stay flat.", 36, 160, 15, muted, 'font-style="italic"');
    if (rows.length === 0) return svgDoc({ height: 260, title: `${name} on GitHub, as ridgelines`, bg, radius: 14, css: riseCss(motion), body });
  }
  const stroke = hslToHex(hue, 0, dark ? 0.95 : 0.05);
  rows.forEach((row, i) => {
    const base = top + i * rowH + 40;
    const pts = row.days.map((d) => `${num4(left + (d.day - 1) / 30 * (right - left))} ${num4(base - (peak > 0 ? d.count / peak * 58 : 0))}`);
    const first = row.days[0];
    const lastD = row.days[row.days.length - 1];
    const x0 = left + (first.day - 1) / 30 * (right - left);
    const x1 = left + (lastD.day - 1) / 30 * (right - left);
    const shape = `M${num4(x0)} ${base}L${pts.join("L")}L${num4(x1)} ${base}Z`;
    body += `<g class="ridge" style="animation-delay:${(i * 0.09).toFixed(2)}s"><path d="${shape}" fill="${bg}"/><path d="M${pts.join("L")}" fill="none" stroke="${stroke}" stroke-width="1.6" stroke-linejoin="round"/><path d="M${num4(x0)} ${base}H${num4(x1)}" stroke="${stroke}" stroke-opacity="0.25"/></g>`;
    body += text9(row.label, 36, base + 2, 11.5, muted, 'class="mono" font-weight="700"');
    body += text9(formatNumber(row.total), 864, base + 2, 11.5, muted, 'class="mono" text-anchor="end"');
  });
  body += text9("each line is one month, left to right across its days; a taller peak is a busier day", 36, height - 24, 11, muted, 'class="mono"');
  const css = riseCss(motion) + (motion ? `.ridge{animation:fade .6s ease-out both}@keyframes fade{from{opacity:0;transform:translateY(8px)}}@media (prefers-reduced-motion:reduce){.ridge{animation:none}}` : "");
  return svgDoc({ height, title: `${name} on GitHub, as ridgelines of contributions`, bg, radius: 14, css, body });
}
var ridgeline = imageTemplate("ridgeline", "Ridgeline", "Your last twelve months as stacked ridgelines, one line for each month.", ["creative", "activity", "art"], ridgeSvg, {
  activity: true,
  extra: () => "shown as stacked ridgelines, one for each month"
});
var PULSE_DAYS = 90;
function pulsePath(counts, x0, width, base, maxSpike) {
  if (counts.length === 0) return "";
  const peak = Math.max(...counts, 0);
  const step = width / counts.length;
  let d = `M${num4(x0)} ${num4(base)}`;
  counts.forEach((count, i) => {
    const x = x0 + i * step;
    if (count > 0 && peak > 0) {
      const h = 14 + Math.sqrt(count / peak) * (maxSpike - 14);
      d += `L${num4(x + step * 0.2)} ${num4(base)}L${num4(x + step * 0.45)} ${num4(base - h)}L${num4(x + step * 0.7)} ${num4(base + h * 0.25)}L${num4(x + step * 0.9)} ${num4(base)}`;
    } else {
      d += `L${num4(x + step)} ${num4(base)}`;
    }
  });
  return d;
}
function pulseSvg(profile, config, variant) {
  const dark = variant === "dark";
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const days = daysOf(profile, config);
  const bg = dark ? "#050807" : "#cfd9d2";
  const screen = dark ? "#06130c" : "#e8f2ea";
  const trace = dark ? "#3dff8a" : "#0a7a3c";
  const grid = dark ? "#0f3a22" : "#a9c4b3";
  const dim = dark ? "#2d8a55" : "#3d6b4f";
  const name = profile.name ?? profile.login;
  const height = 420;
  let body = `<rect x="22" y="22" width="856" height="${height - 44}" rx="16" fill="${screen}" stroke="${dark ? "#12261b" : "#8fa89a"}" stroke-width="3"/>`;
  for (let x = 40; x <= 860; x += 41) body += `<path d="M${x} 40V${height - 40}" stroke="${grid}" stroke-width="1"/>`;
  for (let y = 40; y <= height - 40; y += 38) body += `<path d="M40 ${y}H860" stroke="${grid}" stroke-width="1"/>`;
  body += text9(`${truncate(name, 24).toUpperCase()}   @${profile.login}`, 48, 66, 14, trace, 'class="mono" font-weight="700" letter-spacing="2"');
  if (days.length === 0) {
    body += text9(waiting(blocks), 48, 160, 14, dim, 'class="mono"');
    return svgDoc({ height, title: `${name} on GitHub, as a pulse monitor`, bg, radius: 14, css: riseCss(motion), body });
  }
  const counts = days.map((d2) => d2.count);
  const shown = counts.slice(-PULSE_DAYS);
  const d = pulsePath(shown, 48, 560, 220, 120);
  body += `<path d="${d}" fill="none" stroke="${trace}" stroke-width="2.2" stroke-linejoin="round" stroke-opacity="0.35"/>`;
  body += `<path class="trace" d="${d}" fill="none" stroke="${trace}" stroke-width="2.2" stroke-linejoin="round" pathLength="1"/>`;
  body += `<rect class="scan" x="48" y="46" width="3" height="${height - 92}" fill="${trace}" fill-opacity="0.6"/>`;
  const sum = (list) => list.reduce((a, b) => a + b, 0);
  const rows = [["TOTAL (YEAR)", formatNumber(sum(counts))], ["LAST 7 DAYS", formatNumber(sum(counts.slice(-7)))], ["ACTIVE DAYS", `${counts.filter((c2) => c2 > 0).length} / ${counts.length}`]];
  if (profile.contributions) rows.push(["STREAK", `${profile.contributions.currentStreak} d`], ["BEST STREAK", `${profile.contributions.longestStreak} d`]);
  rows.forEach(([label4, value], i) => {
    const y = 108 + i * 52;
    body += text9(label4, 640, y, 11, dim, 'class="mono" letter-spacing="3" font-weight="700"') + text9(value, 640, y + 26, 26, trace, 'class="mono" font-weight="800"');
  });
  body += text9(`LAST ${shown.length} DAYS \xB7 EACH SPIKE IS A DAY WITH ACTIVITY, TALLER IS BUSIER`, 48, height - 52, 10.5, dim, 'class="mono" letter-spacing="1"');
  const css = riseCss(motion) + (motion ? `.trace{stroke-dasharray:1;stroke-dashoffset:0;animation:draw 3.2s linear both}@keyframes draw{from{stroke-dashoffset:1}}.scan{animation:scan 3.2s linear both}@keyframes scan{to{transform:translateX(560px)}}@media (prefers-reduced-motion:reduce){.trace,.scan{animation:none}.scan{display:none}}` : ".scan{display:none}");
  return svgDoc({ height, title: `${name} on GitHub, as a pulse monitor of contributions`, bg, radius: 14, css, body });
}
var pulse = imageTemplate("pulse", "Pulse monitor", "A heart monitor whose trace is your year: a spike for every active day.", ["creative", "activity", "fun"], pulseSvg, {
  activity: true,
  extra: () => "shown as a heart monitor trace of the year"
});
var WEEKDAYS2 = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
function padGrid(days, weeks = 26) {
  const grid = Array.from({ length: 7 }, () => []);
  if (days.length === 0) return grid;
  const monday = (iso) => {
    const day = /* @__PURE__ */ new Date(`${iso}T00:00:00Z`);
    return Math.floor((day.getTime() - (day.getUTCDay() + 6) % 7 * 864e5) / 864e5);
  };
  const last = monday(days[days.length - 1].date);
  const byDate = new Map(days.map((d) => [d.date, d]));
  for (let w = weeks - 1; w >= 0; w--) {
    const start = (last - w * 7) * 864e5;
    for (let r = 0; r < 7; r++) grid[r].push(byDate.get(new Date(start + r * 864e5).toISOString().slice(0, 10)) ?? null);
  }
  return grid;
}
function drumsSvg(profile, config, variant) {
  const dark = variant === "dark";
  const hue = hueFor9(profile, 20);
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const days = daysOf(profile, config);
  const body0 = dark ? "#1b1c21" : "#e3e1dc";
  const plate = dark ? "#24262d" : "#f4f2ec";
  const ink = dark ? "#e9e9ee" : "#25262b";
  const muted = dark ? "#8b8f9c" : "#767985";
  const padOff = dark ? "#33363f" : "#cfccc4";
  const lit = [0.5, 0.58, 0.64, 0.7].map((l) => hslToHex(hue, 0.9, dark ? l : l - 0.12));
  const name = profile.name ?? profile.login;
  const weeks = 26;
  const grid = padGrid(days, weeks);
  const px = 28;
  const py = 150;
  const cw = 22;
  const gap = 6;
  const rh = 30;
  const height = 520;
  let body = `<rect x="22" y="22" width="856" height="${height - 44}" rx="18" fill="${plate}"/>`;
  body += text9(truncate(name, 26).toUpperCase(), 48, 62, 22, ink, 'font-weight="800" letter-spacing="3"');
  body += text9(`@${profile.login}  \xB7  SEQUENCER`, 48, 84, 12, muted, 'class="mono" letter-spacing="2"');
  if (days.length === 0) {
    body += text9(waiting(blocks), 48, 170, 14, muted, 'font-style="italic"');
    return svgDoc({ height: 300, title: `${name} on GitHub, as a drum machine`, bg: body0, radius: 14, css: riseCss(motion), body });
  }
  const total = days.length;
  const active = days.filter((d) => d.count > 0).length;
  const contributions = profile.contributions;
  const knobs = [["ACTIVE DAYS", total ? active / total : 0, `${active}/${total}`]];
  if (contributions) knobs.push(["STREAK", contributions.longestStreak > 0 ? contributions.currentStreak / contributions.longestStreak : 0, `${contributions.currentStreak}/${contributions.longestStreak}`]);
  const peak = Math.max(...days.map((d) => d.count), 0);
  const recent = days.slice(-7).reduce((a, d) => a + d.count, 0);
  knobs.push(["LAST 7 DAYS", peak > 0 ? Math.min(1, recent / (peak * 7)) : 0, formatNumber(recent)]);
  knobs.forEach(([label4, frac, readout], i) => {
    const cx = 640 + i * 78;
    const cy = 70;
    const ang = -135 + Math.max(0, Math.min(1, frac)) * 270;
    body += `<circle cx="${cx}" cy="${cy}" r="24" fill="${dark ? "#0f1013" : "#d9d6cf"}"/><circle cx="${cx}" cy="${cy}" r="19" fill="${dark ? "#2b2e37" : "#fbfaf6"}"/>`;
    body += `<path d="M${cx} ${cy}L${num4(cx + Math.sin(ang * Math.PI / 180) * 17)} ${num4(cy - Math.cos(ang * Math.PI / 180) * 17)}" stroke="${lit[1]}" stroke-width="3.5" stroke-linecap="round"/>`;
    body += text9(label4, cx, cy + 42, 8.5, muted, 'text-anchor="middle" letter-spacing="1" font-weight="800"') + text9(readout, cx, cy + 56, 10.5, ink, 'class="mono" text-anchor="middle" font-weight="700"');
  });
  WEEKDAYS2.forEach((day, r) => {
    body += text9(day, 48, py + r * rh + 19, 10.5, muted, 'class="mono" font-weight="700"');
    for (let c2 = 0; c2 < weeks; c2++) {
      const cell2 = grid[r][c2];
      const x = 90 + c2 * (cw + gap);
      const color = cell2 && cell2.count > 0 ? lit[Math.min(3, Math.max(0, cell2.level - 1))] : padOff;
      body += `<rect x="${x}" y="${py + r * rh}" width="${cw}" height="${rh - 6}" rx="4" fill="${color}"${cell2 ? "" : ' fill-opacity="0.45"'}/>`;
    }
  });
  body += `<rect class="head" x="${90 - 3}" y="${py - 6}" width="${cw + 6}" height="${7 * rh + 4}" rx="6" fill="none" stroke="${ink}" stroke-opacity="0.7" stroke-width="2"/>`;
  const sum = days.reduce((a, d) => a + d.count, 0);
  body += text9(`${formatNumber(sum)} CONTRIBUTIONS \xB7 LAST ${weeks} WEEKS \xB7 LIT PAD = ACTIVE DAY, BRIGHTER = BUSIER`, 48, py + 7 * rh + 36, 10.5, muted, 'class="mono" letter-spacing="1"');
  const css = riseCss(motion) + (motion ? `.head{animation:play ${weeks * 0.25}s steps(${weeks}) infinite}@keyframes play{to{transform:translateX(${weeks * (cw + gap)}px)}}@media (prefers-reduced-motion:reduce){.head{animation:none}}` : "");
  return svgDoc({ height: py + 7 * rh + 70, title: `${name} on GitHub, as a drum machine of contributions`, bg: body0, radius: 14, css, body });
}
var drums = imageTemplate("drums", "Drum machine", "A step sequencer: a pad for each of your last 26 weeks and 7 weekdays, lit by real activity, with knobs for your streaks.", ["creative", "activity", "music"], drumsSvg, {
  activity: true,
  extra: () => "shown as a drum machine with a lit pad for each active day"
});
function typicalDay(days) {
  const counts = days.filter((d) => d.count > 0).map((d) => d.count).sort((a, b) => a - b);
  if (counts.length === 0) return 0;
  const mid = Math.floor(counts.length / 2);
  return counts.length % 2 ? counts[mid] : (counts[mid - 1] + counts[mid]) / 2;
}
function skyFor(count, typical) {
  if (!(count > 0)) return "quiet";
  return count > typical ? "busy" : "some";
}
function skyIcon(sky, cx, cy, s, dark) {
  const sun = "#ffc933";
  const cloud2 = dark ? "#8b97ab" : "#aab4c4";
  const cloudBody = (x, y, k, fill) => `<g fill="${fill}"><circle cx="${num4(x - 14 * k)}" cy="${num4(y + 4 * k)}" r="${num4(12 * k)}"/><circle cx="${num4(x)}" cy="${num4(y - 4 * k)}" r="${num4(16 * k)}"/><circle cx="${num4(x + 16 * k)}" cy="${num4(y + 5 * k)}" r="${num4(11 * k)}"/><rect x="${num4(x - 22 * k)}" y="${num4(y + 4 * k)}" width="${num4(48 * k)}" height="${num4(12 * k)}" rx="${num4(6 * k)}"/></g>`;
  const rays = (x, y, r) => Array.from({ length: 8 }, (_v, i) => {
    const a = i / 8 * Math.PI * 2;
    return `<path d="M${num4(x + Math.cos(a) * (r + 5))} ${num4(y + Math.sin(a) * (r + 5))}L${num4(x + Math.cos(a) * (r + 12))} ${num4(y + Math.sin(a) * (r + 12))}" stroke="${sun}" stroke-width="3" stroke-linecap="round"/>`;
  }).join("");
  if (sky === "busy") return `<circle cx="${cx}" cy="${cy}" r="${num4(14 * s)}" fill="${sun}"/>${rays(cx, cy, 14 * s)}`;
  if (sky === "some") return `<circle cx="${num4(cx - 8 * s)}" cy="${num4(cy - 8 * s)}" r="${num4(12 * s)}" fill="${sun}"/>${cloudBody(cx + 4 * s, cy + 6 * s, 0.9 * s, cloud2)}`;
  return cloudBody(cx, cy, 1.1 * s, cloud2);
}
function weatherSvg(profile, config, variant) {
  const dark = variant === "dark";
  const motion = config.motion;
  const blocks = new Set(config.blocks);
  const days = daysOf(profile, config);
  const bgTop = dark ? "#1a2540" : "#6fb4e8";
  const bgBottom = dark ? "#0e1424" : "#bfe0f5";
  const card2 = dark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.55)";
  const ink = dark ? "#f1f5ff" : "#10243f";
  const muted = dark ? "#a7b4d0" : "#2e4a6e";
  const name = profile.name ?? profile.login;
  const defs = `<linearGradient id="wx" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${bgTop}"/><stop offset="1" stop-color="${bgBottom}"/></linearGradient>`;
  const height = 440;
  let body = `<rect width="900" height="${height}" fill="url(#wx)"/>`;
  body += text9(truncate(name, 26), 40, 60, 24, ink, 'font-weight="800"') + text9(`@${profile.login}`, 40, 82, 13, muted, 'class="mono"');
  if (days.length === 0) {
    body += text9(waiting(blocks), 40, 150, 15, muted, 'font-style="italic"');
    return svgDoc({ height: 260, title: `${name} on GitHub, as a weather forecast`, bg: bgBottom, radius: 14, defs, css: riseCss(motion), body });
  }
  const typical = typicalDay(days);
  const week = days.slice(-7);
  const today = week[week.length - 1];
  const todaySky = skyFor(today.count, typical);
  const label4 = { quiet: "Quiet", some: "Some activity", busy: "Busy" };
  body += `<rect x="40" y="108" width="300" height="190" rx="20" fill="${card2}"/>`;
  body += text9("LATEST DAY", 62, 140, 11, muted, 'letter-spacing="4" font-weight="800"') + text9(today.date, 62, 160, 13, muted, 'class="mono"');
  body += skyIcon(todaySky, 130, 214, 2.1, dark);
  body += text9(String(today.count), 220, 240, 64, ink, 'font-weight="800"') + text9(label4[todaySky], 62, 282, 17, ink, 'font-weight="700"');
  week.forEach((day, i) => {
    const x = 366 + i * 70;
    const sky = skyFor(day.count, typical);
    const weekday = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][(/* @__PURE__ */ new Date(`${day.date}T00:00:00Z`)).getUTCDay()];
    body += `<g class="day" style="animation-delay:${(i * 0.08).toFixed(2)}s"><rect x="${x}" y="108" width="62" height="190" rx="16" fill="${card2}"/>`;
    body += text9(weekday, x + 31, 136, 12, muted, 'text-anchor="middle" letter-spacing="2" font-weight="800"');
    body += skyIcon(sky, x + 31, 190, 1, dark);
    body += text9(String(day.count), x + 31, 262, 26, ink, 'text-anchor="middle" font-weight="800"');
    body += `</g>`;
  });
  const weeks = weeklyTotals(days);
  const peak = Math.max(...weeks, 1);
  const step = 820 / Math.max(1, weeks.length - 1);
  const pts = weeks.map((w, i) => `${num4(40 + i * step)} ${num4(420 - w / peak * 46)}`).join("L");
  body += `<path d="M${pts}" fill="none" stroke="${ink}" stroke-opacity="0.8" stroke-width="2.2" stroke-linejoin="round"/>`;
  body += text9("THE WEEKS OF THE YEAR", 40, 326, 11, muted, 'letter-spacing="4" font-weight="800"');
  body += text9(`Busy = more than a typical active day (${typical}). The last seven days are shown.`, 40, 346, 12, muted, 'class="mono"');
  const css = riseCss(motion) + (motion ? `.day{animation:rise .5s ease-out both}@keyframes rise{from{opacity:0;transform:translateY(10px)}}@media (prefers-reduced-motion:reduce){.day{animation:none}}` : "");
  return svgDoc({ height, title: `${name} on GitHub, as a weather forecast`, bg: bgBottom, radius: 14, defs, css, body });
}
var weather = imageTemplate("weather", "Weather forecast", "A forecast card for your last seven days: sunny when busy, cloudy when quiet, with the year as a line.", ["creative", "activity", "fun"], weatherSvg, {
  activity: true,
  extra: () => "shown as a weather forecast of the last seven days"
});
var signalTemplates = [garden, ridgeline, pulse, drums, weather];

// ../core/src/templates/showcase.ts
var WIDTH10 = 900;
var PAD14 = 36;
var AVATAR2 = 128;
var AVATAR_GAP = 36;
var TEXT_X = PAD14 + 8 + AVATAR2 + AVATAR_GAP;
var SECTION_GAP2 = 30;
var TILE_GAP2 = 14;
var HEAT_CELL = 12;
var HEAT_STEP = 15;
var HEAT_OPACITY = [0, 0.3, 0.55, 0.78, 1];
var MONTHS9 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function joined2(createdAt) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;
  return `Joined ${MONTHS9[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}
function chips2(profile) {
  const website = safeUrl(profile.website)?.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return [profile.company, profile.location, website, joined2(profile.createdAt)].filter((text10) => Boolean(text10)).map((text10) => truncate(text10, 30));
}
var accent = (c2, index) => c2.accents[index % c2.accents.length] ?? c2.p.accent;
function avatarMarkup(profile, c2, cx, cy) {
  const r = AVATAR2 / 2;
  const uri = profile.avatar?.dataUri;
  const ring = `<circle class="ring" cx="${cx}" cy="${cy}" r="${r + 6}" fill="none" stroke="url(#ring)" stroke-width="3"/>`;
  if (uri && SAFE_DATA_URI.test(uri)) {
    return `<clipPath id="avatar"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath><image href="${uri}" x="${cx - r}" y="${cy - r}" width="${AVATAR2}" height="${AVATAR2}" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatar)"/>${ring}`;
  }
  const initial = [...profile.name ?? profile.login][0]?.toUpperCase() ?? "?";
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#ring)"/><text x="${cx}" y="${cy + 20}" text-anchor="middle" font-size="56" font-weight="800" fill="#ffffff">${xmlEscape(initial)}</text>${ring}`;
}
function renderSvg12(profile, config, variant) {
  const p = palettes[variant];
  const c2 = { p, accents: accentColors(profile.avatar?.grid.tint, variant), motion: config.motion };
  const motion = config.motion;
  const body = [];
  let step = 0;
  const next = () => 0.1 + step++ * 0.12;
  const avatarCy = PAD14 + 14 + AVATAR2 / 2;
  body.push(rise(avatarMarkup(profile, c2, PAD14 + 8 + AVATAR2 / 2, avatarCy), motion, 0));
  let y = PAD14 + 46;
  const text10 = [];
  text10.push(
    `<text x="${TEXT_X}" y="${y}" font-size="40" font-weight="800" fill="${p.fg}">${xmlEscape(truncate(profile.name ?? profile.login, 26))}</text>`
  );
  if (profile.name) {
    y += 30;
    text10.push(`<text x="${TEXT_X}" y="${y}" font-size="17" fill="${p.muted}">@${xmlEscape(profile.login)}</text>`);
  }
  if (config.text.headline) {
    y += 36;
    text10.push(
      `<text x="${TEXT_X}" y="${y}" font-size="20" font-weight="600" fill="${accent(c2, 0)}">${xmlEscape(truncate(config.text.headline, 56))}</text>`
    );
  }
  const bio = config.text.bio ?? profile.bio;
  if (bio) {
    wrap(bio, 62, 2).forEach((line, index) => {
      y += index === 0 ? 32 : 24;
      text10.push(`<text x="${TEXT_X}" y="${y}" font-size="16" fill="${p.fg}" fill-opacity="0.82">${xmlEscape(line)}</text>`);
    });
  }
  body.push(rise(text10.join(""), motion, next()));
  let chipX = TEXT_X;
  let chipY = y + 22;
  const chipMarkup = [];
  for (const label5 of chips2(profile)) {
    const width = Math.ceil(label5.length * 7.2) + 28;
    if (chipX + width > WIDTH10 - PAD14) {
      chipX = TEXT_X;
      chipY += 36;
    }
    chipMarkup.push(
      `<rect x="${chipX}" y="${chipY}" width="${width}" height="28" rx="14" fill="${p.fg}" fill-opacity="0.07" stroke="${p.border}"/><text x="${chipX + 14}" y="${chipY + 19}" font-size="13" fill="${p.fg}" fill-opacity="0.85">${xmlEscape(label5)}</text>`
    );
    chipX += width + 8;
  }
  const heroBottom = Math.max(PAD14 + 14 + AVATAR2 + 12, chipMarkup.length > 0 ? chipY + 28 : y);
  body.push(rise(chipMarkup.join(""), motion, next()));
  let cursor = heroBottom + SECTION_GAP2;
  for (const block of config.blocks) {
    if (block === "stats") {
      const tiles = [
        ["Repositories", profile.publicRepos],
        ["Stars", profile.totalStars],
        ["Followers", profile.followers],
        ["Following", profile.following]
      ];
      const width = Math.floor((WIDTH10 - PAD14 * 2 - TILE_GAP2 * 3) / 4);
      const markup = tiles.map(([label5, value], index) => {
        const x = PAD14 + index * (width + TILE_GAP2);
        return `<rect x="${x}" y="${cursor}" width="${width}" height="84" rx="16" fill="${p.fg}" fill-opacity="0.06" stroke="${p.border}"/><rect x="${x + 18}" y="${cursor}" width="34" height="3" rx="1.5" fill="${accent(c2, index)}"/><text x="${x + 18}" y="${cursor + 46}" font-size="30" font-weight="800" fill="${p.fg}">${xmlEscape(formatNumber(value))}</text><text x="${x + 18}" y="${cursor + 68}" font-size="12" letter-spacing="0.6" fill="${p.muted}">${xmlEscape(label5.toUpperCase())}</text>`;
      }).join("");
      body.push(rise(markup, motion, next()));
      cursor += 84 + SECTION_GAP2;
    } else if (block === "activity" && profile.contributions) {
      const activity = profile.contributions;
      const first = (/* @__PURE__ */ new Date(`${activity.days[0]?.date}T00:00:00Z`)).getUTCDay();
      const top = cursor + 24;
      const cells2 = activity.days.map((day, index) => {
        const slot = first + index;
        const x = PAD14 + Math.floor(slot / 7) * HEAT_STEP;
        const y2 = top + slot % 7 * HEAT_STEP;
        const fill = day.level === 0 ? `fill="${p.track}"` : `fill="${accent(c2, 0)}" fill-opacity="${HEAT_OPACITY[day.level]}"`;
        return `<rect x="${x}" y="${y2}" width="${HEAT_CELL}" height="${HEAT_CELL}" rx="2.5" ${fill}/>`;
      }).join("");
      const summaryY = top + 7 * HEAT_STEP + 20;
      const strong = (text11) => `<tspan fill="${p.fg}" font-weight="700">${xmlEscape(text11)}</tspan>`;
      const summary = `<text x="${PAD14}" y="${summaryY}" font-size="13" fill="${p.muted}" xml:space="preserve">${strong(formatNumber(activity.total))} contributions in the past year    \xB7    current streak ${strong(plural(activity.currentStreak, "day"))}    \xB7    longest streak ${strong(plural(activity.longestStreak, "day"))}</text>`;
      const markup = `<text x="${PAD14}" y="${cursor + 10}" font-size="12" letter-spacing="1" fill="${p.muted}">ACTIVITY</text>` + cells2 + summary;
      body.push(rise(markup, motion, next()));
      cursor += summaryY - cursor + 6 + SECTION_GAP2;
    } else if (block === "languages" && profile.languages.length > 0) {
      const barWidth = WIDTH10 - PAD14 * 2;
      const total = profile.languages.reduce((sum, l) => sum + l.percent, 0) || 1;
      let x = PAD14;
      const segments = profile.languages.map((language, index) => {
        const width = language.percent / total * barWidth;
        const rect = `<rect x="${x.toFixed(1)}" y="${cursor + 22}" width="${Math.max(width, 3).toFixed(1)}" height="10" fill="${accent(c2, index)}"/>`;
        x += width;
        return rect;
      }).join("");
      let legendX = PAD14;
      const legend = profile.languages.map((language, index) => {
        const label5 = `${truncate(language.name, 16)} ${language.percent}%`;
        const item = `<circle cx="${legendX + 5}" cy="${cursor + 56}" r="5" fill="${accent(c2, index)}"/><text x="${legendX + 16}" y="${cursor + 61}" font-size="13" fill="${p.fg}" fill-opacity="0.85">${xmlEscape(label5)}</text>`;
        legendX += 16 + Math.ceil(label5.length * 7) + 22;
        return item;
      }).join("");
      const markup = `<text x="${PAD14}" y="${cursor + 10}" font-size="12" letter-spacing="1" fill="${p.muted}">LANGUAGES, BY NUMBER OF REPOSITORIES</text><clipPath id="bar"><rect x="${PAD14}" y="${cursor + 22}" width="${barWidth}" height="10" rx="5"/></clipPath><rect x="${PAD14}" y="${cursor + 22}" width="${barWidth}" height="10" rx="5" fill="${p.track}"/><g clip-path="url(#bar)">${segments}</g>${legend}`;
      body.push(rise(markup, motion, next()));
      cursor += 70 + SECTION_GAP2;
    } else if (block === "projects" && profile.topRepos.length > 0) {
      const repos = profile.topRepos.slice(0, 3);
      const width = Math.floor((WIDTH10 - PAD14 * 2 - TILE_GAP2 * (repos.length - 1)) / repos.length);
      const cards = repos.map((repo, index) => {
        const x = PAD14 + index * (width + TILE_GAP2);
        const top = cursor + 22;
        const description = repo.description ? wrap(repo.description, Math.max(18, Math.floor((width - 36) / 6.6)), 2).map(
          (line, i) => `<text x="${x + 18}" y="${top + 52 + i * 17}" font-size="12.5" fill="${p.muted}">${xmlEscape(line)}</text>`
        ).join("") : "";
        const meta = [`\u2605 ${formatNumber(repo.stars)}`, repo.language].filter(Boolean).join("  \xB7  ");
        return `<rect x="${x}" y="${top}" width="${width}" height="104" rx="16" fill="${p.fg}" fill-opacity="0.06" stroke="${p.border}"/><text x="${x + 18}" y="${top + 30}" font-size="15" font-weight="700" fill="${p.fg}">${xmlEscape(truncate(repo.name, Math.floor((width - 36) / 8.4)))}</text>` + description + `<text x="${x + 18}" y="${top + 92}" font-size="12.5" font-weight="600" fill="${accent(c2, index + 1)}">${xmlEscape(meta)}</text>`;
      }).join("");
      const markup = `<text x="${PAD14}" y="${cursor + 10}" font-size="12" letter-spacing="1" fill="${p.muted}">TOP PROJECTS</text>${cards}`;
      body.push(rise(markup, motion, next()));
      cursor += 22 + 104 + SECTION_GAP2;
    }
  }
  const height = Math.max(cursor - SECTION_GAP2 + PAD14, heroBottom + PAD14);
  const label4 = `${profile.name ?? profile.login} (@${profile.login}) on GitHub`;
  const glow = variant === "dark" ? 0.5 : 0.3;
  const css = motion ? `.drift{animation:drift 16s ease-in-out infinite alternate}
.d2{animation-duration:21s;animation-direction:alternate-reverse}
.d3{animation-duration:26s}
@keyframes drift{from{transform:translate(0,0)}to{transform:translate(42px,-26px)}}
.rise{animation:rise .7s cubic-bezier(.2,.7,.2,1) both}
@keyframes rise{from{opacity:0;transform:translateY(10px)}}
.ring{animation:pulse 4s ease-in-out infinite}
@keyframes pulse{50%{opacity:.5}}
@media (prefers-reduced-motion:reduce){.drift,.rise,.ring{animation:none}}` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH10}" height="${height}" viewBox="0 0 ${WIDTH10} ${height}" role="img" aria-labelledby="t">
<title id="t">${xmlEscape(label4)}</title>
<defs>
<clipPath id="card"><rect width="${WIDTH10}" height="${height}" rx="22"/></clipPath>
<filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="64"/></filter>
<linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${accent(c2, 0)}"/><stop offset="1" stop-color="${accent(c2, 1)}"/></linearGradient>
</defs>
<style>
text{font-family:${FONT_SANS}}
${css}
</style>
<rect width="${WIDTH10}" height="${height}" rx="22" fill="${p.bg}"/>
<g clip-path="url(#card)">
<g filter="url(#blur)">
<circle class="drift" cx="150" cy="40" r="190" fill="${accent(c2, 0)}" fill-opacity="${glow}"/>
<circle class="drift d2" cx="780" cy="110" r="210" fill="${accent(c2, 1)}" fill-opacity="${glow * 0.85}"/>
<circle class="drift d3" cx="470" cy="${height}" r="230" fill="${accent(c2, 2)}" fill-opacity="${glow * 0.7}"/>
</g>
<rect width="${WIDTH10}" height="${height}" fill="${p.bg}" fill-opacity="0.38"/>
</g>
<rect x="0.5" y="0.5" width="${WIDTH10 - 1}" height="${height - 1}" rx="22" fill="none" stroke="${p.border}"/>
${body.filter(Boolean).join("\n")}
</svg>
`;
}
var showcase = {
  id: "showcase",
  name: "Showcase",
  description: "A banner coloured by your own profile picture, with stat tiles, a language bar and top projects.",
  tags: ["image", "banner", "colourful", "animated"],
  needsAvatar: true,
  render(profile, config) {
    const assets = variantsFor(config.theme).map((variant) => ({
      path: assetPath("showcase", variant),
      content: renderSvg12(profile, config, variant)
    }));
    const alt = describeProfile(profile, config, void 0, { activity: true });
    return { readme: imageReadme(profile, config, "showcase", WIDTH10, alt), assets };
  }
};

// ../core/src/templates/terminal.ts
var WIDTH11 = 800;
var PAD15 = 24;
var TITLE_BAR = 40;
var LINE_HEIGHT = 24;
var FONT_SIZE = 14;
var MAX_CHARS = 84;
var LABEL_WIDTH2 = 12;
var STAR_COLUMN = 11;
var BAR_CELLS = 24;
var STEP_SECONDS3 = 0.15;
function buildLines(profile, config) {
  const lines = [
    { kind: "prompt", command: "whoami" },
    { kind: "text", text: profile.name ?? profile.login, tone: "strong" }
  ];
  if (config.text.headline) lines.push({ kind: "text", text: config.text.headline, tone: "accent" });
  const bio = config.text.bio ?? profile.bio;
  if (bio) lines.push({ kind: "text", text: bio, tone: "muted" });
  const website = safeUrl(profile.website);
  const meta = [profile.company, profile.location, website?.replace(/^https?:\/\//, "").replace(/\/$/, "")].filter(
    (part) => Boolean(part)
  );
  if (meta.length > 0) lines.push({ kind: "text", text: meta.join(" \xB7 "), tone: "muted" });
  for (const block of config.blocks) {
    if (block === "stats") {
      lines.push({ kind: "blank" }, { kind: "prompt", command: "stats" });
      lines.push({ kind: "stat", label: "repos", value: formatNumber(profile.publicRepos) });
      lines.push({ kind: "stat", label: "stars", value: formatNumber(profile.totalStars) });
      lines.push({ kind: "stat", label: "followers", value: formatNumber(profile.followers) });
      lines.push({ kind: "stat", label: "following", value: formatNumber(profile.following) });
    } else if (block === "activity" && profile.contributions) {
      const activity = profile.contributions;
      lines.push({ kind: "blank" }, { kind: "prompt", command: "streak" });
      lines.push({ kind: "stat", label: "current", value: plural(activity.currentStreak, "day") });
      lines.push({ kind: "stat", label: "longest", value: plural(activity.longestStreak, "day") });
      lines.push({ kind: "stat", label: "past year", value: `${formatNumber(activity.total)} contributions` });
    } else if (block === "languages" && profile.languages.length > 0) {
      lines.push({ kind: "blank" }, { kind: "prompt", command: "languages" });
      for (const language of profile.languages) {
        lines.push({ kind: "bar", name: language.name, percent: language.percent });
      }
    } else if (block === "projects" && profile.topRepos.length > 0) {
      lines.push({ kind: "blank" }, { kind: "prompt", command: "projects --top" });
      for (const repo of profile.topRepos.slice(0, 4)) {
        lines.push({ kind: "repo", stars: repo.stars, name: repo.name, description: repo.description });
      }
    }
  }
  lines.push({ kind: "blank" }, { kind: "prompt", command: "", cursor: true });
  return lines;
}
function renderLine(line, y, p, login) {
  const base = `x="${PAD15}" y="${y}" xml:space="preserve"`;
  switch (line.kind) {
    case "blank":
      return "";
    case "prompt": {
      const prompt = `<tspan fill="${p.accent}">${xmlEscape(login)}@github</tspan><tspan fill="${p.muted}">:~$</tspan>`;
      const command = line.command ? ` ${xmlEscape(line.command)}` : " ";
      const cursor = line.cursor ? `<tspan class="cursor" fill="${p.fg}">\u258C</tspan>` : "";
      return `<text ${base} fill="${p.fg}">${prompt}${command}${cursor}</text>`;
    }
    case "text": {
      const fill = line.tone === "strong" ? p.fg : line.tone === "accent" ? p.accent2 : p.muted;
      const weight = line.tone === "strong" ? ' font-weight="700"' : "";
      return `<text ${base} fill="${fill}"${weight}>${xmlEscape(truncate(line.text, MAX_CHARS))}</text>`;
    }
    case "stat":
      return `<text ${base} fill="${p.muted}">${xmlEscape(line.label.padEnd(LABEL_WIDTH2))}<tspan fill="${p.fg}" font-weight="700">${xmlEscape(line.value)}</tspan></text>`;
    case "bar": {
      const filled = Math.round(line.percent / 100 * BAR_CELLS);
      const bar = "\u2588".repeat(filled);
      const rest = "\u2591".repeat(BAR_CELLS - filled);
      return `<text ${base} fill="${p.fg}">${xmlEscape(truncate(line.name, LABEL_WIDTH2 - 1).padEnd(LABEL_WIDTH2))}<tspan fill="${p.accent}">${bar}</tspan><tspan fill="${p.track}">${rest}</tspan><tspan fill="${p.muted}"> ${line.percent}%</tspan></text>`;
    }
    case "repo": {
      const head = `\u2605 ${formatNumber(line.stars)}`.padEnd(STAR_COLUMN) + line.name;
      const room = Math.max(0, MAX_CHARS - head.length - 3);
      const tail = line.description && room > 10 ? ` \u2014 ${truncate(line.description, room)}` : "";
      return `<text ${base} fill="${p.fg}"><tspan fill="${p.accent2}">${xmlEscape(head)}</tspan><tspan fill="${p.muted}">${xmlEscape(tail)}</tspan></text>`;
    }
  }
}
function renderSvg13(profile, config, variant) {
  const p = palettes[variant];
  const lines = buildLines(profile, config);
  const height = TITLE_BAR + PAD15 * 2 + lines.length * LINE_HEIGHT;
  const label4 = `${profile.name ?? profile.login} (@${profile.login}) on GitHub`;
  const css = motionCss(config.motion);
  const body = lines.map((line, index) => {
    const y = TITLE_BAR + PAD15 + (index + 1) * LINE_HEIGHT - 7;
    return stagger(renderLine(line, y, p, profile.login), config.motion, index * STEP_SECONDS3);
  }).filter(Boolean).join("\n");
  const w = WIDTH11;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${height}" viewBox="0 0 ${w} ${height}" role="img" aria-labelledby="t">
<title id="t">${xmlEscape(label4)}</title>
<style>
text{font-family:${FONT2};font-size:${FONT_SIZE}px}
${css}
</style>
<rect x="0.5" y="0.5" width="${w - 1}" height="${height - 1}" rx="10" fill="${p.bg}" stroke="${p.border}"/>
<path d="M1 ${TITLE_BAR}V11a10 10 0 0 1 10-10h${w - 22}a10 10 0 0 1 10 10v${TITLE_BAR - 11}z" fill="${p.panel}"/>
<line x1="1" y1="${TITLE_BAR}" x2="${w - 1}" y2="${TITLE_BAR}" stroke="${p.border}"/>
<circle cx="24" cy="20" r="6" fill="#ff5f56"/><circle cx="44" cy="20" r="6" fill="#ffbd2e"/><circle cx="64" cy="20" r="6" fill="#27c93f"/>
<text x="${w / 2}" y="25" text-anchor="middle" fill="${p.muted}">${xmlEscape(profile.login)}@github: ~</text>
${body}
</svg>
`;
}
var terminal = {
  id: "terminal",
  name: "Terminal",
  description: "A terminal window that types out your profile line by line.",
  tags: ["dark", "terminal", "animated"],
  render(profile, config) {
    const assets = variantsFor(config.theme).map((variant) => ({
      path: assetPath("terminal", variant),
      content: renderSvg13(profile, config, variant)
    }));
    const alt = describeProfile(profile, config, void 0, { activity: true });
    return { readme: imageReadme(profile, config, "terminal", WIDTH11, alt), assets };
  }
};

// ../core/src/templates/index.ts
var LIVE = {
  showcase: { preset: "aurora", city: true, companion: "chess" },
  launchpad: { preset: "sunrise", city: true, companion: "snake" },
  city: { preset: "night", city: false, companion: "chess" },
  galaxy: { preset: "space", city: true, companion: "snake" },
  snake: { preset: "arcade", city: true, companion: null },
  learning: { preset: "chalk", city: true, companion: "chess" },
  buildlog: { preset: "editor", city: true, companion: "snake" },
  maintainer: { preset: "blueprint", city: true, companion: "chess" },
  brief: { preset: "paper", city: true, companion: "chess" },
  terminal: { preset: "terminal", city: true, companion: "snake" },
  neofetch: { preset: "glow", city: true, companion: "chess" },
  minimal: { preset: "plain", city: true, companion: "snake" },
  frontend: { preset: "aurora", city: true, companion: "chess", shift: 14 },
  backend: { preset: "sunrise", city: true, companion: "snake", shift: 31 },
  devops: { preset: "terminal", city: true, companion: "snake", shift: 47 },
  datalab: { preset: "glow", city: true, companion: "chess", shift: 63 },
  indie: { preset: "arcade", city: true, companion: "snake", shift: 79 },
  animatedfrontend: { preset: "glow", city: true, companion: "chess", shift: 96 },
  product: { preset: "night", city: true, companion: "chess", shift: 112 },
  advocate: { preset: "space", city: true, companion: "chess", shift: 128 },
  framework: { preset: "blueprint", city: true, companion: "snake", shift: 144 },
  ossbuilder: { preset: "editor", city: true, companion: "snake", shift: 160 },
  ossproof: { preset: "blueprint", city: true, companion: "chess", shift: 176 },
  founder: { preset: "paper", city: true, companion: "chess", shift: 192 },
  spaceshooter: { preset: "space", city: true, companion: "chess", shift: 208 },
  jetrunner: { preset: "sunrise", city: true, companion: "chess", shift: 224 },
  playablesignal: { preset: "arcade", city: true, companion: "chess", shift: 240 },
  cinematic: { preset: "night", city: true, companion: "chess", shift: 256 },
  wow: { preset: "glow", city: true, companion: "snake", shift: 272 },
  signature: { preset: "aurora", city: true, companion: "snake", shift: 288 },
  captip: { preset: "sunrise", city: true, companion: "chess", shift: 304 },
  frontpage: { preset: "paper", city: true, companion: "chess", shift: 320 },
  hub: { preset: "plain", city: true, companion: "snake", shift: 336 },
  creative: { preset: "aurora", city: true, companion: "chess", shift: 352 },
  erased: { preset: "terminal", city: true, companion: "chess", shift: 24 },
  passport: { preset: "paper", city: true, companion: "chess", shift: 8 },
  receipt: { preset: "plain", city: true, companion: "snake", shift: 40 },
  sheet: { preset: "chalk", city: true, companion: "chess", shift: 28 },
  calendar: { preset: "sunrise", city: true, companion: "snake", shift: 352 },
  player: { preset: "glow", city: true, companion: "chess", shift: 300 },
  inbox: { preset: "night", city: true, companion: "snake", shift: 212 },
  desktop: { preset: "terminal", city: true, companion: "chess", shift: 170 },
  cockpit: { preset: "blueprint", city: true, companion: "snake", shift: 150 },
  metro: { preset: "plain", city: true, companion: "chess", shift: 200 },
  elements: { preset: "chalk", city: true, companion: "snake", shift: 260 },
  treemap: { preset: "editor", city: true, companion: "chess", shift: 120 },
  shelf: { preset: "paper", city: true, companion: "snake", shift: 28 },
  card: { preset: "glow", city: true, companion: "chess", shift: 265 },
  polaroids: { preset: "sunrise", city: true, companion: "snake", shift: 30 },
  comic: { preset: "arcade", city: true, companion: "chess", shift: 12 },
  wanted: { preset: "sunrise", city: true, companion: "chess", shift: 44 },
  recipe: { preset: "paper", city: true, companion: "snake", shift: 12 },
  nutrition: { preset: "plain", city: true, companion: "chess", shift: 140 },
  postcard: { preset: "aurora", city: true, companion: "snake", shift: 205 },
  ransom: { preset: "arcade", city: true, companion: "chess", shift: 350 },
  departures: { preset: "terminal", city: true, companion: "snake", shift: 5 },
  handheld: { preset: "arcade", city: true, companion: "chess", shift: 10 },
  neon: { preset: "glow", city: true, companion: "snake", shift: 15 },
  laptop: { preset: "aurora", city: true, companion: "chess", shift: 20 },
  pet: { preset: "sunrise", city: true, companion: "snake", shift: 35 },
  garden: { preset: "paper", city: true, companion: "chess", shift: 50 },
  ridgeline: { preset: "plain", city: true, companion: "snake", shift: 55 },
  pulse: { preset: "terminal", city: true, companion: "chess", shift: 60 },
  drums: { preset: "night", city: true, companion: "snake", shift: 65 },
  weather: { preset: "aurora", city: true, companion: "chess", shift: 70 },
  rings: { preset: "night", city: true, companion: "snake", shift: 75 },
  tree: { preset: "chalk", city: true, companion: "chess", shift: 85 },
  aquarium: { preset: "space", city: true, companion: "snake", shift: 90 },
  island: { preset: "paper", city: true, companion: "chess", shift: 100 },
  circuit: { preset: "blueprint", city: true, companion: "snake", shift: 105 },
  sonar: { preset: "terminal", city: true, companion: "chess", shift: 110 },
  cloud: { preset: "plain", city: true, companion: "snake", shift: 115 },
  timeline: { preset: "editor", city: true, companion: "chess", shift: 125 },
  sunburst: { preset: "glow", city: true, companion: "snake", shift: 130 },
  mosaic: { preset: "arcade", city: true, companion: "chess", shift: 135 }
};
var bases = [showcase, launchpad, city, galaxy, snake, learning, buildlog, maintainer, brief, terminal, neofetch, minimal, ...lensTemplates, ...arcadeTemplates, cinematic, wow, signature, captip, frontpage, hub, creative, erased, ...documentTemplates, ...interfaceTemplates, ...dataArtTemplates, ...scrapbookTemplates, ...paperTemplates, ...deviceTemplates, ...signalTemplates, ...worldTemplates, ...chartTemplates];
var templates = bases.map((template) => {
  const spec = LIVE[template.id];
  if (!spec) throw new Error(`Template "${template.id}" has no live preset`);
  return withLive(template, spec);
});
function getTemplate(id) {
  return templates.find((template) => template.id === id);
}

// ../core/src/typography.ts
var FONT_STACKS = {
  sans: "'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif",
  serif: "Georgia, 'Iowan Old Style', 'Palatino Linotype', 'Times New Roman', serif",
  mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
  rounded: "ui-rounded, 'SF Pro Rounded', 'Arial Rounded MT Bold', 'Trebuchet MS', Verdana, sans-serif",
  humanist: "Candara, 'Gill Sans', 'Gill Sans MT', Optima, Calibri, 'Segoe UI', sans-serif",
  classic: "'Palatino Linotype', Palatino, 'Book Antiqua', 'Iowan Old Style', Georgia, serif",
  typewriter: "'Courier New', Courier, 'Nimbus Mono PS', 'Liberation Mono', monospace",
  handwriting: "'Segoe Print', 'Bradley Hand', 'Chalkboard SE', 'Comic Sans MS', 'Comic Neue', cursive",
  impact: "Impact, Haettenschweiler, 'Franklin Gothic Bold', 'Arial Narrow Bold', 'Arial Black', sans-serif"
};
function isDesignPicture(asset) {
  return asset.path.endsWith(".svg") && !/(^|\/)credit-/.test(asset.path);
}
var SIZE_ATTRIBUTE = /font-size="(\d+(?:\.\d+)?)"/g;
var SIZE_RULE = /font-size:(\d+(?:\.\d+)?)(px)?/g;
var FAMILY_ATTRIBUTE = /font-family="[^"]*"/g;
var FAMILY_RULE = /font-family:[^;}"]+/g;
var scaled = (value, factor) => String(Math.round(Number(value) * factor * 100) / 100);
function styleText(svg, custom) {
  let out = svg;
  if (custom.font) {
    const stack = FONT_STACKS[custom.font];
    out = out.replace(FAMILY_ATTRIBUTE, () => `font-family="${stack}"`).replace(FAMILY_RULE, () => `font-family:${stack}`);
  }
  if (custom.textSize !== void 0 && custom.textSize !== 100) {
    const factor = custom.textSize / 100;
    out = out.replace(SIZE_ATTRIBUTE, (_all, value) => `font-size="${scaled(value, factor)}"`).replace(SIZE_RULE, (_all, value, unit) => `font-size:${scaled(value, factor)}${unit ?? ""}`);
  }
  if (custom.textColor) {
    const rule = `svg text:not(#x),svg tspan:not(#x){fill:${custom.textColor}}`;
    out = out.includes("</style>") ? out.replace("</style>", () => `${rule}
</style>`) : out.replace(/(<svg[^>]*>)/, (tag) => `${tag}<style>${rule}</style>`);
  }
  return out;
}
function styleAssets(assets, custom) {
  if (!custom || custom.font === void 0 && custom.textColor === void 0 && (custom.textSize === void 0 || custom.textSize === 100)) return assets;
  return assets.map((asset) => isDesignPicture(asset) ? { ...asset, content: styleText(asset.content, custom) } : asset);
}

// ../core/src/render.ts
function renderProfile(profile, config) {
  const template = getTemplate(config.template);
  if (!template) {
    const known = templates.map((t) => t.id).join(", ");
    throw new ConfigError(`Unknown template "${config.template}". Choose from: ${known}.`);
  }
  const rendered = template.render(withHue(profile, config), config);
  const output = { ...rendered, assets: styleAssets(rendered.assets, config.custom) };
  if (!config.credit) return output;
  const credit = variantsFor(config.theme).map((variant) => ({ path: assetPath("credit", variant), content: creditSvg(variant, config.motion) }));
  return { ...output, assets: [...output.assets, ...credit] };
}
function withHue(profile, config) {
  const hue = config.custom?.hue;
  if (hue === void 0 || !profile.avatar) return profile;
  return { ...profile, avatar: { ...profile.avatar, grid: { ...profile.avatar.grid, tint: tintForHue(hue) } } };
}

// src/avatar.ts
var import_jpeg_js = __toESM(require_jpeg_js());
var import_pngjs = __toESM(require_png());
var MAX_BYTES = 2e6;
function decode(bytes) {
  const isPng = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
  if (isPng) {
    const png = import_pngjs.PNG.sync.read(Buffer.from(bytes));
    return { mime: "image/png", width: png.width, height: png.height, data: png.data };
  }
  const isJpeg = bytes[0] === 255 && bytes[1] === 216;
  if (isJpeg) {
    const image = import_jpeg_js.default.decode(bytes, { useTArray: true });
    return { mime: "image/jpeg", width: image.width, height: image.height, data: image.data };
  }
  return null;
}
async function loadAvatar(url) {
  const sized = new URL(url);
  sized.searchParams.set("s", "128");
  const response = await fetch(sized);
  if (!response.ok) return null;
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length > MAX_BYTES) return null;
  const decoded = decode(bytes);
  if (!decoded) return null;
  return {
    dataUri: `data:${decoded.mime};base64,${Buffer.from(bytes).toString("base64")}`,
    grid: gridFromRgba(decoded.data, decoded.width, decoded.height)
  };
}

// src/main.ts
function input(name, fallback = "") {
  return process.env[`INPUT_${name.toUpperCase()}`]?.trim() || fallback;
}
async function readIfExists(path) {
  try {
    return await (0, import_promises.readFile)(path, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}
async function loadConfig(path) {
  const source = await readIfExists(path);
  if (source !== null) return parseConfigYaml(source);
  const owner = process.env.GITHUB_REPOSITORY_OWNER;
  if (!owner) throw new Error(`No ${path} found and GITHUB_REPOSITORY_OWNER is not set.`);
  console.log(`No ${path} found, using defaults for ${owner}.`);
  return defaultConfig(owner);
}
async function main() {
  const config = await loadConfig(input("config", "livebio.yml"));
  const readmePath = input("readme", "README.md");
  const profile = await fetchProfile(config.username, { token: input("token") || void 0 });
  if (getTemplate(config.template)?.needsAvatar) {
    try {
      const avatar = await loadAvatar(profile.avatarUrl);
      if (avatar) profile.avatar = avatar;
      else console.log("The profile picture is in a format livebio cannot read, so it is left out.");
    } catch (error) {
      console.log(`Could not load the profile picture, so it is left out: ${error.message}`);
    }
  }
  if (needsContributions(config)) {
    const token = input("token");
    if (!token) {
      console.log("::warning::No token was given, so the activity graph, city and snake are left out. Pass secrets.GITHUB_TOKEN as the token input.");
    } else {
      try {
        profile.contributions = await fetchContributions(config.username, { token });
      } catch (error) {
        console.log(`::warning::Could not read contributions, so the activity graph, city and snake are left out: ${error.message}`);
      }
    }
  }
  const output = renderProfile(profile, config);
  for (const asset of output.assets) {
    await (0, import_promises.mkdir)((0, import_node_path.dirname)(asset.path), { recursive: true });
    await (0, import_promises.writeFile)(asset.path, asset.content);
  }
  let present = [];
  try {
    present = (await (0, import_promises.readdir)(ASSET_DIR)).map((name) => `${ASSET_DIR}/${name}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const stale = staleAssets(present, output.assets.map((asset) => asset.path));
  for (const path of stale) await (0, import_promises.rm)(path);
  if (stale.length > 0) console.log(`Removed ${stale.length} image(s) from an earlier design: ${stale.join(", ")}`);
  const existing = await readIfExists(readmePath);
  await (0, import_promises.writeFile)(readmePath, applyToReadme(existing, output.readme));
  console.log(
    `Updated ${readmePath} and ${output.assets.length} image(s) for @${profile.login} with the "${config.template}" template.`
  );
}
main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`::error::${message}`);
  process.exitCode = 1;
});
/*! Bundled license information:

chess.js/dist/cjs/chess.js:
  (**
   * @license
   * Copyright (c) 2025, Jeff Hlywa (jhlywa@gmail.com)
   * All rights reserved.
   *
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are met:
   *
   * 1. Redistributions of source code must retain the above copyright notice,
   *    this list of conditions and the following disclaimer.
   * 2. Redistributions in binary form must reproduce the above copyright notice,
   *    this list of conditions and the following disclaimer in the documentation
   *    and/or other materials provided with the distribution.
   *
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
   * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
   * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
   * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
   * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
   * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
   * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
   * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
   * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
   * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
   * POSSIBILITY OF SUCH DAMAGE.
   *)
*/
