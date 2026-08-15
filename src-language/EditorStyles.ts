import * as X from "./XX.ts";

/** Creates and configures the editor stylesheet's typed source of truth. */
export function createEditorCss()
{
	const editorCss = new X.EditorCss();
	
	editorCss.add(X.SimpleAssignmentMask, {
		display: "block",
		paddingLeft: 1,
	});
	
	return editorCss;
}
