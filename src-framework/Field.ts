import * as X from "./X.ts";

/** */
export class Field
{
	/** */
	constructor(kind: string, match: readonly any[])
	{
		this.kind = kind;
		this.match = Object.freeze(match);
		
		// Pre-process these values to allow for optimization in the MaskApplicator.
		
		if (kind === "one" || kind === "many" || kind === "some")
		{
			this.data.matchesOnlyFlexes = match.every(m => X.FlexToken.isType(m));
			this.data.matchesOnlySelects = match.every(m => X.isSelectMatch(m));
			this.data.matchesOnlyMasks = match.every(m => X.Mask.isType(m));
		}
	}
	
	/** Stores the name of the capture group in the field's regular expression. */
	name = "";
	
	/** Debug-only label. No runtime effect. */
	description = "";
	
	readonly kind: unknown = "";
	readonly match: readonly any[];
	
	/** */
	readonly data = {
		nullableTokens: [] as X.FixedToken[],
		enclosure: X.Enclosure.none as X.Enclosure,
		terminal: false,
		sink: false,
		
		// Optimization properties.
		matchesOnlyFlexes: false,
		matchesOnlySelects: false,
		matchesOnlyMasks: false,
	}
	
	/**
	 * Indicates that the field being matched is actually nullable,
	 * requires the specified FixedToken sequence prefix as anchor
	 * to determine whether the field value is null or not.
	 * 
	 * Examples:
	 * 1 to 10 step 2
	 */
	nullable(...anchor: X.FixedToken[]): this
	{
		this.data.nullableTokens = anchor;
		return this;
	}
	
	/** Indicates that this field is expected to be wrapped in a paren() delimiter. */
	paren(): this
	{
		this.data.enclosure = X.Enclosure.paren;
		return this;
	}
	
	/** */
	brace(): this
	{
		this.data.enclosure = X.Enclosure.brace;
		return this;
	}
	
	/** */
	bracket(): this
	{
		this.data.enclosure = X.Enclosure.bracket;
		return this;
	}
	
	/** */
	quote(): this
	{
		this.data.enclosure = X.Enclosure.quote;
		return this;
	}
	
	/** */
	fence(): this
	{
		this.data.enclosure = X.Enclosure.fence;
		return this;
	}
	
	/** */
	markup(): this
	{
		this.data.enclosure = X.Enclosure.markup;
		return this;
	}
	
	/** */
	substitution(): this
	{
		this.data.enclosure = X.Enclosure.substitution;
		return this;
	}
}

/** 
 * Defines the sum type that combines all field types to allow
 * for switch-based narrowing over the kind property of the field.
 */
export type TField = 
	IRawField | 
	IOneField | 
	ILassoField |
	IManyField | 
	ISomeField | 
	IHasField;

/**
 * Matches tokens of any kind, until the tape is exhausted.
 * Generates field of type RawToken.
 * Example: lib from http://path.to/lib
 */
export function raw()
{
	return new Field("raw", nullArray) as IRawField;
}

const nullArray = Object.freeze([]);

/** */
interface IRawField extends Field
{
	kind: "raw";
	
	// This property has no function. Its here for hidden class optimization purposes.
	match: readonly any[];
}

export type TMatch = typeof X.FixedToken | typeof X.FlexToken | typeof X.Mask | TSelect;
export type TSelect = Record<string, X.FixedToken>;

/** */
export function isSelectMatch(value: any): value is TSelect
{
	return !!value &&
		typeof value === "object" &&
		value.constructor === Object &&
		Object.values(value).every(v => v instanceof X.FixedToken);
}

/** */
export function isSelectMatchMember(value: any, select: TSelect)
{
	return Object.values(select).some(v => v === value);
}

/**
 * Matches a single FlexToken or Mask from the tape, whose type is
 * of one of the specified FlexToken or Mask types.
 * Generates a field of type FlexToken, or Mask, depending on the
 * types of the parameters provided.
 * Example: MyClass ( ... )
 * Example: a += b
 */
export function one(...match: TMatch[]): IOneField
{
	return new Field("one", match) as IOneField;
}

/** */
export interface IOneField extends Field
{
	kind: "one";
	match: readonly TMatch[];
}

/**
 * Matches a series of options in a regular expression catch all pattern,
 * but where all those tape elements are expected to fit into singular
 * (non-array) field.
 * 
 * Example: a + b + c each ( ...
 *  
 * (the prefix part before each)
 */
export function lasso(...match: TMatch[]): ILassoField
{
	ensureNoEnclosureMasks(match);
	return new Field("lasso", match) as ILassoField;
}

/** */
export interface ILassoField extends Field
{
	kind: "lasso";
	match: readonly TMatch[];
}

/**
 * Matches FlexTokens, Masks, or FixedToken groups from the tape, until the tape is exhausted.
 * Generates a field of type (FlexToken | Mask | string)[].
 * Examples:
 * expr + expr * expr
 * each flex1, flex2, flex3 ( ...
 */
export function many(...match: TMatch[]): IManyField
{
	return new Field("many", match) as IManyField;
}

/** */
export interface IManyField extends Field
{
	kind: "many";
	match: readonly TMatch[];
}

/**
 * 
 */
export function some(...match: TMatch[]): ISomeField
{
	ensureNoEnclosureMasks(match);
	return new Field("some", match) as ISomeField;
}

/** */
export interface ISomeField extends Field
{
	kind: "some";
	match: readonly TMatch[];
}

/**
 * Matches a sequence of FixedTokens from the tape.
 * Generates a boolean field whose value is equal to whether the
 * tape has the specified sequence of FixedTokens at the current
 * position. If the tape elements at the current tape position do not
 * match, the operation generates a false-containing field and no
 * tape elements are considered to be consumed.
 * Example: x defer = y
 */
export function has(...match: X.FixedToken[])
{
	return new Field("has", match) as IHasField;
}

/** */
export interface IHasField extends Field
{
	kind: "has";
	match: readonly X.FixedToken[];
}

//# Anchor helpers

/** 🫤 */
export type TAnchorCombinator = {};

/** 
 * Specifies static tokens that must exist in the tape in order for a Mask type to be
 * matched, but otherwise do not contribute content to the matched Mask.
 */
export function anchor(...tokens: X.FixedToken[]): TAnchorCombinator
{
	return { [anchorPrefix + (++nextAnchorIndex)]: tokens };
}

/** */
export function isAnchorProperty(propertyName: string)
{
	return propertyName.startsWith(anchorPrefix) && /[0-9]+/.test(propertyName);
}

/** */
function ensureNoEnclosureMasks(matches: TMatch[])
{
	if (matches.some(m => X.Mask.isType(m) && m.isEnclosureMask))
		throw "Enclosure masks not allowed in this field type.";
}

/**
 * Defines the character that comes before a property in a mask to demarcate that 
 * the property is refers to a list of static tokens that need to exist but are discarded.
 */
const anchorPrefix = "!";
let nextAnchorIndex = 0;
