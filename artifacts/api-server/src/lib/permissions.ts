export type Role = "super_admin" | "administrator" | "editor" | "author" | "consultant" | "user";
export type Resource =
  | "dashboard" | "articles" | "categories" | "authors" | "tags"
  | "fabrics" | "stains" | "users" | "experts" | "appointments"
  | "payments" | "zoom" | "newsletter" | "media" | "seo"
  | "redirects" | "settings" | "security_logs" | "audit_logs";
export type Action = "view" | "create" | "edit" | "delete" | "publish";

// true = allowed, false/undefined = denied
type PermMap = Partial<Record<Role, Action[]>>;
const PERMS: Record<Resource, PermMap> = {
  dashboard:     { super_admin: ["view"], administrator: ["view"], editor: ["view"], author: ["view"], consultant: ["view"] },
  articles:      { super_admin: ["view","create","edit","delete","publish"], administrator: ["view","create","edit","delete","publish"], editor: ["view","create","edit","delete","publish"], author: ["view","create","edit"] },
  categories:    { super_admin: ["view","create","edit","delete"], administrator: ["view","create","edit","delete"], editor: ["view","create","edit","delete"], author: ["view"] },
  authors:       { super_admin: ["view","create","edit","delete"], administrator: ["view","create","edit","delete"], editor: ["view"] },
  tags:          { super_admin: ["view","create","edit","delete"], administrator: ["view","create","edit","delete"], editor: ["view","create","edit","delete"], author: ["view"] },
  fabrics:       { super_admin: ["view","create","edit","delete"], administrator: ["view","create","edit","delete"], editor: ["view","create","edit","delete"] },
  stains:        { super_admin: ["view","create","edit","delete"], administrator: ["view","create","edit","delete"], editor: ["view","create","edit","delete"] },
  users:         { super_admin: ["view","create","edit","delete"], administrator: ["view","create","edit","delete"] },
  experts:       { super_admin: ["view","create","edit","delete"], administrator: ["view","create","edit","delete"], editor: ["view"] },
  appointments:  { super_admin: ["view","edit"], administrator: ["view","edit"], consultant: ["view"] },
  payments:      { super_admin: ["view"], administrator: ["view"], consultant: ["view"], user: ["view"] },
  zoom:          { super_admin: ["view","create","edit","delete"], administrator: ["view","create","edit","delete"], consultant: ["view"] },
  newsletter:    { super_admin: ["view","create","delete"], administrator: ["view","create","delete"], editor: ["view"] },
  media:         { super_admin: ["view","create","delete"], administrator: ["view","create","delete"], editor: ["view","create","delete"], author: ["view","create","delete"] },
  seo:           { super_admin: ["view","edit"], administrator: ["view","edit"], editor: ["view"] },
  redirects:     { super_admin: ["view","create","edit","delete"], administrator: ["view","create","edit","delete"] },
  settings:      { super_admin: ["view","edit"] },
  security_logs: { super_admin: ["view"] },
  audit_logs:    { super_admin: ["view"], administrator: ["view"] },
};

export function can(role: Role, resource: Resource, action: Action): boolean {
  return PERMS[resource]?.[role]?.includes(action) ?? false;
}
