import * as X from "./XX.ts";

/** A Mask constructor, FlexToken constructor, FixedToken, or object in tokenGroups. */
export type SemanticSelector = X.EditorSemanticTarget;

export type SelectorPart = SemanticSelector | string;
export type Selector = SemanticSelector | readonly SelectorPart[];

export interface WidthCondition
{
	readonly minWidth?: number | string;
	readonly maxWidth?: number | string;
}

interface ConditionalValue<T>
{
	readonly condition: ContainerCondition | ScreenCondition;
	readonly value: T;
}

interface ContainerCondition extends WidthCondition
{
	readonly kind: "container";
	readonly container: typeof X.Mask;
}

interface ScreenCondition extends WidthCondition
{
	readonly kind: "screen";
}

type CssProperty = {
	[K in keyof CSSStyleDeclaration]: CSSStyleDeclaration[K] extends string ? K : never
}[keyof CSSStyleDeclaration];

type CssPrimitive = string | number;
type CssAuthoredValue = CssPrimitive | ConditionalValue<CssPrimitive>;
type CssPropertyValue = CssAuthoredValue | readonly CssAuthoredValue[];

/** Camel-cased CSS declarations. Custom properties use their normal --name spelling. */
export type Style = Partial<Record<CssProperty, CssPropertyValue>> &
	Partial<Record<`--${string}`, CssPropertyValue>>;

interface AuthoredRule
{
	readonly selector: Selector;
	readonly style: Style;
}

interface PrintedRule
{
	readonly selector: string;
	readonly declarations: readonly PrintedDeclaration[];
}

interface PrintedDeclaration
{
	readonly property: string;
	readonly value: string;
}

/** Applies a value while the named Mask container satisfies the width condition. */
export function whenContainer<T extends CssPrimitive>(
	container: typeof X.Mask,
	condition: WidthCondition,
	value: T): ConditionalValue<T>
{
	return { condition: { kind: "container", container, ...condition }, value };
}

/** Applies a value while the screen viewport satisfies the width condition. */
export function whenScreen<T extends CssPrimitive>(
	condition: WidthCondition,
	value: T): ConditionalValue<T>
{
	return { condition: { kind: "screen", ...condition }, value };
}

/**
 * Stores editor rules in authoring form, resolves semantic selectors, and emits CSS.
 * Rule order and fallback declaration order are preserved.
 */
export class EditorCss
{
	constructor(tokenGroups: object = X.tokenGroups)
	{
		this.classifier = new X.EditorClassifier(tokenGroups);
	}

	private readonly rules: AuthoredRule[] = [];
	private readonly classifier;

	/** Adds one rule. This intentionally does not return a chaining builder. */
	add(selector: Selector, style: Style): void
	{
		this.rules.push({ selector, style });
	}

	/** Resolves a semantic value to the class emitted for it by the HTML printer. */
	className(target: SemanticSelector): string
	{
		return this.classifier.className(target);
	}

	/** Converts all rules to deterministic, ordinary CSS text. */
	toString(): string
	{
		const baseRules: PrintedRule[] = [];
		const conditionalRules = new Map<string, { condition: ContainerCondition | ScreenCondition, rules: PrintedRule[] }>();
		const containers = new Map<string, typeof X.Mask>();

		for (const rule of this.rules)
		{
			const selector = this.resolveSelector(rule.selector);
			const base: PrintedDeclaration[] = [];

			for (const [property, authored] of Object.entries(rule.style))
			{
				for (const item of Array.isArray(authored) ? authored : [authored])
				{
					if (isConditional(item))
					{
						if (item.condition.kind === "container")
							containers.set(this.className(item.condition.container), item.condition.container);

						const key = this.conditionKey(item.condition);
						let group = conditionalRules.get(key);
						if (!group)
						{
							group = { condition: item.condition, rules: [] };
							conditionalRules.set(key, group);
						}
						group.rules.push({ selector, declarations: [this.declaration(property, item.value)] });
					}
					else base.push(this.declaration(property, item));
				}
			}

			if (base.length > 0)
				baseRules.push({ selector, declarations: base });
		}

		const sections: string[] = [];
		for (const [className] of containers)
			sections.push(this.printRule({ selector: `.${className}`, declarations: [
				{ property: "container-name", value: className },
				{ property: "container-type", value: "inline-size" },
			] }));

		sections.push(...baseRules.map(rule => this.printRule(rule)));

		for (const group of conditionalRules.values())
		{
			const inner = group.rules.map(rule => indent(this.printRule(rule))).join("\n\n");
			sections.push(`${this.printCondition(group.condition)} {\n${inner}\n}`);
		}

		return sections.length === 0 ? "" : sections.join("\n\n") + "\n";
	}

	private resolveSelector(selector: Selector): string
	{
		const parts = Array.isArray(selector) ? selector : [selector];
		if (parts.length === 0)
			throw new Error("A selector cannot be empty.");

		const resolved = parts.map(part =>
			typeof part === "string" ? part : `.${this.className(part)}`).join("");
		if (resolved.trim().length === 0)
			throw new Error("A selector cannot resolve to an empty string.");
		return resolved;
	}

	private declaration(property: string, value: CssPrimitive): PrintedDeclaration
	{
		return {
			property: toDashCase(property),
			value: typeof value === "number" ? serializeNumber(property, value) : value,
		};
	}

	private conditionKey(condition: ContainerCondition | ScreenCondition): string
	{
		const target = condition.kind === "container" ? this.className(condition.container) : "screen";
		return `${condition.kind}:${target}:${String(condition.minWidth)}:${String(condition.maxWidth)}`;
	}

	private printCondition(condition: ContainerCondition | ScreenCondition): string
	{
		const tests: string[] = [];
		if (condition.minWidth !== undefined)
			tests.push(`(min-width: ${serializeWidth(condition.minWidth)})`);
		if (condition.maxWidth !== undefined)
			tests.push(`(max-width: ${serializeWidth(condition.maxWidth)})`);
		if (tests.length === 0)
			throw new Error(`${condition.kind} condition must specify minWidth or maxWidth.`);

		return condition.kind === "container"
			? `@container ${this.className(condition.container)} ${tests.join(" and ")}`
			: `@media screen and ${tests.join(" and ")}`;
	}

	private printRule(rule: PrintedRule): string
	{
		const body = rule.declarations
			.map(declaration => `\t${declaration.property}: ${declaration.value};`)
			.join("\n");
		return `${rule.selector} {\n${body}\n}`;
	}

}

const remProperties = new Set<string>([
	"blockSize", "borderRadius", "borderWidth", "bottom", "columnGap", "fontSize",
	"gap", "height", "inlineSize", "inset", "left", "letterSpacing", "margin",
	"marginBlock", "marginBlockEnd", "marginBlockStart", "marginBottom", "marginInline",
	"marginInlineEnd", "marginInlineStart", "marginLeft", "marginRight", "marginTop",
	"maxBlockSize", "maxHeight", "maxInlineSize", "maxWidth", "minBlockSize", "minHeight",
	"minInlineSize", "minWidth", "outlineOffset", "outlineWidth", "padding", "paddingBlock",
	"paddingBlockEnd", "paddingBlockStart", "paddingBottom", "paddingInline",
	"paddingInlineEnd", "paddingInlineStart", "paddingLeft", "paddingRight", "paddingTop",
	"right", "rowGap", "textIndent", "top", "width", "wordSpacing",
]);

const unitlessProperties = new Set<string>([
	"animationIterationCount", "aspectRatio", "columnCount", "fillOpacity", "flexGrow",
	"flexShrink", "fontWeight", "gridColumn", "gridColumnEnd", "gridColumnStart", "gridRow",
	"gridRowEnd", "gridRowStart", "lineHeight", "opacity", "order", "orphans", "scale",
	"stopOpacity", "strokeMiterlimit", "strokeOpacity", "tabSize", "widows", "zIndex", "zoom",
]);

function serializeNumber(property: string, value: number): string
{
	if (!Number.isFinite(value))
		throw new Error(`${property} must have a finite numeric value.`);
	if (value === 0)
		return "0";
	if (remProperties.has(property))
		return `${value}rem`;
	if (unitlessProperties.has(property))
		return String(value);
	throw new Error(`Numeric values have no sanctioned unit for ${property}; use a string.`);
}

function serializeWidth(value: number | string): string
{
	if (typeof value === "string")
		return value;
	if (!Number.isFinite(value))
		throw new Error("Query widths must be finite.");
	return value === 0 ? "0" : `${value}rem`;
}

function toDashCase(property: string): string
{
	if (property.startsWith("--"))
		return property;
	const dashed = property.replace(/[A-Z]/g, character => `-${character.toLowerCase()}`);
	return /^(webkit|moz|ms)-/.test(dashed) ? `-${dashed}` : dashed;
}

function isConditional(value: unknown): value is ConditionalValue<CssPrimitive>
{
	return value !== null && typeof value === "object" && "condition" in value && "value" in value;
}

function indent(text: string): string
{
	return text.split("\n").map(line => `\t${line}`).join("\n");
}
