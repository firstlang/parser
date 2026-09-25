import * as X from "./X.ts";
/** */
export declare class Field {
    /** */
    constructor(kind: string, match: readonly any[]);
    /** Stores the name of the capture group in the field's regular expression. */
    name: string;
    /** Debug-only label. No runtime effect. */
    description: string;
    readonly kind: unknown;
    readonly match: readonly any[];
    /** */
    readonly data: {
        nullableTokens: X.FixedToken[];
        enclosure: X.Enclosure;
        terminal: boolean;
        sink: boolean;
        matchesOnlyFlexes: boolean;
        matchesOnlySelects: boolean;
        matchesOnlyMasks: boolean;
    };
    /**
     * Indicates that the field being matched is actually nullable,
     * requires the specified FixedToken sequence prefix as anchor
     * to determine whether the field value is null or not.
     *
     * Examples:
     * 1 to 10 step 2
     */
    nullable(...anchor: X.FixedToken[]): this;
    /** Indicates that this field is expected to be wrapped in a paren() delimiter. */
    paren(): this;
    /** */
    brace(): this;
    /** */
    bracket(): this;
    /** */
    quote(): this;
    /** */
    fence(): this;
    /** */
    markup(): this;
}
/**
 * Defines the sum type that combines all field types to allow
 * for switch-based narrowing over the kind property of the field.
 */
export type TField = IRawField | IOneField | ILassoField | IManyField | ISomeField | IHasField;
/**
 * Matches tokens of any kind, until the tape is exhausted.
 * Generates field of type RawToken.
 * Example: lib from http://path.to/lib
 */
export declare function raw(): IRawField;
/** */
interface IRawField extends Field {
    kind: "raw";
    match: readonly any[];
}
export type TMatch = typeof X.FixedToken | typeof X.FlexToken | typeof X.Mask | TSelect;
export type TSelect = Record<string, X.FixedToken>;
/** */
export declare function isSelectMatch(value: any): value is TSelect;
/** */
export declare function isSelectMatchMember(value: any, select: TSelect): boolean;
/**
 * Matches a single FlexToken or Mask from the tape, whose type is
 * of one of the specified FlexToken or Mask types.
 * Generates a field of type FlexToken, or Mask, depending on the
 * types of the parameters provided.
 * Example: MyClass ( ... )
 * Example: a += b
 */
export declare function one(...match: TMatch[]): IOneField;
/** */
export interface IOneField extends Field {
    kind: "one";
    match: readonly TMatch[];
}
/**
 * Matches a series of options in a regular expression catch all pattern,
 * but where all those tape elements are expected to fit into singular
 * (non-array) field.
 *
 * Example: a + b + c each ( ...
 *
 * (the prefix part before each)
 */
export declare function lasso(...match: TMatch[]): ILassoField;
/** */
export interface ILassoField extends Field {
    kind: "lasso";
    match: readonly TMatch[];
}
/**
 * Matches FlexTokens, Masks, or FixedToken groups from the tape, until the tape is exhausted.
 * Generates a field of type (FlexToken | Mask | string)[].
 * Examples:
 * expr + expr * expr
 * each flex1, flex2, flex3 ( ...
 */
export declare function many(...match: TMatch[]): IManyField;
/** */
export interface IManyField extends Field {
    kind: "many";
    match: readonly TMatch[];
}
/**
 *
 */
export declare function some(...match: TMatch[]): ISomeField;
/** */
export interface ISomeField extends Field {
    kind: "some";
    match: readonly TMatch[];
}
/**
 * Matches a sequence of FixedTokens from the tape.
 * Generates a boolean field whose value is equal to whether the
 * tape has the specified sequence of FixedTokens at the current
 * position. If the tape elements at the current tape position do not
 * match, the operation generates a false-containing field and no
 * tape elements are considered to be consumed.
 * Example: x defer = y
 */
export declare function has(...match: X.FixedToken[]): IHasField;
/** */
export interface IHasField extends Field {
    kind: "has";
    match: readonly X.FixedToken[];
}
/** 🫤 */
export type TAnchorCombinator = {};
/**
 * Specifies static tokens that must exist in the tape in order for a Mask type to be
 * matched, but otherwise do not contribute content to the matched Mask.
 */
export declare function anchor(...tokens: X.FixedToken[]): TAnchorCombinator;
/** */
export declare function isAnchorProperty(propertyName: string): boolean;
export {};
