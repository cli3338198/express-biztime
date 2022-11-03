"use strict";

const { Router } = require("express");

const db = require("../db");

const { NotFoundError, BadRequestError } = require("../expressError");

const router = Router();

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

  return res.json({ invoices })
});

/**
 * GET /invoices/[id]
 * Takes in an invoice id
 * If invoice cannot be found, returns 404.
 * Returns JSON like:
 * {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}
*/

router.get("/:id", async function (req, res) {
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

  if(!invoice_data) throw new NotFoundError();

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
  }

  return res.json({ invoice })
});
