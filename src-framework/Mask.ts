import * as X from "./X.ts";

export const schemaOptions = Symbol("schemaOptions");
export type TMaskOptions = {
	[schemaOptions]?: {
		sparse?: boolean,
		suffix?: boolean,
		enclosure?: X.Enclosure,
	}
};

export type TMaskSchema = TMaskOptions & { [K: string]: X.TField };
export type TMaskSchemaEnclosed = {
	enclosure: X.Enclosure,
	content: X.IManyField | X.IOneField
};

/** */
export type TMaskValue = 
	boolean |
	X.Token |
	X.Mask;

/** */
export type TMaskContentValue =
	X.Token |
	X.Mask;

const maskBrand = Symbol("maskBrand");

/** */
export abstract class Mask
{
	/**
	 * Gets or sets the MaskDescriptor associated with the mask.
	 */
	static get descriptor()
	{
		if (!this._descriptor)
			throw "Mask descriptor not set yet.";
		
		return this._descriptor;
	}
	static set descriptor(value: X.MaskDescriptor)
	{
		this._descriptor = value;
	}
	private static _descriptor: X.MaskDescriptor | null = null;
	
	/** */
	static isType(value: any): value is typeof Mask
	{
		return typeof value === "function" && value[maskBrand] === true;
	}
	private static readonly [maskBrand] = true;
	
	/** */
	static get isEnclosureMask() { return false; }
	
	/** */
	createSchema(): TMaskSchema { return {}; }
	
	/**
	 * Scans the schema returned by .schema(), and produces a flat list
	 * of entries—one per field—pairing each field's current runtime
	 * value with the X.TField metadata that describes it.
	 */
	queryFields(): readonly IMaskReflectedField[]
	{
		const maskEntries: IMaskReflectedField[] = [];
		const schema = this.createSchema();
		const objectEntries = Object.entries(schema);
		const structureBuffer: X.FixedToken[] = [];
		
		for (let i = -1; ++i < objectEntries.length;)
		{
			const [name, field] = objectEntries[i];
			const value = (this as any)[name];
			
			if (X.isAnchorProperty(name))
			{
				const fixedTokens = X.toArray(field) as any as X.FixedToken[];
				structureBuffer.push(...fixedTokens);
				continue;
			}
			
			const structureConditional = getConditionalStructure(field, value);
			
			maskEntries.push({
				value,
				field,
				anchorConditional: structureConditional,
				structureBefore: [...structureBuffer],
				structureAfter: [],
			});
			structureBuffer.length = 0;
		}
		
		const lastEntry = maskEntries.at(-1);
		if (lastEntry && structureBuffer.length > 0)
			(lastEntry as X.TWritable<IMaskReflectedField>).structureAfter = structureBuffer;
		
		return maskEntries;
	}
	
	/** */
	queryToken(containedToken: X.Token | X.Tape): IMaskReflectedToken | null
	{
		return null;
	}
}

/** Returns fixed structure whose presence is determined by a field's value. */
function getConditionalStructure(field: X.TField, value: unknown)
{
	if (field.kind === "has")
		return value === true ? field.match : [];

	if (field.data.nullableTokens.length === 0)
		return [];

	switch (field.kind)
	{
		case "one":
		case "lasso":
			return value === null ? [] : field.data.nullableTokens;
		case "many":
		case "some":
			return Array.isArray(value) && value.length > 0 ? field.data.nullableTokens : [];
		default:
			return [];
	}
}

/** */
export interface IMaskReflectedToken
{
	readonly field: X.IMaskReflectedField;
	readonly fieldIndex: number;
	readonly siblings: X.IMaskReflectedField[];
}

/**
 * Describes a single resolved field within a mask's schema, pairing
 * the field's current runtime value with the X.TField metadata that
 * describes how it should be parsed/serialized, along with any anchors
 * that surround it.
 */
export interface IMaskReflectedField
{
	/**
	 * The current runtime value of this field, read off the mask
	 * instance (i.e. `(maskInstance as any)[name]`). May be a single
	 * TMaskValue, or an array of them when the field is a "many" field.
	 */
	readonly value: TMaskValue | TMaskValue[];
	
	/**
	 * The X.TField metadata associated with this field, as declared in
	 * the schema. Describes how the field's value should be parsed
	 * from and/or serialized back to tape content (e.g. whether it's
	 * a one/many field, fixed/flex/raw token, etc).
	 */
	readonly field: X.TField;
	
	/**
	 * Stores the anchor tokens that are conditionally present
	 * based on the value of a IHasField. If the local field value is not an
	 * IHasField, then this will be an empty array.
	 */
	readonly anchorConditional: readonly X.FixedToken[];
	
	/**
	 * Any anchor tokens (literal separators, delimiters, etc)
	 * that appear in the schema immediately before this field, and
	 * which were accumulated while scanning prior entries.
	 */
	readonly structureBefore: readonly X.FixedToken[];
	
	/**
	 * Anchor tokens that appear after this field. This is only populated
	 * for the last field in the schema, and reflects the trailing anchor
	 * tokens defined at the end of the schema object (every other field
	 * gets an empty array here).
	 */
	readonly structureAfter: readonly X.FixedToken[];
}

/**
 * 
 */
export abstract class EnclosureMask extends X.Mask
{
	abstract readonly content: X.TMaskContentValue | X.TMaskContentValue[];
	
	/** */
	static get isEnclosureMask() { return true; }
	
	/** */
	createSchema(): X.TMaskSchema
	{
		const { enclosure, content } = this.createSchemaEnclosed();
		return {
			[X.schemaOptions]: { enclosure },
			content
		};
	}
	
	/** */
	createSchemaEnclosed(): TMaskSchemaEnclosed
	{
		return { 
			enclosure: X.Enclosure.none,
			content: X.many(),
		};
	}
}
