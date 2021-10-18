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

/// Define the type of state stored in accounts
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct GreetingAccount {
    // public key
    pub mint: Pubkey,
    // number of greetings
    pub uri: String,
    //pub num: u32,
}

pub fn try_from_slice_unchecked<GreetingAccount: BorshDeserialize>(data: &[u8]) -> Result<GreetingAccount, Error> {
    let mut data_mut = data;
    let result = GreetingAccount::deserialize(&mut data_mut)?;
    Ok(result)
}

// Declare and export the program's entrypoint
entrypoint!(process_instruction);

// Program entrypoint's implementation
pub fn process_instruction(
    program_id: &Pubkey, // Public key of the account the hello world program was loaded into
    accounts: &[AccountInfo], // The account to say hello to
    _instruction_data: &[u8], // Ignored, all helloworld instructions are hellos
) -> ProgramResult {
    msg!("Hello World Rust program entrypoint");

    // Iterating accounts is safer then indexing
    let accounts_iter = &mut accounts.iter();

    // Get the account to say hello to
    let account = next_account_info(accounts_iter)?;

    // The account must be owned by the program in order to modify its data
    if account.owner != program_id {
        msg!("Greeted account does not have the correct program id");
        return Err(ProgramError::IncorrectProgramId);
    }

    // Increment and store the number of times the account has been greeted
    //let mut data_mut = &account.data.borrow();
    //let mut greeting_account = GreetingAccount::deserialize(&mut data_mut)?;
    msg!("1");
    let mut greeting_account: GreetingAccount = try_from_slice_unchecked(&account.data.borrow())?;
    msg!("{:?}", greeting_account);
    //greeting_account.counter = "word".to_string();
    //greeting_account.num = 4;
    greeting_account.mint = Pubkey::new_unique();
    greeting_account.uri = "hello".to_string();

    msg!("{:?}", greeting_account);
    // msg!(&greeting_account.mint);

    greeting_account.serialize(&mut &mut account.data.borrow_mut()[..])?;
    msg!("3");

    //msg!("Counter is now str {}", greeting_account.counter);
    //msg!("num is now str {}", greeting_account.num);
    msg!("new uri {}", greeting_account.uri);

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

        assert_eq!(
            GreetingAccount::try_from_slice(&accounts[0].data.borrow())
                .unwrap()
                .counter,
            0
        );
        process_instruction(&program_id, &accounts, &instruction_data).unwrap();
        assert_eq!(
            GreetingAccount::try_from_slice(&accounts[0].data.borrow())
                .unwrap()
                .counter,
            1
        );
        process_instruction(&program_id, &accounts, &instruction_data).unwrap();
        assert_eq!(
            GreetingAccount::try_from_slice(&accounts[0].data.borrow())
                .unwrap()
                .counter,
            2
        );
    }
}
