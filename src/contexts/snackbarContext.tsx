"use client";
import { createContext, useContext, ReactNode } from 'react';
import { SnackbarProvider as NotistackProvider, useSnackbar as useNotistackSnackbar, OptionsObject } from 'notistack';

interface SnackbarContextType {
  showSnackbar: (message: string, options?: OptionsObject) => void;
}

interface SnackbarProviderProps {
  children: ReactNode;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

function SnackbarProvider({ children }: SnackbarProviderProps) {
  // This inner provider allows us to use the notistack hook
  function InnerProvider({ children }: { children: ReactNode }) {
    const { enqueueSnackbar } = useNotistackSnackbar();
    const showSnackbar = (message: string, options?: OptionsObject) => {
      enqueueSnackbar(message, options);
    };
    return (
      <SnackbarContext.Provider value={{ showSnackbar }}>
        {children}
      </SnackbarContext.Provider>
    );
  }

  return (
    <NotistackProvider maxSnack={3} autoHideDuration={4000} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
      <InnerProvider>{children}</InnerProvider>
    </NotistackProvider>
  );
}

function useSnackbar(): SnackbarContextType {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
}

export { SnackbarProvider, useSnackbar }; 