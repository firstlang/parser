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
	private atLineStart = true;
	
	/** */
	private read()
	{
		while (this.index < this.stream.length)
		{
			const token = this.stream[this.index++];
			if (token !== "" && token !== " " && token !== "\t")
				return token;
		}
		return "";
	}
	
	/** */
	private createTape(enclosure?: X.Enclosure, fragmenter: X.FixedToken | null = this.spec.fragmentationToken)
	{
		return new X.Tape(fragmenter, enclosure);
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
		if (token === "")
			return X.SpaceToken.new("");
		
		const lineTape = this.tryParseLineTape(token);
		if (lineTape)
			return lineTape;
		
		switch (token)
		{
			case X.delimiters.parenTapeL.text:
				this.atLineStart = false;
				return this.parseToDelimiter(X.Enclosure.paren);
				
			case X.delimiters.bracketTapeL.text:
				this.atLineStart = false;
				return this.parseToDelimiter(X.Enclosure.bracket);
			
			case X.delimiters.braceTapeL.text:
				this.atLineStart = false;
				return this.parseToDelimiter(X.Enclosure.brace);
			
			case X.delimiters.quoteTape.text:
				this.atLineStart = false;
				return this.parseTextual(X.Enclosure.quote);
			case X.delimiters.backtickTape.text:
				this.atLineStart = false;
				return this.parseTextual(X.Enclosure.backtick);
		}
		
		const existing = this.allTokens.get(token);
		if (existing)
		{
			this.atLineStart = false;
			return existing;
		}
		
		if (token === X.delimiters.parenTapeR.text ||
			token === X.delimiters.bracketTapeR.text ||
			token === X.delimiters.braceTapeR.text)
			return this.allTokens.get(token)!;
		
		const maybeMarkup = this.tryParseMarkup(token);
		if (maybeMarkup !== null)
		{
			this.atLineStart = false;
			return maybeMarkup;
		}
		
		for (const flex of Object.values(this.spec.physicalFlexTokens))
			if (flex.pattern?.test(token))
			{
				const parsed = (flex as any).new(token);
				if (parsed instanceof X.NewlineToken)
					this.atLineStart = true;
				else if (!(parsed instanceof X.SpaceToken && this.atLineStart))
					this.atLineStart = false;
				
				return parsed;
			}
		
		this.atLineStart = false;
		return X.RawToken.new(token);
	}
	
	/** */
	private tryParseLineTape(token: string): X.Tape | null
	{
		if (!this.atLineStart)
			return null;
		
		const lineSpec = this.spec.lineTapes?.find(s => s.prefix.text === token);
		if (!lineSpec)
			return null;
		
		const tape = this.createTape(X.Enclosure.line, null);
		tape.append(lineSpec.prefix);
		
		this.parseLineTail(tape, lineSpec);
		this.atLineStart = false;
		return tape;
	}
	
	/** */
	private parseLineTail(tape: X.Tape, lineSpec: X.ILineTapeSpec)
	{
		const rawParts: string[] = [];
		
		const flushRaw = () =>
		{
			if (rawParts.length === 0)
				return;
			
			tape.append(X.RawToken.new(rawParts.join(" ")));
			rawParts.length = 0;
		};
		
		for (;;)
		{
			const token = this.read();
			if (token === "" || X.NewlineToken.pattern.test(token))
			{
				if (token !== "")
					this.index--;
				
				flushRaw();
				return;
			}
			
			const enclosure = lineSpec.allowedEnclosures?.find(e => e.left?.text === token);
			if (enclosure)
			{
				flushRaw();
				tape.append(this.parseToDelimiter(enclosure));
				continue;
			}
			
			rawParts.push(token);
		}
	}
	
	/** */
	private parseToDelimiter(enclosure: X.Enclosure)
	{
		const tape = new X.Tape(this.spec.fragmentationToken, enclosure);
		
		while (this.index < this.stream.length)
		{
			const result = this.parseAny();
			if (result === tape.enclosure.right)
				break;
			
			tape.append(result);
		}
		return tape;
	}
		
	/** */
	private parseTextual(enclosure: X.Enclosure): X.Tape
	{
		const tape = this.createTape(enclosure, null);
		while (this.index < this.stream.length)
		{
			const token = this.stream[this.index++];
			if (token === enclosure.right?.text)
			{
				this.atLineStart = false;
				return tape;
			}
			if (enclosure === X.Enclosure.backtick && token === X.delimiters.braceTapeL.text)
				tape.append(this.parseToDelimiter(X.Enclosure.brace));
			else
				tape.append(X.RawToken.new(token));
		}
		return tape;
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
			
			while (this.index < this.stream.length)
			{
				token = this.read();
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
			while (this.index < this.stream.length)
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
