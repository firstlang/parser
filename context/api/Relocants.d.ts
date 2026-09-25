import * as X from "./X.ts";
/** */
export declare const delimiters: Readonly<{
    parenTapeL: X.FixedToken;
    parenTapeR: X.FixedToken;
    bracketTapeL: X.FixedToken;
    bracketTapeR: X.FixedToken;
    braceTapeL: X.FixedToken;
    braceTapeR: X.FixedToken;
    quoteTape: X.FixedToken;
    fenceTape: X.FixedToken;
}>;
/** */
export declare const delimitersForMarkup: Readonly<{
    markupClose: X.FixedToken;
    markupIslandClose: X.FixedToken;
}>;
/** */
export declare abstract class WhitespaceToken extends X.FlexToken {
}
/** */
export declare class SpaceToken extends WhitespaceToken {
    static readonly pattern: RegExp;
}
/** */
export declare class NewlineToken extends WhitespaceToken {
    static readonly pattern: RegExp;
}
/** */
export declare abstract class EntityToken extends X.FlexToken {
    static readonly pattern: RegExp;
}
/** */
export declare abstract class FlexDelimiterToken extends X.FlexToken {
}
export declare class MarkupOpenToken extends FlexDelimiterToken {
    static readonly pattern: RegExp;
}
export declare class MarkupStartToken extends FlexDelimiterToken {
    static readonly pattern: RegExp;
}
export declare class MarkupEndToken extends FlexDelimiterToken {
    static readonly pattern: RegExp;
}
export declare class MarkupAttrStartToken extends FlexDelimiterToken {
    static readonly pattern: RegExp;
}
