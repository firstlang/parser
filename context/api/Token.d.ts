import * as X from "./X.ts";
/** */
export declare abstract class Token {
    /** Stores the same string as format. Used for hidden class optimization. */
    abstract readonly text: string;
}
/** */
export declare class FixedToken extends Token {
    /** Returns a reference to the static token with the specified text. */
    static get(text: string): X.FixedToken;
    private static readonly all;
    /** */
    static new<T extends FixedToken>(this: new (text: string) => T, text: string): T;
    /** */
    constructor(text: string);
    /** Stores the same string as format. Used for hidden class optimization. */
    readonly text: string;
}
/** */
export declare abstract class FlexToken extends Token {
    /** */
    static new<T extends FlexToken>(this: new () => T, text: string): T;
    /**
     * Returns the type of the specified flex token.
     */
    static typeof(flex: FlexToken): typeof FlexToken | null;
    /** Guard function that returns whether the specified object is a typeof FlexToken. */
    static isType(maybeType: any): maybeType is typeof FlexToken;
    /** */
    static [Symbol.hasInstance](other: any): boolean;
    /** */
    constructor();
    /** */
    static readonly pattern: RegExp | null;
    /** Stores the same string as format. Used for hidden class optimization. */
    readonly text: string;
}
/** */
export declare abstract class RawToken extends Token {
    /** */
    static new(text: string): RawToken;
    /** */
    static [Symbol.hasInstance](other: any): boolean;
    abstract readonly text: string;
}
/** */
export declare function registerFlexTokens(physicalFlex: X.TFlexTokenTable, abstractFlex?: X.TFlexTokenTable): void;
