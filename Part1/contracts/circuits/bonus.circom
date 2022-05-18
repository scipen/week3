// [bonus] implement an example game from part d
pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/mux2.circom";
include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";
include "../../node_modules/circomlib/circuits/poseidon.circom";

template GuessTheNumber() {
    // Public inputs
    signal input guess;  // int from 1-100
    signal input feedback;  // 0 if `soln` is lower, 1 if higher, 2 if equal
    signal input solnHashIn;

    // Private inputs
    signal input soln;
    signal input salt;

    // Output
    signal output solnHashOut;

    // Constrain inputs
    component gteGuess = GreaterEqThan(8);
    gteGuess.in[0] <== guess;
    gteGuess.in[1] <== 1;
    component lteGuess = LessEqThan(8);
    lteGuess.in[0] <== guess;
    lteGuess.in[1] <== 100;

    component gteSoln = GreaterEqThan(8);
    gteSoln.in[0] <== soln;
    gteSoln.in[1] <== 1;
    component lteSoln = LessEqThan(8);
    lteSoln.in[0] <== soln;
    lteSoln.in[1] <== 100;

    component gteFeedback = GreaterEqThan(2);
    gteFeedback.in[0] <== feedback;
    gteFeedback.in[1] <== 0;
    component lteFeedback = LessEqThan(2);
    lteFeedback.in[0] <== feedback;
    lteFeedback.in[1] <== 2;

    // Compute and constrain feedback
    component lt = LessThan(8);
    lt.in[0] <== guess;
    lt.in[1] <== soln;
    
    component eq = IsEqual();
    eq.in[0] <== guess;
    eq.in[1] <== soln;

    component mux = Mux2();
    mux.c[0] <== 0;  // guess > soln  (lt.out === 0, eq.out === 0)
    mux.c[1] <== 1;  // guess < soln  (lt.out === 1, eq.out === 0)
    mux.c[2] <== 2;  // guess == soln
    mux.c[3] <== 2;  // guess == soln
    mux.s[0] <== lt.out;
    mux.s[1] <== eq.out;
    feedback === mux.out;

    // Verify that the hash of the private solution matches solnHashIn
    component poseidon = Poseidon(2);
    poseidon.inputs[0] <== salt;
    poseidon.inputs[1] <== soln;

    solnHashOut <== poseidon.out;
    solnHashIn === solnHashOut;
 }

 component main {public [guess, feedback, solnHashIn]} = GuessTheNumber();