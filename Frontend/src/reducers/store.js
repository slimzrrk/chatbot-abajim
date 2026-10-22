import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth/AuthReducer";  
const store = configureStore({
    reducer: {
        auth: authReducer,  // Manages authentication state
    },
});

export default store;
