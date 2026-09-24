export default {
	codeIn: `Aggregate is one of (
	[1, 2]
	{ code = 1 }
	{ data = [1, 2] }
	{ data = { code = 2 } }
)
Empty is one of (
)
EmptyValues is one of (
	[]
	{}
	""
)`,
} satisfies ParseCase;
