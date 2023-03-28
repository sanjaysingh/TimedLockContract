# Timed Lock Contract

TimedLock contract allows to lock ether for some address or yourself to be withdrawn in the future. 

Try running some of the following tasks:

```shell
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.js
```

The V4 contract address is 0x17217838A687F4d980D6Bc4b2Ea112cCB79D7fE6 on all the major evm networks. The current supported mainnet networks are Ethereum, Polygon, Arbitrum One, and Optimism. The supported testnets are Goerli and Sepolia.

The dapp to interact with this contract is hosted at https://static.sanjaysingh.net/apps/timelock/index.html
