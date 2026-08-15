import * as X from "./X.ts";

/** */
export type TClassifiable = X.Mask | X.Token | X.Tape | X.Fragment | X.Enclosure;
export type ClassifierFn = (node: TClassifiable) => readonly string[];

/**
 * A class that is responsible for printing the specified Tape into an HTML string
 * The emitter itself carries no language-specific knowledge; all such classification
 * is delegated to consumers of this class
 */
export class GenericHtmlPrinter
{
	/** */
	constructor(tape: X.Tape, classifierFn: ClassifierFn)
	{
		this.tape = tape;
		this.classifierFn = classifierFn;
	}
	
	private readonly tape: X.Tape;
	private readonly classifierFn: ClassifierFn;
	
	/** */
	toHtml()
	{
		// Rendering assumes a fully-read tape. readAll() is presumed idempotent
		// when the tape has already been (fully or partially) read.
		this.tape.readAll();
		
		const spans: ISpan[] = [];
		
		for (const cursor of this.tape.scan())
		{
			if (!cursor.mask)
				continue;
			
			const span = this.mapMaskToSpanRecursive(cursor.mask);
			spans.push(span);
		}
		
		const rootSpan = span(this.classifierFn(this.tape), ...spans);
		return toSpanStringRecursive(rootSpan);
	}

	/** */
	private mapMaskToSpanRecursive(mask: X.Mask)
	{
		const classes = this.classifierFn(mask);
		const content: TSpanChild[] = [];
		
		for (const maskField of mask.queryFields())
		{
			for (const fixedToken of maskField.structureBefore)
				content.push(this.spanifyToken(fixedToken));
			
			const enc = maskField.field.data.enclosure;
			if (enc.left && enc.right)
			{
				const enclosureContent: TSpanChild[] = [];
				
				if (enc.left)
					enclosureContent.push(this.spanifyToken(enc.left));
				
				enclosureContent.push(...this.translateField(maskField));
				
				if (enc.right)
					enclosureContent.push(this.spanifyToken(enc.right));
				
				content.push(span(this.classifierFn(enc), ...enclosureContent));
			}
			else content.push(...this.translateField(maskField));
			
			for (const fixedToken of maskField.structureAfter)
				content.push(this.spanifyToken(fixedToken));
		}
		
		return span(classes, ...content);
	}

	/** */
	private translateField(reflected: X.IMaskReflectedField)
	{
		const content: TSpanChild[] = [];
		
		if (reflected.field.kind === "has")
		{
			if (reflected.value === true)
				content.push(...reflected.field.match.map(token => this.spanifyToken(token)));
		}
		else for (const maskFieldValue of X.toArray(reflected.value).flat())
		{
			if (maskFieldValue === null)
				continue;
			
			if (maskFieldValue instanceof X.Mask)
				content.push(this.mapMaskToSpanRecursive(maskFieldValue));
			
			else if (maskFieldValue instanceof X.FlexToken ||
				maskFieldValue instanceof X.FixedToken ||
				maskFieldValue instanceof X.RawToken)
				content.push(this.spanifyToken(maskFieldValue));
			
			else debugger;
		}
		
		return content;
	}

	/** */
	private spanifyToken(token: X.FixedToken)
	{
		const classes = ["token", ...this.classifierFn(token)];
		const spn = span(classes, token.text);
		return spn;
	}
	
}

//# Span IR / printing

/** */
interface ISpan
{
	readonly classes: readonly string[];
	readonly children: readonly TSpanChild[];
}

type TSpanChild = string | ISpan;

/** */
function span(classes: readonly string[], ...children: readonly TSpanChild[]): ISpan
{
	return { classes, children };
}

/** */
function toSpanStringRecursive(span: ISpan, depth = 0): string
{
	const cls = span.classes.length > 0 ? ` class="${span.classes.join(" ")}"` : "";
	const indent = "\t".repeat(depth);
	const hasStringChild = span.children.some(c => typeof c === "string");
	
	if (hasStringChild)
	{
		const inner = span.children.map(toSpanStringInline).join("");
		return `${indent}<span${cls}>${inner}</span>`;
	}
	
	if (span.children.length === 0)
		return `${indent}<span${cls}></span>`;
	
	const inner = span.children
		.map(c => toSpanStringRecursive(c as ISpan, depth + 1))
		.join("\n");
	
	return `${indent}<span${cls}>\n${inner}\n${indent}</span>`;
}

/**
 * Renders a span and all of its descendants on a single line, with
 * no indentation and no separators between children.
 */
function toSpanStringInline(child: TSpanChild): string
{
	if (typeof child === "string")
		return child;
	
	const cls = child.classes.length > 0 ? ` class="${child.classes.join(" ")}"` : "";
	const inner = child.children.map(toSpanStringInline).join("");
	return `<span${cls}>${inner}</span>`;
}


/** */
export function toCssClass(maskName: string): string
{
	const trimmed = maskName.endsWith("Mask") ? maskName.slice(0, -4) : maskName;
	return trimmed
		.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
		.replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
		.toLowerCase();
}
