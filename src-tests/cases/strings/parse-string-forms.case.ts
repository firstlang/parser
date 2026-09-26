export default {
	codeIn: 'startup (\n' + [
		'plain = "Hello, {name}"',
		'bytes = byte "HTTP\\x00\\xFF"',
		'greeting = `Hello, {name}!`',
		'packet = byte `Hello, {name}!`',
		'empty = ""',
		'emptyTemplate = ``',
		'emptyIsland = `before {} after`',
		'onlySpaces = "   "',
		'spaces = "  \\t  "',
		'escaped = "a\\"b\\\\c"',
		'braces = `\\{literal\\} and \\`quoted\\` }`',
		'multiline = "\n  first  line\n\tsecond line\n"',
		'multilineTemplate = `\n  hello {name}\n  goodbye\n`',
	].join('\n') + '\n)',
} satisfies ParseCase;
