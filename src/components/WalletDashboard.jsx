import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import CryptoScanner from '../services/cryptoScanner';
import { networkThemes, globalTheme } from '../theme';
import ScannerControls from './ScannerControls';

const WalletDashboard = () => {
  const [scanner] = useState(() => new CryptoScanner());
  const [scanning, setScanning] = useState(false);
  const [foundWallets, setFoundWallets] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedNetworks, setSelectedNetworks] = useState(['ETH', 'BTC', 'SOL']);

  const handleStartScan = useCallback(async (settings) => {
    setScanning(true);
    try {
      const results = await scanner.bulkScan({
        ...settings,
        networks: selectedNetworks,
        progressCallback: (stats) => setStats(stats)
      });
      setFoundWallets(prev => [...prev, ...results.wallets]);
    } catch (error) {
      console.error('Scanning error:', error);
    } finally {
      setScanning(false);
    }
  }, [scanner, selectedNetworks]);

  const handleStopScan = useCallback(() => {
    scanner.stop();
    setScanning(false);
  }, [scanner]);

  const handleExport = useCallback((format) => {
    scanner.exportToFile({ wallets: foundWallets, stats }, format);
  }, [scanner, foundWallets, stats]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6"
    >
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: globalTheme.fonts.primary }}>
            Ultra X Wallet
          </h1>
          <p className="text-gray-400">Advanced Cryptocurrency Wallet Scanner</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Object.keys(networkThemes).map(network => (
            <motion.button
              key={network}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                background: networkThemes[network].gradient,
                boxShadow: globalTheme.shadows.neon
              }}
              className={`p-4 rounded-lg ${
                selectedNetworks.includes(network) ? 'ring-2 ring-white' : ''
              }`}
              onClick={() => setSelectedNetworks(prev =>
                prev.includes(network)
                  ? prev.filter(n => n !== network)
                  : [...prev, network]
              )}
            >
              {network}
            </motion.button>
          ))}
        </div>

        <ScannerControls
          onStart={handleStartScan}
          onStop={handleStopScan}
          onExport={handleExport}
          isScanning={scanning}
          stats={stats}
          className="mb-8"
        />

        <div className="space-y-4">
          {foundWallets.map((wallet, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 rounded-lg p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{wallet.network}</h3>
                <span className="text-sm bg-gray-700 px-3 py-1 rounded-full">
                  Balance: {wallet.balance}
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Address:</span>
                  <code className="ml-2 bg-gray-900 px-2 py-1 rounded">
                    {wallet.address}
                  </code>
                </p>
                <p className="text-sm">
                  <span className="font-medium">Private Key:</span>
                  <code className="ml-2 bg-gray-900 px-2 py-1 rounded">
                    {wallet.privateKey}
                  </code>
                </p>
                <p className="text-sm">
                  <span className="font-medium">Mnemonic:</span>
                  <code className="ml-2 bg-gray-900 px-2 py-1 rounded">
                    {wallet.mnemonic}
                  </code>
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default WalletDashboard;