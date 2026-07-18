export const NOTE_FILE_DB = "tutorial-clinic-files";
export const NOTE_FILE_STORE = "noteFiles";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(NOTE_FILE_DB, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(NOTE_FILE_STORE)) database.createObjectStore(NOTE_FILE_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function saveNoteFile(fileId: string, file: File) {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(NOTE_FILE_STORE, "readwrite");
    transaction.objectStore(NOTE_FILE_STORE).put(file, fileId);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

export async function getNoteFile(fileId: string): Promise<File | undefined> {
  const database = await openDatabase();
  const file = await new Promise<File | undefined>((resolve, reject) => {
    const request = database.transaction(NOTE_FILE_STORE, "readonly").objectStore(NOTE_FILE_STORE).get(fileId);
    request.onsuccess = () => resolve(request.result as File | undefined);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return file;
}

export async function clearNoteFiles() {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(NOTE_FILE_STORE, "readwrite");
    transaction.objectStore(NOTE_FILE_STORE).clear();
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}
