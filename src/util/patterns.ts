import { LayoutPattern } from "../settings/categories/LayoutSettings";

export interface Vec3 {
	x: number;
	y: number;
	z: number;
}

// Golden angle (radians) — drives even, non-overlapping spiral distributions.
const GA = Math.PI * (3 - Math.sqrt(5));

// Base size of a pattern given the node count, so shapes fill a comparable
// volume regardless of vault size. Tuned against the force layout's spread.
export function patternRadius(count: number, scale: number): number {
	return 32 * Math.cbrt(Math.max(count, 1)) * scale;
}

// Deterministic position for node `i` of `count` within the chosen pattern.
// `radius` should come from patternRadius(). Returns world coordinates.
export function computePatternPosition(
	pattern: LayoutPattern,
	i: number,
	count: number,
	radius: number
): Vec3 {
	const n = Math.max(count, 1);

	switch (pattern) {
		case "sphere": {
			// Fibonacci sphere — evenly spaced points on a globe.
			const y = n === 1 ? 0 : 1 - (i / (n - 1)) * 2; // 1 → -1
			const rad = Math.sqrt(Math.max(0, 1 - y * y));
			const theta = GA * i;
			return {
				x: Math.cos(theta) * rad * radius,
				y: y * radius,
				z: Math.sin(theta) * rad * radius,
			};
		}

		case "spiral": {
			// Vertical helix, ~6 turns from bottom to top.
			const turns = 6;
			const t = i / n;
			const angle = t * turns * Math.PI * 2;
			const tube = radius * 0.6;
			return {
				x: Math.cos(angle) * tube,
				y: (t - 0.5) * radius * 2,
				z: Math.sin(angle) * tube,
			};
		}

		case "sunflower": {
			// Phyllotaxis disc on the XZ plane (flat, y = 0).
			const r = radius * Math.sqrt(i / n);
			const theta = GA * i;
			return {
				x: Math.cos(theta) * r,
				y: 0,
				z: Math.sin(theta) * r,
			};
		}

		case "flower": {
			// Flower of Life: concentric hexagonal rings (ring k holds 6k points)
			// on the XY plane — the triangular packing behind the sacred-geometry
			// figure. Spacing keeps neighbouring nodes roughly equidistant.
			const { ring, indexInRing } = hexRingOf(i);
			const spacing = radius / Math.max(totalHexRings(n), 1);
			if (ring === 0) return { x: 0, y: 0, z: 0 };
			const pointsInRing = 6 * ring;
			const angle = (indexInRing / pointsInRing) * Math.PI * 2;
			const rr = ring * spacing;
			return {
				x: Math.cos(angle) * rr,
				y: Math.sin(angle) * rr,
				z: 0,
			};
		}

		case "grid": {
			// Centered cube lattice.
			const side = Math.max(1, Math.ceil(Math.cbrt(n)));
			const ix = i % side;
			const iy = Math.floor(i / side) % side;
			const iz = Math.floor(i / (side * side));
			const step = (radius * 2) / side;
			const off = (side - 1) / 2;
			return {
				x: (ix - off) * step,
				y: (iy - off) * step,
				z: (iz - off) * step,
			};
		}

		case "torus": {
			// Major ring distributed evenly; minor (tube) angle by golden angle.
			const R = radius;
			const r = radius * 0.4;
			const major = (i / n) * Math.PI * 2;
			const minor = GA * i;
			return {
				x: (R + r * Math.cos(minor)) * Math.cos(major),
				y: r * Math.sin(minor),
				z: (R + r * Math.cos(minor)) * Math.sin(major),
			};
		}

		default:
			return { x: 0, y: 0, z: 0 };
	}
}

// Maps a flat index to its concentric hex ring:
// ring 0 = 1 point, ring k = 6k points.
function hexRingOf(i: number): { ring: number; indexInRing: number } {
	let ring = 0;
	let start = 0;
	// ring 0 holds 1, ring k (k>=1) holds 6k
	// eslint-disable-next-line no-constant-condition
	while (true) {
		const size = ring === 0 ? 1 : 6 * ring;
		if (i < start + size) {
			return { ring, indexInRing: i - start };
		}
		start += size;
		ring++;
	}
}

// Number of hex rings needed to hold `count` points (used to scale spacing so
// the whole flower fits the target radius).
function totalHexRings(count: number): number {
	let ring = 0;
	let total = 0;
	while (total < count) {
		total += ring === 0 ? 1 : 6 * ring;
		ring++;
	}
	return Math.max(ring, 1);
}
