import { expect, test } from "@playwright/test";
import { buildThankYouHref } from "@/src/lib/gtag";

test.describe("Post-Booking Confirmation & Thank You Link Builder", () => {
  test("builds complete thank-you href with all rich context parameters", () => {
    const href = buildThankYouHref({
      type: "booking",
      source: "universal_booking_flow",
      booking_code: "MOB-123456-ABCD",
      service_type: "mobile_repair",
      service_label: "Screen Replacement",
      device: "Apple iPhone 13",
      scheduled_date: "2026-10-15",
      time_slot: "10:00 AM - 01:00 PM",
      phone: "9876543210",
      name: "Rahul Sharma",
      price: 3499,
      address: "123 Indiranagar",
      city: "Bengaluru",
      pincode: "560038",
    });

    expect(href).toContain("/thank-you?");
    expect(href).toContain("type=booking");
    expect(href).toContain("booking_code=MOB-123456-ABCD");
    expect(href).toContain("service_type=mobile_repair");
    expect(href).toContain("service_label=Screen+Replacement");
    expect(href).toContain("device=Apple+iPhone+13");
    expect(href).toContain("scheduled_date=2026-10-15");
    expect(href).toContain("phone=9876543210");
    expect(href).toContain("name=Rahul+Sharma");
    expect(href).toContain("price=3499");
    expect(href).toContain("city=Bengaluru");
    expect(href).toContain("pincode=560038");
  });

  test("handles empty or omitted parameters gracefully", () => {
    const bareHref = buildThankYouHref({});
    expect(bareHref).toBe("/thank-you");

    const partialHref = buildThankYouHref({
      booking_code: "MOB-999999-WXYZ",
      price: null,
      scheduled_date: undefined,
    });
    expect(partialHref).toBe("/thank-you?booking_code=MOB-999999-WXYZ");
  });
});
