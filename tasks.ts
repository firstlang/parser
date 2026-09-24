import * as Assert from "node:assert";
import * as Child from "node:child_process";
import * as Fs from "node:fs";
import * as Path from "node:path";
import * as Url from "node:url";
import * as X from "./src-language/XX.ts";
import { Legend } from "./src-framework/Legend.ts";

const Operation = {
	legend: "legend",
	tests: "tests",
	print: "print",
	css: "css",
	all: "all",
};

export const CasePaths = {
	cases: Url.fileURLToPath(new URL("./src-tests/cases/", import.meta.url)),
	html: Url.fileURLToPath(new URL("./src-tests/cases-html/", import.meta.url)),
	legend: Url.fileURLToPath(new URL("./context/legend.md", import.meta.url)),
	editorCss: Url.fileURLToPath(new URL("./src-tests/cases-html/editor.css", import.meta.url)),
	results: Url.fileURLToPath(new URL("./src-tests/+results.json", import.meta.url)),
} as const;

/** Runs one explicitly selected prebuild operation. */
export async function startup(operation: string, caseSelector?: string)
{
	if (!(Object.values(Operation)).includes(operation))
		throw new Error("Expected operation to be 'legend', 'tests', 'print', 'css', or 'all'.");
	
	if (operation === Operation.all)
	{
		const failures: unknown[] = [];
		writeLegend();
		writeEditorCss();
		
		try { await runTests(); }
		catch (error) { failures.push(error); }
		
		try { await writeCasesHtml(CasePaths.cases, CasePaths.html, caseSelector); }
		catch (error) { failures.push(error); }
		
		if (failures.length > 0)
			throw new AggregateError(failures, "One or more tasks failed.");
		
		return;
	}

	if (operation === Operation.legend || operation === Operation.all)
		writeLegend();

	if (operation === Operation.tests || operation === Operation.all)
		await runTests();

	if (operation === Operation.print || operation === Operation.all)
		await writeCasesHtml(CasePaths.cases, CasePaths.html, caseSelector);

	if (operation === Operation.css)
		writeEditorCss();
}

/** Writes the token legend to the requested destination. */
export function writeLegend(outputPath = CasePaths.legend)
{
	console.log("Writing legend file to: " + outputPath);
	Legend.write(outputPath);
}

/** Runs typechecking and every registered parser test. */
export async function runTests(
	casesFolder = CasePaths.cases,
	resultsPath = CasePaths.results)
{
	run("npm", ["run", "typecheck"]);
	
	const results: Record<string, true | string> = {};
	const failures: unknown[] = [];
	for (const filePath of discoverParseCaseFiles(casesFolder))
	{
		const caseName = caseNameFromPath(filePath, casesFolder);
		try
		{
			const parseCase = (await import(Url.pathToFileURL(filePath).href)).default as ParseCase;
			roundTripParseCase(parseCase);
			results[caseName] = true;
			console.log(`PASS ${caseName}`);
		}
		catch (error)
		{
			failures.push(error);
			results[caseName] = errorMessage(error);
			console.error(`FAIL ${caseName}:`);
			console.error(error);
		}
	}

	Fs.writeFileSync(resultsPath, JSON.stringify(results, null, "\t") + "\n");
	console.log(`Passed ${Object.keys(results).length - failures.length}; failed ${failures.length}.`);
	
	if (failures.length > 0)
		throw new AggregateError(failures, "One or more parser cases failed.");
}

/** Validates parser cases and writes HTML only for successful complete parses. */
export async function writeCasesHtml(
	casesFolder = CasePaths.cases,
	htmlFolder = CasePaths.html,
	caseSelector?: string)
{
	let generated = 0;
	let skipped = 0;
	const failures: unknown[] = [];
	const caseFiles = discoverParseCaseFiles(casesFolder)
		.filter(filePath => !caseSelector || caseNameFromPath(filePath, casesFolder).includes(caseSelector));
	
	if (caseSelector && caseFiles.length === 0)
		throw new Error(`No parser case matched: ${caseSelector}`);

	for (const filePath of caseFiles)
	{
		const relativePath = Path.relative(casesFolder, filePath).replace(/\.case\.ts$/, ".html");
		const htmlPath = Path.join(htmlFolder, relativePath);
		if (Fs.existsSync(htmlPath))
			Fs.unlinkSync(htmlPath);

		try
		{
			const parseCase = (await import(Url.pathToFileURL(filePath).href)).default as ParseCase;
			roundTripParseCase(parseCase);
			if (parseCase.codeOut !== undefined)
			{
				skipped++;
				continue;
			}

			Fs.mkdirSync(Path.dirname(htmlPath), { recursive: true });
			Fs.writeFileSync(htmlPath, renderParseCaseHtml(parseCase));
			generated++;
		}
		catch (error)
		{
			failures.push(error);
			console.error(`Failed: ${caseNameFromPath(filePath, casesFolder)}`);
			console.error(error);
		}
	}

	console.log(`Generated ${generated} case HTML file(s); skipped ${skipped}; failed ${failures.length}.`);
	if (failures.length > 0)
		throw new AggregateError(failures, "One or more parser cases failed.");
}

/** Generates the editor stylesheet from its typed authoring module. */
export function writeEditorCss(outputPath = CasePaths.editorCss)
{
	const editorCss = X.createEditorCss();
	Fs.mkdirSync(Path.dirname(outputPath), { recursive: true });
	Fs.writeFileSync(outputPath, editorCss.toString());
	console.log("Writing editor CSS to: " + outputPath);
}

/** Finds every parser case beneath the requested root. */
export function discoverParseCaseFiles(casesFolder = CasePaths.cases)
{
	if (!Fs.existsSync(casesFolder))
		return [];

	return Fs.globSync("**/*.case.ts", { cwd: casesFolder })
		.map(filePath => Path.resolve(casesFolder, filePath))
		.sort();
}

/** Returns a stable case name relative to the selected cases root. */
export function caseNameFromPath(filePath: string, casesFolder = CasePaths.cases)
{
	return Path.relative(casesFolder, filePath).replaceAll(Path.sep, "/");
}

/** Returns the concise primary message for a failed parser case. */
function errorMessage(error: unknown)
{
	if (error instanceof Error)
		return error.message.split("\n", 1)[0] || "Test failed";
	
	if (error && typeof error === "object" && "message" in error)
		return String(error.message).split("\n", 1)[0] || "Test failed";
	
	return error === undefined ? "Test failed" : String(error).split("\n", 1)[0];
}

/** Runs a required child operation and preserves its terminal output. */
function run(command: string, args: string[])
{
	const result = Child.spawnSync(command, args, {
		cwd: Url.fileURLToPath(new URL("./", import.meta.url)),
		stdio: "inherit",
	});
	
	if (result.error)
		throw result.error;
	
	if (result.status !== 0)
		throw new Error(`${command} exited with status ${result.status}.`);
}

//# Parse test tools

/** */
export function roundTripParseCase(parseCase: ParseCase)
{
	const lang = new X.ProjectLanguage();
	const codeIn = parseCase.codeIn.trim();
	const codeOut = (parseCase.codeOut ?? parseCase.codeIn).trim();
	const tape = lang.createMaskedTape(codeIn);
	const tokensExpected = lang.createTokenStrings(codeOut)
		.filter(s => !/^\s+$/.test(s));
	
	const tokensParsed = printParsedTokens(tape);
	Assert.deepStrictEqual(
		tokensParsed,
		tokensExpected,
		createMismatchMessage(tokensParsed, tokensExpected),
	);
}

/** Renders a parser case with the same language and tape used by the editor. */
export function renderParseCaseHtml(parseCase: ParseCase)
{
	const lang = new X.ProjectLanguage();
	const tape = lang.createMaskedTape(parseCase.codeIn.trim());
	return new X.HtmlPrinter(tape).toHtml();
}

/** */
function printParsedTokens(tape: X.Tape)
{
	const tokens: string[] = [];
	
	const recurse = (mask: X.Mask) =>
	{
		const maskType = mask.constructor as typeof X.Mask;
		const maskEnclosure = maskType.descriptor.enclosure;
		
		if (maskEnclosure.left)
			tokens.push(maskEnclosure.left.text);
		
		for (const maskField of mask.queryFields())
		{
			for (const fixedToken of maskField.structureBefore)
				tokens.push(fixedToken.text);
			
			const enc = maskField.field.data.enclosure;
			const fieldValue = X.toArray(maskField.value).flat();
			const valueHasSameEnclosure = fieldValue.some(v =>
				v instanceof X.Mask &&
				(v.constructor as typeof X.Mask).descriptor.enclosure === enc);
			
			if (enc.left && !valueHasSameEnclosure)
				tokens.push(enc.left.text);
			
			for (const fixedToken of maskField.anchorConditional)
				tokens.push(fixedToken.text);
			
			for (const [index, maskFieldValue] of fieldValue.entries())
			{
				if (index > 0 && (
					mask instanceof X.SelectionArrayMask ||
					maskField.field.match.some(match => match === X.TypedParameterMask) ||
						(mask instanceof X.GenericTypeExpressionMask &&
						maskField.field.data.enclosure === X.Enclosure.paren)))
					tokens.push(X.tokens.comma.text);

				if (maskFieldValue instanceof X.Mask)
					recurse(maskFieldValue);
				
				else if (maskFieldValue instanceof X.FlexToken ||
					maskFieldValue instanceof X.FixedToken ||
					maskFieldValue instanceof X.RawToken)
					if (maskFieldValue.text !== "")
						tokens.push(maskFieldValue.text);
			}
			
			if (enc.right && !valueHasSameEnclosure)
				tokens.push(enc.right.text);
			
			for (const fixedToken of maskField.structureAfter)
				tokens.push(fixedToken.text);
		}
		
		if (maskEnclosure.right)
			tokens.push(maskEnclosure.right.text);
	}
	
	tape.readAll();
	
	for (const cursor of tape.scan())
	{
		if (cursor.mask)
			recurse(cursor.mask);
		
		else if (cursor.token === X.tokens.comma)
			tokens.push(X.tokens.comma.text);
	}
	
	return tokens;
}

/** Describes the first token at which parsed and expected output diverge. */
function createMismatchMessage(actual: string[], expected: string[])
{
	const length = Math.max(actual.length, expected.length);
	let index = 0;
	while (index < length && actual[index] === expected[index])
		index++;

	if (index === length)
		return "Parsed tokens match expected tokens.";

	const from = Math.max(0, index - 5);
	const to = index + 6;
	return [
		`Round-trip mismatch at token ${index}.`,
		`Expected: ${JSON.stringify(expected[index])}`,
		`Actual: ${JSON.stringify(actual[index])}`,
		`Expected context: ${JSON.stringify(expected.slice(from, to))}`,
		`Actual context: ${JSON.stringify(actual.slice(from, to))}`,
	].join("\n");
}

//# Entry point

if (process.argv[1] && import.meta.url === Url.pathToFileURL(process.argv[1]).href)
	await startup(process.argv[2] ?? Operation.all, process.argv[3]);
