import * as X from "./X.ts";
import moo from "moo";

// This file is intended to be the main entry point 
// for the "framework" side of this project.

/**
 * Refers to the structure of a table of flex tokens which
 * are used throughout the system and in language specs.
 */
export type TFlexTokenTable = Record<string, typeof X.FlexToken>;

/** */
export interface ILanguageSpec
{
	masks: typeof X.Mask[];
	fragmentationToken: X.FixedToken;
	lineTapes?: readonly ILineTapeSpec[];
	fixedTokens: X.FixedToken[];
	physicalFlexTokens: TFlexTokenTable;
	abstractFlexTokens: TFlexTokenTable;
}

/** */
export interface ILineTapeSpec
{
	prefix: X.FixedToken;
	allowedEnclosures?: readonly X.Enclosure[];
}

/** */
export class Language
{
	/** */
	constructor(spec: ILanguageSpec)
	{
		// This is cheating like *crazy* but it's the best we have right now.
		// This is the stuff from the Relocants file that we need to generalize
		// at some point, and when that happens we won't need to hack this
		// stuff into the tokens contains in the spec.
		
		spec.fixedTokens = [
			...spec.fixedTokens,
			...Object.values(X.delimiters),
			...Object.values(X.delimitersForMarkup)
		];
		
		spec.physicalFlexTokens = Object.assign(
			{},
			spec.physicalFlexTokens,
			{
				spaceToken: X.SpaceToken,
				newlineToken: X.NewlineToken,
				markupOpenToken: X.MarkupOpenToken,
				markupStartToken: X.MarkupStartToken,
				markupEndToken: X.MarkupEndToken,
				markupAttrStartToken: X.MarkupAttrStartToken,
			});

		const hasEntitySubclass = Object.values(spec.physicalFlexTokens)
			.some(type => X.EntityToken.prototype.isPrototypeOf(type.prototype));
		
		if (!hasEntitySubclass)
			spec.physicalFlexTokens.entityToken = X.EntityToken;
		
		spec.abstractFlexTokens = Object.assign(
			{},
			spec.abstractFlexTokens,
			{
				entityToken: X.EntityToken,
				whitespaceToken: X.WhitespaceToken,
				flexDelimiterToken: X.FlexDelimiterToken,
			}
		);
		
		X.registerFlexTokens(spec.physicalFlexTokens, spec.abstractFlexTokens);
		createLanguageProxies(spec);
		X.MaskDescriptor.compile(spec);
		this.spec = spec;
		this.lexer = createLanguageLexer(spec);
	}
	
	private lexer: moo.Lexer;
	private spec: ILanguageSpec;
	
	/** Turns the code into a string array containing the lexically separated tokens. */
	createTokenStrings(codeText: string)
	{
		this.lexer.reset(codeText);
		const mooTokens = Array.from(this.lexer);
		const stringTokens = mooTokens.map(s => s.value);
		return stringTokens;
	}
	
	/** Creates a hierarchial tape which is parsed from the specified code string. */
	createTape(codeText: string)
	{
		const tokenStrings = this.createTokenStrings(codeText);
		const parser = new X.TapeParser(tokenStrings, this.spec);
		return parser.parse();
	}
}

/** */
function createLanguageLexer(spec: ILanguageSpec)
{
	const rules: moo.Rules = {};
	const words: Record<string, string> = {};
	
	for (const delimiter of Object.values(X.delimiters))
		rules[delimiter.text] = delimiter.text;

	// Compound fixed tokens have one canonical spelling, but accept any
	// positive amount of horizontal whitespace between their words.
	const compoundFixedTokens = spec.fixedTokens
		.filter(token => token.text.includes(" "))
		.sort((a, b) => b.text.length - a.text.length);

	for (const fixedToken of compoundFixedTokens)
	{
		const parts = fixedToken.text.split(" ").map(escapeRegExp);
		rules[fixedToken.text] = {
			match: new RegExp(parts.join("[ \\t]+") + "\\b", "u"),
			value: () => fixedToken.text,
		};
	}
	
	for (const fixedToken of spec.fixedTokens)
	{
		if (fixedToken.text.includes(" "))
			continue;
		else if (X.EntityToken.pattern.test(fixedToken.text))
			words[fixedToken.text] = fixedToken.text;
		else
			rules[fixedToken.text] = fixedToken.text;
	}
	
	for (const flex of Object.values(spec.physicalFlexTokens))
		if (flex.pattern)
			rules[flex.name] = flex.pattern;
	
	// Entities and newline tokens need to be special-cased for the moo lexer
	// TODO: This needs to be generalized 
	
	const kw = moo.keywords(words);
	
	rules[X.EntityToken.name] = {
		match: X.EntityToken.pattern,
		type: kw,
	};
	
	rules[X.NewlineToken.name] = {
		match: X.NewlineToken.pattern,
		lineBreaks: true,
	};
	
	return moo.compile(rules);
}

/** Escapes text for literal inclusion in a regular expression. */
function escapeRegExp(text: string)
{
	return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Initializes the set of unicode proxy characters for the language. */
function createLanguageProxies(spec: ILanguageSpec)
{
	X.Proxy.define(X.RawToken);
	
	for (const enclosure of Object.values(X.Enclosure))
		X.Proxy.define(enclosure);
	
	for (const fixed of spec.fixedTokens)
		X.Proxy.define(fixed);
	
	for (const abstractFlexType of Object.values(spec.abstractFlexTokens))
		X.Proxy.define(abstractFlexType);
	
	for (const flexType of Object.values(spec.physicalFlexTokens))
	{
		if (X.EntityToken.prototype.isPrototypeOf(flexType.prototype))
			X.Proxy.alias(flexType, X.EntityToken);
		else
			X.Proxy.define(flexType);
	}
	
	for (const maskType of spec.masks)
		X.Proxy.define(maskType);
}
