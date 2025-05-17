import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Connection, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";
import { createNoopSigner, RpcInterface, publicKey as toPublicKey } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { dasApi, DasApiInterface } from "@metaplex-foundation/digital-asset-standard-api";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Get RPC URL from environment variables or use default
const RPC_URL = process.env.RPC_URL || clusterApiUrl("mainnet-beta");

const app = express();

// Enable CORS for all routes
app.use(cors());

let transport: SSEServerTransport | null = null;

app.get("/sse", (req, res) => {
    console.log("Connecting to SSE");
    transport = new SSEServerTransport("/messages", res);
    server.connect(transport);
    console.log("Connected to SSE");
});

app.post("/messages", (req, res) => {
    if (transport) {
        transport.handlePostMessage(req, res);
    }
});

// Create an MCP server
const server = new McpServer({
    name: "Metaplex DAS MCP Server",
    version: "0.1.0",
});

// Helper function to create UMI instance with RPC URL
const createUmiInstance = () => {
    return createUmi(RPC_URL).use(dasApi());
};

// Solana RPC Methods as Tools

// Get Asset
server.tool(
    "getAsset",
    "Used to look up an NFT or Token by public key (32 byte base58 encoded address)",
    { publicKey: z.string() },
    async ({ publicKey }) => {
        try {
            const pubkey = toPublicKey(publicKey);
            const umi = createUmiInstance();
            console.log("Fetching asset", pubkey);
            const asset = await (umi.rpc as RpcInterface & DasApiInterface).getAsset(pubkey);
            console.log("Asset fetched", asset);
            return {
                content: [{ type: "text", text: JSON.stringify(asset, null, 2) }]
            };
        } catch (error) {
            return {
                content: [{ type: "text", text: `Error: ${(error as Error).message}` }]
            };
        }
    }
);

// Get Assets
server.tool(
    "getAssets",
    "Used to look up multiple NFTs or Tokens by public key (32 byte base58 encoded address)",
    { publicKeys: z.array(z.string()) },
    async ({ publicKeys }) => {
        try {
            const pubkeys = publicKeys.map((key) => toPublicKey(key));
            const umi = createUmiInstance();
            console.log("Fetching assets", pubkeys);
            const assets = await (umi.rpc as RpcInterface & DasApiInterface).getAssets(pubkeys);
            console.log("Assets fetched", assets);
            return {
                content: [{ type: "text", text: JSON.stringify(assets, null, 2) }]
            };
        } catch (error) {
            return {
                content: [{ type: "text", text: `Error: ${(error as Error).message}` }]
            };
        }
    }
);

// Get Asset Proof
server.tool(
    "getAssetProof",
    "Used to look up merkle tree proof information for a compressed asset by public key (32 byte base58 encoded address)",
    { publicKey: z.string() },
    async ({ publicKey }) => {
        try {
            const pubkey = toPublicKey(publicKey);
            const umi = createUmiInstance();
            console.log("Fetching asset proof", pubkey);
            const proof = await (umi.rpc as RpcInterface & DasApiInterface).getAssetProof(pubkey);
            console.log("Asset proof fetched", proof);
            return {
                content: [{ type: "text", text: JSON.stringify(proof, null, 2) }]
            };
        } catch (error) {
            return {
                content: [{ type: "text", text: `Error: ${(error as Error).message}` }]
            };
        }
    }
);

// Get Asset Proofs
server.tool(
    "getAssetProofs",
    "Used to look up merkle tree proof information for multiple compressed assets by public key (32 byte base58 encoded address)",
    { publicKeys: z.array(z.string()) },
    async ({ publicKeys }) => {
        try {
            const pubkeys = publicKeys.map((key) => toPublicKey(key));
            const umi = createUmiInstance();
            console.log("Fetching asset proofs", pubkeys);
            const proofs = await (umi.rpc as RpcInterface & DasApiInterface).getAssetProofs(pubkeys);
            console.log("Asset proofs fetched", proofs);
            return {
                content: [{ type: "text", text: JSON.stringify(proofs, null, 2) }]
            };
        } catch (error) {
            return {
                content: [{ type: "text", text: `Error: ${(error as Error).message}` }]
            };
        }
    }
);

// Get Asset Signatures
server.tool(
    "getAssetSignatures",
    "Used to look up the transaction signatures associated with a compressed asset. You can identify the asset either by" +
    "its ID or by its tree and leaf index. Look up by public key of the asset (32 byte base58 encoded address)",
    { publicKey: z.string() },
    async ({ publicKey }) => {
        try {
            const pubkey = toPublicKey(publicKey);
            const umi = createUmiInstance();
            console.log("Fetching asset signatures", pubkey);
            const signatures = await (umi.rpc as RpcInterface & DasApiInterface).getAssetSignatures({ assetId: pubkey });
            console.log("Asset signatures fetched", signatures);
            return {
                content: [{ type: "text", text: JSON.stringify(signatures, null, 2) }]
            };
        } catch (error) {
            return {
                content: [{ type: "text", text: `Error: ${(error as Error).message}` }]
            };
        }
    }
);

// Get Assets by Authority
server.tool(
    "getAssetsByAuthority",
    "Used to look up all NFTs or Tokens by authority (32 byte base58 encoded address)",
    { publicKey: z.string() },
    async ({ publicKey }) => {
        console.log("getAssetsByAuthority", publicKey);
        try {
            const pubkey = toPublicKey(publicKey);
            const umi = createUmiInstance();
            console.log("Fetching assets by authority", pubkey);
            const assets = await (umi.rpc as RpcInterface & DasApiInterface).getAssetsByAuthority({ authority: pubkey });
            console.log("Assets fetched", assets.items.length);
            return {
                content: [{ type: "text", text: JSON.stringify(assets, null, 2) }]
            };
        } catch (error) {
            return {
                content: [{ type: "text", text: `Error: ${(error as Error).message}` }]
            };
        }
    }
);

// Get Assets by Creator
server.tool(
    "getAssetsByCreator",
    "Used to look up all NFTs or Tokens by creator (32 byte base58 encoded address)",
    { publicKey: z.string(), onlyVerified: z.boolean().optional() },
    async ({ publicKey, onlyVerified }) => {
        console.log("getAssetsByCreator", publicKey);
        try {
            const pubkey = toPublicKey(publicKey);
            const umi = createUmiInstance();
            console.log("Fetching assets by creator", pubkey, onlyVerified);
            const assets = await (umi.rpc as RpcInterface & DasApiInterface).getAssetsByCreator({ creator: pubkey, onlyVerified: onlyVerified || false });
            console.log("Assets fetched", assets.items.length);
            return {
                content: [{ type: "text", text: JSON.stringify(assets, null, 2) }]
            };
        } catch (error) {
            return {
                content: [{ type: "text", text: `Error: ${(error as Error).message}` }]
            };
        }
    }
);

// Get Assets by Group
server.tool(
    "getAssetsByGroup",
    "Used to look up all NFTs or Tokens by group or collection (32 byte base58 encoded address)",
    { publicKey: z.string() },
    async ({ publicKey }) => {
        console.log("getAssetsByGroup", publicKey);
        try {
            const pubkey = toPublicKey(publicKey);
            const umi = createUmiInstance();
            console.log("Fetching assets by group", pubkey);
            const assets = await (umi.rpc as RpcInterface & DasApiInterface).getAssetsByGroup({ groupKey: "collection", groupValue: pubkey });
            console.log("Assets fetched", assets.items.length);
            return {
                content: [{ type: "text", text: JSON.stringify(assets, null, 2) }]
            };
        } catch (error) {
            return {
                content: [{ type: "text", text: `Error: ${(error as Error).message}` }]
            };
        }
    }
);

// Get Assets by Owner
server.tool(
    "getAssetsByOwner",
    "Used to look up all NFTs or Tokens by owner (32 byte base58 encoded address)",
    { publicKey: z.string() },
    async ({ publicKey }) => {
        console.log("getAssetsByOwner", publicKey);
        try {
            const pubkey = toPublicKey(publicKey);
            const umi = createUmiInstance();
            console.log("Fetching assets by owner", pubkey);
            const assets = await (umi.rpc as RpcInterface & DasApiInterface).getAssetsByOwner({ owner: pubkey });
            console.log("Assets fetched", assets.items.length);
            return {
                content: [{ type: "text", text: JSON.stringify(assets, null, 2) }]
            };
        } catch (error) {
            return {
                content: [{ type: "text", text: `Error: ${(error as Error).message}` }]
            };
        }
    }
);

// // Search Assets
// server.tool(
//     "searchAssets",
//     "Used to search for NFTs or Tokens by different criteria",
//     { query: z.string() },
//     async ({ query }) => {
//         console.log("searchAssets", query);
//         try {
//             const pubkey = toPublicKey(publicKey);
//             const umi = createUmiInstance();
//             console.log("Fetching assets by creator", pubkey, onlyVerified);
//             const assets = await (umi.rpc as RpcInterface & DasApiInterface).getAssetsByCreator({ creator: pubkey, onlyVerified: onlyVerified || false });
//             console.log("Assets fetched", assets.items.length);
//             return {
//                 content: [{ type: "text", text: JSON.stringify(assets, null, 2) }]
//             };
//         } catch (error) {
//             return {
//                 content: [{ type: "text", text: `Error: ${(error as Error).message}` }]
//             };
//         }
//     }
// );

// Add a dynamic account info resource
// Setup specific resources to read from solana.com/docs pages
server.resource(
    "solanaDocsInstallation",
    new ResourceTemplate("solana://docs/intro/installation", { list: undefined }),
    async (uri) => {
        try {
            const response = await fetch(`https://raw.githubusercontent.com/solana-foundation/solana-com/main/content/docs/intro/installation.mdx`);
            const fileContent = await response.text();
            return {
                contents: [{
                    uri: uri.href,
                    text: fileContent
                }]
            };
        } catch (error) {
            return {
                contents: [{
                    uri: uri.href,
                    text: `Error: ${(error as Error).message}`
                }]
            };
        }
    }
);

server.resource(
    "solanaDocsClusters",
    new ResourceTemplate("solana://docs/references/clusters", { list: undefined }),
    async (uri) => {
        try {
            const response = await fetch(`https://raw.githubusercontent.com/solana-foundation/solana-com/main/content/docs/references/clusters.mdx`);
            const fileContent = await response.text();
            return {
                contents: [{
                    uri: uri.href,
                    text: fileContent
                }]
            };
        } catch (error) {
            return {
                contents: [{
                    uri: uri.href,
                    text: `Error: ${(error as Error).message}`
                }]
            };
        }
    }
);

server.prompt(
    'calculate-storage-deposit',
    'Calculate storage deposit for a specified number of bytes',
    { bytes: z.string() },
    ({ bytes }) => ({
        messages: [{
            role: 'user',
            content: {
                type: 'text',
                text: `Calculate the SOL amount needed to store ${bytes} bytes of data on Solana using getMinimumBalanceForRentExemption.`
            }
        }]
    })
);

server.prompt(
    'minimum-amount-of-sol-for-storage',
    'Calculate the minimum amount of SOL needed for storing 0 bytes on-chain',
    () => ({
        messages: [{
            role: 'user',
            content: {
                type: 'text',
                text: `Calculate the amount of SOL needed to store 0 bytes of data on Solana using getMinimumBalanceForRentExemption & present it to the user as the minimum cost for storing any data on Solana.`
            }
        }]
    })
);

server.prompt(
    'why-did-my-transaction-fail',
    'Look up the given transaction and inspect its logs to figure out why it failed',
    { signature: z.string() },
    ({ signature }) => ({
        messages: [{
            role: 'user',
            content: {
                type: 'text',
                text: `Look up the transaction with signature ${signature} and inspect its logs to figure out why it failed.`
            }
        }]
    })
);

server.prompt(
    'how-much-did-this-transaction-cost',
    'Fetch the transaction by signature, and break down cost & priority fees',
    { signature: z.string() },
    ({ signature }) => ({
        messages: [{
            role: 'user',
            content: {
                type: 'text',
                text: `Calculate the network fee for the transaction with signature ${signature} by fetching it and inspecting the 'fee' field in 'meta'. Base fee is 0.000005 sol per signature (also provided as array at the end). So priority fee is fee - (numSignatures * 0.000005). Please provide the base fee and the priority fee.`
            }
        }]
    })
);

server.prompt('what-happened-in-transaction',
    'Look up the given transaction and inspect its logs & instructions to figure out what happened',
    { signature: z.string() },
    ({ signature }) => ({
        messages: [{
            role: 'user',
            content: {
                type: 'text',
                text: `Look up the transaction with signature ${signature} and inspect its logs & instructions to figure out what happened.`
            }
        }]
    })
);


// // Start receiving messages on stdin and sending messages on stdout
// const transport = new SSEServerTransport();
// server.connect(transport);

// Function to check if a port is available
const isPortAvailable = (port: number): Promise<boolean> => {
    return new Promise((resolve) => {
        const server = require('net').createServer();
        server.once('error', () => {
            resolve(false);
        });
        server.once('listening', () => {
            server.close();
            resolve(true);
        });
        server.listen(port);
    });
};

// Function to find an available port
const findAvailablePort = async (startPort: number): Promise<number> => {
    let port = startPort;
    while (!(await isPortAvailable(port))) {
        port++;
    }
    return port;
};

// Start the server with port checking
const startServer = async () => {
    const port = await findAvailablePort(8080);
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
};

startServer();