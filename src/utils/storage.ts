type StorageType = "session" | "local";

class Storage {
  get(type: StorageType, key: string) {
    let result = null;
    const storage = type === "session" ? sessionStorage : localStorage;
    result = storage.getItem(key);
    if (result) {
      return JSON.parse(result);
    }
    return null;
  }
  set(type: StorageType, key: string, value: any) {
    const storage = type === "session" ? sessionStorage : localStorage;
    storage.setItem(key, JSON.stringify(value));
  }
  remove(type: StorageType, key?: string) {
    const storage = type === "session" ? sessionStorage : localStorage;
    if (key) {
      storage.removeItem(key);
    } else {
      storage.clear();
    }
  }
}

export default new Storage();
