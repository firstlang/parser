import * as X from "./XX.ts";

export type ParameterMasks = X.Sum<typeof ParameterMasks>;
export const ParameterMasks = X.sum(
	X.ConstrainedTypeParameterMask,
	X.TypeParameterMask,
	X.TypedParameterMask,
	X.TypedDefaultParameterMask,
	X.TypedOptionalParameterMask,
	X.RestParameterMask,
	X.DefaultParameterMask,
);

/** Type forms that can be combined linearly with `or` or `and`. */
export type TypeOperandMasks = X.Sum<typeof TypeOperandMasks>;
export const TypeOperandMasks: readonly [
	typeof X.EditableArrayTypeExpressionMask,
	typeof X.EditableTypeExpressionMask,
	typeof X.ArrayTypeExpressionMask,
	typeof X.GenericTypeExpressionMask,
	typeof X.TypeExpressionMask,
] = X.sum(
	X.EditableArrayTypeExpressionMask,
	X.EditableTypeExpressionMask,
	X.ArrayTypeExpressionMask,
	X.GenericTypeExpressionMask,
	X.TypeExpressionMask,
);

/** Intersection operands exclude primitive and `null` atomic types. */
export type IntersectionTypeOperandMasks = X.Sum<typeof IntersectionTypeOperandMasks>;
export const IntersectionTypeOperandMasks = X.sum(
	X.EditableArrayTypeExpressionMask,
	X.EditableTypeExpressionMask,
	X.ArrayTypeExpressionMask,
	X.GenericTypeExpressionMask,
	X.NamedTypeExpressionMask,
);

/** Type forms accepted by inline annotations. */
export type TypeMasks = X.Sum<typeof TypeMasks>;
export const TypeMasks: readonly [
	typeof X.TypeUnionExpressionMask,
	typeof X.TypeIntersectionExpressionMask,
	typeof X.EditableArrayTypeExpressionMask,
	typeof X.EditableTypeExpressionMask,
	typeof X.ArrayTypeExpressionMask,
	typeof X.GenericTypeExpressionMask,
	typeof X.TypeExpressionMask,
] = X.sum(
	X.TypeUnionExpressionMask,
	X.TypeIntersectionExpressionMask,
	...TypeOperandMasks,
);

export type SpaceBodyMasks = X.Sum<typeof SpaceBodyMasks>;
export const SpaceBodyMasks = X.sum(
	X.FromMask,
	X.TypedStableFunctionMask,
	X.StableFunctionMask,
	X.ClassMask,
	X.DeclareMask,
	X.WorkerMask,
	X.OneOfMask,
	X.OneValueOfMask,
	X.ManyOfMask,
	X.AliasMask,
	X.TestGroupMask,
	X.StartupFunctionMask,
	X.BuildFunctionMask,
);

export type ClassBodyMasks = X.Sum<typeof ClassBodyMasks>;
export const ClassBodyMasks = X.sum(
	X.CommentMask,
	X.DeclareMask,
	X.ConstructorFunctionMask,
	X.GhostFunctionMask,
	X.TypedStableFunctionMask,
	X.StableFunctionMask,
	X.PropertyMask,
	X.FieldMask,
);

export type ExpressionMasks = X.Sum<typeof ExpressionMasks>;
export const ExpressionMasks = X.sum(
	X.TernaryExpressionMask,
	X.EachMask,
	X.MatchesMask,
	X.RangeExpressionMask,
	X.BuildExpressionMask,
	X.TernaryExpressionMask,
	X.SpreadExpressionMask,
	X.CompoundParticleMask,
	X.OriginParticleMask,
	X.InfixedChainMask,
);

export type StatementMasks = X.Sum<typeof StatementMasks>;
export const StatementMasks = X.sum(
	X.SimpleAssignmentMask,
	X.ComplexAssignmentMask,
	X.ElseIfStatementMask,
	X.ElseStatementMask,
	X.IfStatementMask,
	X.BreakStatementMask,
	X.ContinueStatementMask,
	X.YieldStatementMask,
	X.ReturnStatementMask,
	X.EnsureStatementMask,
	X.ThrowStatementMask,
	X.CommentStatementMask,
	X.ExpressionStatementMask,
);
