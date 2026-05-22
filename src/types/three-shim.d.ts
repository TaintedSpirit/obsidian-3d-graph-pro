// Ambient declaration for `three`. The pinned three version ships no bundled
// TypeScript types and @types/three is not a dependency, so we type the module
// as `any` to satisfy `noImplicitAny` without pulling exact version-matched typings.
declare module "three";
