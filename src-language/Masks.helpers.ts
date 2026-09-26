import * as X from "./XX.ts";

/** */
export type ExpressionValue =
	X.EntityToken | 
	X.LiteralToken |
	X.ExpressionMasks;

export type TExpressionable = ExpressionValue | ExpressionValue[];

/**
 * Shortcut function, because this particular sequence is used in many places.
 */
export function expressionable(): X.ILassoField
{
	return X.lasso(...expressionAlternatives());
}

/** The shared expression vocabulary, independent of field cardinality. */
export function expressionAlternatives()
{
	return [...X.ExpressionMasks, X.EntityToken, X.LiteralToken] as const;
}
