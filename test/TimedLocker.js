const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TimedLocker", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployTimedLockerContract() {
    // Contracts are deployed using the first signer/account by default
    const [contractOwner, otherAccount] = await ethers.getSigners();

    const TimedLocker = await ethers.getContractFactory("TimedLocker");
    const timedLocker = await TimedLocker.deploy();

    return { timedLocker, contractOwner, otherAccount };
  }

  describe("deposit", function () {
    it("Should set the right unlockTime and locked amount.", async function () {
      const { timedLocker, contractOwner, otherAccount } = await loadFixture(deployTimedLockerContract);
      const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
      const ONE_GWEI = 1_000_000_000;

      const lockedAmount = ONE_GWEI;
      const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

      await timedLocker.deposit(unlockTime, contractOwner.address, {value: lockedAmount});
      
      const lockInfo = await timedLocker.getLockInfo(contractOwner.address);
     
      expect(lockInfo.amountLocked).to.equal(lockedAmount);
      expect(lockInfo.lockedUntil).to.equal(unlockTime);
    });
    it("Should set differrent locking address.", async function () {
      const { timedLocker, contractOwner, otherAccount } = await loadFixture(deployTimedLockerContract);
      const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
      const ONE_GWEI = 1_000_000_000;

      const lockedAmount = ONE_GWEI;
      const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

      await timedLocker.deposit(unlockTime, otherAccount.address, {value: lockedAmount});
      
      const lockInfo = await timedLocker.getLockInfo(otherAccount.address);
     
      expect(lockInfo.amountLocked).to.equal(lockedAmount);
      expect(lockInfo.lockedUntil).to.equal(unlockTime);
    });
  });

  describe("withdraw", function () {
    it("Should be able to withdraw full amount after locking period.", async function () {
      const { timedLocker, contractOwner, otherAccount } = await loadFixture(deployTimedLockerContract);
      const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
      const ONE_GWEI = 1_000_000_000;
      const lockedAmount = ONE_GWEI;
      const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;
      await timedLocker.deposit(unlockTime, contractOwner.address, {value: lockedAmount});
      await time.increaseTo(unlockTime);
      await expect(timedLocker.withdraw(lockedAmount)).to.changeEtherBalance(contractOwner.address, lockedAmount);
    });

    it("Should not be able to withdraw before locking period.", async function () {
      const { timedLocker, contractOwner, otherAccount } = await loadFixture(deployTimedLockerContract);
      const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
      const ONE_GWEI = 1_000_000_000;

      const lockedAmount = ONE_GWEI;
      const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

      await timedLocker.deposit(unlockTime, contractOwner.address, {value: lockedAmount});
      //await timedLocker.withdraw(lockedAmount);
      await expect(timedLocker.withdraw(lockedAmount)).to.be.revertedWith(
        "You can't withdraw yet."
      );
    });

    it("Should not allow for undelegated address.", async function () {
      const { timedLocker, contractOwner, otherAccount } = await loadFixture(deployTimedLockerContract);
      const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
      const ONE_GWEI = 1_000_000_000;
      const lockedAmount = ONE_GWEI;
      const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;
      await timedLocker.deposit(unlockTime, otherAccount.address, {value: lockedAmount});
      await time.increaseTo(unlockTime);
      await expect(timedLocker.withdraw(lockedAmount)).to.be.revertedWith(
        "You don't have any balance to withdraw."
      );
    });

    it("Should allow other than owner if delegated.", async function () {
      const { timedLocker, contractOwner, otherAccount } = await loadFixture(deployTimedLockerContract);
      const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
      const ONE_GWEI = 1_000_000_000;
      const lockedAmount = ONE_GWEI;
      const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;
      await timedLocker.deposit(unlockTime, otherAccount.address, {value: lockedAmount});
      await time.increaseTo(unlockTime);
      await expect(timedLocker.connect(otherAccount).withdraw(lockedAmount)).to.changeEtherBalance(otherAccount.address, lockedAmount);
    });

  });
});