use {
    crate::{error::AuthentikNFTError, utils::try_from_slice_custom_check}.
    borsh::{BorshSerialize, BorshDeserialize}
    solana_program:: {
        account_info::AccountInfo, entrypoint::ProgramResult, program_error::ProgramError,
        pubkey::Pubkey,
    },
};


#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct AuthentikNFTAccount {
    // An NFT URI
    pub uri: String,

    // The public key to the NFT token's mint
    pub mint: Pubkey
};

impl AuthentikNFTAccount {
    pub fn get_from_account(acct: &AccountInfo) -> Result<AuthentikNFTAccount, ProgramError> {
        let authentik_nft_acct: AuthentikNFTAccount = try_from_slice_custom_check(
            &acct.data.borrow(),
            // Further params depending on what errors we care about
            // i.e. MAX_TOTAL_SIZE etc.
        )
    }
}