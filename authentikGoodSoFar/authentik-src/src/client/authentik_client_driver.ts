import {
  Keypair,
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  TransactionInstruction,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import fs from 'mz/fs';
import path from 'path';
import * as borsh from 'borsh';
import {getPayer, getRpcUrl, createKeypairFromFile} from './utils';

// variable to hold connection to cluster
let connection: Connection;

// Keypair to be generated for the account which will pay for the transaction
let payer: Keypair;

// Authentik Program's ID
let programId: PublicKey;

// Public key of account that will receive authentik NFT
let authentikPubkey: PublicKey;

// Path to directory containing program files
const PROGRAM_PATH = path.resolve(__dirname, '../../dist/program');

// Path to the shared object file to be deployed on-chain
const PROGRAM_SO_PATH = path.join(PROGRAM_PATH, 'authentik.so');

// Path to the keypair of the deployed on-chain program
const PROGRAM_KEYPAIR_PATH = path.join(PROGRAM_PATH, 'authentik-keypair.json');

// The state of an AuthentikNFTAccount managed by on-chain program
class AuthentikNFTAccount {
  uri = "";
  constructor(fields: {uri: string} | undefined = undefined) {
    if (fields) {
      this.uri = fields.uri;
    }
  }
}

// Schema definition of AuthentikNFT struct for serialization/deserialization with borsh
const AuthentikNFTSchema = new Map([
  [AuthentikNFTAccount, {kind: 'struct', fields: [['uri', 'String']]}],
]);


// The size of the authentik account
// NOTE: of course, we would not want to hard-code the URI size
// If we were setting the URL dynamically we could compute this trivially before setting account size
const URI_LENGTH = 43;
const AUTHENTIK_NFT_ACCOUNT_SIZE = borsh.serialize(
  AuthentikNFTSchema,
  new AuthentikNFTAccount(),
).length + URI_LENGTH;


// Establish a connection to Solana cluster
export async function establishConnectionToCluster(): Promise<void> {
  const rpcUrl = await getRpcUrl();
  connection = new Connection(rpcUrl, 'confirmed');
  const version = await connection.getVersion();
  console.log('Connection to cluster established:', rpcUrl);
}

// Create account to pay for state change on-chain
export async function establishPayer(): Promise<void> {
  let fees = 0;

  if (!payer) {
    const {feeCalculator} = await connection.getRecentBlockhash();
    fees += await connection.getMinimumBalanceForRentExemption(AUTHENTIK_NFT_ACCOUNT_SIZE);
    fees += feeCalculator.lamportsPerSignature * 100; 
    payer = await getPayer();
  }

  let lamports = await connection.getBalance(payer.publicKey);
  if (lamports < fees) {
    const sig = await connection.requestAirdrop(
      payer.publicKey,
      fees - lamports,
    );
    await connection.confirmTransaction(sig);
    lamports = await connection.getBalance(payer.publicKey);
  }

  console.log(
    'Created account',
    payer.publicKey.toBase58(),
    'containing',
    lamports / LAMPORTS_PER_SOL,
    'SOL to pay for transaction fee.',
  );
}

// Check that authentik program has been deployed on-chain
export async function checkProgram(): Promise<void> {
  try {
    const programKeypair = await createKeypairFromFile(PROGRAM_KEYPAIR_PATH);
    programId = programKeypair.publicKey;
  } catch (err) {
    const errMsg = (err as Error).message;
    throw new Error(
      `Failed to read program keypair at '${PROGRAM_KEYPAIR_PATH}' due to error: ${errMsg}. Program may need to be deployed with \`solana program deploy dist/program/helloworld.so\``,
    );
  }

  const programInfo = await connection.getAccountInfo(programId);
  if (programInfo === null) {
    if (fs.existsSync(PROGRAM_SO_PATH)) {
      throw new Error(
        'Program needs to be deployed with `solana program deploy dist/program/helloworld.so`',
      );
    } else {
      throw new Error('Program needs to be built and deployed');
    }
  } else if (!programInfo.executable) {
    throw new Error(`Program is not executable`);
  }

  const AUTHENTIK_NFT_ACCOUNT_SEED = 'bb';
  authentikPubkey = await PublicKey.createWithSeed(
    payer.publicKey,
    AUTHENTIK_NFT_ACCOUNT_SEED,
    programId,
  );

  const authentikNFTReceiverAccount = await connection.getAccountInfo(authentikPubkey);

  if (authentikNFTReceiverAccount === null) {
    console.log(
      'Creating account',
      authentikPubkey.toBase58(),
      'to give AuthentikNFT',
    );
    const lamports = await connection.getMinimumBalanceForRentExemption(
      AUTHENTIK_NFT_ACCOUNT_SIZE,
    );

    const transaction = new Transaction().add(
      SystemProgram.createAccountWithSeed({
        fromPubkey: payer.publicKey,
        basePubkey: payer.publicKey,
        seed: AUTHENTIK_NFT_ACCOUNT_SEED,
        newAccountPubkey: authentikPubkey,
        lamports,
        space: AUTHENTIK_NFT_ACCOUNT_SIZE,
        programId,
      }),
    );
    await sendAndConfirmTransaction(connection, transaction, [payer]);
  }
}

// Set on-chain Authentik NFT account
export async function setAuthentikNFTOnChain(): Promise<void> {
  console.log('Setting URI on AuthentikNFT for account: ', authentikPubkey.toBase58());
  const instruction = new TransactionInstruction({
    keys: [{pubkey: authentikPubkey, isSigner: false, isWritable: true}],
    programId,
    data: Buffer.alloc(0), // For simple working example we won't pass dynamic data or give multiples types of instructions to this program
  });
  await sendAndConfirmTransaction(
    connection,
    new Transaction().add(instruction),
    [payer],
  );
}

// Print URI set on-chain
export async function printOnChainAuthentikNFT(): Promise<void> {

  const accountInfo = await connection.getAccountInfo(authentikPubkey);
  if (accountInfo === null) {
    throw 'Error: cannot authentik nft account at cluster';
  }

  const authentikNFT = borsh.deserialize(
    AuthentikNFTSchema,
    AuthentikNFTAccount,
    accountInfo.data,
  );

  console.log('On-Chain AuthentikNFT object: for account', authentikPubkey.toBase58());
  console.log(authentikNFT);
}
