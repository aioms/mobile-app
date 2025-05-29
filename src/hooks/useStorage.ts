import { parseSafe, stringifySafe } from "@/helpers/common";
import { Drivers, Storage } from "@ionic/storage";
import CordovaSQLiteDriver from "localforage-cordovasqlitedriver";

const storage = new Storage({
  name: "aios_local_db",
  driverOrder: [
    CordovaSQLiteDriver._driver,
    Drivers.IndexedDB,
    Drivers.LocalStorage,
  ],
});

export const initStorage = async () => {
  // await storage.defineDriver(CordovaSQLiteDriver);
  return await storage.create();
};

export const useStorage = () => {
  const addItem = async (key: string, value: any) => {
    if (!storage) return;
    const data = typeof value === "string" ? value : stringifySafe(value);
    await storage.set(key, data);
  };

  const getItem = async (key: string) => {
    if (!storage) return;
    const data = await storage.get(key);
    const parsedData = parseSafe(data);
    return parsedData || data;
  };

  const removeItem = async (key: string) => {
    if (!storage) return;
    await storage.remove(key);
  };

  return {
    storage,
    addItem,
    getItem,
    removeItem,
  };
};
