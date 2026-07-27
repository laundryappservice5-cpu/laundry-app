import fs from 'fs';
import admin from 'firebase-admin';
import { env, isFcmConfigured } from './env';
import { logger } from './logger';

let initialized = false;

export function getFirebaseAdmin(): admin.app.App | null {
  if (!isFcmConfigured()) {
    return null;
  }
  if (!initialized) {
    const raw = env.fcm.serviceAccountJson;
    const json = fs.existsSync(raw) ? fs.readFileSync(raw, 'utf-8') : raw;
    try {
      const serviceAccount = JSON.parse(json);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      initialized = true;
    } catch (err) {
      logger.error(`Failed to initialize Firebase Admin: ${err}`);
      return null;
    }
  }
  return admin.apps[0] as admin.app.App;
}

export { admin };
