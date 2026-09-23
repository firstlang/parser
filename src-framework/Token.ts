import * as X from "./X.ts";

/** */
export abstract class Token
{
	/** Stores the same string as format. Used for hidden class optimization. */
	abstract readonly text: string;
}

/** */
export class FixedToken extends Token
{
	/** Returns a reference to the static token with the specified text. */
	static get(text: string)
	{
		const token = this.all.get(text);
		if (!token)
			throw "Unknown token: " + token;
		
		return token;
	}
	
	private static readonly all = new Map<string, FixedToken>();
		
	/** */
	static new<T extends FixedToken>(this: new (text: string) => T, text: string): T
	{
		const token = new this(text);
		FixedToken.all.set(text, token);
		return token;
	}
	
	/** */
	constructor(text: string)
	{
		super();
		this.text = text;
	}
	
	/** Stores the same string as format. Used for hidden class optimization. */
	readonly text: string;
}

/**  */
interface IPlainFlexToken
{
	readonly debugDescription?: string;
	readonly id: number;
	readonly text: string;
}

/** */
export abstract class FlexToken extends Token
{
	/** */
	static new<T extends FlexToken>(
		this: new () => T,
		text: string): T
	{
		const chain = X.getInheritanceChain(this) as any as typeof FlexToken[];
		const id = chain.reduce((acc, cls) => acc | (flexTypeBitsMap.get(cls) || 0), 0);
		const plainToken: IPlainFlexToken = { id, text, debugDescription: this.name };
		return plainToken as any as T;
	}
	
	/** 
	 * Returns the type of the specified flex token.
	 */
	static typeof(flex: FlexToken): typeof FlexToken | null
	{
		const plain = asPlain(flex);
		if (!plain)
			return null;
		
		// The id is a bitfield with one bit per type in the inheritance chain.
		// Find the highest set bit — that corresponds to the most-derived type,
		// since types are registered leaf-last in the setup loop.
		let remaining = plain.id;
		let highestBit = 0;
		
		while (remaining)
		{
			const bit = remaining & -remaining; // isolate lowest set bit
			highestBit = bit;
			remaining &= remaining - 1; // clear lowest set bit
		}
		
		return highestBit ? (bitsFlexTypeMap.get(highestBit) ?? null) : null;
	}
	
	/** Guard function that returns whether the specified object is a typeof FlexToken. */
	static isType(maybeType: any): maybeType is typeof FlexToken
	{
		return flexTypeBitsMap.has(maybeType);
	}
	
	/** */
	static [Symbol.hasInstance](other: any)
	{
		return !!asPlain(other);
	}
	
	/** */
	constructor()
	{
		super();
		throw "Do not call this constructor. Instead call FlexToken.new().";
	}
	
	/** */
	static readonly pattern: RegExp | null = null;
	
	/** Stores the same string as format. Used for hidden class optimization. */
	readonly text: string;
}

/** */
export abstract class RawToken extends Token
{
	/** */
	static new(text: string)
	{
		return { id: -1, text } as any as RawToken;
	}
	
	/** */
	static [Symbol.hasInstance](other: any)
	{
		return !!other && 
			typeof other === "object" &&
			other.id === -1 &&
			typeof other.text === "string";
	}
	
	abstract readonly text: string;
}

// The purpose of this getBit function and the classBitMap is
// to provide fast lookups of the inheritance chain of a FlexToken,
// so that you can see the type lineage of a FlexToken constructor
// with minimal processing overhead.
// Note: Make sure there aren't more than 32 of these in here
// otherwise the bitshifting won't work anymore.

const bitsFlexTypeMap = new Map<number, typeof X.FlexToken>();
const flexTypeBitsMap = new Map<typeof X.FlexToken, number>();

/** */
function asPlain(flex: X.FlexToken)
{
	if (!flex || typeof flex !== "object")
		return null;
	
	const plain = flex as any as IPlainFlexToken;
	if (typeof plain.id === "number" && plain.id >= 0)
		return plain;
	
	return null;
}

/** */
export function registerFlexTokens(
	physicalFlex: X.TFlexTokenTable,
	abstractFlex: X.TFlexTokenTable = {})
{
	let nextBitShift = 0;
	const flexTypes = [
		...Object.values(abstractFlex),
		...Object.values(physicalFlex),
	];
	
	for (const type of flexTypes)
	{
		const bits = 1 << nextBitShift++;
		flexTypeBitsMap.set(type, bits);
		bitsFlexTypeMap.set(bits, type);
		
		type[Symbol.hasInstance] = (other: any) =>
		{
			if (!other || typeof other !== "object")
				return false;
			
			const otherPlain = asPlain(other);
			if (!otherPlain)
				return false;
			
			return (otherPlain.id & bits) !== 0;
		}
	}
}
