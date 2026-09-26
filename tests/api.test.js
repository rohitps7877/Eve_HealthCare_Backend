import assert from "node:assert/strict";
import test from "node:test";
import request from "supertest";

process.env.NODE_ENV = "test";

const { default: app } = await import("../src/server.js");

test("GET / returns the service health message", async () => {
    const response = await request(app).get("/");

    assert.equal(response.status, 200);
    assert.equal(response.text, "EVE Healthcare Backend is running");
});

test("signup rejects requests with missing required fields", async () => {
    const response = await request(app)
        .post("/api/auth/signup")
        .send({ email: "patient@example.com" });

    assert.equal(response.status, 400);
    assert.equal(response.text, "Name, email and password are required");
});

test("webhook rejects unsupported payment statuses", async () => {
    const response = await request(app)
        .post("/api/payments/webhook")
        .send({
            transactionId: "transaction-test",
            bookingId: 1,
            status: "PENDING"
        });

    assert.equal(response.status, 400);
    assert.equal(response.text, "Payment status must be SUCCESS or FAILED");
});

test("protected profile endpoint requires a bearer token", async () => {
    const response = await request(app).get("/api/auth/profile");

    assert.equal(response.status, 401);
});
