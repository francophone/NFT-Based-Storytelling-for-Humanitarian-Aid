import { describe, it, expect, beforeEach } from "vitest"

type Campaign = { ngo: string; meta: string; start: number; end: number; target: bigint; raised: bigint; closed: boolean }
type Milestone = { title: string; budget: bigint; funded: bigint; verified: boolean; released: boolean; verifier?: string | null; evidence?: Uint8Array | null }

type TokenInfo = { campaignId: number; milestoneId: number; donor: string }

class MilestoneNftCoreMock {
  admin: string
  verifiers: Map<string, boolean>
  campaigns: Map<number, Campaign>
  milestones: Map<string, Milestone>
  donations: Map<string, bigint>
  tokenIndex: Map<number, TokenInfo>
  owners: Map<number, string>
  nextCampaignId: number
  nextMilestoneId: number
  nextTokenId: number
  blockHeight: number
  constructor(admin: string) {
    this.admin = admin
    this.verifiers = new Map()
    this.campaigns = new Map()
    this.milestones = new Map()
    this.donations = new Map()
    this.tokenIndex = new Map()
    this.owners = new Map()
    this.nextCampaignId = 1
    this.nextMilestoneId = 1
    this.nextTokenId = 1
    this.blockHeight = 0
  }
  advanceBlocks(n: number) {
    this.blockHeight += n
  }
  transferAdmin(sender: string, nextAdmin: string) {
    if (sender !== this.admin) return { ok: false, value: 100 as const }
    this.admin = nextAdmin
    return { ok: true, value: true as const }
  }
  setVerifier(sender: string, who: string, approved: boolean) {
    if (sender !== this.admin) return { ok: false, value: 100 as const }
    this.verifiers.set(who, approved)
    return { ok: true, value: approved }
  }
  createCampaign(sender: string, ngo: string, meta: string, start: number, end: number, target: bigint) {
    if (sender !== this.admin) return { ok: false, value: 100 as const }
    if (!(end > start) || !(target > 0n)) return { ok: false, value: 103 as const }
    const id = this.nextCampaignId++
    this.campaigns.set(id, { ngo, meta, start, end, target, raised: 0n, closed: false })
    return { ok: true, value: id }
  }
  closeCampaign(sender: string, campaignId: number) {
    const c = this.campaigns.get(campaignId)
    if (!c) return { ok: false, value: 101 as const }
    if (sender !== c.ngo) return { ok: false, value: 100 as const }
    c.closed = true
    this.campaigns.set(campaignId, c)
    return { ok: true, value: true as const }
  }
  addMilestone(sender: string, campaignId: number, title: string, budget: bigint) {
    const c = this.campaigns.get(campaignId)
    if (!c) return { ok: false, value: 101 as const }
    if (sender !== c.ngo) return { ok: false, value: 100 as const }
    if (!(budget > 0n)) return { ok: false, value: 103 as const }
    const id = this.nextMilestoneId++
    this.milestones.set(`${campaignId}:${id}`, { title, budget, funded: 0n, verified: false, released: false, verifier: null, evidence: null })
    return { ok: true, value: id }
  }
  donate(sender: string, campaignId: number, milestoneId: number, amount: bigint) {
    const c = this.campaigns.get(campaignId)
    if (!c) return { ok: false, value: 101 as const }
    const m = this.milestones.get(`${campaignId}:${milestoneId}`)
    if (!m) return { ok: false, value: 101 as const }
    const open = !c.closed && this.blockHeight >= c.start && this.blockHeight <= c.end
    if (!open) return { ok: false, value: 104 as const }
    if (!(amount > 0n)) return { ok: false, value: 103 as const }
    c.raised += amount
    m.funded += amount
    this.campaigns.set(campaignId, c)
    this.milestones.set(`${campaignId}:${milestoneId}`, m)
    const key = `${campaignId}:${milestoneId}:${sender}`
    const prev = this.donations.get(key) ?? 0n
    this.donations.set(key, prev + amount)
    return { ok: true, value: true as const }
  }
  mintDonorNft(sender: string, campaignId: number, milestoneId: number) {
    const donated = this.donations.get(`${campaignId}:${milestoneId}:${sender}`) ?? 0n
    if (!(donated > 0n)) return { ok: false, value: 106 as const }
    const tid = this.nextTokenId++
    this.tokenIndex.set(tid, { campaignId, milestoneId, donor: sender })
    this.owners.set(tid, sender)
    return { ok: true, value: tid }
  }
  assignVerifier(sender: string, campaignId: number, milestoneId: number, who: string) {
    const c = this.campaigns.get(campaignId)
    if (!c) return { ok: false, value: 101 as const }
    const m = this.milestones.get(`${campaignId}:${milestoneId}`)
    if (!m) return { ok: false, value: 101 as const }
    if (sender !== c.ngo) return { ok: false, value: 100 as const }
    if (!this.verifiers.get(who)) return { ok: false, value: 105 as const }
    m.verifier = who
    this.milestones.set(`${campaignId}:${milestoneId}`, m)
    return { ok: true, value: true as const }
  }
  verifyMilestone(sender: string, campaignId: number, milestoneId: number, evidence: Uint8Array) {
    if (!this.verifiers.get(sender)) return { ok: false, value: 105 as const }
    const m = this.milestones.get(`${campaignId}:${milestoneId}`)
    if (!m) return { ok: false, value: 101 as const }
    if (m.verified) return { ok: false, value: 109 as const }
    m.verified = true
    m.evidence = evidence
    m.verifier = sender
    this.milestones.set(`${campaignId}:${milestoneId}`, m)
    return { ok: true, value: true as const }
  }
  releaseFunds(sender: string, campaignId: number, milestoneId: number) {
    const c = this.campaigns.get(campaignId)
    if (!c) return { ok: false, value: 101 as const }
    const m = this.milestones.get(`${campaignId}:${milestoneId}`)
    if (!m) return { ok: false, value: 101 as const }
    if (sender !== c.ngo) return { ok: false, value: 100 as const }
    if (!m.verified) return { ok: false, value: 108 as const }
    if (m.released) return { ok: false, value: 110 as const }
    m.released = true
    this.milestones.set(`${campaignId}:${milestoneId}`, m)
    return { ok: true, value: m.funded }
  }
  getTokenInfo(tokenId: number) {
    return { ok: true as const, value: this.tokenIndex.get(tokenId) ?? null }
  }
  transfer(sender: string, tokenId: number, recipient: string) {
    const owner = this.owners.get(tokenId)
    if (!owner) return { ok: false, value: 101 as const }
    if (owner !== sender) return { ok: false, value: 107 as const }
    this.owners.set(tokenId, recipient)
    return { ok: true, value: true as const }
  }
  burn(sender: string, tokenId: number) {
    const owner = this.owners.get(tokenId)
    if (!owner) return { ok: false, value: 101 as const }
    if (owner !== sender) return { ok: false, value: 100 as const }
    this.owners.delete(tokenId)
    this.tokenIndex.delete(tokenId)
    return { ok: true, value: true as const }
  }
}

describe("MilestoneNftCoreMock", () => {
  let c: MilestoneNftCoreMock
  const admin = "STADMIN"
  const ngo = "STNGO"
  const donorA = "STDONOR1"
  const donorB = "STDONOR2"
  const verifier = "STVERIFIER"
  beforeEach(() => {
    c = new MilestoneNftCoreMock(admin)
  })
  it("initializes admin and sets verifier", () => {
    const set = c.setVerifier(admin, verifier, true)
    expect(set).toEqual({ ok: true, value: true })
  })
  it("creates campaign, adds milestone, accepts donations, mints NFT", () => {
    const camp = c.createCampaign(admin, ngo, "meta", 10, 100, 1000n)
    expect(camp.ok).toBe(true)
    const campaignId = camp.ok ? camp.value as number : 0
    const ms = c.addMilestone(ngo, campaignId, "Well", 500n)
    expect(ms.ok).toBe(true)
    const milestoneId = ms.ok ? ms.value as number : 0
    c.advanceBlocks(15)
    const d1 = c.donate(donorA, campaignId, milestoneId, 200n)
    const d2 = c.donate(donorA, campaignId, milestoneId, 50n)
    const d3 = c.donate(donorB, campaignId, milestoneId, 100n)
    expect(d1.ok && d2.ok && d3.ok).toBe(true)
    const nft = c.mintDonorNft(donorA, campaignId, milestoneId)
    expect(nft.ok).toBe(true)
    const tokenId = nft.ok ? nft.value as number : 0
    const info = c.getTokenInfo(tokenId)
    expect(info.value).toEqual({ campaignId, milestoneId, donor: donorA })
  })
  it("rejects donations when campaign closed or outside window", () => {
    const camp = c.createCampaign(admin, ngo, "meta", 10, 20, 1000n)
    const campaignId = camp.ok ? camp.value as number : 0
    const ms = c.addMilestone(ngo, campaignId, "School", 500n)
    const milestoneId = ms.ok ? ms.value as number : 0
    c.advanceBlocks(25)
    const d = c.donate(donorA, campaignId, milestoneId, 10n)
    expect(d).toEqual({ ok: false, value: 104 })
  })
  it("assigns verifier and verifies milestone with evidence", () => {
    c.setVerifier(admin, verifier, true)
    const camp = c.createCampaign(admin, ngo, "meta", 0, 100, 1000n)
    const campaignId = camp.ok ? camp.value as number : 0
    const ms = c.addMilestone(ngo, campaignId, "Clinic", 400n)
    const milestoneId = ms.ok ? ms.value as number : 0
    c.advanceBlocks(5)
    c.donate(donorA, campaignId, milestoneId, 200n)
    c.assignVerifier(ngo, campaignId, milestoneId, verifier)
    const ev = new Uint8Array(32)
    const v = c.verifyMilestone(verifier, campaignId, milestoneId, ev)
    expect(v).toEqual({ ok: true, value: true })
  })
  it("releases funds only after verification and by NGO", () => {
    c.setVerifier(admin, verifier, true)
    const camp = c.createCampaign(admin, ngo, "meta", 0, 100, 1000n)
    const campaignId = camp.ok ? camp.value as number : 0
    const ms = c.addMilestone(ngo, campaignId, "Bridge", 600n)
    const milestoneId = ms.ok ? ms.value as number : 0
    c.advanceBlocks(1)
    c.donate(donorA, campaignId, milestoneId, 300n)
    const r1 = c.releaseFunds(ngo, campaignId, milestoneId)
    expect(r1).toEqual({ ok: false, value: 108 })
    c.verifyMilestone(verifier, campaignId, milestoneId, new Uint8Array(32))
    const r2 = c.releaseFunds(ngo, campaignId, milestoneId)
    expect(r2.ok).toBe(true)
    expect(r2.value).toBe(300n)
  })
  it("transfers and burns NFT with ownership checks", () => {
    const camp = c.createCampaign(admin, ngo, "meta", 0, 100, 1000n)
    const campaignId = camp.ok ? camp.value as number : 0
    const ms = c.addMilestone(ngo, campaignId, "Road", 200n)
    const milestoneId = ms.ok ? ms.value as number : 0
    c.donate(donorA, campaignId, milestoneId, 50n)
    const minted = c.mintDonorNft(donorA, campaignId, milestoneId)
    const tokenId = minted.ok ? minted.value as number : 0
    const t1 = c.transfer(donorB, tokenId, donorA)
    expect(t1).toEqual({ ok: false, value: 107 })
    const t2 = c.transfer(donorA, tokenId, donorB)
    expect(t2).toEqual({ ok: true, value: true })
    const b1 = c.burn(donorA, tokenId)
    expect(b1).toEqual({ ok: false, value: 100 })
    const b2 = c.burn(donorB, tokenId)
    expect(b2).toEqual({ ok: true, value: true })
  })
})