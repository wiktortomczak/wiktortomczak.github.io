/**
 * @fileoverview Class-related functions.
 */

import assert from '/zuzia/v0.1/__packages__/base/assert.mjs';
import Objects from '/zuzia/v0.1/__packages__/base/objects.mjs';


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

  
  static isSubclass(base, maybeDerived) {
    // https://stackoverflow.com/a/18939541/2131969
    return maybeDerived.prototype instanceof base;
  }

  /**
   * Returns base class of given class.
   *
   * @param {!Class} class
   * @return {!Class}
   */
  static getBaseClass(class_) {
    return Object.getPrototypeOf(class_.prototype).constructor;
  }

  /**
   * Returns the class and its subsequent base classes, in order of inheritance,
   * excluding the final {@code Object} class.
   *
   * @param {!Class} class
   * @return {!Array<!Class>}
   */
  static getBaseClassChain(class_) {
    const baseClassChain = [];
    while (!Object.is(class_, Object)) {
      baseClassChain.push(class_);
      class_ = this.getBaseClass(class_);
    }
    return baseClassChain;
  }

  /**
   * Sets base class of given class to given class.
   *
   * @param {!Class} class_ Class to set the base class of.
   * @param {!Class} baseClass
   */
  static setBaseClass(class_, baseClass) {
    // Make sure that class_ does not have an existing base class.
    assert(Object.is(this.getBaseClass(class_), Object));
    class_.prototype = Objects.copyOwnProperties(
      class_.prototype, Object.create(baseClass.prototype));
    class_.prototype.constructor = class_;
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
