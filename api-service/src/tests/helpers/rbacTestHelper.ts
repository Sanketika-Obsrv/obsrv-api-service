import jwt from "jsonwebtoken";

// Shared helper for "RBAC enabled" test cases. RBAC_middleware.ts is applied per-route via
// checkRBAC.handler() in Router.ts, and reads the decoded JWT's `sub` to look up the user's
// roles via userService.getUser, then checks those roles against userPermissions.json's
// apiGroups for the route's action (req.id, set by setDataToRequestObject upstream). Since
// this JWT lacks a `.roles` claim, RBAC_middleware routes it through keycloakTokenVerify,
// which is the one that calls userService.getUser -- so mocking that in the test is enough,
// no real token signature verification happens (jwt.decode, not jwt.verify).
export const buildRbacToken = (): string => jwt.sign({ sub: "rbac-test-user" }, "test-secret");

// A role name that doesn't exist in userPermissions.json's roles map at all -- checkAccess's
// `accessControl.roles[role]` is then undefined for every action, so this denies access
// uniformly regardless of which apiGroup the route's action belongs to (unlike e.g. "viewer",
// which legitimately has general_access and would pass on read/list-style routes).
export const NO_ACCESS_ROLE = "no_access_role";
