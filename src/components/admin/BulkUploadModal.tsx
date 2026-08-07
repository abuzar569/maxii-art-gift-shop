'use client';
import React, { useRef, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  MdClose,
  MdUploadFile,
  MdCheckCircle,
  MdError,
  MdFileDownload,
  MdCloudUpload,
} from 'react-icons/md';

interface UploadResult {
  message: string;
  success: number;
  failed: number;
  errors: { row: number; reason: string }[];
}

interface Props {
  onClose: () => void;
  onUploaded: () => void;
}

export default function BulkUploadModal({ onClose, onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.csv')) {
      toast.error('Only CSV files are supported');
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/orders/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResult(res.data);

      if (res.data.success > 0) {
        toast.success(`${res.data.success} order${res.data.success > 1 ? 's' : ''} imported successfully`);
        onUploaded();
      }
      if (res.data.failed > 0) {
        toast.error(`${res.data.failed} row${res.data.failed > 1 ? 's' : ''} failed — check the error log below`);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Upload failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'customerName',
      'phone',
      'productName',
      'quantity',
      'totalAmount',
      'advanceAmount',
      'paymentMethod',
      'status',
      'orderDate',
      'completionDate',
      'address',
      'notes',
    ];
    const exampleRow = [
      'Priya Sharma',
      '9876543210',
      'Custom Gift Hamper',
      '2',
      '1500',
      '500',
      'UPI',
      'Pending',
      new Date().toISOString().slice(0, 10),
      '',
      'Mumbai',
      'Handle with care',
    ];
    const csv = [headers.join(','), exampleRow.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orders_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={!loading ? onClose : undefined} />
      <div className="relative w-full max-w-xl bg-white dark:bg-navy-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-navy-700">
          <div>
            <h2 className="text-lg font-bold text-navy-900 dark:text-white">Bulk Upload Orders</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Import multiple orders at once via CSV</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 text-gray-500 transition disabled:opacity-40"
          >
            <MdClose className="text-xl" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Download Template */}
          <div className="flex items-center justify-between p-3 bg-brand-50 dark:bg-brand-500/10 rounded-xl border border-brand-100 dark:border-brand-500/20">
            <div>
              <p className="text-sm font-medium text-brand-700 dark:text-brand-300">Need a template?</p>
              <p className="text-xs text-brand-500 dark:text-brand-400">Download the CSV template with all required columns</p>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 px-3 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium rounded-xl transition"
            >
              <MdFileDownload className="text-base" /> Template
            </button>
          </div>

          {/* Required Columns Info */}
          <div className="p-3 bg-gray-50 dark:bg-navy-700 rounded-xl">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">Required columns:</p>
            <div className="flex flex-wrap gap-1.5">
              {['customerName', 'phone', 'productName', 'quantity', 'totalAmount', 'advanceAmount', 'paymentMethod', 'orderDate'].map(col => (
                <span key={col} className="px-2 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-full font-mono">
                  {col}
                </span>
              ))}
            </div>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mt-2 mb-1">Optional columns:</p>
            <div className="flex flex-wrap gap-1.5">
              {['status', 'completionDate', 'address', 'notes'].map(col => (
                <span key={col} className="px-2 py-0.5 bg-gray-200 dark:bg-navy-600 text-gray-600 dark:text-gray-300 text-xs rounded-full font-mono">
                  {col}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              paymentMethod: <span className="font-mono">Cash</span> / <span className="font-mono">UPI</span> / <span className="font-mono">Bank Transfer</span>
            </p>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
              dragging
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                : file
                ? 'border-green-400 bg-green-50 dark:bg-green-500/10'
                : 'border-gray-200 dark:border-navy-600 hover:border-brand-400 hover:bg-gray-50 dark:hover:bg-navy-700'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
            />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <MdUploadFile className="text-4xl text-green-500" />
                <p className="font-medium text-navy-900 dark:text-white text-sm">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB — click to change</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <MdCloudUpload className="text-4xl text-gray-300 dark:text-gray-500" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Drop your CSV here or click to browse
                </p>
                <p className="text-xs text-gray-400">.csv files only</p>
              </div>
            )}
          </div>

          {/* Result */}
          {result && (
            <div className="space-y-3">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-500/10 rounded-xl">
                  <MdCheckCircle className="text-2xl text-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">{result.success}</p>
                    <p className="text-xs text-green-600 dark:text-green-400">Imported</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-500/10 rounded-xl">
                  <MdError className="text-2xl text-red-500 flex-shrink-0" />
                  <div>
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">{result.failed}</p>
                    <p className="text-xs text-red-600 dark:text-red-400">Failed</p>
                  </div>
                </div>
              </div>

              {/* Error log */}
              {result.errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-500/10 rounded-xl p-3">
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2">
                    Failed rows ({result.errors.length}):
                  </p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {result.errors.map((e, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <span className="bg-red-200 dark:bg-red-500/30 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded font-mono flex-shrink-0">
                          Row {e.row}
                        </span>
                        <span className="text-red-600 dark:text-red-400">{e.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-navy-700">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-navy-600 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-700 transition disabled:opacity-40"
          >
            {result ? 'Close' : 'Cancel'}
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Uploading...
              </>
            ) : (
              <><MdCloudUpload className="text-lg" /> Upload & Import</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
