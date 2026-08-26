import * as X from "./XX.ts";

/** */
export const VisibilityKind = {
	exempt: X.tokenGroups.words.exempt,
	extend: X.tokenGroups.words.extend,
	expose: X.tokenGroups.words.expose,
	export: X.tokenGroups.words.export,
} as const;
export type VisibilityKind = (typeof VisibilityKind)[keyof typeof VisibilityKind];

/** */
export const AssignerKind = { ...X.tokenGroups.assigners } as const;
export type AssignerKind = (typeof AssignerKind)[keyof typeof AssignerKind];

/** */
export const RangeKind = {
	to: X.tokenGroups.words.to,
	til: X.tokenGroups.words.til,
} as const;
export type RangeKind = (typeof RangeKind)[keyof typeof RangeKind];

/** */
export const ComparisonKind = {
	equality: X.tokenGroups.operators.sealed.equality,
	inequality: X.tokenGroups.operators.sealed.inequality,
	gt: X.tokenGroups.operators.overloadable.gt,
	gte: X.tokenGroups.operators.overloadable.gte,
	lt: X.tokenGroups.operators.overloadable.lt,
	lte: X.tokenGroups.operators.overloadable.lte,
} as const;
export type ComparisonKind = (typeof ComparisonKind)[keyof typeof ComparisonKind];

/** */
export const AttestationKind = {
	is: X.tokenGroups.words.is,
	isnot: X.tokenGroups.words.isnot,
} as const;
export type AttestationKind = (typeof AttestationKind)[keyof typeof AttestationKind];

/** */
export const InfixOperatorKind = {
	...X.tokenGroups.operators.sealed,
	...X.tokenGroups.operators.overloadable,
} as const;
export type InfixOperatorKind = (typeof InfixOperatorKind)[keyof typeof InfixOperatorKind];

/** Atomic fixed-token types accepted in unions and ordinary annotations. */
export const PrimitiveTypeKind = {
	...X.tokenGroups.primitives.ints,
	...X.tokenGroups.primitives.uints,
	...X.tokenGroups.primitives.floats,
	...X.tokenGroups.primitives.bigs,
	...X.tokenGroups.primitives.others,
} as const;
export type PrimitiveTypeKind = (typeof PrimitiveTypeKind)[keyof typeof PrimitiveTypeKind];

/** Atomic fixed-token types accepted in unions and ordinary annotations. */
export const BasicTypeKind = {
	...PrimitiveTypeKind,
	...X.tokenGroups.constants,
} as const;
export type BasicTypeKind = (typeof BasicTypeKind)[keyof typeof BasicTypeKind];

//# Statement prefixes

/** */
export const BreakKind = X.tokenGroups.breaks;
export type BreakKind = (typeof BreakKind)[keyof typeof BreakKind];

/** */
export const ContinueKind = X.tokenGroups.continues;
export type ContinueKind = (typeof ContinueKind)[keyof typeof ContinueKind];

/** */
export const YieldKind = X.tokenGroups.yields;
export type YieldKind = (typeof YieldKind)[keyof typeof YieldKind];

//# Worker related

/** */
export const WorkerPriorityKind = {
	high: "high",
	mid: "mid",
	low: "low",
} as const;
export type WorkerPriorityKind = (typeof WorkerPriorityKind)[keyof typeof WorkerPriorityKind];

/** */
export const WorkerCoreKind = {
	performance: "performance",
	efficiency: "efficiency",
} as const;
export type WorkerCoreKind = (typeof WorkerCoreKind)[keyof typeof WorkerCoreKind];
