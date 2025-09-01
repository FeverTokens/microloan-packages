import { HardhatUserConfig } from "hardhat/config";
// Break out toolbox to avoid auto-running typechain
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-network-helpers";
import "@nomicfoundation/hardhat-verify";

// import "@typechain/hardhat"; // Intentionally disabled to avoid typechain ABI parsing issue during compile

const ftganacheConfig = {
  url: "http://a431184bd3f754da4b95e067b1e81ad4-113731396.eu-west-3.elb.amazonaws.com:8545",
  chainId: 1337,
  // You might need to add more configuration options here based on your requirements
 };
const config: HardhatUserConfig = {
  solidity: "0.8.26",
  networks: {
   
    ftganache: {
      chainId: 1337,
      url: "http://a431184bd3f754da4b95e067b1e81ad4-113731396.eu-west-3.elb.amazonaws.com:8545",
      accounts: [
        "0xfc9e23c9c31ee1d7211ddf7823c3221db91a0c02b661cba7c4dba72d428e5b62",
        "0x20145140992f1ddcd7b319a5645310d99496977836988e182952fddb37c525b3",
        "0x06e4a2c211c3162cb967dd724d23d3e917adaf7559af5c617d4c348d1dacf7fb",
        "0x96c16fb0e51e7cfec09203ad8b782f290cc07895219d98208b6f4da273393bc1",
        "0xe2de3e9e1f5e810f47a2a338b204c74845c314bbca2b9ed51e3e07b3442a56f4",
        "0xfbb6c73e3a6f01428fb0c1448f9ab03807a677630da6185726a99fe3637809cc",
        "0x33f038956a6f3a961743d38383b6b6c36112d41f380e220b012394e58af3a049",
        "0xdefccff20d917a76857fedb1610c0f0189761820175bbf3c4dc2644c2470846c",
        "0x837a0f94ee3ec08da5a7757369edde8148fcb604d303973873c90c5640221c8e",
        "0x0d30246fc0d1f67ac3c9c64a41d74921f69623e3dfca1f90f9f2d4d2d56dee9e",
      ],
      
      gasPrice: 2000000000, // Adjust this value
      blockGasLimit: 30000000, // Adjust this value
      hardfork: "shanghai",
    },
  },
};

export default config;
// export const plugins = [
//  "@nomicfoundation/hardhat-toolbox-viem",
// ];
