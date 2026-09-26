import * as X from "../src-language/XX.ts";
import { test } from "node:test";

/** */
test("Basic tape test", () =>
{
	const tape = createTape();
	const tokens = [
		X.tokens.big,
		X.tokens.bigx1,
		X.tokens.bigx2,
		X.tokens.bigx3,
		X.tokens.comma,
		X.tokens.bigx4,
		X.tokens.bigx5,
		X.tokens.bigx6,
		X.NewlineToken.new("\n"),
		X.tokens.bigx7,
		X.tokens.bigx8,
		X.tokens.bigx9,
		X.NewlineToken.new("\n"),
		X.tokens.bigx10,
		X.NewlineToken.new("\n"),
		X.SpaceToken.new("\t"),
		X.tokens.bigx11,
	];
	
	for (const token of tokens)
		tape.append(token);
	
	const expectedLines = [
		" big  big.1  big.2  big.3 ",
		" big.4  big.5  big.6 ",
		" big.7  big.8  big.9 ",
		" big.10  big.11 ",
	];
	
	const receivedLines: string[] = [];
	const fragments: X.Fragment[] = [];
	
	for (const fragment of tape.read())
	{
		fragments.push(fragment);
		receivedLines.push(fragment.charstringReadable);
	}
	
	if (tape.tokenSize !== 12)
		throw "Unexpected length. The tape should be length=12 because " +
			"after reading a tape it's supposed to drain the whitespace.";
	
	const received = receivedLines.join("\n");
	const expected = expectedLines.join("\n");
	if (received !== expected)
	{
		console.log("Received:\n" + received);
		console.log("Expected:\n" + expected);
		throw "Test failure";
	}
	
	// Track the slicing
	{
		// Track slices right at the beginning
		const lens1 = tape.slice(0, 1);
		const lens2 = fragments[0].slice(0, 1);
		const lens3 = lens1.slice(0, 1);
		
		let expected = " big ";
		if (lens1.charstringReadable !== expected)
			throw "Unexpected charstring";
		
		if (lens2.charstringReadable !== expected)
			throw "Unexpected charstring";
		
		if (lens3.charstringReadable !== expected)
			throw "Unexpected charstring";
		
		// Track slices in the middle
		const lens4 = tape.slice(4, 5);
		const lens5 = fragments[1].slice(0, 1);
		const lens6 = lens4.slice(0, 1);
		
		expected = " big.4 ";
		
		if (lens4.charstringReadable !== expected)
			throw "Unexpected charstring";
		
		if (lens5.charstringReadable !== expected)
			throw "Unexpected charstring";
		
		if (lens6.charstringReadable !== expected)
			throw "Unexpected charstring";
	}
	
	class FakeMask extends X.Mask
	{
		token1: X.FixedToken | null = null;
		token2: X.FixedToken | null = null;
		innerMask: FakeMask | null = null;
	}
	
	const frag1 = fragments[1];
	console.log(frag1.charstringReadable);
	
	const fakeMask = new FakeMask();
	const f0 = frag1.tokens[0];
	const f1 = frag1.tokens[1];
	
	if (!(f0 instanceof X.FixedToken) || f0.text !== X.tokens.bigx4.text)
		throw "Busted";
	
	if (!(f1 instanceof X.FixedToken) || f1.text !== X.tokens.bigx5.text)
		throw "Busted";
	
	fakeMask.token1 = f0;
	fakeMask.token2 = f1;
	
	frag1.applyMask(fakeMask, 0, 2);
	console.log(frag1.charstringReadable);
	
	// Insert at the end. This shouldn't affect things.
	tape.insertToken(X.tokens.bigx12);
	const frag3 = fragments[3];
	
	console.log(frag3.charstringReadable);
	if (frag3.charstringReadable !== " big.10  big.11  big.12 ")
		throw "Busted";
	
	// Insert an arbitrary token within the token bounds where the 
	// FakeMask was applied. This should cause an eviction of the 
	// previously applied FakeMask instance.
	const evictedMask = frag1.insertToken(X.tokens.big, 1);
	console.log(frag1.charstringReadable);
	
	if (evictedMask !== fakeMask)
		throw "fakeMask wasn't properly evicted.";
	
	// Re-apply the fakeMask
	frag1.applyMask(fakeMask, 0, 2);
	console.log(frag1.charstringReadable);
	
	// This should cause the FakeMask we just applied to be evicted again
	const evictedAgain = tape.deleteToken(4);
	console.log(frag1.charstringReadable);
	
	if (evictedAgain !== fakeMask)
		throw "fakeMask wasn't properly evicted.";
	
	console.log("Make-shift tape test has passed.");
});

/** */
test("Basic mask test", () =>
{
	const tape = createTape();
	const tokens = [
		X.LowercaseEntityToken.new("a"),
		X.tokens.basicAssign,
		X.LowercaseEntityToken.new("b"),
		X.tokens.add,
		X.LowercaseEntityToken.new("c"),
		X.tokens.add,
		X.LowercaseEntityToken.new("d"),
	];
	
	for (const token of tokens)
		tape.append(token);
	
	tape.readAll();
	
	const lens = tape.slice(2, 5);
	
	const originB: X.TWritable<X.OriginParticleMask> = new X.OriginParticleMask();
	originB.term = tokens[2];
	
	const originC: X.TWritable<X.OriginParticleMask> = new X.OriginParticleMask();
	originC.term = tokens[4];
	
	// Start by applying the origin masks
	lens.applyMask(originB, 0, 1);
	lens.applyMask(originC, 2, 3);
	console.log(lens.charstringReadable);
	
	const infixMask: X.TWritable<X.InfixedParticleMask> = new X.InfixedParticleMask();
	infixMask.particle = originB;
	
	// Now the origin masks should be replaced with the infix mask.
	lens.applyMask(infixMask, 0, 3);
	
	console.log(lens.charstringReadable);
});

/** */
function createTape()
{
	return new X.Tape(X.tokens.comma);
}
