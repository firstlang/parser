export default {
	codeIn: `Width is one of (
	16
	32
)
useWidth(width is Width) ()
run(input is int) (
	accepted = input is Width
	rejected = input is not Width
)
show(reply is Reply) (
	reply always matches (
		{ code = 1 } showOne()
		{ code = 2 } showTwo()
	)
)`,
} satisfies ParseCase;
