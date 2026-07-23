// src/components/common/Modal.jsx
import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, message, type = 'info', confirmText = '확인', cancelText, onConfirm, onCancel }) {
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') handleClose();
        };
        if (isOpen) document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    const iconMap = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
        confirm: '💳',
    };

    const buttonColorMap = {
        success: 'bg-teal-500 hover:bg-teal-600',
        error: 'bg-red-500 hover:bg-red-600',
        warning: 'bg-amber-500 hover:bg-amber-600',
        info: 'bg-teal-500 hover:bg-teal-600',
        confirm: 'bg-teal-500 hover:bg-teal-600',
    };

    const handleClose = () => {
        if (onCancel) onCancel();
        onClose();
    };

    const handleConfirm = () => {
        if (onConfirm) onConfirm();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />
            <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-fade-in">
                <div className="text-center space-y-4">
                    <div className="text-4xl">{iconMap[type]}</div>
                    {title && <h3 className="text-lg font-bold text-gray-800">{title}</h3>}
                    <p className="text-gray-600 text-sm whitespace-pre-line">{message}</p>

                    {cancelText ? (
                        <div className="flex gap-3">
                            <button
                                onClick={handleClose}
                                className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-lg font-bold hover:bg-gray-50"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={handleConfirm}
                                className={`flex-1 text-white py-3 rounded-lg font-bold ${buttonColorMap[type]}`}
                            >
                                {confirmText}
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleConfirm}
                            className={`w-full text-white py-3 rounded-lg font-bold ${buttonColorMap[type]}`}
                        >
                            {confirmText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}