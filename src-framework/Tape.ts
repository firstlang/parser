import * as X from "./X.ts";

/**
 * A Tape element can have parsed items in them, but additionally, they can
 * also have Masks. This may seem like it's cart-before-horse. How can a tape
 * have a mask if masks haven't been created yet? It's because tapes need
 * to be incrementally rewritable into Mask graphs. You don't create a separate
 * Mask tree that is adjacent to the Tape tree... thinking that you should is an
 * indication that you may have contracted functionalitis.
 */
export type TapeElement = Tape | X.Token;

/**
 * 
 */
export type TapeLike = Tape | X.Fragment | X.Lens;

/**
 * An object that stores information discovered at a specific point in a tape.
 */
export interface ITapeNavigationCursor extends X.IFragmentCursor
{
	/** */
	containingTape: X.Tape;
}

/** */
export class Tape
{
	/** */
	constructor(fragmenter: X.FixedToken | null, enclosure: X.Enclosure = X.Enclosure.none)
	{
		this.fragmenter = fragmenter;
		this.enclosure = enclosure;
	}
	
	/** */
	readonly lamport: number = 0;
	
	/***/
	readonly enclosure: X.Enclosure;
	
	/** Stores the separator token that forces a fragment into existence. */
	private readonly fragmenter: X.FixedToken | null;
	
	/** */
	private readonly fragments: X.Fragment[] = [];
	
	/** */
	private readonly unreadTokens: (X.Token | X.Tape)[] = [];

	/** Visits all fragments, including enclosure contents already read for matching. */
	* readFragments(): IterableIterator<X.Fragment>
	{
		this.readAll();
		yield* this.fragments;
	}
	
	/**
	 * Reads the tape into fragments, evicting whitespace on discovery.
	 * 
	 * Fragment boundaries are determined by:
	 *   - A comma token (static delimiter)
	 *   - A newline followed by content at an indent level <= the fragment's
	 *     base indent (same logic as the original TapeReader)
	 * 
	 * The readHead is advanced past every token consumed (whitespace is
	 * evicted without advancing the conceptual index, because the slot
	 * literally disappears from the array).
	 * 
	 * Yielded Lens slices use post-eviction indexes.
	 */
	* read(): Generator<X.Fragment>
	{
		while (this.unreadTokens.length > 0)
		{
			let baseIndent = 0;
			let seenContent = false;
			const tokenQueue: (X.Token | X.Tape)[] = [];
			
			while (this.unreadTokens.length > 0)
			{
				//const el = this.tokens[this.readHead];
				const token = this.unreadTokens.shift();
				if (!token)
					return;
				
				// --- Whitespace eviction ---
				// Evict leading whitespace before content is seen.
				if (!seenContent)
				{
					if (token instanceof X.NewlineToken)
					{
						// A bare newline before any content: reset indent, evict.
						baseIndent = 0;
						// readHead stays the same — the slot is gone, the next
						// token has slid into this position.
						continue;
					}
					
					if (token instanceof X.WhitespaceToken)
					{
						baseIndent += token.text.length;
						continue;
					}
					
					seenContent = true;
				}
				
				// Fragment delimiter: comma
				if (token === this.fragmenter)
					break;
				
				// Fragment delimiter: newline + indent check
				if (token instanceof X.NewlineToken)
				{
					// Peek at what follows to measure next-line indent.
					const next = this.unreadTokens[0];
					const nextIndent = next instanceof X.SpaceToken ? next.text.length : 0;
					
					if (nextIndent > baseIndent)
					{
						// Continuation line — evict the leading spaces and keep going.
						if (next instanceof X.SpaceToken)
							this.unreadTokens.shift();
						
						continue;
					}
					
					// Indent dropped — end of fragment.
					break;
				}
				
				tokenQueue.push(token);
			}
			
			// Nothing was consumed (e.g. only whitespace at end of tape).
			if (tokenQueue.length === 0)
				return;
			
			const fragment = new X.Fragment(tokenQueue);
			this.fragments.push(fragment);
			yield fragment;
		}
	}
	
	/**
	 * Forces the entire tape to be read into fragments.
	 * Useful for tests.
	 */
	readAll()
	{
		Array.from(this.read());
	}
	
	/**
	 * Gets the total number of tokens of the tape (only raw tokens are counted).
	 * The value is computed from the total number of tokens of all fragments
	 * inside this tape.
	 */
	get tokenSize()
	{
		return this.totalFragmentSize + this.unreadTokens.length;
	}
	
	/** 
	 * Gets the total number of tokens that exist across all fragments. Only tokens
	 * that have been read from the stream and have been moved into Fragment
	 * objects are counted in this total.
	 */
	private get totalFragmentSize()
	{
		return this.fragments.reduce((acc, frag) => acc + frag.tokenSize, 0);
	}
	
	/** 
	 * Gets the mask-aware length of the tape. The value is computed from 
	 * mask-aware length of all fragments inside this tape.
	 */
	get maskedSize()
	{
		return this.fragments.reduce((acc, frag) => acc + frag.maskedSize, 0) + this.unreadTokens.length;;
	}
	
	/** */
	get unmaskedTokenCount()
	{
		return this.fragments.reduce((acc, frag) => acc + frag.unmaskedTokenCount, 0)  + this.unreadTokens.length;;
	}
	
	/** */
	get totalSize()
	{
		return this.tokenSize + this.unreadTokens.length;
	}
	
	/**
	 * Slices a span of tokens and returns a Lens that is anchored to
	 * this slice boundary. The coordinates are relative to the Tape's
	 * masked elements, not the raw tokens.
	 */
	slice(begin: number, end: number)
	{
		if (X.DEBUG && this.unreadTokens.length > 0 && this.fragments.length === 0)
			throw "Tape has not been read() yet.";
		
		const fragInfo = this.findFragment(begin);
		if (!fragInfo)
			throw "Slice index out of range.";
		
		return fragInfo.fragment.slice(begin - fragInfo.begin, end - fragInfo.begin);
	}
	
	/**
	 * Adds a token to the unread tokens array.
	 * This method is intended to be used during loading.
	 */
	append(token: X.Token | X.Tape)
	{
		this.unreadTokens.push(token);
	}
	
	/**
	 * Adds a token to an existing fragment.
	 * If the Tape has no fragments then the Tape has not been
	 * loaded and doesn't support insertion.
	 */
	insertToken(token: X.Token | X.Tape, at?: number): X.Mask | null
	{
		if (this.tokenSize === 0 || this.fragments.length === 0)
			throw "Cannot insert in this Tape. Use append()";
		
		const insertAt = at ?? this.tokenSize;
		
		// If the insertAt location is the same as the token size,
		// this means we're adding the token to the end of the
		// final fragment.
		if (insertAt === this.tokenSize)
		{
			const fragment = this.fragments.at(-1)!;
			fragment.insertToken(token, fragment.tokenSize);
			return null;
		}
		
		const result = this.findFragment(insertAt);
		return result ?
			result.fragment.insertToken(token, insertAt - result.begin) :
			null;
	}
	
	/** */
	deleteToken(at: number): X.Mask | null
	{
		if (this.tokenSize === 0 || this.fragments.length === 0)
			throw "Cannot delete from this Tape.";
		
		const result = this.findFragment(at);
		return result ?
			result.fragment.deleteToken(at - result.begin) :
			null;
	}
	
	/** */
	applyMask(mask: X.Mask, from: number, to: number)
	{
		const result = this.findFragment(from);
		return result ?
			result.fragment.applyMask(mask, from - result.begin, to - result.begin) :
			null;
	}
	
	/** */
	get charstring()
	{
		const fragCharstring = this.fragments.map(f => f.charstring).join("");
		const unreadCharstring = this.unreadTokens.map(t => X.Proxy.get(t)).join("");
		return fragCharstring + unreadCharstring;
	}
	
	/** */
	get charstringReadable()
	{
		return X.Proxy.resolveString(this.charstring);
	}
	
	/** Mask-aware index lookup. */
	at(index: number)
	{
		const fragSize = this.totalFragmentSize;
		if (index < fragSize)
		{
			const result = this.findFragment(index);
			if (!result)
				throw "Index out of range.";
			
			return result.fragment.at(index - result.begin);
		}
		
		return this.unreadTokens[index - fragSize];
	}
	
	/**
	 * Scans through each fragment in the tape, as well as any other trailing tokens,
	 * and yield information about what is found at each slot.
	 */
	* scan()
	{
		for (const fragment of this.fragments)
			yield * fragment.scan();
		
		for (const token of this.unreadTokens)
		{
			yield {
				token,
				mask: null,
				tokensCovered: null,
			}
		}
	}
	
	/** 
	 * Stub.
	 * Defers to Fragment.toTokenRelative once Tape-level offset bookkeeping is worked out. 
	 */
	toTokenRelative(maskRelativeIndex: number): number
	{
		throw "Not implemented";
	}
	
	/**
	 * Stub.
	 * Defers to Fragment.toMaskRelative once Tape-level offset bookkeeping is worked out.
	 */
	toMaskRelative(tokenRelativeIndex: number): number
	{
		throw "Not implemented";
	}
	
	//# Utilities
	
	/** Finds a fragment from the specified mask-relative index. */
	private findFragment(maskRelativeIndex: number)
	{
		let size = 0;
		const len = this.fragments.length;
		
		for (let i = -1; ++i < len;)
		{
			const fragment = this.fragments[i];
			if (maskRelativeIndex < size + fragment.maskedSize || i >= len - 1)
				return { fragment, begin: size };
			
			size += fragment.maskedSize;
		}
		
		// No fragments
		return null;
	}
}
