const { Router } = require("express");

const db = require("../db");

const { NotFoundError } = require("../expressError");

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
  const { code } = req.params;

  const results = await db.query(
    `SELECT code, name, description
      FROM companies
      WHERE code === $1`,
    [code]
  );

  const company = results.row[0];

  if (!company) throw new NotFoundError();

  return res.json({ company });
});

module.exports = router;
