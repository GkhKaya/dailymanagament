import toast from 'react-hot-toast';

export const Alert = {
  success: (message: string) => {
    toast.success(message, {
      style: {
        background: '#1a1a1a',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.1)',
      },
      iconTheme: {
        primary: '#4ade80',
        secondary: '#1a1a1a',
      },
    });
  },
  
  error: (message: string) => {
    toast.error(message, {
      style: {
        background: '#1a1a1a',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.1)',
      },
      iconTheme: {
        primary: '#ef4444',
        secondary: '#1a1a1a',
      },
    });
  },
  
  loading: (message: string) => {
    return toast.loading(message, {
      style: {
        background: '#1a1a1a',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.1)',
      },
    });
  },
  
  info: (message: string) => {
    toast(message, {
      icon: 'ℹ️',
      style: {
        background: '#1a1a1a',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.1)',
      },
    });
  },
  
  dismiss: (toastId?: string) => {
    toast.dismiss(toastId);
  }
};
