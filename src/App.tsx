/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'motion/react';
import { Printer, Download, Package, Calendar, ArrowRight } from 'lucide-react';

export default function App() {
  const [prefix, setPrefix] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = () => {
    if (!prefix.trim()) return;
    
    setIsGenerating(true);
    
    // Small delay to show animation
    setTimeout(() => {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const now = new Date();
      const year = now.getFullYear().toString();
      const monthDay = `${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')}`;

      const pageWidth = 210;
      const pageHeight = 297;
      const cols = 3;
      const rows = 3;
      const cellWidth = pageWidth / cols;
      const cellHeight = pageHeight / rows;

      for (let i = 0; i < 9; i++) {
        const col = i % cols;
        const row = Math.floor(i / rows);
        
        const startX = col * cellWidth;
        const startY = row * cellHeight;

        const prefixPart = `${prefix.trim()}-`;
        const numberPart = `${i + 1}`;
        
        // Cell Border
        doc.setDrawColor(200); // Light gray for cutting lines
        doc.setLineWidth(0.1);
        doc.rect(startX, startY, cellWidth, cellHeight);

        // Inner Border (Padding)
        const padding = 5;
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.rect(startX + padding, startY + padding, cellWidth - (padding * 2), cellHeight - (padding * 2));

        // Calculate total width for centering
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(60);
        const prefixWidth = doc.getTextWidth(prefixPart);
        
        doc.setFont('helvetica', 'bolditalic');
        doc.setFontSize(50);
        const numberWidth = doc.getTextWidth(numberPart);
        
        const totalWidth = prefixWidth + numberWidth;
        const startTextX = startX + (cellWidth - totalWidth) / 2;
        const baselineY = startY + (cellHeight / 2) - 5;

        // Draw Prefix
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(60);
        doc.text(prefixPart, startTextX, baselineY);

        // Draw Number (Smaller and Italic)
        doc.setFont('helvetica', 'bolditalic');
        doc.setFontSize(50);
        doc.text(numberPart, startTextX + prefixWidth, baselineY);

        // Date - Bold and split sizes
        doc.setFont('helvetica', 'bold');
        
        // Month/Day - Large
        doc.setFontSize(28);
        const mdWidth = doc.getTextWidth(monthDay);
        
        // Year - Smaller
        doc.setFontSize(16);
        const yWidth = doc.getTextWidth(year);
        
        const totalDateWidth = mdWidth + yWidth + 2; // 2mm spacing
        const dateStartX = startX + (cellWidth - totalDateWidth) / 2;
        const dateBaselineY = startY + (cellHeight / 2) + 25;

        // Draw Year (Smaller)
        doc.setFontSize(16);
        doc.text(year, dateStartX, dateBaselineY);
        
        // Draw Separator or just space
        doc.setFontSize(28);
        doc.text('/', dateStartX + yWidth + 1, dateBaselineY);
        
        // Draw Month/Day (Larger)
        doc.text(monthDay.replace('/', ''), dateStartX + yWidth + 5, dateBaselineY);
        
        // Decorative line - Thicker and wider
        doc.setLineWidth(0.5);
        doc.line(startX + padding + 5, startY + (cellHeight / 2) + 8, startX + cellWidth - padding - 5, startY + (cellHeight / 2) + 8);
      }

      doc.save(`库位标签_一页_${prefix.trim()}.pdf`);
      setIsGenerating(false);
    }, 800);
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
              快速生成 1-9 号库位标签 (单页版) <br/>
              Quickly generate location labels 1-9 (Single Page)
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
            <label htmlFor="prefix" className="block text-sm font-medium text-slate-700 mb-2">
              库位前缀 / Location Prefix (e.g., D)
            </label>
            <div className="relative">
              <input
                type="text"
                id="prefix"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                placeholder="输入字母或数字 / Enter prefix"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-lg font-semibold uppercase"
                maxLength={10}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                <ArrowRight size={20} />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
              <Calendar size={14} />
              预览 / Preview (3x3 Layout)
            </h3>
            <div className="flex flex-wrap gap-2">
              {prefix ? (
                [1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <span key={num} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium border border-blue-100">
                    {prefix}-<span className="italic text-[0.9em]">{num}</span>
                  </span>
                ))
              ) : (
                <span className="text-slate-400 text-sm italic">请输入前缀 / Please enter prefix</span>
              )}
            </div>
          </div>

          <button
            onClick={generatePDF}
            disabled={!prefix.trim() || isGenerating}
            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
              !prefix.trim() || isGenerating
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
            生成的 PDF 将包含 1 页，内含 9 个库位标签 (3x3 布局)<br/>
            PDF will contain 1 page with 9 labels (3x3 Grid)
          </p>
        </div>
      </motion.div>
    </div>
  );
}
