import { describe, it, expect, afterEach, vi } from "vitest";
import { classifyTicketStatus, postboxConfigured, createTicket } from "@/lib/services/postbox";

const ORIGINAL = process.env.POSTBOX_TICKET_URL;
afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.POSTBOX_TICKET_URL;
  else process.env.POSTBOX_TICKET_URL = ORIGINAL;
});

describe("classifyTicketStatus", () => {
  it("treats 201 as created", () => {
    expect(classifyTicketStatus(201)).toBe("created");
  });

  it("treats ANY 2xx as created", () => {
    // The six-week outage's sibling bug: only 201 counted, so a change to
    // 200 would have reported failure for tickets that were created.
    expect(classifyTicketStatus(200)).toBe("created");
    expect(classifyTicketStatus(202)).toBe("created");
    expect(classifyTicketStatus(204)).toBe("created");
  });

  it("treats 400 as a user-correctable problem", () => {
    expect(classifyTicketStatus(400)).toBe("invalid");
  });

  it("treats 429 as rate limiting", () => {
    expect(classifyTicketStatus(429)).toBe("rate-limited");
  });

  it("treats an auth failure as a failure, not as invalid input", () => {
    // This is the status that actually caused the outage: a deleted key
    // returned 401, which must never be reported to the user as their error.
    expect(classifyTicketStatus(401)).toBe("failed");
    expect(classifyTicketStatus(403)).toBe("failed");
  });

  it("treats redirects, not-founds and server errors as failures", () => {
    expect(classifyTicketStatus(302)).toBe("failed");
    expect(classifyTicketStatus(404)).toBe("failed");
    expect(classifyTicketStatus(500)).toBe("failed");
    expect(classifyTicketStatus(0)).toBe("failed");
  });
});

describe("postboxConfigured", () => {
  it("is false when the URL is unset", () => {
    delete process.env.POSTBOX_TICKET_URL;
    expect(postboxConfigured()).toBe(false);
  });

  it("is false when the URL is blank or whitespace", () => {
    process.env.POSTBOX_TICKET_URL = "   ";
    expect(postboxConfigured()).toBe(false);
  });

  it("is true when a URL is set", () => {
    process.env.POSTBOX_TICKET_URL = "https://postbox.help/api/tickets/cli_test";
    expect(postboxConfigured()).toBe(true);
  });
});

describe("createTicket", () => {
  const payload = { name: "Test", email: "t@example.com", message: "hello" };

  afterEach(() => vi.unstubAllGlobals());

  const respondWith = (status: number, body: string) =>
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(body, { status, headers: { "Content-Type": "application/json" } }))
    );

  it("does not call out at all when unconfigured, and says so", async () => {
    delete process.env.POSTBOX_TICKET_URL;
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    await expect(createTicket(payload)).resolves.toEqual({ kind: "skipped" });
    expect(spy).not.toHaveBeenCalled();
  });

  it("returns created and the ticket id on 201", async () => {
    process.env.POSTBOX_TICKET_URL = "https://example.test/tickets/k";
    respondWith(201, JSON.stringify({ ok: true, ticket: { id: 42 } }));
    await expect(createTicket(payload)).resolves.toEqual({ kind: "created", ticketId: 42 });
  });

  it("returns created on a 200, which the old code reported as failure", async () => {
    process.env.POSTBOX_TICKET_URL = "https://example.test/tickets/k";
    respondWith(200, JSON.stringify({ ok: true, ticket: { id: 7 } }));
    await expect(createTicket(payload)).resolves.toEqual({ kind: "created", ticketId: 7 });
  });

  it("reports a dead key as a failure and logs the status and body", async () => {
    // Reproduces the six-week outage exactly: a deleted key answering 401.
    process.env.POSTBOX_TICKET_URL = "https://example.test/tickets/dead";
    respondWith(401, JSON.stringify({ ok: false, error: "Invalid API key." }));
    const err = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await createTicket(payload);

    expect(result.kind).toBe("failed");
    expect(result).toMatchObject({ status: 401 });
    const logged = err.mock.calls.flat().join(" ");
    expect(logged).toContain("401");
    expect(logged).toContain("Invalid API key.");
    err.mockRestore();
  });

  it("survives a non-JSON body without throwing", async () => {
    process.env.POSTBOX_TICKET_URL = "https://example.test/tickets/k";
    respondWith(502, "<html>Bad Gateway</html>");
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(createTicket(payload)).resolves.toMatchObject({ kind: "failed", status: 502 });
    err.mockRestore();
  });

  it("reports a network-level failure rather than throwing", async () => {
    process.env.POSTBOX_TICKET_URL = "https://example.test/tickets/k";
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("ECONNREFUSED"); }));
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(createTicket(payload)).resolves.toMatchObject({ kind: "failed", status: 0 });
    err.mockRestore();
  });
});
