// src/stores/useModalStore.js
import { create } from 'zustand';

const useModalStore = create((set, get) => ({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: '확인',
    cancelText: null,
    onConfirm: null,
    onCancel: null,

    openModal: ({ title = '', message = '', type = 'info', confirmText = '확인', cancelText = null, onConfirm = null, onCancel = null }) => {
        set({ isOpen: true, title, message, type, confirmText, cancelText, onConfirm, onCancel });
    },

    closeModal: () => {
        set({ isOpen: false, title: '', message: '', type: 'info', confirmText: '확인', cancelText: null, onConfirm: null, onCancel: null });
    },
}));

export default useModalStore;