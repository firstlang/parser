import * as X from "./XX.ts";

/** */
export class HtmlPrinter
{
	/** */
	constructor(tape: X.Tape)
	{
		this.classifier = new X.EditorClassifier(X.tokenGroups);
		this.innerPrinter = new X.GenericHtmlPrinter(tape, value => this.classifier.classify(value));
	}
	
	private readonly classifier;
	private readonly innerPrinter;
	
	/** */
	toHtml()
	{
		return this.innerPrinter.toHtml();
	}
	
}
