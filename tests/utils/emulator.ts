import { readFileSync } from 'fs';
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';

const PROJECT_ID = 'pattern-typing-test';

export async function setupRulesTestEnv(): Promise<RulesTestEnvironment> {
  const rules = readFileSync('firebase/firestore.rules', 'utf8');
  const hostPort = process.env.FIRESTORE_EMULATOR_HOST; // e.g. 127.0.0.1:8080
  if (hostPort) {
    const [host, portStr] = hostPort.split(':');
    const port = Number(portStr);
    return initializeTestEnvironment({ projectId: PROJECT_ID, firestore: { rules, host, port } });
  }
  return initializeTestEnvironment({ projectId: PROJECT_ID, firestore: { rules } });
}

