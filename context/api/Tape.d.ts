import * as X from "./X.ts";
/**
 * A Tape element can have parsed items in them, but additionally, they can
 * also have Masks. This may seem like it's cart-before-horse. How can a tape
 * have a mask if masks haven't been created yet? It's because tapes need
 * to be incrementally rewritable into Mask graphs. You don't create a separate
 * Mask tree that is adjacent to the Tape tree... thinking that you should is an
 * indication that you may have contracted functionalitis.
 */
export type TapeElement = Tape | X.Token;
/**
 *
 */
export type TapeLike = Tape | X.Fragment | X.Lens;
/**
 * An object that stores information discovered at a specific point in a tape.
 */
export interface ITapeNavigationCursor extends X.IFragmentCursor {
    /** */
    containingTape: X.Tape;
}
/** */
export declare class Tape {
    /** */
    constructor(fragmenter: X.FixedToken, enclosure?: X.Enclosure);
    /** */
    readonly lamport: number;
    /***/
    readonly enclosure: X.Enclosure;
    /** Stores the separator token that forces a fragment into existence. */
    private readonly fragmenter;
    /** */
    private readonly fragments;
    /** */
    private readonly unreadTokens;
    /** Visits all fragments, including enclosure contents already read for matching. */
    readFragments(): IterableIterator<X.Fragment>;
    /**
     * Reads the tape into fragments, evicting whitespace on discovery.
     *
     * Fragment boundaries are determined by:
     *   - A comma token (static delimiter)
     *   - A newline followed by content at an indent level <= the fragment's
     *     base indent (same logic as the original TapeReader)
     *
     * The readHead is advanced past every token consumed (whitespace is
     * evicted without advancing the conceptual index, because the slot
     * literally disappears from the array).
     *
     * Yielded Lens slices use post-eviction indexes.
     */
    read(): Generator<X.Fragment>;
    /**
     * Forces the entire tape to be read into fragments.
     * Useful for tests.
     */
    readAll(): void;
    /**
     * Gets the total number of tokens of the tape (only raw tokens are counted).
     * The value is computed from the total number of tokens of all fragments
     * inside this tape.
     */
    get tokenSize(): number;
    /**
     * Gets the total number of tokens that exist across all fragments. Only tokens
     * that have been read from the stream and have been moved into Fragment
     * objects are counted in this total.
     */
    private get totalFragmentSize();
    /**
     * Gets the mask-aware length of the tape. The value is computed from
     * mask-aware length of all fragments inside this tape.
     */
    get maskedSize(): number;
    /** */
    get unmaskedTokenCount(): number;
    /** */
    get totalSize(): number;
    /**
     * Slices a span of tokens and returns a Lens that is anchored to
     * this slice boundary. The coordinates are relative to the Tape's
     * masked elements, not the raw tokens.
     */
    slice(begin: number, end: number): X.Lens;
    /**
     * Adds a token to the unread tokens array.
     * This method is intended to be used during loading.
     */
    append(token: X.Token | X.Tape): void;
    /**
     * Adds a token to an existing fragment.
     * If the Tape has no fragments then the Tape has not been
     * loaded and doesn't support insertion.
     */
    insertToken(token: X.Token | X.Tape, at?: number): X.Mask | null;
    /** */
    deleteToken(at: number): X.Mask | null;
    /** */
    applyMask(mask: X.Mask, from: number, to: number): X.Mask | null;
    /** */
    get charstring(): string;
    /** */
    get charstringReadable(): string;
    /** Mask-aware index lookup. */
    at(index: number): X.Tape | X.Token | X.Mask;
    /**
     * Scans through each fragment in the tape, as well as any other trailing tokens,
     * and yield information about what is found at each slot.
     */
    scan(): Generator<{
        token: X.Tape | X.Token;
        mask: null;
        tokensCovered: null;
    } | {
        token: null;
        mask: X.Mask;
        tokensCovered: (X.Tape | X.Token)[];
    }, void, unknown>;
    /**
     * Stub.
     * Defers to Fragment.toTokenRelative once Tape-level offset bookkeeping is worked out.
     */
    toTokenRelative(maskRelativeIndex: number): number;
    /**
     * Stub.
     * Defers to Fragment.toMaskRelative once Tape-level offset bookkeeping is worked out.
     */
    toMaskRelative(tokenRelativeIndex: number): number;
    /** Finds a fragment from the specified mask-relative index. */
    private findFragment;
}
