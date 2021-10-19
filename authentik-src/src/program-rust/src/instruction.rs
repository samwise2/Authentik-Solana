use {
    borsh::{BorshDeserialize, BorshSerialize},
    solana_program::{
        instruction::{AccountMeta, Instruction},
        pubkey::Pubkey,
        sysvar,
    },
};

#[derive(BorshSerialize, BorshDeserialize, PartialEq)]

pub struct SetAuthentikNFTMetadataArgs {
    pub uri: String,
    pub mint: Pubkey,
}

/*

Other structs to handle different types of instructions

*/

#[derive(BorshSerialize, BorshDeserialize)]

pub enum AuthentikNFTInstruction {
    /// Create Authentik NFT object
    /// 0. PDA of AuthentikNFT, program id, mint id
    SetAuthentikNFT(SetAuthentikNFTMetadataArgs)

    // further instructions...
}