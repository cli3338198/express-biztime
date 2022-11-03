"use strict";

const { Router } = require("express");

const db = require("../db");

const { NotFoundError, BadRequestError } = require("../expressError");

const router = Router();

const app = require("../app");
const { getCompanyHandler } = require("../handlers/handlers");

/**
 * GET /invoices
 * Return info on invoices: like {invoices: [{id, comp_code}, ...]}
 */

router.get("/", async function (req, res) {
  const results = await db.query(
    `SELECT id, comp_code
        FROM invoices
        ORDER BY id`
  );

  const invoices = results.rows;

  return res.json({ invoices });
});

/**
 * GET /invoices/[id]
 * Takes in an invoice id
 * If invoice cannot be found, returns 404.
 * Returns JSON like:
 * {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}
 */

router.get("/:id", async function (req, res) {
  const id = req.params.id;

  const results = await db.query(
    `SELECT i.id,
            i.amt,
            i.paid,
            i.add_date,
            i.paid_date,
            i.comp_code,
            c.name,
            c.description
        FROM invoices AS i
            JOIN companies AS c
                ON (i.comp_code = c.code)
        WHERE id = $1`,
    [id]
  );

  const data = results.rows[0];

  if (!data) throw new NotFoundError();

  const invoice = {
    id: data.id,
    company: {
      code: data.comp_code,
      name: data.name,
      description: data.description,
    },
    amt: data.amt,
    paid: data.paid,
    add_date: data.add_date,
    paid_date: data.paid_date,
  };

  return res.json({ invoice });
});

/**
 * POST /invoices
 * Adds an invoice.
 * Needs to be passed in JSON body of: {comp_code, amt}
 * Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */
router.post("/", async function (req, res) {
  if (req.body === undefined) throw new BadRequestError();

  const { comp_code, amt } = req.body;

  if (!comp_code) {
    throw new BadRequestError("comp_code required");
  }
  if (!amt) {
    throw new BadRequestError("amt required");
  }

  // just search for the company?
  const foundCompanyResults = await db.query(
    `SELECT code
      FROM companies
      WHERE code = $1`,
    [comp_code]
  );

  const foundCompany = foundCompanyResults.rows[0];

  if(!foundCompany) throw new BadRequestError("company does not exist");

  const result = await db.query(
    `INSERT INTO invoices (comp_code, amt)
      VALUES ($1, $2)
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [comp_code, amt]
  );

  const invoice = result.rows[0];
  return res.json({ invoice });
});

/**
 * PUT /invoices/[id]
 * Updates an invoice.
 * If invoice cannot be found, returns a 404.
 * Needs to be passed in a JSON body of {amt}
 * Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */
router.put("/:id", async function (req, res) {
  if (req.body === undefined) throw new BadRequestError();

  const { id } = req.params;
  const { amt } = req.body;

  const result = await db.query(
    `
    UPDATE invoices
    SET amt = $1
    WHERE id = $2
    RETURNING id, comp_code, amt, paid, add_date, paid_date
  `,
    [amt, id]
  );

  if (result.rows.length === 0) throw new NotFoundError();

  const invoice = result.rows[0];

  // if not invoice?

  return res.json({ invoice });
});

/**
 * DELETE /invoices/[id]
 * Deletes an invoice.
 * If invoice cannot be found, returns a 404.
 * Returns: {status: "deleted"}
 */
router.delete("/:id", async function (req, res) {
  const { id } = req.params;

  const results = await db.query(
    `DELETE FROM invoices WHERE id = $1
    RETURNING id`,
    [id]
  );

  const invoice = results.rows[0];

  if (!invoice) throw new NotFoundError();

  return res.json({ status: "Deleted" });
});

module.exports = router;
