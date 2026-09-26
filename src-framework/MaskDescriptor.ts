import * as X from "./X.ts";

/** */
export class MaskDescriptor
{
	/**
	 * Compiles all schemas for all masks.
	 */
	static compile(spec: X.ILanguageSpec)
	{
		for (const desc of this.visitTopological(spec))
		{
			desc._insidePattern = createPatternForMask(desc, true);
			desc._matchPattern = createPatternForMask(desc, false);
			
			const flags = "du" + (desc.sparse ? "g" : "");
			
			if (desc.enclosure !== X.Enclosure.none)
				desc._enclosureAwareMatcher = new RegExp(X.Proxy.get(desc.enclosure), flags);
			
			if (desc._matchPattern !== "")
			{
				try
				{
					desc._enclosureIgnoringMatcher = new RegExp(desc._matchPattern, flags);
				}
				catch (e)
				{
					console.error("Invalid regular expression pattern: " + desc._matchPattern);
					desc._matchPattern = createPatternForMask(desc, false);
				}
			}
			
			// Mark the sink fields as such. Sink fields are an optimization. 
			// They are fields where we detect that it's possible to skip
			// over some complex recursion patterns in the MaskApplicator
			// and assign everything in a single nested field.
			const fields = Object.values(desc.schema);
			if (fields.length === 1)
			{
				const field = fields[0];
				if (field.kind === "many" || field.kind === "some")
					if (field.data.enclosure === X.Enclosure.none)
						if (field.match.every(m => X.Mask.isType(m)))
							field.data.sink = true;
			}
		}
	}
	
	/**
	 * Enumerates through all mask schema objects  in topological ordering, 
	 * creating new MaskDescriptor objects where they are missing. This is a helper
	 * function of the compile() function and not intended to be used otherwise.
	 * Fields can reference other masks and embed their regular expressions
	 * and if these are not yet constructed... disappointment will result.
	 */
	private static * visitTopological(spec: X.ILanguageSpec)
	{
		// Pre-load the seen set with known abstract base classes we don't want to hit.
		const seen = new Set<typeof X.Mask>([
			X.Mask,
			X.EnclosureMask
		]);
		
		function * recurse(maskType: typeof X.Mask): IterableIterator<MaskDescriptor>
		{
			if (seen.has(maskType))
				return;
			
			seen.add(maskType);
			const schema = maskType.prototype.createSchema();
			const desc = new MaskDescriptor(maskType, schema);
			maskType.descriptor = desc;
			
			for (const field of Object.values(schema))
				for (const match of field.match || [])
					if (X.Mask.isType(match))
						yield * recurse(match); // recurse into deps first
			
			yield desc;
		};
		
		for (const maskType of spec.masks)
			yield * recurse(maskType)
	}
	
	/** */
	constructor(maskType: typeof X.Mask, schema: X.TMaskSchema)
	{
		this.type = maskType;
		this.schema = schema;
		
		const options = schema[X.schemaOptions];
		this.sparse = !!options?.sparse;
		this.suffix = !!options?.suffix;
		this.enclosure = options?.enclosure || X.Enclosure.none;
		
		if (this.sparse && this.suffix)
			throw "Masks cannot be both suffixes and defined as sparse.";
	}
	
	/** */
	readonly type: typeof X.Mask;
	
	/** */
	readonly schema: X.TMaskSchema;
	
	/** Stores the delimiter of the tape enclosure in which this mask is expected to be wrapped.  */
	readonly enclosure: X.Enclosure = X.Enclosure.none;
	
	/** */
	readonly sparse: boolean;
	
	/** */
	readonly suffix: boolean;
	
	/**
	 * 
	 */
	get enclosureAwareMatcher()
	{
		return this._enclosureAwareMatcher || this._enclosureIgnoringMatcher;
	}
	private _enclosureAwareMatcher: RegExp | null = null;
	
	/**
	 * Gets the RegExp object whose source is equal to the value
	 * of the matchPattern property in this object.
	 */
	get enclosureIgnoringMatcher()
	{
		return this._enclosureIgnoringMatcher;
	}
	private _enclosureIgnoringMatcher: RegExp | null = null;
	
	/**
	 * Gets the text-only regular expression pattern of the associated mask, 
	 * which is the string used to compose the abstract regular expression that
	 * is actually matched against tapes.
	 */
	get matchPattern()
	{
		return this._matchPattern;
	}
	private _matchPattern = "";
	
	/**
	 * Gets the text-only regular expression pattern of the associated mask, 
	 * with any field capture group markings omitted,  and with reduced
	 * specificity, making it pattern suitable for embedding in other patterns.
	 */
	get insidePattern()
	{
		return this._insidePattern;
	}
	private _insidePattern = "";
	
	/** */
	getReadablePattern(inside: boolean)
	{
		const pattern = inside ? this._insidePattern : this._matchPattern;
		const resolved = X.Proxy.resolveString(pattern);
		return resolved;
	}
}

/**
 * 
 */
function createPatternForMask(descriptor: MaskDescriptor, inside: boolean)
{
	// There's an early cheat code here -- the inside patterns of masks that
	// have enclosures are just the proxy character of that enclosure. This
	// is because inside patterns are used for embedding, and the only thing
	// that would be visible in a tape is the enclosure proxy character.
	if (inside && descriptor.enclosure !== X.Enclosure.none)
		return X.Proxy.get(descriptor.enclosure);
	
	const pattern: string[] = [];
	
	for (const [fieldName, field] of Object.entries(descriptor.schema))
	{
		if (X.isAnchorProperty(fieldName))
		{
			// The anchor properties are a bunch of FixedToken objects
			// but this isn't expressed in the field structure type schemas,
			// so instead of doing a bunch of typing gymnastics its easier
			// to just do a cast to FixedTokens.
			const anchors = X.toArray(field) as any as X.FixedToken[];
			const charstring = anchors.map(e => X.Proxy.get(e)).join("");
			pattern.push(charstring);
			continue;
		}
		
		field.name = fieldName;
		field.description = descriptor.type.name + "." + fieldName;
		
		const fieldPattern = inside ?
			createPatternForField(field, true) :
			createNamedPatternForField(field);
		
		pattern.push(...fieldPattern);
	}
	
	verifyPatternSegments(pattern);
	
	if (!inside)
	{
		if (descriptor.suffix)
		{
			pattern.push("$");
		}
		else if (!descriptor.sparse && (pattern.length > 0 && !descriptor.suffix))
		{
			pattern.unshift("^");
			pattern.push("$");
		}
	}
	
	return pattern.join("");
}

/**
 * 
 */
function verifyPatternSegments(segments: string[])
{
	for (let i = 1; ++i < segments.length;)
	{
		const a = segments[i - 1];
		const b = segments[i];
		if (a === catchAllPattern && b === catchAllPattern)
			throw "Pattern has consecutive catch-all fields.";
	}
}

/**
 * 
 */
function createNamedPatternForField(field: X.TField)
{
	const fieldPattern = createPatternForField(field, false);
	return ["(?<", field.name, ">", ...fieldPattern, ")"];
}

/**
 * 
 */
function createPatternForField(field: X.TField, inside: boolean): string[]
{
	if (field.kind === "raw")
		return field.data.enclosure === X.Enclosure.none ? 
			[".*?"] : 
			[X.Proxy.get(field.data.enclosure)];
	
	if (field.kind === "has")
	{
		const chars = field.match.map(e => X.Proxy.get(e))
		if (chars.length > 1)
		{
			chars.unshift("[");
			chars.push("]");
		}
		chars.push("?");
		return chars;
	}
	
	// If the field itself has an enclosure type defined on it, then we
	// don't actually need to deal with any further processing because
	// the pattern only needs to match a proxy character for the enclosure.
	// The field will have other constraints too (like one or many) but these
	// would be handled in the applicator rather than filtered in the regex.
	if (field.data.enclosure !== X.Enclosure.none)
	{
		const enclosure = X.Proxy.get(field.data.enclosure);
		return field.data.nullable ? ["(?:", enclosure, ")?"] : [enclosure];
	}
	
	const pattern: string[] = [];
	const nullables = field.data.nullableTokens;
	if (nullables.length)
		pattern.push(...nullables.map(t => X.Proxy.get(t)));
	
	// I'm pretty sure if it's a lasso then regardless of anything else we always
	// just perform a catch all in the regular expression? And then it becomes
	// the responsibility of the Applicator to make sense of it.
	if (field.kind === "lasso")
	{
		pattern.push(catchAllPattern);
		return field.data.nullable ? ["(?:", ...pattern, ")?"] : pattern;
	}
	
	const wildcard = field.kind === "one" ? 
		catchOnePattern : 
		catchAllPattern;
	
	const chars: string[] = [];
	const embeds: string[] = [];
	
	for (const match of field.match)
	{
		if (X.isSelectMatch(match))
			for (const fixedToken of Object.values(match))
				chars.push(X.Proxy.get(fixedToken));
		
		else if (X.FlexToken.isType(match))
			chars.push(X.Proxy.get(match));
		
		else if (match === X.RawToken)
			chars.push(X.Proxy.get(X.RawToken));
		
		else if (match === X.FixedToken)
		{
			pattern.push(field.kind === "many" ? catchAllPattern : wildcard);
			return field.data.nullable ? ["(?:", ...pattern, ")?"] : pattern;
		}
		else if (X.Mask.isType(match))
		{
			// If the Mask that we're trying to match has a certain
			// required enclosure, then match for that enclosure 
			// because that is ultimately what is going to exist in
			// the generated charstring. Note that it is intentional
			// that this is the first thing that gets checked after the
			// the match has been narrowed to a typeof Mask.
			if (match.descriptor.enclosure !== X.Enclosure.none)
				chars.push(X.Proxy.get(match.descriptor.enclosure));
			
			// In the case when you get a single wildcard pattern,
			// we just return with it. There's no point in keeping
			// anything that has been created or continuing to parse
			// anything else because we've already determined that
			// anything can match.
			else if (inside || !match.descriptor.insidePattern)
			{
				pattern.push(field.kind === "many" ? ".*?" : wildcard);
				return nullables.length ? ["(?:", ...pattern, ")?"] : pattern;
			}
			
			else
				embeds.push("(" + match.descriptor.insidePattern + ")");
				//embeds.push(match.schema.insidePattern);
		}
	}
	
	const optimized = optimizeIntoRanges(chars);
	const hasChars = optimized.chars.length > 0;
	const hasRanges = optimized.ranges.length > 0;
	const hasEmbeds = embeds.length > 0;
	
	if (!hasChars && !hasRanges && !hasEmbeds)
		throw "Unknown case";
	
	// Only 1 char
	if (optimized.chars.length === 1 && !hasRanges && !hasChars)
		pattern.push(optimized.chars[0]);
	
	// Only 1 embed
	else if (embeds.length === 1 && !hasRanges && !hasChars)
		pattern.push(embeds[0]);
	
	// No embeds and multiple of something else
	else if (!hasEmbeds)
		pattern.push("[", ...optimized.chars, ...optimized.ranges, "]");
	
	// Fallback case
	else
	{
		const group = [...optimized.chars, ...embeds].flatMap((s, i) => i > 0 ? ["|", s] : [s]);
		
		if (hasRanges)
		{
			if (group.length > 0)
				group.push("|");
			group.push("[", ...optimized.ranges, "]");
		}
		
		pattern.push("(", ...group, ")");
	}
	
	if (field.kind === "many")
		pattern.push("{0,}");
	
	if (field.kind === "some")
		pattern.push("{1,}");
	
	return field.data.nullable ? ["(?:", ...pattern, ")?"] : pattern;
}

/**
 * Takes an array of single unicode characters and identifies runs of 4 or more
 * sequentially consecutive code points, collapsing them into regex-style range
 * strings (e.g. "a-z"), returning those ranges separately alongside any
 * characters that were not absorbed into a range.
 */
function optimizeIntoRanges(chars: string[])
{
	const codes = chars.map(c => c.codePointAt(0)!).sort((a, b) => a - b);
	const rangedPairs: [number, number][] = [];
	let sequenceStart = -1;

	for (let i = 4; i <= codes.length; i++)
	{
		const [a, b, c, d] = codes.slice(i - 4, i);
		const continuing = a + 1 === b && b + 1 === c && c + 1 === d;

		if (continuing)
		{
			if (sequenceStart < 0)
				sequenceStart = i - 4;
		}
		else if (sequenceStart >= 0)
		{
			rangedPairs.push([codes[sequenceStart], codes[i - 2]]);
			sequenceStart = -1;
			i--;
		}
	}
	
	if (sequenceStart >= 0)
		rangedPairs.push([codes[sequenceStart], codes[codes.length - 1]]);

	const rangedCodes = new Set(
		rangedPairs.flatMap(([start, end]) =>
			Array.from({ length: end - start + 1 }, (_, i) => start + i)
		)
	);

	const remaining = codes
		.filter(code => !rangedCodes.has(code))
		.map(code => String.fromCodePoint(code));

	return {
		chars: remaining,
		ranges: rangedPairs.map(([start, end]) =>
			`${String.fromCodePoint(start)}-${String.fromCodePoint(end)}`
		),
	};
}

/** */
const catchAllPattern = ".+?";
const catchOnePattern = ".";

//# Other exported mask schema helpers

/** Helper type alias for creating Mask sum types.  */
export type Sum<T extends readonly any[]> = InstanceType<T[number]>;

/** Helper function for creating physical representations of Mask sum types. */
export function sum<const T extends readonly typeof X.Mask[]>(...types: T): T
{
	return types;
}

export const unset = Symbol("unset") as any;
