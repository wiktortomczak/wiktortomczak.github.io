
protoService.test.Root = class Root extends ProtoService.ObjectView {

  /**
   * @return {!number=}
   */
  get i() {}

  /**
   * @return {!ProtoService.ArrayView<!number>}
   */
  get li() {}
  
  /**
   * @return {!protoService.test.Root=}
   */
  get m() {}

  /**
   * @return {!ProtoService.ArrayView<!protoService.test.Root>}
   */
  get li() {}

  /**
   * @return {!ProtoService.MapView<!string, !number>}
   */
  get mi() {}

  /**
   * @return {!ProtoService.MapView<!string, !protoService.test.Root>}
   */
  get mm() {}
};




class ArrayView {
}


class MapView {
}
