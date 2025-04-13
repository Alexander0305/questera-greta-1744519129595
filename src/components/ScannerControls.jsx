import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaCog, FaFileExport, FaPlay, FaStop } from 'react-icons/fa';
import { globalTheme } from '../theme';

const ScannerControls = ({
  onStart,
  onStop,
  onExport,
  isScanning,
  stats,
  className
}) => {
  const [settings, setSettings] = useState({
    networks: ['BTC', 'ETH', 'SOL'],
    wordCount: 12,
    minBalance: 0,
    maxAttempts: 1000,
    concurrent: 10
  });

  const handleStart = () => {
    onStart(settings);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-6 py-3 rounded-lg text-white"
          style={{
            background: isScanning ? globalTheme.colors.error : globalTheme.colors.success,
            fontFamily: globalTheme.fonts.primary
          }}
          onClick={isScanning ? onStop : handleStart}
        >
          {isScanning ? (
            <>
              <FaStop /> Stop Scanning
            </>
          ) : (
            <>
              <FaPlay /> Start Scanning
            </>
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-6 py-3 rounded-lg text-white"
          style={{
            background: globalTheme.colors.secondary,
            fontFamily: globalTheme.fonts.primary
          }}
          onClick={() => onExport('xlsx')}
        >
          <FaFileExport /> Export Results
        </motion.button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h4 className="text-sm text-gray-400">Scanned</h4>
            <p className="text-2xl font-bold">{stats.totalScanned}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <h4 className="text-sm text-gray-400">Found</h4>
            <p className="text-2xl font-bold">{stats.totalFound}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <h4 className="text-sm text-gray-400">Speed</h4>
            <p className="text-2xl font-bold">{Math.round(stats.speed)}/s</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <h4 className="text-sm text-gray-400">Time</h4>
            <p className="text-2xl font-bold">
              {Math.round(stats.timeElapsed / 1000)}s
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScannerControls;