import React, { createContext, useState, useContext } from 'react';

interface GlowContextType {
  glow: boolean;
  setGlow: (state: boolean) => void;
}

const GlowContext = createContext<GlowContextType>({
  glow: false,
  setGlow: () => {}, // Default function, overridden in provider
});

import { ReactNode } from 'react';

export const GlowProvider = ({ children }: { children: ReactNode }) => {
  const [glow, setGlow] = useState(false);

  return (
    <GlowContext.Provider value={{ glow, setGlow }}>
      {children}
    </GlowContext.Provider>
  );
};

export const useGlow = () => useContext(GlowContext);
