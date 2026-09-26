import * as X from "./X.ts";

/** */
export type TDelimiterPair = {
	kind: string;
	left: X.FixedToken | null,
	right: X.FixedToken | null,
}

const enc = "Enclosure.";

/** */
export const Enclosure = {
	/** 
	 * Tape for the root (no delimiter), but could also be used in other cases
	 * where a tape is needed but a specific delimiter kind isn't necessary.
	 */
	none: {
		kind: enc + "none",
		left: null,
		right: null,
	},
	
	/** Tape for ( ) delimiters */
	paren: {
		kind: enc + "paren",
		left: X.delimiters.parenTapeL,
		right: X.delimiters.parenTapeR,
	},
	
	/** Tape for { } delimiters */
	brace: {
		kind: enc + "brace",
		left: X.delimiters.braceTapeL,
		right: X.delimiters.braceTapeR,
	},
	
	/** Tape for [ ] delimiters */
	bracket: {
		kind: enc + "bracket",
		left: X.delimiters.bracketTapeL,
		right: X.delimiters.bracketTapeR,
	},
	
	/** Tape for " " delimiters */
	quote: {
		kind: enc + "quote",
		left: X.delimiters.quoteTape,
		right: X.delimiters.quoteTape,
	},
	
	/** Tape for interpolated text delimiters */
	backtick: {
		kind: enc + "backtick",
		left: X.delimiters.backtickTape,
		right: X.delimiters.backtickTape,
	},
	
	/** Tape for markup literals */
	markup: {
		kind: enc + "markup",
		left: null,
		right: null,
	},
	
	/** Tape for line-prefixed content */
	line: {
		kind: enc + "line",
		left: null,
		right: null,
	},
} as const;
export type Enclosure = (typeof Enclosure)[keyof typeof Enclosure];

/** Guards on whether the specified object is one of the items in the Enclosure const.  */
export function isEnclosure(object: any): object is Enclosure
{
	return !!object && 
		typeof object === "object" && 
		typeof object.kind === "string" &&
		(object.kind as string).startsWith(enc);
}
