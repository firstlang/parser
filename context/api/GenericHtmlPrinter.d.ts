import * as X from "./X.ts";
/** */
export type TClassifiable = X.Mask | X.Token | X.Tape | X.Fragment | X.Enclosure;
export type ClassifierFn = (node: TClassifiable) => readonly string[];
export type SpanSeparatorFn = (parent: readonly string[], left: readonly string[], right: readonly string[], leftIndex: number, childCount: number) => string;
/**
 * A class that is responsible for printing the specified Tape into an HTML string
 * The emitter itself carries no language-specific knowledge; all such classification
 * is delegated to consumers of this class
 */
export declare class GenericHtmlPrinter {
    /** */
    constructor(tape: X.Tape, classifierFn: ClassifierFn, separatorFn?: SpanSeparatorFn);
    private readonly tape;
    private readonly classifierFn;
    private readonly separatorFn?;
    /** */
    toHtml(): string;
    /** */
    private mapMaskToSpanRecursive;
    /** */
    private translateField;
    /** */
    private spanifyToken;
}
/** */
export declare function toCssClass(maskName: string): string;
