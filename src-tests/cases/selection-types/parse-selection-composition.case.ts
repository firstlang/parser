export default {
	codeIn: `Extended is Base or one of (
	c = 10
	d
)
Combined is First or Second or Third
Flags is BaseFlags or OtherFlags or many of (
	archive
)
Message is BaseMessage or one case of (
	text(value is string)
	closed()
)`,
} satisfies ParseCase;
