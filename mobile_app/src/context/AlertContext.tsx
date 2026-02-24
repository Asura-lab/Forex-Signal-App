/**
 * Global themed Alert context — replaces React Native's Alert.alert
 * so every dialog respects the app's dark/light theme.
 */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";

export type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
};

type AlertState = {
  visible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
};

type AlertContextType = {
  showAlert: (
    title: string,
    message?: string,
    buttons?: AlertButton[]
  ) => void;
  alertState: AlertState;
  hideAlert: () => void;
};

const AlertContext = createContext<AlertContextType>({
  showAlert: () => {},
  alertState: { visible: false, title: "", message: "", buttons: [] },
  hideAlert: () => {},
});

export const AlertProvider = ({ children }: { children: React.ReactNode }) => {
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    title: "",
    message: "",
    buttons: [],
  });

  const hideAlert = useCallback(() => {
    setAlertState((s) => ({ ...s, visible: false }));
  }, []);

  const showAlert = useCallback(
    (title: string, message?: string, buttons?: AlertButton[]) => {
      setAlertState({
        visible: true,
        title,
        message: message ?? "",
        buttons: buttons?.length
          ? buttons
          : [{ text: "OK", style: "default" }],
      });
    },
    []
  );

  return (
    <AlertContext.Provider value={{ showAlert, alertState, hideAlert }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlert must be used within AlertProvider");
  return ctx;
};
