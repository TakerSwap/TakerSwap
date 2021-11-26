type StorageType = "session" | "local";

function getStorageType(type: StorageType) {
  return type === "session" ? sessionStorage : localStorage;
}

class Storage {
  get(type: StorageType, key: string) {
    let result = null;
    const storage = getStorageType(type);
    result = storage.getItem(key);
    if (result) {
      try {
        return JSON.parse(result);
      } catch (e) {
        return result;
      }
    }
    return null;
  }
  set(type: StorageType, key: string, value: any) {
    const storage = getStorageType(type);
    storage.setItem(key, JSON.stringify(value));
  }
  remove(type: StorageType, key: string) {
    const storage = getStorageType(type);
    storage.removeItem(key);
  }
  clear(type: StorageType) {
    const storage = getStorageType(type);
    storage.clear();
  }
}

export default new Storage();
