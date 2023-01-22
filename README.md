# Timed Lock Contract

TimedLock contract allows to lock ether for some address to be withdrawn in the future. It allows for multiple deposits for the same address but only takes the latest locking period as the final locking period.

Try running some of the following tasks:

```shell
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.js
```

The contract address is 0x22C4c7cce7771E41c2e97dEd588d3803B5B5E1F9 on all the major evm networks.
