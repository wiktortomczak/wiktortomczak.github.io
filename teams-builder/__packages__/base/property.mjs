
import assert from 'base/assert.mjs';
import Arrays from 'base/arrays.mjs';
import ChangeEmitter from 'base/change-emitter.mjs';
import {getArgumentNames} from 'base/inspect.mjs';
import Objects from 'base/objects.mjs';
import Types from 'base/types.mjs';


export function Properties(data, dataToDerive) {
  return new ContainerProperty(null, data, dataToDerive);
}


export default class Property extends ChangeEmitter {

  static Create(parent, data, property) {
    if (Types.isDefined(property)) {
      if (Types.isObject(data[property])) {
        return new ContainerProperty(parent, data[property]);
      } else {
        assert(Types.isScalar(data[property]));
        return new ScalarProperty(parent, property);
      }
    } else {
      assert(Types.isObject(data));
      return new ContainerProperty(parent, data);
    }
  }

  constructor(parent) {
    super();
    this._parent = parent;
  }

  get() {
    throw Error('abstract method');
  }

  set(value) {
    throw Error('abstract method');
  }

  get setBind() {
    return this.set.bind(this);
  }

  _emitChange() {
    for (const callback of this._changeCallbacks) {
      callback();
    }
    if (this._parent) {
      this._parent._emitChange();
    }
  }
}



class ContainerProperty extends Property {

  constructor(parent, data, dataToDerive) {
    super(parent);
    this._data = data;
    this._properties = {};
    this._derivedData = Object.entries(dataToDerive || {}).map(
      ([propertyName, func]) => this._createDerivedData(propertyName, func));

    return new Proxy(this, {
      get: function(target, property) {
        if (property == 'get' ||
            property == 'set' ||
            property == 'setBind' ||
            property == 'onChange') {
          return target[property].bind(target);
        } else {
          return target.getOrCreateProperty(property);
        }
      }
    });
  }

  get() { return this._data; }

  set(data) {
    if (!Types.isArray(this._data)) {
      for (const [name, value] of Object.entries(data)) {
        this._setPropertyValue(name, value);
      }
    } else {  // Array.
      assert(Objects.isEmpty(this._properties));
      Arrays.set(this._data, data);
    }
    this._emitChange();
  }

  getOrCreateProperty(property) {
    if (!this._properties[property]) {
      this._properties[property] = Property.Create(this, this._data, property);
    }
    return this._properties[property];
  }

  _setPropertyValue(name, value) {
    const property = this._properties[name];
    property ? property.set(value) : this._data[name] = value;
  }

  _createDerivedData(propertyName, func) {
    const containerProperty = this;
    const property = {
      func,
      sourceProperties: (
        getArgumentNames(func).map(p => this.getOrCreateProperty(p))),
      update: function() {
        const value = this.func(...this.sourceProperties.map(p => p.get()));
        containerProperty._setPropertyValue(propertyName, value);
      }
    };
    property.update();
    for (const sourceProperty of property.sourceProperties) {
      sourceProperty.onChange(() => property.update());
    }
    return property;
  }
}

class ScalarProperty extends Property {

  constructor(parent, property) {
    super(parent);
    this._property = property;
  }

  get() {
    return this._parent._data[this._property];
  }

  set(value) {
    this._parent._data[this._property] = value;
    this._emitChange();
  }
}
