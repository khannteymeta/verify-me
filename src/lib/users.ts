import "server-only";
import { db } from "@/lib/db";
import type { Channel } from "@/lib/validation";

export type User = {
  id: string;
  email: string | null;
  phone: string | null;
  created_at: Date;
  last_login_at: Date | null;
};

const COLUMNS = "id, email, phone, created_at, last_login_at";

export async function getUserById(id: string): Promise<User | null> {
  const { rows } = await db.query<User>(`select ${COLUMNS} from users where id = $1`, [id]);
  return rows[0] ?? null;
}

/** Find-or-create the user for a verified email/phone and stamp the login. */
export async function upsertUserForLogin(target: string, channel: Channel): Promise<User> {
  // Column name comes from a fixed set, never from user input.
  const column = channel === "email" ? "email" : "phone";
  const { rows } = await db.query<User>(
    `insert into users (${column}, last_login_at) values ($1, now())
     on conflict (${column}) do update set last_login_at = now()
     returning ${COLUMNS}`,
    [target],
  );
  return rows[0];
}
