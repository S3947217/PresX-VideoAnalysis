import { CriterionKey } from "@/types/project";

// ============ Form Draft (localStorage) ============

export interface FormDraft {
    name: string;
    purpose: string;
    audience: string;
    topic: string;
    selectedCriteria: CriterionKey[];
    useCustomCriteria: boolean;
    step: 1 | 2;
}

export function saveFormDraft(sessionKey: string, draft: FormDraft): void {
    try {
        localStorage.setItem(`presx-form-${sessionKey}`, JSON.stringify(draft));
    } catch {}
}

export function loadFormDraft(sessionKey: string): FormDraft | null {
    try {
        const raw = localStorage.getItem(`presx-form-${sessionKey}`);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function clearFormDraft(sessionKey: string): void {
    try {
        localStorage.removeItem(`presx-form-${sessionKey}`);
    } catch {}
}

// ============ Recording Draft (IndexedDB) ============

const DB_NAME = "presx-recordings";
const DB_VERSION = 1;
const META_STORE = "meta";
const BATCH_STORE = "batches";

export interface RecordingMeta {
    sessionKey: string;
    sampleRate: number;
    recordingTime: number;
    batchCount: number;
    completed: boolean;
    savedAt: number;
}

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(META_STORE)) {
                db.createObjectStore(META_STORE, { keyPath: "sessionKey" });
            }
            if (!db.objectStoreNames.contains(BATCH_STORE)) {
                db.createObjectStore(BATCH_STORE);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/** Save a batch of audio chunks + update meta in one transaction. */
export async function saveRecordingBatch(
    sessionKey: string,
    batchIndex: number,
    data: Float32Array,
    meta: Omit<RecordingMeta, "sessionKey" | "savedAt">
): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([META_STORE, BATCH_STORE], "readwrite");
        if (data.length > 0) {
            tx.objectStore(BATCH_STORE).put(data, `${sessionKey}:${batchIndex}`);
        }
        tx.objectStore(META_STORE).put({
            sessionKey,
            ...meta,
            savedAt: Date.now(),
        });
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => { db.close(); reject(tx.error); };
    });
}

/** Update just the meta (e.g. to mark completed without new audio data). */
export async function updateRecordingMeta(
    sessionKey: string,
    meta: Omit<RecordingMeta, "sessionKey" | "savedAt">
): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(META_STORE, "readwrite");
        tx.objectStore(META_STORE).put({
            sessionKey,
            ...meta,
            savedAt: Date.now(),
        });
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => { db.close(); reject(tx.error); };
    });
}

/** Load all saved recording data for a session key. */
export async function loadRecordingDraft(
    sessionKey: string
): Promise<{ meta: RecordingMeta; batches: Float32Array[] } | null> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([META_STORE, BATCH_STORE], "readonly");
            const metaReq = tx.objectStore(META_STORE).get(sessionKey);

            metaReq.onsuccess = () => {
                const meta = metaReq.result as RecordingMeta | undefined;
                if (!meta || meta.batchCount === 0) {
                    db.close();
                    resolve(null);
                    return;
                }

                const batches: Float32Array[] = [];
                let loaded = 0;

                for (let i = 0; i < meta.batchCount; i++) {
                    const batchReq = tx.objectStore(BATCH_STORE).get(`${sessionKey}:${i}`);
                    batchReq.onsuccess = () => {
                        if (batchReq.result) batches[i] = batchReq.result;
                        loaded++;
                        if (loaded === meta.batchCount) {
                            db.close();
                            resolve({ meta, batches: batches.filter(Boolean) });
                        }
                    };
                    batchReq.onerror = () => {
                        loaded++;
                        if (loaded === meta.batchCount) {
                            db.close();
                            resolve({ meta, batches: batches.filter(Boolean) });
                        }
                    };
                }
            };

            metaReq.onerror = () => { db.close(); reject(metaReq.error); };
        });
    } catch {
        return null;
    }
}

/** Clear all recording data for a session key. */
export async function clearRecordingDraft(sessionKey: string): Promise<void> {
    try {
        const db = await openDB();
        // Read meta to know batch count
        const meta = await new Promise<RecordingMeta | undefined>((resolve) => {
            const tx = db.transaction(META_STORE, "readonly");
            const req = tx.objectStore(META_STORE).get(sessionKey);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve(undefined);
        });

        return new Promise((resolve, reject) => {
            const tx = db.transaction([META_STORE, BATCH_STORE], "readwrite");
            tx.objectStore(META_STORE).delete(sessionKey);
            if (meta) {
                for (let i = 0; i < meta.batchCount; i++) {
                    tx.objectStore(BATCH_STORE).delete(`${sessionKey}:${i}`);
                }
            }
            tx.oncomplete = () => { db.close(); resolve(); };
            tx.onerror = () => { db.close(); reject(tx.error); };
        });
    } catch {}
}
