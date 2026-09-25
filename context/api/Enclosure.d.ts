import * as X from "./X.ts";
/** */
export type TDelimiterPair = {
    kind: string;
    left: X.FixedToken | null;
    right: X.FixedToken | null;
};
/** */
export declare const Enclosure: {
    /**
     * Tape for the root (no delimiter), but could also be used in other cases
     * where a tape is needed but a specific delimiter kind isn't necessary.
     */
    readonly none: {
        readonly kind: string;
        readonly left: null;
        readonly right: null;
    };
    /** Tape for ( ) delimiters */
    readonly paren: {
        readonly kind: string;
        readonly left: X.FixedToken;
        readonly right: X.FixedToken;
    };
    /** Tape for { } delimiters */
    readonly brace: {
        readonly kind: string;
        readonly left: X.FixedToken;
        readonly right: X.FixedToken;
    };
    /** Tape for [ ] delimiters */
    readonly bracket: {
        readonly kind: string;
        readonly left: X.FixedToken;
        readonly right: X.FixedToken;
    };
    /** Tape for " " delimiters */
    readonly quote: {
        readonly kind: string;
        readonly left: X.FixedToken;
        readonly right: X.FixedToken;
    };
    /** Tape for """ delimiters */
    readonly fence: {
        readonly kind: string;
        readonly left: X.FixedToken;
        readonly right: X.FixedToken;
    };
    /** Tape for markup literals */
    readonly markup: {
        readonly kind: string;
        readonly left: null;
        readonly right: null;
    };
};
export type Enclosure = (typeof Enclosure)[keyof typeof Enclosure];
/** Guards on whether the specified object is one of the items in the Enclosure const.  */
export declare function isEnclosure(object: any): object is Enclosure;
