import { ethers } from 'ethers';
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { generateMnemonic, validateMnemonic, mnemonicToSeedSync } from 'bip39';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import Web3 from 'web3';
import axios from 'axios';
import * as XLSX from 'xlsx';

class CryptoScanner {
  constructor(config = {}) {
    this.config = {
      batchSize: 100,
      checkInterval: 1000,
      apiEndpoints: {
        ETH: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
        BTC: 'https://blockchain.info/balance?active=',
        SOL: 'https://api.mainnet-beta.solana.com',
      },
      ...config
    };
    this.running = false;
    this.foundWallets = [];
    this.totalScanned = 0;
  }

  async generateVanityAddress(prefix, network) {
    let attempts = 0;
    while (true) {
      attempts++;
      const wallet = await this.generateWallet(network);
      if (wallet.address.toLowerCase().startsWith(prefix.toLowerCase())) {
        return { ...wallet, attempts };
      }
    }
  }

  async bulkScan(options = {}) {
    const {
      networks = ['BTC', 'ETH', 'SOL'],
      minBalance = 0,
      maxAttempts = 1000,
      wordCount = 12,
      concurrent = 10,
      progressCallback
    } = options;

    this.running = true;
    const startTime = Date.now();
    const results = {
      wallets: [],
      stats: {
        totalScanned: 0,
        totalFound: 0,
        timeElapsed: 0,
        networksScanned: networks
      }
    };

    while (this.running && results.stats.totalScanned < maxAttempts) {
      const batch = await Promise.all(
        Array(concurrent).fill().map(async () => {
          const mnemonic = generateMnemonic(wordCount === 24 ? 256 : 128);
          const wallets = await Promise.all(
            networks.map(network => this.scanWallet(mnemonic, network))
          );
          return wallets.filter(w => w.balance > minBalance);
        })
      );

      const foundInBatch = batch.flat().filter(Boolean);
      if (foundInBatch.length > 0) {
        results.wallets.push(...foundInBatch);
        results.stats.totalFound += foundInBatch.length;
      }

      results.stats.totalScanned += concurrent;
      results.stats.timeElapsed = Date.now() - startTime;

      if (progressCallback) {
        progressCallback({
          ...results.stats,
          currentBatch: batch.length,
          speed: results.stats.totalScanned / (results.stats.timeElapsed / 1000)
        });
      }
    }

    return results;
  }

  async scanWallet(mnemonic, network) {
    try {
      const wallet = await this.generateWalletFromMnemonic(mnemonic, network);
      const balance = await this.checkBalance(wallet.address, network);
      return {
        ...wallet,
        balance: parseFloat(balance),
        network
      };
    } catch (error) {
      console.error(`Error scanning ${network} wallet:`, error);
      return null;
    }
  }

  async generateWalletFromMnemonic(mnemonic, network) {
    const seed = mnemonicToSeedSync(mnemonic);
    switch (network) {
      case 'ETH': {
        const wallet = ethers.Wallet.fromPhrase(mnemonic);
        return {
          address: wallet.address,
          privateKey: wallet.privateKey,
          mnemonic
        };
      }
      case 'BTC': {
        const keyPair = bitcoin.ECPair.fromPrivateKey(seed.slice(0, 32));
        const { address } = bitcoin.payments.p2pkh({
          pubkey: keyPair.publicKey,
          network: bitcoin.networks.bitcoin
        });
        return {
          address,
          privateKey: keyPair.privateKey.toString('hex'),
          mnemonic
        };
      }
      case 'SOL': {
        const keypair = Keypair.fromSeed(seed.slice(0, 32));
        return {
          address: keypair.publicKey.toString(),
          privateKey: Buffer.from(keypair.secretKey).toString('hex'),
          mnemonic
        };
      }
      default:
        throw new Error(`Unsupported network: ${network}`);
    }
  }

  async checkBalance(address, network) {
    try {
      switch (network) {
        case 'ETH': {
          const provider = new ethers.JsonRpcProvider(this.config.apiEndpoints.ETH);
          const balance = await provider.getBalance(address);
          return ethers.formatEther(balance);
        }
        case 'BTC': {
          const response = await axios.get(`${this.config.apiEndpoints.BTC}${address}`);
          return (response.data[address].final_balance / 1e8).toString();
        }
        case 'SOL': {
          const connection = new Connection(this.config.apiEndpoints.SOL);
          const balance = await connection.getBalance(new PublicKey(address));
          return (balance / 1e9).toString();
        }
        default:
          throw new Error(`Unsupported network: ${network}`);
      }
    } catch (error) {
      console.error(`Balance check failed for ${network}:`, error);
      return '0';
    }
  }

  exportToFile(data, format = 'xlsx') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `wallet-scan-results-${timestamp}`;

    switch (format) {
      case 'xlsx': {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data.wallets);
        XLSX.utils.book_append_sheet(wb, ws, 'Wallets');
        XLSX.writeFile(wb, `${filename}.xlsx`);
        break;
      }
      case 'json': {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.json`;
        a.click();
        URL.revokeObjectURL(url);
        break;
      }
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  stop() {
    this.running = false;
  }
}

export default CryptoScanner;