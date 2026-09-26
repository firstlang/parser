import * as X from "./X.ts";

/** */
export type TProxyable = 
	X.TapeElement | 
	X.Enclosure |
	X.Mask |
	typeof X.RawToken |
	typeof X.FlexToken | 
	typeof X.Mask;

/** */
export const Proxy = new class
{
	/** */
	define(proxyable: TProxyable)
	{
		const char = String.fromCharCode(nextCharCode++);
		charProxyMap.set(proxyable, char);
		charProxyReverseMap.set(char, proxyable);
		return char;
	}

	/** Gives a specialized token type the proxy of its general token type. */
	alias(proxyable: TProxyable, target: TProxyable)
	{
		const char = this.get(target);
		charProxyMap.set(proxyable, char);
	}
	
	/** Returns the proxy character associated with the specified object. */
	get(proxyable: TProxyable)
	{
		if (X.DEBUG && !proxyable)
			throw "Invalid proxyable argument.";
		
		let proxy: string | undefined = "";
			
		if (proxyable instanceof X.FixedToken)
			proxy = charProxyMap.get(proxyable);
		
		else if (proxyable instanceof X.FlexToken)
			proxy = charProxyMap.get(X.FlexToken.typeof(proxyable)!);
		
		else if (X.FlexToken.isType(proxyable))
			proxy = charProxyMap.get(proxyable);
		
		else if (proxyable instanceof X.RawToken)
			proxy = charProxyMap.get(X.RawToken);
		
		else if (proxyable === X.RawToken)
			proxy = charProxyMap.get(X.RawToken);
		
		else if (proxyable instanceof X.Tape)
			proxy = charProxyMap.get(proxyable.enclosure);
		
		else if (X.isEnclosure(proxyable))
			proxy = charProxyMap.get(proxyable);
		
		else if (X.Mask.isType(proxyable))
			proxy = charProxyMap.get(proxyable);
		
		else if (proxyable instanceof X.Mask)
			proxy = charProxyMap.get(proxyable.constructor as typeof X.Mask);
		
		if (!proxy)
		{
			debugger;
			//X.DEBUG && this.get(proxyable); // try again, for debugging.
			throw "No charcode is associated with the specified element: " + proxyable;
		}
		
		return proxy;
	}
	
	/** Returns the proxyable item that is mapped to the specified proxy character. */
	resolve(char: string)
	{
		const proxyable = charProxyReverseMap.get(char);
		if (!proxyable)
			throw "Unknown char: " + char;
		
		return proxyable;
	}
	
	/**
	 * Calls the resolve() function on each character in the specified
	 * string and returns a string where each proxy character has
	 * been replaced with a readable representation.
	 */
	resolveString(string: string)
	{
		const out: string[] = [];
		for (const char of string)
		{
			if ((char.codePointAt(0) || 0) < initialCharCode)
			{
				out.push(char);
			}
			else
			{
				const proxyable = X.Proxy.resolve(char);
				const outChar = (() =>
				{
					if (proxyable instanceof X.FixedToken)
						return proxyable.text;
					
					if (proxyable instanceof X.FlexToken)
						return X.FlexToken.typeof(proxyable)!.name;
					
					if (X.FlexToken.isType(proxyable))
						return proxyable.name;
					
					if (proxyable instanceof X.RawToken)
						return X.RawToken.name;
					
					if (proxyable === X.RawToken)
						return X.RawToken.name;
					
					if (X.isEnclosure(proxyable))
						return proxyable.kind.split(".").at(-1) || "?";
					
					if (X.Mask.isType(proxyable))
						return proxyable.name;
					
					if (proxyable instanceof X.Mask)
						return proxyable.constructor.name;
					
					throw "Unknown character";
				})();
				
				out.push(" " + outChar + " ");
			}
		}
		return out.join("");
	}
	
	/** */
	* each()
	{
		for (const entry of charProxyMap)
			yield entry;
	}
}

/** Stores a map of tokens (eg "is") and the replacement char (eg "Ɣ") */
const charProxyMap = new Map<TProxyable, string>();

/** Stores the reverse of the charLookup table. */
const charProxyReverseMap = new Map<string, TProxyable>();

/** */
const initialCharCode = 0x25A0; // ■
let nextCharCode = initialCharCode;
