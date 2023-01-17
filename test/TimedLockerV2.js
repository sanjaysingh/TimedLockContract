const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TimedLockerV2", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployTimedLockerContract() {
    // Contracts are deployed using the first signer/account by default
    const [contractOwner, otherAccount] = await ethers.getSigners();

    const TimedLocker = await ethers.getContractFactory("TimedLockerV2");
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
      
      const envelops = await timedLocker.getDepositEnvelops(contractOwner.address, contractOwner.address);
     
      expect(envelops[0].amountLocked).to.equal(lockedAmount);
      expect(envelops[0].lockedUntil).to.equal(unlockTime);
    });

    it("Should add multiple deposit envelops when called multiple times.", async function () {
      const { timedLocker, contractOwner, otherAccount } = await loadFixture(deployTimedLockerContract);
      const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
      const ONE_GWEI = 1_000_000_000;

      const lockedAmount = ONE_GWEI;
      const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

      await timedLocker.deposit(unlockTime, contractOwner.address, {value: lockedAmount});
      await timedLocker.deposit(unlockTime + ONE_YEAR_IN_SECS, contractOwner.address, {value: lockedAmount});

      const envelops = await timedLocker.getDepositEnvelops(contractOwner.address, contractOwner.address);
     
      expect(envelops[0].lockedUntil).to.equal(unlockTime);
      expect(envelops[1].lockedUntil).to.equal(unlockTime+ONE_YEAR_IN_SECS);
    });
    
    it("Should not allow more than 10 deposits for the same payee.", async function () {
      const { timedLocker, contractOwner, otherAccount } = await loadFixture(deployTimedLockerContract);
      const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
      const ONE_GWEI = 1_000_000_000;

      const lockedAmount = ONE_GWEI;
      const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

      for(var i=0; i<10; i++) {
        await timedLocker.deposit(unlockTime, contractOwner.address, {value: lockedAmount});
      }
      
      await expect(timedLocker.deposit(unlockTime, contractOwner.address, {value: lockedAmount})).to.be.revertedWith(
        "You cannot have more than 10 deposits for one payee."
      );
    });
  });

  describe("disburse", function () {
    it("Should allow disbursement after locking time has elapsed.", async function () {
      const { timedLocker, contractOwner, otherAccount } = await loadFixture(deployTimedLockerContract);
      const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
      const ONE_GWEI = 1_000_000_000;

      const lockedAmount = ONE_GWEI;
      const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

      await timedLocker.deposit(unlockTime, contractOwner.address, {value: lockedAmount});
      await time.increaseTo(unlockTime);
      await expect(timedLocker.disburse(contractOwner.address, contractOwner.address)).to.changeEtherBalance(contractOwner.address, lockedAmount);
    });

    it("Should not be able to withdraw before locking period.", async function () {
      const { timedLocker, contractOwner, otherAccount } = await loadFixture(deployTimedLockerContract);
      const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
      const ONE_GWEI = 1_000_000_000;

      const lockedAmount = ONE_GWEI;
      const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

      await timedLocker.deposit(unlockTime, contractOwner.address, {value: lockedAmount});
      await expect(timedLocker.disburse(contractOwner.address, contractOwner.address)).to.be.revertedWith(
        "There is no eligible deposit envelops for disbursement for given depositor and payee."
      );
    });
    
    it("Should fail when there is no deposit for given address", async function () {
      const { timedLocker, contractOwner, otherAccount } = await loadFixture(deployTimedLockerContract);
      const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
      const ONE_GWEI = 1_000_000_000;

      const lockedAmount = ONE_GWEI;
      const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

      await timedLocker.deposit(unlockTime, contractOwner.address, {value: lockedAmount});
      await expect(timedLocker.disburse(contractOwner.address, otherAccount.address)).to.be.revertedWith(
        "There is no deposit envelops for given depositor and payee."
      );
    });

  });

});