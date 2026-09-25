import * as X from "./X.ts";
/** */
export type TProxyable = X.TapeElement | X.Enclosure | X.Mask | typeof X.RawToken | typeof X.FlexToken | typeof X.Mask;
/** */
export declare const Proxy: {
    /** */
    define(proxyable: TProxyable): string;
    /** Gives a specialized token type the proxy of its general token type. */
    alias(proxyable: TProxyable, target: TProxyable): void;
    /** Returns the proxy character associated with the specified object. */
    get(proxyable: TProxyable): string;
    /** Returns the proxyable item that is mapped to the specified proxy character. */
    resolve(char: string): X.TProxyable;
    /**
     * Calls the resolve() function on each character in the specified
     * string and returns a string where each proxy character has
     * been replaced with a readable representation.
     */
    resolveString(string: string): string;
    /** */
    each(): Generator<[X.TProxyable, string], void, unknown>;
};
