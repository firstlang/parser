import * as X from "./X.ts";

// ------------------------------------------------------------------------------
// This file contains all the things from the framework that should
// be relocated to the language side in order for the architecture 
// to be "demonstrably general". The main work blocking moving
// most of this is a refactoring of the TapeParser in order to have
// it's production rules be general across arbitrary delimiter groups.
// ------------------------------------------------------------------------------

/** */
export const delimiters = Object.freeze({
	// Fixed
	parenTapeL: new X.FixedToken("("),
	parenTapeR: new X.FixedToken(")"),
	bracketTapeL: new X.FixedToken("["),
	bracketTapeR: new X.FixedToken("]"),
	braceTapeL: new X.FixedToken("{"),
	braceTapeR: new X.FixedToken("}"),
	quoteTape: new X.FixedToken(`"`),
	fenceTape: new X.FixedToken(`"""`),
	substitutionTapeL: new X.FixedToken("(("),
	substitutionTapeR: new X.FixedToken("))"),
	
	// Flex
	//MarkupOpenToken: MarkupOpenToken,
	//MarkupStartToken: MarkupStartToken,
	//MarkupEndToken: MarkupEndToken,
	//MarkupAttrStartToken: MarkupAttrStartToken,
});

/** */
export const delimitersForMarkup = Object.freeze({
	markupClose: new X.FixedToken(">"),
	markupIslandClose: new X.FixedToken("/>"),
});

/** */
export abstract class WhitespaceToken extends X.FlexToken { }

/** */
export class SpaceToken extends WhitespaceToken
{
	static readonly pattern = /[ \t]{1}[ \t]*/u;
}

/** */
export class NewlineToken extends WhitespaceToken
{
	static readonly pattern = /\r?\n/u;
}

/** */
export abstract class EntityToken extends X.FlexToken
{ 
	static readonly pattern = /[a-zA-Z]{1,}[a-zA-Z0-9_]{0,}/u;
}

/** */
export abstract class FlexDelimiterToken extends X.FlexToken { }

export class MarkupOpenToken extends FlexDelimiterToken
{
	static readonly pattern = /<[A-Za-z][A-Za-z0-9_]{0,}/u;
}
export class MarkupStartToken extends FlexDelimiterToken
{
	static readonly pattern = /<[A-Za-z][A-Za-z0-9_]{0,}>/u;
}
export class MarkupEndToken extends FlexDelimiterToken
{
	static readonly pattern = /<\/[A-Za-z][A-Za-z0-9_]{0,}>/u;
}
export class MarkupAttrStartToken extends FlexDelimiterToken
{
	static readonly pattern = /[A-Za-z0-9]+=/u;
}
