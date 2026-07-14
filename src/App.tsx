/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'motion/react';
import { Printer, Download, Package, Calendar, ArrowRight, Clock, Trash2, History, AlertTriangle, X } from 'lucide-react';

interface PrintRecord {
  id: string;
  prefix: string;
  timestamp: number;
}

export default function App() {
  const [prefix, setPrefix] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Load history from localStorage on mount (and clean old records)
  const [history, setHistory] = useState<PrintRecord[]>(() => {
    try {
      const saved = localStorage.getItem('warehouse_label_history');
      if (saved) {
        const parsed = JSON.parse(saved) as PrintRecord[];
        const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
        return parsed.filter(item => item.timestamp >= threeDaysAgo);
      }
    } catch (e) {
      console.error('Failed to parse history', e);
    }
    return [];
  });

  const saveHistory = (newHistory: PrintRecord[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem('warehouse_label_history', JSON.stringify(newHistory));
    } catch (e) {
      console.error('Failed to save history', e);
    }
  };

  const getDayDiff = (t1: number, t2: number): number => {
    const d1 = new Date(t1);
    const d2 = new Date(t2);
    const date1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
    const date2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
    return Math.round((date2.getTime() - date1.getTime()) / (24 * 60 * 60 * 1000));
  };

  const getBilingualDateInfo = (timestamp: number) => {
    const diff = getDayDiff(timestamp, Date.now());
    const dateObj = new Date(timestamp);
    const timeStr = `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const date = dateObj.getDate().toString().padStart(2, '0');
    
    if (diff === 0) {
      return {
        en: `Today at ${timeStr}`,
        cn: `今天 ${timeStr}`
      };
    } else if (diff === 1) {
      return {
        en: `Yesterday at ${timeStr}`,
        cn: `昨天 ${timeStr}`
      };
    } else if (diff === 2) {
      return {
        en: `2 days ago (${month}/${date} ${timeStr})`,
        cn: `前天 (${month}月${date}日 ${timeStr})`
      };
    } else {
      return {
        en: `${diff} days ago (${month}/${date})`,
        cn: `${diff}天前 (${month}月${date}日)`
      };
    }
  };

  const getTodayPrintsCount = () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return history.filter(item => item.timestamp >= todayStart.getTime()).length;
  };

  const trimmedPrefix = prefix.trim().toUpperCase();
  const duplicateRecord = trimmedPrefix 
    ? history.find(item => item.prefix === trimmedPrefix)
    : null;
  const hasDuplicate = !!duplicateRecord;

  const generatePDF = () => {
    if (!prefix.trim()) return;
    
    const trimmed = prefix.trim().toUpperCase();
    const duplicate = history.find(item => item.prefix === trimmed);
    if (duplicate) {
      setShowConfirmModal(true);
    } else {
      executeGeneratePDF();
    }
  };

  const executeGeneratePDF = () => {
    const trimmed = prefix.trim().toUpperCase();
    if (!trimmed) return;
    
    setIsGenerating(true);
    setShowConfirmModal(false);
    
    // Add to history
    const newRecord: PrintRecord = {
      id: Math.random().toString(36).substring(2, 9),
      prefix: trimmed,
      timestamp: Date.now()
    };
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
    const updatedHistory = [newRecord, ...history].filter(item => item.timestamp >= threeDaysAgo);
    saveHistory(updatedHistory);

    // Small delay to show animation
    setTimeout(() => {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const now = new Date();
      const dateStr = `${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')}/${now.getFullYear()}`;

      const pageWidth = 210;
      const pageHeight = 297;
      const labelsPerPage = 3;
      const totalLabels = 9;
      const cellWidth = pageWidth;
      const cellHeight = pageHeight / labelsPerPage;

      for (let i = 0; i < totalLabels; i++) {
        // Add new page if needed (except for the first label)
        if (i > 0 && i % labelsPerPage === 0) {
          doc.addPage();
        }

        const rowOnPage = i % labelsPerPage;
        const startX = 0;
        const startY = rowOnPage * cellHeight;

        const prefixPart = `${trimmed}-`;
        const numberPart = `${i + 1}`;
        
        // Cell Border
        doc.setDrawColor(200);
        doc.setLineWidth(0.1);
        doc.rect(startX, startY, cellWidth, cellHeight);

        // Inner Border (Padding)
        const padding = 8;
        doc.setDrawColor(0);
        doc.setLineWidth(1.0);
        doc.rect(startX + padding, startY + padding, cellWidth - (padding * 2), cellHeight - (padding * 2));

        // Much larger font sizes to fill the space
        const mainFontSize = 140;
        const subFontSize = 120;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(mainFontSize);
        const prefixWidth = doc.getTextWidth(prefixPart);
        
        doc.setFont('helvetica', 'bolditalic');
        doc.setFontSize(subFontSize);
        const numberWidth = doc.getTextWidth(numberPart);
        
        const totalWidth = prefixWidth + numberWidth;
        const startTextX = startX + (cellWidth - totalWidth) / 2;
        const baselineY = startY + (cellHeight / 2) + 2; // Adjusted for larger text

        // Draw Prefix
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(mainFontSize);
        doc.text(prefixPart, startTextX, baselineY);

        // Draw Number (Smaller and Italic)
        doc.setFont('helvetica', 'bolditalic');
        doc.setFontSize(subFontSize);
        doc.text(numberPart, startTextX + prefixWidth, baselineY);

        // Date - Uniform large size and MM/DD/YYYY format
        const dateFontSize = 45;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(dateFontSize);
        const dateWidth = doc.getTextWidth(dateStr);
        const dateStartX = startX + (cellWidth - dateWidth) / 2;
        const dateBaselineY = startY + (cellHeight / 2) + 38;

        doc.text(dateStr, dateStartX, dateBaselineY);
        
        // Decorative line - Thicker and wider
        doc.setLineWidth(1.0);
        doc.line(startX + padding + 10, startY + (cellHeight / 2) + 15, startX + cellWidth - padding - 10, startY + (cellHeight / 2) + 15);
      }

      doc.save(`库位标签_巨无霸版_${trimmed}.pdf`);
      setIsGenerating(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row items-center lg:items-stretch justify-center gap-6 p-4 md:p-8 font-sans">
      {/* Left Card: Label Generator */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col justify-between border border-slate-100"
      >
        <div>
          <div className="bg-blue-600 p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="flex items-center gap-2.5 leading-tight">
                <Package className="w-8 h-8 text-blue-100 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xl font-extrabold tracking-wide uppercase">Label Generator</span>
                  <span className="text-xs font-medium opacity-90">库位标签生成器 (巨无霸单页版)</span>
                </div>
              </h1>
              <p className="mt-2.5 text-blue-100/90 text-xs leading-relaxed">
                Generate 1-9 location labels on a single A4 page instantly.<br/>
                <span className="opacity-75 text-[10px]">在一页 A4 纸上快速生成 9 张巨无霸库位标签。</span>
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
              <label htmlFor="prefix" className="block mb-2">
                <span className="block text-sm font-bold text-slate-800 tracking-wide">LOCATION PREFIX</span>
                <span className="block text-xs text-slate-400 font-normal">库位前缀 (例如: D3, F21)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="prefix"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                  placeholder="Enter prefix (e.g., D) / 输入库位前缀"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-lg font-semibold uppercase"
                  maxLength={10}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <ArrowRight size={20} />
                </div>
              </div>

              {/* Duplicate Warning */}
              <AnimatePresence>
                {hasDuplicate && duplicateRecord && (() => {
                  const dateInfo = getBilingualDateInfo(duplicateRecord.timestamp);
                  return (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="p-4 bg-red-50 border-2 border-red-500 rounded-xl flex items-start gap-3 text-red-900 overflow-hidden shadow-md relative mt-4"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 animate-pulse" />
                      <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5 animate-bounce" />
                      <div className="text-sm leading-relaxed">
                        <p className="font-extrabold text-red-700 tracking-wide uppercase text-sm leading-none flex items-center gap-1.5">
                          DUPLICATE LOCATION WARNING!
                        </p>
                        <p className="text-xs font-semibold text-slate-800 mt-2 leading-snug">
                          Location <span className="underline decoration-red-500 decoration-2 font-mono text-red-600 text-sm font-bold bg-white px-1.5 py-0.5 rounded border border-red-100">{trimmedPrefix}</span> has already been printed <span className="font-bold text-red-600">{dateInfo.en}</span>.
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1.5 border-t border-red-200/50 pt-1.5 leading-normal">
                          ⚠️ 该库位在 <span className="font-bold text-slate-700">{dateInfo.cn}</span> 已经打印使用过一次，请避免重复使用。
                        </p>
                      </div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <h3 className="mb-3 flex items-center gap-1.5">
                <Calendar size={14} className="text-slate-400" />
                <div className="flex flex-col leading-tight">
                  <span className="text-xs font-bold text-slate-500 tracking-wider">LABEL PREVIEW (3x3 Layout)</span>
                  <span className="text-[10px] text-slate-400">标签预览 (九宫格布局)</span>
                </div>
              </h3>
              <div className="flex flex-wrap gap-2">
                {prefix ? (
                  [1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <span key={num} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium border border-blue-100">
                      {prefix}-<span className="italic text-[0.9em]">{num}</span>
                    </span>
                  ))
                ) : (
                  <div className="text-slate-400 text-xs flex flex-col py-1">
                    <span className="font-semibold">Please enter prefix above</span>
                    <span className="text-[10px] opacity-80">请在上方输入前缀以预览标签</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 pt-0 space-y-4">
          <button
            onClick={generatePDF}
            disabled={!prefix.trim() || isGenerating}
            className={`w-full py-3.5 rounded-xl text-white shadow-lg transition-all flex flex-col items-center justify-center ${
              !prefix.trim() || isGenerating
                ? 'bg-slate-300 cursor-not-allowed shadow-none'
                : hasDuplicate
                ? 'bg-amber-500 hover:bg-amber-600 active:scale-[0.98]'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
            }`}
          >
            {isGenerating ? (
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Download size={18} />
                </motion.div>
                <div className="flex flex-col items-center leading-tight">
                  <span className="text-sm font-bold tracking-wider">GENERATING LABEL PDF...</span>
                  <span className="text-[10px] opacity-80">正在生成库位标签 PDF...</span>
                </div>
              </div>
            ) : hasDuplicate ? (
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="animate-pulse" />
                <div className="flex flex-col items-center leading-tight">
                  <span className="text-sm font-extrabold tracking-wider">FORCE GENERATE & DOWNLOAD</span>
                  <span className="text-[10px] font-medium opacity-90">确认重复并强制下载标签</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Download size={18} />
                <div className="flex flex-col items-center leading-tight">
                  <span className="text-sm font-bold tracking-wider">GENERATE & DOWNLOAD LABEL</span>
                  <span className="text-[10px] font-medium opacity-90">生成并下载库位标签</span>
                </div>
              </div>
            )}
          </button>

          <div className="text-center text-slate-400 leading-relaxed flex flex-col items-center">
            <span className="text-[10px] font-semibold">PDF will contain 1 page with 9 giant labels (3x3 Grid layout).</span>
            <span className="text-[9px] opacity-85">生成的 PDF 将包含 1 页，内含 9 个库位标签 (3x3 布局)</span>
          </div>
        </div>
      </motion.div>

      {/* Right Card: Print History (3 Days) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl p-5 border border-slate-100 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
            <h2 className="text-slate-800 flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-black tracking-wider text-slate-800 uppercase">PRINT HISTORY</span>
                <span className="text-[10px] text-slate-400 font-medium">3天内打印历史记录</span>
              </div>
            </h2>
            
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <div className="bg-slate-100 px-2 py-0.5 rounded-md text-right leading-none flex flex-col border border-slate-200/60">
                  <span className="text-[10px] font-extrabold text-blue-700">Today: {getTodayPrintsCount()}</span>
                  <span className="text-[8px] text-slate-500 scale-[0.9] origin-right">今日已印</span>
                </div>
              )}
              {history.length > 0 && (
                <button 
                  onClick={() => {
                    if (confirm('确定要清空所有记录吗？\nAre you sure you want to clear all history?')) {
                      saveHistory([]);
                    }
                  }}
                  className="text-xs text-red-500 hover:text-red-700 hover:underline flex items-center gap-1 transition-all py-1 px-2 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 flex items-center gap-0.5"
                >
                  <Trash2 size={12} />
                  <div className="flex flex-col items-start scale-[0.95] leading-none">
                    <span className="font-bold text-[10px]">CLEAR</span>
                    <span className="text-[8px] opacity-85">清空</span>
                  </div>
                </button>
              )}
            </div>
          </div>
          
          <div className="overflow-y-auto max-h-[420px] pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {history.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 text-center">
                <Clock className="w-10 h-10 mb-2 stroke-[1.5] text-slate-300" />
                <p className="text-xs font-bold tracking-wider uppercase">No Print Records</p>
                <p className="text-[10px] opacity-75 mt-0.5">暂无3天内的打印记录</p>
              </div>
            ) : (
              history.map((record) => {
                const dateInfo = getBilingualDateInfo(record.timestamp);
                return (
                  <motion.div
                    key={record.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center justify-between py-1.5 px-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-lg border border-slate-100/80 transition-all group gap-2"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-bold font-mono border border-blue-100 min-w-[48px] text-center shadow-xs">
                        {record.prefix}
                      </div>
                      
                      <div className="flex items-baseline truncate">
                        <span className="text-[11px] font-bold text-slate-700 tracking-wide">
                          {dateInfo.en}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium ml-1.5 whitespace-nowrap">
                          ({dateInfo.cn})
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        saveHistory(history.filter(h => h.id !== record.id));
                      }}
                      className="text-slate-400 hover:text-red-500 opacity-60 hover:opacity-100 group-hover:opacity-100 transition-opacity p-1 hover:bg-white rounded border border-transparent hover:border-slate-100 shadow-xs flex-shrink-0"
                      title="Delete Record / 删除记录"
                    >
                      <X size={12} />
                    </button>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        <div className="pt-3.5 border-t border-slate-100 text-center space-y-0.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Records automatically clear after 3 days</p>
          <p className="text-[9px] text-slate-400 opacity-80">⏳ 记录将在打印 3 天后自动清理过期，防止干扰新标签录入</p>
        </div>
      </motion.div>

      {/* Confirmation Dialog Backdrop & Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-500" />
              <div className="flex items-start gap-3 mt-2">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">Duplicate Warning</h3>
                  <p className="text-[11px] text-slate-400 font-medium leading-none mt-1">重复库位警告</p>
                </div>
              </div>
              
              <div className="mt-4 bg-slate-50 p-4.5 rounded-2xl border border-slate-100 text-xs space-y-3">
                <div className="text-slate-800 leading-relaxed font-semibold">
                  <p className="text-sm">
                    Location prefix <span className="font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 font-bold">"{prefix.trim().toUpperCase()}"</span> was already printed:
                  </p>
                  <p className="text-sm text-amber-800 mt-1 font-extrabold flex items-center gap-1">
                    👉 {duplicateRecord && getBilingualDateInfo(duplicateRecord.timestamp).en}
                  </p>
                </div>
                
                <div className="border-t border-slate-200/60 pt-2.5 text-[11px] text-slate-500 leading-normal">
                  检测到库位前缀 <span className="font-bold text-slate-700">"{prefix.trim().toUpperCase()}"</span> 在 <span className="font-bold text-slate-700">{duplicateRecord && getBilingualDateInfo(duplicateRecord.timestamp).cn}</span> 已经生成过，请确认是否重复打印。
                </div>

                <div className="text-[10px] text-amber-600 font-medium bg-amber-50/50 p-2 rounded-lg border border-amber-100/60 leading-normal">
                  ⚠️ Warehouse guidelines recommend avoiding duplicate location prefixes within 3 days to prevent inventory confusion.
                  <span className="block opacity-85 mt-1 text-[9px] font-normal">库房建议3天内避免使用完全相同的库位编码，防止货物堆放错乱。</span>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 font-bold rounded-xl transition-all text-xs flex flex-col items-center justify-center leading-none gap-1 text-slate-600"
                >
                  <span className="uppercase tracking-wider">Cancel</span>
                  <span className="text-[9px] font-medium opacity-80">取消打印</span>
                </button>
                <button
                  onClick={executeGeneratePDF}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all text-xs flex flex-col items-center justify-center leading-none gap-1"
                >
                  <span className="uppercase tracking-wider">Force Print</span>
                  <span className="text-[9px] font-medium opacity-90">确认重复并打印</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
