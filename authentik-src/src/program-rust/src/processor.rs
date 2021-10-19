use {
    crate:: {
        error::AuthentikNFTError,
        instruction::AuthentikNFTInstruction
    } 
    borsh::{
        maybestd::io::{Error},
        BorshDeserialize, BorshSerialize
    };
    solana_program::{
        account_info::{next_account_info, AccountInfo},
        entrypoint,
        entrypoint::ProgramResult,
        msg,
        program_error::ProgramError,
        pubkey::Pubkey,
    }
};

// Program entrypoint's implementation
pub fn process_instruction(
    program_id: &'a Pubkey,
    accounts: &'a [AccountInfo<'a>], // Holds an account we want to give an NFT to
    instr_data: &[u8], // We won't use this for now, but in a real program we would dynamically pass the URI
) -> ProgramResult {

    let instruction = AuthentikNFTInstruction::try_from_slice(input)?;
    match instruction {
        AuthentikNFTInstruction::SetAuthentikNFT(args) => {
            msg!("Creating AuthentikNFT object");
            process_set_authentik_nft_obj(
                program_id,
                accounts,
                args.uri,
                args.mint
            )
        }
    }
}

// We could extend this method to be potentially more versatile in production by allocating a new account
// on chain via some sort of raw account allocation method, rather than doing that client side
pub fn set_nft_account<'a> (
    program_id: &'a Pubkey,
    accounts: &'a [AccountInfo<'a>],
    uri: String,
    mint: Pubkey,
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let account_to_receive_authentik_nft = next_account_info(accounts_iter)?;

    // This program must own the account to set it's AuthentikNFT object
    if account_to_receive_authentik_nft.owner != program_id {
        msg!("Greeted account does not have the correct program id");
        return Err(ProgramError::IncorrectProgramId);
    }

    let mut authentik_nft_account: AuthentikNFTAccount = try_from_slice_unchecked(&account_to_receive_authentik_nft.data.borrow())?;
    
    authentik_nft_account.uri = uri;
    authentik_nft_account.mint = mint;

    authentik_nft_account.serialize(&mut &mut account_to_receive_authentik_nft.data.borrow_mut()[..])?;

    msg!("Established AuthentikNFT with URI: {} and mint: {}", authentik_nft_account.uri, authentik_nft_account.mint);

    Ok(())
}
