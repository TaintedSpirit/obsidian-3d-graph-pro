// Ambient declaration for `three`. The pinned three version ships no bundled
// TypeScript types and @types/three is not a dependency, so we type the module
// as `any` to satisfy `noImplicitAny` without pulling exact version-matched typings.
declare module "three";

// d3-force-3d ships no TypeScript types; type as `any` so the 3D positioning
// forces (forceX/forceY/forceZ) can be imported under noImplicitAny.
declare module "d3-force-3d";
