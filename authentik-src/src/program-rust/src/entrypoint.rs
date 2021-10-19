use {
    crate::{error::AuthentikNFTError, processor},
    solana_program::{
        account_info::AccountInfo, entrypoint, entrypoint::ProgramResult,
        program_error::PrintProgramError, pubkey::Pubkey,
    },
};

entrypoint!(process_instruction);
fn process_instruction<'a>(
    program_id: &'a Pubkey,
    accounts: &'a [AccountInfo<'a>],
    instruction_data: &[u8],
) -> ProgramResult {
    // Pass entrypoint call to processor
    if let Err(error) = processor::process_instruction(program_id, accounts, instruction_data) {
        // print the error if found
        error.print::<AuthentikNFTError>();
        return Err(error);
    }
    Ok(())
}