'use client';
import React from 'react';
import { MdWarning } from 'react-icons/md';

interface Props {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteModal({ message, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-white dark:bg-navy-800 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 dark:bg-red-500/20 rounded-xl">
            <MdWarning className="text-xl text-red-500" />
          </div>
          <h3 className="font-semibold text-navy-900 dark:text-white">Confirm Delete</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-navy-600 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
