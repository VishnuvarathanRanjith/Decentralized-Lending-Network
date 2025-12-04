const hre=require('hardhat')

const lenderAddress="0x5fbdb2315678afecb367f032d93f642f64180aa3"

const main=async()=>{
    const borrower=await hre.ethers.getContractFactory('Borrower');
    const contract=await borrower.deploy(lenderAddress);
    await contract.waitForDeployment();
    console.log(`contract deployed at:${contract.target}`);
}
main();