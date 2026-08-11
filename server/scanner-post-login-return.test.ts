import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const submitOrderSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/SubmitOrder.tsx"),
  "utf8",
);
const loginSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/Login.tsx"),
  "utf8",
);

describe("AI Scanner post-login return", () => {
  it("stores the Scanner destination before clearing the stale worker session", () => {
    expect(submitOrderSource).toContain('sessionStorage.setItem("gspp_post_login_return", "/submit-order/ai-scanner")');
    expect(submitOrderSource).toContain("logoutWorker();");
    expect(submitOrderSource).toContain('navigate("/login")');
  });

  it("returns authenticated workers only to the approved Scanner destination", () => {
    expect(loginSource).toContain('sessionStorage.getItem("gspp_post_login_return")');
    expect(loginSource).toContain('navigate(returnTo === "/submit-order/ai-scanner" ? returnTo : "/")');
    expect(loginSource).toContain('sessionStorage.removeItem("gspp_post_login_return")');
  });
});
