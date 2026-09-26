export default {
	codeIn: 'run(value = byte "default") (\n' + [
		'message = `result: {format(value)}`',
		'nested = `outer {`inner {value}`} end`',
		'object = `value {{ id is string = "bob" }}`',
		'quoted = `value {"}"}`',
		'adjacent = `{first}{second}`',
		'sum = `total {count + 1}`',
		'call("text", byte `value {value}`)',
		'item = { id is string = `id {value}`, data is byte string = byte "A" }',
		'joined = "a" + `b {value}`',
		'length = byte "abc".length',
		'return `done {value}`',
	].join('\n') + '\n)',
} satisfies ParseCase;
