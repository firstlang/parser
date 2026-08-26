import * as X from "./XX.ts";

/** */
export class HtmlPrinter
{
	/** */
	constructor(tape: X.Tape)
	{
		this.classifier = new X.EditorClassifier(X.tokenGroups);
		this.innerPrinter = new X.GenericHtmlPrinter(
			tape,
			value => this.classifier.classify(value),
			(parent, left, right, leftIndex, childCount) =>
			{
				if (parent.includes("paren") || parent.includes("enclosure"))
				{
					if (leftIndex === 0 || leftIndex === childCount - 2)
						return "";
					if (left.includes("parameter") && right.includes("parameter"))
						return "";
				}
				
				if (right.includes("paren") || right.includes("function-activator"))
					return "";
				
				if (left.includes("dot") || right.includes("dot"))
					return "";
				
				return " ";
			},
		);
	}
	
	private readonly classifier;
	private readonly innerPrinter;
	
	/** */
	toHtml()
	{
		return this.innerPrinter.toHtml();
	}
	
}
