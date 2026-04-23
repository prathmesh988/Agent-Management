/**
 * Lazy initializer for the page_permissions Appwrite collection.
 */

import { Client, Databases, Permission, Role } from 'node-appwrite';
import { MANAGED_PAGES, DEFAULT_ROLE_PERMS } from './permissions';

let initialized = false;
let initializing: Promise<void> | null = null;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function createAdminClient() {
  return new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_PROJECT_ID_API_SECRET || '');
}

const COLLECTION_ID = () =>
  process.env.APPWRITE_PERMISSIONS_COLLECTION_ID || 'page_permissions';

async function tryCreate(label: string, fn: () => Promise<unknown>): Promise<boolean> {
  try {
    await fn();
    console.log(`[permissions-init] ✅ ${label}`);
    return true;
  } catch (e: any) {
    if (e?.code === 409) return false;
    console.warn(`[permissions-init] ⚠️ ${label}: ${e?.message}`);
    return false;
  }
}

async function _runInit() {
  const client    = createAdminClient();
  const databases = new Databases(client);
  const DB_ID     = process.env.APPWRITE_DATABASE_ID || '';
  const COL_ID    = COLLECTION_ID();

  let anyCreated = false;

  // ── Collection ────────────────────────────────────────────────────────────
  if (await tryCreate('page_permissions collection', () =>
    databases.createCollection({
      databaseId:      DB_ID,
      collectionId:    COL_ID,
      name:            'Page Permissions',
      permissions:     [Permission.read(Role.any())],
      documentSecurity: false,
    })
  )) anyCreated = true;

  // ── Attributes ────────────────────────────────────────────────────────────
  for (const attr of [
    { key: 'pageId',        size: 100,  required: true  },
    { key: 'pageName',      size: 255,  required: true  },
    { key: 'pagePath',      size: 500,  required: true  },
    { key: 'rolePerms',     size: 5000, required: false },
    { key: 'userOverrides', size: 20000,required: false },
  ]) {
    if (await tryCreate(`attr.${attr.key}`, () =>
      databases.createStringAttribute({
        databaseId:   DB_ID,
        collectionId: COL_ID,
        key:          attr.key,
        size:         attr.size,
        required:     attr.required,
      })
    )) anyCreated = true;
  }

  if (anyCreated) {
    console.log('[permissions-init] ⏳ Waiting for attribute processing…');
    await sleep(5000);
  }

  // ── Seed default documents for each managed page (if not already present) ─
  const DB = new Databases(createAdminClient());
  const defaultRolePerms = JSON.stringify(DEFAULT_ROLE_PERMS);

  for (const page of MANAGED_PAGES) {
    try {
      // Check if document exists
      const existing = await DB.listDocuments({
        databaseId:   DB_ID,
        collectionId: COL_ID,
        queries:      [],
      });
      const found = existing.documents.some((d: any) => d.pageId === page.pageId);
      if (!found) {
        await DB.createDocument({
          databaseId:   DB_ID,
          collectionId: COL_ID,
          documentId:   page.pageId,
          data: {
            pageId:        page.pageId,
            pageName:      page.pageName,
            pagePath:      page.pagePath,
            rolePerms:     defaultRolePerms,
            userOverrides: '{}',
          },
        });
        console.log(`[permissions-init] ✅ Seeded page: ${page.pageId}`);
      }
    } catch (e: any) {
      if (e?.code !== 409) console.warn(`[permissions-init] Seed ${page.pageId}: ${e?.message}`);
    }
  }

  console.log('[permissions-init] 🎉 Ready');
}

export async function ensurePermissionsSchema(): Promise<void> {
  if (initialized) return;
  if (!initializing) {
    initializing = _runInit()
      .then(() => { initialized = true; })
      .catch((e) => {
        console.error('[permissions-init] Fatal:', e);
        initializing = null;
      });
  }
  return initializing!;
}

export { COLLECTION_ID };
