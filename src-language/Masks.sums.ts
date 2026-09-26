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
	X.UnknownParameterMask,
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
export const SpaceBodyMasks: readonly typeof X.Mask[] = X.sum(
	X.CommentMask,
	X.AnchorMask,
	X.FromMask,
	X.SpaceMask,
	X.AsyncTypedStableFunctionMask,
	X.AsyncStableFunctionMask,
	X.GeneratorStableFunctionMask,
	X.TypedStableFunctionMask,
	X.StableFunctionMask,
	X.DeclareMask,
	X.WorkerMask,
	X.OneOfMask,
	X.OneCaseOfMask,
	X.SelectionCompositionMask,
	X.ManyOfMask,
	X.AliasMask,
	X.TestGroupMask,
	X.StartupFunctionMask,
	X.BuildFunctionMask,
	X.BareConstructorFunctionMask,
	X.AsyncConstructorFunctionMask,
	X.TypedConstructorFunctionMask,
	X.SimpleAssignmentMask,
	X.ConstructorFunctionMask,
	X.GhostFunctionMask,
	X.PropertyMask,
	X.InitializedAnchoredFieldMask,
	X.AnchoredFieldMask,
	X.FieldMask,
);

export type ExpressionMasks = X.Sum<typeof ExpressionMasks>;
export const ExpressionMasks = X.sum(
	X.AttestationExpressionMask,
	X.SelectionLiteralMask,
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
	X.AnchorMask,
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
