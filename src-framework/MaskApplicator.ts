import * as X from "./X.ts";

type TMatchableField = X.IOneField | X.ILassoField | X.IManyField | X.ISomeField;

/**
 * Attempts to apply the apex masks over the specified tape.
 */
export function applyApexMasks(tape: X.Tape, masks: readonly typeof X.Mask[])
{
	const apexCandidates = masks.map(m => m.descriptor);
	return applyMasks(tape, apexCandidates);
}

/**
 * Attempts to apply a mask from set of mask candidates
 * over the provided unread tape, sequentially, until the tape
 * has been fully exhausted.
 */
function applyMasks(tape: X.Tape, candidates: X.MaskDescriptor[])
{
	// There has to be an opportunity for there to be a field here
	// because this whole thing here about candidates and mask applying
	// might be trying to construct each of the fields for a mask
	
	const masks: X.Mask[] = [];
	
	next: for (const subTape of tape.read())
	{
		for (const descriptor of candidates)
		{
			const maskResult = tryApplyMask(subTape, descriptor);
			if (maskResult)
			{
				masks.push(...maskResult);
				continue next;
			}
		}
		
		console.error("Fragment could not be masked");
	}
	
	return masks;
}

/**
 * Attempts to apply a single mask to a tape.
 * Returns a boolean indicating whether the
 * tape has been fully covered by masks.
 */
function tryApplyMask(
	tape: X.TapeLike,
	descriptor: X.MaskDescriptor,
	depth = 0)
{
	let matchTarget = tape;
	let applyFrom: number | null = null;
	let applyTo: number | null = null;
	
	if (descriptor.enclosure !== X.Enclosure.none)
	{
		const enclosed = tape.at(0);
		if (!(enclosed instanceof X.Tape))
			return null;
		
		if (enclosed.enclosure !== descriptor.enclosure)
			return null;
		
		enclosed.readAll();
		matchTarget = enclosed;
		applyFrom = 0;
		applyTo = 1;
	}
	
	const matcher = descriptor.enclosureIgnoringMatcher;
	if (!matcher)
		return null;
	
	const matchesArray = Array.from(matchAll(matchTarget.charstring, matcher))
		.filter((m): m is RegExpMatchArray => !!m)
		.map(sanitizeMatches)
		.filter((m): m is TMatches => !!m);
	
	if (matchesArray.length === 0)
		return null;
	
	let masks: X.Mask[] | null = null;
	
	// Match the matcher regular expression against the charstring.
	// This handles both the case where current type is a sparse mask
	// and a non-sparse mask. Sparsity is already baked into the
	// computed regular expression at this point.
	// We have to go backwards because applying masks causes
	// the tape coordinates to move around, so if you go start to end
	// you'll have messed up coordinates, if you go end to start you
	// can dodge this.
	for (let i = -1; ++i < matchesArray.length;)
	{
		const mask = new (descriptor.type as any)(); // 🫤
		const matches = matchesArray[i];
		
		// Anchor the parent span before child masks collapse its visible slots.
		const maskFrom = applyFrom ?? matches.from;
		const maskTo = applyTo ?? matches.to;
		const parentSpan = tape.slice(maskFrom, maskTo);
		
		for (const [name, field] of Object.entries(descriptor.schema))
			if (!X.isAnchorProperty(name))
				mask[name] = getFieldDefaultValue(field as X.TField);
		
		for (let g = matches.groups.length; g-- > 0;)
		{
			const group = matches.groups[g];
			const field = descriptor.schema[group.name];
			
			// If there is a zero-length result then there is no point
			// in continuing we can just assign the field's default value.
			if (group.start === group.end)
			{
				mask[group.name] = getFieldDefaultValue(field);
				continue;
			}
			
			const lens = 
				matchTarget instanceof X.Tape && 
				group.start === 0 && 
				group.end === matchTarget.maskedSize ?
					matchTarget :
					matchTarget.slice(group.start, group.end);
			
			const value = getFieldValue(lens, field, depth + 1);
			// Proxy characters represent a token family. Validate specialized flex
			// fields after the structural match before committing the mask.
			if (value == null)
				return null;
			
			mask[group.name] = value;
		}
		
		const matchSpan = maskTo - maskFrom;
		parentSpan.applyMask(mask as X.Mask, 0, parentSpan.maskedSize);
		
		// If the match span was > 1, then go through all masks that exist after 
		// the current one in the array and bump their index positions by the 
		// match span. The reason it's > 1 is because the mask itself is worth
		// one space in the underlying token sequence so the indexes aren't
		// actually affected unless the mask spans multiple tokens. The reason
		// we're doing it like this instead of just doing the mask application in
		// reverse order is because this causes arrays to be reversed downstream.
		if (matchSpan > 1)
		{
			for (let n = i + 1; n < matchesArray.length; n++)
			{
				const matches = matchesArray[n];
				matches.from -= matchSpan - 1;
				matches.to -= matchSpan - 1;
				
				for (const group of matches.groups)
				{
					group.start -= matchSpan - 1;
					group.end -= matchSpan - 1;
				}
			}
		}
		
		if (!masks)
			masks = [];
		
		masks.push(mask);
	}
	
	return masks;
}

/**
 * 
 */
function getFieldValue(tapeLike: X.TapeLike, field: X.TField, depth = 0)
{
	// It's easier to just special-case all the empties here to avoid
	// having to guard against a bunch of index-out-of-range
	// issues that will otherwise come up downstream.
	if (tapeLike.tokenSize === 0)
	{
		if (field.kind === "one" || field.kind === "lasso")
			return null;
		
		if (field.kind === "many" || field.kind === "some")
			return [];
		
		if (field.kind === "has")
			return false;
		
		if (field.kind === "raw")
			return "";
		
		throw 0;
	}
	
	if (field.kind === "raw" && field.data.enclosure === X.Enclosure.none)
		return ensure(tapeLike.at(0), X.RawToken);
	
	if (field.kind === "has")
		return field.match.every((fixed, i) => tapeLike.at(i) === fixed);

	// Nullable-field anchors participate in the field's matched span, but are
	// structural syntax rather than part of the field value itself.
	if (field.data.nullableTokens.length > 0)
	{
		const anchors = field.data.nullableTokens;
		if (!anchors.every((fixed, i) => tapeLike.at(i) === fixed))
			return getFieldDefaultValue(field);
		
		tapeLike = tapeLike.slice(anchors.length, tapeLike.maskedSize);
	}
	
	// ---------------------------------------------
	// FIELD-LEVEL TAPE UNWRAPPING
	// ---------------------------------------------
	// If the field has a required enclosure, then this check will unwrap that
	// enclosure and give us the original tape. It also returns null if we don't
	// actually have a tape and a tape was required, although according to my
	// current understanding this actually should create an unknown state
	// because if we got to this point, it obviously means that the tape matched
	// and if the tape matched then how do we not have an enclosure in the
	// expected location?
	let unwrapped = false;
	if (field.data.enclosure !== X.Enclosure.none)
	{
		// If the first element of the tape isn't another tape,
		// then there is nothing to recurse into so just quit.
		const innerTape = tapeLike.at(0);
		if (!(innerTape instanceof X.Tape))
			return null;
		
		// If the enclosure of the tape we're looking at doesn't match
		// the enclosure that's required then quit.
		if (innerTape.enclosure !== field.data.enclosure)
			return null;
	
		tapeLike = innerTape;
		unwrapped = true;
	}
	
	if (field.kind === "raw")
		return tapeLike.tokenSize === 0 ? X.RawToken.new("") : ensure(tapeLike.at(0), X.RawToken);

	if (field.data.matchesOnlyFlexes)
		return getMatchFieldValueOnlyFlex(tapeLike, field);
	
	if (field.data.matchesOnlySelects)
		return getMatchFieldValueOnlySelect(tapeLike, field);
	
	if (field.kind === "one")
	{
		if (tapeLike instanceof X.Tape)
			tapeLike.readAll();
		
		// The tape is expected to be element item long.
		return getMatchFieldValue(tapeLike, field, depth);
	}
	
	if (field.kind === "lasso")
		return getLassoFieldValue(tapeLike, field, depth);
	
	if (field.kind === "many" || field.kind === "some")
	{
		// If the tapeLike is actually a tape, then that makes that the Tape
		// has not been read into fragments, and so we need to do that.
		if (tapeLike instanceof X.Tape)
		{
			const array: any[] = [];
			for (const subTape of tapeLike.readFragments())
			{
				const value = field.match.includes(X.RawToken) ?
					getRepeatedFieldValues(subTape, field, depth) : 
					getMatchFieldValue(subTape, field, depth);
				
				if (value)
					array.push(...X.toArray(value));
			}
			return array;
		}
		else
		{
			return getRepeatedFieldValues(tapeLike, field, depth);
		}
	}
	
	throw 0;
}

/** Resolve consecutive items, including text alternating with expression islands. */
function getRepeatedFieldValues(
	tapeLike: X.TapeLike,
	field: X.IManyField | X.ISomeField,
	depth: number): any[] | null
{
	// Prefer the longest complete item so optional suffixes stay attached.
	const values: any[] = [];
	let index = 0;
	while (index < tapeLike.maskedSize)
	{
		let value: any = null;
		for (let end = tapeLike.maskedSize; end > index; end--)
		{
			value = getMatchFieldValue(tapeLike.slice(index, end), field, depth);
			if (value !== null)
				break;
		}
		if (value === null)
			return null;

		values.push(value);
		// A resolved mask occupies one slot; raw tokens already occupy one.
		index++;
	}
	return values;
}

/** Resolves a lasso field as one logical sequence of accepted alternatives. */
function getLassoFieldValue(tapeLike: X.TapeLike, field: X.ILassoField, depth = 0)
{
	const values: any[] = [];
	
	if (tapeLike instanceof X.Tape)
	{
		for (const subTape of tapeLike.readFragments())
		{
			const value = getLassoFieldValue(subTape, field, depth);
			if (value === null)
				return null;
			
			values.push(...X.toArray(value));
		}
		return values.length === 0 ? null : values;
	}
	
	let index = 0;
	while (index < tapeLike.maskedSize)
	{
		let value: any = null;
		for (let end = tapeLike.maskedSize; end > index; end--)
		{
			value = getMatchFieldValue(tapeLike.slice(index, end), field, depth);
			if (value !== null)
				break;
		}
		if (value === null)
			return null;

		values.push(value);
		index++;
	}
	
	return values.length === 0 ? null : values;
}

/**
 * 
 */
function getMatchFieldValue(tapeLike: X.TapeLike, field: TMatchableField, depth = 0)
{
	// Go through each match possibility, and try to fit the tape in it's entirety
	// into it, breaking when the first match becomes successful.
	for (const match of field.match)
	{
		if (X.Mask.isType(match))
		{
			const e = tapeLike.at(0);
			if (e instanceof match)
				return e;
			
			const unmaskedTokenCountBefore = tapeLike.unmaskedTokenCount;
			const result = tryApplyMask(tapeLike, match.descriptor, depth + 1);
			if (result === null)
				continue;
			
			if (tapeLike.unmaskedTokenCount > 0)
			{
				if (tapeLike.unmaskedTokenCount === unmaskedTokenCountBefore)
					throw "Unknown state? How did we get a result if nothing was masked?";
				
				// If we still have unmasked tokens, then that means we need to take
				// another run at the next match to keep matching things.
				continue;
			}
			
			return result.length === 1 ? result[0] : result;
		}
		else if (X.FlexToken.isType(match))
		{
			if (tapeLike.maskedSize !== 1)
				continue;
			
			const e = tapeLike.at(0);
			if (e instanceof match)
				return e;
		}
		else if (match === X.RawToken)
		{
			if (tapeLike.maskedSize !== 1)
				continue;
			
			const e = tapeLike.at(0);
			if (e instanceof X.RawToken)
				return e;
		}
		else if (match === X.FixedToken)
		{
			if (tapeLike.maskedSize !== 1)
				continue;
			
			const e = tapeLike.at(0);
			if (e instanceof X.FixedToken)
				return e;
		}
		else if (X.isSelectMatch(match))
		{
			if (tapeLike.maskedSize !== 1)
				continue;
			
			const e = tapeLike.at(0);
			if (X.isSelectMatchMember(e, match))
				return e;
		}
	}
	
	return null;
}

/**
 * Optimization path that deals exclusively with fields that only match with flex tokens.
 */
function getMatchFieldValueOnlyFlex(tapeLike: X.TapeLike, field: TMatchableField)
{
	const matches = field.match as typeof X.FlexToken[];
	if (X.DEBUG)
		if (!matches.every(m => X.FlexToken.isType(m)))
			throw "Unknown state";
	
	if (field.kind === "one")
	{
		const e = tapeLike.at(0);
		for (const match of matches)
			if (e instanceof match)
				return e;
	}
	else if (field.kind === "many" || field.kind === "some")
	{
		// Go through the entire tape and return an array 
		// containing all the flex tokens that match.
		const array: X.FlexToken[] = [];
		
		for (const cursor of tapeLike.scan())
		{
			const element = cursor.mask || cursor.token;
			for (const match of matches)
				if (element instanceof match)
					array.push(element);
		}
		
		return array;
	}
	else if (field.kind === "lasso")
		throw "Not implemented.";
}

/**
 * 
 */
function getMatchFieldValueOnlySelect(tapeLike: X.TapeLike, field: TMatchableField)
{
	const matches = field.match as X.TSelect[];
	if (X.DEBUG)
		if (!matches.every(m => X.isSelectMatch(m)))
			throw "Unknown state";
	
	if (field.kind === "one")
	{
		const e = tapeLike.at(0);
		for (const match of matches)
			if (X.isSelectMatchMember(e, match))
				return e;
	}
	else if (field.kind === "many" || field.kind === "some")
	{
		const array: X.FixedToken[] = [];
		
		for (const cursor of tapeLike.scan())
		{
			const element = cursor.mask || cursor.token;
			for (const match of matches)
				if (X.isSelectMatchMember(element, match))
					array.push(element as X.FixedToken);
		}
		
		return array;
	}
	else if (field.kind === "lasso")
		throw "Not implemented.";
}


/** Safe matchAll function that avoids exceptions being thrown */
function * matchAll(input: string, pattern: RegExp)
{
	if (!pattern.flags.includes("g"))
		yield input.match(pattern);
	
	else for (const matches of input.matchAll(pattern))
		yield matches;
}

/** */
type TMatches = {
	groups: TMatchedGroup[];
	from: number;
	to: number;
};

/** */
type TMatchedGroup = {
	name: string;
	start: number;
	end: number;
};

/**
 * Normalizes a single RegExpMatchArray (with indices) into a clean,
 * duplication-free structure: the per-field spans (named groups only,
 * skipping any that didn't participate in this match), plus the overall
 * span of the match as a whole (group 0), which covers any unnamed/
 * anchor tokens the named groups don't account for.
 */
function sanitizeMatches(matches: RegExpMatchArray): TMatches | null
{
	if (!matches.indices)
		return null;
	
	const wholeMatch = matches.indices[0];
	if (!wholeMatch)
		return null;
	
	const [from, to] = wholeMatch;
	const fields: TMatchedGroup[] = [];
	
	if (matches.indices.groups)
	{
		for (const [name, span] of Object.entries(matches.indices.groups))
		{
			if (!span)
				continue;
			
			const [start, end] = span;
			fields.push({ name, start, end });
		}
	}
	
	return { groups: fields, from, to };
}

/** */
function getFieldDefaultValue(field: X.TField)
{
	if (field.data.nullable)
		return null;

	switch (field.kind)
	{
		case "has": return false;
		case "lasso": return null;
		case "one": return null;
		case "many": return [];
		case "some": return [];
		case "raw": return null;
	}
	
	throw 0;
}

/** */
function ensure<T extends abstract new (...args: any[]) => any>(
	value: unknown, 
	kind: T): InstanceType<T>
{
	if (!(value instanceof kind))
		throw new Error("Value is not of the appropriate type.");
	
	return value as InstanceType<T>;
}

/** */
