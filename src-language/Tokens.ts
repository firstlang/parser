import * as X from "./XX.ts";

export abstract class LiteralToken extends X.FlexToken { }

/** 
 * Literal tokens can't be ParticleLiteralTokens because they can't
 * have accessors (.) after them. The other things can.
 */
export class IntegerToken extends LiteralToken
{
	static readonly pattern = /-?(?:0|[1-9][0-9]*(?:_+[0-9]+)*)/u;
}

/** Abstract base class for FlexTokens that are potential particles. */
export abstract class ParticleLiteralToken extends LiteralToken { }

export class UnsignedIntegerToken extends ParticleLiteralToken
{
	//static readonly pattern = /[1-9][0-9]*u/u;
	static readonly pattern = /^(?:0|[1-9][0-9]*(?:_+[0-9]+)*)u$/u;
}
export class DecimalToken extends ParticleLiteralToken
{
	//static readonly pattern = /[0-9]{1,}\.[0-9]{1,}/u;
	static readonly pattern = /(?:0|[1-9][0-9]*(?:_+[0-9]+)*)\.[0-9]+(?:_+[0-9]+)*/u;
}
export class Float32Token extends ParticleLiteralToken
{
	//static readonly pattern = /[0-9]{1,}\.[0-9]{1,}f/u;
	static readonly pattern = /(?:0|[1-9][0-9]*(?:_+[0-9]+)*)\.[0-9]+(?:_+[0-9]+)*f/u;
}
export class Float64Token extends ParticleLiteralToken
{
	//static readonly pattern = /[0-9]{1,}\.[0-9]{1,}ff/u;
	static readonly pattern = /(?:0|[1-9][0-9]*(?:_+[0-9]+)*)\.[0-9]+(?:_+[0-9]+)*ff/u;
}
export class Float128Token extends ParticleLiteralToken
{
	//static readonly pattern = /[0-9]{1,}\.[0-9]{1,}fff/u;
	static readonly pattern = /(?:0|[1-9][0-9]*(?:_+[0-9]+)*)\.[0-9]+(?:_+[0-9]+)*fff/u;
}
export class QuantityToken extends ParticleLiteralToken
{
	//static readonly pattern = /[0-9]+\.?[0-9]*[a-zA-Z][a-zA-Z0-9_]*/u;
	static readonly pattern = /(?:0|[1-9][0-9]*(?:_+[0-9]+)*)(?:\.[0-9]+(?:_+[0-9]+)*)?[a-zA-Z][a-zA-Z0-9_]*/u;
}
export class HexToken extends ParticleLiteralToken
{
	//static readonly pattern = /0x[0-9A-Fa-f]{1,}/u;
	static readonly pattern = /0x[0-9A-Fa-f]+(?:_+[0-9A-Fa-f]+)*/u;
}
export class CharToken extends ParticleLiteralToken
{
	static readonly pattern = /'(?:[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF])'/u;
}
export class RegexToken extends ParticleLiteralToken
{
	static readonly pattern = /\/{1,}\//u;
}

export const flexTokens = Object.freeze({
	entity: X.EntityToken,
	
	// Literals - Particles
	quantity: QuantityToken,
	unsignedInteger: UnsignedIntegerToken,
	decimal: DecimalToken,
	float32: Float32Token,
	float64: Float64Token,
	float128: Float128Token,
	hex: HexToken,
	char: CharToken,
	regex: RegexToken,
	
	// Literals - Other
	integer: IntegerToken,
	
	// Markup
	markupOpen: X.MarkupOpenToken,
	markupStart: X.MarkupStartToken,
	markupEnd: X.MarkupEndToken,
	markupAttrStart: X.MarkupAttrStartToken,
	
	// White space
	space: X.SpaceToken,
	newline: X.NewlineToken,
});

/** */
export const flexTokensAbstract = Object.freeze({
	literal: LiteralToken,
	particle: ParticleLiteralToken,
	whitespace: X.WhitespaceToken,
	delimiter: X.FlexDelimiterToken, 
});

//# Fixed Token Types

export class PrimitiveToken extends X.FixedToken { }
export class PrimitiveIntToken extends PrimitiveToken { }
export class PrimitiveUintToken extends PrimitiveToken { }
export class PrimitiveFloatToken extends PrimitiveToken { }
export class PrimitiveBigToken extends PrimitiveToken { }
export class PrimitiveOtherToken extends PrimitiveToken { }
export class WordToken extends X.FixedToken { }
export class ValueToken extends X.FixedToken { }
export class SymbolToken extends X.FixedToken { }
export class AssignerToken extends X.FixedToken { }
export class OperatorToken extends X.FixedToken { }
export class OperatorsFrozenToken extends OperatorToken { }
export class OperatorsOverloadableToken extends OperatorToken { }
export class SuffixToken extends X.FixedToken { }
export class PrefixToken extends X.FixedToken { }

const primitives = Object.freeze({
	ints: Object.freeze({
		int: new X.FixedToken("int"),
		int128: new X.FixedToken("i128"),
		int128x1: new X.FixedToken("i128.1"),
		int128x10: new X.FixedToken("i128.10"),
		int128x11: new X.FixedToken("i128.11"),
		int128x12: new X.FixedToken("i128.12"),
		int128x13: new X.FixedToken("i128.13"),
		int128x14: new X.FixedToken("i128.14"),
		int128x15: new X.FixedToken("i128.15"),
		int128x16: new X.FixedToken("i128.16"),
		int128x17: new X.FixedToken("i128.17"),
		int128x18: new X.FixedToken("i128.18"),
		int128x19: new X.FixedToken("i128.19"),
		int128x2: new X.FixedToken("i128.2"),
		int128x20: new X.FixedToken("i128.20"),
		int128x21: new X.FixedToken("i128.21"),
		int128x22: new X.FixedToken("i128.22"),
		int128x23: new X.FixedToken("i128.23"),
		int128x24: new X.FixedToken("i128.24"),
		int128x25: new X.FixedToken("i128.25"),
		int128x26: new X.FixedToken("i128.26"),
		int128x27: new X.FixedToken("i128.27"),
		int128x28: new X.FixedToken("i128.28"),
		int128x29: new X.FixedToken("i128.29"),
		int128x3: new X.FixedToken("i128.3"),
		int128x30: new X.FixedToken("i128.30"),
		int128x31: new X.FixedToken("i128.31"),
		int128x32: new X.FixedToken("i128.32"),
		int128x33: new X.FixedToken("i128.33"),
		int128x34: new X.FixedToken("i128.34"),
		int128x35: new X.FixedToken("i128.35"),
		int128x36: new X.FixedToken("i128.36"),
		int128x37: new X.FixedToken("i128.37"),
		int128x38: new X.FixedToken("i128.38"),
		int128x39: new X.FixedToken("i128.39"),
		int128x4: new X.FixedToken("i128.4"),
		int128x5: new X.FixedToken("i128.5"),
		int128x6: new X.FixedToken("i128.6"),
		int128x7: new X.FixedToken("i128.7"),
		int128x8: new X.FixedToken("i128.8"),
		int128x9: new X.FixedToken("i128.9"),
		int16: new X.FixedToken("i16"),
		int16x1: new X.FixedToken("i16.1"),
		int16x2: new X.FixedToken("i16.2"),
		int16x3: new X.FixedToken("i16.3"),
		int16x4: new X.FixedToken("i16.4"),
		int16x5: new X.FixedToken("i16.5"),
		int32: new X.FixedToken("i32"),
		int32x1: new X.FixedToken("i32.1"),
		int32x10: new X.FixedToken("i32.10"),
		int32x2: new X.FixedToken("i32.2"),
		int32x3: new X.FixedToken("i32.3"),
		int32x4: new X.FixedToken("i32.4"),
		int32x5: new X.FixedToken("i32.5"),
		int32x6: new X.FixedToken("i32.6"),
		int32x7: new X.FixedToken("i32.7"),
		int32x8: new X.FixedToken("i32.8"),
		int32x9: new X.FixedToken("i32.9"),
		int64: new X.FixedToken("i64"),
		int64x1: new X.FixedToken("i64.1"),
		int64x10: new X.FixedToken("i64.10"),
		int64x11: new X.FixedToken("i64.11"),
		int64x12: new X.FixedToken("i64.12"),
		int64x13: new X.FixedToken("i64.13"),
		int64x14: new X.FixedToken("i64.14"),
		int64x15: new X.FixedToken("i64.15"),
		int64x16: new X.FixedToken("i64.16"),
		int64x17: new X.FixedToken("i64.17"),
		int64x18: new X.FixedToken("i64.18"),
		int64x19: new X.FixedToken("i64.19"),
		int64x2: new X.FixedToken("i64.2"),
		int64x3: new X.FixedToken("i64.3"),
		int64x4: new X.FixedToken("i64.4"),
		int64x5: new X.FixedToken("i64.5"),
		int64x6: new X.FixedToken("i64.6"),
		int64x7: new X.FixedToken("i64.7"),
		int64x8: new X.FixedToken("i64.8"),
		int64x9: new X.FixedToken("i64.9"),
		int8: new X.FixedToken("i8"),
		int8x1: new X.FixedToken("i8.1"),
		int8x2: new X.FixedToken("i8.2"),
		int8x3: new X.FixedToken("i8.3"),
	}),
	uints: Object.freeze({
		uint128: new X.FixedToken("u128"),
		uint128x1: new X.FixedToken("u128.1"),
		uint128x10: new X.FixedToken("u128.10"),
		uint128x11: new X.FixedToken("u128.11"),
		uint128x12: new X.FixedToken("u128.12"),
		uint128x13: new X.FixedToken("u128.13"),
		uint128x14: new X.FixedToken("u128.14"),
		uint128x15: new X.FixedToken("u128.15"),
		uint128x16: new X.FixedToken("u128.16"),
		uint128x17: new X.FixedToken("u128.17"),
		uint128x18: new X.FixedToken("u128.18"),
		uint128x19: new X.FixedToken("u128.19"),
		uint128x2: new X.FixedToken("u128.2"),
		uint128x20: new X.FixedToken("u128.20"),
		uint128x21: new X.FixedToken("u128.21"),
		uint128x22: new X.FixedToken("u128.22"),
		uint128x23: new X.FixedToken("u128.23"),
		uint128x24: new X.FixedToken("u128.24"),
		uint128x25: new X.FixedToken("u128.25"),
		uint128x26: new X.FixedToken("u128.26"),
		uint128x27: new X.FixedToken("u128.27"),
		uint128x28: new X.FixedToken("u128.28"),
		uint128x29: new X.FixedToken("u128.29"),
		uint128x3: new X.FixedToken("u128.3"),
		uint128x30: new X.FixedToken("u128.30"),
		uint128x31: new X.FixedToken("u128.31"),
		uint128x32: new X.FixedToken("u128.32"),
		uint128x33: new X.FixedToken("u128.33"),
		uint128x34: new X.FixedToken("u128.34"),
		uint128x35: new X.FixedToken("u128.35"),
		uint128x36: new X.FixedToken("u128.36"),
		uint128x37: new X.FixedToken("u128.37"),
		uint128x38: new X.FixedToken("u128.38"),
		uint128x39: new X.FixedToken("u128.39"),
		uint128x4: new X.FixedToken("u128.4"),
		uint128x5: new X.FixedToken("u128.5"),
		uint128x6: new X.FixedToken("u128.6"),
		uint128x7: new X.FixedToken("u128.7"),
		uint128x8: new X.FixedToken("u128.8"),
		uint128x9: new X.FixedToken("u128.9"),
		uint16: new X.FixedToken("u16"),
		uint16x1: new X.FixedToken("u16.1"),
		uint16x2: new X.FixedToken("u16.2"),
		uint16x3: new X.FixedToken("u16.3"),
		uint16x4: new X.FixedToken("u16.4"),
		uint16x5: new X.FixedToken("u16.5"),
		uint32: new X.FixedToken("u32"),
		uint32x1: new X.FixedToken("u32.1"),
		uint32x10: new X.FixedToken("u32.10"),
		uint32x2: new X.FixedToken("u32.2"),
		uint32x3: new X.FixedToken("u32.3"),
		uint32x4: new X.FixedToken("u32.4"),
		uint32x5: new X.FixedToken("u32.5"),
		uint32x6: new X.FixedToken("u32.6"),
		uint32x7: new X.FixedToken("u32.7"),
		uint32x8: new X.FixedToken("u32.8"),
		uint32x9: new X.FixedToken("u32.9"),
		uint64: new X.FixedToken("u64"),
		uint64x1: new X.FixedToken("u64.1"),
		uint64x10: new X.FixedToken("u64.10"),
		uint64x11: new X.FixedToken("u64.11"),
		uint64x12: new X.FixedToken("u64.12"),
		uint64x13: new X.FixedToken("u64.13"),
		uint64x14: new X.FixedToken("u64.14"),
		uint64x15: new X.FixedToken("u64.15"),
		uint64x16: new X.FixedToken("u64.16"),
		uint64x17: new X.FixedToken("u64.17"),
		uint64x18: new X.FixedToken("u64.18"),
		uint64x19: new X.FixedToken("u64.19"),
		uint64x2: new X.FixedToken("u64.2"),
		uint64x3: new X.FixedToken("u64.3"),
		uint64x4: new X.FixedToken("u64.4"),
		uint64x5: new X.FixedToken("u64.5"),
		uint64x6: new X.FixedToken("u64.6"),
		uint64x7: new X.FixedToken("u64.7"),
		uint64x8: new X.FixedToken("u64.8"),
		uint64x9: new X.FixedToken("u64.9"),
		uint8: new X.FixedToken("u8"),
		uint8x1: new X.FixedToken("u8.1"),
		uint8x2: new X.FixedToken("u8.2"),
		uint8x3: new X.FixedToken("u8.3"),
		uint: new X.FixedToken("uint"),
	}),
	floats: Object.freeze({
		float16: new X.FixedToken("f16"),
		float32: new X.FixedToken("f32"),
		float64: new X.FixedToken("f64"),
		float128: new X.FixedToken("f128"),
	}),
	bigs: Object.freeze({
		big: new X.FixedToken("big"),
		bigx1: new X.FixedToken("big.1"),
		bigx10: new X.FixedToken("big.10"),
		bigx11: new X.FixedToken("big.11"),
		bigx12: new X.FixedToken("big.12"),
		bigx13: new X.FixedToken("big.13"),
		bigx14: new X.FixedToken("big.14"),
		bigx15: new X.FixedToken("big.15"),
		bigx16: new X.FixedToken("big.16"),
		bigx17: new X.FixedToken("big.17"),
		bigx18: new X.FixedToken("big.18"),
		bigx19: new X.FixedToken("big.19"),
		bigx2: new X.FixedToken("big.2"),
		bigx20: new X.FixedToken("big.20"),
		bigx21: new X.FixedToken("big.21"),
		bigx22: new X.FixedToken("big.22"),
		bigx23: new X.FixedToken("big.23"),
		bigx24: new X.FixedToken("big.24"),
		bigx25: new X.FixedToken("big.25"),
		bigx26: new X.FixedToken("big.26"),
		bigx27: new X.FixedToken("big.27"),
		bigx28: new X.FixedToken("big.28"),
		bigx29: new X.FixedToken("big.29"),
		bigx3: new X.FixedToken("big.3"),
		bigx30: new X.FixedToken("big.30"),
		bigx31: new X.FixedToken("big.31"),
		bigx32: new X.FixedToken("big.32"),
		bigx33: new X.FixedToken("big.33"),
		bigx34: new X.FixedToken("big.34"),
		bigx35: new X.FixedToken("big.35"),
		bigx36: new X.FixedToken("big.36"),
		bigx37: new X.FixedToken("big.37"),
		bigx38: new X.FixedToken("big.38"),
		bigx39: new X.FixedToken("big.39"),
		bigx4: new X.FixedToken("big.4"),
		bigx40: new X.FixedToken("big.40"),
		bigx41: new X.FixedToken("big.41"),
		bigx42: new X.FixedToken("big.42"),
		bigx43: new X.FixedToken("big.43"),
		bigx44: new X.FixedToken("big.44"),
		bigx45: new X.FixedToken("big.45"),
		bigx46: new X.FixedToken("big.46"),
		bigx47: new X.FixedToken("big.47"),
		bigx48: new X.FixedToken("big.48"),
		bigx49: new X.FixedToken("big.49"),
		bigx5: new X.FixedToken("big.5"),
		bigx50: new X.FixedToken("big.50"),
		bigx51: new X.FixedToken("big.51"),
		bigx52: new X.FixedToken("big.52"),
		bigx53: new X.FixedToken("big.53"),
		bigx54: new X.FixedToken("big.54"),
		bigx55: new X.FixedToken("big.55"),
		bigx56: new X.FixedToken("big.56"),
		bigx57: new X.FixedToken("big.57"),
		bigx58: new X.FixedToken("big.58"),
		bigx59: new X.FixedToken("big.59"),
		bigx6: new X.FixedToken("big.6"),
		bigx60: new X.FixedToken("big.60"),
		bigx61: new X.FixedToken("big.61"),
		bigx62: new X.FixedToken("big.62"),
		bigx63: new X.FixedToken("big.63"),
		bigx64: new X.FixedToken("big.64"),
		bigx7: new X.FixedToken("big.7"),
		bigx8: new X.FixedToken("big.8"),
		bigx9: new X.FixedToken("big.9"),
	}),
	others: Object.freeze({
		boolean: new X.FixedToken("boolean"),
		decimal: new X.FixedToken("decimal"),
		number: new X.FixedToken("number"),
		string: new X.FixedToken("string"),
	}),
});

const words = Object.freeze({
	aliasof: new X.FixedToken("alias of"),
	always: new X.FixedToken("always"),
	analyzer: new X.FixedToken("analyzer"),
	and: new X.FixedToken("and"),
	any: new X.FixedToken("any"),
	copy: new X.FixedToken("copy"),
	declare: new X.FixedToken("declare"),
	defer: new X.FixedToken("defer"),
	delete: new X.FixedToken("delete"),
	editable: new X.FixedToken("editable"),
	exempt: new X.FixedToken("exempt"),
	export: new X.FixedToken("export"),
	expose: new X.FixedToken("expose"),
	extend: new X.FixedToken("extend"),
	fn: new X.FixedToken("fn"),
	from: new X.FixedToken("from"),
	ghost: new X.FixedToken("ghost"),
	interface: new X.FixedToken("interface"),
	isnot: new X.FixedToken("is not"),
	is: new X.FixedToken("is"),
	manyof: new X.FixedToken("many of"),
	matches: new X.FixedToken("matches"),
	oneof: new X.FixedToken("one of"),
	onevalueof: new X.FixedToken("one value of"),
	or: new X.FixedToken("or"),
	proof: new X.FixedToken("proof"),
	ref: new X.FixedToken("ref"),
	space: new X.FixedToken("space"),
	start: new X.FixedToken("start"),
	step: new X.FixedToken("step"),
	strong: new X.FixedToken("strong"),
	super: new X.FixedToken("super"),
	this: new X.FixedToken("this"),
	throw: new X.FixedToken("throw"),
	til: new X.FixedToken("til"),
	to: new X.FixedToken("to"),
	type: new X.FixedToken("type"),
	typeof: new X.FixedToken("type of"),
	var: new X.FixedToken("var"),
	weak: new X.FixedToken("weak"),
	worker: new X.FixedToken("worker"),
});

const values = Object.freeze({
	infinity: new X.FixedToken("infinity"),
	nan: new X.FixedToken("nan"),
	null: new X.FixedToken("null"),
});

const symbols = Object.freeze({
	colon: new X.FixedToken(":"),
	comma: new X.FixedToken(","),
	dot: new X.FixedToken("."),
	hashbang: new X.FixedToken("#!"),
	not: new X.FixedToken("!"),
	question: new X.FixedToken("?"),
	spread: new X.FixedToken("..."),
	ternaryOption: new X.FixedToken(":"),
});

const assigners = Object.freeze({
	basicAssign: new X.FixedToken("="),
	divideAssign: new X.FixedToken("/="),
	minusAssign: new X.FixedToken("-="),
	modAssign: new X.FixedToken("%="),
	multiplyAssign: new X.FixedToken("*="),
	plusAssign: new X.FixedToken("+="),
});

const operators = Object.freeze({
	sealed: Object.freeze({
		bitShiftLeft: new X.FixedToken("<<"),
		bitShiftRight: new X.FixedToken(">>"),
		bitShiftRightUnsigned: new X.FixedToken(">>>"),
		bitwiseAnd: new X.FixedToken("&"),
		bitwiseXor: new X.FixedToken("^"),
		equality: new X.FixedToken("=="),
		inequality: new X.FixedToken("!="),
	}),
	overloadable: Object.freeze({
		add: new X.FixedToken("+"),
		divideInteger: new X.FixedToken("\\"),
		divide: new X.FixedToken("/"),
		exponent: new X.FixedToken("**"),
		gt: new X.FixedToken(">"),
		gte: new X.FixedToken(">="),
		lt: new X.FixedToken("<"),
		lte: new X.FixedToken("<="),
		modulo: new X.FixedToken("%"),
		multiply: new X.FixedToken("*"),
		subtract: new X.FixedToken("-"),
	}),
});

const suffixes = Object.freeze({
	catch: new X.FixedToken("catch"),
	each: new X.FixedToken("each"),
});

const prefixes = Object.freeze({
	build: new X.FixedToken("build"),
	heading1: new X.FixedToken("#"),
	heading2: new X.FixedToken("##"),
	heading3: new X.FixedToken("###"),
	heading4: new X.FixedToken("####"),
	heading5: new X.FixedToken("#####"),
	heading6: new X.FixedToken("######"),
	comment: new X.FixedToken("--"),
	deactivator: new X.FixedToken("\\\\"),
	else: new X.FixedToken("else"),
	ensure: new X.FixedToken("ensure"),
	if: new X.FixedToken("if"),
	return: new X.FixedToken("return"),
});

const breaks = Object.freeze({
	break1: new X.FixedToken("break"),
	break2: new X.FixedToken("break.2"),
	break3: new X.FixedToken("break.3"),
	break4: new X.FixedToken("break.4"),
	break5: new X.FixedToken("break.5"),
	break6: new X.FixedToken("break.6"),
	break7: new X.FixedToken("break.7"),
	break8: new X.FixedToken("break.8"),
});

const continues = Object.freeze({
	continue1: new X.FixedToken("continue"),
	continue2: new X.FixedToken("continue.2"),
	continue3: new X.FixedToken("continue.3"),
	continue4: new X.FixedToken("continue.4"),
	continue5: new X.FixedToken("continue.5"),
	continue6: new X.FixedToken("continue.6"),
	continue7: new X.FixedToken("continue.7"),
	continue8: new X.FixedToken("continue.8"),
});

const yields = Object.freeze({
	yield1: new X.FixedToken("yield"),
	yield2: new X.FixedToken("yield.2"),
	yield3: new X.FixedToken("yield.3"),
	yield4: new X.FixedToken("yield.4"),
	yield5: new X.FixedToken("yield.5"),
	yield6: new X.FixedToken("yield.6"),
	yield7: new X.FixedToken("yield.7"),
	yield8: new X.FixedToken("yield.8"),
});

/** */
export const tokenGroups = Object.freeze({
	primitives,
	words,
	values,
	symbols,
	assigners,
	operators,
	breaks,
	continues,
	yields,
	suffixes,
	prefixes,
});

/** */
export const tokens = Object.freeze({
	...primitives.ints,
	...primitives.uints,
	...primitives.floats,
	...primitives.bigs,
	...primitives.others,
	...words,
	...values,
	...symbols,
	...assigners,
	...operators.sealed,
	...operators.overloadable,
	...suffixes,
	...prefixes,
	...breaks,
	...continues,
	...yields,
});

/** Stores the tokens that have no whitespace around them when printed. */
export const unspacedOperators: readonly X.FixedToken[] = [
	X.tokens.hashbang,
	X.tokens.not,
	X.tokens.spread,
	X.tokens.dot,
];

//# Helpers

/** Test code with no home */
/*
const entityToken = X.EntityToken.new("foo");
const entityType = X.FlexToken.getType(entityToken);
console.log(X.FlexToken.isType(entityType));
console.log(entityType === X.EntityToken);
console.log(entityToken instanceof X.EntityToken);
console.log(entityToken instanceof X.FlexToken);

const literalToken = X.QuantityToken.new("1cm");
const literalType = X.FlexToken.getType(literalToken);
console.log(X.FlexToken.isType(literalType));
console.log(literalType === X.QuantityToken);
console.log(literalToken instanceof X.QuantityToken);
console.log(literalToken instanceof X.LiteralToken);
console.log(literalToken instanceof X.FlexToken);
*/
