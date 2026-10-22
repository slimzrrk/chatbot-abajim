import React from "react";
import { Provider } from "react-redux";
import store from "./src/reducers/store";
import AppNavigator from "./src/navigation/AppNavigator";
import { ChatBubbleProvider } from "./src/context/ChatBubbleContext";
import { ChatHistoryProvider } from "./src/context/ChatHistoryContext";
import { AudioProvider } from "./src/context/AudioContext";

export default function App() {
  return (
    <Provider store={store}>
      <ChatHistoryProvider>
        <AudioProvider>
          <ChatBubbleProvider>
            <AppNavigator />
          </ChatBubbleProvider>
        </AudioProvider>
      </ChatHistoryProvider>
    </Provider>
  );
}