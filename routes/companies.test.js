"use strict";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

const companies = [
  { code: "mac", name: "APPLE", description: "apple company" },
];

beforeEach(async function () {
  await db.query("DELETE FROM companies");
  for (const company of companies) {
    await db.query(
      `INSERT INTO companies (code, name, description)
        VALUES ($1, $2, $3)
        `,
      [company.code, company.name, company.description]
    );
  }
});

afterEach(async function () {});

describe("GET /companies", function () {
  test("Gets a list of 1 company", async function () {
    const resp = await request(app).get(`/companies`);
    expect(resp.body).toEqual({
      companies: [{ code: "mac", name: "APPLE" }],
    });
  });
});

describe("GET /companies/[code]", function () {
  test("Gets a company by its code", async function () {
    const resp = await request(app).get(`/companies/mac`);
    expect(resp.body).toEqual({
      company: {
        code: "mac",
        name: "APPLE",
        description: "apple company",
        invoices: [],
      },
    });
  });

  test("We don't get a company if not valid code", async function () {
    const resp = await request(app).get(`/companies/MAC`);
    expect(resp.statusCode).toEqual(404);
  });
});

describe("POST /companies", function () {
  test("Create new company", async function () {
    let results = await db.query(`SELECT * FROM companies`);
    expect(results.rows.length).toEqual(1);

    const resp = await request(app).post(`/companies`).send({
      code: "len",
      name: "LENOVO",
      description: "lenovo company",
    });
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      company: {
        code: "len",
        name: "LENOVO",
        description: "lenovo company",
      },
    });

    results = await db.query(`SELECT * FROM companies`);
    expect(results.rows.length).toEqual(2);
  });

  test("Respond with 400 if empty request body", async function () {
    const resp = await request(app).post(`/companies`).send();
    expect(resp.statusCode).toEqual(400);
  });
});

describe("PUT /companies/[code]", function () {
  test("Entirely update a single company", async function () {
    const resp = await request(app).put(`/companies/mac`).send({
      name: "windows",
      description: "Bought out!!!",
    });
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      company: {
        code: "mac",
        name: "windows",
        description: "Bought out!!!",
      },
    });
  });

  test("Respond with 404 if not found", async function () {
    const resp = await request(app).patch(`/companies/cat`).send({
      name: "windows",
      description: "Bought out!!!",
    });
    expect(resp.statusCode).toEqual(404);
  });

  test("Respond with 400 if empty request body", async function () {
    const resp = await request(app).put(`/companies/mac`).send();
    expect(resp.statusCode).toEqual(400);
  });
});

describe("DELETE /companies/[code]", function () {
  test("It should delete a company", async function () {
    let results = await db.query(`SELECT * FROM companies`);
    expect(results.rows.length).toEqual(1);
    const resp = await request(app).delete(`/companies/mac`);

    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({ status: "Deleted" });

    results = await db.query(`SELECT * FROM companies`);
    expect(results.rows.length).toEqual(0);
  });

  test("It should fail if not a valid company code", async function () {
    const resp = await request(app).delete(`/companies/MAC`);
    expect(resp.statusCode).toEqual(404);
  });
});
