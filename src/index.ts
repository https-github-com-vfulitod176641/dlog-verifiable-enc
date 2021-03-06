import path from 'path';
const bindings : any = require(path.join(__dirname, '../../../native'));

import {FE, GE} from './common';

export class Witness {
    constructor(
        private x_vec: string[],
        private r_vec: string[]
    ) {}

    public static fromPlain(plain: any) {
        return new Witness(
            plain.x_vec,
            plain.r_vec);
    }
}

interface Helgamal {
    D: GE,
    E: GE
}

export class Helgamalsegmented {
    constructor(
        private DE: Helgamal[]
    ) {}

    public static fromPlain(plain: any): Helgamalsegmented {
        return new Helgamalsegmented(plain.DE);
    }
}

interface HomoELGamalProof {
    T: GE,
    A3: GE,
    z1: FE,
    z2: FE,
}

interface HomoELGamalDlogProof {
    A1: GE,
    A2: GE,
    A3: GE,
    z1: FE,
    z2: FE
}

interface InnerProductArg {
    L: GE[],
    R: GE[],
    a_tag: BigInt,
    b_tag: BigInt
}

interface RangeProof {
    A: GE,
    S: GE,
    T1: GE,
    T2: GE,
    tau_x: FE,
    miu: FE,
    tx: FE,
    inner_product_proof: InnerProductArg
}

export class Proof {
    constructor(
        private bulletproof: RangeProof,
        private elgamal_enc: HomoELGamalProof[],
        private elgamal_enc_dlog: HomoELGamalDlogProof) {

    }

    public static fromPlain(plain: any): Proof {
        return new Proof(
            plain.bulletproof,
            plain.elgamal_enc,
            plain.elgamal_enc_dlog
        );
    }
}

export interface EncryptionResult {
    witness: Witness,
    ciphertexts: Helgamalsegmented
}

function encrypt(encryptionKey: Buffer, secret: Buffer): EncryptionResult {
    const res = JSON.parse(bindings.ve_encrypt(encryptionKey.toString('hex'), secret.toString('hex')));
    const witness: Witness = Witness.fromPlain(res[0]);
    const ciphertexts: Helgamalsegmented = Helgamalsegmented.fromPlain(res[1]);
    return { witness, ciphertexts };
}

function decrypt(decryptionKey: Buffer, ciphertexts: Helgamalsegmented): Buffer {
    const secretKeyHex: string = bindings.ve_decrypt(
        decryptionKey.toString('hex'),
        JSON.stringify(ciphertexts)
    );
    return Buffer.from(secretKeyHex.padStart(64, '0'), 'hex');
}

function prove(encryptionKey: Buffer, encryptionResult: EncryptionResult): Proof {
    const proof = JSON.parse(
        bindings.ve_prove(
            encryptionKey.toString('hex'),
            JSON.stringify(encryptionResult.witness),
            JSON.stringify(encryptionResult.ciphertexts))
    );
    return Proof.fromPlain(proof);
}

function verify(proof: Proof, encryptionKey: Buffer, publicKey: Buffer, ciphertexts: Helgamalsegmented): boolean {
    return bindings.ve_verify(
        JSON.stringify(proof),
        encryptionKey.toString('hex'),
        publicKey.toString('hex'),
        JSON.stringify(ciphertexts));
}

export default {encrypt, decrypt, prove, verify};
