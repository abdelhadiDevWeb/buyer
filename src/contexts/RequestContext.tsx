import { createContext, useState, ReactNode } from "react";

// ============================================================

export const RequestContext = createContext({
  isLoading: false,
  setLoading: (arg: boolean) => { },
});

// ============================================================

const RequestProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setLoading] = useState<boolean>(false);

  return (
    <RequestContext.Provider
      value={{
        setLoading,
        isLoading,
      }}
    >
      {children}
    </RequestContext.Provider>
  );
};

export default RequestProvider;