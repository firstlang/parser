import * as X from "./X.ts";

/**
 * A Lens defines a range over a Tape or a Fragment with token-relative
 * slice boundaries. Do not instantiate Lens directly. Instead, use the .slice()
 * method on another TapeLike instance.
 */
export class Lens
{
	/**  */
	constructor(
		source: X.Tape | X.Fragment,
		sourceSliceTokenBegin: number,
		sourceSliceTokenEnd: number)
	{
		this.source = source;
		this.lamport = source.lamport;
		this.sliceBegin = sourceSliceTokenBegin;
		this.sliceEnd = sourceSliceTokenEnd;
	}
	
	/** Should this actually just be a TapeFragment?. */
	private readonly source: X.Fragment | X.Tape;
	
	/** */
	private lamport: number;
	
	/** 
	 * Stores the token-relative beginning slice boundary
	 * of the underlying Tape or Fragment source.
	 */
	private readonly sliceBegin: number;
	
	/** 
	 * Stores the token-relative ending slice boundary
	 * of the underlying Tape or Fragment source.
	 */
	private readonly sliceEnd: number;
	
	/** */
	private get sliceBeginMaskRelative()
	{
		return this.source.toMaskRelative(this.sliceBegin);
	}
	
	/** */
	private get sliceEndMaskRelative()
	{
		return this.source.toMaskRelative(this.sliceEnd);
	}
	
	/** */
	get tokenSize()
	{
		this.checkLamports();
		return this.sliceEnd - this.sliceBegin;
	}
	
	/**
	 * Gets the masked size specifically of the section of the
	 * source tape or fragment that this Lens can see.
	 */
	get maskedSize()
	{
		const counts = this.getCounts();
		return counts.nonMaskCount + counts.maskCount;
	}
	
	/**
	 * Gets the unmasked token count specifically of the section of the
	 * source tape or fragment that this Lens can see.
	 */
	get unmaskedTokenCount()
	{
		const counts = this.getCounts();
		return counts.nonMaskCount;
	}
	
	/** */
	private getCounts()
	{
		this.checkLamports();
		
		const masks = new Set<X.Mask>();
		let nonMaskCount = 0;
		
		for (let i = this.sliceBeginMaskRelative; i < this.sliceEndMaskRelative; i++)
		{
			const element = this.source.at(i);
			if (element instanceof X.Mask)
				masks.add(element);
			else
				nonMaskCount++;
		}
		
		return {
			maskCount: masks.size,
			nonMaskCount,
		};
	}
	
	/**
	 * Pass-through slice method.
	 */
	slice(from: number, to: number)
	{
		this.checkLamports();
		const fromMaskRelative = this.sliceBeginMaskRelative + from;
		const toMaskRelative = this.sliceBeginMaskRelative + to;
		const fromTokenRelative = this.source.toTokenRelative(fromMaskRelative);
		const toTokenRelative = this.source.toTokenRelative(toMaskRelative);
		return new Lens(this.source, fromTokenRelative, toTokenRelative);
	}
	
	/**
	 * Rewrites the specified mask-aware tape range (from, to) to a single mask entry.
	 */
	applyMask(mask: X.Mask, from: number, to: number)
	{
		this.checkLamports();
		const begin = this.sliceBeginMaskRelative;
		from += begin;
		to += begin;
		return this.source.applyMask(mask, from, to);
	}
	
	/** */
	insertToken(token: X.Token | X.Tape, at?: number)
	{
		this.checkLamports();
		this.lamport++;
		const insertAt = at ?? this.source.tokenSize;
		return this.source.insertToken(token, this.sliceBegin + insertAt);
	}
	
	/** */
	deleteToken(at: number)
	{
		this.checkLamports();
		this.lamport++;
		return this.source.deleteToken(this.sliceBegin + at);
	}
	
	/** */
	get charstring()
	{
		const chars: string[] = [];
		
		for (const cursor of this.scan())
		{
			const element = cursor.mask || cursor.token;
			chars.push(X.Proxy.get(element));
		}
		
		return chars.join("");
	}
	
	/** */
	get charstringReadable()
	{
		const cs = this.charstring;
		return X.Proxy.resolveString(cs);
	}
	
	/** */
	at(index: number)
	{
		return this.source.at(this.sliceBeginMaskRelative + index);
	}
	
	/**
	 * Performs a non-recursive scan of the token and mask sequence
	 * that exist in the Tape or Fragment that sits underneath this Lens.
	 */
	* scan()
	{
		this.checkLamports();
		
		let pos = 0;
		const begin = this.sliceBeginMaskRelative;
		const end = this.sliceEndMaskRelative;
		
		for (const element of this.source.scan())
		{
			if (pos++ < begin)
				continue;
			
			if (pos > end)
				break;
			
			yield element;
		}
	}
	
	/** */
	private checkLamports()
	{
		if (X.DEBUG && this.lamport !== this.source.lamport)
			throw "Operation is invalid because the lamport of this Lens and it's underlying source do not match.";
	}
}
