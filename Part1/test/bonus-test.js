// [bonus] unit test for bonus.circom
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

describe("Guess the Number test", function () {
    this.timeout(100000000);
    var circuit;
    var poseidon;

    before(async () => {
        circuit = await wasm_tester("contracts/circuits/bonus.circom");
        await circuit.loadConstraints();

        poseidon = await buildPoseidon();  // default BN128
        assert(poseidon.F.p == Fr.p, "Poseidon configured with field of same order");
    });

    it("Should return correct solnHash with correct lt feedback", async () => {
        const poseidonHash = poseidon.F.e(poseidon([100000000,50]));
        const solnHash = poseidon.F.toString(poseidonHash, 10);
        const INPUT = {
            "guess": "60",
            "feedback": "0",
            "solnHashIn": solnHash,
            "soln": "50",
            "salt": "100000000"
        }

        const witness = await circuit.calculateWitness(INPUT, true);
        assert(Fr.eq(Fr.e(witness[0]),Fr.e(1)), "proof is valid");
        assert(Fr.eq(Fr.e(witness[1]),Fr.e(solnHash)), "output equals soln hash");
    });

    it("Should return correct solnHash with correct gt feedback", async () => {
        const poseidonHash = poseidon.F.e(poseidon([100000000,50]));
        const solnHash = poseidon.F.toString(poseidonHash, 10);
        const INPUT = {
            "guess": "40",
            "feedback": "1",
            "solnHashIn": solnHash,
            "soln": "50",
            "salt": "100000000"
        }

        const witness = await circuit.calculateWitness(INPUT, true);
        assert(Fr.eq(Fr.e(witness[0]),Fr.e(1)), "proof is valid");
        assert(Fr.eq(Fr.e(witness[1]),Fr.e(solnHash)), "output equals soln hash");
    });

    it("Should return correct solnHash with correct eq feedback", async () => {
        const poseidonHash = poseidon.F.e(poseidon([100000000,50]));
        const solnHash = poseidon.F.toString(poseidonHash, 10);
        const INPUT = {
            "guess": "50",
            "feedback": "2",
            "solnHashIn": solnHash,
            "soln": "50",
            "salt": "100000000"
        }

        const witness = await circuit.calculateWitness(INPUT, true);
        assert(Fr.eq(Fr.e(witness[0]),Fr.e(1)), "proof is valid");
        assert(Fr.eq(Fr.e(witness[1]),Fr.e(solnHash)), "output equals soln hash");
    });

    it("Should fail with incorrect feedback for hash", async () => {
        const poseidonHash = poseidon.F.e(poseidon([100000000,50]));
        const solnHash = poseidon.F.toString(poseidonHash, 10);
        const INPUT = {
            "guess": "50",
            "feedback": "0",  // wrong
            "solnHashIn": solnHash,
            "soln": "50",
            "salt": "100000000"
        }

        await expect(circuit.calculateWitness(INPUT, true)).to.be.rejected;
    });

    it("Should fail with incorrect hash for feedback", async () => {
        const wrongSolnHash = "0";
        const INPUT = {
            "guess": "50",
            "feedback": "2",
            "solnHashIn": wrongSolnHash,
            "soln": "50",
            "salt": "100000000"
        }

        await expect(circuit.calculateWitness(INPUT, true)).to.be.rejected;
    });
});