import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  unique,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/** Serialisable playground prop bag; narrowed per component in Phase 5. */
export type PlaygroundProps = Record<string, unknown>;

const createdAt = () => timestamp({ withTimezone: true, mode: "date" }).defaultNow().notNull();

// The third argument must return a FLAT array of builders. Wrapping a builder in an object
// still type-checks (drizzle-orm #6140) but the index is silently dropped, so always compare
// the generated SQL against the constraints declared here.

/** Shareable playground configurations: POST /api/share -> /p/<slug> (Phase 5). */
export const playgroundShares = pgTable(
  "playground_shares",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    /** nanoid(21) */
    slug: varchar({ length: 21 }).notNull(),
    component: varchar({ length: 64 }).notNull(),
    props: jsonb().$type<PlaygroundProps>().notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("playground_shares_slug_idx").on(t.slug),
    index("playground_shares_component_idx").on(t.component),
  ],
);

/** Landing-page waitlist (Phase 5). Emails are stored lower-cased; the CHECK enforces it. */
export const waitlistSignups = pgTable(
  "waitlist_signups",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    email: varchar({ length: 320 }).notNull(),
    source: varchar({ length: 64 }),
    createdAt: createdAt(),
  },
  (t) => [
    unique("waitlist_signups_email_uq").on(t.email),
    check("waitlist_signups_email_lowercase", sql`${t.email} = lower(${t.email})`),
  ],
);

/** Nightly rollup of Redis counters (Phase 5). */
export const analyticsDaily = pgTable(
  "analytics_daily",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    /** "YYYY-MM-DD" */
    day: date({ mode: "string" }).notNull(),
    event: varchar({ length: 64 }).notNull(),
    component: varchar({ length: 64 }),
    count: integer().notNull().default(0),
  },
  (t) => [
    // NULLS NOT DISTINCT (Postgres >= 15) makes (day, event, NULL) unique so the rollup can
    // upsert with onConflictDoUpdate({ target: [day, event, component] }).
    unique("analytics_daily_day_event_component_uq")
      .on(t.day, t.event, t.component)
      .nullsNotDistinct(),
  ],
);

export type PlaygroundShare = typeof playgroundShares.$inferSelect;
export type NewPlaygroundShare = typeof playgroundShares.$inferInsert;
export type WaitlistSignup = typeof waitlistSignups.$inferSelect;
export type NewWaitlistSignup = typeof waitlistSignups.$inferInsert;
export type AnalyticsDailyRow = typeof analyticsDaily.$inferSelect;
export type NewAnalyticsDailyRow = typeof analyticsDaily.$inferInsert;
