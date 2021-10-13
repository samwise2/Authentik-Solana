import { AccountInfo, Connection, Keypair } from "@solana/web3.js";
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";

const mintNFT = async (connection: Connection, wallet: Keypair) => {
    const mint: Token = await Token.createMint(
        connection,
        wallet, // account that will pay fee
        wallet.publicKey, 
        null, // key of account that has authority to mint tokens of this type
        9, // amount of decimal places for your token
        TOKEN_PROGRAM_ID, // program id of token
    );

    // creates or fetches the account (mint) associated w/ the public key. 
    // Apparently the chain of custody is like this:
    // NFT resides in account 
    // Wallet owns this account
    const tokenAccount = await mint.getOrCreateAssociatedAccountInfo(
        wallet.publicKey,
    );
}