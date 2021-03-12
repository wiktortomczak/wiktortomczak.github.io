/**
 * @fileoverview Class-related functions.
 */

import assert from '/zuzia/v0.2/__packages__/base/assert.mjs';
import Objects from '/zuzia/v0.2/__packages__/base/objects.mjs';


/** Class-related functions. */
export default class Classes {

  /**
   * Creates a class dynamically.
   *
   * @param {!string} name Created class name.
   * @param {!Class=} opt_baseClass Base class. Optional.
   * @param {!Object<!string, ?>} prototypeProperties
   *   To add to subclass' prototype. Methods, etc.
   * @param {!Object<!string, ?>} classProperties
   *   To add to subclass' object. Static methods, etc.
   * @return {!Class}
   */
  static createClass(name, opt_baseClass, prototypeProperties, classProperties) {
    assert(!prototypeProperties.hasOwnProperty('constructor'));
    assert(!classProperties.hasOwnProperty('prototype'));

    const baseClass = opt_baseClass || Object;  // Needed for closure compiler.
    const class_ = class extends baseClass {};
    this.setClassName(class_, name);
    Objects.copyOwnProperties(prototypeProperties, class_.prototype);
    Objects.copyOwnProperties(classProperties, class_);
    return class_;
  }

  // static createDerivedClass(baseClass, derivingClass) {
  //   class extends baseClass
  // }

  /**
   * Mixes given class with a given mixin class: mixes into baseClass the
   * prototype of mixin's base classes, if any, excluding {@code Object},
   * and of mixin itself.
   *
   * @param {!Class} baseClass
   * @param {!Array<!Class>} mixinClasses Can not have a constructor.
   * @return {!Class} A new class that is a subclass of baseClass and whose
   *  prototype contains all prototypes along mixinClass inheritance chain.
   *  mixinClass overrides baseClass in case the two prototypes overlap
   *  (same method/attribute/etc. names).
   */
  // TODO
  static mix(baseClass, ...mixinClasses) {
    const baseWithMixins = class extends baseClass {};
    this.setClassName(baseWithMixins, (
      [baseClass].concat(mixinClasses).map(c => c.name).join('+')));
    mixinClasses.forEach(mixinClass => {
      this.getBaseClassChain(mixinClass).reverse().forEach(class_ => {
        // TODO: Assert that class_ does not have a non-default constructor.
        Objects.copyOwnProperties(
          class_.prototype, baseWithMixins.prototype, 'constructor');
        Objects.copyOwnProperties(
          class_, baseWithMixins, 'prototype');
      });
    });
    return baseWithMixins;
  }

  
  static isSubclass(maybeDerivedClass, baseClass) {
    // stackoverflow.com/a/18939541/2131969
    return maybeDerivedClass.prototype instanceof baseClass;
  }

  static hasBaseClass(class_) {
    return !!this.getBaseClass(class_);
  }

  /**
   * Returns base class of given class
   * or {@code null} if no explicit base class.
   *
   * @param {!Class} class
   * @return {!Class}  TODO: opt null annotation 
   */
  static getBaseClass(class_) {
    // stackoverflow.com/a/31653687/2131969
    const baseClass = Object.getPrototypeOf(class_);
    return !Object.is(baseClass, _ROOT_BASE_CLASS) ? baseClass : null;
  }

  /**
   * Returns the class and its preceding base classes, in order of inheritance,
   * excluding the root base class.
   *
   * @param {!Class} class
   * @return {!Array<!Class>}
   */
  static getBaseClassChain(class_) {
    const baseClassChain = [];
    while (class_) {
      baseClassChain.push(class_);
      class_ = this.getBaseClass(class_);
    }
    return baseClassChain;
  }

  /**
   * Creates a copy of given class that additionally derives from
   * a given base class.
   *
   * @param {!Class} class_ Class to copy.
   * @param {!Class} baseClass
   */
  static withBaseClass(class_, baseClass) {
    assert(!this.hasBaseClass(class_));
    const classWithBase = this.copyClass(class_);
    classWithBase.prototype = Object.create(baseClass.prototype);
    Objects.copyOwnProperties(
      class_.prototype, classWithBase.prototype, 'constructor');
    Object.defineProperty(classWithBase.prototype, 'constructor', {
      value: classWithBase, enumerable: false, writable: true});
    return classWithBase;
  }

  static copyClass(class_) {
    // Clone class_ constructor function.
    // stackoverflow.com/a/6772648/2131969
    const classCopy = class_.bind({});
    classCopy.prototype = {};
    Objects.copyOwnProperties(
      class_.prototype, classCopy.prototype, 'constructor');
    Objects.copyOwnProperties(class_, classCopy, 'prototype');
    Object.defineProperty(classCopy.prototype, 'constructor', {
      value: classCopy, enumerable: false, writable: true});
    this.setClassName(classCopy, class_.name);
    return classCopy;
  }

  /**
   * Sets class name.
   *
   * @param {!Class} class_
   * @param {!string} name
   */
  static setClassName(class_, name) {
    Object.defineProperty(class_, 'name', {value: name, writable: true});
  }
};

const _ROOT_BASE_CLASS = Object.getPrototypeOf(class {});
