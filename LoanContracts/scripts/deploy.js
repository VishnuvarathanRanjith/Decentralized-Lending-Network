const hre =require('hardhat');

// console.log(hre);

async function main(){
    const money=hre.ethers.parseEther("1");
    
    const Lender=await hre.ethers.getContractFactory("Lender");
    const lender=await Lender.deploy({value:money});
    await lender.waitForDeployment();
    console.log(`Lender contract deployed on:${(await lender).target}`);
    const balance=await hre.ethers.provider.getBalance(lender.target);
    console.log(balance);
    
}    
main().catch((error)=>{
    console.log(error);
    
})

