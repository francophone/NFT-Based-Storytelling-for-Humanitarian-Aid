# 🌍 NFT-Based Storytelling for Humanitarian Aid

This project uses **NFTs to tell the story of humanitarian aid campaigns** while ensuring **transparency, accountability, and verifiable impact**. Donors don’t just give — they **own a piece of the story** through NFTs that represent milestones in real-world aid projects.

## ✨ Features

💸 **Transparent Donations** — All contributions tracked on-chain
📜 **NFT Storytelling** — Milestone-based NFTs narrate the progress of aid campaigns
🔍 **Verifiable Impact** — Donors see exactly where funds go and what outcomes are achieved
🏛 **Campaign Governance** — Community voting on verified NGOs and project milestones
📈 **Milestone Unlocks** — Funds are released only after independent verification
🤝 **Secondary Market Donations** — NFT resales can continue funding campaigns

## 🛠 How It Works

**For NGOs**

* Register as a verified humanitarian authority
* Launch a campaign with milestones (e.g., build wells, deliver food, fund schools)
* Upload updates linked to blockchain-verified data

**For Donors**

* Browse active aid campaigns
* Purchase milestone NFTs (e.g., “Well Completed”, “School Built”)
* Get visual, story-rich proof of progress while directly funding aid

**For Verifiers**

* Approve campaign milestones before funds are unlocked
* Provide proof-of-completion data (photos, IoT water sensors, supply chain receipts)

## 🧩 Smart Contract Architecture

This project is built on **Clarity** (Stacks blockchain) and involves **6–10 modular contracts**:

1. **NGO Registry Contract**

   * Register and verify NGOs/aid authorities
   * Community voting for legitimacy

2. **Campaign Factory Contract**

   * Launch new aid campaigns
   * Link campaigns to verified NGOs

3. **Milestone Contract**

   * Define campaign milestones
   * Lock and release funds conditionally

4. **NFT Minting Contract**

   * Mint storytelling NFTs tied to milestones
   * Enable secondary resale with royalties back to campaigns

5. **Donation Contract**

   * Handle contributions in STX or stablecoins
   * Allocate funds to milestones

6. **Verifier Contract**

   * Register independent verifiers
   * Approve/reject milestone completion

7. **Governance Contract** *(optional)*

   * DAO-style voting on NGO verification
   * Proposal + voting system for transparency

8. **Impact Data Oracle Contract** *(optional)*

   * Connect off-chain verification (photos, IoT, GPS)
   * Provide attestation proofs

## ✅ Real-World Problem Solved

Humanitarian aid often lacks **transparency and trust**. Donors don’t know:

* Where funds go
* If milestones are actually achieved
* Whether NGOs are legitimate

This project solves these issues with:

* On-chain tracking
* NFT storytelling
* Milestone-based funding
* Verified impact data