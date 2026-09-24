export default {
	codeIn: `show(reply is Reply) (
	reply matches (
		{ code = 1 } console.log(1)
		{ code = 2 } console.log(2)
		else console.log(0)
	)
)
showArray(value is Arrays) (
	value matches (
		[1, 2] console.log(1)
		else console.log(0)
	)
)`,
} satisfies ParseCase;
