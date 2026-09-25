export default {
	codeIn: `App (
	// Startup guidance
	- Keeps startup errors understandable.
	- Should startup retry network failures?
	start() (
		- Load the startup configuration.
		- Makes initialization failures from {calculateThings} actionable.
		- Preserve the behavior described in {chat:startup-thread}.
	)
)`,
} satisfies ParseCase;
