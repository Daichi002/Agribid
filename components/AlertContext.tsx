// AlertContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';
import CustomAlert from './customeAlert';


interface AlertContextProps {
  showAlert: (message: string, duration: number) => void;
}

const AlertContext = createContext<AlertContextProps | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alert, setAlert] = useState<{ message: string; duration: number } | null>(null);

  const showAlert = (message: string, duration: number) => {
    setAlert({ message, duration });
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {alert && <CustomAlert message={alert.message} duration={alert.duration} onDismiss={() => setAlert(null)} />}
    </AlertContext.Provider>
  );
};
