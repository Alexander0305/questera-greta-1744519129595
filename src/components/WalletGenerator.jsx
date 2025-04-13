import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { generateWallet, checkBalance } from '../utils/walletGenerator';
import { FaBitcoin, FaEthereum } from 'react-icons/fa';
import { SiSolana } from 'react-icons/si';

const WalletGenerator = () => {
  const [walletInfo, setWalletInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async (type) => {
    try {
      setLoading(true);
      setError('');
      const wallet = await generateWallet(type);
      setWalletInfo(wallet);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckBalance = async () => {
    if (!walletInfo?.address) return;
    try {
      setLoading(true);
      const balance = await checkBalance(walletInfo.address, walletInfo.type);
      setWalletInfo(prev => ({ ...prev, balance }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-xl p-6"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Cryptocurrency Wallet Generator
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleGenerate('ETH')}
              className="flex items-center justify-center gap-2 p-4 bg-blue-600 text-white rounded-lg"
            >
              <FaEthereum className="text-2xl" />
              Generate ETH Wallet
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleGenerate('BTC')}
              className="flex items-center justify-center gap-2 p-4 bg-orange-500 text-white rounded-lg"
            >
              <FaBitcoin className="text-2xl" />
              Generate BTC Wallet
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleGenerate('SOL')}
              className="flex items-center justify-center gap-2 p-4 bg-purple-600 text-white rounded-lg"
            >
              <SiSolana className="text-2xl" />
              Generate SOL Wallet
            </motion.button>
          </div>

          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              {error}
            </div>
          )}

          {walletInfo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gray-50 rounded-lg p-6 space-y-4"
            >
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Wallet Information</h3>
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <span className="font-medium">Address:</span>
                    <p className="text-sm break-all bg-gray-100 p-2 rounded">{walletInfo.address}</p>
                  </div>
                  <div>
                    <span className="font-medium">Private Key:</span>
                    <p className="text-sm break-all bg-gray-100 p-2 rounded">{walletInfo.privateKey}</p>
                  </div>
                  <div>
                    <span className="font-medium">Mnemonic:</span>
                    <p className="text-sm break-all bg-gray-100 p-2 rounded">{walletInfo.mnemonic}</p>
                  </div>
                  {walletInfo.balance !== undefined && (
                    <div>
                      <span className="font-medium">Balance:</span>
                      <p className="text-sm break-all bg-gray-100 p-2 rounded">{walletInfo.balance}</p>
                    </div>
                  )}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCheckBalance}
                className="w-full bg-green-600 text-white py-2 rounded-lg mt-4"
              >
                Refresh Balance
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default WalletGenerator;