const chai = require("chai");
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const assert = chai.assert;
const expect = chai.expect;

const wasm_tester = require("circom_tester").wasm;
const buildPoseidon = require("circomlibjs").buildPoseidon;

const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;
exports.p = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const Fr = new F1Field(exports.p);

describe("Mastermind variation test", function () {
    this.timeout(100000000);
    var circuit;
    var poseidon;

    before(async () => {
        circuit = await wasm_tester("contracts/circuits/MastermindVariation.circom");
        await circuit.loadConstraints();

        poseidon = await buildPoseidon();  // default BN128
        assert(poseidon.F.p == Fr.p, "Poseidon configured with field of same order");
    });

    it("Should return correct solnHash with correct input", async () => {
        const poseidonHash = poseidon.F.e(poseidon([100000000,1,2,4,20]));
        const solnHash = poseidon.F.toString(poseidonHash, 10);
        const INPUT = {
            "pubGuessA": "1",
            "pubGuessB": "2",
            "pubGuessC": "3",
            "pubGuessD": "4",
            "pubNumHit": "2",
            "pubNumBlow": "1",
            "pubSolnHash": solnHash,
            "privSolnA": "1",
            "privSolnB": "2",
            "privSolnC": "4",
            "privSolnD": "20",
            "privSalt": "100000000"
        }

        const witness = await circuit.calculateWitness(INPUT, true);
        assert(Fr.eq(Fr.e(witness[0]),Fr.e(1)), "proof is valid");
        assert(Fr.eq(Fr.e(witness[1]),Fr.e(solnHash)), "output equals soln hash");
    });

    it("Should fail with wrong solnHash for inputs", async () => {
        const wrongSolnHash = "0";
        const INPUT = {
            "pubGuessA": "1",
            "pubGuessB": "2",
            "pubGuessC": "3",
            "pubGuessD": "4",
            "pubNumHit": "2",
            "pubNumBlow": "1",
            "pubSolnHash": wrongSolnHash,
            "privSolnA": "1",
            "privSolnB": "2",
            "privSolnC": "4",
            "privSolnD": "20",
            "privSalt": "100000000"
        }
        
        await expect(circuit.calculateWitness(INPUT, true)).to.be.rejected;
    });

    it("Should fail with wrong public inputs for solnHash", async () => {
        const poseidonHash = poseidon.F.e(poseidon([100000000,1,2,4,20]));
        const solnHash = poseidon.F.toString(poseidonHash, 10);
        const INPUT = {
            "pubGuessA": "1",
            "pubGuessB": "2",
            "pubGuessC": "3",
            "pubGuessD": "4",
            "pubNumHit": "1",  // wrong
            "pubNumBlow": "1",
            "pubSolnHash": solnHash,
            "privSolnA": "1",
            "privSolnB": "2",
            "privSolnC": "4",
            "privSolnD": "20",
            "privSalt": "100000000"
        }
        
        await expect(circuit.calculateWitness(INPUT, true)).to.be.rejected;
    });
});