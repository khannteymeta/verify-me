import "server-only";
import { db } from "@/lib/db";
import type { Channel } from "@/lib/validation";

export type User = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  created_at: Date;
  last_login_at: Date | null;
};

const COLUMNS = "id, name, email, phone, created_at, last_login_at";

// Column name comes from a fixed set, never from user input.
const columnFor = (channel: Channel) => (channel === "email" ? "email" : "phone");

export async function getUserById(id: string): Promise<User | null> {
  const { rows } = await db.query<User>(`select ${COLUMNS} from users where id = $1`, [id]);
  return rows[0] ?? null;
}

export async function userExists(target: string, channel: Channel): Promise<boolean> {
  const { rowCount } = await db.query(
    `select 1 from users where ${columnFor(channel)} = $1`,
    [target],
  );
  return !!rowCount;
}

/** Find-or-create the user for a verified email/phone and stamp the login. */
export async function upsertUserForLogin(target: string, channel: Channel): Promise<User> {
  const column = columnFor(channel);
  const { rows } = await db.query<User>(
    `insert into users (${column}, last_login_at) values ($1, now())
     on conflict (${column}) do update set last_login_at = now()
     returning ${COLUMNS}`,
    [target],
  );
  return rows[0];
}

/** Create a new user for a verified email/phone. Null if it's already taken. */
export async function createUser(
  target: string,
  channel: Channel,
  name: string,
): Promise<User | null> {
  const column = columnFor(channel);
  const { rows } = await db.query<User>(
    `insert into users (name, ${column}, last_login_at) values ($1, $2, now())
     on conflict (${column}) do nothing
     returning ${COLUMNS}`,
    [name, target],
  );
  return rows[0] ?? null;
}
