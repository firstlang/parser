import * as X from "./XX.ts";

/** Creates and configures the editor stylesheet's typed source of truth. */
export function createEditorCss()
{
	const editorCss = new X.EditorCss();

	editorCss.addFontFace({
		fontFamily: '"Laco"',
		fontStyle: "normal",
		fontWeight: 400,
		fontDisplay: "swap",
		src: 'url("https://raw.githubusercontent.com/paul-go/Laco/25a234891fdc9209099585988a3fb708711b7beb/build/Laco-Regular.woff2") format("woff2")',
	});

	editorCss.addFontFace({
		fontFamily: '"Laco"',
		fontStyle: "normal",
		fontWeight: 700,
		fontDisplay: "swap",
		src: 'url("https://raw.githubusercontent.com/paul-go/Laco/25a234891fdc9209099585988a3fb708711b7beb/build/Laco-Bold.woff2") format("woff2")',
	});

	editorCss.add(X.EditorRoot, {
		"--editor-ink": "hsl(220 18% 14%)",
		"--editor-muted": "hsl(220 9% 46%)",
		"--editor-blue": "hsl(216 88% 43%)",
		"--editor-violet": "hsl(263 72% 39%)",
		"--editor-green": "hsl(151 44% 34%)",
		"--editor-line": "hsl(216 20% 84%)",
		"--editor-line-height": "1.75",
		"--editor-surface": "hsl(216 24% 98%)",
		color: "var(--editor-ink)",
		display: "block",
		fontFamily: '"Laco", sans-serif',
		fontSize: 1.0625,
		fontWeight: 400,
		lineHeight: "var(--editor-line-height)",
		textRendering: "geometricPrecision",
		padding: 1,
	});

	editorCss.add(X.tokenGroups.words, {
		color: "var(--editor-blue)",
	});

	editorCss.add(X.tokenGroups.primitives, {
		color: "var(--editor-blue)",
		fontWeight: 700,
	});

	editorCss.add(X.tokenGroups.constants, {
		color: "var(--editor-blue)",
		fontWeight: 700,
	});

	editorCss.add(X.tokenGroups.prefixes, {
		color: "var(--editor-blue)",
	});

	editorCss.add(X.tokenGroups.suffixes, {
		color: "var(--editor-blue)",
	});

	editorCss.add(X.TypeExpressionMask, {
		fontWeight: 700,
	});

	editorCss.add(X.NamedTypeExpressionMask, {
		fontWeight: 700,
	});

	editorCss.add(X.tokenGroups.operators, {
		color: "var(--editor-violet)",
	});

	editorCss.add(X.tokenGroups.assigners, {
		color: "var(--editor-muted)",
	});

	editorCss.add(X.tokens.fn, {
		color: "var(--editor-blue)",
	});

	editorCss.add(X.tokens.return, {
		color: "var(--editor-blue)",
	});

	editorCss.add(X.FunctionMask, {
		display: "block",
	});

	editorCss.add([X.FunctionMask, " + ", X.FunctionMask], {
		marginTop: 1.75,
	});

	editorCss.add([X.FunctionMask, " > ", X.EntityToken], {
		fontWeight: 500,
	});

	editorCss.add([X.ParameterMask, " > ", X.EntityToken], {
		fontWeight: 500,
	});

	editorCss.add([X.ParameterMask, " + ", X.ParameterMask, "::before"], {
		color: "var(--editor-muted)",
		content: '", "',
	});

	editorCss.add([X.FunctionMask, " > ", X.Enclosure.paren, ":last-child"], {
		borderLeft: "1px solid var(--editor-line)",
		display: "block",
		padding: "0.2rem 0.2rem 0.4rem 1rem",
	});

	editorCss.add([X.FunctionMask, " > ", X.Enclosure.paren, ":last-child > ", X.Enclosure.paren.left], {
		display: "none",
	});

	editorCss.add([X.FunctionMask, " > ", X.Enclosure.paren, ":last-child > ", X.Enclosure.paren.right], {
		display: "none",
	});

	editorCss.add(X.SimpleAssignmentMask, {
		display: "block",
	});

	editorCss.add(X.ReturnStatementMask, {
		display: "block",
	});

	// EachMask and the `each` token both normalize to `.each`.
	editorCss.add([X.EachMask, ":not(.token)"], {
		borderColor: "var(--editor-line)",
		borderStyle: "solid",
		borderWidth: "0 1px 1px 0",
		clipPath: "inset(-100vmax 0)",
		display: "block",
		marginBlock: "0.85rem 0.65rem",
		padding: "0 0.75rem 0.55rem 0",
		position: "relative",
	});

	editorCss.add([X.EachMask, ":not(.token)::before"], {
		borderLeft: "1px solid var(--editor-line)",
		bottom: 0,
		content: '""',
		left: 0,
		position: "absolute",
		top: "1.5ch",
	});

	editorCss.add([X.EachMask, ":not(.token) > :not(.enclosure)"], {
		position: "relative",
		top: "-0.875em",
	});

	editorCss.add([X.EachMask, ":not(.token) > ", X.EntityToken, "::after"], {
		borderTop: "1px solid var(--editor-line)",
		content: '""',
		left: "calc(100% + 0.35rem)",
		position: "absolute",
		top: "50%",
		width: "100vw",
	});

	editorCss.add([X.EachMask, " > ", X.Enclosure.paren, ":last-child"], {
		display: "block",
		marginTop: "-0.875em",
		padding: "0 0 0.1rem 1rem",
	});

	editorCss.add([X.EachMask, " > ", X.Enclosure.paren, ":last-child > ", X.Enclosure.paren.left], {
		display: "none",
	});

	editorCss.add([X.EachMask, " > ", X.Enclosure.paren, ":last-child > ", X.Enclosure.paren.right], {
		display: "none",
	});
	
	editorCss.add(X.Enclosure.paren.left, {
	    opacity: 0.5,
	    padding: "0 0.08rem",
	});
	
	editorCss.add(X.Enclosure.paren.right, {
	    opacity: 0.5,
	    padding: "0 0.08rem",
	});
	
	return editorCss;
}
