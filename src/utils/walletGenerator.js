import { ethers } from 'ethers';
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { ECPairFactory } from 'ecpair';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import axios from 'axios';

bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

const FALLBACK_PROVIDER = 'https://mainnet.infura.io/v3/your-api-key';
const SOLANA_ENDPOINT = 'https://api.mainnet-beta.solana.com';

export const generateWallet = async (type) => {
  const mnemonic = generateMnemonic(256);
  const seed = mnemonicToSeedSync(mnemonic);

  try {
    switch (type) {
      case 'ETH': {
        const wallet = ethers.Wallet.fromPhrase(mnemonic);
        const provider = new ethers.JsonRpcProvider(FALLBACK_PROVIDER);
        const balance = await provider.getBalance(wallet.address);
        return {
          type,
          address: wallet.address,
          privateKey: wallet.privateKey,
          mnemonic,
          balance: ethers.formatEther(balance)
        };
      }

      case 'BTC': {
        const network = bitcoin.networks.bitcoin;
        const keyPair = ECPair.fromPrivateKey(seed.slice(0, 32));
        const { address } = bitcoin.payments.p2pkh({
          pubkey: keyPair.publicKey,
          network
        });
        return {
          type,
          address,
          privateKey: keyPair.privateKey.toString('hex'),
          mnemonic,
          balance: '0'
        };
      }

      case 'SOL': {
        const keypair = Keypair.fromSeed(seed.slice(0, 32));
        const connection = new Connection(SOLANA_ENDPOINT);
        const balance = await connection.getBalance(keypair.publicKey);
        return {
          type,
          address: keypair.publicKey.toString(),
          privateKey: Buffer.from(keypair.secretKey).toString('hex'),
          mnemonic,
          balance: balance / 1e9
        };
      }

      default:
        throw new Error('Unsupported cryptocurrency type');
    }
  } catch (error) {
    console.error('Wallet generation error:', error);
    throw new Error(`Failed to generate ${type} wallet: ${error.message}`);
  }
};

export const checkBalance = async (address, type) => {
  try {
    switch (type) {
      case 'ETH': {
        const provider = new ethers.JsonRpcProvider(FALLBACK_PROVIDER);
        const balance = await provider.getBalance(address);
        return ethers.formatEther(balance);
      }

      case 'SOL': {
        const connection = new Connection(SOLANA_ENDPOINT);
        const pubKey = new PublicKey(address);
        const balance = await connection.getBalance(pubKey);
        return balance / 1e9;
      }

      case 'BTC': {
        // Using Blockchain.info API for BTC balance
        try {
          const response = await axios.get(`https://blockchain.info/balance?active=${address}`);
          return (response.data[address].final_balance / 1e8).toString();
        } catch {
          return '0';
        }
      }

      default:
        throw new Error('Unsupported cryptocurrency type for balance check');
    }
  } catch (error) {
    console.error('Balance check error:', error);
    throw new Error(`Failed to check ${type} balance: ${error.message}`);
  }
};