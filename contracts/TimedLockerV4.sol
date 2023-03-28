// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract TimedLockerV4 is ReentrancyGuard {
    using SafeMath for uint256;
    struct Lock {
        address locker;
        address beneficiary;
        uint256 value;
        uint256 unlockTimestamp;
    }

    mapping(address => mapping(address => bool)) private designatedLockers;
    mapping(address => Lock[]) private lockedFundsByBeneficiary;
    mapping(address => Lock[]) private lockedFundsByLocker;

    // check if the given locker has been designated by the beneficiary. An address is always self-designated.
    function isDesignatedLocker(address beneficiary, address locker) internal view returns (bool) {
        return locker == beneficiary || designatedLockers[beneficiary][locker];
    }

    // Beneficiary should designate who can lock values for them. This allows to prevent spamming.
    function addDesignatedLocker(address locker) external {
        require(!designatedLockers[msg.sender][locker], "Already a designated locker.");
        designatedLockers[msg.sender][locker] = true;
    }

    // remove given designnated locker
    function removeDesignatedLocker(address locker) external {
        require(designatedLockers[msg.sender][locker], "Locker not found.");
        designatedLockers[msg.sender][locker] = false;
    }

    // lock ether for the given beneficiary and given timestamp
    function deposit(address beneficiary, uint256 unlockTimestamp) external payable {
        require(isDesignatedLocker(beneficiary, msg.sender), "Not a designated locker.");
        require(unlockTimestamp > block.timestamp, "Unlock timestamp must be in future.");

        Lock memory newLock = Lock(msg.sender, beneficiary, msg.value, unlockTimestamp);
        lockedFundsByBeneficiary[beneficiary].push(newLock);
        lockedFundsByLocker[msg.sender].push(newLock);
    }

    // withdraw all eligible values for the beneficiary (sender). Eligible value is one whose timestamp has reached
    function withdraw() external nonReentrant {
        Lock[] storage beneficiaryLocks = lockedFundsByBeneficiary[msg.sender];
        uint256 totalEligibleValue = 0;
        uint256 i = 0;

        while (i < beneficiaryLocks.length) {
            if (beneficiaryLocks[i].unlockTimestamp <= block.timestamp) {
                totalEligibleValue = totalEligibleValue.add(beneficiaryLocks[i].value);

                // Remove lock from lockedFundsByLocker
                Lock[] storage lockerLocks = lockedFundsByLocker[beneficiaryLocks[i].locker];
                for (uint256 j = 0; j < lockerLocks.length; j++) {
                    if (lockerLocks[j].beneficiary == msg.sender && lockerLocks[j].unlockTimestamp == beneficiaryLocks[i].unlockTimestamp) {
                        lockerLocks[j] = lockerLocks[lockerLocks.length - 1];
                        lockerLocks.pop();
                        break;
                    }
                }

                // Remove lock from lockedFundsByBeneficiary
                beneficiaryLocks[i] = beneficiaryLocks[beneficiaryLocks.length - 1];
                beneficiaryLocks.pop();
            } else {
                i++;
            }
        }

        require(totalEligibleValue > 0, "No eligible locked value to withdraw");
        payable(msg.sender).transfer(totalEligibleValue);
    }

    // get all locks by the given locker
    function getLockedValuesByLocker(address locker) external view returns (Lock[] memory) {
        return lockedFundsByLocker[locker];
    }

    // get all locks for the given beneficiary
    function getLockedValuesForBeneficiary(address beneficiary) external view returns (Lock[] memory) {
        return lockedFundsByBeneficiary[beneficiary];
    }
}