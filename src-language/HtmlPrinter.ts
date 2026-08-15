import * as X from "./XX.ts";

/** */
export class HtmlPrinter
{
	/** */
	constructor(tape: X.Tape)
	{
		this.fixedTokenClassMap = buildFixedTokenClassMap(X.tokenGroups);
		this.innerPrinter = new X.GenericHtmlPrinter(tape, n => this.classifier(n));
	}
	
	/** Map of FixedToken identity -> CSS classes (e.g. ["primitives", "ints", "int"]) */
	private readonly fixedTokenClassMap: ReadonlyMap<X.FixedToken, readonly string[]>;
	private readonly innerPrinter;
	
	/** */
	toHtml()
	{
		return this.innerPrinter.toHtml();
	}
	
	/** */
	private classifier(classifiable: X.TClassifiable)
	{
		if (classifiable instanceof X.FixedToken)
			return this.fixedTokenClassMap.get(classifiable) || [];
		
		if (classifiable instanceof X.FlexToken)
		{
			const type = X.FlexToken.typeof(classifiable);
			return type ? [X.toCssClass(type.name)] : [];
		}
		
		return [];
	}
}

/**
 * Recursively scans an object tree (such as tokenGroups), and returns
 * a Map that associates each FixedToken with the CSS class names for the
 * keys traversed to reach it, ordered from most general to most specific.
 */
export function buildFixedTokenClassMap(root: object): ReadonlyMap<X.FixedToken, readonly string[]>
{
	const map = new Map<X.FixedToken, readonly string[]>();
	
	const visit = (node: unknown, path: string[]) =>
	{
		if (node instanceof X.FixedToken)
		{
			map.set(node, path.map(X.toCssClass));
			return;
		}
		
		if (node !== null && typeof node === "object")
			for (const [key, value] of Object.entries(node))
				visit(value, [...path, key]);
	};
	
	visit(root, []);
	return map;
}
