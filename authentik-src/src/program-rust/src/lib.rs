use borsh::{
    maybestd::io::{Error},
    BorshDeserialize, BorshSerialize
};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};


#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct AuthentikNFTAccount {
    // An NFT URI
    pub uri: String,
}

// Method to deserialize data given a buffer with extra space for our URI
pub fn try_from_slice_unchecked<AuthentikNFTAccount: BorshDeserialize>(data: &[u8]) -> Result<AuthentikNFTAccount, Error> {
    let mut data_mut = data;
    let result = AuthentikNFTAccount::deserialize(&mut data_mut)?;
    Ok(result)
}

// Declare and export the program's entrypoint
entrypoint!(process_instruction);

// Program entrypoint's implementation
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo], // Holds an account we want to give an NFT to
    _instruction_data: &[u8], // We won't use this for now, but in a real program we would dynamically pass the URI
) -> ProgramResult {

    let accounts_iter = &mut accounts.iter();
    let account_to_receive_authentik_nft = next_account_info(accounts_iter)?;

    // This program must own the account to set it's AuthentikNFT object
    if account_to_receive_authentik_nft.owner != program_id {
        msg!("Greeted account does not have the correct program id");
        return Err(ProgramError::IncorrectProgramId);
    }

    let mut authentik_nft_account: AuthentikNFTAccount = try_from_slice_unchecked(&account_to_receive_authentik_nft.data.borrow())?;
    
    authentik_nft_account.uri = "https://www.youtube.com/watch?v=dQw4w9WgXcQ".to_string();

    authentik_nft_account.serialize(&mut &mut account_to_receive_authentik_nft.data.borrow_mut()[..])?;

    msg!("Established AuthentikNFT with URI: {}", authentik_nft_account.uri);

    Ok(())
}

// Sanity tests
#[cfg(test)]
mod test {
    use super::*;
    use solana_program::clock::Epoch;
    use std::mem;

    #[test]
    fn test_sanity() {
        let program_id = Pubkey::default();
        let key = Pubkey::default();
        let mut lamports = 0;
        let mut data = vec![0; mem::size_of::<u32>()];
        let owner = Pubkey::default();
        let account = AccountInfo::new(
            &key,
            false,
            true,
            &mut lamports,
            &mut data,
            &owner,
            false,
            Epoch::default(),
        );
        let instruction_data: Vec<u8> = Vec::new();

        let accounts = vec![account];

        let mut authentik_nft_account: AuthentikNFTAccount = AuthentikNFTAccount::deserialize(&accounts[0].data.borrow())?;
        assert_eq!(
            authentik_nft_account
                .uri,
            ""
        );
        process_instruction(&program_id, &accounts, &instruction_data).unwrap();

        let mut updated_authentik_nft_account: AuthentikNFTAccount = AuthentikNFTAccount::deserialize(&accounts[0].data.borrow())?;
        assert_eq!(
            updated_authentik_nft_account
                .uri,
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        );
    }
}
