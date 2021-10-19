pub mod entrypoint;
pub mod error;
pub mod instruction;
pub mod processor;
pub mod state;
pub mod utils;
pub use solana_program;

// Declare program id
solana_program::declare_id!("<some real id>")