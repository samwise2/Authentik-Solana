use borsh::BorshDeserialize;
use authentik::{process_instruction, AuthentikNFTAccount};
use solana_program_test::*;
use solana_sdk::{
    account::Account,
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    signature::Signer,
    transaction::Transaction,
};
use std::mem;

#[tokio::test]
async fn test_set_authentik_nft() {
    let program_id = Pubkey::new_unique();
    let authentik_nft_receiver_pubkey = Pubkey::new_unique();

    let mut program_test = ProgramTest::new(
        "authentik", // Run the BPF version with `cargo test-bpf`
        program_id,
        processor!(process_instruction), // Run the native version with `cargo test`
    );
    program_test.add_account(
        authentik_nft_receiver_pubkey,
        Account {
            lamports: 5,
            data: vec![0_u8; mem::size_of::<u32>()],
            owner: program_id,
            ..Account::default()
        },
    );
    let (mut banks_client, payer, recent_blockhash) = program_test.start().await;

    // Verify account has zero greetings
    let authentik_nft_receiver_account = banks_client
        .get_account(authentik_nft_receiver_pubkey)
        .await
        .expect("get_account")
        .expect("authentik_nft_account not found");
    assert_eq!(
        AuthentikNFTAccount::try_from_slice(&authentik_nft_receiver_account.data)
            .unwrap()
            .uri,
        ""
    );

    // Greet once
    let mut transaction = Transaction::new_with_payer(
        &[Instruction::new_with_bincode(
            program_id,
            &[0], // ignored but makes the instruction unique in the slot
            vec![AccountMeta::new(authentik_nft_receiver_pubkey, false)],
        )],
        Some(&payer.pubkey()),
    );
    transaction.sign(&[&payer], recent_blockhash);
    banks_client.process_transaction(transaction).await.unwrap();

    // Verify account has one greeting
    let authentik_nft_receiver_account = banks_client
        .get_account(authentik_nft_receiver_pubkey)
        .await
        .expect("get_account")
        .expect("authentik_nft_account not found");
    assert_eq!(
        AuthentikNFTAccount::try_from_slice(&authentik_nft_receiver_account.data)
            .unwrap()
            .uri,
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    );
}
