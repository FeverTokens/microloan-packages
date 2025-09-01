import { Hex,createPublicClient,formatEther, http } from "viem";
import {privateKeyToAccount} from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";
import { sepolia } from "viem/chains";


import dotenv from "dotenv";

dotenv.config();


const privateKey = process.env.PRIVATE_KEY;

const account = privateKeyToAccount(privateKey as Hex);
//  

(async () => {
    try {
        const client = createPublicClient({
            chain: sepolia,
            transport: http(process.env.API_URL),
        });

        const balance = await client.getBalance({
            address: account.address,
        });

        console.log(formatEther(balance));

        const nonce = await client.getTransactionCount({
             address : account.address,
        });

        console.log(nonce);
    } catch (error) {
        console.error("An error occurred:", error);
    }

    
})();

