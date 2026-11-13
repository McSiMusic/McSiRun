import { combineReducers, configureStore } from "@reduxjs/toolkit";
import walletReducer from "@/src/store/walletSlice";
import gameReducer from "@/src/store/gameSlice";
import { sessionStorageMiddleware } from "@/src/store/sessionStorage";

const rootReducer = combineReducers({ wallet: walletReducer, game: gameReducer });

export const makeStore = () =>
  configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(sessionStorageMiddleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
