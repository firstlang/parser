import * as Test from "node:test";
import * as Tasks from "../tasks.ts";

Test.test("anchor prose accepts narrow linguistic punctuation", () =>
{
	Tasks.roundTripParseCase({
		codeIn: `App (
	- Don't retry failed, user-visible work.
	- Keep parser-owned state stable.
	- Should startup retry network failures?
)`,
	});
});

Test.test("anchor prose accepts punctuation in line tape content", () =>
{
	for (const codeIn of [
		`App (
    - Keep startup: stable.
)`,
		`App (
    - Should startup retry? preserve state.
)`,
	])
		Tasks.roundTripParseCase({ codeIn });
});
