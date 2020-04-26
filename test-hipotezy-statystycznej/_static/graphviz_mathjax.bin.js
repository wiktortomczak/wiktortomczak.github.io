var $jscomp = $jscomp || {};
$jscomp.scope = {};
$jscomp.defineProperty = typeof Object.defineProperties == "function" ? Object.defineProperty : function(target, property, descriptor) {
  descriptor = descriptor;
  if (descriptor.get || descriptor.set) {
    throw new TypeError("ES3 does not support getters and setters.");
  }
  if (target == Array.prototype || target == Object.prototype) {
    return;
  }
  target[property] = descriptor.value;
};
$jscomp.getGlobal = function(maybeGlobal) {
  return typeof window != "undefined" && window === maybeGlobal ? maybeGlobal : typeof global != "undefined" && global != null ? global : maybeGlobal;
};
$jscomp.global = $jscomp.getGlobal(this);
$jscomp.SYMBOL_PREFIX = "jscomp_symbol_";
$jscomp.initSymbol = function() {
  $jscomp.initSymbol = function() {
  };
  if (!$jscomp.global.Symbol) {
    $jscomp.global.Symbol = $jscomp.Symbol;
  }
};
$jscomp.symbolCounter_ = 0;
$jscomp.Symbol = function(opt_description) {
  return $jscomp.SYMBOL_PREFIX + (opt_description || "") + $jscomp.symbolCounter_++;
};
$jscomp.initSymbolIterator = function() {
  $jscomp.initSymbol();
  var symbolIterator = $jscomp.global.Symbol.iterator;
  if (!symbolIterator) {
    symbolIterator = $jscomp.global.Symbol.iterator = $jscomp.global.Symbol("iterator");
  }
  if (typeof Array.prototype[symbolIterator] != "function") {
    $jscomp.defineProperty(Array.prototype, symbolIterator, {configurable:true, writable:true, value:function() {
      return $jscomp.arrayIterator(this);
    }});
  }
  $jscomp.initSymbolIterator = function() {
  };
};
$jscomp.arrayIterator = function(array) {
  var index = 0;
  return $jscomp.iteratorPrototype(function() {
    if (index < array.length) {
      return {done:false, value:array[index++]};
    } else {
      return {done:true};
    }
  });
};
$jscomp.iteratorPrototype = function(next) {
  $jscomp.initSymbolIterator();
  var iterator = {next:next};
  iterator[$jscomp.global.Symbol.iterator] = function() {
    return this;
  };
  return iterator;
};
$jscomp.makeIterator = function(iterable) {
  $jscomp.initSymbolIterator();
  var iteratorFunction = iterable[Symbol.iterator];
  return iteratorFunction ? iteratorFunction.call(iterable) : $jscomp.arrayIterator(iterable);
};
$jscomp.checkStringArgs = function(thisArg, arg, func) {
  if (thisArg == null) {
    throw new TypeError("The 'this' value for String.prototype." + func + " must not be null or undefined");
  }
  if (arg instanceof RegExp) {
    throw new TypeError("First argument to String.prototype." + func + " must not be a regular expression");
  }
  return thisArg + "";
};
$jscomp.polyfill = function(target, polyfill, fromLang, toLang) {
  if (!polyfill) {
    return;
  }
  var obj = $jscomp.global;
  var split = target.split(".");
  for (var i = 0;i < split.length - 1;i++) {
    var key = split[i];
    if (!(key in obj)) {
      obj[key] = {};
    }
    obj = obj[key];
  }
  var property = split[split.length - 1];
  var orig = obj[property];
  var impl = polyfill(orig);
  if (impl == orig || impl == null) {
    return;
  }
  $jscomp.defineProperty(obj, property, {configurable:true, writable:true, value:impl});
};
$jscomp.polyfill("String.prototype.repeat", function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(copies) {
    var string = $jscomp.checkStringArgs(this, null, "repeat");
    if (copies < 0 || copies > 1342177279) {
      throw new RangeError("Invalid count value");
    }
    copies |= 0;
    for (var result = "";copies;) {
      if (copies & 1) {
        result += string;
      }
      if (copies >>>= 1) {
        string += string;
      }
    }
    return result;
  };
  return polyfill;
}, "es6-impl", "es3");
$jscomp.findInternal = function(array, callback, thisArg) {
  if (array instanceof String) {
    array = String(array);
  }
  var len = array.length;
  for (var i = 0;i < len;i++) {
    var value = array[i];
    if (callback.call(thisArg, value, i, array)) {
      return {i:i, v:value};
    }
  }
  return {i:-1, v:void 0};
};
$jscomp.polyfill("Array.prototype.findIndex", function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(callback, opt_thisArg) {
    return $jscomp.findInternal(this, callback, opt_thisArg).i;
  };
  return polyfill;
}, "es6-impl", "es3");
$jscomp.polyfill("Array.prototype.find", function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(callback, opt_thisArg) {
    return $jscomp.findInternal(this, callback, opt_thisArg).v;
  };
  return polyfill;
}, "es6-impl", "es3");
$jscomp.polyfill("String.prototype.endsWith", function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(searchString, opt_position) {
    var string = $jscomp.checkStringArgs(this, searchString, "endsWith");
    searchString += "";
    if (opt_position === void 0) {
      opt_position = string.length;
    }
    var i = Math.max(0, Math.min(opt_position | 0, string.length));
    for (var j = searchString.length;j > 0 && i > 0;) {
      if (string[--i] != searchString[--j]) {
        return false;
      }
    }
    return j <= 0;
  };
  return polyfill;
}, "es6-impl", "es3");
$jscomp.polyfill("String.prototype.startsWith", function(orig) {
  if (orig) {
    return orig;
  }
  var polyfill = function(searchString, opt_position) {
    var string = $jscomp.checkStringArgs(this, searchString, "startsWith");
    searchString += "";
    var strLen = string.length;
    var searchLen = searchString.length;
    var i = Math.max(0, Math.min(opt_position | 0, string.length));
    for (var j = 0;j < searchLen && i < strLen;) {
      if (string[i++] != searchString[j++]) {
        return false;
      }
    }
    return j >= searchLen;
  };
  return polyfill;
}, "es6-impl", "es3");
$jscomp.EXPOSE_ASYNC_EXECUTOR = true;
$jscomp.FORCE_POLYFILL_PROMISE = false;
$jscomp.polyfill("Promise", function(NativePromise) {
  function AsyncExecutor() {
    this.batch_ = null;
  }
  function isObject(value) {
    switch(typeof value) {
      case "object":
        return value != null;
      case "function":
        return true;
      default:
        return false;
    }
  }
  if (NativePromise && !$jscomp.FORCE_POLYFILL_PROMISE) {
    return NativePromise;
  }
  AsyncExecutor.prototype.asyncExecute = function(f) {
    if (this.batch_ == null) {
      this.batch_ = [];
      this.asyncExecuteBatch_();
    }
    this.batch_.push(f);
    return this;
  };
  AsyncExecutor.prototype.asyncExecuteBatch_ = function() {
    var self = this;
    this.asyncExecuteFunction(function() {
      self.executeBatch_();
    });
  };
  var nativeSetTimeout = $jscomp.global["setTimeout"];
  AsyncExecutor.prototype.asyncExecuteFunction = function(f) {
    nativeSetTimeout(f, 0);
  };
  AsyncExecutor.prototype.executeBatch_ = function() {
    for (;this.batch_ && this.batch_.length;) {
      var executingBatch = this.batch_;
      this.batch_ = [];
      for (var i = 0;i < executingBatch.length;++i) {
        var f = executingBatch[i];
        delete executingBatch[i];
        try {
          f();
        } catch (error) {
          this.asyncThrow_(error);
        }
      }
    }
    this.batch_ = null;
  };
  AsyncExecutor.prototype.asyncThrow_ = function(exception) {
    this.asyncExecuteFunction(function() {
      throw exception;
    });
  };
  var PromiseState = {PENDING:0, FULFILLED:1, REJECTED:2};
  var PolyfillPromise = function(executor) {
    this.state_ = PromiseState.PENDING;
    this.result_ = undefined;
    this.onSettledCallbacks_ = [];
    var resolveAndReject = this.createResolveAndReject_();
    try {
      executor(resolveAndReject.resolve, resolveAndReject.reject);
    } catch (e) {
      resolveAndReject.reject(e);
    }
  };
  PolyfillPromise.prototype.createResolveAndReject_ = function() {
    function firstCallWins(method) {
      return function(x) {
        if (!alreadyCalled) {
          alreadyCalled = true;
          method.call(thisPromise, x);
        }
      };
    }
    var thisPromise = this;
    var alreadyCalled = false;
    return {resolve:firstCallWins(this.resolveTo_), reject:firstCallWins(this.reject_)};
  };
  PolyfillPromise.prototype.resolveTo_ = function(value) {
    if (value === this) {
      this.reject_(new TypeError("A Promise cannot resolve to itself"));
    } else {
      if (value instanceof PolyfillPromise) {
        this.settleSameAsPromise_(value);
      } else {
        if (isObject(value)) {
          this.resolveToNonPromiseObj_(value);
        } else {
          this.fulfill_(value);
        }
      }
    }
  };
  PolyfillPromise.prototype.resolveToNonPromiseObj_ = function(obj) {
    var thenMethod = undefined;
    try {
      thenMethod = obj.then;
    } catch (error) {
      this.reject_(error);
      return;
    }
    if (typeof thenMethod == "function") {
      this.settleSameAsThenable_(thenMethod, obj);
    } else {
      this.fulfill_(obj);
    }
  };
  PolyfillPromise.prototype.reject_ = function(reason) {
    this.settle_(PromiseState.REJECTED, reason);
  };
  PolyfillPromise.prototype.fulfill_ = function(value) {
    this.settle_(PromiseState.FULFILLED, value);
  };
  PolyfillPromise.prototype.settle_ = function(settledState, valueOrReason) {
    if (this.state_ != PromiseState.PENDING) {
      throw new Error("Cannot settle(" + settledState + ", " + valueOrReason | "): Promise already settled in state" + this.state_);
    }
    this.state_ = settledState;
    this.result_ = valueOrReason;
    this.executeOnSettledCallbacks_();
  };
  PolyfillPromise.prototype.executeOnSettledCallbacks_ = function() {
    if (this.onSettledCallbacks_ != null) {
      var callbacks = this.onSettledCallbacks_;
      for (var i = 0;i < callbacks.length;++i) {
        callbacks[i].call();
        callbacks[i] = null;
      }
      this.onSettledCallbacks_ = null;
    }
  };
  var asyncExecutor = new AsyncExecutor;
  PolyfillPromise.prototype.settleSameAsPromise_ = function(promise) {
    var methods = this.createResolveAndReject_();
    promise.callWhenSettled_(methods.resolve, methods.reject);
  };
  PolyfillPromise.prototype.settleSameAsThenable_ = function(thenMethod, thenable) {
    var methods = this.createResolveAndReject_();
    try {
      thenMethod.call(thenable, methods.resolve, methods.reject);
    } catch (error) {
      methods.reject(error);
    }
  };
  PolyfillPromise.prototype.then = function(onFulfilled, onRejected) {
    function createCallback(paramF, defaultF) {
      if (typeof paramF == "function") {
        return function(x) {
          try {
            resolveChild(paramF(x));
          } catch (error) {
            rejectChild(error);
          }
        };
      } else {
        return defaultF;
      }
    }
    var resolveChild;
    var rejectChild;
    var childPromise = new PolyfillPromise(function(resolve, reject) {
      resolveChild = resolve;
      rejectChild = reject;
    });
    this.callWhenSettled_(createCallback(onFulfilled, resolveChild), createCallback(onRejected, rejectChild));
    return childPromise;
  };
  PolyfillPromise.prototype.catch = function(onRejected) {
    return this.then(undefined, onRejected);
  };
  PolyfillPromise.prototype.callWhenSettled_ = function(onFulfilled, onRejected) {
    function callback() {
      switch(thisPromise.state_) {
        case PromiseState.FULFILLED:
          onFulfilled(thisPromise.result_);
          break;
        case PromiseState.REJECTED:
          onRejected(thisPromise.result_);
          break;
        default:
          throw new Error("Unexpected state: " + thisPromise.state_);
      }
    }
    var thisPromise = this;
    if (this.onSettledCallbacks_ == null) {
      asyncExecutor.asyncExecute(callback);
    } else {
      this.onSettledCallbacks_.push(function() {
        asyncExecutor.asyncExecute(callback);
      });
    }
  };
  PolyfillPromise.resolve = function(opt_value) {
    if (opt_value instanceof PolyfillPromise) {
      return opt_value;
    } else {
      return new PolyfillPromise(function(resolve, reject) {
        resolve(opt_value);
      });
    }
  };
  PolyfillPromise.reject = function(opt_reason) {
    return new PolyfillPromise(function(resolve, reject) {
      reject(opt_reason);
    });
  };
  PolyfillPromise.race = function(thenablesOrValues) {
    return new PolyfillPromise(function(resolve, reject) {
      var iterator = $jscomp.makeIterator(thenablesOrValues);
      for (var iterRec = iterator.next();!iterRec.done;iterRec = iterator.next()) {
        PolyfillPromise.resolve(iterRec.value).callWhenSettled_(resolve, reject);
      }
    });
  };
  PolyfillPromise.all = function(thenablesOrValues) {
    var iterator = $jscomp.makeIterator(thenablesOrValues);
    var iterRec = iterator.next();
    if (iterRec.done) {
      return PolyfillPromise.resolve([]);
    } else {
      return new PolyfillPromise(function(resolveAll, rejectAll) {
        function onFulfilled(i) {
          return function(ithResult) {
            resultsArray[i] = ithResult;
            unresolvedCount--;
            if (unresolvedCount == 0) {
              resolveAll(resultsArray);
            }
          };
        }
        var resultsArray = [];
        var unresolvedCount = 0;
        do {
          resultsArray.push(undefined);
          unresolvedCount++;
          PolyfillPromise.resolve(iterRec.value).callWhenSettled_(onFulfilled(resultsArray.length - 1), rejectAll);
          iterRec = iterator.next();
        } while (!iterRec.done);
      });
    }
  };
  if ($jscomp.EXPOSE_ASYNC_EXECUTOR) {
    PolyfillPromise["$jscomp$new$AsyncExecutor"] = function() {
      return new AsyncExecutor;
    };
  }
  return PolyfillPromise;
}, "es6-impl", "es3");
var COMPILED = true;
var goog = goog || {};
goog.global = this;
goog.global.CLOSURE_UNCOMPILED_DEFINES;
goog.global.CLOSURE_DEFINES;
goog.isDef = function(val) {
  return val !== void 0;
};
goog.isString = function(val) {
  return typeof val == "string";
};
goog.isBoolean = function(val) {
  return typeof val == "boolean";
};
goog.isNumber = function(val) {
  return typeof val == "number";
};
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if (!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0]);
  }
  for (var part;parts.length && (part = parts.shift());) {
    if (!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object;
    } else {
      if (cur[part] && cur[part] !== Object.prototype[part]) {
        cur = cur[part];
      } else {
        cur = cur[part] = {};
      }
    }
  }
};
goog.define = function(name, defaultValue) {
  var value = defaultValue;
  if (!COMPILED) {
    if (goog.global.CLOSURE_UNCOMPILED_DEFINES && goog.global.CLOSURE_UNCOMPILED_DEFINES.nodeType === undefined && Object.prototype.hasOwnProperty.call(goog.global.CLOSURE_UNCOMPILED_DEFINES, name)) {
      value = goog.global.CLOSURE_UNCOMPILED_DEFINES[name];
    } else {
      if (goog.global.CLOSURE_DEFINES && goog.global.CLOSURE_DEFINES.nodeType === undefined && Object.prototype.hasOwnProperty.call(goog.global.CLOSURE_DEFINES, name)) {
        value = goog.global.CLOSURE_DEFINES[name];
      }
    }
  }
  goog.exportPath_(name, value);
};
goog.DEBUG = true;
goog.LOCALE = "en";
goog.TRUSTED_SITE = true;
goog.STRICT_MODE_COMPATIBLE = false;
goog.DISALLOW_TEST_ONLY_CODE = COMPILED && !goog.DEBUG;
goog.ENABLE_CHROME_APP_SAFE_SCRIPT_LOADING = false;
goog.provide = function(name) {
  if (goog.isInModuleLoader_()) {
    throw new Error("goog.provide can not be used within a goog.module.");
  }
  if (!COMPILED) {
    if (goog.isProvided_(name)) {
      throw new Error('Namespace "' + name + '" already declared.');
    }
  }
  goog.constructNamespace_(name);
};
goog.constructNamespace_ = function(name, opt_obj) {
  if (!COMPILED) {
    delete goog.implicitNamespaces_[name];
    for (var namespace = name;namespace = namespace.substring(0, namespace.lastIndexOf("."));) {
      if (goog.getObjectByName(namespace)) {
        break;
      }
      goog.implicitNamespaces_[namespace] = true;
    }
  }
  goog.exportPath_(name, opt_obj);
};
goog.VALID_MODULE_RE_ = /^[a-zA-Z_$][a-zA-Z0-9._$]*$/;
goog.module = function(name) {
  if (!goog.isString(name) || !name || name.search(goog.VALID_MODULE_RE_) == -1) {
    throw new Error("Invalid module identifier");
  }
  if (!goog.isInModuleLoader_()) {
    throw new Error("Module " + name + " has been loaded incorrectly. Note, " + "modules cannot be loaded as normal scripts. They require some kind of " + "pre-processing step. You're likely trying to load a module via a " + "script tag or as a part of a concatenated bundle without rewriting the " + "module. For more info see: " + "https://github.com/google/closure-library/wiki/goog.module:-an-ES6-module-like-alternative-to-goog.provide.");
  }
  if (goog.moduleLoaderState_.moduleName) {
    throw new Error("goog.module may only be called once per module.");
  }
  goog.moduleLoaderState_.moduleName = name;
  if (!COMPILED) {
    if (goog.isProvided_(name)) {
      throw new Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
  }
};
goog.module.get = function(name) {
  return goog.module.getInternal_(name);
};
goog.module.getInternal_ = function(name) {
  if (!COMPILED) {
    if (name in goog.loadedModules_) {
      return goog.loadedModules_[name];
    } else {
      if (!goog.implicitNamespaces_[name]) {
        var ns = goog.getObjectByName(name);
        return ns != null ? ns : null;
      }
    }
  }
  return null;
};
goog.moduleLoaderState_ = null;
goog.isInModuleLoader_ = function() {
  return goog.moduleLoaderState_ != null;
};
goog.module.declareLegacyNamespace = function() {
  if (!COMPILED && !goog.isInModuleLoader_()) {
    throw new Error("goog.module.declareLegacyNamespace must be called from " + "within a goog.module");
  }
  if (!COMPILED && !goog.moduleLoaderState_.moduleName) {
    throw new Error("goog.module must be called prior to " + "goog.module.declareLegacyNamespace.");
  }
  goog.moduleLoaderState_.declareLegacyNamespace = true;
};
goog.setTestOnly = function(opt_message) {
  if (goog.DISALLOW_TEST_ONLY_CODE) {
    opt_message = opt_message || "";
    throw new Error("Importing test-only code into non-debug environment" + (opt_message ? ": " + opt_message : "."));
  }
};
goog.forwardDeclare = function(name) {
};
if (!COMPILED) {
  goog.isProvided_ = function(name) {
    return name in goog.loadedModules_ || !goog.implicitNamespaces_[name] && goog.isDefAndNotNull(goog.getObjectByName(name));
  };
  goog.implicitNamespaces_ = {"goog.module":true};
}
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for (var i = 0;i < parts.length;i++) {
    cur = cur[parts[i]];
    if (!goog.isDefAndNotNull(cur)) {
      return null;
    }
  }
  return cur;
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for (var x in obj) {
    global[x] = obj[x];
  }
};
goog.addDependency = function(relPath, provides, requires, opt_loadFlags) {
  if (goog.DEPENDENCIES_ENABLED) {
    var loader = goog.getLoader_();
    if (loader) {
      loader.addDependency(relPath, provides, requires, opt_loadFlags);
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.logToConsole_ = function(msg) {
  if (goog.global.console) {
    goog.global.console["error"](msg);
  }
};
goog.require = function(name) {
  if (goog.ENABLE_DEBUG_LOADER && goog.debugLoader_) {
    goog.getLoader_().earlyProcessLoad(name);
  }
  if (!COMPILED) {
    if (goog.isProvided_(name)) {
      if (goog.isInModuleLoader_()) {
        return goog.module.getInternal_(name);
      }
    } else {
      if (goog.ENABLE_DEBUG_LOADER) {
        var moduleLoaderState = goog.moduleLoaderState_;
        goog.moduleLoaderState_ = null;
        try {
          var loader = goog.getLoader_();
          if (loader) {
            loader.load(name);
          } else {
            goog.logToConsole_("Could not load " + name + " because there is no debug loader.");
          }
        } finally {
          goog.moduleLoaderState_ = moduleLoaderState;
        }
      }
    }
    return null;
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.abstractMethod = function() {
  throw new Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.instance_ = undefined;
  ctor.getInstance = function() {
    if (ctor.instance_) {
      return ctor.instance_;
    }
    if (goog.DEBUG) {
      goog.instantiatedSingletons_[goog.instantiatedSingletons_.length] = ctor;
    }
    return ctor.instance_ = new ctor;
  };
};
goog.instantiatedSingletons_ = [];
goog.LOAD_MODULE_USING_EVAL = true;
goog.SEAL_MODULE_EXPORTS = goog.DEBUG;
goog.loadedModules_ = {};
goog.DEPENDENCIES_ENABLED = !COMPILED && goog.ENABLE_DEBUG_LOADER;
goog.TRANSPILE = "detect";
goog.TRANSPILER = "transpile.js";
goog.DEBUG_LOADER = "";
goog.hasBadLetScoping = null;
goog.useSafari10Workaround = function() {
  if (goog.hasBadLetScoping == null) {
    var hasBadLetScoping;
    try {
      hasBadLetScoping = !eval('"use strict";' + "let x = 1; function f() { return typeof x; };" + 'f() == "number";');
    } catch (e) {
      hasBadLetScoping = false;
    }
    goog.hasBadLetScoping = hasBadLetScoping;
  }
  return goog.hasBadLetScoping;
};
goog.workaroundSafari10EvalBug = function(moduleDef) {
  return "(function(){" + moduleDef + "\n" + ";" + "})();\n";
};
goog.loadModule = function(moduleDef) {
  var previousState = goog.moduleLoaderState_;
  try {
    goog.moduleLoaderState_ = {moduleName:undefined, declareLegacyNamespace:false};
    var exports;
    if (goog.isFunction(moduleDef)) {
      exports = moduleDef.call(undefined, {});
    } else {
      if (goog.isString(moduleDef)) {
        if (goog.useSafari10Workaround()) {
          moduleDef = goog.workaroundSafari10EvalBug(moduleDef);
        }
        exports = goog.loadModuleFromSource_.call(undefined, moduleDef);
      } else {
        throw new Error("Invalid module definition");
      }
    }
    var moduleName = goog.moduleLoaderState_.moduleName;
    if (!goog.isString(moduleName) || !moduleName) {
      throw new Error('Invalid module name "' + moduleName + '"');
    }
    if (goog.moduleLoaderState_.declareLegacyNamespace) {
      goog.constructNamespace_(moduleName, exports);
    } else {
      if (goog.SEAL_MODULE_EXPORTS && Object.seal && typeof exports == "object" && exports != null) {
        Object.seal(exports);
      }
    }
    goog.loadedModules_[moduleName] = exports;
  } finally {
    goog.moduleLoaderState_ = previousState;
  }
};
goog.loadModuleFromSource_ = function() {
  var exports = {};
  eval(arguments[0]);
  return exports;
};
goog.normalizePath_ = function(path) {
  var components = path.split("/");
  for (var i = 0;i < components.length;) {
    if (components[i] == ".") {
      components.splice(i, 1);
    } else {
      if (i && components[i] == ".." && components[i - 1] && components[i - 1] != "..") {
        components.splice(--i, 2);
      } else {
        i++;
      }
    }
  }
  return components.join("/");
};
goog.global.CLOSURE_LOAD_FILE_SYNC;
goog.loadFileSync_ = function(src) {
  if (goog.global.CLOSURE_LOAD_FILE_SYNC) {
    return goog.global.CLOSURE_LOAD_FILE_SYNC(src);
  } else {
    try {
      var xhr = new goog.global["XMLHttpRequest"];
      xhr.open("get", src, false);
      xhr.send();
      return xhr.status == 0 || xhr.status == 200 ? xhr.responseText : null;
    } catch (err) {
      return null;
    }
  }
};
goog.transpile_ = function(code$jscomp$0, path$jscomp$0) {
  var jscomp = goog.global["$jscomp"];
  if (!jscomp) {
    goog.global["$jscomp"] = jscomp = {};
  }
  var transpile = jscomp.transpile;
  if (!transpile) {
    var transpilerPath = goog.basePath + goog.TRANSPILER;
    var transpilerCode = goog.loadFileSync_(transpilerPath);
    if (transpilerCode) {
      (function() {
        eval(transpilerCode + "\n//# sourceURL=" + transpilerPath);
      }).call(goog.global);
      if (goog.global["$gwtExport"] && goog.global["$gwtExport"]["$jscomp"] && !goog.global["$gwtExport"]["$jscomp"]["transpile"]) {
        throw new Error('The transpiler did not properly export the "transpile" ' + "method. $gwtExport: " + JSON.stringify(goog.global["$gwtExport"]));
      }
      goog.global["$jscomp"].transpile = goog.global["$gwtExport"]["$jscomp"]["transpile"];
      jscomp = goog.global["$jscomp"];
      transpile = jscomp.transpile;
    }
  }
  if (!transpile) {
    var suffix = " requires transpilation but no transpiler was found.";
    transpile = jscomp.transpile = function(code, path) {
      goog.logToConsole_(path + suffix);
      return code;
    };
  }
  return transpile(code$jscomp$0, path$jscomp$0);
};
goog.typeOf = function(value) {
  var s = typeof value;
  if (s == "object") {
    if (value) {
      if (value instanceof Array) {
        return "array";
      } else {
        if (value instanceof Object) {
          return s;
        }
      }
      var className = Object.prototype.toString.call(value);
      if (className == "[object Window]") {
        return "object";
      }
      if (className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return "array";
      }
      if (className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return "function";
      }
    } else {
      return "null";
    }
  } else {
    if (s == "function" && typeof value.call == "undefined") {
      return "object";
    }
  }
  return s;
};
goog.isNull = function(val) {
  return val === null;
};
goog.isDefAndNotNull = function(val) {
  return val != null;
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array";
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number";
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function";
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function";
};
goog.isObject = function(val) {
  var type = typeof val;
  return type == "object" && val != null || type == "function";
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_);
};
goog.hasUid = function(obj) {
  return !!obj[goog.UID_PROPERTY_];
};
goog.removeUid = function(obj) {
  if (obj !== null && "removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_);
  }
  try {
    delete obj[goog.UID_PROPERTY_];
  } catch (ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + (Math.random() * 1e9 >>> 0);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if (type == "object" || type == "array") {
    if (obj.clone) {
      return obj.clone();
    }
    var clone = type == "array" ? [] : {};
    for (var key in obj) {
      clone[key] = goog.cloneObject(obj[key]);
    }
    return clone;
  }
  return obj;
};
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments);
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if (!fn) {
    throw new Error;
  }
  if (arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs);
    };
  } else {
    return function() {
      return fn.apply(selfObj, arguments);
    };
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if (Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_;
  } else {
    goog.bind = goog.bindJs_;
  }
  return goog.bind.apply(null, arguments);
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = args.slice();
    newArgs.push.apply(newArgs, arguments);
    return fn.apply(this, newArgs);
  };
};
goog.mixin = function(target, source) {
  for (var x in source) {
    target[x] = source[x];
  }
};
goog.now = goog.TRUSTED_SITE && Date.now || function() {
  return +new Date;
};
goog.globalEval = function(script) {
  if (goog.global.execScript) {
    goog.global.execScript(script, "JavaScript");
  } else {
    if (goog.global.eval) {
      if (goog.evalWorksForGlobals_ == null) {
        try {
          goog.global.eval("var _evalTest_ = 1;");
        } catch (ignore) {
        }
        if (typeof goog.global["_evalTest_"] != "undefined") {
          try {
            delete goog.global["_evalTest_"];
          } catch (ignore$0) {
          }
          goog.evalWorksForGlobals_ = true;
        } else {
          goog.evalWorksForGlobals_ = false;
        }
      }
      if (goog.evalWorksForGlobals_) {
        goog.global.eval(script);
      } else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("SCRIPT");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.head.appendChild(scriptElt);
        doc.head.removeChild(scriptElt);
      }
    } else {
      throw new Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.global.CLOSURE_CSS_NAME_MAP_FN;
goog.getCssName = function(className, opt_modifier) {
  if (String(className).charAt(0) == ".") {
    throw new Error('className passed in goog.getCssName must not start with ".".' + " You passed: " + className);
  }
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName;
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for (var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]));
    }
    return mapped.join("-");
  };
  var rename;
  if (goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts;
  } else {
    rename = function(a) {
      return a;
    };
  }
  var result = opt_modifier ? className + "-" + rename(opt_modifier) : rename(className);
  if (goog.global.CLOSURE_CSS_NAME_MAP_FN) {
    return goog.global.CLOSURE_CSS_NAME_MAP_FN(result);
  }
  return result;
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style;
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if (!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING;
}
goog.getMsg = function(str, opt_values) {
  if (opt_values) {
    str = str.replace(/\{\$([^}]+)}/g, function(match, key) {
      return opt_values != null && key in opt_values ? opt_values[key] : match;
    });
  }
  return str;
};
goog.getMsgWithFallback = function(a, b) {
  return a;
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo);
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol;
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor;
  childCtor.base = function(me, methodName, var_args) {
    var args = new Array(arguments.length - 2);
    for (var i = 2;i < arguments.length;i++) {
      args[i - 2] = arguments[i];
    }
    return parentCtor.prototype[methodName].apply(me, args);
  };
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if (goog.STRICT_MODE_COMPATIBLE || goog.DEBUG && !caller) {
    throw new Error("arguments.caller not defined.  goog.base() cannot be used " + "with strict mode code. See " + "http://www.ecma-international.org/ecma-262/5.1/#sec-C");
  }
  if (caller.superClass_) {
    var ctorArgs = new Array(arguments.length - 1);
    for (var i = 1;i < arguments.length;i++) {
      ctorArgs[i - 1] = arguments[i];
    }
    return caller.superClass_.constructor.apply(me, ctorArgs);
  }
  var args = new Array(arguments.length - 2);
  for (i = 2;i < arguments.length;i++) {
    args[i - 2] = arguments[i];
  }
  var foundCaller = false;
  for (var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if (ctor.prototype[opt_methodName] === caller) {
      foundCaller = true;
    } else {
      if (foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args);
      }
    }
  }
  if (me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args);
  } else {
    throw new Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  if (goog.isInModuleLoader_()) {
    throw new Error("goog.scope is not supported within a goog.module.");
  }
  fn.call(goog.global);
};
if (!COMPILED) {
  goog.global["COMPILED"] = COMPILED;
}
goog.defineClass = function(superClass, def) {
  var constructor = def.constructor;
  var statics = def.statics;
  if (!constructor || constructor == Object.prototype.constructor) {
    constructor = function() {
      throw new Error("cannot instantiate an interface (no constructor defined).");
    };
  }
  var cls = goog.defineClass.createSealingConstructor_(constructor, superClass);
  if (superClass) {
    goog.inherits(cls, superClass);
  }
  delete def.constructor;
  delete def.statics;
  goog.defineClass.applyProperties_(cls.prototype, def);
  if (statics != null) {
    if (statics instanceof Function) {
      statics(cls);
    } else {
      goog.defineClass.applyProperties_(cls, statics);
    }
  }
  return cls;
};
goog.defineClass.ClassDescriptor;
goog.defineClass.SEAL_CLASS_INSTANCES = goog.DEBUG;
goog.defineClass.createSealingConstructor_ = function(ctr, superClass) {
  if (!goog.defineClass.SEAL_CLASS_INSTANCES) {
    return ctr;
  }
  var superclassSealable = !goog.defineClass.isUnsealable_(superClass);
  var wrappedCtr = function() {
    var instance = ctr.apply(this, arguments) || this;
    instance[goog.UID_PROPERTY_] = instance[goog.UID_PROPERTY_];
    if (this.constructor === wrappedCtr && superclassSealable && Object.seal instanceof Function) {
      Object.seal(instance);
    }
    return instance;
  };
  return wrappedCtr;
};
goog.defineClass.isUnsealable_ = function(ctr) {
  return ctr && ctr.prototype && ctr.prototype[goog.UNSEALABLE_CONSTRUCTOR_PROPERTY_];
};
goog.defineClass.OBJECT_PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.defineClass.applyProperties_ = function(target, source) {
  for (var key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      target[key] = source[key];
    }
  }
  for (var i = 0;i < goog.defineClass.OBJECT_PROTOTYPE_FIELDS_.length;i++) {
    key = goog.defineClass.OBJECT_PROTOTYPE_FIELDS_[i];
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      target[key] = source[key];
    }
  }
};
goog.tagUnsealableClass = function(ctr) {
  if (!COMPILED && goog.defineClass.SEAL_CLASS_INSTANCES) {
    ctr.prototype[goog.UNSEALABLE_CONSTRUCTOR_PROPERTY_] = true;
  }
};
goog.UNSEALABLE_CONSTRUCTOR_PROPERTY_ = "goog_defineClass_legacy_unsealable";
if (goog.DEPENDENCIES_ENABLED) {
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return doc != null && "write" in doc;
  };
  goog.findBasePath_ = function() {
    if (goog.isDef(goog.global.CLOSURE_BASE_PATH) && goog.isString(goog.global.CLOSURE_BASE_PATH)) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return;
    } else {
      if (!goog.inHtmlDocument_()) {
        return;
      }
    }
    var doc = goog.global.document;
    var currentScript = doc.currentScript;
    if (currentScript) {
      var scripts = [currentScript];
    } else {
      scripts = doc.getElementsByTagName("SCRIPT");
    }
    for (var i = scripts.length - 1;i >= 0;--i) {
      var script = scripts[i];
      var src = script.src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if (src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return;
      }
    }
  };
  goog.findBasePath_();
  goog.Transpiler = function() {
    this.requiresTranspilation_ = null;
  };
  goog.Transpiler.prototype.createRequiresTranspilation_ = function() {
    function addNewerLanguageTranspilationCheck(modeName, isSupported) {
      if (transpilationRequiredForAllLaterModes) {
        requiresTranspilation[modeName] = true;
      } else {
        if (isSupported()) {
          requiresTranspilation[modeName] = false;
        } else {
          requiresTranspilation[modeName] = true;
          transpilationRequiredForAllLaterModes = true;
        }
      }
    }
    function evalCheck(code) {
      try {
        return !!eval(code);
      } catch (ignored) {
        return false;
      }
    }
    var requiresTranspilation = {"es3":false};
    var transpilationRequiredForAllLaterModes = false;
    var userAgent = goog.global.navigator && goog.global.navigator.userAgent ? goog.global.navigator.userAgent : "";
    addNewerLanguageTranspilationCheck("es5", function() {
      return evalCheck("[1,].length==1");
    });
    addNewerLanguageTranspilationCheck("es6", function() {
      var re = /Edge\/(\d+)(\.\d)*/i;
      var edgeUserAgent = userAgent.match(re);
      if (edgeUserAgent && Number(edgeUserAgent[1]) < 15) {
        return false;
      }
      var es6fullTest = "class X{constructor(){if(new.target!=String)throw 1;this.x=42}}" + "let q=Reflect.construct(X,[],String);if(q.x!=42||!(q instanceof " + "String))throw 1;for(const a of[2,3]){if(a==2)continue;function " + "f(z={a}){let a=0;return z.a}{function f(){return 0;}}return f()" + "==3}";
      return evalCheck('(()=>{"use strict";' + es6fullTest + "})()");
    });
    addNewerLanguageTranspilationCheck("es6-impl", function() {
      return true;
    });
    addNewerLanguageTranspilationCheck("es7", function() {
      return evalCheck("2 ** 2 == 4");
    });
    addNewerLanguageTranspilationCheck("es8", function() {
      return evalCheck("async () => 1, true");
    });
    return requiresTranspilation;
  };
  goog.Transpiler.prototype.needsTranspile = function(lang) {
    if (goog.TRANSPILE == "always") {
      return true;
    } else {
      if (goog.TRANSPILE == "never") {
        return false;
      } else {
        if (!this.requiresTranspilation_) {
          this.requiresTranspilation_ = this.createRequiresTranspilation_();
        }
      }
    }
    if (lang in this.requiresTranspilation_) {
      return this.requiresTranspilation_[lang];
    } else {
      throw new Error("Unknown language mode: " + lang);
    }
  };
  goog.Transpiler.prototype.transpile = function(code, path) {
    return goog.transpile_(code, path);
  };
  goog.transpiler_ = new goog.Transpiler;
  goog.DebugLoader = function() {
    this.dependencies_ = {loadFlags:{}, nameToPath:{}, requires:{}, visited:{}, written:{}, deferred:{}};
    this.oldIeWaiting_ = false;
    this.queuedModules_ = [];
    this.lastNonModuleScriptIndex_ = 0;
  };
  goog.DebugLoader.IS_OLD_IE_ = !!(!goog.global.atob && goog.global.document && goog.global.document.all);
  goog.DebugLoader.prototype.earlyProcessLoad = function(name) {
    if (goog.DebugLoader.IS_OLD_IE_) {
      this.maybeProcessDeferredDep_(name);
    }
  };
  goog.DebugLoader.prototype.load = function(name) {
    var pathToLoad = this.getPathFromDeps_(name);
    if (!pathToLoad) {
      var errorMessage = "goog.require could not find: " + name;
      this.logToConsole(errorMessage);
      throw Error(errorMessage);
    } else {
      var visitNode = function(path) {
        if (path in deps.written) {
          return;
        }
        if (path in deps.visited) {
          return;
        }
        deps.visited[path] = true;
        if (path in deps.requires) {
          for (var requireName in deps.requires[path]) {
            if (!loader.isProvided(requireName)) {
              if (requireName in deps.nameToPath) {
                visitNode(deps.nameToPath[requireName]);
              } else {
                throw Error("Undefined nameToPath for " + requireName);
              }
            }
          }
        }
        if (!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path);
        }
      };
      var scripts = [];
      var seenScript = {};
      var deps = this.dependencies_;
      var loader = this;
      visitNode(pathToLoad);
      for (var i = 0;i < scripts.length;i++) {
        var path$jscomp$0 = scripts[i];
        this.dependencies_.written[path$jscomp$0] = true;
      }
      for (i = 0;i < scripts.length;i++) {
        path$jscomp$0 = scripts[i];
        if (path$jscomp$0) {
          var loadFlags = deps.loadFlags[path$jscomp$0] || {};
          var languageLevel = loadFlags["lang"] || "es3";
          var needsTranspile = this.getTranspiler().needsTranspile(languageLevel);
          if (loadFlags["module"] == "goog" || needsTranspile) {
            this.importProcessedScript_(goog.basePath + path$jscomp$0, loadFlags["module"] == "goog", needsTranspile);
          } else {
            this.importScript_(goog.basePath + path$jscomp$0);
          }
        } else {
          throw Error("Undefined script input");
        }
      }
    }
  };
  goog.DebugLoader.prototype.addDependency = function(relPath, provides, requires, opt_loadFlags) {
    var provide;
    var require;
    var path = relPath.replace(/\\/g, "/");
    var deps = this.dependencies_;
    if (!opt_loadFlags || typeof opt_loadFlags === "boolean") {
      opt_loadFlags = opt_loadFlags ? {"module":"goog"} : {};
    }
    for (var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      deps.loadFlags[path] = opt_loadFlags;
    }
    for (var j = 0;require = requires[j];j++) {
      if (!(path in deps.requires)) {
        deps.requires[path] = {};
      }
      deps.requires[path][require] = true;
    }
  };
  goog.DebugLoader.prototype.importScript_ = function(src, opt_sourceText) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.bind(this.writeScriptTag_, this);
    if (importScript(src, opt_sourceText)) {
      this.dependencies_.written[src] = true;
    }
  };
  goog.DebugLoader.prototype.importProcessedScript_ = function(src, isModule, needsTranspile) {
    var bootstrap = 'goog.debugLoader_.retrieveAndExec_("' + src + '", ' + isModule + ", " + needsTranspile + ");";
    this.importScript_("", bootstrap);
  };
  goog.DebugLoader.prototype.retrieveAndExec_ = function(src, isModule, needsTranspile) {
    if (!COMPILED) {
      var originalPath = src;
      src = this.normalizePath(src);
      var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.bind(this.writeScriptTag_, this);
      var scriptText = this.loadFileSync(src);
      if (scriptText == null) {
        throw new Error('Load of "' + src + '" failed');
      }
      if (needsTranspile) {
        scriptText = this.getTranspiler().transpile(scriptText, src);
      }
      if (isModule) {
        scriptText = this.wrapModule_(src, scriptText);
      } else {
        scriptText += "\n//# sourceURL=" + src;
      }
      var isOldIE = goog.DebugLoader.IS_OLD_IE_;
      if (isOldIE && this.oldIeWaiting_) {
        this.dependencies_.deferred[originalPath] = scriptText;
        this.queuedModules_.push(originalPath);
      } else {
        importScript(src, scriptText);
      }
    }
  };
  goog.DebugLoader.prototype.wrapModule_ = function(srcUrl, scriptText) {
    if (!goog.LOAD_MODULE_USING_EVAL || !goog.isDef(goog.global.JSON)) {
      return "" + "goog.loadModule(function(exports) {" + '"use strict";' + scriptText + "\n" + ";return exports" + "});" + "\n//# sourceURL=" + srcUrl + "\n";
    } else {
      return "" + "goog.loadModule(" + goog.global.JSON.stringify(scriptText + "\n//# sourceURL=" + srcUrl + "\n") + ");";
    }
  };
  goog.DebugLoader.prototype.loadQueuedModules_ = function() {
    var count = this.queuedModules_.length;
    if (count > 0) {
      var queue = this.queuedModules_;
      this.queuedModules_ = [];
      for (var i = 0;i < count;i++) {
        var path = queue[i];
        this.maybeProcessDeferredPath_(path);
      }
    }
    this.oldIeWaiting_ = false;
  };
  goog.DebugLoader.prototype.maybeProcessDeferredDep_ = function(name) {
    if (this.isDeferredModule_(name) && this.allDepsAreAvailable_(name)) {
      var path = this.getPathFromDeps_(name);
      this.maybeProcessDeferredPath_(goog.basePath + path);
    }
  };
  goog.DebugLoader.prototype.isDeferredModule_ = function(name) {
    var path = this.getPathFromDeps_(name);
    var loadFlags = path && this.dependencies_.loadFlags[path] || {};
    var languageLevel = loadFlags["lang"] || "es3";
    if (path && (loadFlags["module"] == "goog" || this.getTranspiler().needsTranspile(languageLevel))) {
      var abspath = goog.basePath + path;
      return abspath in this.dependencies_.deferred;
    }
    return false;
  };
  goog.DebugLoader.prototype.allDepsAreAvailable_ = function(name) {
    var path = this.getPathFromDeps_(name);
    if (path && path in this.dependencies_.requires) {
      for (var requireName in this.dependencies_.requires[path]) {
        if (!this.isProvided(requireName) && !this.isDeferredModule_(requireName)) {
          return false;
        }
      }
    }
    return true;
  };
  goog.DebugLoader.prototype.maybeProcessDeferredPath_ = function(abspath) {
    if (abspath in this.dependencies_.deferred) {
      var src = this.dependencies_.deferred[abspath];
      delete this.dependencies_.deferred[abspath];
      goog.globalEval(src);
    }
  };
  goog.DebugLoader.prototype.writeScriptSrcNode_ = function(src) {
    goog.global.document.write('<script type="text/javascript" src="' + src + '"></' + "script>");
  };
  goog.DebugLoader.prototype.appendScriptSrcNode_ = function(src) {
    var doc = goog.global.document;
    var scriptEl = doc.createElement("script");
    scriptEl.type = "text/javascript";
    scriptEl.src = src;
    scriptEl.defer = false;
    scriptEl.async = false;
    doc.head.appendChild(scriptEl);
  };
  goog.DebugLoader.prototype.writeScriptTag_ = function(src, opt_sourceText) {
    if (this.inHtmlDocument()) {
      var doc = goog.global.document;
      if (!goog.ENABLE_CHROME_APP_SAFE_SCRIPT_LOADING && doc.readyState == "complete") {
        var isDeps = /\bdeps.js$/.test(src);
        if (isDeps) {
          return false;
        } else {
          throw Error('Cannot write "' + src + '" after document load');
        }
      }
      if (opt_sourceText === undefined) {
        if (!goog.DebugLoader.IS_OLD_IE_) {
          if (goog.ENABLE_CHROME_APP_SAFE_SCRIPT_LOADING) {
            this.appendScriptSrcNode_(src);
          } else {
            this.writeScriptSrcNode_(src);
          }
        } else {
          this.oldIeWaiting_ = true;
          var state = " onreadystatechange='goog.debugLoader_" + ".onScriptLoad_(this, " + ++this.lastNonModuleScriptIndex_ + ")' ";
          doc.write('<script type="text/javascript" src="' + src + '"' + state + "></" + "script>");
        }
      } else {
        doc.write('<script type="text/javascript">' + this.protectScriptTag_(opt_sourceText) + "</" + "script>");
      }
      return true;
    } else {
      return false;
    }
  };
  goog.DebugLoader.prototype.protectScriptTag_ = function(str) {
    return str.replace(/<\/(SCRIPT)/ig, "\\x3c/$1");
  };
  goog.DebugLoader.prototype.onScriptLoad_ = function(script, scriptIndex) {
    if (script.readyState == "complete" && this.lastNonModuleScriptIndex_ == scriptIndex) {
      this.loadQueuedModules_();
    }
    return true;
  };
  goog.DebugLoader.prototype.getPathFromDeps_ = function(rule) {
    if (rule in this.dependencies_.nameToPath) {
      return this.dependencies_.nameToPath[rule];
    } else {
      return null;
    }
  };
  goog.DebugLoader.prototype.getTranspiler = function() {
    return goog.transpiler_;
  };
  goog.DebugLoader.prototype.isProvided = function(namespaceOrPath) {
    return goog.isProvided_(namespaceOrPath);
  };
  goog.DebugLoader.prototype.inHtmlDocument = function() {
    return goog.inHtmlDocument_();
  };
  goog.DebugLoader.prototype.logToConsole = function(message) {
    goog.logToConsole_(message);
  };
  goog.DebugLoader.prototype.loadFileSync = function(srcUrl) {
    return goog.loadFileSync_(srcUrl);
  };
  goog.DebugLoader.prototype.normalizePath = function(path) {
    return goog.normalizePath_(path);
  };
  goog.debugLoader_ = null;
  goog.registerDebugLoader = function(loader) {
    if (goog.debugLoader_) {
      throw new Error("Debug loader already registered!");
    }
    if (!(loader instanceof goog.DebugLoader)) {
      throw new Error("Not a goog.DebugLoader.");
    }
    goog.debugLoader_ = loader;
  };
  goog.getLoader_ = function() {
    if (!goog.debugLoader_ && goog.DEBUG_LOADER) {
      throw new Error("Loaded debug loader file but no loader was registered!");
    } else {
      if (!goog.debugLoader_) {
        goog.debugLoader_ = new goog.DebugLoader;
      }
    }
    return goog.debugLoader_;
  };
  (function() {
    var tempLoader;
    if (goog.DEBUG_LOADER) {
      tempLoader = new goog.DebugLoader;
      tempLoader.importScript_(goog.basePath + goog.DEBUG_LOADER);
    }
    if (!goog.global.CLOSURE_NO_DEPS) {
      tempLoader = tempLoader || new goog.DebugLoader;
      if (!goog.DEBUG_LOADER) {
        goog.registerDebugLoader(tempLoader);
      }
      tempLoader.importScript_(goog.basePath + "deps.js");
    }
  })();
}
;goog.debug = {};
goog.debug.Error = function(opt_msg) {
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, goog.debug.Error);
  } else {
    var stack = (new Error).stack;
    if (stack) {
      this.stack = stack;
    }
  }
  if (opt_msg) {
    this.message = String(opt_msg);
  }
  this.reportErrorToServer = true;
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.dom = {};
goog.dom.NodeType = {ELEMENT:1, ATTRIBUTE:2, TEXT:3, CDATA_SECTION:4, ENTITY_REFERENCE:5, ENTITY:6, PROCESSING_INSTRUCTION:7, COMMENT:8, DOCUMENT:9, DOCUMENT_TYPE:10, DOCUMENT_FRAGMENT:11, NOTATION:12};
goog.string = {};
goog.string.DETECT_DOUBLE_ESCAPING = false;
goog.string.FORCE_NON_DOM_HTML_UNESCAPING = false;
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0;
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l;
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0;
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0;
};
goog.string.caseInsensitiveEquals = function(str1, str2) {
  return str1.toLowerCase() == str2.toLowerCase();
};
goog.string.subs = function(str, var_args) {
  var splitParts = str.split("%s");
  var returnString = "";
  for (var subsArguments = Array.prototype.slice.call(arguments, 1);subsArguments.length && splitParts.length > 1;) {
    returnString += splitParts.shift() + subsArguments.shift();
  }
  return returnString + splitParts.join("%s");
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "");
};
goog.string.isEmptyOrWhitespace = function(str) {
  return /^[\s\xa0]*$/.test(str);
};
goog.string.isEmptyString = function(str) {
  return str.length == 0;
};
goog.string.isEmpty = goog.string.isEmptyOrWhitespace;
goog.string.isEmptyOrWhitespaceSafe = function(str) {
  return goog.string.isEmptyOrWhitespace(goog.string.makeSafe(str));
};
goog.string.isEmptySafe = goog.string.isEmptyOrWhitespaceSafe;
goog.string.isBreakingWhitespace = function(str) {
  return !/[^\t\n\r ]/.test(str);
};
goog.string.isAlpha = function(str) {
  return !/[^a-zA-Z]/.test(str);
};
goog.string.isNumeric = function(str) {
  return !/[^0-9]/.test(str);
};
goog.string.isAlphaNumeric = function(str) {
  return !/[^a-zA-Z0-9]/.test(str);
};
goog.string.isSpace = function(ch) {
  return ch == " ";
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd";
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ");
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n");
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ");
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ");
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "");
};
goog.string.trim = goog.TRUSTED_SITE && String.prototype.trim ? function(str) {
  return str.trim();
} : function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "");
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "");
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "");
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if (test1 < test2) {
    return -1;
  } else {
    if (test1 == test2) {
      return 0;
    } else {
      return 1;
    }
  }
};
goog.string.numberAwareCompare_ = function(str1, str2, tokenizerRegExp) {
  if (str1 == str2) {
    return 0;
  }
  if (!str1) {
    return -1;
  }
  if (!str2) {
    return 1;
  }
  var tokens1 = str1.toLowerCase().match(tokenizerRegExp);
  var tokens2 = str2.toLowerCase().match(tokenizerRegExp);
  var count = Math.min(tokens1.length, tokens2.length);
  for (var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if (a != b) {
      var num1 = parseInt(a, 10);
      if (!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if (!isNaN(num2) && num1 - num2) {
          return num1 - num2;
        }
      }
      return a < b ? -1 : 1;
    }
  }
  if (tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length;
  }
  return str1 < str2 ? -1 : 1;
};
goog.string.intAwareCompare = function(str1, str2) {
  return goog.string.numberAwareCompare_(str1, str2, /\d+|\D+/g);
};
goog.string.floatAwareCompare = function(str1, str2) {
  return goog.string.numberAwareCompare_(str1, str2, /\d+|\.\d+|\D+/g);
};
goog.string.numerateCompare = goog.string.floatAwareCompare;
goog.string.urlEncode = function(str) {
  return encodeURIComponent(String(str));
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "));
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>");
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if (opt_isLikelyToContainHtmlChars) {
    str = str.replace(goog.string.AMP_RE_, "&amp;").replace(goog.string.LT_RE_, "&lt;").replace(goog.string.GT_RE_, "&gt;").replace(goog.string.QUOT_RE_, "&quot;").replace(goog.string.SINGLE_QUOTE_RE_, "&#39;").replace(goog.string.NULL_RE_, "&#0;");
    if (goog.string.DETECT_DOUBLE_ESCAPING) {
      str = str.replace(goog.string.E_RE_, "&#101;");
    }
    return str;
  } else {
    if (!goog.string.ALL_RE_.test(str)) {
      return str;
    }
    if (str.indexOf("&") != -1) {
      str = str.replace(goog.string.AMP_RE_, "&amp;");
    }
    if (str.indexOf("<") != -1) {
      str = str.replace(goog.string.LT_RE_, "&lt;");
    }
    if (str.indexOf(">") != -1) {
      str = str.replace(goog.string.GT_RE_, "&gt;");
    }
    if (str.indexOf('"') != -1) {
      str = str.replace(goog.string.QUOT_RE_, "&quot;");
    }
    if (str.indexOf("'") != -1) {
      str = str.replace(goog.string.SINGLE_QUOTE_RE_, "&#39;");
    }
    if (str.indexOf("\x00") != -1) {
      str = str.replace(goog.string.NULL_RE_, "&#0;");
    }
    if (goog.string.DETECT_DOUBLE_ESCAPING && str.indexOf("e") != -1) {
      str = str.replace(goog.string.E_RE_, "&#101;");
    }
    return str;
  }
};
goog.string.AMP_RE_ = /&/g;
goog.string.LT_RE_ = /</g;
goog.string.GT_RE_ = />/g;
goog.string.QUOT_RE_ = /"/g;
goog.string.SINGLE_QUOTE_RE_ = /'/g;
goog.string.NULL_RE_ = /\x00/g;
goog.string.E_RE_ = /e/g;
goog.string.ALL_RE_ = goog.string.DETECT_DOUBLE_ESCAPING ? /[\x00&<>"'e]/ : /[\x00&<>"']/;
goog.string.unescapeEntities = function(str) {
  if (goog.string.contains(str, "&")) {
    if (!goog.string.FORCE_NON_DOM_HTML_UNESCAPING && "document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str);
    } else {
      return goog.string.unescapePureXmlEntities_(str);
    }
  }
  return str;
};
goog.string.unescapeEntitiesWithDocument = function(str, document) {
  if (goog.string.contains(str, "&")) {
    return goog.string.unescapeEntitiesUsingDom_(str, document);
  }
  return str;
};
goog.string.unescapeEntitiesUsingDom_ = function(str, opt_document) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div;
  if (opt_document) {
    div = opt_document.createElement("div");
  } else {
    div = goog.global.document.createElement("div");
  }
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if (value) {
      return value;
    }
    if (entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if (!isNaN(n)) {
        value = String.fromCharCode(n);
      }
    }
    if (!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1);
    }
    return seen[s] = value;
  });
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return "&";
      case "lt":
        return "<";
      case "gt":
        return ">";
      case "quot":
        return '"';
      default:
        if (entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if (!isNaN(n)) {
            return String.fromCharCode(n);
          }
        }
        return s;
    }
  });
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml);
};
goog.string.preserveSpaces = function(str) {
  return str.replace(/(^|[\n ]) /g, "$1" + goog.string.Unicode.NBSP);
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for (var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if (str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1);
    }
  }
  return str;
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if (opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str);
  }
  if (str.length > chars) {
    str = str.substring(0, chars - 3) + "...";
  }
  if (opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str);
  }
  return str;
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if (opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str);
  }
  if (opt_trailingChars && str.length > chars) {
    if (opt_trailingChars > chars) {
      opt_trailingChars = chars;
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint);
  } else {
    if (str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos);
    }
  }
  if (opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str);
  }
  return str;
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\", "<":"<"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  var sb = ['"'];
  for (var i = 0;i < s.length;i++) {
    var ch = s.charAt(i);
    var cc = ch.charCodeAt(0);
    sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch));
  }
  sb.push('"');
  return sb.join("");
};
goog.string.escapeString = function(str) {
  var sb = [];
  for (var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i));
  }
  return sb.join("");
};
goog.string.escapeChar = function(c) {
  if (c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c];
  }
  if (c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c];
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if (cc > 31 && cc < 127) {
    rv = c;
  } else {
    if (cc < 256) {
      rv = "\\x";
      if (cc < 16 || cc > 256) {
        rv += "0";
      }
    } else {
      rv = "\\u";
      if (cc < 4096) {
        rv += "0";
      }
    }
    rv += cc.toString(16).toUpperCase();
  }
  return goog.string.jsEscapeCache_[c] = rv;
};
goog.string.contains = function(str, subString) {
  return str.indexOf(subString) != -1;
};
goog.string.caseInsensitiveContains = function(str, subString) {
  return goog.string.contains(str.toLowerCase(), subString.toLowerCase());
};
goog.string.countOf = function(s, ss) {
  return s && ss ? s.split(ss).length - 1 : 0;
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if (index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength);
  }
  return resultStr;
};
goog.string.remove = function(str, substr) {
  return str.replace(substr, "");
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "");
};
goog.string.replaceAll = function(s, ss, replacement) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, replacement.replace(/\$/g, "$$$$"));
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08");
};
goog.string.repeat = String.prototype.repeat ? function(string, length) {
  return string.repeat(length);
} : function(string, length) {
  return (new Array(length + 1)).join(string);
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if (index == -1) {
    index = s.length;
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s;
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj);
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "");
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36);
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for (var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    do {
      var v1Comp = /(\d*)(\D*)(.*)/.exec(v1Sub) || ["", "", "", ""];
      var v2Comp = /(\d*)(\D*)(.*)/.exec(v2Sub) || ["", "", "", ""];
      if (v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break;
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2]);
      v1Sub = v1Comp[3];
      v2Sub = v2Comp[3];
    } while (order == 0);
  }
  return order;
};
goog.string.compareElements_ = function(left, right) {
  if (left < right) {
    return -1;
  } else {
    if (left > right) {
      return 1;
    }
  }
  return 0;
};
goog.string.hashCode = function(str) {
  var result = 0;
  for (var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i) >>> 0;
  }
  return result;
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return "goog_" + goog.string.uniqueStringCounter_++;
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if (num == 0 && goog.string.isEmptyOrWhitespace(str)) {
    return NaN;
  }
  return num;
};
goog.string.isLowerCamelCase = function(str) {
  return /^[a-z]+([A-Z][a-z]*)*$/.test(str);
};
goog.string.isUpperCamelCase = function(str) {
  return /^([A-Z][a-z]*)+$/.test(str);
};
goog.string.toCamelCase = function(str) {
  return String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase();
  });
};
goog.string.toSelectorCase = function(str) {
  return String(str).replace(/([A-Z])/g, "-$1").toLowerCase();
};
goog.string.toTitleCase = function(str, opt_delimiters) {
  var delimiters = goog.isString(opt_delimiters) ? goog.string.regExpEscape(opt_delimiters) : "\\s";
  delimiters = delimiters ? "|[" + delimiters + "]+" : "";
  var regexp = new RegExp("(^" + delimiters + ")([a-z])", "g");
  return str.replace(regexp, function(all, p1, p2) {
    return p1 + p2.toUpperCase();
  });
};
goog.string.capitalize = function(str) {
  return String(str.charAt(0)).toUpperCase() + String(str.substr(1)).toLowerCase();
};
goog.string.parseInt = function(value) {
  if (isFinite(value)) {
    value = String(value);
  }
  if (goog.isString(value)) {
    return /^\s*-?0x/i.test(value) ? parseInt(value, 16) : parseInt(value, 10);
  }
  return NaN;
};
goog.string.splitLimit = function(str, separator, limit) {
  var parts = str.split(separator);
  for (var returnVal = [];limit > 0 && parts.length;) {
    returnVal.push(parts.shift());
    limit--;
  }
  if (parts.length) {
    returnVal.push(parts.join(separator));
  }
  return returnVal;
};
goog.string.lastComponent = function(str, separators) {
  if (!separators) {
    return str;
  } else {
    if (typeof separators == "string") {
      separators = [separators];
    }
  }
  var lastSeparatorIndex = -1;
  for (var i = 0;i < separators.length;i++) {
    if (separators[i] == "") {
      continue;
    }
    var currentSeparatorIndex = str.lastIndexOf(separators[i]);
    if (currentSeparatorIndex > lastSeparatorIndex) {
      lastSeparatorIndex = currentSeparatorIndex;
    }
  }
  if (lastSeparatorIndex == -1) {
    return str;
  }
  return str.slice(lastSeparatorIndex + 1);
};
goog.string.editDistance = function(a, b) {
  var v0 = [];
  var v1 = [];
  if (a == b) {
    return 0;
  }
  if (!a.length || !b.length) {
    return Math.max(a.length, b.length);
  }
  for (var i = 0;i < b.length + 1;i++) {
    v0[i] = i;
  }
  for (i = 0;i < a.length;i++) {
    v1[0] = i + 1;
    for (var j = 0;j < b.length;j++) {
      var cost = Number(a[i] != b[j]);
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    for (j = 0;j < v0.length;j++) {
      v0[j] = v1[j];
    }
  }
  return v1[b.length];
};
goog.asserts = {};
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern;
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.DEFAULT_ERROR_HANDLER = function(e) {
  throw e;
};
goog.asserts.errorHandler_ = goog.asserts.DEFAULT_ERROR_HANDLER;
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if (givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs;
  } else {
    if (defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs;
    }
  }
  var e = new goog.asserts.AssertionError("" + message, args || []);
  goog.asserts.errorHandler_(e);
};
goog.asserts.setErrorHandler = function(errorHandler) {
  if (goog.asserts.ENABLE_ASSERTS) {
    goog.asserts.errorHandler_ = errorHandler;
  }
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return condition;
};
goog.asserts.fail = function(opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS) {
    goog.asserts.errorHandler_(new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1)));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return value;
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return value;
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return value;
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return value;
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return value;
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return value;
};
goog.asserts.assertElement = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && (!goog.isObject(value) || value.nodeType != goog.dom.NodeType.ELEMENT)) {
    goog.asserts.doAssertFailure_("Expected Element but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return value;
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("Expected instanceof %s but got %s.", [goog.asserts.getType_(type), goog.asserts.getType_(value)], opt_message, Array.prototype.slice.call(arguments, 3));
  }
  return value;
};
goog.asserts.assertFinite = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && (typeof value != "number" || !isFinite(value))) {
    goog.asserts.doAssertFailure_("Expected %s to be a finite number but it is not.", [value], opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return value;
};
goog.asserts.assertObjectPrototypeIsIntact = function() {
  for (var key in Object.prototype) {
    goog.asserts.fail(key + " should not be enumerable in Object.prototype.");
  }
};
goog.asserts.getType_ = function(value) {
  if (value instanceof Function) {
    return value.displayName || value.name || "unknown type name";
  } else {
    if (value instanceof Object) {
      return value.constructor.displayName || value.constructor.name || Object.prototype.toString.call(value);
    } else {
      return value === null ? "null" : typeof value;
    }
  }
};
goog.dom.HtmlElement = function() {
};
goog.dom.TagName = function(tagName) {
  this.tagName_ = tagName;
};
goog.dom.TagName.prototype.toString = function() {
  return this.tagName_;
};
goog.dom.TagName.A = new goog.dom.TagName("A");
goog.dom.TagName.ABBR = new goog.dom.TagName("ABBR");
goog.dom.TagName.ACRONYM = new goog.dom.TagName("ACRONYM");
goog.dom.TagName.ADDRESS = new goog.dom.TagName("ADDRESS");
goog.dom.TagName.APPLET = new goog.dom.TagName("APPLET");
goog.dom.TagName.AREA = new goog.dom.TagName("AREA");
goog.dom.TagName.ARTICLE = new goog.dom.TagName("ARTICLE");
goog.dom.TagName.ASIDE = new goog.dom.TagName("ASIDE");
goog.dom.TagName.AUDIO = new goog.dom.TagName("AUDIO");
goog.dom.TagName.B = new goog.dom.TagName("B");
goog.dom.TagName.BASE = new goog.dom.TagName("BASE");
goog.dom.TagName.BASEFONT = new goog.dom.TagName("BASEFONT");
goog.dom.TagName.BDI = new goog.dom.TagName("BDI");
goog.dom.TagName.BDO = new goog.dom.TagName("BDO");
goog.dom.TagName.BIG = new goog.dom.TagName("BIG");
goog.dom.TagName.BLOCKQUOTE = new goog.dom.TagName("BLOCKQUOTE");
goog.dom.TagName.BODY = new goog.dom.TagName("BODY");
goog.dom.TagName.BR = new goog.dom.TagName("BR");
goog.dom.TagName.BUTTON = new goog.dom.TagName("BUTTON");
goog.dom.TagName.CANVAS = new goog.dom.TagName("CANVAS");
goog.dom.TagName.CAPTION = new goog.dom.TagName("CAPTION");
goog.dom.TagName.CENTER = new goog.dom.TagName("CENTER");
goog.dom.TagName.CITE = new goog.dom.TagName("CITE");
goog.dom.TagName.CODE = new goog.dom.TagName("CODE");
goog.dom.TagName.COL = new goog.dom.TagName("COL");
goog.dom.TagName.COLGROUP = new goog.dom.TagName("COLGROUP");
goog.dom.TagName.COMMAND = new goog.dom.TagName("COMMAND");
goog.dom.TagName.DATA = new goog.dom.TagName("DATA");
goog.dom.TagName.DATALIST = new goog.dom.TagName("DATALIST");
goog.dom.TagName.DD = new goog.dom.TagName("DD");
goog.dom.TagName.DEL = new goog.dom.TagName("DEL");
goog.dom.TagName.DETAILS = new goog.dom.TagName("DETAILS");
goog.dom.TagName.DFN = new goog.dom.TagName("DFN");
goog.dom.TagName.DIALOG = new goog.dom.TagName("DIALOG");
goog.dom.TagName.DIR = new goog.dom.TagName("DIR");
goog.dom.TagName.DIV = new goog.dom.TagName("DIV");
goog.dom.TagName.DL = new goog.dom.TagName("DL");
goog.dom.TagName.DT = new goog.dom.TagName("DT");
goog.dom.TagName.EM = new goog.dom.TagName("EM");
goog.dom.TagName.EMBED = new goog.dom.TagName("EMBED");
goog.dom.TagName.FIELDSET = new goog.dom.TagName("FIELDSET");
goog.dom.TagName.FIGCAPTION = new goog.dom.TagName("FIGCAPTION");
goog.dom.TagName.FIGURE = new goog.dom.TagName("FIGURE");
goog.dom.TagName.FONT = new goog.dom.TagName("FONT");
goog.dom.TagName.FOOTER = new goog.dom.TagName("FOOTER");
goog.dom.TagName.FORM = new goog.dom.TagName("FORM");
goog.dom.TagName.FRAME = new goog.dom.TagName("FRAME");
goog.dom.TagName.FRAMESET = new goog.dom.TagName("FRAMESET");
goog.dom.TagName.H1 = new goog.dom.TagName("H1");
goog.dom.TagName.H2 = new goog.dom.TagName("H2");
goog.dom.TagName.H3 = new goog.dom.TagName("H3");
goog.dom.TagName.H4 = new goog.dom.TagName("H4");
goog.dom.TagName.H5 = new goog.dom.TagName("H5");
goog.dom.TagName.H6 = new goog.dom.TagName("H6");
goog.dom.TagName.HEAD = new goog.dom.TagName("HEAD");
goog.dom.TagName.HEADER = new goog.dom.TagName("HEADER");
goog.dom.TagName.HGROUP = new goog.dom.TagName("HGROUP");
goog.dom.TagName.HR = new goog.dom.TagName("HR");
goog.dom.TagName.HTML = new goog.dom.TagName("HTML");
goog.dom.TagName.I = new goog.dom.TagName("I");
goog.dom.TagName.IFRAME = new goog.dom.TagName("IFRAME");
goog.dom.TagName.IMG = new goog.dom.TagName("IMG");
goog.dom.TagName.INPUT = new goog.dom.TagName("INPUT");
goog.dom.TagName.INS = new goog.dom.TagName("INS");
goog.dom.TagName.ISINDEX = new goog.dom.TagName("ISINDEX");
goog.dom.TagName.KBD = new goog.dom.TagName("KBD");
goog.dom.TagName.KEYGEN = new goog.dom.TagName("KEYGEN");
goog.dom.TagName.LABEL = new goog.dom.TagName("LABEL");
goog.dom.TagName.LEGEND = new goog.dom.TagName("LEGEND");
goog.dom.TagName.LI = new goog.dom.TagName("LI");
goog.dom.TagName.LINK = new goog.dom.TagName("LINK");
goog.dom.TagName.MAP = new goog.dom.TagName("MAP");
goog.dom.TagName.MARK = new goog.dom.TagName("MARK");
goog.dom.TagName.MATH = new goog.dom.TagName("MATH");
goog.dom.TagName.MENU = new goog.dom.TagName("MENU");
goog.dom.TagName.META = new goog.dom.TagName("META");
goog.dom.TagName.METER = new goog.dom.TagName("METER");
goog.dom.TagName.NAV = new goog.dom.TagName("NAV");
goog.dom.TagName.NOFRAMES = new goog.dom.TagName("NOFRAMES");
goog.dom.TagName.NOSCRIPT = new goog.dom.TagName("NOSCRIPT");
goog.dom.TagName.OBJECT = new goog.dom.TagName("OBJECT");
goog.dom.TagName.OL = new goog.dom.TagName("OL");
goog.dom.TagName.OPTGROUP = new goog.dom.TagName("OPTGROUP");
goog.dom.TagName.OPTION = new goog.dom.TagName("OPTION");
goog.dom.TagName.OUTPUT = new goog.dom.TagName("OUTPUT");
goog.dom.TagName.P = new goog.dom.TagName("P");
goog.dom.TagName.PARAM = new goog.dom.TagName("PARAM");
goog.dom.TagName.PRE = new goog.dom.TagName("PRE");
goog.dom.TagName.PROGRESS = new goog.dom.TagName("PROGRESS");
goog.dom.TagName.Q = new goog.dom.TagName("Q");
goog.dom.TagName.RP = new goog.dom.TagName("RP");
goog.dom.TagName.RT = new goog.dom.TagName("RT");
goog.dom.TagName.RUBY = new goog.dom.TagName("RUBY");
goog.dom.TagName.S = new goog.dom.TagName("S");
goog.dom.TagName.SAMP = new goog.dom.TagName("SAMP");
goog.dom.TagName.SCRIPT = new goog.dom.TagName("SCRIPT");
goog.dom.TagName.SECTION = new goog.dom.TagName("SECTION");
goog.dom.TagName.SELECT = new goog.dom.TagName("SELECT");
goog.dom.TagName.SMALL = new goog.dom.TagName("SMALL");
goog.dom.TagName.SOURCE = new goog.dom.TagName("SOURCE");
goog.dom.TagName.SPAN = new goog.dom.TagName("SPAN");
goog.dom.TagName.STRIKE = new goog.dom.TagName("STRIKE");
goog.dom.TagName.STRONG = new goog.dom.TagName("STRONG");
goog.dom.TagName.STYLE = new goog.dom.TagName("STYLE");
goog.dom.TagName.SUB = new goog.dom.TagName("SUB");
goog.dom.TagName.SUMMARY = new goog.dom.TagName("SUMMARY");
goog.dom.TagName.SUP = new goog.dom.TagName("SUP");
goog.dom.TagName.SVG = new goog.dom.TagName("SVG");
goog.dom.TagName.TABLE = new goog.dom.TagName("TABLE");
goog.dom.TagName.TBODY = new goog.dom.TagName("TBODY");
goog.dom.TagName.TD = new goog.dom.TagName("TD");
goog.dom.TagName.TEMPLATE = new goog.dom.TagName("TEMPLATE");
goog.dom.TagName.TEXTAREA = new goog.dom.TagName("TEXTAREA");
goog.dom.TagName.TFOOT = new goog.dom.TagName("TFOOT");
goog.dom.TagName.TH = new goog.dom.TagName("TH");
goog.dom.TagName.THEAD = new goog.dom.TagName("THEAD");
goog.dom.TagName.TIME = new goog.dom.TagName("TIME");
goog.dom.TagName.TITLE = new goog.dom.TagName("TITLE");
goog.dom.TagName.TR = new goog.dom.TagName("TR");
goog.dom.TagName.TRACK = new goog.dom.TagName("TRACK");
goog.dom.TagName.TT = new goog.dom.TagName("TT");
goog.dom.TagName.U = new goog.dom.TagName("U");
goog.dom.TagName.UL = new goog.dom.TagName("UL");
goog.dom.TagName.VAR = new goog.dom.TagName("VAR");
goog.dom.TagName.VIDEO = new goog.dom.TagName("VIDEO");
goog.dom.TagName.WBR = new goog.dom.TagName("WBR");
goog.array = {};
goog.NATIVE_ARRAY_PROTOTYPES = goog.TRUSTED_SITE;
goog.array.ASSUME_NATIVE_FUNCTIONS = false;
goog.array.peek = function(array) {
  return array[array.length - 1];
};
goog.array.last = goog.array.peek;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || Array.prototype.indexOf) ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return Array.prototype.indexOf.call(arr, obj, opt_fromIndex);
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if (goog.isString(arr)) {
    if (!goog.isString(obj) || obj.length != 1) {
      return -1;
    }
    return arr.indexOf(obj, fromIndex);
  }
  for (var i = fromIndex;i < arr.length;i++) {
    if (i in arr && arr[i] === obj) {
      return i;
    }
  }
  return -1;
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || Array.prototype.lastIndexOf) ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return Array.prototype.lastIndexOf.call(arr, obj, fromIndex);
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if (fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex);
  }
  if (goog.isString(arr)) {
    if (!goog.isString(obj) || obj.length != 1) {
      return -1;
    }
    return arr.lastIndexOf(obj, fromIndex);
  }
  for (var i = fromIndex;i >= 0;i--) {
    if (i in arr && arr[i] === obj) {
      return i;
    }
  }
  return -1;
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || Array.prototype.forEach) ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  Array.prototype.forEach.call(arr, f, opt_obj);
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for (var i = 0;i < l;i++) {
    if (i in arr2) {
      f.call(opt_obj, arr2[i], i, arr);
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for (var i = l - 1;i >= 0;--i) {
    if (i in arr2) {
      f.call(opt_obj, arr2[i], i, arr);
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || Array.prototype.filter) ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return Array.prototype.filter.call(arr, f, opt_obj);
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for (var i = 0;i < l;i++) {
    if (i in arr2) {
      var val = arr2[i];
      if (f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val;
      }
    }
  }
  return res;
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || Array.prototype.map) ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return Array.prototype.map.call(arr, f, opt_obj);
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for (var i = 0;i < l;i++) {
    if (i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr);
    }
  }
  return res;
};
goog.array.reduce = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || Array.prototype.reduce) ? function(arr, f, val, opt_obj) {
  goog.asserts.assert(arr.length != null);
  if (opt_obj) {
    f = goog.bind(f, opt_obj);
  }
  return Array.prototype.reduce.call(arr, f, val);
} : function(arr, f, val$jscomp$0, opt_obj) {
  var rval = val$jscomp$0;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr);
  });
  return rval;
};
goog.array.reduceRight = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || Array.prototype.reduceRight) ? function(arr, f, val, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.asserts.assert(f != null);
  if (opt_obj) {
    f = goog.bind(f, opt_obj);
  }
  return Array.prototype.reduceRight.call(arr, f, val);
} : function(arr, f, val$jscomp$0, opt_obj) {
  var rval = val$jscomp$0;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr);
  });
  return rval;
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || Array.prototype.some) ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return Array.prototype.some.call(arr, f, opt_obj);
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for (var i = 0;i < l;i++) {
    if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true;
    }
  }
  return false;
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && (goog.array.ASSUME_NATIVE_FUNCTIONS || Array.prototype.every) ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return Array.prototype.every.call(arr, f, opt_obj);
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for (var i = 0;i < l;i++) {
    if (i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false;
    }
  }
  return true;
};
goog.array.count = function(arr$jscomp$0, f, opt_obj) {
  var count = 0;
  goog.array.forEach(arr$jscomp$0, function(element, index, arr) {
    if (f.call(opt_obj, element, index, arr)) {
      ++count;
    }
  }, opt_obj);
  return count;
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i];
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for (var i = 0;i < l;i++) {
    if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i;
    }
  }
  return -1;
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i];
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for (var i = l - 1;i >= 0;i--) {
    if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i;
    }
  }
  return -1;
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0;
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0;
};
goog.array.clear = function(arr) {
  if (!goog.isArray(arr)) {
    for (var i = arr.length - 1;i >= 0;i--) {
      delete arr[i];
    }
  }
  arr.length = 0;
};
goog.array.insert = function(arr, obj) {
  if (!goog.array.contains(arr, obj)) {
    arr.push(obj);
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj);
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd);
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if (arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj);
  } else {
    goog.array.insertAt(arr, obj, i);
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if (rv = i >= 0) {
    goog.array.removeAt(arr, i);
  }
  return rv;
};
goog.array.removeLast = function(arr, obj) {
  var i = goog.array.lastIndexOf(arr, obj);
  if (i >= 0) {
    goog.array.removeAt(arr, i);
    return true;
  }
  return false;
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return Array.prototype.splice.call(arr, i, 1).length == 1;
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if (i >= 0) {
    goog.array.removeAt(arr, i);
    return true;
  }
  return false;
};
goog.array.removeAllIf = function(arr, f, opt_obj) {
  var removedCount = 0;
  goog.array.forEachRight(arr, function(val, index) {
    if (f.call(opt_obj, val, index, arr)) {
      if (goog.array.removeAt(arr, index)) {
        removedCount++;
      }
    }
  });
  return removedCount;
};
goog.array.concat = function(var_args) {
  return Array.prototype.concat.apply([], arguments);
};
goog.array.join = function(var_args) {
  return Array.prototype.concat.apply([], arguments);
};
goog.array.toArray = function(object) {
  var length = object.length;
  if (length > 0) {
    var rv = new Array(length);
    for (var i = 0;i < length;i++) {
      rv[i] = object[i];
    }
    return rv;
  }
  return [];
};
goog.array.clone = goog.array.toArray;
goog.array.extend = function(arr1, var_args) {
  for (var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    if (goog.isArrayLike(arr2)) {
      var len1 = arr1.length || 0;
      var len2 = arr2.length || 0;
      arr1.length = len1 + len2;
      for (var j = 0;j < len2;j++) {
        arr1[len1 + j] = arr2[j];
      }
    } else {
      arr1.push(arr2);
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return Array.prototype.splice.apply(arr, goog.array.slice(arguments, 1));
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if (arguments.length <= 2) {
    return Array.prototype.slice.call(arr, start);
  } else {
    return Array.prototype.slice.call(arr, start, opt_end);
  }
};
goog.array.removeDuplicates = function(arr, opt_rv, opt_hashFn) {
  var returnArray = opt_rv || arr;
  var defaultHashFn = function(item) {
    return goog.isObject(item) ? "o" + goog.getUid(item) : (typeof item).charAt(0) + item;
  };
  var hashFn = opt_hashFn || defaultHashFn;
  var seen = {};
  var cursorInsert = 0;
  for (var cursorRead = 0;cursorRead < arr.length;) {
    var current = arr[cursorRead++];
    var key = hashFn(current);
    if (!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current;
    }
  }
  returnArray.length = cursorInsert;
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target);
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj);
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  for (var found;left < right;) {
    var middle = left + right >> 1;
    var compareResult;
    if (isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr);
    } else {
      compareResult = compareFn(opt_target, arr[middle]);
    }
    if (compareResult > 0) {
      left = middle + 1;
    } else {
      right = middle;
      found = !compareResult;
    }
  }
  return found ? left : ~left;
};
goog.array.sort = function(arr, opt_compareFn) {
  arr.sort(opt_compareFn || goog.array.defaultCompare);
};
goog.array.stableSort = function(arr, opt_compareFn) {
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index;
  }
  var compArr = new Array(arr.length);
  for (var i = 0;i < arr.length;i++) {
    compArr[i] = {index:i, value:arr[i]};
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(compArr, stableCompareFn);
  for (i = 0;i < arr.length;i++) {
    arr[i] = compArr[i].value;
  }
};
goog.array.sortByKey = function(arr, keyFn, opt_compareFn) {
  var keyCompareFn = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return keyCompareFn(keyFn(a), keyFn(b));
  });
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  goog.array.sortByKey(arr, function(obj) {
    return obj[key];
  }, opt_compareFn);
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for (var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if (compareResult > 0 || compareResult == 0 && opt_strict) {
      return false;
    }
  }
  return true;
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if (!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false;
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for (var i = 0;i < l;i++) {
    if (!equalsFn(arr1[i], arr2[i])) {
      return false;
    }
  }
  return true;
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for (var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if (result != 0) {
      return result;
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length);
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0;
};
goog.array.inverseDefaultCompare = function(a, b) {
  return -goog.array.defaultCompare(a, b);
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b;
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if (index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true;
  }
  return false;
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false;
};
goog.array.bucket = function(array, sorter, opt_obj) {
  var buckets = {};
  for (var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter.call(opt_obj, value, i, array);
    if (goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value);
    }
  }
  return buckets;
};
goog.array.toObject = function(arr, keyFunc, opt_obj) {
  var ret = {};
  goog.array.forEach(arr, function(element, index) {
    ret[keyFunc.call(opt_obj, element, index, arr)] = element;
  });
  return ret;
};
goog.array.range = function(startOrEnd, opt_end, opt_step) {
  var array = [];
  var start = 0;
  var end = startOrEnd;
  var step = opt_step || 1;
  if (opt_end !== undefined) {
    start = startOrEnd;
    end = opt_end;
  }
  if (step * (end - start) < 0) {
    return [];
  }
  if (step > 0) {
    for (var i = start;i < end;i += step) {
      array.push(i);
    }
  } else {
    for (i = start;i > end;i += step) {
      array.push(i);
    }
  }
  return array;
};
goog.array.repeat = function(value, n) {
  var array = [];
  for (var i = 0;i < n;i++) {
    array[i] = value;
  }
  return array;
};
goog.array.flatten = function(var_args) {
  var CHUNK_SIZE = 8192;
  var result = [];
  for (var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if (goog.isArray(element)) {
      for (var c = 0;c < element.length;c += CHUNK_SIZE) {
        var chunk = goog.array.slice(element, c, c + CHUNK_SIZE);
        var recurseResult = goog.array.flatten.apply(null, chunk);
        for (var r = 0;r < recurseResult.length;r++) {
          result.push(recurseResult[r]);
        }
      }
    } else {
      result.push(element);
    }
  }
  return result;
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if (array.length) {
    n %= array.length;
    if (n > 0) {
      Array.prototype.unshift.apply(array, array.splice(-n, n));
    } else {
      if (n < 0) {
        Array.prototype.push.apply(array, array.splice(0, -n));
      }
    }
  }
  return array;
};
goog.array.moveItem = function(arr, fromIndex, toIndex) {
  goog.asserts.assert(fromIndex >= 0 && fromIndex < arr.length);
  goog.asserts.assert(toIndex >= 0 && toIndex < arr.length);
  var removedItems = Array.prototype.splice.call(arr, fromIndex, 1);
  Array.prototype.splice.call(arr, toIndex, 0, removedItems[0]);
};
goog.array.zip = function(var_args) {
  if (!arguments.length) {
    return [];
  }
  var result = [];
  var minLen = arguments[0].length;
  for (var i = 1;i < arguments.length;i++) {
    if (arguments[i].length < minLen) {
      minLen = arguments[i].length;
    }
  }
  for (i = 0;i < minLen;i++) {
    var value = [];
    for (var j = 0;j < arguments.length;j++) {
      value.push(arguments[j][i]);
    }
    result.push(value);
  }
  return result;
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for (var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
};
goog.array.copyByIndex = function(arr, index_arr) {
  var result = [];
  goog.array.forEach(index_arr, function(index) {
    result.push(arr[index]);
  });
  return result;
};
goog.array.concatMap = function(arr, f, opt_obj) {
  return goog.array.concat.apply([], goog.array.map(arr, f, opt_obj));
};
goog.labs = {};
goog.labs.userAgent = {};
goog.labs.userAgent.util = {};
goog.labs.userAgent.util.getNativeUserAgentString_ = function() {
  var navigator = goog.labs.userAgent.util.getNavigator_();
  if (navigator) {
    var userAgent = navigator.userAgent;
    if (userAgent) {
      return userAgent;
    }
  }
  return "";
};
goog.labs.userAgent.util.getNavigator_ = function() {
  return goog.global.navigator;
};
goog.labs.userAgent.util.userAgent_ = goog.labs.userAgent.util.getNativeUserAgentString_();
goog.labs.userAgent.util.setUserAgent = function(opt_userAgent) {
  goog.labs.userAgent.util.userAgent_ = opt_userAgent || goog.labs.userAgent.util.getNativeUserAgentString_();
};
goog.labs.userAgent.util.getUserAgent = function() {
  return goog.labs.userAgent.util.userAgent_;
};
goog.labs.userAgent.util.matchUserAgent = function(str) {
  var userAgent = goog.labs.userAgent.util.getUserAgent();
  return goog.string.contains(userAgent, str);
};
goog.labs.userAgent.util.matchUserAgentIgnoreCase = function(str) {
  var userAgent = goog.labs.userAgent.util.getUserAgent();
  return goog.string.caseInsensitiveContains(userAgent, str);
};
goog.labs.userAgent.util.extractVersionTuples = function(userAgent) {
  var versionRegExp = new RegExp("(\\w[\\w ]+)" + "/" + "([^\\s]+)" + "\\s*" + "(?:\\((.*?)\\))?", "g");
  var data = [];
  for (var match;match = versionRegExp.exec(userAgent);) {
    data.push([match[1], match[2], match[3] || undefined]);
  }
  return data;
};
goog.object = {};
goog.object.is = function(v, v2) {
  if (v === v2) {
    return v !== 0 || 1 / v === 1 / v2;
  }
  return v !== v && v2 !== v2;
};
goog.object.forEach = function(obj, f, opt_obj) {
  for (var key in obj) {
    f.call(opt_obj, obj[key], key, obj);
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for (var key in obj) {
    if (f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key];
    }
  }
  return res;
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for (var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj);
  }
  return res;
};
goog.object.some = function(obj, f, opt_obj) {
  for (var key in obj) {
    if (f.call(opt_obj, obj[key], key, obj)) {
      return true;
    }
  }
  return false;
};
goog.object.every = function(obj, f, opt_obj) {
  for (var key in obj) {
    if (!f.call(opt_obj, obj[key], key, obj)) {
      return false;
    }
  }
  return true;
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for (var key in obj) {
    rv++;
  }
  return rv;
};
goog.object.getAnyKey = function(obj) {
  for (var key in obj) {
    return key;
  }
};
goog.object.getAnyValue = function(obj) {
  for (var key in obj) {
    return obj[key];
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val);
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for (var key in obj) {
    res[i++] = obj[key];
  }
  return res;
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for (var key in obj) {
    res[i++] = key;
  }
  return res;
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for (var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    if (obj == null) {
      return undefined;
    }
    obj = obj[keys[i]];
  }
  return obj;
};
goog.object.containsKey = function(obj, key) {
  return obj !== null && key in obj;
};
goog.object.containsValue = function(obj, val) {
  for (var key in obj) {
    if (obj[key] == val) {
      return true;
    }
  }
  return false;
};
goog.object.findKey = function(obj, f, opt_this) {
  for (var key in obj) {
    if (f.call(opt_this, obj[key], key, obj)) {
      return key;
    }
  }
  return undefined;
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key];
};
goog.object.isEmpty = function(obj) {
  for (var key in obj) {
    return false;
  }
  return true;
};
goog.object.clear = function(obj) {
  for (var i in obj) {
    delete obj[i];
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if (rv = key in obj) {
    delete obj[key];
  }
  return rv;
};
goog.object.add = function(obj, key, val) {
  if (obj !== null && key in obj) {
    throw new Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val);
};
goog.object.get = function(obj, key, opt_val) {
  if (obj !== null && key in obj) {
    return obj[key];
  }
  return opt_val;
};
goog.object.set = function(obj, key, value) {
  obj[key] = value;
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value;
};
goog.object.setWithReturnValueIfNotSet = function(obj, key, f) {
  if (key in obj) {
    return obj[key];
  }
  var val = f();
  obj[key] = val;
  return val;
};
goog.object.equals = function(a, b) {
  for (var k in a) {
    if (!(k in b) || a[k] !== b[k]) {
      return false;
    }
  }
  for (k in b) {
    if (!(k in a)) {
      return false;
    }
  }
  return true;
};
goog.object.clone = function(obj) {
  var res = {};
  for (var key in obj) {
    res[key] = obj[key];
  }
  return res;
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if (type == "object" || type == "array") {
    if (goog.isFunction(obj.clone)) {
      return obj.clone();
    }
    var clone = type == "array" ? [] : {};
    for (var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key]);
    }
    return clone;
  }
  return obj;
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for (var key in obj) {
    transposed[obj[key]] = key;
  }
  return transposed;
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key;
  var source;
  for (var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for (key in source) {
      target[key] = source[key];
    }
    for (var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if (argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0]);
  }
  if (argLength % 2) {
    throw new Error("Uneven number of arguments");
  }
  var rv = {};
  for (var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1];
  }
  return rv;
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if (argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0]);
  }
  var rv = {};
  for (var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true;
  }
  return rv;
};
goog.object.createImmutableView = function(obj) {
  var result = obj;
  if (Object.isFrozen && !Object.isFrozen(obj)) {
    result = Object.create(obj);
    Object.freeze(result);
  }
  return result;
};
goog.object.isImmutableView = function(obj) {
  return !!Object.isFrozen && Object.isFrozen(obj);
};
goog.object.getAllPropertyNames = function(obj, opt_includeObjectPrototype, opt_includeFunctionPrototype) {
  if (!obj) {
    return [];
  }
  if (!Object.getOwnPropertyNames || !Object.getPrototypeOf) {
    return goog.object.getKeys(obj);
  }
  var visitedSet = {};
  for (var proto = obj;proto && (proto !== Object.prototype || !!opt_includeObjectPrototype) && (proto !== Function.prototype || !!opt_includeFunctionPrototype);) {
    var names = Object.getOwnPropertyNames(proto);
    for (var i = 0;i < names.length;i++) {
      visitedSet[names[i]] = true;
    }
    proto = Object.getPrototypeOf(proto);
  }
  return goog.object.getKeys(visitedSet);
};
goog.labs.userAgent.browser = {};
goog.labs.userAgent.browser.matchOpera_ = function() {
  return goog.labs.userAgent.util.matchUserAgent("Opera");
};
goog.labs.userAgent.browser.matchIE_ = function() {
  return goog.labs.userAgent.util.matchUserAgent("Trident") || goog.labs.userAgent.util.matchUserAgent("MSIE");
};
goog.labs.userAgent.browser.matchEdge_ = function() {
  return goog.labs.userAgent.util.matchUserAgent("Edge");
};
goog.labs.userAgent.browser.matchFirefox_ = function() {
  return goog.labs.userAgent.util.matchUserAgent("Firefox");
};
goog.labs.userAgent.browser.matchSafari_ = function() {
  return goog.labs.userAgent.util.matchUserAgent("Safari") && !(goog.labs.userAgent.browser.matchChrome_() || goog.labs.userAgent.browser.matchCoast_() || goog.labs.userAgent.browser.matchOpera_() || goog.labs.userAgent.browser.matchEdge_() || goog.labs.userAgent.browser.isSilk() || goog.labs.userAgent.util.matchUserAgent("Android"));
};
goog.labs.userAgent.browser.matchCoast_ = function() {
  return goog.labs.userAgent.util.matchUserAgent("Coast");
};
goog.labs.userAgent.browser.matchIosWebview_ = function() {
  return (goog.labs.userAgent.util.matchUserAgent("iPad") || goog.labs.userAgent.util.matchUserAgent("iPhone")) && !goog.labs.userAgent.browser.matchSafari_() && !goog.labs.userAgent.browser.matchChrome_() && !goog.labs.userAgent.browser.matchCoast_() && goog.labs.userAgent.util.matchUserAgent("AppleWebKit");
};
goog.labs.userAgent.browser.matchChrome_ = function() {
  return (goog.labs.userAgent.util.matchUserAgent("Chrome") || goog.labs.userAgent.util.matchUserAgent("CriOS")) && !goog.labs.userAgent.browser.matchEdge_();
};
goog.labs.userAgent.browser.matchAndroidBrowser_ = function() {
  return goog.labs.userAgent.util.matchUserAgent("Android") && !(goog.labs.userAgent.browser.isChrome() || goog.labs.userAgent.browser.isFirefox() || goog.labs.userAgent.browser.isOpera() || goog.labs.userAgent.browser.isSilk());
};
goog.labs.userAgent.browser.isOpera = goog.labs.userAgent.browser.matchOpera_;
goog.labs.userAgent.browser.isIE = goog.labs.userAgent.browser.matchIE_;
goog.labs.userAgent.browser.isEdge = goog.labs.userAgent.browser.matchEdge_;
goog.labs.userAgent.browser.isFirefox = goog.labs.userAgent.browser.matchFirefox_;
goog.labs.userAgent.browser.isSafari = goog.labs.userAgent.browser.matchSafari_;
goog.labs.userAgent.browser.isCoast = goog.labs.userAgent.browser.matchCoast_;
goog.labs.userAgent.browser.isIosWebview = goog.labs.userAgent.browser.matchIosWebview_;
goog.labs.userAgent.browser.isChrome = goog.labs.userAgent.browser.matchChrome_;
goog.labs.userAgent.browser.isAndroidBrowser = goog.labs.userAgent.browser.matchAndroidBrowser_;
goog.labs.userAgent.browser.isSilk = function() {
  return goog.labs.userAgent.util.matchUserAgent("Silk");
};
goog.labs.userAgent.browser.getVersion = function() {
  function lookUpValueWithKeys(keys) {
    var key = goog.array.find(keys, versionMapHasKey);
    return versionMap[key] || "";
  }
  var userAgentString = goog.labs.userAgent.util.getUserAgent();
  if (goog.labs.userAgent.browser.isIE()) {
    return goog.labs.userAgent.browser.getIEVersion_(userAgentString);
  }
  var versionTuples = goog.labs.userAgent.util.extractVersionTuples(userAgentString);
  var versionMap = {};
  goog.array.forEach(versionTuples, function(tuple) {
    var key = tuple[0];
    var value = tuple[1];
    versionMap[key] = value;
  });
  var versionMapHasKey = goog.partial(goog.object.containsKey, versionMap);
  if (goog.labs.userAgent.browser.isOpera()) {
    return lookUpValueWithKeys(["Version", "Opera"]);
  }
  if (goog.labs.userAgent.browser.isEdge()) {
    return lookUpValueWithKeys(["Edge"]);
  }
  if (goog.labs.userAgent.browser.isChrome()) {
    return lookUpValueWithKeys(["Chrome", "CriOS"]);
  }
  var tuple = versionTuples[2];
  return tuple && tuple[1] || "";
};
goog.labs.userAgent.browser.isVersionOrHigher = function(version) {
  return goog.string.compareVersions(goog.labs.userAgent.browser.getVersion(), version) >= 0;
};
goog.labs.userAgent.browser.getIEVersion_ = function(userAgent) {
  var rv = /rv: *([\d\.]*)/.exec(userAgent);
  if (rv && rv[1]) {
    return rv[1];
  }
  var version = "";
  var msie = /MSIE +([\d\.]+)/.exec(userAgent);
  if (msie && msie[1]) {
    var tridentVersion = /Trident\/(\d.\d)/.exec(userAgent);
    if (msie[1] == "7.0") {
      if (tridentVersion && tridentVersion[1]) {
        switch(tridentVersion[1]) {
          case "4.0":
            version = "8.0";
            break;
          case "5.0":
            version = "9.0";
            break;
          case "6.0":
            version = "10.0";
            break;
          case "7.0":
            version = "11.0";
            break;
        }
      } else {
        version = "7.0";
      }
    } else {
      version = msie[1];
    }
  }
  return version;
};
goog.labs.userAgent.engine = {};
goog.labs.userAgent.engine.isPresto = function() {
  return goog.labs.userAgent.util.matchUserAgent("Presto");
};
goog.labs.userAgent.engine.isTrident = function() {
  return goog.labs.userAgent.util.matchUserAgent("Trident") || goog.labs.userAgent.util.matchUserAgent("MSIE");
};
goog.labs.userAgent.engine.isEdge = function() {
  return goog.labs.userAgent.util.matchUserAgent("Edge");
};
goog.labs.userAgent.engine.isWebKit = function() {
  return goog.labs.userAgent.util.matchUserAgentIgnoreCase("WebKit") && !goog.labs.userAgent.engine.isEdge();
};
goog.labs.userAgent.engine.isGecko = function() {
  return goog.labs.userAgent.util.matchUserAgent("Gecko") && !goog.labs.userAgent.engine.isWebKit() && !goog.labs.userAgent.engine.isTrident() && !goog.labs.userAgent.engine.isEdge();
};
goog.labs.userAgent.engine.getVersion = function() {
  var userAgentString = goog.labs.userAgent.util.getUserAgent();
  if (userAgentString) {
    var tuples = goog.labs.userAgent.util.extractVersionTuples(userAgentString);
    var engineTuple = goog.labs.userAgent.engine.getEngineTuple_(tuples);
    if (engineTuple) {
      if (engineTuple[0] == "Gecko") {
        return goog.labs.userAgent.engine.getVersionForKey_(tuples, "Firefox");
      }
      return engineTuple[1];
    }
    var browserTuple = tuples[0];
    var info;
    if (browserTuple && (info = browserTuple[2])) {
      var match = /Trident\/([^\s;]+)/.exec(info);
      if (match) {
        return match[1];
      }
    }
  }
  return "";
};
goog.labs.userAgent.engine.getEngineTuple_ = function(tuples) {
  if (!goog.labs.userAgent.engine.isEdge()) {
    return tuples[1];
  }
  for (var i = 0;i < tuples.length;i++) {
    var tuple = tuples[i];
    if (tuple[0] == "Edge") {
      return tuple;
    }
  }
};
goog.labs.userAgent.engine.isVersionOrHigher = function(version) {
  return goog.string.compareVersions(goog.labs.userAgent.engine.getVersion(), version) >= 0;
};
goog.labs.userAgent.engine.getVersionForKey_ = function(tuples, key) {
  var pair = goog.array.find(tuples, function(pair) {
    return key == pair[0];
  });
  return pair && pair[1] || "";
};
goog.labs.userAgent.platform = {};
goog.labs.userAgent.platform.isAndroid = function() {
  return goog.labs.userAgent.util.matchUserAgent("Android");
};
goog.labs.userAgent.platform.isIpod = function() {
  return goog.labs.userAgent.util.matchUserAgent("iPod");
};
goog.labs.userAgent.platform.isIphone = function() {
  return goog.labs.userAgent.util.matchUserAgent("iPhone") && !goog.labs.userAgent.util.matchUserAgent("iPod") && !goog.labs.userAgent.util.matchUserAgent("iPad");
};
goog.labs.userAgent.platform.isIpad = function() {
  return goog.labs.userAgent.util.matchUserAgent("iPad");
};
goog.labs.userAgent.platform.isIos = function() {
  return goog.labs.userAgent.platform.isIphone() || goog.labs.userAgent.platform.isIpad() || goog.labs.userAgent.platform.isIpod();
};
goog.labs.userAgent.platform.isMacintosh = function() {
  return goog.labs.userAgent.util.matchUserAgent("Macintosh");
};
goog.labs.userAgent.platform.isLinux = function() {
  return goog.labs.userAgent.util.matchUserAgent("Linux");
};
goog.labs.userAgent.platform.isWindows = function() {
  return goog.labs.userAgent.util.matchUserAgent("Windows");
};
goog.labs.userAgent.platform.isChromeOS = function() {
  return goog.labs.userAgent.util.matchUserAgent("CrOS");
};
goog.labs.userAgent.platform.getVersion = function() {
  var userAgentString = goog.labs.userAgent.util.getUserAgent();
  var version = "";
  var re;
  if (goog.labs.userAgent.platform.isWindows()) {
    re = /Windows (?:NT|Phone) ([0-9.]+)/;
    var match = re.exec(userAgentString);
    if (match) {
      version = match[1];
    } else {
      version = "0.0";
    }
  } else {
    if (goog.labs.userAgent.platform.isIos()) {
      re = /(?:iPhone|iPod|iPad|CPU)\s+OS\s+(\S+)/;
      match = re.exec(userAgentString);
      version = match && match[1].replace(/_/g, ".");
    } else {
      if (goog.labs.userAgent.platform.isMacintosh()) {
        re = /Mac OS X ([0-9_.]+)/;
        match = re.exec(userAgentString);
        version = match ? match[1].replace(/_/g, ".") : "10";
      } else {
        if (goog.labs.userAgent.platform.isAndroid()) {
          re = /Android\s+([^\);]+)(\)|;)/;
          match = re.exec(userAgentString);
          version = match && match[1];
        } else {
          if (goog.labs.userAgent.platform.isChromeOS()) {
            re = /(?:CrOS\s+(?:i686|x86_64)\s+([0-9.]+))/;
            match = re.exec(userAgentString);
            version = match && match[1];
          }
        }
      }
    }
  }
  return version || "";
};
goog.labs.userAgent.platform.isVersionOrHigher = function(version) {
  return goog.string.compareVersions(goog.labs.userAgent.platform.getVersion(), version) >= 0;
};
goog.reflect = {};
goog.reflect.object = function(type, object) {
  return object;
};
goog.reflect.objectProperty = function(prop, object) {
  return prop;
};
goog.reflect.sinkValue = function(x) {
  goog.reflect.sinkValue[" "](x);
  return x;
};
goog.reflect.sinkValue[" "] = goog.nullFunction;
goog.reflect.canAccessProperty = function(obj, prop) {
  try {
    goog.reflect.sinkValue(obj[prop]);
    return true;
  } catch (e) {
  }
  return false;
};
goog.reflect.cache = function(cacheObj, key, valueFn, opt_keyFn) {
  var storedKey = opt_keyFn ? opt_keyFn(key) : key;
  if (Object.prototype.hasOwnProperty.call(cacheObj, storedKey)) {
    return cacheObj[storedKey];
  }
  return cacheObj[storedKey] = valueFn(key);
};
goog.userAgent = {};
goog.userAgent.ASSUME_IE = false;
goog.userAgent.ASSUME_EDGE = false;
goog.userAgent.ASSUME_GECKO = false;
goog.userAgent.ASSUME_WEBKIT = false;
goog.userAgent.ASSUME_MOBILE_WEBKIT = false;
goog.userAgent.ASSUME_OPERA = false;
goog.userAgent.ASSUME_ANY_VERSION = false;
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_EDGE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
goog.userAgent.getUserAgentString = function() {
  return goog.labs.userAgent.util.getUserAgent();
};
goog.userAgent.getNavigator = function() {
  return goog.global["navigator"] || null;
};
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.labs.userAgent.browser.isOpera();
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.labs.userAgent.browser.isIE();
goog.userAgent.EDGE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_EDGE : goog.labs.userAgent.engine.isEdge();
goog.userAgent.EDGE_OR_IE = goog.userAgent.EDGE || goog.userAgent.IE;
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.labs.userAgent.engine.isGecko();
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.labs.userAgent.engine.isWebKit();
goog.userAgent.isMobile_ = function() {
  return goog.userAgent.WEBKIT && goog.labs.userAgent.util.matchUserAgent("Mobile");
};
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.isMobile_();
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || "";
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.userAgent.ASSUME_MAC = false;
goog.userAgent.ASSUME_WINDOWS = false;
goog.userAgent.ASSUME_LINUX = false;
goog.userAgent.ASSUME_X11 = false;
goog.userAgent.ASSUME_ANDROID = false;
goog.userAgent.ASSUME_IPHONE = false;
goog.userAgent.ASSUME_IPAD = false;
goog.userAgent.ASSUME_IPOD = false;
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11 || goog.userAgent.ASSUME_ANDROID || goog.userAgent.ASSUME_IPHONE || goog.userAgent.ASSUME_IPAD || goog.userAgent.ASSUME_IPOD;
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.labs.userAgent.platform.isMacintosh();
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.labs.userAgent.platform.isWindows();
goog.userAgent.isLegacyLinux_ = function() {
  return goog.labs.userAgent.platform.isLinux() || goog.labs.userAgent.platform.isChromeOS();
};
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.isLegacyLinux_();
goog.userAgent.isX11_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return !!navigator && goog.string.contains(navigator["appVersion"] || "", "X11");
};
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.isX11_();
goog.userAgent.ANDROID = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_ANDROID : goog.labs.userAgent.platform.isAndroid();
goog.userAgent.IPHONE = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_IPHONE : goog.labs.userAgent.platform.isIphone();
goog.userAgent.IPAD = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_IPAD : goog.labs.userAgent.platform.isIpad();
goog.userAgent.IPOD = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_IPOD : goog.labs.userAgent.platform.isIpod();
goog.userAgent.IOS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_IPHONE || goog.userAgent.ASSUME_IPAD || goog.userAgent.ASSUME_IPOD : goog.labs.userAgent.platform.isIos();
goog.userAgent.determineVersion_ = function() {
  var version = "";
  var arr = goog.userAgent.getVersionRegexResult_();
  if (arr) {
    version = arr ? arr[1] : "";
  }
  if (goog.userAgent.IE) {
    var docMode = goog.userAgent.getDocumentMode_();
    if (docMode != null && docMode > parseFloat(version)) {
      return String(docMode);
    }
  }
  return version;
};
goog.userAgent.getVersionRegexResult_ = function() {
  var userAgent = goog.userAgent.getUserAgentString();
  if (goog.userAgent.GECKO) {
    return /rv\:([^\);]+)(\)|;)/.exec(userAgent);
  }
  if (goog.userAgent.EDGE) {
    return /Edge\/([\d\.]+)/.exec(userAgent);
  }
  if (goog.userAgent.IE) {
    return /\b(?:MSIE|rv)[: ]([^\);]+)(\)|;)/.exec(userAgent);
  }
  if (goog.userAgent.WEBKIT) {
    return /WebKit\/(\S+)/.exec(userAgent);
  }
  if (goog.userAgent.OPERA) {
    return /(?:Version)[ \/]?(\S+)/.exec(userAgent);
  }
  return undefined;
};
goog.userAgent.getDocumentMode_ = function() {
  var doc = goog.global["document"];
  return doc ? doc["documentMode"] : undefined;
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2);
};
goog.userAgent.isVersionOrHigherCache_ = {};
goog.userAgent.isVersionOrHigher = function(version) {
  return goog.userAgent.ASSUME_ANY_VERSION || goog.reflect.cache(goog.userAgent.isVersionOrHigherCache_, version, function() {
    return goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0;
  });
};
goog.userAgent.isVersion = goog.userAgent.isVersionOrHigher;
goog.userAgent.isDocumentModeOrHigher = function(documentMode) {
  return Number(goog.userAgent.DOCUMENT_MODE) >= documentMode;
};
goog.userAgent.isDocumentMode = goog.userAgent.isDocumentModeOrHigher;
goog.userAgent.DOCUMENT_MODE = function() {
  var doc = goog.global["document"];
  var mode = goog.userAgent.getDocumentMode_();
  if (!doc || !goog.userAgent.IE) {
    return undefined;
  }
  return mode || (doc["compatMode"] == "CSS1Compat" ? parseInt(goog.userAgent.VERSION, 10) : 5);
}();
goog.dom.BrowserFeature = {CAN_ADD_NAME_OR_TYPE_ATTRIBUTES:!goog.userAgent.IE || goog.userAgent.isDocumentModeOrHigher(9), CAN_USE_CHILDREN_ATTRIBUTE:!goog.userAgent.GECKO && !goog.userAgent.IE || goog.userAgent.IE && goog.userAgent.isDocumentModeOrHigher(9) || goog.userAgent.GECKO && goog.userAgent.isVersionOrHigher("1.9.1"), CAN_USE_INNER_TEXT:goog.userAgent.IE && !goog.userAgent.isVersionOrHigher("9"), CAN_USE_PARENT_ELEMENT_PROPERTY:goog.userAgent.IE || goog.userAgent.OPERA || goog.userAgent.WEBKIT, 
INNER_HTML_NEEDS_SCOPED_ELEMENT:goog.userAgent.IE, LEGACY_IE_RANGES:goog.userAgent.IE && !goog.userAgent.isDocumentModeOrHigher(9)};
goog.dom.asserts = {};
goog.dom.asserts.assertIsLocation = function(o) {
  if (goog.asserts.ENABLE_ASSERTS) {
    var win = goog.dom.asserts.getWindow_(o);
    if (typeof win.Location != "undefined" && typeof win.Element != "undefined") {
      goog.asserts.assert(o && (o instanceof win.Location || !(o instanceof win.Element)), "Argument is not a Location (or a non-Element mock); got: %s", goog.dom.asserts.debugStringForType_(o));
    }
  }
  return o;
};
goog.dom.asserts.assertIsElementType_ = function(o, typename) {
  if (goog.asserts.ENABLE_ASSERTS) {
    var win = goog.dom.asserts.getWindow_(o);
    if (typeof win[typename] != "undefined" && typeof win.Location != "undefined" && typeof win.Element != "undefined") {
      goog.asserts.assert(o && (o instanceof win[typename] || !(o instanceof win.Location || o instanceof win.Element)), "Argument is not a %s (or a non-Element, non-Location mock); got: %s", typename, goog.dom.asserts.debugStringForType_(o));
    }
  }
  return o;
};
goog.dom.asserts.assertIsHTMLAnchorElement = function(o) {
  return goog.dom.asserts.assertIsElementType_(o, "HTMLAnchorElement");
};
goog.dom.asserts.assertIsHTMLButtonElement = function(o) {
  return goog.dom.asserts.assertIsElementType_(o, "HTMLButtonElement");
};
goog.dom.asserts.assertIsHTMLLinkElement = function(o) {
  return goog.dom.asserts.assertIsElementType_(o, "HTMLLinkElement");
};
goog.dom.asserts.assertIsHTMLImageElement = function(o) {
  return goog.dom.asserts.assertIsElementType_(o, "HTMLImageElement");
};
goog.dom.asserts.assertIsHTMLInputElement = function(o) {
  return goog.dom.asserts.assertIsElementType_(o, "HTMLInputElement");
};
goog.dom.asserts.assertIsHTMLEmbedElement = function(o) {
  return goog.dom.asserts.assertIsElementType_(o, "HTMLEmbedElement");
};
goog.dom.asserts.assertIsHTMLFormElement = function(o) {
  return goog.dom.asserts.assertIsElementType_(o, "HTMLFormElement");
};
goog.dom.asserts.assertIsHTMLFrameElement = function(o) {
  return goog.dom.asserts.assertIsElementType_(o, "HTMLFrameElement");
};
goog.dom.asserts.assertIsHTMLIFrameElement = function(o) {
  return goog.dom.asserts.assertIsElementType_(o, "HTMLIFrameElement");
};
goog.dom.asserts.assertIsHTMLObjectElement = function(o) {
  return goog.dom.asserts.assertIsElementType_(o, "HTMLObjectElement");
};
goog.dom.asserts.assertIsHTMLScriptElement = function(o) {
  return goog.dom.asserts.assertIsElementType_(o, "HTMLScriptElement");
};
goog.dom.asserts.debugStringForType_ = function(value) {
  if (goog.isObject(value)) {
    return value.constructor.displayName || value.constructor.name || Object.prototype.toString.call(value);
  } else {
    return value === undefined ? "undefined" : value === null ? "null" : typeof value;
  }
};
goog.dom.asserts.getWindow_ = function(o) {
  var doc = o && o.ownerDocument;
  var win = doc && (doc.defaultView || doc.parentWindow);
  return win || goog.global;
};
goog.dom.tags = {};
goog.dom.tags.VOID_TAGS_ = {"area":true, "base":true, "br":true, "col":true, "command":true, "embed":true, "hr":true, "img":true, "input":true, "keygen":true, "link":true, "meta":true, "param":true, "source":true, "track":true, "wbr":true};
goog.dom.tags.isVoidTag = function(tagName) {
  return goog.dom.tags.VOID_TAGS_[tagName] === true;
};
goog.string.TypedString = function() {
};
goog.string.TypedString.prototype.implementsGoogStringTypedString;
goog.string.TypedString.prototype.getTypedStringValue;
goog.string.Const = function() {
  this.stringConstValueWithSecurityContract__googStringSecurityPrivate_ = "";
  this.STRING_CONST_TYPE_MARKER__GOOG_STRING_SECURITY_PRIVATE_ = goog.string.Const.TYPE_MARKER_;
};
goog.string.Const.prototype.implementsGoogStringTypedString = true;
goog.string.Const.prototype.getTypedStringValue = function() {
  return this.stringConstValueWithSecurityContract__googStringSecurityPrivate_;
};
goog.string.Const.prototype.toString = function() {
  return "Const{" + this.stringConstValueWithSecurityContract__googStringSecurityPrivate_ + "}";
};
goog.string.Const.unwrap = function(stringConst) {
  if (stringConst instanceof goog.string.Const && stringConst.constructor === goog.string.Const && stringConst.STRING_CONST_TYPE_MARKER__GOOG_STRING_SECURITY_PRIVATE_ === goog.string.Const.TYPE_MARKER_) {
    return stringConst.stringConstValueWithSecurityContract__googStringSecurityPrivate_;
  } else {
    goog.asserts.fail("expected object of type Const, got '" + stringConst + "'");
    return "type_error:Const";
  }
};
goog.string.Const.from = function(s) {
  return goog.string.Const.create__googStringSecurityPrivate_(s);
};
goog.string.Const.TYPE_MARKER_ = {};
goog.string.Const.create__googStringSecurityPrivate_ = function(s) {
  var stringConst = new goog.string.Const;
  stringConst.stringConstValueWithSecurityContract__googStringSecurityPrivate_ = s;
  return stringConst;
};
goog.string.Const.EMPTY = goog.string.Const.from("");
goog.html = {};
goog.html.SafeScript = function() {
  this.privateDoNotAccessOrElseSafeScriptWrappedValue_ = "";
  this.SAFE_SCRIPT_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ = goog.html.SafeScript.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_;
};
goog.html.SafeScript.prototype.implementsGoogStringTypedString = true;
goog.html.SafeScript.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ = {};
goog.html.SafeScript.fromConstant = function(script) {
  var scriptString = goog.string.Const.unwrap(script);
  if (scriptString.length === 0) {
    return goog.html.SafeScript.EMPTY;
  }
  return goog.html.SafeScript.createSafeScriptSecurityPrivateDoNotAccessOrElse(scriptString);
};
goog.html.SafeScript.prototype.getTypedStringValue = function() {
  return this.privateDoNotAccessOrElseSafeScriptWrappedValue_;
};
if (goog.DEBUG) {
  goog.html.SafeScript.prototype.toString = function() {
    return "SafeScript{" + this.privateDoNotAccessOrElseSafeScriptWrappedValue_ + "}";
  };
}
goog.html.SafeScript.unwrap = function(safeScript) {
  if (safeScript instanceof goog.html.SafeScript && safeScript.constructor === goog.html.SafeScript && safeScript.SAFE_SCRIPT_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ === goog.html.SafeScript.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_) {
    return safeScript.privateDoNotAccessOrElseSafeScriptWrappedValue_;
  } else {
    goog.asserts.fail("expected object of type SafeScript, got '" + safeScript + "' of type " + goog.typeOf(safeScript));
    return "type_error:SafeScript";
  }
};
goog.html.SafeScript.createSafeScriptSecurityPrivateDoNotAccessOrElse = function(script) {
  return (new goog.html.SafeScript).initSecurityPrivateDoNotAccessOrElse_(script);
};
goog.html.SafeScript.prototype.initSecurityPrivateDoNotAccessOrElse_ = function(script) {
  this.privateDoNotAccessOrElseSafeScriptWrappedValue_ = script;
  return this;
};
goog.html.SafeScript.EMPTY = goog.html.SafeScript.createSafeScriptSecurityPrivateDoNotAccessOrElse("");
goog.fs = {};
goog.fs.url = {};
goog.fs.url.createObjectUrl = function(blob) {
  return goog.fs.url.getUrlObject_().createObjectURL(blob);
};
goog.fs.url.revokeObjectUrl = function(url) {
  goog.fs.url.getUrlObject_().revokeObjectURL(url);
};
goog.fs.url.UrlObject_;
goog.fs.url.getUrlObject_ = function() {
  var urlObject = goog.fs.url.findUrlObject_();
  if (urlObject != null) {
    return urlObject;
  } else {
    throw new Error("This browser doesn't seem to support blob URLs");
  }
};
goog.fs.url.findUrlObject_ = function() {
  if (goog.isDef(goog.global.URL) && goog.isDef(goog.global.URL.createObjectURL)) {
    return goog.global.URL;
  } else {
    if (goog.isDef(goog.global.webkitURL) && goog.isDef(goog.global.webkitURL.createObjectURL)) {
      return goog.global.webkitURL;
    } else {
      if (goog.isDef(goog.global.createObjectURL)) {
        return goog.global;
      } else {
        return null;
      }
    }
  }
};
goog.fs.url.browserSupportsObjectUrls = function() {
  return goog.fs.url.findUrlObject_() != null;
};
goog.i18n = {};
goog.i18n.bidi = {};
goog.i18n.bidi.FORCE_RTL = false;
goog.i18n.bidi.IS_RTL = goog.i18n.bidi.FORCE_RTL || (goog.LOCALE.substring(0, 2).toLowerCase() == "ar" || goog.LOCALE.substring(0, 2).toLowerCase() == "fa" || goog.LOCALE.substring(0, 2).toLowerCase() == "he" || goog.LOCALE.substring(0, 2).toLowerCase() == "iw" || goog.LOCALE.substring(0, 2).toLowerCase() == "ps" || goog.LOCALE.substring(0, 2).toLowerCase() == "sd" || goog.LOCALE.substring(0, 2).toLowerCase() == "ug" || goog.LOCALE.substring(0, 2).toLowerCase() == "ur" || goog.LOCALE.substring(0, 
2).toLowerCase() == "yi") && (goog.LOCALE.length == 2 || goog.LOCALE.substring(2, 3) == "-" || goog.LOCALE.substring(2, 3) == "_") || goog.LOCALE.length >= 3 && goog.LOCALE.substring(0, 3).toLowerCase() == "ckb" && (goog.LOCALE.length == 3 || goog.LOCALE.substring(3, 4) == "-" || goog.LOCALE.substring(3, 4) == "_");
goog.i18n.bidi.Format = {LRE:"\u202a", RLE:"\u202b", PDF:"\u202c", LRM:"\u200e", RLM:"\u200f"};
goog.i18n.bidi.Dir = {LTR:1, RTL:-1, NEUTRAL:0};
goog.i18n.bidi.RIGHT = "right";
goog.i18n.bidi.LEFT = "left";
goog.i18n.bidi.I18N_RIGHT = goog.i18n.bidi.IS_RTL ? goog.i18n.bidi.LEFT : goog.i18n.bidi.RIGHT;
goog.i18n.bidi.I18N_LEFT = goog.i18n.bidi.IS_RTL ? goog.i18n.bidi.RIGHT : goog.i18n.bidi.LEFT;
goog.i18n.bidi.toDir = function(givenDir, opt_noNeutral) {
  if (typeof givenDir == "number") {
    return givenDir > 0 ? goog.i18n.bidi.Dir.LTR : givenDir < 0 ? goog.i18n.bidi.Dir.RTL : opt_noNeutral ? null : goog.i18n.bidi.Dir.NEUTRAL;
  } else {
    if (givenDir == null) {
      return null;
    } else {
      return givenDir ? goog.i18n.bidi.Dir.RTL : goog.i18n.bidi.Dir.LTR;
    }
  }
};
goog.i18n.bidi.ltrChars_ = "A-Za-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02b8\u0300-\u0590\u0800-\u1fff" + "\u200e\u2c00-\ufb1c\ufe00-\ufe6f\ufefd-\uffff";
goog.i18n.bidi.rtlChars_ = "\u0591-\u06ef\u06fa-\u07ff\u200f\ufb1d-\ufdff\ufe70-\ufefc";
goog.i18n.bidi.htmlSkipReg_ = /<[^>]*>|&[^;]+;/g;
goog.i18n.bidi.stripHtmlIfNeeded_ = function(str, opt_isStripNeeded) {
  return opt_isStripNeeded ? str.replace(goog.i18n.bidi.htmlSkipReg_, "") : str;
};
goog.i18n.bidi.rtlCharReg_ = new RegExp("[" + goog.i18n.bidi.rtlChars_ + "]");
goog.i18n.bidi.ltrCharReg_ = new RegExp("[" + goog.i18n.bidi.ltrChars_ + "]");
goog.i18n.bidi.hasAnyRtl = function(str, opt_isHtml) {
  return goog.i18n.bidi.rtlCharReg_.test(goog.i18n.bidi.stripHtmlIfNeeded_(str, opt_isHtml));
};
goog.i18n.bidi.hasRtlChar = goog.i18n.bidi.hasAnyRtl;
goog.i18n.bidi.hasAnyLtr = function(str, opt_isHtml) {
  return goog.i18n.bidi.ltrCharReg_.test(goog.i18n.bidi.stripHtmlIfNeeded_(str, opt_isHtml));
};
goog.i18n.bidi.ltrRe_ = new RegExp("^[" + goog.i18n.bidi.ltrChars_ + "]");
goog.i18n.bidi.rtlRe_ = new RegExp("^[" + goog.i18n.bidi.rtlChars_ + "]");
goog.i18n.bidi.isRtlChar = function(str) {
  return goog.i18n.bidi.rtlRe_.test(str);
};
goog.i18n.bidi.isLtrChar = function(str) {
  return goog.i18n.bidi.ltrRe_.test(str);
};
goog.i18n.bidi.isNeutralChar = function(str) {
  return !goog.i18n.bidi.isLtrChar(str) && !goog.i18n.bidi.isRtlChar(str);
};
goog.i18n.bidi.ltrDirCheckRe_ = new RegExp("^[^" + goog.i18n.bidi.rtlChars_ + "]*[" + goog.i18n.bidi.ltrChars_ + "]");
goog.i18n.bidi.rtlDirCheckRe_ = new RegExp("^[^" + goog.i18n.bidi.ltrChars_ + "]*[" + goog.i18n.bidi.rtlChars_ + "]");
goog.i18n.bidi.startsWithRtl = function(str, opt_isHtml) {
  return goog.i18n.bidi.rtlDirCheckRe_.test(goog.i18n.bidi.stripHtmlIfNeeded_(str, opt_isHtml));
};
goog.i18n.bidi.isRtlText = goog.i18n.bidi.startsWithRtl;
goog.i18n.bidi.startsWithLtr = function(str, opt_isHtml) {
  return goog.i18n.bidi.ltrDirCheckRe_.test(goog.i18n.bidi.stripHtmlIfNeeded_(str, opt_isHtml));
};
goog.i18n.bidi.isLtrText = goog.i18n.bidi.startsWithLtr;
goog.i18n.bidi.isRequiredLtrRe_ = /^http:\/\/.*/;
goog.i18n.bidi.isNeutralText = function(str, opt_isHtml) {
  str = goog.i18n.bidi.stripHtmlIfNeeded_(str, opt_isHtml);
  return goog.i18n.bidi.isRequiredLtrRe_.test(str) || !goog.i18n.bidi.hasAnyLtr(str) && !goog.i18n.bidi.hasAnyRtl(str);
};
goog.i18n.bidi.ltrExitDirCheckRe_ = new RegExp("[" + goog.i18n.bidi.ltrChars_ + "][^" + goog.i18n.bidi.rtlChars_ + "]*$");
goog.i18n.bidi.rtlExitDirCheckRe_ = new RegExp("[" + goog.i18n.bidi.rtlChars_ + "][^" + goog.i18n.bidi.ltrChars_ + "]*$");
goog.i18n.bidi.endsWithLtr = function(str, opt_isHtml) {
  return goog.i18n.bidi.ltrExitDirCheckRe_.test(goog.i18n.bidi.stripHtmlIfNeeded_(str, opt_isHtml));
};
goog.i18n.bidi.isLtrExitText = goog.i18n.bidi.endsWithLtr;
goog.i18n.bidi.endsWithRtl = function(str, opt_isHtml) {
  return goog.i18n.bidi.rtlExitDirCheckRe_.test(goog.i18n.bidi.stripHtmlIfNeeded_(str, opt_isHtml));
};
goog.i18n.bidi.isRtlExitText = goog.i18n.bidi.endsWithRtl;
goog.i18n.bidi.rtlLocalesRe_ = new RegExp("^(ar|ckb|dv|he|iw|fa|nqo|ps|sd|ug|ur|yi|" + ".*[-_](Arab|Hebr|Thaa|Nkoo|Tfng))" + "(?!.*[-_](Latn|Cyrl)($|-|_))($|-|_)", "i");
goog.i18n.bidi.isRtlLanguage = function(lang) {
  return goog.i18n.bidi.rtlLocalesRe_.test(lang);
};
goog.i18n.bidi.bracketGuardTextRe_ = /(\(.*?\)+)|(\[.*?\]+)|(\{.*?\}+)|(<.*?>+)/g;
goog.i18n.bidi.guardBracketInText = function(s, opt_isRtlContext) {
  var useRtl = opt_isRtlContext === undefined ? goog.i18n.bidi.hasAnyRtl(s) : opt_isRtlContext;
  var mark = useRtl ? goog.i18n.bidi.Format.RLM : goog.i18n.bidi.Format.LRM;
  return s.replace(goog.i18n.bidi.bracketGuardTextRe_, mark + "$&" + mark);
};
goog.i18n.bidi.enforceRtlInHtml = function(html) {
  if (html.charAt(0) == "<") {
    return html.replace(/<\w+/, "$& dir=rtl");
  }
  return "\n<span dir=rtl>" + html + "</span>";
};
goog.i18n.bidi.enforceRtlInText = function(text) {
  return goog.i18n.bidi.Format.RLE + text + goog.i18n.bidi.Format.PDF;
};
goog.i18n.bidi.enforceLtrInHtml = function(html) {
  if (html.charAt(0) == "<") {
    return html.replace(/<\w+/, "$& dir=ltr");
  }
  return "\n<span dir=ltr>" + html + "</span>";
};
goog.i18n.bidi.enforceLtrInText = function(text) {
  return goog.i18n.bidi.Format.LRE + text + goog.i18n.bidi.Format.PDF;
};
goog.i18n.bidi.dimensionsRe_ = /:\s*([.\d][.\w]*)\s+([.\d][.\w]*)\s+([.\d][.\w]*)\s+([.\d][.\w]*)/g;
goog.i18n.bidi.leftRe_ = /left/gi;
goog.i18n.bidi.rightRe_ = /right/gi;
goog.i18n.bidi.tempRe_ = /%%%%/g;
goog.i18n.bidi.mirrorCSS = function(cssStr) {
  return cssStr.replace(goog.i18n.bidi.dimensionsRe_, ":$1 $4 $3 $2").replace(goog.i18n.bidi.leftRe_, "%%%%").replace(goog.i18n.bidi.rightRe_, goog.i18n.bidi.LEFT).replace(goog.i18n.bidi.tempRe_, goog.i18n.bidi.RIGHT);
};
goog.i18n.bidi.doubleQuoteSubstituteRe_ = /([\u0591-\u05f2])"/g;
goog.i18n.bidi.singleQuoteSubstituteRe_ = /([\u0591-\u05f2])'/g;
goog.i18n.bidi.normalizeHebrewQuote = function(str) {
  return str.replace(goog.i18n.bidi.doubleQuoteSubstituteRe_, "$1\u05f4").replace(goog.i18n.bidi.singleQuoteSubstituteRe_, "$1\u05f3");
};
goog.i18n.bidi.wordSeparatorRe_ = /\s+/;
goog.i18n.bidi.hasNumeralsRe_ = /[\d\u06f0-\u06f9]/;
goog.i18n.bidi.rtlDetectionThreshold_ = 0.40;
goog.i18n.bidi.estimateDirection = function(str, opt_isHtml) {
  var rtlCount = 0;
  var totalCount = 0;
  var hasWeaklyLtr = false;
  var tokens = goog.i18n.bidi.stripHtmlIfNeeded_(str, opt_isHtml).split(goog.i18n.bidi.wordSeparatorRe_);
  for (var i = 0;i < tokens.length;i++) {
    var token = tokens[i];
    if (goog.i18n.bidi.startsWithRtl(token)) {
      rtlCount++;
      totalCount++;
    } else {
      if (goog.i18n.bidi.isRequiredLtrRe_.test(token)) {
        hasWeaklyLtr = true;
      } else {
        if (goog.i18n.bidi.hasAnyLtr(token)) {
          totalCount++;
        } else {
          if (goog.i18n.bidi.hasNumeralsRe_.test(token)) {
            hasWeaklyLtr = true;
          }
        }
      }
    }
  }
  return totalCount == 0 ? hasWeaklyLtr ? goog.i18n.bidi.Dir.LTR : goog.i18n.bidi.Dir.NEUTRAL : rtlCount / totalCount > goog.i18n.bidi.rtlDetectionThreshold_ ? goog.i18n.bidi.Dir.RTL : goog.i18n.bidi.Dir.LTR;
};
goog.i18n.bidi.detectRtlDirectionality = function(str, opt_isHtml) {
  return goog.i18n.bidi.estimateDirection(str, opt_isHtml) == goog.i18n.bidi.Dir.RTL;
};
goog.i18n.bidi.setElementDirAndAlign = function(element, dir) {
  if (element) {
    dir = goog.i18n.bidi.toDir(dir);
    if (dir) {
      element.style.textAlign = dir == goog.i18n.bidi.Dir.RTL ? goog.i18n.bidi.RIGHT : goog.i18n.bidi.LEFT;
      element.dir = dir == goog.i18n.bidi.Dir.RTL ? "rtl" : "ltr";
    }
  }
};
goog.i18n.bidi.setElementDirByTextDirectionality = function(element, text) {
  switch(goog.i18n.bidi.estimateDirection(text)) {
    case goog.i18n.bidi.Dir.LTR:
      element.dir = "ltr";
      break;
    case goog.i18n.bidi.Dir.RTL:
      element.dir = "rtl";
      break;
    default:
      element.removeAttribute("dir");
  }
};
goog.i18n.bidi.DirectionalString = function() {
};
goog.i18n.bidi.DirectionalString.prototype.implementsGoogI18nBidiDirectionalString;
goog.i18n.bidi.DirectionalString.prototype.getDirection;
goog.html.TrustedResourceUrl = function() {
  this.privateDoNotAccessOrElseTrustedResourceUrlWrappedValue_ = "";
  this.TRUSTED_RESOURCE_URL_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ = goog.html.TrustedResourceUrl.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_;
};
goog.html.TrustedResourceUrl.prototype.implementsGoogStringTypedString = true;
goog.html.TrustedResourceUrl.prototype.getTypedStringValue = function() {
  return this.privateDoNotAccessOrElseTrustedResourceUrlWrappedValue_;
};
goog.html.TrustedResourceUrl.prototype.implementsGoogI18nBidiDirectionalString = true;
goog.html.TrustedResourceUrl.prototype.getDirection = function() {
  return goog.i18n.bidi.Dir.LTR;
};
goog.html.TrustedResourceUrl.prototype.cloneWithParams = function(params) {
  var url = goog.html.TrustedResourceUrl.unwrap(this);
  var separator = /\?/.test(url) ? "&" : "?";
  for (var key in params) {
    var values = goog.isArray(params[key]) ? params[key] : [params[key]];
    for (var i = 0;i < values.length;i++) {
      if (values[i] == null) {
        continue;
      }
      url += separator + encodeURIComponent(key) + "=" + encodeURIComponent(String(values[i]));
      separator = "&";
    }
  }
  return goog.html.TrustedResourceUrl.createTrustedResourceUrlSecurityPrivateDoNotAccessOrElse(url);
};
if (goog.DEBUG) {
  goog.html.TrustedResourceUrl.prototype.toString = function() {
    return "TrustedResourceUrl{" + this.privateDoNotAccessOrElseTrustedResourceUrlWrappedValue_ + "}";
  };
}
goog.html.TrustedResourceUrl.unwrap = function(trustedResourceUrl) {
  if (trustedResourceUrl instanceof goog.html.TrustedResourceUrl && trustedResourceUrl.constructor === goog.html.TrustedResourceUrl && trustedResourceUrl.TRUSTED_RESOURCE_URL_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ === goog.html.TrustedResourceUrl.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_) {
    return trustedResourceUrl.privateDoNotAccessOrElseTrustedResourceUrlWrappedValue_;
  } else {
    goog.asserts.fail("expected object of type TrustedResourceUrl, got '" + trustedResourceUrl + "' of type " + goog.typeOf(trustedResourceUrl));
    return "type_error:TrustedResourceUrl";
  }
};
goog.html.TrustedResourceUrl.format = function(format, args) {
  var formatStr = goog.string.Const.unwrap(format);
  if (!goog.html.TrustedResourceUrl.BASE_URL_.test(formatStr)) {
    throw new Error("Invalid TrustedResourceUrl format: " + formatStr);
  }
  var result = formatStr.replace(goog.html.TrustedResourceUrl.FORMAT_MARKER_, function(match, id) {
    if (!Object.prototype.hasOwnProperty.call(args, id)) {
      throw new Error('Found marker, "' + id + '", in format string, "' + formatStr + '", but no valid label mapping found ' + "in args: " + JSON.stringify(args));
    }
    var arg = args[id];
    if (arg instanceof goog.string.Const) {
      return goog.string.Const.unwrap(arg);
    } else {
      return encodeURIComponent(String(arg));
    }
  });
  return goog.html.TrustedResourceUrl.createTrustedResourceUrlSecurityPrivateDoNotAccessOrElse(result);
};
goog.html.TrustedResourceUrl.FORMAT_MARKER_ = /%{(\w+)}/g;
goog.html.TrustedResourceUrl.BASE_URL_ = /^(?:https:)?\/\/[0-9a-z.:[\]-]+\/|^\/[^\/\\]|^about:blank(#|$)/i;
goog.html.TrustedResourceUrl.formatWithParams = function(format, args, params) {
  var url = goog.html.TrustedResourceUrl.format(format, args);
  return url.cloneWithParams(params);
};
goog.html.TrustedResourceUrl.fromConstant = function(url) {
  return goog.html.TrustedResourceUrl.createTrustedResourceUrlSecurityPrivateDoNotAccessOrElse(goog.string.Const.unwrap(url));
};
goog.html.TrustedResourceUrl.fromConstants = function(parts) {
  var unwrapped = "";
  for (var i = 0;i < parts.length;i++) {
    unwrapped += goog.string.Const.unwrap(parts[i]);
  }
  return goog.html.TrustedResourceUrl.createTrustedResourceUrlSecurityPrivateDoNotAccessOrElse(unwrapped);
};
goog.html.TrustedResourceUrl.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ = {};
goog.html.TrustedResourceUrl.createTrustedResourceUrlSecurityPrivateDoNotAccessOrElse = function(url) {
  var trustedResourceUrl = new goog.html.TrustedResourceUrl;
  trustedResourceUrl.privateDoNotAccessOrElseTrustedResourceUrlWrappedValue_ = url;
  return trustedResourceUrl;
};
goog.html.SafeUrl = function() {
  this.privateDoNotAccessOrElseSafeHtmlWrappedValue_ = "";
  this.SAFE_URL_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ = goog.html.SafeUrl.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_;
};
goog.html.SafeUrl.INNOCUOUS_STRING = "about:invalid#zClosurez";
goog.html.SafeUrl.prototype.implementsGoogStringTypedString = true;
goog.html.SafeUrl.prototype.getTypedStringValue = function() {
  return this.privateDoNotAccessOrElseSafeHtmlWrappedValue_;
};
goog.html.SafeUrl.prototype.implementsGoogI18nBidiDirectionalString = true;
goog.html.SafeUrl.prototype.getDirection = function() {
  return goog.i18n.bidi.Dir.LTR;
};
if (goog.DEBUG) {
  goog.html.SafeUrl.prototype.toString = function() {
    return "SafeUrl{" + this.privateDoNotAccessOrElseSafeHtmlWrappedValue_ + "}";
  };
}
goog.html.SafeUrl.unwrap = function(safeUrl) {
  if (safeUrl instanceof goog.html.SafeUrl && safeUrl.constructor === goog.html.SafeUrl && safeUrl.SAFE_URL_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ === goog.html.SafeUrl.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_) {
    return safeUrl.privateDoNotAccessOrElseSafeHtmlWrappedValue_;
  } else {
    goog.asserts.fail("expected object of type SafeUrl, got '" + safeUrl + "' of type " + goog.typeOf(safeUrl));
    return "type_error:SafeUrl";
  }
};
goog.html.SafeUrl.fromConstant = function(url) {
  return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(goog.string.Const.unwrap(url));
};
goog.html.SAFE_MIME_TYPE_PATTERN_ = new RegExp("^(?:audio/(?:3gpp|3gpp2|aac|midi|mp4|mpeg|ogg|x-m4a|x-wav|webm)|" + "image/(?:bmp|gif|jpeg|jpg|png|tiff|webp)|" + "text/csv|" + "video/(?:mpeg|mp4|ogg|webm))$", "i");
goog.html.SafeUrl.fromBlob = function(blob) {
  var url = goog.html.SAFE_MIME_TYPE_PATTERN_.test(blob.type) ? goog.fs.url.createObjectUrl(blob) : goog.html.SafeUrl.INNOCUOUS_STRING;
  return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(url);
};
goog.html.DATA_URL_PATTERN_ = /^data:([^;,]*);base64,[a-z0-9+\/]+=*$/i;
goog.html.SafeUrl.fromDataUrl = function(dataUrl) {
  var match = dataUrl.match(goog.html.DATA_URL_PATTERN_);
  var valid = match && goog.html.SAFE_MIME_TYPE_PATTERN_.test(match[1]);
  return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(valid ? dataUrl : goog.html.SafeUrl.INNOCUOUS_STRING);
};
goog.html.SafeUrl.fromTelUrl = function(telUrl) {
  if (!goog.string.caseInsensitiveStartsWith(telUrl, "tel:")) {
    telUrl = goog.html.SafeUrl.INNOCUOUS_STRING;
  }
  return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(telUrl);
};
goog.html.SafeUrl.fromTrustedResourceUrl = function(trustedResourceUrl) {
  return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(goog.html.TrustedResourceUrl.unwrap(trustedResourceUrl));
};
goog.html.SAFE_URL_PATTERN_ = /^(?:(?:https?|mailto|ftp):|[^:/?#]*(?:[/?#]|$))/i;
goog.html.SafeUrl.sanitize = function(url) {
  if (url instanceof goog.html.SafeUrl) {
    return url;
  } else {
    if (url.implementsGoogStringTypedString) {
      url = url.getTypedStringValue();
    } else {
      url = String(url);
    }
  }
  if (!goog.html.SAFE_URL_PATTERN_.test(url)) {
    url = goog.html.SafeUrl.INNOCUOUS_STRING;
  }
  return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(url);
};
goog.html.SafeUrl.sanitizeAssertUnchanged = function(url) {
  if (url instanceof goog.html.SafeUrl) {
    return url;
  } else {
    if (url.implementsGoogStringTypedString) {
      url = url.getTypedStringValue();
    } else {
      url = String(url);
    }
  }
  if (!goog.asserts.assert(goog.html.SAFE_URL_PATTERN_.test(url))) {
    url = goog.html.SafeUrl.INNOCUOUS_STRING;
  }
  return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(url);
};
goog.html.SafeUrl.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ = {};
goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse = function(url) {
  var safeUrl = new goog.html.SafeUrl;
  safeUrl.privateDoNotAccessOrElseSafeHtmlWrappedValue_ = url;
  return safeUrl;
};
goog.html.SafeUrl.ABOUT_BLANK = goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse("about:blank");
goog.html.SafeStyle = function() {
  this.privateDoNotAccessOrElseSafeStyleWrappedValue_ = "";
  this.SAFE_STYLE_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ = goog.html.SafeStyle.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_;
};
goog.html.SafeStyle.prototype.implementsGoogStringTypedString = true;
goog.html.SafeStyle.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ = {};
goog.html.SafeStyle.fromConstant = function(style) {
  var styleString = goog.string.Const.unwrap(style);
  if (styleString.length === 0) {
    return goog.html.SafeStyle.EMPTY;
  }
  goog.html.SafeStyle.checkStyle_(styleString);
  goog.asserts.assert(goog.string.endsWith(styleString, ";"), "Last character of style string is not ';': " + styleString);
  goog.asserts.assert(goog.string.contains(styleString, ":"), "Style string must contain at least one ':', to " + 'specify a "name: value" pair: ' + styleString);
  return goog.html.SafeStyle.createSafeStyleSecurityPrivateDoNotAccessOrElse(styleString);
};
goog.html.SafeStyle.checkStyle_ = function(style) {
  goog.asserts.assert(!/[<>]/.test(style), "Forbidden characters in style string: " + style);
};
goog.html.SafeStyle.prototype.getTypedStringValue = function() {
  return this.privateDoNotAccessOrElseSafeStyleWrappedValue_;
};
if (goog.DEBUG) {
  goog.html.SafeStyle.prototype.toString = function() {
    return "SafeStyle{" + this.privateDoNotAccessOrElseSafeStyleWrappedValue_ + "}";
  };
}
goog.html.SafeStyle.unwrap = function(safeStyle) {
  if (safeStyle instanceof goog.html.SafeStyle && safeStyle.constructor === goog.html.SafeStyle && safeStyle.SAFE_STYLE_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ === goog.html.SafeStyle.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_) {
    return safeStyle.privateDoNotAccessOrElseSafeStyleWrappedValue_;
  } else {
    goog.asserts.fail("expected object of type SafeStyle, got '" + safeStyle + "' of type " + goog.typeOf(safeStyle));
    return "type_error:SafeStyle";
  }
};
goog.html.SafeStyle.createSafeStyleSecurityPrivateDoNotAccessOrElse = function(style) {
  return (new goog.html.SafeStyle).initSecurityPrivateDoNotAccessOrElse_(style);
};
goog.html.SafeStyle.prototype.initSecurityPrivateDoNotAccessOrElse_ = function(style) {
  this.privateDoNotAccessOrElseSafeStyleWrappedValue_ = style;
  return this;
};
goog.html.SafeStyle.EMPTY = goog.html.SafeStyle.createSafeStyleSecurityPrivateDoNotAccessOrElse("");
goog.html.SafeStyle.INNOCUOUS_STRING = "zClosurez";
goog.html.SafeStyle.PropertyValue;
goog.html.SafeStyle.PropertyMap;
goog.html.SafeStyle.create = function(map) {
  var style = "";
  for (var name in map) {
    if (!/^[-_a-zA-Z0-9]+$/.test(name)) {
      throw new Error("Name allows only [-_a-zA-Z0-9], got: " + name);
    }
    var value = map[name];
    if (value == null) {
      continue;
    }
    if (goog.isArray(value)) {
      value = goog.array.map(value, goog.html.SafeStyle.sanitizePropertyValue_).join(" ");
    } else {
      value = goog.html.SafeStyle.sanitizePropertyValue_(value);
    }
    style += name + ":" + value + ";";
  }
  if (!style) {
    return goog.html.SafeStyle.EMPTY;
  }
  goog.html.SafeStyle.checkStyle_(style);
  return goog.html.SafeStyle.createSafeStyleSecurityPrivateDoNotAccessOrElse(style);
};
goog.html.SafeStyle.sanitizePropertyValue_ = function(value) {
  if (value instanceof goog.html.SafeUrl) {
    var url = goog.html.SafeUrl.unwrap(value);
    return 'url("' + url.replace(/</g, "%3c").replace(/[\\"]/g, "\\$&") + '")';
  }
  var result = value instanceof goog.string.Const ? goog.string.Const.unwrap(value) : goog.html.SafeStyle.sanitizePropertyValueString_(String(value));
  goog.asserts.assert(!/[{;}]/.test(result), "Value does not allow [{;}].");
  return result;
};
goog.html.SafeStyle.sanitizePropertyValueString_ = function(value) {
  var valueWithoutFunctions = value.replace(goog.html.SafeUrl.FUNCTIONS_RE_, "$1").replace(goog.html.SafeUrl.URL_RE_, "url");
  if (!goog.html.SafeStyle.VALUE_RE_.test(valueWithoutFunctions)) {
    goog.asserts.fail("String value allows only " + goog.html.SafeStyle.VALUE_ALLOWED_CHARS_ + " and simple functions, got: " + value);
    return goog.html.SafeStyle.INNOCUOUS_STRING;
  } else {
    if (!goog.html.SafeStyle.hasBalancedQuotes_(value)) {
      goog.asserts.fail("String value requires balanced quotes, got: " + value);
      return goog.html.SafeStyle.INNOCUOUS_STRING;
    }
  }
  return goog.html.SafeStyle.sanitizeUrl_(value);
};
goog.html.SafeStyle.hasBalancedQuotes_ = function(value) {
  var outsideSingle = true;
  var outsideDouble = true;
  for (var i = 0;i < value.length;i++) {
    var c = value.charAt(i);
    if (c == "'" && outsideDouble) {
      outsideSingle = !outsideSingle;
    } else {
      if (c == '"' && outsideSingle) {
        outsideDouble = !outsideDouble;
      }
    }
  }
  return outsideSingle && outsideDouble;
};
goog.html.SafeStyle.VALUE_ALLOWED_CHARS_ = "[-,.\"'%_!# a-zA-Z0-9]";
goog.html.SafeStyle.VALUE_RE_ = new RegExp("^" + goog.html.SafeStyle.VALUE_ALLOWED_CHARS_ + "+$");
goog.html.SafeUrl.URL_RE_ = new RegExp("\\b(url\\([ \t\n]*)(" + "'[ -&(-\\[\\]-~]*'" + '|"[ !#-\\[\\]-~]*"' + "|[!#-&*-\\[\\]-~]*" + ")([ \t\n]*\\))", "g");
goog.html.SafeUrl.FUNCTIONS_RE_ = new RegExp("\\b(hsl|hsla|rgb|rgba|(rotate|scale|translate)(X|Y|Z|3d)?)" + "\\([-0-9a-z.%, ]+\\)", "g");
goog.html.SafeStyle.sanitizeUrl_ = function(value) {
  return value.replace(goog.html.SafeUrl.URL_RE_, function(match$jscomp$0, before, url, after) {
    var quote = "";
    url = url.replace(/^(['"])(.*)\1$/, function(match, start, inside) {
      quote = start;
      return inside;
    });
    var sanitized = goog.html.SafeUrl.sanitize(url).getTypedStringValue();
    return before + quote + sanitized + quote + after;
  });
};
goog.html.SafeStyle.concat = function(var_args) {
  var style = "";
  var addArgument = function(argument) {
    if (goog.isArray(argument)) {
      goog.array.forEach(argument, addArgument);
    } else {
      style += goog.html.SafeStyle.unwrap(argument);
    }
  };
  goog.array.forEach(arguments, addArgument);
  if (!style) {
    return goog.html.SafeStyle.EMPTY;
  }
  return goog.html.SafeStyle.createSafeStyleSecurityPrivateDoNotAccessOrElse(style);
};
goog.html.SafeStyleSheet = function() {
  this.privateDoNotAccessOrElseSafeStyleSheetWrappedValue_ = "";
  this.SAFE_STYLE_SHEET_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ = goog.html.SafeStyleSheet.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_;
};
goog.html.SafeStyleSheet.prototype.implementsGoogStringTypedString = true;
goog.html.SafeStyleSheet.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ = {};
goog.html.SafeStyleSheet.createRule = function(selector, style) {
  if (goog.string.contains(selector, "<")) {
    throw new Error("Selector does not allow '<', got: " + selector);
  }
  var selectorToCheck = selector.replace(/('|")((?!\1)[^\r\n\f\\]|\\[\s\S])*\1/g, "");
  if (!/^[-_a-zA-Z0-9#.:* ,>+~[\]()=^$|]+$/.test(selectorToCheck)) {
    throw new Error("Selector allows only [-_a-zA-Z0-9#.:* ,>+~[\\]()=^$|] and " + "strings, got: " + selector);
  }
  if (!goog.html.SafeStyleSheet.hasBalancedBrackets_(selectorToCheck)) {
    throw new Error("() and [] in selector must be balanced, got: " + selector);
  }
  if (!(style instanceof goog.html.SafeStyle)) {
    style = goog.html.SafeStyle.create(style);
  }
  var styleSheet = selector + "{" + goog.html.SafeStyle.unwrap(style) + "}";
  return goog.html.SafeStyleSheet.createSafeStyleSheetSecurityPrivateDoNotAccessOrElse(styleSheet);
};
goog.html.SafeStyleSheet.hasBalancedBrackets_ = function(s) {
  var brackets = {"(":")", "[":"]"};
  var expectedBrackets = [];
  for (var i = 0;i < s.length;i++) {
    var ch = s[i];
    if (brackets[ch]) {
      expectedBrackets.push(brackets[ch]);
    } else {
      if (goog.object.contains(brackets, ch)) {
        if (expectedBrackets.pop() != ch) {
          return false;
        }
      }
    }
  }
  return expectedBrackets.length == 0;
};
goog.html.SafeStyleSheet.concat = function(var_args) {
  var result = "";
  var addArgument = function(argument) {
    if (goog.isArray(argument)) {
      goog.array.forEach(argument, addArgument);
    } else {
      result += goog.html.SafeStyleSheet.unwrap(argument);
    }
  };
  goog.array.forEach(arguments, addArgument);
  return goog.html.SafeStyleSheet.createSafeStyleSheetSecurityPrivateDoNotAccessOrElse(result);
};
goog.html.SafeStyleSheet.fromConstant = function(styleSheet) {
  var styleSheetString = goog.string.Const.unwrap(styleSheet);
  if (styleSheetString.length === 0) {
    return goog.html.SafeStyleSheet.EMPTY;
  }
  goog.asserts.assert(!goog.string.contains(styleSheetString, "<"), "Forbidden '<' character in style sheet string: " + styleSheetString);
  return goog.html.SafeStyleSheet.createSafeStyleSheetSecurityPrivateDoNotAccessOrElse(styleSheetString);
};
goog.html.SafeStyleSheet.prototype.getTypedStringValue = function() {
  return this.privateDoNotAccessOrElseSafeStyleSheetWrappedValue_;
};
if (goog.DEBUG) {
  goog.html.SafeStyleSheet.prototype.toString = function() {
    return "SafeStyleSheet{" + this.privateDoNotAccessOrElseSafeStyleSheetWrappedValue_ + "}";
  };
}
goog.html.SafeStyleSheet.unwrap = function(safeStyleSheet) {
  if (safeStyleSheet instanceof goog.html.SafeStyleSheet && safeStyleSheet.constructor === goog.html.SafeStyleSheet && safeStyleSheet.SAFE_STYLE_SHEET_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ === goog.html.SafeStyleSheet.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_) {
    return safeStyleSheet.privateDoNotAccessOrElseSafeStyleSheetWrappedValue_;
  } else {
    goog.asserts.fail("expected object of type SafeStyleSheet, got '" + safeStyleSheet + "' of type " + goog.typeOf(safeStyleSheet));
    return "type_error:SafeStyleSheet";
  }
};
goog.html.SafeStyleSheet.createSafeStyleSheetSecurityPrivateDoNotAccessOrElse = function(styleSheet) {
  return (new goog.html.SafeStyleSheet).initSecurityPrivateDoNotAccessOrElse_(styleSheet);
};
goog.html.SafeStyleSheet.prototype.initSecurityPrivateDoNotAccessOrElse_ = function(styleSheet) {
  this.privateDoNotAccessOrElseSafeStyleSheetWrappedValue_ = styleSheet;
  return this;
};
goog.html.SafeStyleSheet.EMPTY = goog.html.SafeStyleSheet.createSafeStyleSheetSecurityPrivateDoNotAccessOrElse("");
goog.html.SafeHtml = function() {
  this.privateDoNotAccessOrElseSafeHtmlWrappedValue_ = "";
  this.SAFE_HTML_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ = goog.html.SafeHtml.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_;
  this.dir_ = null;
};
goog.html.SafeHtml.prototype.implementsGoogI18nBidiDirectionalString = true;
goog.html.SafeHtml.prototype.getDirection = function() {
  return this.dir_;
};
goog.html.SafeHtml.prototype.implementsGoogStringTypedString = true;
goog.html.SafeHtml.prototype.getTypedStringValue = function() {
  return this.privateDoNotAccessOrElseSafeHtmlWrappedValue_;
};
if (goog.DEBUG) {
  goog.html.SafeHtml.prototype.toString = function() {
    return "SafeHtml{" + this.privateDoNotAccessOrElseSafeHtmlWrappedValue_ + "}";
  };
}
goog.html.SafeHtml.unwrap = function(safeHtml) {
  if (safeHtml instanceof goog.html.SafeHtml && safeHtml.constructor === goog.html.SafeHtml && safeHtml.SAFE_HTML_TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ === goog.html.SafeHtml.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_) {
    return safeHtml.privateDoNotAccessOrElseSafeHtmlWrappedValue_;
  } else {
    goog.asserts.fail("expected object of type SafeHtml, got '" + safeHtml + "' of type " + goog.typeOf(safeHtml));
    return "type_error:SafeHtml";
  }
};
goog.html.SafeHtml.TextOrHtml_;
goog.html.SafeHtml.htmlEscape = function(textOrHtml) {
  if (textOrHtml instanceof goog.html.SafeHtml) {
    return textOrHtml;
  }
  var dir = null;
  if (textOrHtml.implementsGoogI18nBidiDirectionalString) {
    dir = textOrHtml.getDirection();
  }
  var textAsString;
  if (textOrHtml.implementsGoogStringTypedString) {
    textAsString = textOrHtml.getTypedStringValue();
  } else {
    textAsString = String(textOrHtml);
  }
  return goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(goog.string.htmlEscape(textAsString), dir);
};
goog.html.SafeHtml.htmlEscapePreservingNewlines = function(textOrHtml) {
  if (textOrHtml instanceof goog.html.SafeHtml) {
    return textOrHtml;
  }
  var html = goog.html.SafeHtml.htmlEscape(textOrHtml);
  return goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(goog.string.newLineToBr(goog.html.SafeHtml.unwrap(html)), html.getDirection());
};
goog.html.SafeHtml.htmlEscapePreservingNewlinesAndSpaces = function(textOrHtml) {
  if (textOrHtml instanceof goog.html.SafeHtml) {
    return textOrHtml;
  }
  var html = goog.html.SafeHtml.htmlEscape(textOrHtml);
  return goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(goog.string.whitespaceEscape(goog.html.SafeHtml.unwrap(html)), html.getDirection());
};
goog.html.SafeHtml.from = goog.html.SafeHtml.htmlEscape;
goog.html.SafeHtml.VALID_NAMES_IN_TAG_ = /^[a-zA-Z0-9-]+$/;
goog.html.SafeHtml.URL_ATTRIBUTES_ = {"action":true, "cite":true, "data":true, "formaction":true, "href":true, "manifest":true, "poster":true, "src":true};
goog.html.SafeHtml.NOT_ALLOWED_TAG_NAMES_ = {"APPLET":true, "BASE":true, "EMBED":true, "IFRAME":true, "LINK":true, "MATH":true, "META":true, "OBJECT":true, "SCRIPT":true, "STYLE":true, "SVG":true, "TEMPLATE":true};
goog.html.SafeHtml.AttributeValue;
goog.html.SafeHtml.create = function(tagName, opt_attributes, opt_content) {
  goog.html.SafeHtml.verifyTagName(String(tagName));
  return goog.html.SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse(String(tagName), opt_attributes, opt_content);
};
goog.html.SafeHtml.verifyTagName = function(tagName) {
  if (!goog.html.SafeHtml.VALID_NAMES_IN_TAG_.test(tagName)) {
    throw new Error("Invalid tag name <" + tagName + ">.");
  }
  if (tagName.toUpperCase() in goog.html.SafeHtml.NOT_ALLOWED_TAG_NAMES_) {
    throw new Error("Tag name <" + tagName + "> is not allowed for SafeHtml.");
  }
};
goog.html.SafeHtml.createIframe = function(opt_src, opt_srcdoc, opt_attributes, opt_content) {
  if (opt_src) {
    goog.html.TrustedResourceUrl.unwrap(opt_src);
  }
  var fixedAttributes = {};
  fixedAttributes["src"] = opt_src || null;
  fixedAttributes["srcdoc"] = opt_srcdoc && goog.html.SafeHtml.unwrap(opt_srcdoc);
  var defaultAttributes = {"sandbox":""};
  var attributes = goog.html.SafeHtml.combineAttributes(fixedAttributes, defaultAttributes, opt_attributes);
  return goog.html.SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse("iframe", attributes, opt_content);
};
goog.html.SafeHtml.createSandboxIframe = function(opt_src, opt_srcdoc, opt_attributes, opt_content) {
  if (!goog.html.SafeHtml.canUseSandboxIframe()) {
    throw new Error("The browser does not support sandboxed iframes.");
  }
  var fixedAttributes = {};
  if (opt_src) {
    fixedAttributes["src"] = goog.html.SafeUrl.unwrap(goog.html.SafeUrl.sanitize(opt_src));
  } else {
    fixedAttributes["src"] = null;
  }
  fixedAttributes["srcdoc"] = opt_srcdoc || null;
  fixedAttributes["sandbox"] = "";
  var attributes = goog.html.SafeHtml.combineAttributes(fixedAttributes, {}, opt_attributes);
  return goog.html.SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse("iframe", attributes, opt_content);
};
goog.html.SafeHtml.canUseSandboxIframe = function() {
  return goog.global["HTMLIFrameElement"] && "sandbox" in goog.global["HTMLIFrameElement"].prototype;
};
goog.html.SafeHtml.createScriptSrc = function(src, opt_attributes) {
  goog.html.TrustedResourceUrl.unwrap(src);
  var fixedAttributes = {"src":src};
  var defaultAttributes = {};
  var attributes = goog.html.SafeHtml.combineAttributes(fixedAttributes, defaultAttributes, opt_attributes);
  return goog.html.SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse("script", attributes);
};
goog.html.SafeHtml.createScript = function(script, opt_attributes) {
  for (var attr in opt_attributes) {
    var attrLower = attr.toLowerCase();
    if (attrLower == "language" || attrLower == "src" || attrLower == "text" || attrLower == "type") {
      throw new Error('Cannot set "' + attrLower + '" attribute');
    }
  }
  var content = "";
  script = goog.array.concat(script);
  for (var i = 0;i < script.length;i++) {
    content += goog.html.SafeScript.unwrap(script[i]);
  }
  var htmlContent = goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(content, goog.i18n.bidi.Dir.NEUTRAL);
  return goog.html.SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse("script", opt_attributes, htmlContent);
};
goog.html.SafeHtml.createStyle = function(styleSheet, opt_attributes) {
  var fixedAttributes = {"type":"text/css"};
  var defaultAttributes = {};
  var attributes = goog.html.SafeHtml.combineAttributes(fixedAttributes, defaultAttributes, opt_attributes);
  var content = "";
  styleSheet = goog.array.concat(styleSheet);
  for (var i = 0;i < styleSheet.length;i++) {
    content += goog.html.SafeStyleSheet.unwrap(styleSheet[i]);
  }
  var htmlContent = goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(content, goog.i18n.bidi.Dir.NEUTRAL);
  return goog.html.SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse("style", attributes, htmlContent);
};
goog.html.SafeHtml.createMetaRefresh = function(url, opt_secs) {
  var unwrappedUrl = goog.html.SafeUrl.unwrap(goog.html.SafeUrl.sanitize(url));
  if (goog.labs.userAgent.browser.isIE() || goog.labs.userAgent.browser.isEdge()) {
    if (goog.string.contains(unwrappedUrl, ";")) {
      unwrappedUrl = "'" + unwrappedUrl.replace(/'/g, "%27") + "'";
    }
  }
  var attributes = {"http-equiv":"refresh", "content":(opt_secs || 0) + "; url=" + unwrappedUrl};
  return goog.html.SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse("meta", attributes);
};
goog.html.SafeHtml.getAttrNameAndValue_ = function(tagName, name, value) {
  if (value instanceof goog.string.Const) {
    value = goog.string.Const.unwrap(value);
  } else {
    if (name.toLowerCase() == "style") {
      value = goog.html.SafeHtml.getStyleValue_(value);
    } else {
      if (/^on/i.test(name)) {
        throw new Error('Attribute "' + name + '" requires goog.string.Const value, "' + value + '" given.');
      } else {
        if (name.toLowerCase() in goog.html.SafeHtml.URL_ATTRIBUTES_) {
          if (value instanceof goog.html.TrustedResourceUrl) {
            value = goog.html.TrustedResourceUrl.unwrap(value);
          } else {
            if (value instanceof goog.html.SafeUrl) {
              value = goog.html.SafeUrl.unwrap(value);
            } else {
              if (goog.isString(value)) {
                value = goog.html.SafeUrl.sanitize(value).getTypedStringValue();
              } else {
                throw new Error('Attribute "' + name + '" on tag "' + tagName + '" requires goog.html.SafeUrl, goog.string.Const, or string,' + ' value "' + value + '" given.');
              }
            }
          }
        }
      }
    }
  }
  if (value.implementsGoogStringTypedString) {
    value = value.getTypedStringValue();
  }
  goog.asserts.assert(goog.isString(value) || goog.isNumber(value), "String or number value expected, got " + typeof value + " with value: " + value);
  return name + '="' + goog.string.htmlEscape(String(value)) + '"';
};
goog.html.SafeHtml.getStyleValue_ = function(value) {
  if (!goog.isObject(value)) {
    throw new Error('The "style" attribute requires goog.html.SafeStyle or map ' + "of style properties, " + typeof value + " given: " + value);
  }
  if (!(value instanceof goog.html.SafeStyle)) {
    value = goog.html.SafeStyle.create(value);
  }
  return goog.html.SafeStyle.unwrap(value);
};
goog.html.SafeHtml.createWithDir = function(dir, tagName, opt_attributes, opt_content) {
  var html = goog.html.SafeHtml.create(tagName, opt_attributes, opt_content);
  html.dir_ = dir;
  return html;
};
goog.html.SafeHtml.concat = function(var_args) {
  var dir = goog.i18n.bidi.Dir.NEUTRAL;
  var content = "";
  var addArgument = function(argument) {
    if (goog.isArray(argument)) {
      goog.array.forEach(argument, addArgument);
    } else {
      var html = goog.html.SafeHtml.htmlEscape(argument);
      content += goog.html.SafeHtml.unwrap(html);
      var htmlDir = html.getDirection();
      if (dir == goog.i18n.bidi.Dir.NEUTRAL) {
        dir = htmlDir;
      } else {
        if (htmlDir != goog.i18n.bidi.Dir.NEUTRAL && dir != htmlDir) {
          dir = null;
        }
      }
    }
  };
  goog.array.forEach(arguments, addArgument);
  return goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(content, dir);
};
goog.html.SafeHtml.concatWithDir = function(dir, var_args) {
  var html = goog.html.SafeHtml.concat(goog.array.slice(arguments, 1));
  html.dir_ = dir;
  return html;
};
goog.html.SafeHtml.TYPE_MARKER_GOOG_HTML_SECURITY_PRIVATE_ = {};
goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse = function(html, dir) {
  return (new goog.html.SafeHtml).initSecurityPrivateDoNotAccessOrElse_(html, dir);
};
goog.html.SafeHtml.prototype.initSecurityPrivateDoNotAccessOrElse_ = function(html, dir) {
  this.privateDoNotAccessOrElseSafeHtmlWrappedValue_ = html;
  this.dir_ = dir;
  return this;
};
goog.html.SafeHtml.createSafeHtmlTagSecurityPrivateDoNotAccessOrElse = function(tagName, opt_attributes, opt_content) {
  var dir = null;
  var result = "<" + tagName;
  result += goog.html.SafeHtml.stringifyAttributes(tagName, opt_attributes);
  var content = opt_content;
  if (!goog.isDefAndNotNull(content)) {
    content = [];
  } else {
    if (!goog.isArray(content)) {
      content = [content];
    }
  }
  if (goog.dom.tags.isVoidTag(tagName.toLowerCase())) {
    goog.asserts.assert(!content.length, "Void tag <" + tagName + "> does not allow content.");
    result += ">";
  } else {
    var html = goog.html.SafeHtml.concat(content);
    result += ">" + goog.html.SafeHtml.unwrap(html) + "</" + tagName + ">";
    dir = html.getDirection();
  }
  var dirAttribute = opt_attributes && opt_attributes["dir"];
  if (dirAttribute) {
    if (/^(ltr|rtl|auto)$/i.test(dirAttribute)) {
      dir = goog.i18n.bidi.Dir.NEUTRAL;
    } else {
      dir = null;
    }
  }
  return goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(result, dir);
};
goog.html.SafeHtml.stringifyAttributes = function(tagName, opt_attributes) {
  var result = "";
  if (opt_attributes) {
    for (var name in opt_attributes) {
      if (!goog.html.SafeHtml.VALID_NAMES_IN_TAG_.test(name)) {
        throw new Error('Invalid attribute name "' + name + '".');
      }
      var value = opt_attributes[name];
      if (!goog.isDefAndNotNull(value)) {
        continue;
      }
      result += " " + goog.html.SafeHtml.getAttrNameAndValue_(tagName, name, value);
    }
  }
  return result;
};
goog.html.SafeHtml.combineAttributes = function(fixedAttributes, defaultAttributes, opt_attributes) {
  var combinedAttributes = {};
  for (var name in fixedAttributes) {
    goog.asserts.assert(name.toLowerCase() == name, "Must be lower case");
    combinedAttributes[name] = fixedAttributes[name];
  }
  for (name in defaultAttributes) {
    goog.asserts.assert(name.toLowerCase() == name, "Must be lower case");
    combinedAttributes[name] = defaultAttributes[name];
  }
  for (name in opt_attributes) {
    var nameLower = name.toLowerCase();
    if (nameLower in fixedAttributes) {
      throw new Error('Cannot override "' + nameLower + '" attribute, got "' + name + '" with value "' + opt_attributes[name] + '"');
    }
    if (nameLower in defaultAttributes) {
      delete combinedAttributes[nameLower];
    }
    combinedAttributes[name] = opt_attributes[name];
  }
  return combinedAttributes;
};
goog.html.SafeHtml.DOCTYPE_HTML = goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse("<!DOCTYPE html>", goog.i18n.bidi.Dir.NEUTRAL);
goog.html.SafeHtml.EMPTY = goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse("", goog.i18n.bidi.Dir.NEUTRAL);
goog.html.SafeHtml.BR = goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse("<br>", goog.i18n.bidi.Dir.NEUTRAL);
goog.dom.safe = {};
goog.dom.safe.InsertAdjacentHtmlPosition = {AFTERBEGIN:"afterbegin", AFTEREND:"afterend", BEFOREBEGIN:"beforebegin", BEFOREEND:"beforeend"};
goog.dom.safe.insertAdjacentHtml = function(node, position, html) {
  node.insertAdjacentHTML(position, goog.html.SafeHtml.unwrap(html));
};
goog.dom.safe.SET_INNER_HTML_DISALLOWED_TAGS_ = {"MATH":true, "SCRIPT":true, "STYLE":true, "SVG":true, "TEMPLATE":true};
goog.dom.safe.setInnerHtml = function(elem, html) {
  if (goog.asserts.ENABLE_ASSERTS) {
    var tagName = elem.tagName.toUpperCase();
    if (goog.dom.safe.SET_INNER_HTML_DISALLOWED_TAGS_[tagName]) {
      throw new Error("goog.dom.safe.setInnerHtml cannot be used to set content of " + elem.tagName + ".");
    }
  }
  elem.innerHTML = goog.html.SafeHtml.unwrap(html);
};
goog.dom.safe.setOuterHtml = function(elem, html) {
  elem.outerHTML = goog.html.SafeHtml.unwrap(html);
};
goog.dom.safe.setFormElementAction = function(form, url) {
  var safeUrl;
  if (url instanceof goog.html.SafeUrl) {
    safeUrl = url;
  } else {
    safeUrl = goog.html.SafeUrl.sanitizeAssertUnchanged(url);
  }
  goog.dom.asserts.assertIsHTMLFormElement(form).action = goog.html.SafeUrl.unwrap(safeUrl);
};
goog.dom.safe.setButtonFormAction = function(button, url) {
  var safeUrl;
  if (url instanceof goog.html.SafeUrl) {
    safeUrl = url;
  } else {
    safeUrl = goog.html.SafeUrl.sanitizeAssertUnchanged(url);
  }
  goog.dom.asserts.assertIsHTMLButtonElement(button).formaction = goog.html.SafeUrl.unwrap(safeUrl);
};
goog.dom.safe.setInputFormAction = function(input, url) {
  var safeUrl;
  if (url instanceof goog.html.SafeUrl) {
    safeUrl = url;
  } else {
    safeUrl = goog.html.SafeUrl.sanitizeAssertUnchanged(url);
  }
  goog.dom.asserts.assertIsHTMLInputElement(input).formaction = goog.html.SafeUrl.unwrap(safeUrl);
};
goog.dom.safe.setStyle = function(elem, style) {
  elem.style.cssText = goog.html.SafeStyle.unwrap(style);
};
goog.dom.safe.documentWrite = function(doc, html) {
  doc.write(goog.html.SafeHtml.unwrap(html));
};
goog.dom.safe.setAnchorHref = function(anchor, url) {
  goog.dom.asserts.assertIsHTMLAnchorElement(anchor);
  var safeUrl;
  if (url instanceof goog.html.SafeUrl) {
    safeUrl = url;
  } else {
    safeUrl = goog.html.SafeUrl.sanitizeAssertUnchanged(url);
  }
  anchor.href = goog.html.SafeUrl.unwrap(safeUrl);
};
goog.dom.safe.setImageSrc = function(imageElement, url) {
  goog.dom.asserts.assertIsHTMLImageElement(imageElement);
  var safeUrl;
  if (url instanceof goog.html.SafeUrl) {
    safeUrl = url;
  } else {
    safeUrl = goog.html.SafeUrl.sanitizeAssertUnchanged(url);
  }
  imageElement.src = goog.html.SafeUrl.unwrap(safeUrl);
};
goog.dom.safe.setEmbedSrc = function(embed, url) {
  goog.dom.asserts.assertIsHTMLEmbedElement(embed);
  embed.src = goog.html.TrustedResourceUrl.unwrap(url);
};
goog.dom.safe.setFrameSrc = function(frame, url) {
  goog.dom.asserts.assertIsHTMLFrameElement(frame);
  frame.src = goog.html.TrustedResourceUrl.unwrap(url);
};
goog.dom.safe.setIframeSrc = function(iframe, url) {
  goog.dom.asserts.assertIsHTMLIFrameElement(iframe);
  iframe.src = goog.html.TrustedResourceUrl.unwrap(url);
};
goog.dom.safe.setIframeSrcdoc = function(iframe, html) {
  goog.dom.asserts.assertIsHTMLIFrameElement(iframe);
  iframe.srcdoc = goog.html.SafeHtml.unwrap(html);
};
goog.dom.safe.setLinkHrefAndRel = function(link, url, rel) {
  goog.dom.asserts.assertIsHTMLLinkElement(link);
  link.rel = rel;
  if (goog.string.caseInsensitiveContains(rel, "stylesheet")) {
    goog.asserts.assert(url instanceof goog.html.TrustedResourceUrl, 'URL must be TrustedResourceUrl because "rel" contains "stylesheet"');
    link.href = goog.html.TrustedResourceUrl.unwrap(url);
  } else {
    if (url instanceof goog.html.TrustedResourceUrl) {
      link.href = goog.html.TrustedResourceUrl.unwrap(url);
    } else {
      if (url instanceof goog.html.SafeUrl) {
        link.href = goog.html.SafeUrl.unwrap(url);
      } else {
        link.href = goog.html.SafeUrl.sanitizeAssertUnchanged(url).getTypedStringValue();
      }
    }
  }
};
goog.dom.safe.setObjectData = function(object, url) {
  goog.dom.asserts.assertIsHTMLObjectElement(object);
  object.data = goog.html.TrustedResourceUrl.unwrap(url);
};
goog.dom.safe.setScriptSrc = function(script, url) {
  goog.dom.asserts.assertIsHTMLScriptElement(script);
  script.src = goog.html.TrustedResourceUrl.unwrap(url);
};
goog.dom.safe.setScriptContent = function(script, content) {
  goog.dom.asserts.assertIsHTMLScriptElement(script);
  script.text = goog.html.SafeScript.unwrap(content);
};
goog.dom.safe.setLocationHref = function(loc, url) {
  goog.dom.asserts.assertIsLocation(loc);
  var safeUrl;
  if (url instanceof goog.html.SafeUrl) {
    safeUrl = url;
  } else {
    safeUrl = goog.html.SafeUrl.sanitizeAssertUnchanged(url);
  }
  loc.href = goog.html.SafeUrl.unwrap(safeUrl);
};
goog.dom.safe.replaceLocation = function(loc, url) {
  goog.dom.asserts.assertIsLocation(loc);
  var safeUrl;
  if (url instanceof goog.html.SafeUrl) {
    safeUrl = url;
  } else {
    safeUrl = goog.html.SafeUrl.sanitizeAssertUnchanged(url);
  }
  loc.replace(goog.html.SafeUrl.unwrap(safeUrl));
};
goog.dom.safe.openInWindow = function(url, opt_openerWin, opt_name, opt_specs, opt_replace) {
  var safeUrl;
  if (url instanceof goog.html.SafeUrl) {
    safeUrl = url;
  } else {
    safeUrl = goog.html.SafeUrl.sanitizeAssertUnchanged(url);
  }
  var win = opt_openerWin || window;
  return win.open(goog.html.SafeUrl.unwrap(safeUrl), opt_name ? goog.string.Const.unwrap(opt_name) : "", opt_specs, opt_replace);
};
goog.html.uncheckedconversions = {};
goog.html.uncheckedconversions.safeHtmlFromStringKnownToSatisfyTypeContract = function(justification, html, opt_dir) {
  goog.asserts.assertString(goog.string.Const.unwrap(justification), "must provide justification");
  goog.asserts.assert(!goog.string.isEmptyOrWhitespace(goog.string.Const.unwrap(justification)), "must provide non-empty justification");
  return goog.html.SafeHtml.createSafeHtmlSecurityPrivateDoNotAccessOrElse(html, opt_dir || null);
};
goog.html.uncheckedconversions.safeScriptFromStringKnownToSatisfyTypeContract = function(justification, script) {
  goog.asserts.assertString(goog.string.Const.unwrap(justification), "must provide justification");
  goog.asserts.assert(!goog.string.isEmptyOrWhitespace(goog.string.Const.unwrap(justification)), "must provide non-empty justification");
  return goog.html.SafeScript.createSafeScriptSecurityPrivateDoNotAccessOrElse(script);
};
goog.html.uncheckedconversions.safeStyleFromStringKnownToSatisfyTypeContract = function(justification, style) {
  goog.asserts.assertString(goog.string.Const.unwrap(justification), "must provide justification");
  goog.asserts.assert(!goog.string.isEmptyOrWhitespace(goog.string.Const.unwrap(justification)), "must provide non-empty justification");
  return goog.html.SafeStyle.createSafeStyleSecurityPrivateDoNotAccessOrElse(style);
};
goog.html.uncheckedconversions.safeStyleSheetFromStringKnownToSatisfyTypeContract = function(justification, styleSheet) {
  goog.asserts.assertString(goog.string.Const.unwrap(justification), "must provide justification");
  goog.asserts.assert(!goog.string.isEmptyOrWhitespace(goog.string.Const.unwrap(justification)), "must provide non-empty justification");
  return goog.html.SafeStyleSheet.createSafeStyleSheetSecurityPrivateDoNotAccessOrElse(styleSheet);
};
goog.html.uncheckedconversions.safeUrlFromStringKnownToSatisfyTypeContract = function(justification, url) {
  goog.asserts.assertString(goog.string.Const.unwrap(justification), "must provide justification");
  goog.asserts.assert(!goog.string.isEmptyOrWhitespace(goog.string.Const.unwrap(justification)), "must provide non-empty justification");
  return goog.html.SafeUrl.createSafeUrlSecurityPrivateDoNotAccessOrElse(url);
};
goog.html.uncheckedconversions.trustedResourceUrlFromStringKnownToSatisfyTypeContract = function(justification, url) {
  goog.asserts.assertString(goog.string.Const.unwrap(justification), "must provide justification");
  goog.asserts.assert(!goog.string.isEmptyOrWhitespace(goog.string.Const.unwrap(justification)), "must provide non-empty justification");
  return goog.html.TrustedResourceUrl.createTrustedResourceUrlSecurityPrivateDoNotAccessOrElse(url);
};
goog.math = {};
goog.math.randomInt = function(a) {
  return Math.floor(Math.random() * a);
};
goog.math.uniformRandom = function(a, b) {
  return a + Math.random() * (b - a);
};
goog.math.clamp = function(value, min, max) {
  return Math.min(Math.max(value, min), max);
};
goog.math.modulo = function(a, b) {
  var r = a % b;
  return r * b < 0 ? r + b : r;
};
goog.math.lerp = function(a, b, x) {
  return a + x * (b - a);
};
goog.math.nearlyEquals = function(a, b, opt_tolerance) {
  return Math.abs(a - b) <= (opt_tolerance || 0.000001);
};
goog.math.standardAngle = function(angle) {
  return goog.math.modulo(angle, 360);
};
goog.math.standardAngleInRadians = function(angle) {
  return goog.math.modulo(angle, 2 * Math.PI);
};
goog.math.toRadians = function(angleDegrees) {
  return angleDegrees * Math.PI / 180;
};
goog.math.toDegrees = function(angleRadians) {
  return angleRadians * 180 / Math.PI;
};
goog.math.angleDx = function(degrees, radius) {
  return radius * Math.cos(goog.math.toRadians(degrees));
};
goog.math.angleDy = function(degrees, radius) {
  return radius * Math.sin(goog.math.toRadians(degrees));
};
goog.math.angle = function(x1, y1, x2, y2) {
  return goog.math.standardAngle(goog.math.toDegrees(Math.atan2(y2 - y1, x2 - x1)));
};
goog.math.angleDifference = function(startAngle, endAngle) {
  var d = goog.math.standardAngle(endAngle) - goog.math.standardAngle(startAngle);
  if (d > 180) {
    d -= 360;
  } else {
    if (d <= -180) {
      d = 360 + d;
    }
  }
  return d;
};
goog.math.sign = function(x) {
  if (x > 0) {
    return 1;
  }
  if (x < 0) {
    return -1;
  }
  return x;
};
goog.math.longestCommonSubsequence = function(array1, array2, opt_compareFn, opt_collectorFn) {
  var compare = opt_compareFn || function(a, b) {
    return a == b;
  };
  var collect = opt_collectorFn || function(i1, i2) {
    return array1[i1];
  };
  var length1 = array1.length;
  var length2 = array2.length;
  var arr = [];
  for (var i = 0;i < length1 + 1;i++) {
    arr[i] = [];
    arr[i][0] = 0;
  }
  for (var j = 0;j < length2 + 1;j++) {
    arr[0][j] = 0;
  }
  for (i = 1;i <= length1;i++) {
    for (j = 1;j <= length2;j++) {
      if (compare(array1[i - 1], array2[j - 1])) {
        arr[i][j] = arr[i - 1][j - 1] + 1;
      } else {
        arr[i][j] = Math.max(arr[i - 1][j], arr[i][j - 1]);
      }
    }
  }
  var result = [];
  i = length1;
  for (j = length2;i > 0 && j > 0;) {
    if (compare(array1[i - 1], array2[j - 1])) {
      result.unshift(collect(i - 1, j - 1));
      i--;
      j--;
    } else {
      if (arr[i - 1][j] > arr[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }
  }
  return result;
};
goog.math.sum = function(var_args) {
  return goog.array.reduce(arguments, function(sum, value) {
    return sum + value;
  }, 0);
};
goog.math.average = function(var_args) {
  return goog.math.sum.apply(null, arguments) / arguments.length;
};
goog.math.sampleVariance = function(var_args) {
  var sampleSize = arguments.length;
  if (sampleSize < 2) {
    return 0;
  }
  var mean = goog.math.average.apply(null, arguments);
  var variance = goog.math.sum.apply(null, goog.array.map(arguments, function(val) {
    return Math.pow(val - mean, 2);
  })) / (sampleSize - 1);
  return variance;
};
goog.math.standardDeviation = function(var_args) {
  return Math.sqrt(goog.math.sampleVariance.apply(null, arguments));
};
goog.math.isInt = function(num) {
  return isFinite(num) && num % 1 == 0;
};
goog.math.isFiniteNumber = function(num) {
  return isFinite(num);
};
goog.math.isNegativeZero = function(num) {
  return num == 0 && 1 / num < 0;
};
goog.math.log10Floor = function(num) {
  if (num > 0) {
    var x = Math.round(Math.log(num) * Math.LOG10E);
    return x - (parseFloat("1e" + x) > num ? 1 : 0);
  }
  return num == 0 ? -Infinity : NaN;
};
goog.math.safeFloor = function(num, opt_epsilon) {
  goog.asserts.assert(!goog.isDef(opt_epsilon) || opt_epsilon > 0);
  return Math.floor(num + (opt_epsilon || 2e-15));
};
goog.math.safeCeil = function(num, opt_epsilon) {
  goog.asserts.assert(!goog.isDef(opt_epsilon) || opt_epsilon > 0);
  return Math.ceil(num - (opt_epsilon || 2e-15));
};
goog.math.Coordinate = function(opt_x, opt_y) {
  this.x = goog.isDef(opt_x) ? opt_x : 0;
  this.y = goog.isDef(opt_y) ? opt_y : 0;
};
goog.math.Coordinate.prototype.clone = function() {
  return new goog.math.Coordinate(this.x, this.y);
};
if (goog.DEBUG) {
  goog.math.Coordinate.prototype.toString = function() {
    return "(" + this.x + ", " + this.y + ")";
  };
}
goog.math.Coordinate.prototype.equals = function(other) {
  return other instanceof goog.math.Coordinate && goog.math.Coordinate.equals(this, other);
};
goog.math.Coordinate.equals = function(a, b) {
  if (a == b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return a.x == b.x && a.y == b.y;
};
goog.math.Coordinate.distance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};
goog.math.Coordinate.magnitude = function(a) {
  return Math.sqrt(a.x * a.x + a.y * a.y);
};
goog.math.Coordinate.azimuth = function(a) {
  return goog.math.angle(0, 0, a.x, a.y);
};
goog.math.Coordinate.squaredDistance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return dx * dx + dy * dy;
};
goog.math.Coordinate.difference = function(a, b) {
  return new goog.math.Coordinate(a.x - b.x, a.y - b.y);
};
goog.math.Coordinate.sum = function(a, b) {
  return new goog.math.Coordinate(a.x + b.x, a.y + b.y);
};
goog.math.Coordinate.prototype.ceil = function() {
  this.x = Math.ceil(this.x);
  this.y = Math.ceil(this.y);
  return this;
};
goog.math.Coordinate.prototype.floor = function() {
  this.x = Math.floor(this.x);
  this.y = Math.floor(this.y);
  return this;
};
goog.math.Coordinate.prototype.round = function() {
  this.x = Math.round(this.x);
  this.y = Math.round(this.y);
  return this;
};
goog.math.Coordinate.prototype.translate = function(tx, opt_ty) {
  if (tx instanceof goog.math.Coordinate) {
    this.x += tx.x;
    this.y += tx.y;
  } else {
    this.x += Number(tx);
    if (goog.isNumber(opt_ty)) {
      this.y += opt_ty;
    }
  }
  return this;
};
goog.math.Coordinate.prototype.scale = function(sx, opt_sy) {
  var sy = goog.isNumber(opt_sy) ? opt_sy : sx;
  this.x *= sx;
  this.y *= sy;
  return this;
};
goog.math.Coordinate.prototype.rotateRadians = function(radians, opt_center) {
  var center = opt_center || new goog.math.Coordinate(0, 0);
  var x = this.x;
  var y = this.y;
  var cos = Math.cos(radians);
  var sin = Math.sin(radians);
  this.x = (x - center.x) * cos - (y - center.y) * sin + center.x;
  this.y = (x - center.x) * sin + (y - center.y) * cos + center.y;
};
goog.math.Coordinate.prototype.rotateDegrees = function(degrees, opt_center) {
  this.rotateRadians(goog.math.toRadians(degrees), opt_center);
};
goog.math.Size = function(width, height) {
  this.width = width;
  this.height = height;
};
goog.math.Size.equals = function(a, b) {
  if (a == b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return a.width == b.width && a.height == b.height;
};
goog.math.Size.prototype.clone = function() {
  return new goog.math.Size(this.width, this.height);
};
if (goog.DEBUG) {
  goog.math.Size.prototype.toString = function() {
    return "(" + this.width + " x " + this.height + ")";
  };
}
goog.math.Size.prototype.getLongest = function() {
  return Math.max(this.width, this.height);
};
goog.math.Size.prototype.getShortest = function() {
  return Math.min(this.width, this.height);
};
goog.math.Size.prototype.area = function() {
  return this.width * this.height;
};
goog.math.Size.prototype.perimeter = function() {
  return (this.width + this.height) * 2;
};
goog.math.Size.prototype.aspectRatio = function() {
  return this.width / this.height;
};
goog.math.Size.prototype.isEmpty = function() {
  return !this.area();
};
goog.math.Size.prototype.ceil = function() {
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this;
};
goog.math.Size.prototype.fitsInside = function(target) {
  return this.width <= target.width && this.height <= target.height;
};
goog.math.Size.prototype.floor = function() {
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this;
};
goog.math.Size.prototype.round = function() {
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this;
};
goog.math.Size.prototype.scale = function(sx, opt_sy) {
  var sy = goog.isNumber(opt_sy) ? opt_sy : sx;
  this.width *= sx;
  this.height *= sy;
  return this;
};
goog.math.Size.prototype.scaleToCover = function(target) {
  var s = this.aspectRatio() <= target.aspectRatio() ? target.width / this.width : target.height / this.height;
  return this.scale(s);
};
goog.math.Size.prototype.scaleToFit = function(target) {
  var s = this.aspectRatio() > target.aspectRatio() ? target.width / this.width : target.height / this.height;
  return this.scale(s);
};
goog.dom.ASSUME_QUIRKS_MODE = false;
goog.dom.ASSUME_STANDARDS_MODE = false;
goog.dom.COMPAT_MODE_KNOWN_ = goog.dom.ASSUME_QUIRKS_MODE || goog.dom.ASSUME_STANDARDS_MODE;
goog.dom.getDomHelper = function(opt_element) {
  return opt_element ? new goog.dom.DomHelper(goog.dom.getOwnerDocument(opt_element)) : goog.dom.defaultDomHelper_ || (goog.dom.defaultDomHelper_ = new goog.dom.DomHelper);
};
goog.dom.defaultDomHelper_;
goog.dom.getDocument = function() {
  return document;
};
goog.dom.getElement = function(element) {
  return goog.dom.getElementHelper_(document, element);
};
goog.dom.getElementHelper_ = function(doc, element) {
  return goog.isString(element) ? doc.getElementById(element) : element;
};
goog.dom.getRequiredElement = function(id) {
  return goog.dom.getRequiredElementHelper_(document, id);
};
goog.dom.getRequiredElementHelper_ = function(doc, id) {
  goog.asserts.assertString(id);
  var element = goog.dom.getElementHelper_(doc, id);
  element = goog.asserts.assertElement(element, "No element found with id: " + id);
  return element;
};
goog.dom.$ = goog.dom.getElement;
goog.dom.getElementsByTagName = function(tagName, opt_parent) {
  var parent = opt_parent || document;
  return parent.getElementsByTagName(String(tagName));
};
goog.dom.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(document, opt_tag, opt_class, opt_el);
};
goog.dom.getElementByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementByTagNameAndClass_(document, opt_tag, opt_class, opt_el);
};
goog.dom.getElementsByClass = function(className, opt_el) {
  var parent = opt_el || document;
  if (goog.dom.canUseQuerySelector_(parent)) {
    return parent.querySelectorAll("." + className);
  }
  return goog.dom.getElementsByTagNameAndClass_(document, "*", className, opt_el);
};
goog.dom.getElementByClass = function(className, opt_el) {
  var parent = opt_el || document;
  var retVal = null;
  if (parent.getElementsByClassName) {
    retVal = parent.getElementsByClassName(className)[0];
  } else {
    retVal = goog.dom.getElementByTagNameAndClass_(document, "*", className, opt_el);
  }
  return retVal || null;
};
goog.dom.getRequiredElementByClass = function(className, opt_root) {
  var retValue = goog.dom.getElementByClass(className, opt_root);
  return goog.asserts.assert(retValue, "No element found with className: " + className);
};
goog.dom.canUseQuerySelector_ = function(parent) {
  return !!(parent.querySelectorAll && parent.querySelector);
};
goog.dom.getElementsByTagNameAndClass_ = function(doc, opt_tag, opt_class, opt_el) {
  var parent = opt_el || doc;
  var tagName = opt_tag && opt_tag != "*" ? String(opt_tag).toUpperCase() : "";
  if (goog.dom.canUseQuerySelector_(parent) && (tagName || opt_class)) {
    var query = tagName + (opt_class ? "." + opt_class : "");
    return parent.querySelectorAll(query);
  }
  if (opt_class && parent.getElementsByClassName) {
    var els = parent.getElementsByClassName(opt_class);
    if (tagName) {
      var arrayLike = {};
      var len = 0;
      var i = 0;
      for (var el;el = els[i];i++) {
        if (tagName == el.nodeName) {
          arrayLike[len++] = el;
        }
      }
      arrayLike.length = len;
      return arrayLike;
    } else {
      return els;
    }
  }
  els = parent.getElementsByTagName(tagName || "*");
  if (opt_class) {
    arrayLike = {};
    len = 0;
    for (i = 0;el = els[i];i++) {
      var className = el.className;
      if (typeof className.split == "function" && goog.array.contains(className.split(/\s+/), opt_class)) {
        arrayLike[len++] = el;
      }
    }
    arrayLike.length = len;
    return arrayLike;
  } else {
    return els;
  }
};
goog.dom.getElementByTagNameAndClass_ = function(doc, opt_tag, opt_class, opt_el) {
  var parent = opt_el || doc;
  var tag = opt_tag && opt_tag != "*" ? String(opt_tag).toUpperCase() : "";
  if (goog.dom.canUseQuerySelector_(parent) && (tag || opt_class)) {
    return parent.querySelector(tag + (opt_class ? "." + opt_class : ""));
  }
  var elements = goog.dom.getElementsByTagNameAndClass_(doc, opt_tag, opt_class, opt_el);
  return elements[0] || null;
};
goog.dom.$$ = goog.dom.getElementsByTagNameAndClass;
goog.dom.setProperties = function(element, properties) {
  goog.object.forEach(properties, function(val, key) {
    if (val && val.implementsGoogStringTypedString) {
      val = val.getTypedStringValue();
    }
    if (key == "style") {
      element.style.cssText = val;
    } else {
      if (key == "class") {
        element.className = val;
      } else {
        if (key == "for") {
          element.htmlFor = val;
        } else {
          if (goog.dom.DIRECT_ATTRIBUTE_MAP_.hasOwnProperty(key)) {
            element.setAttribute(goog.dom.DIRECT_ATTRIBUTE_MAP_[key], val);
          } else {
            if (goog.string.startsWith(key, "aria-") || goog.string.startsWith(key, "data-")) {
              element.setAttribute(key, val);
            } else {
              element[key] = val;
            }
          }
        }
      }
    }
  });
};
goog.dom.DIRECT_ATTRIBUTE_MAP_ = {"cellpadding":"cellPadding", "cellspacing":"cellSpacing", "colspan":"colSpan", "frameborder":"frameBorder", "height":"height", "maxlength":"maxLength", "nonce":"nonce", "role":"role", "rowspan":"rowSpan", "type":"type", "usemap":"useMap", "valign":"vAlign", "width":"width"};
goog.dom.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize_(opt_window || window);
};
goog.dom.getViewportSize_ = function(win) {
  var doc = win.document;
  var el = goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body;
  return new goog.math.Size(el.clientWidth, el.clientHeight);
};
goog.dom.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(window);
};
goog.dom.getDocumentHeightForWindow = function(win) {
  return goog.dom.getDocumentHeight_(win);
};
goog.dom.getDocumentHeight_ = function(win) {
  var doc = win.document;
  var height = 0;
  if (doc) {
    var body = doc.body;
    var docEl = doc.documentElement;
    if (!(docEl && body)) {
      return 0;
    }
    var vh = goog.dom.getViewportSize_(win).height;
    if (goog.dom.isCss1CompatMode_(doc) && docEl.scrollHeight) {
      height = docEl.scrollHeight != vh ? docEl.scrollHeight : docEl.offsetHeight;
    } else {
      var sh = docEl.scrollHeight;
      var oh = docEl.offsetHeight;
      if (docEl.clientHeight != oh) {
        sh = body.scrollHeight;
        oh = body.offsetHeight;
      }
      if (sh > vh) {
        height = sh > oh ? sh : oh;
      } else {
        height = sh < oh ? sh : oh;
      }
    }
  }
  return height;
};
goog.dom.getPageScroll = function(opt_window) {
  var win = opt_window || goog.global || window;
  return goog.dom.getDomHelper(win.document).getDocumentScroll();
};
goog.dom.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(document);
};
goog.dom.getDocumentScroll_ = function(doc) {
  var el = goog.dom.getDocumentScrollElement_(doc);
  var win = goog.dom.getWindow_(doc);
  if (goog.userAgent.IE && goog.userAgent.isVersionOrHigher("10") && win.pageYOffset != el.scrollTop) {
    return new goog.math.Coordinate(el.scrollLeft, el.scrollTop);
  }
  return new goog.math.Coordinate(win.pageXOffset || el.scrollLeft, win.pageYOffset || el.scrollTop);
};
goog.dom.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(document);
};
goog.dom.getDocumentScrollElement_ = function(doc) {
  if (doc.scrollingElement) {
    return doc.scrollingElement;
  }
  if (!goog.userAgent.WEBKIT && goog.dom.isCss1CompatMode_(doc)) {
    return doc.documentElement;
  }
  return doc.body || doc.documentElement;
};
goog.dom.getWindow = function(opt_doc) {
  return opt_doc ? goog.dom.getWindow_(opt_doc) : window;
};
goog.dom.getWindow_ = function(doc) {
  return doc.parentWindow || doc.defaultView;
};
goog.dom.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(document, arguments);
};
goog.dom.createDom_ = function(doc, args) {
  var tagName = String(args[0]);
  var attributes = args[1];
  if (!goog.dom.BrowserFeature.CAN_ADD_NAME_OR_TYPE_ATTRIBUTES && attributes && (attributes.name || attributes.type)) {
    var tagNameArr = ["<", tagName];
    if (attributes.name) {
      tagNameArr.push(' name="', goog.string.htmlEscape(attributes.name), '"');
    }
    if (attributes.type) {
      tagNameArr.push(' type="', goog.string.htmlEscape(attributes.type), '"');
      var clone = {};
      goog.object.extend(clone, attributes);
      delete clone["type"];
      attributes = clone;
    }
    tagNameArr.push(">");
    tagName = tagNameArr.join("");
  }
  var element = doc.createElement(tagName);
  if (attributes) {
    if (goog.isString(attributes)) {
      element.className = attributes;
    } else {
      if (goog.isArray(attributes)) {
        element.className = attributes.join(" ");
      } else {
        goog.dom.setProperties(element, attributes);
      }
    }
  }
  if (args.length > 2) {
    goog.dom.append_(doc, element, args, 2);
  }
  return element;
};
goog.dom.append_ = function(doc, parent, args, startIndex) {
  function childHandler(child) {
    if (child) {
      parent.appendChild(goog.isString(child) ? doc.createTextNode(child) : child);
    }
  }
  for (var i = startIndex;i < args.length;i++) {
    var arg = args[i];
    if (goog.isArrayLike(arg) && !goog.dom.isNodeLike(arg)) {
      goog.array.forEach(goog.dom.isNodeList(arg) ? goog.array.toArray(arg) : arg, childHandler);
    } else {
      childHandler(arg);
    }
  }
};
goog.dom.$dom = goog.dom.createDom;
goog.dom.createElement = function(name) {
  return goog.dom.createElement_(document, name);
};
goog.dom.createElement_ = function(doc, name) {
  return doc.createElement(String(name));
};
goog.dom.createTextNode = function(content) {
  return document.createTextNode(String(content));
};
goog.dom.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(document, rows, columns, !!opt_fillWithNbsp);
};
goog.dom.createTable_ = function(doc, rows, columns, fillWithNbsp) {
  var table = goog.dom.createElement_(doc, "TABLE");
  var tbody = table.appendChild(goog.dom.createElement_(doc, "TBODY"));
  for (var i = 0;i < rows;i++) {
    var tr = goog.dom.createElement_(doc, "TR");
    for (var j = 0;j < columns;j++) {
      var td = goog.dom.createElement_(doc, "TD");
      if (fillWithNbsp) {
        goog.dom.setTextContent(td, goog.string.Unicode.NBSP);
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  return table;
};
goog.dom.constHtmlToNode = function(var_args) {
  var stringArray = goog.array.map(arguments, goog.string.Const.unwrap);
  var safeHtml = goog.html.uncheckedconversions.safeHtmlFromStringKnownToSatisfyTypeContract(goog.string.Const.from("Constant HTML string, that gets turned into a " + "Node later, so it will be automatically balanced."), stringArray.join(""));
  return goog.dom.safeHtmlToNode(safeHtml);
};
goog.dom.safeHtmlToNode = function(html) {
  return goog.dom.safeHtmlToNode_(document, html);
};
goog.dom.safeHtmlToNode_ = function(doc, html) {
  var tempDiv = goog.dom.createElement_(doc, "DIV");
  if (goog.dom.BrowserFeature.INNER_HTML_NEEDS_SCOPED_ELEMENT) {
    goog.dom.safe.setInnerHtml(tempDiv, goog.html.SafeHtml.concat(goog.html.SafeHtml.BR, html));
    tempDiv.removeChild(tempDiv.firstChild);
  } else {
    goog.dom.safe.setInnerHtml(tempDiv, html);
  }
  return goog.dom.childrenToNode_(doc, tempDiv);
};
goog.dom.childrenToNode_ = function(doc, tempDiv) {
  if (tempDiv.childNodes.length == 1) {
    return tempDiv.removeChild(tempDiv.firstChild);
  } else {
    for (var fragment = doc.createDocumentFragment();tempDiv.firstChild;) {
      fragment.appendChild(tempDiv.firstChild);
    }
    return fragment;
  }
};
goog.dom.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(document);
};
goog.dom.isCss1CompatMode_ = function(doc) {
  if (goog.dom.COMPAT_MODE_KNOWN_) {
    return goog.dom.ASSUME_STANDARDS_MODE;
  }
  return doc.compatMode == "CSS1Compat";
};
goog.dom.canHaveChildren = function(node) {
  if (node.nodeType != goog.dom.NodeType.ELEMENT) {
    return false;
  }
  switch(node.tagName) {
    case String("APPLET"):
    case String("AREA"):
    case String("BASE"):
    case String("BR"):
    case String("COL"):
    case String("COMMAND"):
    case String("EMBED"):
    case String("FRAME"):
    case String("HR"):
    case String("IMG"):
    case String("INPUT"):
    case String("IFRAME"):
    case String("ISINDEX"):
    case String("KEYGEN"):
    case String("LINK"):
    case String("NOFRAMES"):
    case String("NOSCRIPT"):
    case String("META"):
    case String("OBJECT"):
    case String("PARAM"):
    case String("SCRIPT"):
    case String("SOURCE"):
    case String("STYLE"):
    case String("TRACK"):
    case String("WBR"):
      return false;
  }
  return true;
};
goog.dom.appendChild = function(parent, child) {
  parent.appendChild(child);
};
goog.dom.append = function(parent, var_args) {
  goog.dom.append_(goog.dom.getOwnerDocument(parent), parent, arguments, 1);
};
goog.dom.removeChildren = function(node) {
  for (var child;child = node.firstChild;) {
    node.removeChild(child);
  }
};
goog.dom.insertSiblingBefore = function(newNode, refNode) {
  if (refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode);
  }
};
goog.dom.insertSiblingAfter = function(newNode, refNode) {
  if (refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode.nextSibling);
  }
};
goog.dom.insertChildAt = function(parent, child, index) {
  parent.insertBefore(child, parent.childNodes[index] || null);
};
goog.dom.removeNode = function(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null;
};
goog.dom.replaceNode = function(newNode, oldNode) {
  var parent = oldNode.parentNode;
  if (parent) {
    parent.replaceChild(newNode, oldNode);
  }
};
goog.dom.flattenElement = function(element) {
  var child;
  var parent = element.parentNode;
  if (parent && parent.nodeType != goog.dom.NodeType.DOCUMENT_FRAGMENT) {
    if (element.removeNode) {
      return element.removeNode(false);
    } else {
      for (;child = element.firstChild;) {
        parent.insertBefore(child, element);
      }
      return goog.dom.removeNode(element);
    }
  }
};
goog.dom.getChildren = function(element) {
  if (goog.dom.BrowserFeature.CAN_USE_CHILDREN_ATTRIBUTE && element.children != undefined) {
    return element.children;
  }
  return goog.array.filter(element.childNodes, function(node) {
    return node.nodeType == goog.dom.NodeType.ELEMENT;
  });
};
goog.dom.getFirstElementChild = function(node) {
  if (goog.isDef(node.firstElementChild)) {
    return node.firstElementChild;
  }
  return goog.dom.getNextElementNode_(node.firstChild, true);
};
goog.dom.getLastElementChild = function(node) {
  if (goog.isDef(node.lastElementChild)) {
    return node.lastElementChild;
  }
  return goog.dom.getNextElementNode_(node.lastChild, false);
};
goog.dom.getNextElementSibling = function(node) {
  if (goog.isDef(node.nextElementSibling)) {
    return node.nextElementSibling;
  }
  return goog.dom.getNextElementNode_(node.nextSibling, true);
};
goog.dom.getPreviousElementSibling = function(node) {
  if (goog.isDef(node.previousElementSibling)) {
    return node.previousElementSibling;
  }
  return goog.dom.getNextElementNode_(node.previousSibling, false);
};
goog.dom.getNextElementNode_ = function(node, forward) {
  for (;node && node.nodeType != goog.dom.NodeType.ELEMENT;) {
    node = forward ? node.nextSibling : node.previousSibling;
  }
  return node;
};
goog.dom.getNextNode = function(node) {
  if (!node) {
    return null;
  }
  if (node.firstChild) {
    return node.firstChild;
  }
  for (;node && !node.nextSibling;) {
    node = node.parentNode;
  }
  return node ? node.nextSibling : null;
};
goog.dom.getPreviousNode = function(node) {
  if (!node) {
    return null;
  }
  if (!node.previousSibling) {
    return node.parentNode;
  }
  for (node = node.previousSibling;node && node.lastChild;) {
    node = node.lastChild;
  }
  return node;
};
goog.dom.isNodeLike = function(obj) {
  return goog.isObject(obj) && obj.nodeType > 0;
};
goog.dom.isElement = function(obj) {
  return goog.isObject(obj) && obj.nodeType == goog.dom.NodeType.ELEMENT;
};
goog.dom.isWindow = function(obj) {
  return goog.isObject(obj) && obj["window"] == obj;
};
goog.dom.getParentElement = function(element) {
  var parent;
  if (goog.dom.BrowserFeature.CAN_USE_PARENT_ELEMENT_PROPERTY) {
    var isIe9 = goog.userAgent.IE && goog.userAgent.isVersionOrHigher("9") && !goog.userAgent.isVersionOrHigher("10");
    if (!(isIe9 && goog.global["SVGElement"] && element instanceof goog.global["SVGElement"])) {
      parent = element.parentElement;
      if (parent) {
        return parent;
      }
    }
  }
  parent = element.parentNode;
  return goog.dom.isElement(parent) ? parent : null;
};
goog.dom.contains = function(parent, descendant) {
  if (!parent || !descendant) {
    return false;
  }
  if (parent.contains && descendant.nodeType == goog.dom.NodeType.ELEMENT) {
    return parent == descendant || parent.contains(descendant);
  }
  if (typeof parent.compareDocumentPosition != "undefined") {
    return parent == descendant || Boolean(parent.compareDocumentPosition(descendant) & 16);
  }
  for (;descendant && parent != descendant;) {
    descendant = descendant.parentNode;
  }
  return descendant == parent;
};
goog.dom.compareNodeOrder = function(node1, node2) {
  if (node1 == node2) {
    return 0;
  }
  if (node1.compareDocumentPosition) {
    return node1.compareDocumentPosition(node2) & 2 ? 1 : -1;
  }
  if (goog.userAgent.IE && !goog.userAgent.isDocumentModeOrHigher(9)) {
    if (node1.nodeType == goog.dom.NodeType.DOCUMENT) {
      return -1;
    }
    if (node2.nodeType == goog.dom.NodeType.DOCUMENT) {
      return 1;
    }
  }
  if ("sourceIndex" in node1 || node1.parentNode && "sourceIndex" in node1.parentNode) {
    var isElement1 = node1.nodeType == goog.dom.NodeType.ELEMENT;
    var isElement2 = node2.nodeType == goog.dom.NodeType.ELEMENT;
    if (isElement1 && isElement2) {
      return node1.sourceIndex - node2.sourceIndex;
    } else {
      var parent1 = node1.parentNode;
      var parent2 = node2.parentNode;
      if (parent1 == parent2) {
        return goog.dom.compareSiblingOrder_(node1, node2);
      }
      if (!isElement1 && goog.dom.contains(parent1, node2)) {
        return -1 * goog.dom.compareParentsDescendantNodeIe_(node1, node2);
      }
      if (!isElement2 && goog.dom.contains(parent2, node1)) {
        return goog.dom.compareParentsDescendantNodeIe_(node2, node1);
      }
      return (isElement1 ? node1.sourceIndex : parent1.sourceIndex) - (isElement2 ? node2.sourceIndex : parent2.sourceIndex);
    }
  }
  var doc = goog.dom.getOwnerDocument(node1);
  var range1;
  var range2;
  range1 = doc.createRange();
  range1.selectNode(node1);
  range1.collapse(true);
  range2 = doc.createRange();
  range2.selectNode(node2);
  range2.collapse(true);
  return range1.compareBoundaryPoints(goog.global["Range"].START_TO_END, range2);
};
goog.dom.compareParentsDescendantNodeIe_ = function(textNode, node) {
  var parent = textNode.parentNode;
  if (parent == node) {
    return -1;
  }
  for (var sibling = node;sibling.parentNode != parent;) {
    sibling = sibling.parentNode;
  }
  return goog.dom.compareSiblingOrder_(sibling, textNode);
};
goog.dom.compareSiblingOrder_ = function(node1, node2) {
  for (var s = node2;s = s.previousSibling;) {
    if (s == node1) {
      return -1;
    }
  }
  return 1;
};
goog.dom.findCommonAncestor = function(var_args) {
  var i;
  var count = arguments.length;
  if (!count) {
    return null;
  } else {
    if (count == 1) {
      return arguments[0];
    }
  }
  var paths = [];
  var minLength = Infinity;
  for (i = 0;i < count;i++) {
    var ancestors = [];
    for (var node = arguments[i];node;) {
      ancestors.unshift(node);
      node = node.parentNode;
    }
    paths.push(ancestors);
    minLength = Math.min(minLength, ancestors.length);
  }
  var output = null;
  for (i = 0;i < minLength;i++) {
    var first = paths[0][i];
    for (var j = 1;j < count;j++) {
      if (first != paths[j][i]) {
        return output;
      }
    }
    output = first;
  }
  return output;
};
goog.dom.getOwnerDocument = function(node) {
  goog.asserts.assert(node, "Node cannot be null or undefined.");
  return node.nodeType == goog.dom.NodeType.DOCUMENT ? node : node.ownerDocument || node.document;
};
goog.dom.getFrameContentDocument = function(frame) {
  return frame.contentDocument || frame.contentWindow.document;
};
goog.dom.getFrameContentWindow = function(frame) {
  try {
    return frame.contentWindow || (frame.contentDocument ? goog.dom.getWindow(frame.contentDocument) : null);
  } catch (e) {
  }
  return null;
};
goog.dom.setTextContent = function(node, text) {
  goog.asserts.assert(node != null, "goog.dom.setTextContent expects a non-null value for node");
  if ("textContent" in node) {
    node.textContent = text;
  } else {
    if (node.nodeType == goog.dom.NodeType.TEXT) {
      node.data = String(text);
    } else {
      if (node.firstChild && node.firstChild.nodeType == goog.dom.NodeType.TEXT) {
        for (;node.lastChild != node.firstChild;) {
          node.removeChild(node.lastChild);
        }
        node.firstChild.data = String(text);
      } else {
        goog.dom.removeChildren(node);
        var doc = goog.dom.getOwnerDocument(node);
        node.appendChild(doc.createTextNode(String(text)));
      }
    }
  }
};
goog.dom.getOuterHtml = function(element) {
  goog.asserts.assert(element !== null, "goog.dom.getOuterHtml expects a non-null value for element");
  if ("outerHTML" in element) {
    return element.outerHTML;
  } else {
    var doc = goog.dom.getOwnerDocument(element);
    var div = goog.dom.createElement_(doc, "DIV");
    div.appendChild(element.cloneNode(true));
    return div.innerHTML;
  }
};
goog.dom.findNode = function(root, p) {
  var rv = [];
  var found = goog.dom.findNodes_(root, p, rv, true);
  return found ? rv[0] : undefined;
};
goog.dom.findNodes = function(root, p) {
  var rv = [];
  goog.dom.findNodes_(root, p, rv, false);
  return rv;
};
goog.dom.findNodes_ = function(root, p, rv, findOne) {
  if (root != null) {
    for (var child = root.firstChild;child;) {
      if (p(child)) {
        rv.push(child);
        if (findOne) {
          return true;
        }
      }
      if (goog.dom.findNodes_(child, p, rv, findOne)) {
        return true;
      }
      child = child.nextSibling;
    }
  }
  return false;
};
goog.dom.TAGS_TO_IGNORE_ = {"SCRIPT":1, "STYLE":1, "HEAD":1, "IFRAME":1, "OBJECT":1};
goog.dom.PREDEFINED_TAG_VALUES_ = {"IMG":" ", "BR":"\n"};
goog.dom.isFocusableTabIndex = function(element) {
  return goog.dom.hasSpecifiedTabIndex_(element) && goog.dom.isTabIndexFocusable_(element);
};
goog.dom.setFocusableTabIndex = function(element, enable) {
  if (enable) {
    element.tabIndex = 0;
  } else {
    element.tabIndex = -1;
    element.removeAttribute("tabIndex");
  }
};
goog.dom.isFocusable = function(element) {
  var focusable;
  if (goog.dom.nativelySupportsFocus_(element)) {
    focusable = !element.disabled && (!goog.dom.hasSpecifiedTabIndex_(element) || goog.dom.isTabIndexFocusable_(element));
  } else {
    focusable = goog.dom.isFocusableTabIndex(element);
  }
  return focusable && goog.userAgent.IE ? goog.dom.hasNonZeroBoundingRect_(element) : focusable;
};
goog.dom.hasSpecifiedTabIndex_ = function(element) {
  if (goog.userAgent.IE && !goog.userAgent.isVersionOrHigher("9")) {
    var attrNode = element.getAttributeNode("tabindex");
    return goog.isDefAndNotNull(attrNode) && attrNode.specified;
  } else {
    return element.hasAttribute("tabindex");
  }
};
goog.dom.isTabIndexFocusable_ = function(element) {
  var index = element.tabIndex;
  return goog.isNumber(index) && index >= 0 && index < 32768;
};
goog.dom.nativelySupportsFocus_ = function(element) {
  return element.tagName == "A" || element.tagName == "INPUT" || element.tagName == "TEXTAREA" || element.tagName == "SELECT" || element.tagName == "BUTTON";
};
goog.dom.hasNonZeroBoundingRect_ = function(element) {
  var rect;
  if (!goog.isFunction(element["getBoundingClientRect"]) || goog.userAgent.IE && element.parentElement == null) {
    rect = {"height":element.offsetHeight, "width":element.offsetWidth};
  } else {
    rect = element.getBoundingClientRect();
  }
  return goog.isDefAndNotNull(rect) && rect.height > 0 && rect.width > 0;
};
goog.dom.getTextContent = function(node) {
  var textContent;
  if (goog.dom.BrowserFeature.CAN_USE_INNER_TEXT && node !== null && "innerText" in node) {
    textContent = goog.string.canonicalizeNewlines(node.innerText);
  } else {
    var buf = [];
    goog.dom.getTextContent_(node, buf, true);
    textContent = buf.join("");
  }
  textContent = textContent.replace(/ \xAD /g, " ").replace(/\xAD/g, "");
  textContent = textContent.replace(/\u200B/g, "");
  if (!goog.dom.BrowserFeature.CAN_USE_INNER_TEXT) {
    textContent = textContent.replace(/ +/g, " ");
  }
  if (textContent != " ") {
    textContent = textContent.replace(/^\s*/, "");
  }
  return textContent;
};
goog.dom.getRawTextContent = function(node) {
  var buf = [];
  goog.dom.getTextContent_(node, buf, false);
  return buf.join("");
};
goog.dom.getTextContent_ = function(node, buf, normalizeWhitespace) {
  if (node.nodeName in goog.dom.TAGS_TO_IGNORE_) {
  } else {
    if (node.nodeType == goog.dom.NodeType.TEXT) {
      if (normalizeWhitespace) {
        buf.push(String(node.nodeValue).replace(/(\r\n|\r|\n)/g, ""));
      } else {
        buf.push(node.nodeValue);
      }
    } else {
      if (node.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
        buf.push(goog.dom.PREDEFINED_TAG_VALUES_[node.nodeName]);
      } else {
        for (var child = node.firstChild;child;) {
          goog.dom.getTextContent_(child, buf, normalizeWhitespace);
          child = child.nextSibling;
        }
      }
    }
  }
};
goog.dom.getNodeTextLength = function(node) {
  return goog.dom.getTextContent(node).length;
};
goog.dom.getNodeTextOffset = function(node, opt_offsetParent) {
  var root = opt_offsetParent || goog.dom.getOwnerDocument(node).body;
  for (var buf = [];node && node != root;) {
    for (var cur = node;cur = cur.previousSibling;) {
      buf.unshift(goog.dom.getTextContent(cur));
    }
    node = node.parentNode;
  }
  return goog.string.trimLeft(buf.join("")).replace(/ +/g, " ").length;
};
goog.dom.getNodeAtOffset = function(parent, offset, opt_result) {
  var stack = [parent];
  var pos = 0;
  for (var cur = null;stack.length > 0 && pos < offset;) {
    cur = stack.pop();
    if (cur.nodeName in goog.dom.TAGS_TO_IGNORE_) {
    } else {
      if (cur.nodeType == goog.dom.NodeType.TEXT) {
        var text = cur.nodeValue.replace(/(\r\n|\r|\n)/g, "").replace(/ +/g, " ");
        pos += text.length;
      } else {
        if (cur.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
          pos += goog.dom.PREDEFINED_TAG_VALUES_[cur.nodeName].length;
        } else {
          for (var i = cur.childNodes.length - 1;i >= 0;i--) {
            stack.push(cur.childNodes[i]);
          }
        }
      }
    }
  }
  if (goog.isObject(opt_result)) {
    opt_result.remainder = cur ? cur.nodeValue.length + offset - pos - 1 : 0;
    opt_result.node = cur;
  }
  return cur;
};
goog.dom.isNodeList = function(val) {
  if (val && typeof val.length == "number") {
    if (goog.isObject(val)) {
      return typeof val.item == "function" || typeof val.item == "string";
    } else {
      if (goog.isFunction(val)) {
        return typeof val.item == "function";
      }
    }
  }
  return false;
};
goog.dom.getAncestorByTagNameAndClass = function(element, opt_tag, opt_class, opt_maxSearchSteps) {
  if (!opt_tag && !opt_class) {
    return null;
  }
  var tagName = opt_tag ? String(opt_tag).toUpperCase() : null;
  return goog.dom.getAncestor(element, function(node) {
    return (!tagName || node.nodeName == tagName) && (!opt_class || goog.isString(node.className) && goog.array.contains(node.className.split(/\s+/), opt_class));
  }, true, opt_maxSearchSteps);
};
goog.dom.getAncestorByClass = function(element, className, opt_maxSearchSteps) {
  return goog.dom.getAncestorByTagNameAndClass(element, null, className, opt_maxSearchSteps);
};
goog.dom.getAncestor = function(element, matcher, opt_includeNode, opt_maxSearchSteps) {
  if (element && !opt_includeNode) {
    element = element.parentNode;
  }
  for (var steps = 0;element && (opt_maxSearchSteps == null || steps <= opt_maxSearchSteps);) {
    goog.asserts.assert(element.name != "parentNode");
    if (matcher(element)) {
      return element;
    }
    element = element.parentNode;
    steps++;
  }
  return null;
};
goog.dom.getActiveElement = function(doc) {
  try {
    return doc && doc.activeElement;
  } catch (e) {
  }
  return null;
};
goog.dom.getPixelRatio = function() {
  var win = goog.dom.getWindow();
  if (goog.isDef(win.devicePixelRatio)) {
    return win.devicePixelRatio;
  } else {
    if (win.matchMedia) {
      return goog.dom.matchesPixelRatio_(3) || goog.dom.matchesPixelRatio_(2) || goog.dom.matchesPixelRatio_(1.5) || goog.dom.matchesPixelRatio_(1) || .75;
    }
  }
  return 1;
};
goog.dom.matchesPixelRatio_ = function(pixelRatio) {
  var win = goog.dom.getWindow();
  var dpiPerDppx = 96;
  var query = "(min-resolution: " + pixelRatio + "dppx)," + "(min--moz-device-pixel-ratio: " + pixelRatio + ")," + "(min-resolution: " + pixelRatio * dpiPerDppx + "dpi)";
  return win.matchMedia(query).matches ? pixelRatio : 0;
};
goog.dom.getCanvasContext2D = function(canvas) {
  return canvas.getContext("2d");
};
goog.dom.DomHelper = function(opt_document) {
  this.document_ = opt_document || goog.global.document || document;
};
goog.dom.DomHelper.prototype.getDomHelper = goog.dom.getDomHelper;
goog.dom.DomHelper.prototype.setDocument = function(document) {
  this.document_ = document;
};
goog.dom.DomHelper.prototype.getDocument = function() {
  return this.document_;
};
goog.dom.DomHelper.prototype.getElement = function(element) {
  return goog.dom.getElementHelper_(this.document_, element);
};
goog.dom.DomHelper.prototype.getRequiredElement = function(id) {
  return goog.dom.getRequiredElementHelper_(this.document_, id);
};
goog.dom.DomHelper.prototype.$ = goog.dom.DomHelper.prototype.getElement;
goog.dom.DomHelper.prototype.getElementsByTagName = function(tagName, opt_parent) {
  var parent = opt_parent || this.document_;
  return parent.getElementsByTagName(String(tagName));
};
goog.dom.DomHelper.prototype.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(this.document_, opt_tag, opt_class, opt_el);
};
goog.dom.DomHelper.prototype.getElementByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementByTagNameAndClass_(this.document_, opt_tag, opt_class, opt_el);
};
goog.dom.DomHelper.prototype.getElementsByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementsByClass(className, doc);
};
goog.dom.DomHelper.prototype.getElementByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementByClass(className, doc);
};
goog.dom.DomHelper.prototype.getRequiredElementByClass = function(className, opt_root) {
  var root = opt_root || this.document_;
  return goog.dom.getRequiredElementByClass(className, root);
};
goog.dom.DomHelper.prototype.$$ = goog.dom.DomHelper.prototype.getElementsByTagNameAndClass;
goog.dom.DomHelper.prototype.setProperties = goog.dom.setProperties;
goog.dom.DomHelper.prototype.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize(opt_window || this.getWindow());
};
goog.dom.DomHelper.prototype.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(this.getWindow());
};
goog.dom.Appendable;
goog.dom.DomHelper.prototype.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(this.document_, arguments);
};
goog.dom.DomHelper.prototype.$dom = goog.dom.DomHelper.prototype.createDom;
goog.dom.DomHelper.prototype.createElement = function(name) {
  return goog.dom.createElement_(this.document_, name);
};
goog.dom.DomHelper.prototype.createTextNode = function(content) {
  return this.document_.createTextNode(String(content));
};
goog.dom.DomHelper.prototype.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(this.document_, rows, columns, !!opt_fillWithNbsp);
};
goog.dom.DomHelper.prototype.safeHtmlToNode = function(html) {
  return goog.dom.safeHtmlToNode_(this.document_, html);
};
goog.dom.DomHelper.prototype.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(this.document_);
};
goog.dom.DomHelper.prototype.getWindow = function() {
  return goog.dom.getWindow_(this.document_);
};
goog.dom.DomHelper.prototype.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(this.document_);
};
goog.dom.DomHelper.prototype.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(this.document_);
};
goog.dom.DomHelper.prototype.getActiveElement = function(opt_doc) {
  return goog.dom.getActiveElement(opt_doc || this.document_);
};
goog.dom.DomHelper.prototype.appendChild = goog.dom.appendChild;
goog.dom.DomHelper.prototype.append = goog.dom.append;
goog.dom.DomHelper.prototype.canHaveChildren = goog.dom.canHaveChildren;
goog.dom.DomHelper.prototype.removeChildren = goog.dom.removeChildren;
goog.dom.DomHelper.prototype.insertSiblingBefore = goog.dom.insertSiblingBefore;
goog.dom.DomHelper.prototype.insertSiblingAfter = goog.dom.insertSiblingAfter;
goog.dom.DomHelper.prototype.insertChildAt = goog.dom.insertChildAt;
goog.dom.DomHelper.prototype.removeNode = goog.dom.removeNode;
goog.dom.DomHelper.prototype.replaceNode = goog.dom.replaceNode;
goog.dom.DomHelper.prototype.flattenElement = goog.dom.flattenElement;
goog.dom.DomHelper.prototype.getChildren = goog.dom.getChildren;
goog.dom.DomHelper.prototype.getFirstElementChild = goog.dom.getFirstElementChild;
goog.dom.DomHelper.prototype.getLastElementChild = goog.dom.getLastElementChild;
goog.dom.DomHelper.prototype.getNextElementSibling = goog.dom.getNextElementSibling;
goog.dom.DomHelper.prototype.getPreviousElementSibling = goog.dom.getPreviousElementSibling;
goog.dom.DomHelper.prototype.getNextNode = goog.dom.getNextNode;
goog.dom.DomHelper.prototype.getPreviousNode = goog.dom.getPreviousNode;
goog.dom.DomHelper.prototype.isNodeLike = goog.dom.isNodeLike;
goog.dom.DomHelper.prototype.isElement = goog.dom.isElement;
goog.dom.DomHelper.prototype.isWindow = goog.dom.isWindow;
goog.dom.DomHelper.prototype.getParentElement = goog.dom.getParentElement;
goog.dom.DomHelper.prototype.contains = goog.dom.contains;
goog.dom.DomHelper.prototype.compareNodeOrder = goog.dom.compareNodeOrder;
goog.dom.DomHelper.prototype.findCommonAncestor = goog.dom.findCommonAncestor;
goog.dom.DomHelper.prototype.getOwnerDocument = goog.dom.getOwnerDocument;
goog.dom.DomHelper.prototype.getFrameContentDocument = goog.dom.getFrameContentDocument;
goog.dom.DomHelper.prototype.getFrameContentWindow = goog.dom.getFrameContentWindow;
goog.dom.DomHelper.prototype.setTextContent = goog.dom.setTextContent;
goog.dom.DomHelper.prototype.getOuterHtml = goog.dom.getOuterHtml;
goog.dom.DomHelper.prototype.findNode = goog.dom.findNode;
goog.dom.DomHelper.prototype.findNodes = goog.dom.findNodes;
goog.dom.DomHelper.prototype.isFocusableTabIndex = goog.dom.isFocusableTabIndex;
goog.dom.DomHelper.prototype.setFocusableTabIndex = goog.dom.setFocusableTabIndex;
goog.dom.DomHelper.prototype.isFocusable = goog.dom.isFocusable;
goog.dom.DomHelper.prototype.getTextContent = goog.dom.getTextContent;
goog.dom.DomHelper.prototype.getNodeTextLength = goog.dom.getNodeTextLength;
goog.dom.DomHelper.prototype.getNodeTextOffset = goog.dom.getNodeTextOffset;
goog.dom.DomHelper.prototype.getNodeAtOffset = goog.dom.getNodeAtOffset;
goog.dom.DomHelper.prototype.isNodeList = goog.dom.isNodeList;
goog.dom.DomHelper.prototype.getAncestorByTagNameAndClass = goog.dom.getAncestorByTagNameAndClass;
goog.dom.DomHelper.prototype.getAncestorByClass = goog.dom.getAncestorByClass;
goog.dom.DomHelper.prototype.getAncestor = goog.dom.getAncestor;
goog.dom.DomHelper.prototype.getCanvasContext2D = goog.dom.getCanvasContext2D;
goog.dom.vendor = {};
goog.dom.vendor.getVendorJsPrefix = function() {
  if (goog.userAgent.WEBKIT) {
    return "Webkit";
  } else {
    if (goog.userAgent.GECKO) {
      return "Moz";
    } else {
      if (goog.userAgent.IE) {
        return "ms";
      } else {
        if (goog.userAgent.OPERA) {
          return "O";
        }
      }
    }
  }
  return null;
};
goog.dom.vendor.getVendorPrefix = function() {
  if (goog.userAgent.WEBKIT) {
    return "-webkit";
  } else {
    if (goog.userAgent.GECKO) {
      return "-moz";
    } else {
      if (goog.userAgent.IE) {
        return "-ms";
      } else {
        if (goog.userAgent.OPERA) {
          return "-o";
        }
      }
    }
  }
  return null;
};
goog.dom.vendor.getPrefixedPropertyName = function(propertyName, opt_object) {
  if (opt_object && propertyName in opt_object) {
    return propertyName;
  }
  var prefix = goog.dom.vendor.getVendorJsPrefix();
  if (prefix) {
    prefix = prefix.toLowerCase();
    var prefixedPropertyName = prefix + goog.string.toTitleCase(propertyName);
    return !goog.isDef(opt_object) || prefixedPropertyName in opt_object ? prefixedPropertyName : null;
  }
  return null;
};
goog.dom.vendor.getPrefixedEventType = function(eventType) {
  var prefix = goog.dom.vendor.getVendorJsPrefix() || "";
  return (prefix + eventType).toLowerCase();
};
goog.math.Box = function(top, right, bottom, left) {
  this.top = top;
  this.right = right;
  this.bottom = bottom;
  this.left = left;
};
goog.math.Box.boundingBox = function(var_args) {
  var box = new goog.math.Box(arguments[0].y, arguments[0].x, arguments[0].y, arguments[0].x);
  for (var i = 1;i < arguments.length;i++) {
    box.expandToIncludeCoordinate(arguments[i]);
  }
  return box;
};
goog.math.Box.prototype.getWidth = function() {
  return this.right - this.left;
};
goog.math.Box.prototype.getHeight = function() {
  return this.bottom - this.top;
};
goog.math.Box.prototype.clone = function() {
  return new goog.math.Box(this.top, this.right, this.bottom, this.left);
};
if (goog.DEBUG) {
  goog.math.Box.prototype.toString = function() {
    return "(" + this.top + "t, " + this.right + "r, " + this.bottom + "b, " + this.left + "l)";
  };
}
goog.math.Box.prototype.contains = function(other) {
  return goog.math.Box.contains(this, other);
};
goog.math.Box.prototype.expand = function(top, opt_right, opt_bottom, opt_left) {
  if (goog.isObject(top)) {
    this.top -= top.top;
    this.right += top.right;
    this.bottom += top.bottom;
    this.left -= top.left;
  } else {
    this.top -= top;
    this.right += Number(opt_right);
    this.bottom += Number(opt_bottom);
    this.left -= Number(opt_left);
  }
  return this;
};
goog.math.Box.prototype.expandToInclude = function(box) {
  this.left = Math.min(this.left, box.left);
  this.top = Math.min(this.top, box.top);
  this.right = Math.max(this.right, box.right);
  this.bottom = Math.max(this.bottom, box.bottom);
};
goog.math.Box.prototype.expandToIncludeCoordinate = function(coord) {
  this.top = Math.min(this.top, coord.y);
  this.right = Math.max(this.right, coord.x);
  this.bottom = Math.max(this.bottom, coord.y);
  this.left = Math.min(this.left, coord.x);
};
goog.math.Box.equals = function(a, b) {
  if (a == b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return a.top == b.top && a.right == b.right && a.bottom == b.bottom && a.left == b.left;
};
goog.math.Box.contains = function(box, other) {
  if (!box || !other) {
    return false;
  }
  if (other instanceof goog.math.Box) {
    return other.left >= box.left && other.right <= box.right && other.top >= box.top && other.bottom <= box.bottom;
  }
  return other.x >= box.left && other.x <= box.right && other.y >= box.top && other.y <= box.bottom;
};
goog.math.Box.relativePositionX = function(box, coord) {
  if (coord.x < box.left) {
    return coord.x - box.left;
  } else {
    if (coord.x > box.right) {
      return coord.x - box.right;
    }
  }
  return 0;
};
goog.math.Box.relativePositionY = function(box, coord) {
  if (coord.y < box.top) {
    return coord.y - box.top;
  } else {
    if (coord.y > box.bottom) {
      return coord.y - box.bottom;
    }
  }
  return 0;
};
goog.math.Box.distance = function(box, coord) {
  var x = goog.math.Box.relativePositionX(box, coord);
  var y = goog.math.Box.relativePositionY(box, coord);
  return Math.sqrt(x * x + y * y);
};
goog.math.Box.intersects = function(a, b) {
  return a.left <= b.right && b.left <= a.right && a.top <= b.bottom && b.top <= a.bottom;
};
goog.math.Box.intersectsWithPadding = function(a, b, padding) {
  return a.left <= b.right + padding && b.left <= a.right + padding && a.top <= b.bottom + padding && b.top <= a.bottom + padding;
};
goog.math.Box.prototype.ceil = function() {
  this.top = Math.ceil(this.top);
  this.right = Math.ceil(this.right);
  this.bottom = Math.ceil(this.bottom);
  this.left = Math.ceil(this.left);
  return this;
};
goog.math.Box.prototype.floor = function() {
  this.top = Math.floor(this.top);
  this.right = Math.floor(this.right);
  this.bottom = Math.floor(this.bottom);
  this.left = Math.floor(this.left);
  return this;
};
goog.math.Box.prototype.round = function() {
  this.top = Math.round(this.top);
  this.right = Math.round(this.right);
  this.bottom = Math.round(this.bottom);
  this.left = Math.round(this.left);
  return this;
};
goog.math.Box.prototype.translate = function(tx, opt_ty) {
  if (tx instanceof goog.math.Coordinate) {
    this.left += tx.x;
    this.right += tx.x;
    this.top += tx.y;
    this.bottom += tx.y;
  } else {
    goog.asserts.assertNumber(tx);
    this.left += tx;
    this.right += tx;
    if (goog.isNumber(opt_ty)) {
      this.top += opt_ty;
      this.bottom += opt_ty;
    }
  }
  return this;
};
goog.math.Box.prototype.scale = function(sx, opt_sy) {
  var sy = goog.isNumber(opt_sy) ? opt_sy : sx;
  this.left *= sx;
  this.right *= sx;
  this.top *= sy;
  this.bottom *= sy;
  return this;
};
goog.math.IRect = function() {
};
goog.math.IRect.prototype.left;
goog.math.IRect.prototype.top;
goog.math.IRect.prototype.width;
goog.math.IRect.prototype.height;
goog.math.Rect = function(x, y, w, h) {
  this.left = x;
  this.top = y;
  this.width = w;
  this.height = h;
};
goog.math.Rect.prototype.clone = function() {
  return new goog.math.Rect(this.left, this.top, this.width, this.height);
};
goog.math.Rect.prototype.toBox = function() {
  var right = this.left + this.width;
  var bottom = this.top + this.height;
  return new goog.math.Box(this.top, right, bottom, this.left);
};
goog.math.Rect.createFromPositionAndSize = function(position, size) {
  return new goog.math.Rect(position.x, position.y, size.width, size.height);
};
goog.math.Rect.createFromBox = function(box) {
  return new goog.math.Rect(box.left, box.top, box.right - box.left, box.bottom - box.top);
};
if (goog.DEBUG) {
  goog.math.Rect.prototype.toString = function() {
    return "(" + this.left + ", " + this.top + " - " + this.width + "w x " + this.height + "h)";
  };
}
goog.math.Rect.equals = function(a, b) {
  if (a == b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return a.left == b.left && a.width == b.width && a.top == b.top && a.height == b.height;
};
goog.math.Rect.prototype.intersection = function(rect) {
  var x0 = Math.max(this.left, rect.left);
  var x1 = Math.min(this.left + this.width, rect.left + rect.width);
  if (x0 <= x1) {
    var y0 = Math.max(this.top, rect.top);
    var y1 = Math.min(this.top + this.height, rect.top + rect.height);
    if (y0 <= y1) {
      this.left = x0;
      this.top = y0;
      this.width = x1 - x0;
      this.height = y1 - y0;
      return true;
    }
  }
  return false;
};
goog.math.Rect.intersection = function(a, b) {
  var x0 = Math.max(a.left, b.left);
  var x1 = Math.min(a.left + a.width, b.left + b.width);
  if (x0 <= x1) {
    var y0 = Math.max(a.top, b.top);
    var y1 = Math.min(a.top + a.height, b.top + b.height);
    if (y0 <= y1) {
      return new goog.math.Rect(x0, y0, x1 - x0, y1 - y0);
    }
  }
  return null;
};
goog.math.Rect.intersects = function(a, b) {
  return a.left <= b.left + b.width && b.left <= a.left + a.width && a.top <= b.top + b.height && b.top <= a.top + a.height;
};
goog.math.Rect.prototype.intersects = function(rect) {
  return goog.math.Rect.intersects(this, rect);
};
goog.math.Rect.difference = function(a, b) {
  var intersection = goog.math.Rect.intersection(a, b);
  if (!intersection || !intersection.height || !intersection.width) {
    return [a.clone()];
  }
  var result = [];
  var top = a.top;
  var height = a.height;
  var ar = a.left + a.width;
  var ab = a.top + a.height;
  var br = b.left + b.width;
  var bb = b.top + b.height;
  if (b.top > a.top) {
    result.push(new goog.math.Rect(a.left, a.top, a.width, b.top - a.top));
    top = b.top;
    height -= b.top - a.top;
  }
  if (bb < ab) {
    result.push(new goog.math.Rect(a.left, bb, a.width, ab - bb));
    height = bb - top;
  }
  if (b.left > a.left) {
    result.push(new goog.math.Rect(a.left, top, b.left - a.left, height));
  }
  if (br < ar) {
    result.push(new goog.math.Rect(br, top, ar - br, height));
  }
  return result;
};
goog.math.Rect.prototype.difference = function(rect) {
  return goog.math.Rect.difference(this, rect);
};
goog.math.Rect.prototype.boundingRect = function(rect) {
  var right = Math.max(this.left + this.width, rect.left + rect.width);
  var bottom = Math.max(this.top + this.height, rect.top + rect.height);
  this.left = Math.min(this.left, rect.left);
  this.top = Math.min(this.top, rect.top);
  this.width = right - this.left;
  this.height = bottom - this.top;
};
goog.math.Rect.boundingRect = function(a, b) {
  if (!a || !b) {
    return null;
  }
  var newRect = new goog.math.Rect(a.left, a.top, a.width, a.height);
  newRect.boundingRect(b);
  return newRect;
};
goog.math.Rect.prototype.contains = function(another) {
  if (another instanceof goog.math.Coordinate) {
    return another.x >= this.left && another.x <= this.left + this.width && another.y >= this.top && another.y <= this.top + this.height;
  } else {
    return this.left <= another.left && this.left + this.width >= another.left + another.width && this.top <= another.top && this.top + this.height >= another.top + another.height;
  }
};
goog.math.Rect.prototype.squaredDistance = function(point) {
  var dx = point.x < this.left ? this.left - point.x : Math.max(point.x - (this.left + this.width), 0);
  var dy = point.y < this.top ? this.top - point.y : Math.max(point.y - (this.top + this.height), 0);
  return dx * dx + dy * dy;
};
goog.math.Rect.prototype.distance = function(point) {
  return Math.sqrt(this.squaredDistance(point));
};
goog.math.Rect.prototype.getSize = function() {
  return new goog.math.Size(this.width, this.height);
};
goog.math.Rect.prototype.getTopLeft = function() {
  return new goog.math.Coordinate(this.left, this.top);
};
goog.math.Rect.prototype.getCenter = function() {
  return new goog.math.Coordinate(this.left + this.width / 2, this.top + this.height / 2);
};
goog.math.Rect.prototype.getBottomRight = function() {
  return new goog.math.Coordinate(this.left + this.width, this.top + this.height);
};
goog.math.Rect.prototype.ceil = function() {
  this.left = Math.ceil(this.left);
  this.top = Math.ceil(this.top);
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this;
};
goog.math.Rect.prototype.floor = function() {
  this.left = Math.floor(this.left);
  this.top = Math.floor(this.top);
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this;
};
goog.math.Rect.prototype.round = function() {
  this.left = Math.round(this.left);
  this.top = Math.round(this.top);
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this;
};
goog.math.Rect.prototype.translate = function(tx, opt_ty) {
  if (tx instanceof goog.math.Coordinate) {
    this.left += tx.x;
    this.top += tx.y;
  } else {
    this.left += goog.asserts.assertNumber(tx);
    if (goog.isNumber(opt_ty)) {
      this.top += opt_ty;
    }
  }
  return this;
};
goog.math.Rect.prototype.scale = function(sx, opt_sy) {
  var sy = goog.isNumber(opt_sy) ? opt_sy : sx;
  this.left *= sx;
  this.width *= sx;
  this.top *= sy;
  this.height *= sy;
  return this;
};
goog.style = {};
goog.style.setStyle = function(element, style, opt_value) {
  if (goog.isString(style)) {
    goog.style.setStyle_(element, opt_value, style);
  } else {
    for (var key in style) {
      goog.style.setStyle_(element, style[key], key);
    }
  }
};
goog.style.setStyle_ = function(element, value, style) {
  var propertyName = goog.style.getVendorJsStyleName_(element, style);
  if (propertyName) {
    element.style[propertyName] = value;
  }
};
goog.style.styleNameCache_ = {};
goog.style.getVendorJsStyleName_ = function(element, style) {
  var propertyName = goog.style.styleNameCache_[style];
  if (!propertyName) {
    var camelStyle = goog.string.toCamelCase(style);
    propertyName = camelStyle;
    if (element.style[camelStyle] === undefined) {
      var prefixedStyle = goog.dom.vendor.getVendorJsPrefix() + goog.string.toTitleCase(camelStyle);
      if (element.style[prefixedStyle] !== undefined) {
        propertyName = prefixedStyle;
      }
    }
    goog.style.styleNameCache_[style] = propertyName;
  }
  return propertyName;
};
goog.style.getVendorStyleName_ = function(element, style) {
  var camelStyle = goog.string.toCamelCase(style);
  if (element.style[camelStyle] === undefined) {
    var prefixedStyle = goog.dom.vendor.getVendorJsPrefix() + goog.string.toTitleCase(camelStyle);
    if (element.style[prefixedStyle] !== undefined) {
      return goog.dom.vendor.getVendorPrefix() + "-" + style;
    }
  }
  return style;
};
goog.style.getStyle = function(element, property) {
  var styleValue = element.style[goog.string.toCamelCase(property)];
  if (typeof styleValue !== "undefined") {
    return styleValue;
  }
  return element.style[goog.style.getVendorJsStyleName_(element, property)] || "";
};
goog.style.getComputedStyle = function(element, property) {
  var doc = goog.dom.getOwnerDocument(element);
  if (doc.defaultView && doc.defaultView.getComputedStyle) {
    var styles = doc.defaultView.getComputedStyle(element, null);
    if (styles) {
      return styles[property] || styles.getPropertyValue(property) || "";
    }
  }
  return "";
};
goog.style.getCascadedStyle = function(element, style) {
  return element.currentStyle ? element.currentStyle[style] : null;
};
goog.style.getStyle_ = function(element, style) {
  return goog.style.getComputedStyle(element, style) || goog.style.getCascadedStyle(element, style) || element.style && element.style[style];
};
goog.style.getComputedBoxSizing = function(element) {
  return goog.style.getStyle_(element, "boxSizing") || goog.style.getStyle_(element, "MozBoxSizing") || goog.style.getStyle_(element, "WebkitBoxSizing") || null;
};
goog.style.getComputedPosition = function(element) {
  return goog.style.getStyle_(element, "position");
};
goog.style.getBackgroundColor = function(element) {
  return goog.style.getStyle_(element, "backgroundColor");
};
goog.style.getComputedOverflowX = function(element) {
  return goog.style.getStyle_(element, "overflowX");
};
goog.style.getComputedOverflowY = function(element) {
  return goog.style.getStyle_(element, "overflowY");
};
goog.style.getComputedZIndex = function(element) {
  return goog.style.getStyle_(element, "zIndex");
};
goog.style.getComputedTextAlign = function(element) {
  return goog.style.getStyle_(element, "textAlign");
};
goog.style.getComputedCursor = function(element) {
  return goog.style.getStyle_(element, "cursor");
};
goog.style.getComputedTransform = function(element) {
  var property = goog.style.getVendorStyleName_(element, "transform");
  return goog.style.getStyle_(element, property) || goog.style.getStyle_(element, "transform");
};
goog.style.setPosition = function(el, arg1, opt_arg2) {
  var x;
  var y;
  if (arg1 instanceof goog.math.Coordinate) {
    x = arg1.x;
    y = arg1.y;
  } else {
    x = arg1;
    y = opt_arg2;
  }
  el.style.left = goog.style.getPixelStyleValue_(x, false);
  el.style.top = goog.style.getPixelStyleValue_(y, false);
};
goog.style.getPosition = function(element) {
  return new goog.math.Coordinate(element.offsetLeft, element.offsetTop);
};
goog.style.getClientViewportElement = function(opt_node) {
  var doc;
  if (opt_node) {
    doc = goog.dom.getOwnerDocument(opt_node);
  } else {
    doc = goog.dom.getDocument();
  }
  if (goog.userAgent.IE && !goog.userAgent.isDocumentModeOrHigher(9) && !goog.dom.getDomHelper(doc).isCss1CompatMode()) {
    return doc.body;
  }
  return doc.documentElement;
};
goog.style.getViewportPageOffset = function(doc) {
  var body = doc.body;
  var documentElement = doc.documentElement;
  var scrollLeft = body.scrollLeft || documentElement.scrollLeft;
  var scrollTop = body.scrollTop || documentElement.scrollTop;
  return new goog.math.Coordinate(scrollLeft, scrollTop);
};
goog.style.getBoundingClientRect_ = function(el) {
  var rect;
  try {
    rect = el.getBoundingClientRect();
  } catch (e) {
    return {"left":0, "top":0, "right":0, "bottom":0};
  }
  if (goog.userAgent.IE && el.ownerDocument.body) {
    var doc = el.ownerDocument;
    rect.left -= doc.documentElement.clientLeft + doc.body.clientLeft;
    rect.top -= doc.documentElement.clientTop + doc.body.clientTop;
  }
  return rect;
};
goog.style.getOffsetParent = function(element) {
  if (goog.userAgent.IE && !goog.userAgent.isDocumentModeOrHigher(8)) {
    goog.asserts.assert(element && "offsetParent" in element);
    return element.offsetParent;
  }
  var doc = goog.dom.getOwnerDocument(element);
  var positionStyle = goog.style.getStyle_(element, "position");
  var skipStatic = positionStyle == "fixed" || positionStyle == "absolute";
  for (var parent = element.parentNode;parent && parent != doc;parent = parent.parentNode) {
    if (parent.nodeType == goog.dom.NodeType.DOCUMENT_FRAGMENT && parent.host) {
      parent = parent.host;
    }
    positionStyle = goog.style.getStyle_(parent, "position");
    skipStatic = skipStatic && positionStyle == "static" && parent != doc.documentElement && parent != doc.body;
    if (!skipStatic && (parent.scrollWidth > parent.clientWidth || parent.scrollHeight > parent.clientHeight || positionStyle == "fixed" || positionStyle == "absolute" || positionStyle == "relative")) {
      return parent;
    }
  }
  return null;
};
goog.style.getVisibleRectForElement = function(element) {
  var visibleRect = new goog.math.Box(0, Infinity, Infinity, 0);
  var dom = goog.dom.getDomHelper(element);
  var body = dom.getDocument().body;
  var documentElement = dom.getDocument().documentElement;
  var scrollEl = dom.getDocumentScrollElement();
  for (var el = element;el = goog.style.getOffsetParent(el);) {
    if ((!goog.userAgent.IE || el.clientWidth != 0) && (!goog.userAgent.WEBKIT || el.clientHeight != 0 || el != body) && (el != body && el != documentElement && goog.style.getStyle_(el, "overflow") != "visible")) {
      var pos = goog.style.getPageOffset(el);
      var client = goog.style.getClientLeftTop(el);
      pos.x += client.x;
      pos.y += client.y;
      visibleRect.top = Math.max(visibleRect.top, pos.y);
      visibleRect.right = Math.min(visibleRect.right, pos.x + el.clientWidth);
      visibleRect.bottom = Math.min(visibleRect.bottom, pos.y + el.clientHeight);
      visibleRect.left = Math.max(visibleRect.left, pos.x);
    }
  }
  var scrollX = scrollEl.scrollLeft;
  var scrollY = scrollEl.scrollTop;
  visibleRect.left = Math.max(visibleRect.left, scrollX);
  visibleRect.top = Math.max(visibleRect.top, scrollY);
  var winSize = dom.getViewportSize();
  visibleRect.right = Math.min(visibleRect.right, scrollX + winSize.width);
  visibleRect.bottom = Math.min(visibleRect.bottom, scrollY + winSize.height);
  return visibleRect.top >= 0 && visibleRect.left >= 0 && visibleRect.bottom > visibleRect.top && visibleRect.right > visibleRect.left ? visibleRect : null;
};
goog.style.getContainerOffsetToScrollInto = function(element, opt_container, opt_center) {
  var container = opt_container || goog.dom.getDocumentScrollElement();
  var elementPos = goog.style.getPageOffset(element);
  var containerPos = goog.style.getPageOffset(container);
  var containerBorder = goog.style.getBorderBox(container);
  if (container == goog.dom.getDocumentScrollElement()) {
    var relX = elementPos.x - container.scrollLeft;
    var relY = elementPos.y - container.scrollTop;
    if (goog.userAgent.IE && !goog.userAgent.isDocumentModeOrHigher(10)) {
      relX += containerBorder.left;
      relY += containerBorder.top;
    }
  } else {
    relX = elementPos.x - containerPos.x - containerBorder.left;
    relY = elementPos.y - containerPos.y - containerBorder.top;
  }
  var elementSize = goog.style.getSizeWithDisplay_(element);
  var spaceX = container.clientWidth - elementSize.width;
  var spaceY = container.clientHeight - elementSize.height;
  var scrollLeft = container.scrollLeft;
  var scrollTop = container.scrollTop;
  if (opt_center) {
    scrollLeft += relX - spaceX / 2;
    scrollTop += relY - spaceY / 2;
  } else {
    scrollLeft += Math.min(relX, Math.max(relX - spaceX, 0));
    scrollTop += Math.min(relY, Math.max(relY - spaceY, 0));
  }
  return new goog.math.Coordinate(scrollLeft, scrollTop);
};
goog.style.scrollIntoContainerView = function(element, opt_container, opt_center) {
  var container = opt_container || goog.dom.getDocumentScrollElement();
  var offset = goog.style.getContainerOffsetToScrollInto(element, container, opt_center);
  container.scrollLeft = offset.x;
  container.scrollTop = offset.y;
};
goog.style.getClientLeftTop = function(el) {
  return new goog.math.Coordinate(el.clientLeft, el.clientTop);
};
goog.style.getPageOffset = function(el) {
  var doc = goog.dom.getOwnerDocument(el);
  goog.asserts.assertObject(el, "Parameter is required");
  var pos = new goog.math.Coordinate(0, 0);
  var viewportElement = goog.style.getClientViewportElement(doc);
  if (el == viewportElement) {
    return pos;
  }
  var box = goog.style.getBoundingClientRect_(el);
  var scrollCoord = goog.dom.getDomHelper(doc).getDocumentScroll();
  pos.x = box.left + scrollCoord.x;
  pos.y = box.top + scrollCoord.y;
  return pos;
};
goog.style.getPageOffsetLeft = function(el) {
  return goog.style.getPageOffset(el).x;
};
goog.style.getPageOffsetTop = function(el) {
  return goog.style.getPageOffset(el).y;
};
goog.style.getFramedPageOffset = function(el, relativeWin) {
  var position = new goog.math.Coordinate(0, 0);
  var currentWin = goog.dom.getWindow(goog.dom.getOwnerDocument(el));
  if (!goog.reflect.canAccessProperty(currentWin, "parent")) {
    return position;
  }
  var currentEl = el;
  do {
    var offset = currentWin == relativeWin ? goog.style.getPageOffset(currentEl) : goog.style.getClientPositionForElement_(goog.asserts.assert(currentEl));
    position.x += offset.x;
    position.y += offset.y;
  } while (currentWin && currentWin != relativeWin && currentWin != currentWin.parent && (currentEl = currentWin.frameElement) && (currentWin = currentWin.parent));
  return position;
};
goog.style.translateRectForAnotherFrame = function(rect, origBase, newBase) {
  if (origBase.getDocument() != newBase.getDocument()) {
    var body = origBase.getDocument().body;
    var pos = goog.style.getFramedPageOffset(body, newBase.getWindow());
    pos = goog.math.Coordinate.difference(pos, goog.style.getPageOffset(body));
    if (goog.userAgent.IE && !goog.userAgent.isDocumentModeOrHigher(9) && !origBase.isCss1CompatMode()) {
      pos = goog.math.Coordinate.difference(pos, origBase.getDocumentScroll());
    }
    rect.left += pos.x;
    rect.top += pos.y;
  }
};
goog.style.getRelativePosition = function(a, b) {
  var ap = goog.style.getClientPosition(a);
  var bp = goog.style.getClientPosition(b);
  return new goog.math.Coordinate(ap.x - bp.x, ap.y - bp.y);
};
goog.style.getClientPositionForElement_ = function(el) {
  var box = goog.style.getBoundingClientRect_(el);
  return new goog.math.Coordinate(box.left, box.top);
};
goog.style.getClientPosition = function(el) {
  goog.asserts.assert(el);
  if (el.nodeType == goog.dom.NodeType.ELEMENT) {
    return goog.style.getClientPositionForElement_(el);
  } else {
    var targetEvent = el.changedTouches ? el.changedTouches[0] : el;
    return new goog.math.Coordinate(targetEvent.clientX, targetEvent.clientY);
  }
};
goog.style.setPageOffset = function(el, x, opt_y) {
  var cur = goog.style.getPageOffset(el);
  if (x instanceof goog.math.Coordinate) {
    opt_y = x.y;
    x = x.x;
  }
  var dx = goog.asserts.assertNumber(x) - cur.x;
  var dy = Number(opt_y) - cur.y;
  goog.style.setPosition(el, el.offsetLeft + dx, el.offsetTop + dy);
};
goog.style.setSize = function(element, w, opt_h) {
  var h;
  if (w instanceof goog.math.Size) {
    h = w.height;
    w = w.width;
  } else {
    if (opt_h == undefined) {
      throw new Error("missing height argument");
    }
    h = opt_h;
  }
  goog.style.setWidth(element, w);
  goog.style.setHeight(element, h);
};
goog.style.getPixelStyleValue_ = function(value, round) {
  if (typeof value == "number") {
    value = (round ? Math.round(value) : value) + "px";
  }
  return value;
};
goog.style.setHeight = function(element, height) {
  element.style.height = goog.style.getPixelStyleValue_(height, true);
};
goog.style.setWidth = function(element, width) {
  element.style.width = goog.style.getPixelStyleValue_(width, true);
};
goog.style.getSize = function(element) {
  return goog.style.evaluateWithTemporaryDisplay_(goog.style.getSizeWithDisplay_, element);
};
goog.style.evaluateWithTemporaryDisplay_ = function(fn, element) {
  if (goog.style.getStyle_(element, "display") != "none") {
    return fn(element);
  }
  var style = element.style;
  var originalDisplay = style.display;
  var originalVisibility = style.visibility;
  var originalPosition = style.position;
  style.visibility = "hidden";
  style.position = "absolute";
  style.display = "inline";
  var retVal = fn(element);
  style.display = originalDisplay;
  style.position = originalPosition;
  style.visibility = originalVisibility;
  return retVal;
};
goog.style.getSizeWithDisplay_ = function(element) {
  var offsetWidth = element.offsetWidth;
  var offsetHeight = element.offsetHeight;
  var webkitOffsetsZero = goog.userAgent.WEBKIT && !offsetWidth && !offsetHeight;
  if ((!goog.isDef(offsetWidth) || webkitOffsetsZero) && element.getBoundingClientRect) {
    var clientRect = goog.style.getBoundingClientRect_(element);
    return new goog.math.Size(clientRect.right - clientRect.left, clientRect.bottom - clientRect.top);
  }
  return new goog.math.Size(offsetWidth, offsetHeight);
};
goog.style.getTransformedSize = function(element) {
  if (!element.getBoundingClientRect) {
    return null;
  }
  var clientRect = goog.style.evaluateWithTemporaryDisplay_(goog.style.getBoundingClientRect_, element);
  return new goog.math.Size(clientRect.right - clientRect.left, clientRect.bottom - clientRect.top);
};
goog.style.getBounds = function(element) {
  var o = goog.style.getPageOffset(element);
  var s = goog.style.getSize(element);
  return new goog.math.Rect(o.x, o.y, s.width, s.height);
};
goog.style.toCamelCase = function(selector) {
  return goog.string.toCamelCase(String(selector));
};
goog.style.toSelectorCase = function(selector) {
  return goog.string.toSelectorCase(selector);
};
goog.style.getOpacity = function(el) {
  goog.asserts.assert(el);
  var style = el.style;
  var result = "";
  if ("opacity" in style) {
    result = style.opacity;
  } else {
    if ("MozOpacity" in style) {
      result = style.MozOpacity;
    } else {
      if ("filter" in style) {
        var match = style.filter.match(/alpha\(opacity=([\d.]+)\)/);
        if (match) {
          result = String(match[1] / 100);
        }
      }
    }
  }
  return result == "" ? result : Number(result);
};
goog.style.setOpacity = function(el, alpha) {
  goog.asserts.assert(el);
  var style = el.style;
  if ("opacity" in style) {
    style.opacity = alpha;
  } else {
    if ("MozOpacity" in style) {
      style.MozOpacity = alpha;
    } else {
      if ("filter" in style) {
        if (alpha === "") {
          style.filter = "";
        } else {
          style.filter = "alpha(opacity=" + Number(alpha) * 100 + ")";
        }
      }
    }
  }
};
goog.style.setTransparentBackgroundImage = function(el, src) {
  var style = el.style;
  if (goog.userAgent.IE && !goog.userAgent.isVersionOrHigher("8")) {
    style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(" + 'src="' + src + '", sizingMethod="crop")';
  } else {
    style.backgroundImage = "url(" + src + ")";
    style.backgroundPosition = "top left";
    style.backgroundRepeat = "no-repeat";
  }
};
goog.style.clearTransparentBackgroundImage = function(el) {
  var style = el.style;
  if ("filter" in style) {
    style.filter = "";
  } else {
    style.backgroundImage = "none";
  }
};
goog.style.showElement = function(el, display) {
  goog.style.setElementShown(el, display);
};
goog.style.setElementShown = function(el, isShown) {
  el.style.display = isShown ? "" : "none";
};
goog.style.isElementShown = function(el) {
  return el.style.display != "none";
};
goog.style.installSafeStyleSheet = function(safeStyleSheet, opt_node) {
  var dh = goog.dom.getDomHelper(opt_node);
  var doc = dh.getDocument();
  if (goog.userAgent.IE && doc.createStyleSheet) {
    var styleSheet = doc.createStyleSheet();
    goog.style.setSafeStyleSheet(styleSheet, safeStyleSheet);
    return styleSheet;
  } else {
    var head = dh.getElementsByTagNameAndClass("HEAD")[0];
    if (!head) {
      var body = dh.getElementsByTagNameAndClass("BODY")[0];
      head = dh.createDom("HEAD");
      body.parentNode.insertBefore(head, body);
    }
    var el = dh.createDom("STYLE");
    goog.style.setSafeStyleSheet(el, safeStyleSheet);
    dh.appendChild(head, el);
    return el;
  }
};
goog.style.uninstallStyles = function(styleSheet) {
  var node = styleSheet.ownerNode || styleSheet.owningElement || styleSheet;
  goog.dom.removeNode(node);
};
goog.style.setSafeStyleSheet = function(element, safeStyleSheet) {
  var stylesString = goog.html.SafeStyleSheet.unwrap(safeStyleSheet);
  if (goog.userAgent.IE && goog.isDef(element.cssText)) {
    element.cssText = stylesString;
  } else {
    element.innerHTML = stylesString;
  }
};
goog.style.setPreWrap = function(el) {
  var style = el.style;
  if (goog.userAgent.IE && !goog.userAgent.isVersionOrHigher("8")) {
    style.whiteSpace = "pre";
    style.wordWrap = "break-word";
  } else {
    if (goog.userAgent.GECKO) {
      style.whiteSpace = "-moz-pre-wrap";
    } else {
      style.whiteSpace = "pre-wrap";
    }
  }
};
goog.style.setInlineBlock = function(el) {
  var style = el.style;
  style.position = "relative";
  if (goog.userAgent.IE && !goog.userAgent.isVersionOrHigher("8")) {
    style.zoom = "1";
    style.display = "inline";
  } else {
    style.display = "inline-block";
  }
};
goog.style.isRightToLeft = function(el) {
  return "rtl" == goog.style.getStyle_(el, "direction");
};
goog.style.unselectableStyle_ = goog.userAgent.GECKO ? "MozUserSelect" : goog.userAgent.WEBKIT || goog.userAgent.EDGE ? "WebkitUserSelect" : null;
goog.style.isUnselectable = function(el) {
  if (goog.style.unselectableStyle_) {
    return el.style[goog.style.unselectableStyle_].toLowerCase() == "none";
  } else {
    if (goog.userAgent.IE || goog.userAgent.OPERA) {
      return el.getAttribute("unselectable") == "on";
    }
  }
  return false;
};
goog.style.setUnselectable = function(el, unselectable, opt_noRecurse) {
  var descendants = !opt_noRecurse ? el.getElementsByTagName("*") : null;
  var name = goog.style.unselectableStyle_;
  if (name) {
    var value = unselectable ? "none" : "";
    if (el.style) {
      el.style[name] = value;
    }
    if (descendants) {
      var i = 0;
      for (var descendant;descendant = descendants[i];i++) {
        if (descendant.style) {
          descendant.style[name] = value;
        }
      }
    }
  } else {
    if (goog.userAgent.IE || goog.userAgent.OPERA) {
      value = unselectable ? "on" : "";
      el.setAttribute("unselectable", value);
      if (descendants) {
        for (i = 0;descendant = descendants[i];i++) {
          descendant.setAttribute("unselectable", value);
        }
      }
    }
  }
};
goog.style.getBorderBoxSize = function(element) {
  return new goog.math.Size(element.offsetWidth, element.offsetHeight);
};
goog.style.setBorderBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if (goog.userAgent.IE && !goog.userAgent.isVersionOrHigher("10") && (!isCss1CompatMode || !goog.userAgent.isVersionOrHigher("8"))) {
    var style = element.style;
    if (isCss1CompatMode) {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width - borderBox.left - paddingBox.left - paddingBox.right - borderBox.right;
      style.pixelHeight = size.height - borderBox.top - paddingBox.top - paddingBox.bottom - borderBox.bottom;
    } else {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height;
    }
  } else {
    goog.style.setBoxSizingSize_(element, size, "border-box");
  }
};
goog.style.getContentBoxSize = function(element) {
  var doc = goog.dom.getOwnerDocument(element);
  var ieCurrentStyle = goog.userAgent.IE && element.currentStyle;
  if (ieCurrentStyle && goog.dom.getDomHelper(doc).isCss1CompatMode() && ieCurrentStyle.width != "auto" && ieCurrentStyle.height != "auto" && !ieCurrentStyle.boxSizing) {
    var width = goog.style.getIePixelValue_(element, ieCurrentStyle.width, "width", "pixelWidth");
    var height = goog.style.getIePixelValue_(element, ieCurrentStyle.height, "height", "pixelHeight");
    return new goog.math.Size(width, height);
  } else {
    var borderBoxSize = goog.style.getBorderBoxSize(element);
    var paddingBox = goog.style.getPaddingBox(element);
    var borderBox = goog.style.getBorderBox(element);
    return new goog.math.Size(borderBoxSize.width - borderBox.left - paddingBox.left - paddingBox.right - borderBox.right, borderBoxSize.height - borderBox.top - paddingBox.top - paddingBox.bottom - borderBox.bottom);
  }
};
goog.style.setContentBoxSize = function(element, size) {
  var doc = goog.dom.getOwnerDocument(element);
  var isCss1CompatMode = goog.dom.getDomHelper(doc).isCss1CompatMode();
  if (goog.userAgent.IE && !goog.userAgent.isVersionOrHigher("10") && (!isCss1CompatMode || !goog.userAgent.isVersionOrHigher("8"))) {
    var style = element.style;
    if (isCss1CompatMode) {
      style.pixelWidth = size.width;
      style.pixelHeight = size.height;
    } else {
      var paddingBox = goog.style.getPaddingBox(element);
      var borderBox = goog.style.getBorderBox(element);
      style.pixelWidth = size.width + borderBox.left + paddingBox.left + paddingBox.right + borderBox.right;
      style.pixelHeight = size.height + borderBox.top + paddingBox.top + paddingBox.bottom + borderBox.bottom;
    }
  } else {
    goog.style.setBoxSizingSize_(element, size, "content-box");
  }
};
goog.style.setBoxSizingSize_ = function(element, size, boxSizing) {
  var style = element.style;
  if (goog.userAgent.GECKO) {
    style.MozBoxSizing = boxSizing;
  } else {
    if (goog.userAgent.WEBKIT) {
      style.WebkitBoxSizing = boxSizing;
    } else {
      style.boxSizing = boxSizing;
    }
  }
  style.width = Math.max(size.width, 0) + "px";
  style.height = Math.max(size.height, 0) + "px";
};
goog.style.getIePixelValue_ = function(element, value, name, pixelName) {
  if (/^\d+px?$/.test(value)) {
    return parseInt(value, 10);
  } else {
    var oldStyleValue = element.style[name];
    var oldRuntimeValue = element.runtimeStyle[name];
    element.runtimeStyle[name] = element.currentStyle[name];
    element.style[name] = value;
    var pixelValue = element.style[pixelName];
    element.style[name] = oldStyleValue;
    element.runtimeStyle[name] = oldRuntimeValue;
    return +pixelValue;
  }
};
goog.style.getIePixelDistance_ = function(element, propName) {
  var value = goog.style.getCascadedStyle(element, propName);
  return value ? goog.style.getIePixelValue_(element, value, "left", "pixelLeft") : 0;
};
goog.style.getBox_ = function(element, stylePrefix) {
  if (goog.userAgent.IE) {
    var left = goog.style.getIePixelDistance_(element, stylePrefix + "Left");
    var right = goog.style.getIePixelDistance_(element, stylePrefix + "Right");
    var top = goog.style.getIePixelDistance_(element, stylePrefix + "Top");
    var bottom = goog.style.getIePixelDistance_(element, stylePrefix + "Bottom");
    return new goog.math.Box(top, right, bottom, left);
  } else {
    left = goog.style.getComputedStyle(element, stylePrefix + "Left");
    right = goog.style.getComputedStyle(element, stylePrefix + "Right");
    top = goog.style.getComputedStyle(element, stylePrefix + "Top");
    bottom = goog.style.getComputedStyle(element, stylePrefix + "Bottom");
    return new goog.math.Box(parseFloat(top), parseFloat(right), parseFloat(bottom), parseFloat(left));
  }
};
goog.style.getPaddingBox = function(element) {
  return goog.style.getBox_(element, "padding");
};
goog.style.getMarginBox = function(element) {
  return goog.style.getBox_(element, "margin");
};
goog.style.ieBorderWidthKeywords_ = {"thin":2, "medium":4, "thick":6};
goog.style.getIePixelBorder_ = function(element, prop) {
  if (goog.style.getCascadedStyle(element, prop + "Style") == "none") {
    return 0;
  }
  var width = goog.style.getCascadedStyle(element, prop + "Width");
  if (width in goog.style.ieBorderWidthKeywords_) {
    return goog.style.ieBorderWidthKeywords_[width];
  }
  return goog.style.getIePixelValue_(element, width, "left", "pixelLeft");
};
goog.style.getBorderBox = function(element) {
  if (goog.userAgent.IE && !goog.userAgent.isDocumentModeOrHigher(9)) {
    var left = goog.style.getIePixelBorder_(element, "borderLeft");
    var right = goog.style.getIePixelBorder_(element, "borderRight");
    var top = goog.style.getIePixelBorder_(element, "borderTop");
    var bottom = goog.style.getIePixelBorder_(element, "borderBottom");
    return new goog.math.Box(top, right, bottom, left);
  } else {
    left = goog.style.getComputedStyle(element, "borderLeftWidth");
    right = goog.style.getComputedStyle(element, "borderRightWidth");
    top = goog.style.getComputedStyle(element, "borderTopWidth");
    bottom = goog.style.getComputedStyle(element, "borderBottomWidth");
    return new goog.math.Box(parseFloat(top), parseFloat(right), parseFloat(bottom), parseFloat(left));
  }
};
goog.style.getFontFamily = function(el) {
  var doc = goog.dom.getOwnerDocument(el);
  var font = "";
  if (doc.body.createTextRange && goog.dom.contains(doc, el)) {
    var range = doc.body.createTextRange();
    range.moveToElementText(el);
    try {
      font = range.queryCommandValue("FontName");
    } catch (e) {
      font = "";
    }
  }
  if (!font) {
    font = goog.style.getStyle_(el, "fontFamily");
  }
  var fontsArray = font.split(",");
  if (fontsArray.length > 1) {
    font = fontsArray[0];
  }
  return goog.string.stripQuotes(font, "\"'");
};
goog.style.lengthUnitRegex_ = /[^\d]+$/;
goog.style.getLengthUnits = function(value) {
  var units = value.match(goog.style.lengthUnitRegex_);
  return units && units[0] || null;
};
goog.style.ABSOLUTE_CSS_LENGTH_UNITS_ = {"cm":1, "in":1, "mm":1, "pc":1, "pt":1};
goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_ = {"em":1, "ex":1};
goog.style.getFontSize = function(el) {
  var fontSize = goog.style.getStyle_(el, "fontSize");
  var sizeUnits = goog.style.getLengthUnits(fontSize);
  if (fontSize && "px" == sizeUnits) {
    return parseInt(fontSize, 10);
  }
  if (goog.userAgent.IE) {
    if (String(sizeUnits) in goog.style.ABSOLUTE_CSS_LENGTH_UNITS_) {
      return goog.style.getIePixelValue_(el, fontSize, "left", "pixelLeft");
    } else {
      if (el.parentNode && el.parentNode.nodeType == goog.dom.NodeType.ELEMENT && String(sizeUnits) in goog.style.CONVERTIBLE_RELATIVE_CSS_UNITS_) {
        var parentElement = el.parentNode;
        var parentSize = goog.style.getStyle_(parentElement, "fontSize");
        return goog.style.getIePixelValue_(parentElement, fontSize == parentSize ? "1em" : fontSize, "left", "pixelLeft");
      }
    }
  }
  var sizeElement = goog.dom.createDom("SPAN", {"style":"visibility:hidden;position:absolute;" + "line-height:0;padding:0;margin:0;border:0;height:1em;"});
  goog.dom.appendChild(el, sizeElement);
  fontSize = sizeElement.offsetHeight;
  goog.dom.removeNode(sizeElement);
  return fontSize;
};
goog.style.parseStyleAttribute = function(value) {
  var result = {};
  goog.array.forEach(value.split(/\s*;\s*/), function(pair) {
    var keyValue = pair.match(/\s*([\w-]+)\s*\:(.+)/);
    if (keyValue) {
      var styleName = keyValue[1];
      var styleValue = goog.string.trim(keyValue[2]);
      result[goog.string.toCamelCase(styleName.toLowerCase())] = styleValue;
    }
  });
  return result;
};
goog.style.toStyleAttribute = function(obj) {
  var buffer = [];
  goog.object.forEach(obj, function(value, key) {
    buffer.push(goog.string.toSelectorCase(key), ":", value, ";");
  });
  return buffer.join("");
};
goog.style.setFloat = function(el, value) {
  el.style[goog.userAgent.IE ? "styleFloat" : "cssFloat"] = value;
};
goog.style.getFloat = function(el) {
  return el.style[goog.userAgent.IE ? "styleFloat" : "cssFloat"] || "";
};
goog.style.getScrollbarWidth = function(opt_className) {
  var outerDiv = goog.dom.createElement("DIV");
  if (opt_className) {
    outerDiv.className = opt_className;
  }
  outerDiv.style.cssText = "overflow:auto;" + "position:absolute;top:0;width:100px;height:100px";
  var innerDiv = goog.dom.createElement("DIV");
  goog.style.setSize(innerDiv, "200px", "200px");
  outerDiv.appendChild(innerDiv);
  goog.dom.appendChild(goog.dom.getDocument().body, outerDiv);
  var width = outerDiv.offsetWidth - outerDiv.clientWidth;
  goog.dom.removeNode(outerDiv);
  return width;
};
goog.style.MATRIX_TRANSLATION_REGEX_ = new RegExp("matrix\\([0-9\\.\\-]+, [0-9\\.\\-]+, " + "[0-9\\.\\-]+, [0-9\\.\\-]+, " + "([0-9\\.\\-]+)p?x?, ([0-9\\.\\-]+)p?x?\\)");
goog.style.getCssTranslation = function(element) {
  var transform = goog.style.getComputedTransform(element);
  if (!transform) {
    return new goog.math.Coordinate(0, 0);
  }
  var matches = transform.match(goog.style.MATRIX_TRANSLATION_REGEX_);
  if (!matches) {
    return new goog.math.Coordinate(0, 0);
  }
  return new goog.math.Coordinate(parseFloat(matches[1]), parseFloat(matches[2]));
};
function replaceTexWithMathJaxInGraphVizObjects$$module$test() {
  GraphVizObject$$module$test.find().forEach(function(gvo) {
    return gvo.replaceTextWithMaxJax();
  });
}
window.onload = replaceTexWithMathJaxInGraphVizObjects$$module$test;
var GraphVizObject$$module$test = function(objectEl) {
  this._objectEl = objectEl;
};
GraphVizObject$$module$test.find = function() {
  return toArray$$module$test(document.getElementsByClassName("graphviz")).filter(function(el) {
    return el.tagName == "OBJECT";
  }).map(function(el) {
    return new GraphVizObject$$module$test(el);
  });
};
GraphVizObject$$module$test.prototype.replaceTextWithMaxJax = function() {
  var $jscomp$this = this;
  this._addMathJaxContainer().then(function() {
    findTexElements$$module$test($jscomp$this._objectEl.contentDocument).forEach(function(texEl) {
      var tex = texEl.textContent.replace(/^\$(.*)\$$/, "$1");
      createMathJaxElement$$module$test(tex).then(function(mathJaxEl) {
        $jscomp$this._replaceTextElementWithMathJaxElement(texEl, mathJaxEl);
      });
    });
  });
};
GraphVizObject$$module$test.prototype._addMathJaxContainer = function() {
  var $jscomp$this = this;
  var mathJaxContainer = document.createElement("div");
  mathJaxContainer.setAttribute("class", "__graphviz_svg__");
  mathJaxContainer.style.position = "relative";
  var objectSize = goog.style.getSize(this._objectEl);
  mathJaxContainer.style.width = objectSize.width + "px";
  mathJaxContainer.style.height = objectSize.height + "px";
  this._objectEl.insertAdjacentElement("beforebegin", mathJaxContainer);
  mathJaxContainer.appendChild(this._objectEl);
  return (new Promise(function(resolve, reject) {
    window.setTimeout(resolve, 1000);
  })).then(function() {
    $jscomp$this._mathJaxContainer = mathJaxContainer;
  });
};
GraphVizObject$$module$test.prototype._replaceTextElementWithMathJaxElement = function(texEl, mathJaxEl) {
  var texElPos = goog.style.getRelativePosition(texEl, this._objectEl.contentDocument.firstChild);
  var texElSize = goog.style.getSize(texEl);
  this._mathJaxContainer.insertAdjacentElement("beforeend", mathJaxEl);
  mathJaxEl.style.position = "absolute";
  var x = texElPos.x + texElSize.width / 2;
  var y = texElPos.y;
  var mathJaxContainerSize = goog.style.getSize(this._mathJaxContainer);
  mathJaxEl.style.left = 100 * x / mathJaxContainerSize.width + "%";
  mathJaxEl.style.top = 100 * y / mathJaxContainerSize.height + "%";
  mathJaxEl.style.fontSize = texElSize.height + "px";
  texEl.parentNode.removeChild(texEl);
};
function findTexElements$$module$test(docEl) {
  return toArray$$module$test(docEl.getElementsByTagName("text")).filter(function(textEl) {
    return textEl.textContent.match(_TEX_RE$$module$test);
  });
}
var _TEX_RE$$module$test = /^\s*([LlRrCc]?)(\\\(.*\\\)|\$.*\$)\s*$/;
function createMathJaxElement$$module$test(tex) {
  assert$$module$test(!tex.startsWith("$"));
  assert$$module$test(!tex.endsWith("$"));
  assert$$module$test(!tex.startsWith("\\("));
  assert$$module$test(!tex.endsWith("\\)"));
  var texEl = document.createElement("div");
  texEl.appendChild(document.createTextNode("\\(" + tex + "\\)"));
  var $jscomp$destructuring$var0 = $jscomp.makeIterator(Promises$$module$test.createWithResolver());
  var mathJaxEl = $jscomp$destructuring$var0.next().value;
  var mathJaxElResolver = $jscomp$destructuring$var0.next().value;
  MathJax.Hub.Queue(["Typeset", MathJax.Hub, texEl, function() {
    mathJaxElResolver.resolve(texEl);
  }]);
  return mathJaxEl;
}
var Elements$$module$test = function() {
};
Elements$$module$test.getOnlyElementByTagName = function(el, tagName) {
  var els = el.getElementsByTagName(tagName);
  assert$$module$test(els.length == 1);
  return els[0];
};
var Promises$$module$test = function() {
};
Promises$$module$test.createWithResolver = function() {
  var resolver = {};
  var promise = new Promise(function(resolve, reject) {
    resolver.resolve = resolve;
    resolver.reject = reject;
  });
  return [promise, resolver];
};
function assert$$module$test(condition) {
  if (!condition) {
    throw Error();
  }
}
function toArray$$module$test(arrayLike) {
  return Array.prototype.slice.call(arrayLike);
}
;
