import * as X from "./X.ts";

/**
 * An object that stores information discovered at a specific point in a tape.
 */
export interface IFragmentCursor
{
	/** Stores the unmasked token at the current location, if one exists. */
	token: X.Token | X.Tape | null;
	
	/** Stores the mask at the current location, if one exists. */
	mask: X.Mask | null;
	
	/** 
	 * Stores the tokens at the current mask location that were covered by a mask.
	 * The array will be null in the case when there is no mask at the location.
	 */
	tokensCovered: (X.Token | X.Tape)[] | null;
}

/**
 * 
 */
export class Fragment
{
	/**
	 * Constructs a fragment from the specified tokens array.
	 * Be careful what you pass to the argument, the TapeFragment
	 * does a hostile take over of this reference once it has it.
	 * Consider it gone once this TapeFragment sees it.
	 */
	constructor(tokensToOwn: (X.Token | X.Tape)[])
	{
		const len = tokensToOwn.length;
		this._tokens = tokensToOwn;
		this.tokenSize = len;
		this.maskedSize = len;
		this.unmaskedTokenCount = len;
		
		// Populate the indexes with the sentinel to indicate that the 
		// indexes align with the token index.
		this.indexes = new Array(len).fill(TOKEN_SENTINEL);
	}
	
	/** */
	readonly lamport: number = 0;
	
	/**
	 * Gets the mask-ignoring length of the tape (only raw tokens are counted).
	 */
	readonly tokenSize: number = 0;
	
	/** 
	 * Gets the mask-aware length of the tape.
	 */
	readonly maskedSize: number = 0;
	
	/**
	 * Gets the number of tokens remaining in the tape
	 * that haven't been covered by at least one mask.
	 */
	readonly unmaskedTokenCount: number = 0;
	
	/**
	 * The physical token store. Child Tapes count as tokens here.
	 * Whitespace tokens are evicted in-place by read() — this array
	 * physically shrinks each time one is removed.
	 * Masks are never stored here; they live in masks[].
	 */
	get tokens(): readonly (X.Token | X.Tape)[]
	{
		return this._tokens;
	}
	private _tokens: (X.Token | X.Tape)[];
	
	/**
	 * Parallel to tokens[]. One entry per logical slot.
	 * 
	 * If i === TOKEN_SENTINEL, then the n in indexes[n] points
	 * to tokens[n]
	 * 
	 * Otherwise the value at indexes[n] points to the index of a mask in
	 * the masks arrary field.
	 * 
	 * Multiple consecutive slots sharing the same non-sentinel value were 
	 * all subsumed by the same mask.
	 */
	private indexes: number[];
	
	/** Mask store. */
	private masks: X.Mask[] = [];
	
	/**
	 * 
	 */
	slice(begin: number, end: number)
	{
		if (begin < 0 || end < 0)
			throw "Negative indexing not supported.";
		
		return new X.Lens(this, this.toTokenRelative(begin), this.toTokenRelative(end));
	}
	
	/**
	 * Rewrites the specified mask-aware tape range [from, to) to a single mask entry.
	 */
	applyMask(mask: X.Mask, from: number, to: number)
	{
		from = this.toTokenRelative(from);
		to = this.toTokenRelative(to);
		if (from < 0 || to > this._tokens.length || from >= to)
			throw new RangeError(`Tape.replace(): range [${from}, ${to}) is invalid.`);
		
		const evictLength = to - from;
		let evicted: X.Mask | null = null;
		for (let i = -1; ++i < evictLength;)
			evicted = this.evictMaskAt(from + i) || evicted;
		
		// Push the mask to the end.
		// No that that this can create masks that are out of order
		// That doesn't matter, we can restore the iteration order
		// by passing through the array of index pointers.
		const maskIndexPointer = this.masks.push(mask) - 1;
		
		// Make sure all this works when we debug through here
		const len = to - from;
		const injected = new Array(len).fill(maskIndexPointer);
		this.indexes.splice(from, len, ...injected);
		
		// Recount after evictions, which may expose tokens outside the new span.
		this._charstringCache = "";
		(this as X.TWritable<Fragment>).maskedSize = [...this.scan()].length;
		(this as X.TWritable<Fragment>).unmaskedTokenCount = this.indexes.filter(index => index === TOKEN_SENTINEL).length;
		
		return evicted;
	}
	
	/**
	 * Inserts a token or child Tape into the tape.
	 * 
	 * - If `at` is omitted the element is appended (safe at any stage).
	 * - If `at` is provided the element is spliced in at that logical index.
	 * - Inserting a whitespace token after read() has started (readHead > 0)
	 *   throws.
	 * - If the insertion point falls inside a masked run, the covering mask is
	 *   evicted and returned so the caller can decide what to re-parse.
	 * 
	 * Returns an array of evicted masks (empty when no masks were disturbed).
	 */
	insertToken(token: X.Token | X.Tape, at?: number): X.Mask | null
	{
		const insertAt = at ?? this._tokens.length;
		
		if (insertAt < 0 || insertAt > this._tokens.length)
			throw new RangeError(`Fragment.insert(): index ${insertAt} is out of range.`);
		
		let out: X.Mask | null = null;
		
		// If we're not appending, and therefore there is no way how
		// we could be impacting an applied mask, then attempt to
		// evict any mask that may exist at the inserted location.
		if (insertAt < this.indexes.length)
			out = this.evictMaskAt(insertAt);
		
		// Splice into the physical token store.
		this._tokens.splice(insertAt, 0, token);
		
		// Splice into the indexes
		this.indexes.splice(insertAt, 0, TOKEN_SENTINEL);
		
		// Update the cached value fields
		this._charstringCache = "";
		(this as X.TWritable<Fragment>).lamport++;
		(this as X.TWritable<Fragment>).tokenSize++;
		(this as X.TWritable<Fragment>).maskedSize++;
		(this as X.TWritable<Fragment>).unmaskedTokenCount++;
		return out;
	}
	
	/**
	 * Deletes a token at the specified token index, evicts and returns any affected masks.
	 */
	deleteToken(at: number): X.Mask | null
	{
		if (at < 0 || at > this._tokens.length)
			throw new RangeError(`Fragment.insert(): index ${at} is out of range.`);
		
		// If we have a mask that needs to be evicted, then before we
		// evict it we have to get it's token span because after eviction,
		// this info isn't going to be available so we need to capture it
		// before hand so that can update the unmasked count property.
		const mask = this.getMaskAtTokenIndex(at);
		const maskSpan = mask ? this.getMaskTokenSpan(mask) : 0;
		
		this.evictMaskAt(at);
		this._tokens.splice(at, 1);
		this.indexes.splice(at, 1);
		
		// Update the cached value fields
		this._charstringCache = "";
		(this as X.TWritable<Fragment>).lamport++;
		(this as X.TWritable<Fragment>).tokenSize--;
		
		if (mask)
		{
			// This needs to be decremented by the number
			// of tokens that the evicted mask was covering - 1.
			(this as X.TWritable<Fragment>).unmaskedTokenCount -= maskSpan - 1;
			(this as X.TWritable<Fragment>).maskedSize--;
		}
		
		return  mask;
	}
	
	/** Mask-aware index lookup. */
	at(index: number)
	{
		let count = 0;
		for (const cursor of this.scan())
			if (index === count++)
				return cursor.mask || cursor.token;
		
		throw "Index out of range";
	}
	
	/** Used as runtime to convert a tape into it's charstring representation. */
	get charstring()
	{
		if (this._charstringCache)
			return this._charstringCache;
		
		const chars: string[] = [];
		
		for (const cursor of this.scan())
		{
			const element = cursor.mask || cursor.token;
			chars.push(X.Proxy.get(element));
		}
		
		return this._charstringCache = chars.join("");
	}
	private _charstringCache = "";
	
	/** Gets the readable version of the charstring, for debugging purposes. */
	get charstringReadable()
	{
		return X.Proxy.resolveString(this.charstring);
	}
	
	/**
	 * Performs a non-recursive scan of the token and mask sequence
	 * of the fragments contained with in the Tape.
	 */
	* scan()
	{
		for (let index = -1; ++index < this.indexes.length;)
		{
			const maybeMaskIndex = this.indexes[index];
			
			// If maybeMaskIndex is the sentinel, then it's not
			// a mask index and the index refers to a token
			if (maybeMaskIndex === TOKEN_SENTINEL)
			{
				yield {
					token: this.tokens[index],
					mask: null,
					tokensCovered: null,
				};
			}
			// Skip over duplicate non-sentinel indexes because
			// these are the physical index of the same mask
			// and we don't want to yield it multiple times.
			else if (maybeMaskIndex !== this.indexes[index - 1])
			{
				const tokensCovered: (X.Token | X.Tape)[] = [];
				for (let i = -1; ++i < this.indexes.length;)
					if (this.indexes[i] === maybeMaskIndex)
						tokensCovered.push(this.tokens[i]);
				
				yield {
					token: null,
					mask: this.masks[maybeMaskIndex],
					tokensCovered,
				};
			}
		}
	}
	
	/**
	 * Translates a mask-relative index into the corresponding token-relative
	 * index. Counting is done left-to-right over the slot list, where a
	 * slot is either a single unmasked token, or a contiguous run of
	 * physical positions covered by the same mask.
	 * 
	 * If the resulting slot is masked, the lowest physical index covered
	 * by that mask is returned (i.e. the start of the mask's span), not
	 * wherever in the middle of the run the count happened to land.
	 */
	toTokenIndex(maskRelativeIndex: number)
	{
		let count = -1;
		
		for (let i = -1; ++i < this.indexes.length;)
		{
			const maybeMaskIndex = this.indexes[i];
			
			// Only increment the mask-relative counter when crossing
			// into a new slot value. A run of identical mask pointers
			// is one slot; sentinels are always their own slot.
			if (maybeMaskIndex === TOKEN_SENTINEL || maybeMaskIndex !== this.indexes[i - 1])
				count++;
			
			if (count === maskRelativeIndex)
				return i;
		}
		
		throw new RangeError(`Index ${maskRelativeIndex} is out of range.`);
	}
	
	/**
	 * Translates a mask-relative index into the corresponding token-relative
	 * index. Counting is done left-to-right over the slot list, where a
	 * slot is either a single unmasked token, or a contiguous run of
	 * physical positions covered by the same mask.
	 * 
	 * If the resulting slot is masked, the lowest physical index covered
	 * by that mask is returned (i.e. the start of the mask's span), not
	 * wherever in the middle of the run the count happened to land.
	 */
	toTokenRelative(maskRelativeIndex: number)
	{
		if (maskRelativeIndex < 0)
			throw new RangeError(`Index ${maskRelativeIndex} is out of range.`);
		
		if (maskRelativeIndex === 0 && this.indexes.length === 0)
			return 0;
		
		let count = -1;
		
		for (let i = -1; ++i < this.indexes.length;)
		{
			const maybeMaskIndex = this.indexes[i];
			
			if (maybeMaskIndex === TOKEN_SENTINEL || maybeMaskIndex !== this.indexes[i - 1])
				count++;
			
			if (count === maskRelativeIndex)
				return i;
		}
		
		// maskRelativeIndex is exactly one past the last slot — the
		// boundary case used by slice()'s exclusive `to`. This is the
		// only value past the last real slot that's still valid; count
		// is now sitting on the index of the final slot, so the
		// token-relative boundary is just past the physical end.
		if (count + 1 === maskRelativeIndex)
			return this.indexes.length;
		
		throw new RangeError(`Index ${maskRelativeIndex} is out of range.`);
	}
	
	/**
	 * Translates a token-relative index into the corresponding mask-relative
	 * index. Counting is done left-to-right over the slot list, where a
	 * slot is either a single unmasked token, or a contiguous run of
	 * physical positions covered by the same mask.
	 * 
	 * If the token at tokenRelativeIndex is covered by a mask, the
	 * mask-relative index of that mask's slot is returned (regardless of
	 * whether the token is the first, last, or a middle token under it).
	 */
	toMaskRelative(tokenRelativeIndex: number)
	{
		const len = this.indexes.length;
		
		if (tokenRelativeIndex < 0 || tokenRelativeIndex > len)
			throw new RangeError(`Index ${tokenRelativeIndex} is out of range.`);
		
		const scanTo = Math.min(tokenRelativeIndex, len - 1);
		let count = -1;
		
		for (let i = -1; ++i <= scanTo;)
		{
			const maybeMaskIndex = this.indexes[i];
			
			if (maybeMaskIndex === TOKEN_SENTINEL || maybeMaskIndex !== this.indexes[i - 1])
				count++;
		}
		
		return tokenRelativeIndex === len ? count + 1 : count;
	}
	
	//# Private Helpers
	
	/**
	 * Finds any mask that covers the logical position `at` and removes it,
	 * and redirects index pointers to point  token pointers. 
	 * Returns the evicted mask if any.
	 */
	private evictMaskAt(at: number): X.Mask | null
	{
		if (at >= this.indexes.length)
			return null;
		
		const maskIndex = this.indexes[at];
		if (maskIndex === TOKEN_SENTINEL)
			return null; // If the index at the input position isn't masked.
		
		const maskEvicted = this.masks[maskIndex];
		
		// Restore all slots that shared this mask pointer back to identity.
		for (let i = 0; i < this.indexes.length; i++)
			if (this.indexes[i] === maskIndex)
				this.indexes[i] = TOKEN_SENTINEL;
		
		this.masks.splice(maskIndex, 1);
		for (let i = 0; i < this.indexes.length; i++)
			if (this.indexes[i] !== TOKEN_SENTINEL && this.indexes[i] > maskIndex)
				this.indexes[i]--;
		
		this._charstringCache = "";
		return maskEvicted;
	}
	
	/**
	 * Returns the mask at the specified token index,
	 * or null if that token is not masked.
	 */
	private getMaskAtTokenIndex(tokenIndex: number)
	{
		const idx = this.indexes[tokenIndex];
		return idx === TOKEN_SENTINEL ? null : this.masks[idx];
	}
	
	/**
	 * Gets the number of tokens that the specified mask is covering in
	 * the index list. Returns 0 if the mask wasn't found in the masks array.
	 */
	private getMaskTokenSpan(mask: X.Mask)
	{
		const idx = this.masks.findIndex(m => m === mask);
		
		// Mask is not in the mask array
		if (idx < 0)
			return 0;
		
		const indexPointerNeedle = -(idx + 1);
		let span = 0;
		
		for (let i = -1; ++i < this.indexes.length;)
			if (this.indexes[i] === indexPointerNeedle)
				span++;
		
		return span;
	}
}

/**
 * The token index sentinel is a value that when added to an indexes
 * array, indicates the the indexor of the indexes array aligns with the
 * value of the token in the tokens array. This is a cheat code to avoid
 * having to remap indexes when the indexes array is mutated.
 */
const TOKEN_SENTINEL = 0xFFFF;
