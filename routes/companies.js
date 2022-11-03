"use strict";

const { Router } = require("express");

const db = require("../db");

const { NotFoundError, BadRequestError } = require("../expressError");

const router = Router();

/**
 * GET /companies
 * returns a list of companies in following format, {companies: [{code, name}, ...]}
 */
router.get("/", async function (req, res) {
  const results = await db.query(
    `SELECT code, name
      FROM companies`
  );

  const companies = results.rows;
  return res.json({ companies });
});

/**
 * GET /companies/[code]
 * Takes in a code in the query param
 * Return obj of company: {company: {code, name, description}}
 * If the company given cannot be found, this should return a 404 status response.
 */
router.get("/:code", async function (req, res) {
  const code = req.params.code;

  const results = await db.query(
    `SELECT code, name, description
      FROM companies
      WHERE code = $1`,
    [code]
  );

  const company = results.rows[0];

  if (!company) throw new NotFoundError();

  return res.json({ company });
});

/**
 * POST /companies
 * Adds a company to DB
 * Takes in JSON like {code, name, description}
 * Returns obj of new company JSON like {company: {code, name, description}}
 */

router.post("/", async function (req, res) {
  if (req.body === undefined) throw new BadRequestError();
  // What happens if input is optional?

  const { code, name, description } = req.body;

  if (!code) {
    throw new BadRequestError(`missing code`);
  }
  if (!name) {
    throw new BadRequestError(`missing name`);
  }
  if (!description) {
    throw new BadRequestError(`missing description`);
  }

  const results = await db.query(
    `INSERT INTO companies (code, name, description)
        VALUES ($1, $2, $3)
        RETURNING code, name, description`,
    [code, name, description]
  );

  const company = results.rows[0];

  return res.status(201).json({ company });
});

/**
 * PUT /companies/[code]
 * Edits existing company
 * Takes in JSON like {name, description}, both required
 * Returns obj of updated company JSON like {company: {code, name, description}}
 * Should return 404 if company cannot be found
 */

router.put("/:code", async function (req, res) {
  if (req.body === undefined) throw new BadRequestError();

  const { name, description } = req.body;

  if (!name) {
    throw new BadRequestError(`missing name`);
  }
  if (!description) {
    throw new BadRequestError(`missing description`);
  }

  const results = await db.query(
    `UPDATE companies
        SET name=$1,
            description=$2
        WHERE code = $3
        RETURNING code, name, description`,
    [name, description, req.params.code]
  );

  const company = results.rows[0];

  return res.json({ company });
});

/**
 * DELETE /companies/[code]
 * Accepts company code in query params
 * Deletes company.
 * Should return 404 if company cannot be found.
 */
router.delete("/:code", async function (req, res) {
  const { code } = req.params;

  const results = await db.query(
    `DELETE FROM companies WHERE code = $1
    RETURNING code`,
    [code]
  );

  const company = results.rows[0];

  if (!company) throw new NotFoundError();

  return res.json({ status: "Deleted" });
});

module.exports = router;
