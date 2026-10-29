import { getDb } from '@/lib/db';
import { ok, route } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = route(async () => ok((await getDb()).stores));
