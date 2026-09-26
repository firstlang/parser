import * as X from "./XX.ts";

//# Reusable

/** 
 * Reusable field for places where the mask field is a
 * paren-enclosed body of statements or expresions.
 */
type Body = (X.StatementMasks | X.ExpressionMasks)[];

type AnchorContent = 
	X.RawToken |
	X.IslandMask;

const reuse = {
	get body(): X.IManyField { return X.many(...X.StatementMasks, ...X.ExpressionMasks).paren(); },
	get type(): X.IOneField { return X.one(...X.TypeMasks); },
	/** Prefer atomic types so a following body is not consumed as generic arguments. */
	get returnType(): X.IOneField
	{
		return X.one(
			X.TypeExpressionMask,
			X.GenericTypeExpressionMask,
			X.ArrayTypeExpressionMask,
			X.EditableTypeExpressionMask,
			X.EditableArrayTypeExpressionMask,
			X.TypeIntersectionExpressionMask,
			X.TypeUnionExpressionMask);
	},
	get islandContent(): X.ILassoField
	{
		return X.lasso(
			X.EntityToken,
			X.LiteralToken,
			X.ResourceToken,
			X.FixedToken);
	},
} as const;

//# Top level Masks (used everywhere)

/**
 * Represents a group of statements or expressions.
 */
export class ControlFlowMask extends X.EnclosureMask
{
	readonly content: (X.StatementMasks | X.ExpressionMasks)[] = X.unset;
	
	createSchemaEnclosed() { return {
		enclosure: X.Enclosure.paren,
		content: X.many(...X.StatementMasks, ...X.ExpressionMasks),
	}}
}

/**
 * Represents the expression that follows the clauses
 * - is
 * - is alias of
 * - is type of
 */
export class TypeExpressionMask extends X.Mask
{
	readonly value: X.EntityToken | X.FixedToken = X.unset;
	
	createSchema(): X.TMaskSchema { return {
		value: X.one(X.EntityToken, X.BasicTypeKind),
	}}
}

/** Named atomic type used where primitive and `null` operands are prohibited. */
export class NamedTypeExpressionMask extends X.Mask
{
	readonly value: X.EntityToken = X.unset;
	
	createSchema() { return {
		value: X.one(X.EntityToken),
	}}
}

//# Generic Masks

/** ?? */
export class ConstantMask extends X.Mask
{
	createSchema() { return {
		
	}}
}

/** ?? */
export class ConstantExpressionMask extends X.Mask
{
	createSchema() { return {
		
	}}
}

/** */
export class CommentMask extends X.Mask
{
	readonly content: X.RawToken = X.unset;
	
	createSchema() { return {
		[X.schemaOptions]: { enclosure: X.Enclosure.line },
		...X.anchor(X.tokens.comment),
		content: X.raw(),
	}}
}

/** Brace-delimited semantic material embedded inside anchor prose. */
export class IslandMask extends X.Mask
{
	readonly content: X.EntityToken | X.LiteralToken | X.ResourceToken | X.FixedToken = X.unset;
	
	createSchema() { return {
		content: reuse.islandContent.brace(),
	}}
}

/** Compiler-aware natural-language sentence owned by its enclosing declaration. */
export class AnchorMask extends X.Mask
{
	readonly content: AnchorContent[] = X.unset;
	
	createSchema() { return {
		[X.schemaOptions]: { enclosure: X.Enclosure.line },
		...X.anchor(X.tokens.subtract),
		content: X.some(X.RawToken, X.IslandMask),
	}}
}

//# Control Flow Masks

/**
 * declare invariant
 */
export class DeclareMask extends X.Mask
{
	readonly invariants: X.EntityToken[] = X.unset;
	
	createSchema() { return {
		...X.anchor(X.tokens.declare),
		invariants: X.many(X.EntityToken)
	}}
}

//# Type-related

/** `or Type` */
export class TypeUnionSuccessorMask extends X.Mask
{
	readonly value: X.TypeOperandMasks = X.unset;
	
	createSchema(): X.TMaskSchema { return {
		...X.anchor(X.tokens.or),
		value: X.one(...X.TypeOperandMasks),
	}}
}

/** `Type or Type or Type` */
export class TypeUnionExpressionMask extends X.Mask
{
	readonly origin: X.TypeOperandMasks = X.unset;
	readonly successors: TypeUnionSuccessorMask[] = X.unset;
	
	createSchema() { return {
		origin: X.one(...X.TypeOperandMasks),
		successors: X.some(TypeUnionSuccessorMask),
	}}
}

/** `and Type` */
export class TypeIntersectionSuccessorMask extends X.Mask
{
	readonly value: X.IntersectionTypeOperandMasks = X.unset;
	
	createSchema(): X.TMaskSchema { return {
		...X.anchor(X.tokens.and),
		value: X.one(...X.IntersectionTypeOperandMasks),
	}}
}

/** `Type and Type and Type` */
export class TypeIntersectionExpressionMask extends X.Mask
{
	readonly origin: X.IntersectionTypeOperandMasks = X.unset;
	readonly successors: TypeIntersectionSuccessorMask[] = X.unset;
	
	createSchema() { return {
		origin: X.one(...X.IntersectionTypeOperandMasks),
		successors: X.some(TypeIntersectionSuccessorMask),
	}}
}

/** `Type(T, U)` */
export class GenericTypeExpressionMask extends X.Mask
{
	readonly name: X.NamedTypeExpressionMask = X.unset;
	readonly arguments: X.TypeMasks[] = X.unset;
	
	createSchema(): X.TMaskSchema { return {
		name: X.one(X.NamedTypeExpressionMask),
		arguments: X.some(...X.TypeMasks).paren(),
	}}
}

/** Empty brackets used as one array-type suffix. */
export class ArrayTypeSuffixMask extends X.EnclosureMask
{
	readonly content: X.EntityToken[] = X.unset;
	
	createSchemaEnclosed() { return {
		enclosure: X.Enclosure.bracket,
		content: X.many(X.EntityToken),
	}}
}

/** `Type[]`, with any additional suffixes representing nested arrays. */
export class ArrayTypeExpressionMask extends X.Mask
{
	readonly element: X.TypeExpressionMask | X.GenericTypeExpressionMask = X.unset;
	readonly firstSuffix: ArrayTypeSuffixMask = X.unset;
	readonly suffixes: ArrayTypeSuffixMask[] = X.unset;
	
	createSchema(): X.TMaskSchema { return {
		element: X.one(X.GenericTypeExpressionMask, X.TypeExpressionMask),
		firstSuffix: X.one(ArrayTypeSuffixMask),
		suffixes: X.many(ArrayTypeSuffixMask),
	}}
}

/** `editable Type[]`, kept flat so the editable qualifier owns the array shape. */
export class EditableArrayTypeExpressionMask extends X.Mask
{
	readonly element: X.TypeExpressionMask | X.GenericTypeExpressionMask = X.unset;
	readonly firstSuffix: ArrayTypeSuffixMask = X.unset;
	readonly suffixes: ArrayTypeSuffixMask[] = X.unset;
	
	createSchema(): X.TMaskSchema { return {
		...X.anchor(X.tokens.editable),
		element: X.one(X.GenericTypeExpressionMask, X.TypeExpressionMask),
		firstSuffix: X.one(ArrayTypeSuffixMask),
		suffixes: X.many(ArrayTypeSuffixMask),
	}}
}

/** `editable Type`; unlike `var`, editability is part of the type. */
export class EditableTypeExpressionMask extends X.Mask
{
	readonly value: X.ArrayTypeExpressionMask | X.GenericTypeExpressionMask | X.TypeExpressionMask = X.unset;
	
	createSchema(): X.TMaskSchema { return {
		...X.anchor(X.tokens.editable),
		value: X.one(
			X.ArrayTypeExpressionMask,
			X.GenericTypeExpressionMask,
			X.TypeExpressionMask),
	}}
}

/** Reserved for alias-only structural type syntax. */
export class ObjectTypeExpressionMask extends X.Mask
{
	createSchema() { return {} }
}

//# Function-related Masks

/** */
export class ParameterMask extends X.Mask
{
	readonly name: X.EntityToken = X.unset;
}

/** `T is type` */
export class TypeParameterMask extends X.ParameterMask
{
	createSchema() { return {
		name: X.one(X.EntityToken),
		...X.anchor(X.tokens.is, X.tokens.type),
	}}
}

/** `T is type of Constraint` */
export class ConstrainedTypeParameterMask extends X.ParameterMask
{
	readonly constraint: X.TypeMasks = X.unset;
	
	createSchema() { return {
		name: X.one(X.EntityToken),
		...X.anchor(X.tokens.is, X.tokens.typeof),
		constraint: reuse.type,
	}}
}

/** identifier is the_type */
export class TypedParameterMask extends X.ParameterMask
{
	readonly type: X.TypeMasks = X.unset;
	
	createSchema() { return {
		name: X.one(X.EntityToken),
		...X.anchor(X.tokens.is),
		type: reuse.type,
	}}
}

/** identifier = 1 */
export class DefaultParameterMask extends X.ParameterMask
{
	readonly name: X.EntityToken = X.unset;
	readonly value: X.ExpressionMasks = X.unset;
	
	createSchema() { return {
		name: X.one(X.EntityToken),
		...X.anchor(X.tokens.basicAssign),
		value: X.one(...X.ExpressionMasks),
	}}
}

/** identifier is the_type = 1 */
export class TypedDefaultParameterMask extends X.ParameterMask
{
	readonly name: X.EntityToken = X.unset;
	readonly type: X.TypeMasks = X.unset;
	readonly value: X.ExpressionMasks | null= X.unset;
	
	createSchema() { return {
		name: X.one(X.EntityToken),
		...X.anchor(X.tokens.is),
		type: reuse.type,
		...X.anchor(X.tokens.basicAssign),
		value: X.one(...X.ExpressionMasks),
	}}
}

/** identifier is the_type = ? */
export class TypedOptionalParameterMask extends X.ParameterMask
{
	readonly name: X.EntityToken = X.unset;
	readonly type: X.TypeMasks = X.unset;
	
	createSchema() { return {
		name: X.one(X.EntityToken),
		...X.anchor(X.tokens.is),
		type: reuse.type,
		...X.anchor(X.tokens.basicAssign, X.tokens.question),
	}}
}

/** ...identifier is the_type */
export class RestParameterMask extends X.ParameterMask
{
	readonly name: X.EntityToken = X.unset;
	readonly type: X.TypeMasks = X.unset;
	
	createSchema() { return {
		...X.anchor(X.tokens.spread),
		name: X.one(X.EntityToken),
		...X.anchor(X.tokens.is),
		type: reuse.type,
	}}
}

/** */
export class FunctionMask extends X.Mask
{
	readonly body: Body | null = X.unset;
}

/** */
export class ConstructorFunctionMask extends FunctionMask
{
	readonly signature: ParameterMask[] = X.unset;
	
	createSchema() { return {
		signature: X.many(...X.ParameterMasks).paren(),
		body: reuse.body.nullable(),
	}}
}

/** */
export class GhostFunctionMask extends FunctionMask
{
	createSchema() { return {
		...X.anchor(X.tokens.ghost),
		body: reuse.body,
	}}
}

/** */
export class StableFunctionMask extends FunctionMask
{
	readonly name: X.LowercaseEntityToken = X.unset;
	readonly signature: ParameterMask[] = X.unset;
	
	createSchema() { return {
		name: X.one(X.LowercaseEntityToken),
		signature: X.many(...X.ParameterMasks).paren(),
		body: reuse.body.nullable(),
	}}
};

/** Stable generator function with an explicit yielded type. */
export class GeneratorStableFunctionMask extends X.FunctionMask
{
	readonly name: X.LowercaseEntityToken = X.unset;
	readonly signature: ParameterMask[] = X.unset;
	readonly returnType: X.TypeMasks = X.unset;

	createSchema() { return {
		name: X.one(X.LowercaseEntityToken),
		signature: X.many(...X.ParameterMasks).paren(),
		...X.anchor(X.tokens.is, X.tokens.yield1),
		returnType: reuse.returnType,
		body: reuse.body.nullable(),
	}}
}

/** Stable function with an explicit return annotation. */
export class TypedStableFunctionMask extends X.StableFunctionMask
{
	readonly returnType: X.TypeMasks = X.unset;
	
	createSchema() { return {
		name: X.one(X.LowercaseEntityToken),
		signature: X.many(...X.ParameterMasks).paren(),
		...X.anchor(X.tokens.is),
		returnType: reuse.returnType,
		body: reuse.body.nullable(),
	}}
}

/** */
export class BuildFunctionMask extends FunctionMask
{
	createSchema() { return {
		...X.anchor(X.tokens.build),
		body: reuse.body,
	}}
}

/** */
export class StartupFunctionMask extends FunctionMask
{
	readonly isAnalyzer: boolean = X.unset;
	
	createSchema() { return {
		...X.anchor(X.tokens.startup),
		isAnalyzer: X.has(X.tokens.analyzer),
		body: reuse.body,
	}}
}

//# Space body masks

/** */
export class PropertyMask extends X.Mask
{
	
	
	createSchema() { return {
		
	}}
}

/** A mask that defines a field in a space. */
export class FieldMask extends X.Mask
{
	readonly name: X.EntityToken = X.unset;
	readonly access: X.VisibilityKind = X.unset;
	readonly type: X.TypeExpressionMask | null = X.unset;
	readonly value: X.ExpressionMasks | null = X.unset;
	
	createSchema() { return {
		
	}}
}

//# Top Level Masks

/** */
export class FromMask extends X.Mask
{
	readonly name: X.EntityToken = X.unset;
	readonly from: X.RawToken = X.unset;
	
	createSchema() { return {
		name: X.one(X.EntityToken),
		...X.anchor(X.tokens.from),
		from: X.raw(),
	}}
}

/** */
export class WorkerMask extends X.Mask
{
	readonly name: X.EntityToken = X.unset;
	readonly access: X.VisibilityKind = X.unset;
	readonly options: ConstantMask[] = X.unset;
	
	createSchema() { return {
		name: X.one(X.EntityToken),
		...X.anchor(X.tokens.is, X.tokens.worker),
		options: X.many(ConstantMask).paren(),
	}}
}

/** */
export class AliasMask extends X.Mask
{
	readonly name: X.EntityToken = X.unset;
	readonly access: X.VisibilityKind = X.unset;
	readonly type: X.TypeMasks = X.unset;
	
	createSchema() { return {
		name: X.one(X.EntityToken),
		...X.anchor(X.tokens.is, X.tokens.aliasof),
		type: reuse.type,
	}}
}

/** A literal string without runtime interpolation. */
export class SelectionStringMask extends X.Mask
{
	readonly content: X.RawToken = X.unset;

	createSchema() { return {
		content: X.raw().quote(),
	}}
}

/** Keeps enclosed literals out of lasso fields used by expression masks. */
export class SelectionLiteralMask extends X.Mask
{
	readonly value: X.SelectionStringMask | X.SelectionArrayMask | X.SelectionObjectMask | X.NegativeSelectionLiteralMask | X.FixedToken = X.unset;

	createSchema() { return {
		value: X.one(X.NegativeSelectionLiteralMask, X.SelectionStringMask, X.SelectionArrayMask, X.SelectionObjectMask, X.tokenGroups.constants),
	}}
}

export class NegativeSelectionLiteralMask extends X.Mask
{
	readonly value: X.LiteralToken = X.unset;

	createSchema() { return {
		...X.anchor(X.tokens.subtract),
		value: X.one(X.IntegerToken, X.DecimalToken, X.Float32Token, X.Float64Token, X.Float128Token),
	}}
}

/** Literal aggregates use the same restricted values as selection entries. */
export class SelectionArrayMask extends X.EnclosureMask
{
	readonly content: X.SelectionValueMask[] = X.unset;

	createSchemaEnclosed() { return {
		enclosure: X.Enclosure.bracket,
		content: X.many(X.SelectionValueMask),
	}}
}

export class SelectionObjectMask extends X.EnclosureMask
{
	readonly content: X.SelectionNamedEntryMask[] = X.unset;

	createSchemaEnclosed() { return {
		enclosure: X.Enclosure.brace,
		content: X.many(X.SelectionNamedEntryMask),
	}}
}

export class SelectionReferencePartMask extends X.Mask
{
	readonly name: X.EntityToken = X.unset;

	createSchema() { return {
		...X.anchor(X.tokens.dot),
		name: X.one(X.EntityToken),
	}}
}

export class SelectionReferenceMask extends X.Mask
{
	readonly origin: X.EntityToken | X.FixedToken = X.unset;
	readonly parts: X.SelectionReferencePartMask[] = X.unset;

	createSchema() { return {
		origin: X.one(X.EntityToken, { this: X.tokens.this }),
		parts: X.some(X.SelectionReferencePartMask),
	}}
}

/** Direct values only; calls, arithmetic and spreads are not entry expressions. */
export class SelectionValueMask extends X.Mask
{
	readonly value: X.Mask | X.FlexToken | X.FixedToken = X.unset;

	createSchema(): X.TMaskSchema { return {
		value: X.one(
			X.SelectionReferenceMask,
			X.NegativeSelectionLiteralMask,
			X.SelectionStringMask,
			X.SelectionArrayMask,
			X.SelectionObjectMask,
			X.IntegerToken, X.DecimalToken, X.UnsignedIntegerToken,
			X.Float32Token, X.Float64Token, X.Float128Token,
			X.HexToken, X.CharToken, X.QuantityToken,
			X.EntityToken,
			X.BasicTypeKind),
	}}
}

export class SelectionNamedEntryMask extends X.Mask
{
	readonly name: X.LowercaseEntityToken = X.unset;
	readonly value: X.SelectionValueMask[] = X.unset;

	createSchema() { return {
		name: X.one(X.LowercaseEntityToken),
		...X.anchor(X.tokens.basicAssign),
		value: X.lasso(X.SelectionValueMask),
	}}
}

export class OneOfBodyMask extends X.Mask
{
	readonly elements: (X.SelectionNamedEntryMask | X.SelectionValueMask)[] = X.unset;

	createSchema() { return {
		...X.anchor(X.tokens.oneof),
		elements: X.many(X.SelectionNamedEntryMask, X.SelectionValueMask).paren(),
	}}
}

export class ManyOfBodyMask extends X.Mask
{
	readonly elements: (X.SelectionNamedEntryMask | X.LowercaseEntityToken)[] = X.unset;

	createSchema() { return {
		...X.anchor(X.tokens.manyof),
		elements: X.many(X.SelectionNamedEntryMask, X.LowercaseEntityToken).paren(),
	}}
}

export class SelectionCaseMask extends X.Mask
{
	readonly name: X.LowercaseEntityToken = X.unset;
	readonly parameters: X.TypedParameterMask[] = X.unset;

	createSchema() { return {
		name: X.one(X.LowercaseEntityToken),
		parameters: X.many(X.TypedParameterMask).paren(),
	}}
}

export class OneCaseOfBodyMask extends X.Mask
{
	readonly elements: X.SelectionCaseMask[] = X.unset;

	createSchema() { return {
		...X.anchor(X.tokens.onecaseof),
		elements: X.many(X.SelectionCaseMask).paren(),
	}}
}

export class OneOfMask extends X.Mask
{
	readonly name: X.UppercaseEntityToken = X.unset;
	readonly body: X.OneOfBodyMask = X.unset;

	createSchema() { return {
		name: X.one(X.UppercaseEntityToken),
		...X.anchor(X.tokens.is),
		body: X.one(X.OneOfBodyMask),
	}}
}

export class ManyOfMask extends X.Mask
{
	readonly name: X.UppercaseEntityToken = X.unset;
	readonly body: X.ManyOfBodyMask = X.unset;

	createSchema() { return {
		name: X.one(X.UppercaseEntityToken),
		...X.anchor(X.tokens.is),
		body: X.one(X.ManyOfBodyMask),
	}}
}

export class OneCaseOfMask extends X.Mask
{
	readonly name: X.UppercaseEntityToken = X.unset;
	readonly body: X.OneCaseOfBodyMask = X.unset;

	createSchema() { return {
		name: X.one(X.UppercaseEntityToken),
		...X.anchor(X.tokens.is),
		body: X.one(X.OneCaseOfBodyMask),
	}}
}

export class SelectionCompositionPartMask extends X.Mask
{
	readonly value: X.SelectionReferenceMask | X.UppercaseEntityToken = X.unset;

	createSchema() { return {
		...X.anchor(X.tokens.or),
		value: X.one(X.SelectionReferenceMask, X.UppercaseEntityToken),
	}}
}

export class QualifiedSelectionCompositionPartMask extends X.SelectionReferenceMask
{
	createSchema() { return {
		...X.anchor(X.tokens.or),
		...super.createSchema(),
	}}
}

export class OneOfCompositionPartMask extends X.OneOfBodyMask
{
	createSchema() { return {
		...X.anchor(X.tokens.or),
		...super.createSchema(),
	}}
}

export class ManyOfCompositionPartMask extends X.ManyOfBodyMask
{
	createSchema() { return {
		...X.anchor(X.tokens.or),
		...super.createSchema(),
	}}
}

export class OneCaseOfCompositionPartMask extends X.OneCaseOfBodyMask
{
	createSchema() { return {
		...X.anchor(X.tokens.or),
		...super.createSchema(),
	}}
}

/** Shared composition syntax; source kinds and conflicts are resolved semantically. */
export class SelectionCompositionMask extends X.Mask
{
	readonly name: X.UppercaseEntityToken = X.unset;
	readonly origin: X.SelectionReferenceMask | X.UppercaseEntityToken = X.unset;
	readonly successors: (X.SelectionCompositionPartMask | X.QualifiedSelectionCompositionPartMask | X.OneOfCompositionPartMask | X.ManyOfCompositionPartMask | X.OneCaseOfCompositionPartMask)[] = X.unset;

	createSchema() { return {
		name: X.one(X.UppercaseEntityToken),
		...X.anchor(X.tokens.is),
		origin: X.one(X.SelectionReferenceMask, X.UppercaseEntityToken),
		successors: X.some(X.OneOfCompositionPartMask, X.ManyOfCompositionPartMask, X.OneCaseOfCompositionPartMask, X.QualifiedSelectionCompositionPartMask, X.SelectionCompositionPartMask),
	}}
}

//# Top-level Masks (tests)

/** */
export class TestGroupMask extends X.Mask
{
	
	
	createSchema() { return {
		
	}}
}

/** */
export class TestCaseMask extends X.Mask
{
	
	
	createSchema() { return {
		
	}}
}

//# Space Mask

/** */
export class SpaceBodyMask extends X.Mask
{
	readonly members: X.SpaceBodyMasks[] = X.unset;
	
	createSchema() { return {
		members: X.many(...X.SpaceBodyMasks).paren()
	}}
}

/** */
export class SpaceMask extends X.Mask
{
	readonly name: X.UppercaseEntityToken = X.unset;
	readonly supers: X.EntityToken[] | null = X.unset;
	readonly members: X.SpaceBodyMasks[] = X.unset;
	
	createSchema(): X.TMaskSchema { return {
		name: X.one(X.UppercaseEntityToken),
		supers: X.many(X.EntityToken).nullable(X.tokens.is),
		members: X.many(...X.SpaceBodyMasks).paren()
	}}
}

//# Statements

/** Optional type and mutability syntax belonging to a simple assignment. */
export class LocalTypeAnnotationMask extends X.Mask
{
	readonly mutable: boolean = X.unset;
	readonly type: X.TypeMasks = X.unset;
	
	createSchema() { return {
		mutable: X.has(X.tokens.var),
		type: reuse.type,
	}}
}

/**
 * a = b
 * a, b = c
 */
export class SimpleAssignmentMask extends X.Mask
{
	readonly target: X.EntityToken[] = X.unset;
	readonly annotation: LocalTypeAnnotationMask | null = X.unset;
	readonly defer: boolean = X.unset;
	readonly operator: X.AssignerKind = X.unset;
	readonly value: X.TExpressionable = X.unset;
	
	createSchema() { return {
		target: X.many(X.EntityToken),
		annotation: X.one(LocalTypeAnnotationMask).nullable(X.tokens.is),
		defer: X.has(X.tokens.defer),
		operator: X.one(X.AssignerKind),
		value: X.lasso(...X.ExpressionMasks, X.EntityToken, X.LiteralToken)
	}}
}

/** 
 * a().b = c
 */
export class ComplexAssignmentMask extends X.Mask
{
	readonly particle: X.CompoundParticleMask | X.OriginParticleMask = X.unset;
	readonly operator: X.AssignerKind = X.unset;
	readonly value: X.TExpressionable = X.unset;
	
	createSchema() { return {
		particle: X.one(X.CompoundParticleMask, X.OriginParticleMask),
		operator: X.one(X.AssignerKind),
		value: X.lasso(...X.ExpressionMasks),
	}}
}

/** */
export class ElseIfStatementMask extends X.Mask
{
	readonly condition: X.ControlFlowMask = X.unset;
	readonly body: Body = X.unset;
	
	createSchema() { return {
		...X.anchor(X.tokens.else, X.tokens.if),
		condition: X.one(X.ControlFlowMask),
		body: reuse.body,
	}}
}

/** */
export class ElseStatementMask extends X.Mask
{
	readonly body: Body = X.unset;
	
	createSchema() { return {
		...X.anchor(X.tokens.else),
		body: reuse.body,
	}}
}

/** */
export class IfStatementMask extends X.Mask
{
	readonly condition: X.ControlFlowMask = X.unset;
	readonly body: Body = X.unset;
	readonly elseifs: ElseIfStatementMask[] = X.unset;
	readonly else: ElseStatementMask | null = X.unset;
	
	createSchema() { return {
		...X.anchor(X.tokens.if),
		condition: X.one(X.ControlFlowMask),
		body: reuse.body,
		elseifs: X.many(X.ElseIfStatementMask),
		else: X.one(ElseStatementMask).nullable(),
	}}
}

/** */
export class BreakStatementMask extends X.Mask
{
	readonly kind: X.BreakKind = X.unset;
	readonly expression: X.ExpressionMasks = X.unset;
	
	createSchema() { return {
		kind: X.one(X.BreakKind),
		expression: X.lasso(...X.ExpressionMasks)
	}}
}

/** */
export class ContinueStatementMask extends X.Mask
{
	readonly kind: X.ContinueKind = X.unset;
	readonly expression: X.ExpressionMasks = X.unset;
	
	createSchema() { return {
		kind: X.one(X.ContinueKind),
		expression: X.lasso(...X.ExpressionMasks)
	}}
}

/** */
export class YieldStatementMask extends X.Mask
{
	readonly kind: X.YieldKind = X.unset;
	readonly expression: X.ExpressionMasks = X.unset;
	
	createSchema() { return {
		kind: X.one(X.YieldKind),
		expression: X.lasso(...X.ExpressionMasks)
	}}
}

/** */
export class ReturnStatementMask extends X.Mask
{
	readonly expression: X.ExpressionMasks = X.unset;
	
	createSchema() { return {
		...X.anchor(X.tokens.return),
		expression: X.lasso(...X.ExpressionMasks)
	}}
}

/** */
export class EnsureStatementMask extends X.Mask
{
	readonly expression: X.ExpressionMasks = X.unset;
	
	createSchema() { return {
		...X.anchor(X.tokens.ensure),
		expression: X.lasso(...X.ExpressionMasks)
	}}
}

/** */
export class ThrowStatementMask extends X.Mask
{
	readonly expression: X.ExpressionMasks = X.unset;
	
	createSchema() { return {
		...X.anchor(X.tokens.throw),
		expression: X.lasso(...X.ExpressionMasks),
	}}
}

/** */
export class CommentStatementMask extends X.Mask
{
	readonly content: X.RawToken = X.unset;
	
	createSchema() { return {
		[X.schemaOptions]: { enclosure: X.Enclosure.line },
		...X.anchor(X.tokens.comment),
		content: X.raw(),
	}}
}

/** Generic statement-level container for an expression. */
export class ExpressionStatementMask extends X.Mask
{
	readonly expression: X.TExpressionable = X.unset;
	
	createSchema() { return {
		expression: X.lasso(...X.ExpressionMasks, X.EntityToken, X.LiteralToken),
	}}
}

//# Suffixes

/** */
export class EachMask extends X.Mask
{
	readonly prefix: X.TExpressionable = X.unset;
	readonly entities: X.EntityToken[] = X.unset;
	readonly body: Body = X.unset;
	
	createSchema(): X.TMaskSchema { return {
		[X.schemaOptions]: {
			suffix: true,
		},
		prefix: X.lasso(...X.ExpressionMasks),
		...X.anchor(X.tokens.each),
		entities: X.many(X.EntityToken),
		body: reuse.body,
	}}
}

/** */
export class MatchesMask extends X.Mask
{
	readonly prefix: X.TExpressionable = X.unset;
	readonly exhaustive: boolean = X.unset;
	readonly body: X.MatchesBodyMask = X.unset;
	
	createSchema(): X.TMaskSchema { return {
		[X.schemaOptions]: {
			suffix: true,
		},
		prefix: X.lasso(...X.ExpressionMasks),
		exhaustive: X.has(X.tokens.always),
		...X.anchor(X.tokens.matches),
		body: X.one(X.MatchesBodyMask)
	}}
}

/** */
export class MatchesBodyMask extends X.EnclosureMask
{
	readonly content: X.MatchesArmMask[] = X.unset;
	
	createSchemaEnclosed() { return {
		enclosure: X.Enclosure.paren,
		content: X.many(
			X.MatchesEmptyArmMask,
			X.MatchesElseArmMask,
			X.MatchesArmMask),
	}}
}

/** */
export class MatchesEmptyArmMask extends X.Mask
{
	readonly case: X.EntityToken | X.LiteralToken | X.SelectionLiteralMask | X.SelectionReferenceMask = X.unset;
	
	createSchema() { return {
		case: X.one(X.SelectionReferenceMask, X.SelectionLiteralMask, X.EntityToken, X.IntegerToken, X.DecimalToken),
	}}
}

/** */
export class MatchesElseArmMask extends X.Mask
{
	readonly result: X.TExpressionable = X.unset;
	
	createSchema() { return {
		...X.anchor(X.tokens.else),
		result: X.lasso(...X.ExpressionMasks),
	}}
}

/** */
export class MatchesArmMask extends X.Mask
{
	readonly case: X.EntityToken | X.LiteralToken | X.SelectionLiteralMask | X.SelectionReferenceMask = X.unset;
	readonly result: X.TExpressionable = X.unset;
	
	createSchema() { return {
		case: X.one(X.SelectionReferenceMask, X.SelectionLiteralMask, X.EntityToken, X.IntegerToken, X.DecimalToken),
		result: X.lasso(...X.ExpressionMasks),
	}}
}

//# Expressions

/** Membership checks share ordinary type-attestation syntax. */
export class AttestationExpressionMask extends X.Mask
{
	readonly value: X.CompoundParticleMask | X.OriginParticleMask | X.SelectionLiteralMask | X.IntegerToken = X.unset;
	readonly kind: X.AttestationKind = X.unset;
	readonly type: X.TypeMasks = X.unset;

	createSchema() { return {
		value: X.one(X.CompoundParticleMask, X.OriginParticleMask, X.SelectionLiteralMask, X.IntegerToken),
		kind: X.one(X.AttestationKind),
		type: reuse.type,
	}}
}

/** */
export class RangeExpressionMask extends X.Mask
{
	readonly from: X.TExpressionable = X.unset;
	readonly kind: X.RangeKind = X.unset;
	readonly to: X.TExpressionable = X.unset;
	readonly step: X.TExpressionable | null = X.unset;
	
	createSchema(): X.TMaskSchema { return {
		from: X.expressionable(),
		kind: X.one(X.RangeKind),
		to: X.expressionable(),
		step: X.expressionable().nullable(X.tokens.step)
	}}
}

/** */
export class BuildExpressionMask extends X.Mask
{
	createSchema() { return {
		
	}}
}

/** */
export class TernaryExpressionMask extends X.Mask
{
	readonly condition: X.TExpressionable = X.unset;
	readonly pass: X.ExpressionMasks = X.unset;
	readonly fail: X.ExpressionMasks = X.unset;
	
	createSchema(): X.TMaskSchema { return {
		prefix: X.expressionable(),
		...X.anchor(X.tokens.question),
		pass: X.one(...X.ExpressionMasks),
		...X.anchor(X.tokens.colon),
		fail: X.one(...X.ExpressionMasks),
	}}
}

/** */
export class SpreadExpressionMask extends X.Mask
{
	readonly target: X.TExpressionable = X.unset;
	
	createSchema(): X.TMaskSchema { return {
		...X.anchor(X.tokens.spread),
		target: X.expressionable(),
	}}
}

/** (x) */
export class FunctionActivatorMask extends X.EnclosureMask
{
	readonly content: X.TExpressionable[] = X.unset;
	
	createSchemaEnclosed() { return {
		enclosure: X.Enclosure.paren,
		content: X.many(X.EntityToken, X.LiteralToken, ...X.ExpressionMasks),
	}}
}

/** [x] */
export class IndexActivatorMask extends X.EnclosureMask
{
	readonly content: X.TExpressionable[] = X.unset;
	
	createSchemaEnclosed() { return {
		enclosure: X.Enclosure.bracket,
		content: X.many(X.EntityToken, X.LiteralToken, ...X.ExpressionMasks),
	}}
}

/** term(x)[x].term(x)[x] */
export class CompoundParticleMask extends X.Mask
{
	readonly origin: OriginParticleMask = X.unset;
	readonly posts: PostParticleMask[] = X.unset;
	
	createSchema() { return {
		[X.schemaOptions]: {
			sparse: true,
		},
		origin: X.one(X.OriginParticleMask),
		posts: X.some(X.NegativePostParticleMask, X.PostParticleMask),
	}}
}

/** term(x)(x)[x][x] */
export class OriginParticleMask extends X.Mask
{
	readonly term: X.EntityToken | X.ParticleLiteralToken | X.ControlFlowMask | X.FixedToken = X.unset;
	readonly activators: (X.FunctionActivatorMask | X.IndexActivatorMask)[] = X.unset;
	
	createSchema(): X.TMaskSchema { return {
		[X.schemaOptions]: {
			sparse: true,
		},
		term: X.one(X.EntityToken, X.ParticleLiteralToken, X.ControlFlowMask, { this: X.tokens.this }),
		activators: X.many(X.FunctionActivatorMask, X.IndexActivatorMask),
	}}
}

/** .term(x)(x)[x][x] */
export class PostParticleMask extends X.Mask
{
	readonly term: X.EntityToken | X.LiteralToken | X.SelectionLiteralMask | X.FixedToken = X.unset;
	readonly activators: (X.FunctionActivatorMask | X.IndexActivatorMask)[] = X.unset;
	
	createSchema() { return {
		...X.anchor(X.tokens.dot),
		term: X.one(X.EntityToken, X.IntegerToken, X.DecimalToken, X.UnsignedIntegerToken,
			X.Float32Token, X.Float64Token, X.Float128Token, X.HexToken, X.CharToken,
			X.SelectionLiteralMask, X.tokenGroups.constants),
		activators: X.many(X.FunctionActivatorMask, X.IndexActivatorMask),
	}}
}

/** Keep the sign in the literal member, rather than parsing subtraction. */
export class NegativePostParticleMask extends X.PostParticleMask
{
	createSchema() { return {
		...X.anchor(X.tokens.dot, X.tokens.subtract),
		term: X.one(X.IntegerToken, X.DecimalToken, X.Float32Token, X.Float64Token, X.Float128Token),
		activators: X.many(X.FunctionActivatorMask, X.IndexActivatorMask),
	}}
}

/**
 * + particle
 * + ( ... deep nesting ... )
 * */
export class InfixedParticleMask extends X.Mask
{
	readonly operator: X.InfixOperatorKind = X.unset;
	readonly particle: (CompoundParticleMask | OriginParticleMask | X.LiteralToken) = X.unset;
	
	createSchema() { return {
		operator: X.one(X.InfixOperatorKind),
		particle: X.one(X.CompoundParticleMask, X.OriginParticleMask, X.LiteralToken),
	}}
}

/** term + term + term */
export class InfixedChainMask extends X.Mask
{
	readonly origin: (X.CompoundParticleMask | X.OriginParticleMask | X.LiteralToken) = X.unset;
	readonly successors: InfixedParticleMask[] = X.unset;
	
	createSchema() { return {
		[X.schemaOptions]: {
			sparse: true,
		},
		origin: X.one(CompoundParticleMask, OriginParticleMask, X.LiteralToken),
		successors: X.some(InfixedParticleMask),
	}}
}

//# Types (implement these)

/*
ExtractFunctionArgumentsTypeExpression
ExtractFunctionReturnTypeExpression
ExtractMethodTypeExpression
ExtractPropertyTypeExpression
TypeExtractionExpression
TypeIntersectionExpression
TypeUnionExpression
*/
