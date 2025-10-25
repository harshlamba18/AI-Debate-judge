const hre = require("hardhat");

async function main() {
  console.log("Deploying DebateRecords contract...");

  const DebateRecords = await hre.ethers.getContractFactory("DebateRecords");
  const debateRecords = await DebateRecords.deploy();

  await debateRecords.waitForDeployment();

  const address = await debateRecords.getAddress();
  console.log("✅ DebateRecords deployed to:", address);
  console.log("\n📝 Add this to your .env files:");
  console.log(`CONTRACT_ADDRESS=${address}`);
  
  console.log("\n  Don't forget to verify the contract:");
  console.log(`npx hardhat verify --network sepolia ${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });