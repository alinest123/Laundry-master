import { pgTable, text, serial, timestamp, unique } from "drizzle-orm/pg-core";

export const pageContentTable = pgTable(
  "page_content",
  {
    id: serial("id").primaryKey(),
    page: text("page").notNull(),
    fieldKey: text("field_key").notNull(),
    value: text("value").notNull().default(""),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({ uniquePageField: unique().on(table.page, table.fieldKey) })
);

export type PageContent = typeof pageContentTable.$inferSelect;
