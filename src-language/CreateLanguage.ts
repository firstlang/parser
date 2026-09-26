import * as X from "./XX.ts";
import * as Masks from "../src-language/Masks.ts";
import * as Fs from "fs";

/** */
export class ProjectLanguage extends X.Language
{
	/** */
	constructor()
	{
		super({
			masks: Object.values(Masks),
			fragmentationToken: X.tokens.comma,
			lineTapes: [
				{ prefix: X.tokens.comment },
				{ prefix: X.tokens.subtract, allowedEnclosures: [X.Enclosure.brace] },
			],
			fixedTokens: Object.values(X.tokens),
			physicalFlexTokens: X.flexTokens,
			abstractFlexTokens: X.flexTokensAbstract,
		});
	}
	
	/** */
	createMaskedTapeFromFile(filePath: string)
	{
		const codeText = Fs.readFileSync(filePath, "utf-8");
		return this.createMaskedTape(codeText);
	}
	
	/** */
	createMaskedTape(codeText: string)
	{
		const tape = this.createTape(codeText);
		X.applyApexMasks(tape, X.SpaceBodyMasks);
		return tape;
	}
}
