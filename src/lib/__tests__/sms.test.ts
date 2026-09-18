import { describe, it, expect } from "vitest";
import { smsApprovalRequest } from "../sms";

const params = {
  companyName: "Ridgeline Builders",
  coNumber: "014",
  coTitle: "Relocate kitchen island plumbing",
  approvalLink: "https://app.changeorderpro.com/approve/abc-123",
};

describe("smsApprovalRequest", () => {
  it("opens with the company name and approval intro", () => {
    const body = smsApprovalRequest(params);
    expect(
      body.startsWith(
        "Ridgeline Builders is sending you a change order for approval."
      )
    ).toBe(true);
  });

  it("includes the CO number and title", () => {
    const body = smsApprovalRequest(params);
    expect(body).toContain("CO #014: Relocate kitchen island plumbing");
  });

  it("ends with the approval link", () => {
    const body = smsApprovalRequest(params);
    expect(body.endsWith(params.approvalLink)).toBe(true);
  });

  it("contains no pricing", () => {
    const body = smsApprovalRequest(params);
    expect(body).not.toContain("$");
  });
});
