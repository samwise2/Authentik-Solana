use {
    crate:: {
        error::AuthentikNFTError,
        state::{
            AuthentikNFTAccount
        }
    },
    borsh::{BorshDeserialize, BorshSerialize}
}


// Method to deserialize data given a buffer with extra space for our URI
pub fn try_from_slice_custom_check<T: BorshDeserialize>(data: &[u8]) -> Result<T, Error> {
    // Check for a custom error here and throw if needed
    let mut data_mut = data;
    let result = T::deserialize(&mut data_mut)?;
    Ok(result)
}