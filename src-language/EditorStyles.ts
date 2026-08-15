import * as X from "../src-language/XX.ts";
import * as Tools from "./X.ts";

/** Creates and configures the editor stylesheet's typed source of truth. */
export function createEditorCss()
{
	const editorCss = new Tools.EditorCss();
	
	editorCss.add(X.SimpleAssignmentMask, {
		display: "block",
		paddingLeft: 1,
	});
	
	return editorCss;
}
