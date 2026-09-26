import * as Assert from "node:assert/strict";
import * as Test from "node:test";
import * as X from "../src-language/XX.ts";
import * as Tasks from "../tasks.ts";

function masksIn(code: string): X.Mask[]
{
	const language = new X.ProjectLanguage();
	const tape = language.createMaskedTape(code);
	const masks: X.Mask[] = [];
	function visit(mask: X.Mask)
	{
		masks.push(mask);
		for (const field of mask.queryFields())
			for (const value of X.toArray(field.value).flat())
				if (value instanceof X.Mask)
					visit(value);
	}
	tape.readAll();
	for (const cursor of tape.scan())
		if (cursor.mask)
			visit(cursor.mask);
	return masks;
}

Test.test("plain strings preserve source text and byte tagging", () =>
{
	const source = '  {name}\t\r\n\\"\\\\\\xFF ' + String.fromCodePoint(0xE9, 0x1F600);
	for (const prefix of ["", "byte "])
	{
		const codeIn = 'startup (\nvalue = ' + prefix + '"' + source + '"\n)';
		Tasks.roundTripParseCase({ codeIn });
		const masks = masksIn(codeIn);
		const strings = masks.filter(mask => mask instanceof X.StringLiteralMask);
		Assert.equal(strings.length, 1);
		Assert.equal(strings[0].content.text, source);
		Assert.equal(strings[0].isByteString, prefix !== "");
		Assert.equal(masks.filter(mask => mask instanceof X.StringInterpolationMask).length, 0);
	}
});

Test.test("interpolated strings retain text, nested expression masks, and empty islands", () =>
{
	const codeIn = 'startup (\nvalue = byte ` hello {format("}")} {`nested {name}`}{}! `\n)';
	Tasks.roundTripParseCase({ codeIn });
	const masks = masksIn(codeIn);
	const strings = masks.filter(mask => mask instanceof X.InterpolatedStringMask);
	Assert.equal(strings.length, 2);
	Assert.equal(strings[0].isByteString, true);
	Assert.equal(strings[1].isByteString, false);
	Assert.deepEqual(strings[0].content.filter(part => part instanceof X.RawToken).map(part => part.text),
		[" hello ", " ", "! "]);
	Assert.equal(masks.filter(mask => mask instanceof X.StringInterpolationMask).length, 4);
	Assert.ok(masks.some(mask => mask instanceof X.FunctionActivatorMask));
});

Test.test("incomplete source returns partial tapes without throwing or hanging", () =>
{
	const language = new X.ProjectLanguage();
	for (const code of ['"unfinished', '`unfinished', '`{value', '`{value ', '`{value\t', '`{ "nested"', 'byte "unfinished', '"tail\\', '`tail\\', '(', '[', '{', '<tag', '<tag>'])
	{
		const tape = language.createTape(code);
		Assert.ok(tape instanceof X.Tape);
		Assert.ok(tape.tokenSize > 0, code);
	}
	const tape = language.createTape('"unfinished');
	const string = tape.at(0);
	Assert.ok(string instanceof X.Tape);
	Assert.equal(string.enclosure, X.Enclosure.quote);
	Assert.equal((string.at(0) as X.RawToken).text, "unfinished");
});

Test.test("unrecognized characters remain available for recovery", () =>
{
	const language = new X.ProjectLanguage();
	const source = String.fromCodePoint(0x1F600);
	const tape = language.createTape(source);
	Assert.ok(tape.at(0) instanceof X.RawToken);
	Assert.equal((tape.at(0) as X.RawToken).text, source);
});

Test.test("member and indexed assignments share the general assignment mask", () =>
{
	for (const target of ["this.member", "this.child.member", "items[0]", "make().member"])
	{
		const masks = masksIn('run() (\n' + target + ' = byte "value"\n)');
		Assert.equal(masks.filter(mask => mask instanceof X.ComplexAssignmentMask).length, 1);
	}
});
