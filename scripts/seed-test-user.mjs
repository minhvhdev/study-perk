import { createDbClient } from '@minhvhdev/hf-db-sdk';

const db = createDbClient({
  baseUrl: process.env.HF_DB_BASE_URL,
  database: process.env.HF_DB_DATABASE,
  headers: {
    Authorization: `Bearer ${process.env.HF_TOKEN}`,
  },
  timeoutMs: 30_000,
});

const result = await db.query(
  'SELECT id, username FROM users WHERE username = :username LIMIT 1',
  { username: 'testuser01' },
);

const user = result.rows?.[0];

if (!user) {
  throw new Error('testuser01 not found');
}

const now = Date.now();

const rewardState = {
  entries: [
    {
      id: 'spin-entry-1',
      type: 'monetary',
      baseValue: 50,
      label: '50kVNĐ',
      color: '#ecc94b',
      weight: 1,
      enabled: true,
    },
  ],
  spinCount: 1,
  boostCount: 1,
  rewardHistory: [
    {
      id: 'seed-draw-1',
      entryId: 'seed-draw-1',
      name: '50k Test Reward',
      type: 'monetary',
      baseValue: 50,
      receivedAt: now - 600_000,
      isUsed: false,
    },
    {
      id: 'seed-finished-1',
      entryId: 'seed-finished-1',
      name: '25k Ready Reward',
      type: 'monetary',
      baseValue: 25,
      receivedAt: now - 500_000,
      isUsed: false,
      multiplier: 2,
      finishedAt: now - 400_000,
    },
  ],
  totalCashedOut: 0,
};

const studyState = {
  targetSeconds: 3600,
  history: [],
  finishTime: null,
  status: 'idle',
  settings: {
    notificationEnabled: true,
    notificationSound: 'commericalBreak',
    ambientEnabled: false,
    ambientSound: 'rain',
  },
  studyTypes: [
    { id: '1', name: 'English', color: '#8b5cf6' },
    { id: '2', name: 'French', color: '#ec4899' },
  ],
  currentTypeId: '1',
  isBoostEnabled: false,
};

const wrapPersistedState = (state) => ({
  state,
  version: 0,
});

async function upsert(stateKey, value) {
  await db.query(
    `INSERT INTO user_state (user_id, state_key, value_text, updated_at)
     VALUES (:userId, :stateKey, :value, now())
     ON CONFLICT (user_id, state_key)
     DO UPDATE SET value_text = EXCLUDED.value_text, updated_at = now()`,
    {
      userId: user.id,
      stateKey,
      value: JSON.stringify(value),
    },
  );
}

await upsert('reward-spin-storage', wrapPersistedState(rewardState));
await upsert('study-perk-timer', wrapPersistedState(studyState));

console.log(`Seeded test data for ${user.username} (id=${user.id})`);
