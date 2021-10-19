/**
 * Hello world
 */

import {
  establishConnectionToCluster,
  establishPayer,
  checkProgram,
  setAuthentikNFTOnChain,
  printOnChainAuthentikNFT,
} from './authentik_client_driver';

async function main() {
  console.log("Setting on-chain AuthentikNFT account with URI...");

  // Establish connection to the cluster
  await establishConnectionToCluster();

  // Determine who pays for the fees
  await establishPayer();

  // Check if the program has been deployed
  await checkProgram();

  // Send transaction to write AuthentikNFT struct to account on-chain
  await setAuthentikNFTOnChain();

  // Find out how many times that account has been greeted
  await printOnChainAuthentikNFT();
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);
