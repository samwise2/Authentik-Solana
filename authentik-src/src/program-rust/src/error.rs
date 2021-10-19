use {
    num_derive::FromPrimitive,
    solana_program::{
        decode_error::DecodeError,
        msg,
        program_error::{PrintProgramError, ProgramError},
    },
    thiserror::Error,
};

#[derive(Debug, Eq, Error, FromPrimitive, PartialEq)]
pub enum AuthentikNFTError {

    /// Failed to unpack instruction data
    #[error("Failed to unpack instruction data")]
    InstructionUnpackError,

    /// Failed to pack instruction data
    #[error("Failed to pack instruction data")]
    InstructionPackError,

    /// Uri too long
    #[error("URI is too long")]
    UriTooLong,

    /// Mint given does not match mint on Metadata
    #[error("Mint given does not match mint on AuthentikNFT struct")]
    MintMismatch,

    /// Invalid owner
    #[error("Invalid Owner")]
    InvalidOwner,
}

impl PrintProgramError for MetadataError {
    fn print<E>(&self) {
        msg!(&self.to_string());
    }
}

impl From<MetadataError> for ProgramError {
    fn from(e: MetadataError) -> Self {
        ProgramError::Custom(e as u32)
    }
}

impl<T> DecodeError<T> for MetadataError {
    fn type_of() -> &'static str {
        "Metadata Error"
    }
}