/** upng-js ships without types. This describes the small part the worker uses. */
declare module 'upng-js' {
  interface Image {
    width: number;
    height: number;
  }
  const UPNG: {
    decode(buffer: ArrayBuffer): Image;
    encode(frames: ArrayBuffer[], width: number, height: number, colours: number): ArrayBuffer;
    toRGBA8(image: Image): ArrayBuffer[];
  };
  export default UPNG;
}
