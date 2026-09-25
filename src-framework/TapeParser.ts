import * as X from "./X.ts";

/** */
export class TapeParser
{
	/** */
	constructor(tokens: readonly string[], spec: X.ILanguageSpec)
	{
		this.stream = tokens;
		this.spec = spec;
		
		const allTokens = new Map<string, X.FixedToken>();
		for (const token of spec.fixedTokens)
			allTokens.set(token.text, token);
		
		this.allTokens = allTokens;
	}
	
	private readonly spec: X.ILanguageSpec;
	private index = 0;
	private readonly stream: readonly string[];
	private readonly allTokens: ReadonlyMap<string, X.FixedToken>;
	
	/** */
	private read()
	{
		let token = "";
		for (;;)
		{
			token = this.stream[this.index++] || "";
			if (token !== "" && token !== " " && token !== "\t")
				break;
		}
		
		return token;
	}
	
	/** */
	private createTape(enclosure?: X.Enclosure)
	{
		return new X.Tape(this.spec.fragmentationToken, enclosure);
	}
	
	/** */
	parse()
	{
		const tape = this.createTape();
		
		while (this.index < this.stream.length)
		{
			const result = this.parseAny();
			if (result)
				tape.append(result);
		}
		
		return tape;
	}
	
	/** */
	private parseAny(): X.TapeElement
	{
		const token = this.read();
		
		switch (token)
		{
			case X.delimiters.parenTapeL.text:
				return this.parseToDelimiter(X.Enclosure.paren);
				
			case X.delimiters.bracketTapeL.text:
				return this.parseToDelimiter(X.Enclosure.bracket);
			
			case X.delimiters.braceTapeL.text:
				return this.parseToDelimiter(X.Enclosure.brace);
			
			case X.delimiters.quoteTape.text:
			{
				const tape = this.createTape(X.Enclosure.quote);
				tape.append(this.parseTextual(X.delimiters.quoteTape));
				return tape;
			}
			case X.delimiters.fenceTape.text:
			{
				const tape = this.createTape(X.Enclosure.fence);
				tape.append(this.parseTextual(X.delimiters.fenceTape));
				return tape;
			}
		}
		
		const existing = this.allTokens.get(token);
		if (existing)
			return existing;
		
		if (token === X.delimiters.parenTapeR.text ||
			token === X.delimiters.bracketTapeR.text ||
			token === X.delimiters.braceTapeR.text)
			return this.allTokens.get(token)!;
		
		const maybeMarkup = this.tryParseMarkup(token);
		if (maybeMarkup !== null)
			return maybeMarkup;
		
		for (const flex of Object.values(this.spec.physicalFlexTokens))
			if (flex.pattern?.test(token))
				return (flex as any).new(token);
		
		throw `Unknown state - Cannot parse "${token}"`;
	}
	
	/** */
	private parseToDelimiter(enclosure: X.Enclosure)
	{
		const tape = new X.Tape(this.spec.fragmentationToken, enclosure);
		
		for (;;)
		{
			const result = this.parseAny();
			if (result === tape.enclosure.right)
				break;
			
			tape.append(result);
		}
		return tape;
	}
		
	/** */
	private parseTextual(delimiter: X.FixedToken): X.RawToken
	{
		const parts: string[] = [];
		
		for (;;)
		{
			const token = this.read();
			if (token === delimiter.text)
				break;
			
			parts.push(token);
		}
		
		const clause = X.RawToken.new(parts.join(" "));
		return clause;
	}
	
	/** */
	private tryParseMarkup(token: string): X.Tape | null
	{
		let tape: X.Tape | null = null;
		
		// <tag .... 
		if (X.MarkupOpenToken.pattern.test(token))
		{
			tape = this.createTape(X.Enclosure.markup);
			tape.append(X.MarkupOpenToken.new(token));
			
			for (;;)
			{
				if (token === X.delimitersForMarkup.markupClose.text ||
					token === X.delimitersForMarkup.markupIslandClose.text)
				{
					tape.append(X.delimitersForMarkup.markupClose);
					break;
				}
				
				tape.append(X.MarkupAttrStartToken.new(token));
			}
		}
		
		// <tag>
		if (X.MarkupStartToken.pattern.test(token))
		{
			tape = this.createTape(X.Enclosure.markup);
			tape.append(X.MarkupStartToken.new(token));
		}
		
		// Parse markup content
		if (tape)
		{
			for (;;)
			{
				token = this.read();
				
				// Nested markup
				const maybeMarkupTape = this.tryParseMarkup(token);
				if (maybeMarkupTape)
				{
					tape.append(maybeMarkupTape);
					continue;
				}
				
				// Markup done
				if (X.MarkupEndToken.pattern.test(token))
				{
					tape.append(X.MarkupEndToken.new(token));
					return tape;
				}
				
				// Text
				tape.append(X.RawToken.new(token));
			}
		}
		
		return tape;
	}
}
