import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import splToken from "@solana/spl-token";

const createAccount = async (connection: Connection): Promise<Keypair> => {
    // generate wallet keypair 
    const newWallet: Keypair = Keypair.generate();

    // airdrop sol into this wallet. takes in lamports. lamports are equivalent to wei
    const fromAirdropSignature: string = await connection.requestAirdrop(
        newWallet.publicKey,
        LAMPORTS_PER_SOL,
    );

    // waits for airdrop confirmation
    await connection.confirmTransaction(fromAirdropSignature); 

    return newWallet;
}

export {
    createAccount
}