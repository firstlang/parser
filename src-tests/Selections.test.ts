import * as Assert from "node:assert/strict";
import * as Test from "node:test";
import * as X from "../src-language/XX.ts";
import * as Tasks from "../tasks.ts";

Test.test("selection bodies reject spreads, computed entries, functions, and retired syntax", () =>
{
	for (const codeIn of [
		"Bad is one of (\n...Base\n)",
		"Bad is many of (\n...Base\n)",
		"Bad is one case of (\n...Base\n)",
		"Bad is one of (\n8 + 8\n)",
		"Bad is one of (\nnext = compute()\n)",
		"Bad is one of (\nnext() (\n)\n)",
		"Bad is many of (\nnext() (\n)\n)",
		"Bad is one value of (\n16\n)",
	])
		Assert.throws(() => Tasks.roundTripParseCase({ codeIn }), codeIn);
});

Test.test("raw token instances are recognized", () =>
{
	Assert.ok(X.RawToken.new("bob") instanceof X.RawToken);
});

Test.test("nested masks retain their parent span and adjacent members", () =>
{
	Tasks.roundTripParseCase({ codeIn: "startup (\na = Reply.{ code = 1 }\nb = Sequence.[1, 2]\nc = Name.\"bob\"\n)" });
});

Test.test("fragment lens coordinates remain stable after an earlier mask collapses", () =>
{
	const language = new X.ProjectLanguage();
	const tape = language.createTape("a b c d");
	const fragment = [...tape.read()][0];
	const later = fragment.slice(2, 4);
	const first = new X.SelectionValueMask();
	const second = new X.SelectionValueMask();
	fragment.applyMask(first, 0, 2);
	Assert.equal(fragment.maskedSize, 3);
	later.applyMask(second, 0, later.maskedSize);
	Assert.equal(fragment.maskedSize, 2);
	Assert.deepEqual([...fragment.scan()].map(cursor => cursor.mask), [first, second]);
	Assert.equal(fragment.unmaskedTokenCount, 0);
});
