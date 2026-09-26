export default {
	codeIn: `run() (
	this.member = "value"
	this.child.member = byte "value"
	this.items[0].name = "value"
	other.member = "value"
	make().member = "value"
	items[0] += 1
)`,
} satisfies ParseCase;
