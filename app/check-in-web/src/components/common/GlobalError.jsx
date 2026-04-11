import React from 'react';
import useAuth from '../../hooks/useAuth';

const GlobalError = () => {
  const { globalError, setGlobalError } = useAuth();

  if (!globalError) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-md mx-auto bg-red-900 border border-red-500 shadow-2xl rounded-sm p-4 flex items-start gap-4">
        <div className="text-red-400 text-xl flex-shrink-0 mt-0.5">⚠</div>
        <div className="flex-1">
          <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-1">System Error</h3>
          <p className="text-red-100 text-xs leading-relaxed mb-2">
            {typeof globalError === 'string' ? globalError : globalError.message || 'An unexpected error occurred.'}
          </p>
          {globalError.details && (
            <div className="bg-black/20 p-2 rounded-sm mb-3">
              <p className="text-[10px] font-mono text-red-300 break-all leading-tight">
                {globalError.details}
              </p>
            </div>
          )}
          <button 
            onClick={() => setGlobalError(null)}
            className="text-[10px] text-white/60 hover:text-white uppercase font-bold tracking-widest transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalError;
