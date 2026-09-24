export default {
	codeIn: `Settings (
	small = 16
	Width is one of (
		this.small
		Settings.small
	)
	Named is one of (
		small = Settings.small
	)
)`,
} satisfies ParseCase;
