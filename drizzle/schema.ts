import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, uniqueIndex } from "drizzle-orm/mysql-core";

/** Temporary auth compatibility record; replace with Firebase Auth during backend migration. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Preserved for migration safety; runtime credential storage is delegated to Firebase-ready adapters. */
export const providerCredentials = mysqlTable("providerCredentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 64 }).notNull(),
  displayName: varchar("displayName", { length: 120 }).notNull(),
  endpoint: varchar("endpoint", { length: 255 }).default("").notNull(),
  encryptedKey: text("encryptedKey").notNull(),
  keyHint: varchar("keyHint", { length: 12 }).notNull(),
  isEnabled: boolean("isEnabled").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  userProviderUnique: uniqueIndex("providerCredentials_user_provider_idx").on(table.userId, table.provider),
}));
export type ProviderCredential = typeof providerCredentials.$inferSelect;
export type InsertProviderCredential = typeof providerCredentials.$inferInsert;

/** Preserved for migration safety; runtime settings storage is delegated to Firebase-ready adapters. */
export const workspaceSettings = mysqlTable("workspaceSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  theme: varchar("theme", { length: 16 }).default("light").notNull(),
  defaultProvider: varchar("defaultProvider", { length: 64 }).default("automatic").notNull(),
  autoRouting: boolean("autoRouting").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type WorkspaceSettings = typeof workspaceSettings.$inferSelect;
export type InsertWorkspaceSettings = typeof workspaceSettings.$inferInsert;
