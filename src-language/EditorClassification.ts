import * as X from "../src-framework/X.ts";

/** Semantic target for the root editor surface synthesized by the HTML printer. */
export const EditorRoot = Symbol("EditorRoot");

/** A language object that can be converted to one or more editor CSS classes. */
export type EditorSemanticTarget =
	| typeof X.Mask
	| typeof X.FlexToken
	| X.FixedToken
	| X.Enclosure
	| typeof X.Enclosure
	| typeof EditorRoot
	| object;

/** Converts parser identities into classes shared by editor HTML and CSS. */
export class EditorClassifier
{
	constructor(tokenGroups: object)
	{
		this.indexTokenGroups(tokenGroups);
	}

	private readonly fixedTokenClasses = new Map<X.FixedToken, readonly string[]>();
	private readonly tokenGroupClasses = new WeakMap<object, string>();

	/** Returns every emitted class in general-to-specific order. */
	classify(value: X.Mask | X.Token | X.Tape | X.Fragment | X.Enclosure): readonly string[]
	{
		if (value instanceof X.Mask)
			return constructorClasses(value.constructor as typeof X.Mask, X.Mask);

		if (value instanceof X.FixedToken)
			return this.fixedTokenClasses.get(value) || [];

		if (value instanceof X.FlexToken)
		{
			const type = X.FlexToken.typeof(value);
			return type ? constructorClasses(type, X.FlexToken) : [];
		}

		if (value instanceof X.Tape)
			return ["root"];

		if (X.isEnclosure(value))
			return ["enclosure", enclosureClass(value)];

		return [];
	}

	/** Returns the single class used when a semantic target appears in a selector. */
	className(target: EditorSemanticTarget): string
	{
		if (target === EditorRoot)
			return "root";

		if (target === X.Enclosure)
			return "enclosure";

		if (X.isEnclosure(target))
			return enclosureClass(target);

		if (target instanceof X.FixedToken)
		{
			const classes = this.fixedTokenClasses.get(target);
			if (!classes)
				throw new Error(`FixedToken ${JSON.stringify(target.text)} is not present in tokenGroups.`);
			return classes.at(-1)!;
		}

		if (typeof target === "function" && X.Mask.isType(target))
			return classForConstructor(target);

		if (typeof target === "function" && constructorExtends(target, X.FlexToken))
			return classForConstructor(target);

		if (target !== null && typeof target === "object")
		{
			const className = this.tokenGroupClasses.get(target);
			if (!className)
				throw new Error("Selector object is not a token group or enclosure target.");
			return className;
		}

		throw new Error("Unsupported semantic selector.");
	}

	private indexTokenGroups(root: object): void
	{
		const visit = (node: unknown, path: readonly string[]) =>
		{
			if (node instanceof X.FixedToken)
			{
				if (path.length === 0)
					throw new Error("A FixedToken in tokenGroups has no property name.");
				this.fixedTokenClasses.set(node, path.map(X.toCssClass));
				return;
			}

			if (node !== null && typeof node === "object")
			{
				const name = path.at(-1);
				if (name)
					this.tokenGroupClasses.set(node, X.toCssClass(name));
				for (const [key, value] of Object.entries(node))
					visit(value, [...path, key]);
			}
		};

		visit(root, []);
	}
}

function constructorClasses(type: Function, excludedBase: Function)
{
	const classes: string[] = [];
	let current: Function | null = type;
	while (current && current !== excludedBase)
	{
		classes.push(X.toCssClass(current.name));
		current = Object.getPrototypeOf(current);
	}
	return classes.reverse();
}

function classForConstructor(type: Function)
{
	return X.toCssClass(type.name);
}

function enclosureClass(enclosure: X.Enclosure)
{
	return X.toCssClass(enclosure.kind.split(".").at(-1)!);
}

/** FlexToken customizes instanceof, so constructor inheritance is inspected directly. */
function constructorExtends(value: Function, base: Function): boolean
{
	for (let current: object | null = value; current; current = Object.getPrototypeOf(current))
		if (current === base)
			return true;
	return false;
}
