# Timed Lock Contract

TimedLock contract allows to lock ether for some address to be withdrawn in the future. It allows for multiple deposits for the same address but only takes the latest locking period as the final locking period.

Try running some of the following tasks:

```shell
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.js
```
