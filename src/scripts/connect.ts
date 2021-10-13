import { Connection, clusterApiUrl } from "@solana/web3.js";
import splToken from "@solana/spl-token";

const createConnection = (): Connection => {
    const connection: Connection = new Connection(
        clusterApiUrl("devnet"),
        'confirmed',
    );

    return connection;
}

export {
    createConnection
}