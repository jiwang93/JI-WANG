/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'motion/react';
import { Printer, Download, Package, Calendar, ArrowRight } from 'lucide-react';

export default function App() {
  const [selectedName, setSelectedName] = useState('');
  const [numTrucks, setNumTrucks] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  const locationOptions = ['WAAR', 'JINKO', 'CIM', 'EN3'];

  const handleNameSelect = (name: string) => {
    setSelectedName(name);
  };

  const generatePDF = () => {
    if (!selectedName) return;
    
    setIsGenerating(true);
    
    // Small delay to allow UI to update to "Generating" state
    setTimeout(() => {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = `${(tomorrow.getMonth() + 1).toString().padStart(2, '0')}/${tomorrow.getDate().toString().padStart(2, '0')}/${tomorrow.getFullYear()}`;

      const pageWidth = 210;
      const pageHeight = 297;
      const labelsPerPage = 3;
      const cellWidth = pageWidth;
      const cellHeight = pageHeight / labelsPerPage;

      const levelsToGenerate = numTrucks;
      const labelsPerLevel = 9;
      const totalLabels = levelsToGenerate * labelsPerLevel;

      for (let i = 0; i < totalLabels; i++) {
        const rowOnPage = i % labelsPerPage;

        if (i > 0 && rowOnPage === 0) {
          doc.addPage();
        }
        
        const startX = 0;
        const startY = rowOnPage * cellHeight;

        const currentLevel = Math.floor(i / labelsPerLevel) + 1;
        const currentLabelNum = (i % labelsPerLevel) + 1;
        const customerPart = selectedName;
        const numberGroupPart = `${currentLevel}-${currentLabelNum}`;

        // Cell Border
        doc.setDrawColor(200);
        doc.setLineWidth(0.1);
        doc.rect(startX, startY, cellWidth, cellHeight);

        // Inner Border (Padding)
        const padding = 8;
        doc.setDrawColor(0);
        doc.setLineWidth(1);
        doc.rect(startX + padding, startY + padding, cellWidth - (padding * 2), cellHeight - (padding * 2));

        // Font Sizes - Maximum contrast for clear distinction
        const customerFontSize = 160;
        const numberGroupFontSize = 80;

        // Use different fonts to differentiate
        // Customer: Times Bold Italic (Marker/Handwritten look)
        // Numbers: Helvetica Normal (Clean and much smaller)
        
        doc.setDrawColor(0);

        // Measure widths
        doc.setFont('times', 'bolditalic');
        doc.setFontSize(customerFontSize);
        const nameWidth = doc.getTextWidth(customerPart);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(numberGroupFontSize);
        const numWidth = doc.getTextWidth(numberGroupPart);
        
        const gap = 15; // Increased gap for better distinction
        const totalWidth = nameWidth + numWidth + gap;
        const startTextX = startX + (cellWidth - totalWidth) / 2;
        const baselineY = startY + (cellHeight / 2) + 5;

        // Draw Customer Name (Scribbly Marker feel)
        doc.setFont('times', 'bolditalic');
        doc.setFontSize(customerFontSize);
        doc.setLineWidth(1.5); 
        doc.text(customerPart, startTextX, baselineY, { renderingMode: 'fillThenStroke' });

        // Draw Numbers Group (Clean, small, non-bold contrast)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(numberGroupFontSize);
        doc.setLineWidth(0.1); // Fine stroke
        doc.text(numberGroupPart, startTextX + nameWidth + gap, baselineY);

        // Date - Smaller and subtle to avoid competition
        const dateFontSize = 35;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(dateFontSize);
        const dateWidth = doc.getTextWidth(dateStr);
        const dateStartX = startX + (cellWidth - dateWidth) / 2;
        const dateBaselineY = startY + (cellHeight / 2) + 38;

        doc.text(dateStr, dateStartX, dateBaselineY);
        
        // Decorative line - Thinner and subtler
        doc.setLineWidth(1.2);
        doc.setDrawColor(180); 
        doc.line(startX + padding + 35, startY + (cellHeight / 2) + 12, startX + cellWidth - padding - 35, startY + (cellHeight / 2) + 12);
      }

      const fileName = `${selectedName}_1-${numTrucks}辆卡车.pdf`;
      doc.save(fileName);
      setIsGenerating(false);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="bg-blue-600 p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-2xl font-bold flex items-center gap-2 leading-tight">
              <Package className="w-8 h-8 flex-shrink-0" />
              <div className="flex flex-col">
                <span>库位标签生成器</span>
                <span className="text-xs font-normal opacity-80 tracking-wider uppercase">Warehouse Label Generator</span>
              </div>
            </h1>
            <p className="mt-2 text-blue-100 opacity-90 text-sm">
              快速生成 1-9 号库位标签 (每页 3 个) <br/>
              Quickly generate location labels 1-9 (3 per page)
            </p>
          </div>
          <motion.div 
            animate={{ 
              rotate: [0, 10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute -right-8 -top-8 opacity-10"
          >
            <Printer size={160} />
          </motion.div>
        </div>

        <div className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              客户名称 / Customer Name
            </label>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {locationOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => handleNameSelect(option)}
                  className={`py-3 px-4 rounded-xl font-bold text-lg transition-all border-2 ${
                    selectedName === option
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            <label className="block text-sm font-medium text-slate-700 mb-3">
              卡车数量 / Number of Trucks
            </label>
            <div className="flex items-center gap-4 mb-6">
              <input
                type="number"
                min="1"
                max="50"
                value={numTrucks}
                onChange={(e) => setNumTrucks(parseInt(e.target.value) || 1)}
                className="w-24 px-4 py-3 bg-slate-200 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-lg font-bold"
              />
              <span className="text-slate-500 text-sm">
                将生成 {selectedName || '卡车'}{1}-1 到 {selectedName || '卡车'}{numTrucks}-9 的标签
              </span>
            </div>
          </div>

          <button
            onClick={generatePDF}
            disabled={!selectedName || isGenerating}
            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
              !selectedName || isGenerating
                ? 'bg-slate-300 cursor-not-allowed shadow-none'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
            }`}
          >
            {isGenerating ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Download size={20} />
                </motion.div>
                正在生成 / Generating...
              </>
            ) : (
              <>
                <Download size={20} />
                生成并下载 / Generate & Download
              </>
            )}
          </button>

          <p className="text-center text-[10px] text-slate-400 leading-relaxed">
            生成的 PDF 将包含 3 页，每页 3 个库位标签<br/>
            PDF will contain 3 pages with 3 labels per page
          </p>
        </div>
      </motion.div>
    </div>
  );
}
