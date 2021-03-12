
import Classes from '/zuzia/v0.2/__packages__/base/classes.mjs';

const {describe, it} = window.Mocha;
const chai = window.chai;


describe('Classes', function () {

  class Base {
    f() { return 'Base'; }
  };
  class Derived extends Base {
    f() { return super.f() + 'Derived'; }
  };

  it('isSubclass', function () {
    chai.assert(Classes.isSubclass(Derived, Base));
    chai.assert(!Classes.isSubclass(Base, Derived));
    chai.assert(!Classes.isSubclass(Base, Base));
    chai.assert(!Classes.isSubclass(Derived, Derived));
  });

  it('getBaseClass', function () {
    assertIs(Classes.getBaseClass(Derived), Base);
    chai.assert.isNull(Classes.getBaseClass(Base));
  });

  it('withBaseClass', function () {
    const Derived2 = Classes.withBaseClass(class Derived2 {
      f() { return super.f() + 'Derived2'; }
    }, Base);
    assertIs(Classes.getBaseClass(Derived2), Base);
    chai.assert.equal(Derived2.name, 'Derived2');
    chai.assert.isNull(Classes.getBaseClass(Base));
    chai.assert.equal((new Derived2).f(), 'BaseDerived2');
    chai.assert.equal((new Base).f(), 'Base');
    // TODO: test throws
    // Classes.withBaseClass(Derived, Base);
  });

  function assertIs(a, b) {
    chai.assert(Object.is(a, b));
  }
});
