import {
  Keypair,
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  TransactionInstruction,
  Transaction,
  sendAndConfirmTransaction,
  Ed25519Keypair,
  PACKET_DATA_SIZE,
} from '@solana/web3.js';
import fs from 'mz/fs';
import path from 'path';
import * as borsh from 'borsh';
import {getPayer, getRpcUrl, createKeypairFromFile} from './utils';
import { PublicKeySize, StringPublicKey } from './typeExtensions';

// We want to extend borsh to support serialzing and deseralizing public keys
import './borshPubkeyExtension';

// Bring in SPL token so that we can generate an NFT
import * as splToken from '@solana/spl-token';

// variable to hold connection to cluster
let connection: Connection;

// Keypair to be generated for the account which will pay for the transaction
let payer: Keypair;

// Authentik Program's ID
let programId: PublicKey;

// Public key of account that will receive authentik NFT
let authentikPubkey: PublicKey;

// Main program sets a target uri for the nft
let uriForNFT: string;

// Pubkey of mint
let mintKey: PublicKey;

// Size of the account that we will make to hold this uri
let AUTHENTIK_NFT_ACCOUNT_SIZE: number;

// Path to directory containing program files
const PROGRAM_PATH = path.resolve(__dirname, '../../dist/program');

// Path to the shared object file to be deployed on-chain
const PROGRAM_SO_PATH = path.join(PROGRAM_PATH, 'authentik.so');

// Path to the keypair of the deployed on-chain program
const PROGRAM_KEYPAIR_PATH = path.join(PROGRAM_PATH, 'authentik-keypair.json');

// The state of an AuthentikNFTAccount managed by on-chain program
class AuthentikNFTAccount {
  // Could extend with custom MetaData struct
  uri: string;
  mint: StringPublicKey;
  constructor(fields: {uri: string, mint: StringPublicKey}) {
    this.uri = fields.uri;
    this.mint = fields.mint;
  }
}

// Schema definition of AuthentikNFT struct for serialization/deserialization with borsh
const AuthentikNFTSchema = new Map([
  [AuthentikNFTAccount, {kind: 'struct', fields: [['uri', 'String', ['mint', 'pubkeyAsString']]]}],
]);

export function registerUri(uri: string) {
  uriForNFT = uri;
  AUTHENTIK_NFT_ACCOUNT_SIZE = PublicKeySize + uriForNFT.length;
}


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
      `Failed to read program keypair at '${PROGRAM_KEYPAIR_PATH}' due to error: ${errMsg}. Program may need to be deployed.`,
    );
  }

  const programInfo = await connection.getAccountInfo(programId);
  if (programInfo === null) {
    if (fs.existsSync(PROGRAM_SO_PATH)) {
      throw new Error(
        'Program needs to be deployed.',
      );
    } else {
      throw new Error('Program needs to be built and deployed');
    }
  } else if (!programInfo.executable) {
    throw new Error(`Program is not executable`);
  }

  const AUTHENTIK_NFT_ACCOUNT_SEED = 'lollll';
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


export async function mintNFTToAccount(): Promise<void> {
  const producerKeypair: Keypair = Keypair.generate();
  const producerAirdropSignature: string = await connection.requestAirdrop(
    producerKeypair.publicKey,
    LAMPORTS_PER_SOL
  );

  await connection.confirmTransaction(producerAirdropSignature);
  const mint = await splToken.Token.createMint(
    connection,
    producerKeypair,
    producerKeypair.publicKey,
    null,
    0,
    splToken.TOKEN_PROGRAM_ID,
  );

  const producerAccount = await mint.getOrCreateAssociatedAccountInfo (
    producerKeypair.publicKey
  );

  const authentikNFTReceiverAccount = await mint.getOrCreateAssociatedAccountInfo(
    authentikPubkey
  )

  await mint.mintTo(
    producerAccount.address,
    producerKeypair.publicKey,
    [],
    1
  );

  // Revoke further mitning privelledges
  await mint.setAuthority(
    mint.publicKey,
    null,
    "MintTokens",
    producerKeypair.publicKey,
    []
  );

  const transaction = new Transaction().add(
    splToken.Token.createTransferInstruction(
      splToken.TOKEN_PROGRAM_ID,
      producerAccount.address,
      authentikNFTReceiverAccount.address,
      authentikPubkey,
      [],
      1,
    ),
  );

  mintKey = mint.publicKey;

  await sendAndConfirmTransaction(
    connection,
    transaction,
    [producerKeypair],
    {commitment: 'confirmed'},
  );
}

// Set on-chain Authentik NFT account
export async function setAuthentikNFTOnChain(): Promise<void> {
  console.log('Setting URI on AuthentikNFT for account: ', authentikPubkey.toBase58());
  const instruction = new TransactionInstruction({
    keys: [{pubkey: authentikPubkey, isSigner: false, isWritable: true}],
    programId,
    data: PackAuthentikData(uriForNFT, mintKey);
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
