import pool from "../database/db";
import createHttpError from "http-errors";

type IField = Record<string, "string" | "boolean" | "number">;

export default abstract class BaseService<T, AddT> {
  table: string;
  queryFields: IField;
  constructor(table: string, queryFields: IField) {
    this.table = table;
    this.queryFields = {
      ...queryFields,
      id: "number",
      created_at: "string",
      updated_at: "string",
    };
  }

  async getAll(
    where?: Partial<T>,
    limit?: number,
    offset?: number,
    orderBy?: string,
    asc?: boolean
  ) {
    let query = `select * from ${this.table} where 1=1`;

    let i = 1;
    let values = [];

    if (where) {
      Object.keys(where).forEach((key) => {
        if (where[key as keyof T] !== undefined) {
          if (key !== "id" && this.queryFields[key] === "string") {
            query += ` and ${key} ILIKE $${i++}`;
            values.push("%" + where[key as keyof T] + "%");
          } else {
            query += ` and ${key} = $${i++}`;
            values.push(where[key as keyof T]);
          }
        }
      });
    }

    if (limit) {
      query += ` limit $${i++} offset $${i++}`;
      values.push(limit);
      values.push(offset ?? 0);
    }

    if (orderBy && Object.keys(this.queryFields).includes(orderBy)) {
      query += ` order by ${orderBy} ${asc ? "asc" : "desc"}`;
    }

    const { rows } = await pool.query(query, values);
    return rows;
  }

  async getById(id: number) {
    let query = `select * from ${this.table} where id = $1`;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }

  async delete(id: number) {
    const result = await pool.query(
      `delete from ${this.table} where id = $1 returning *`,
      [id]
    );
    return result.rowCount && result.rowCount > 0;
  }

  async update(data: Partial<T>, id: number) {
    let query = `update ${this.table} set`;

    let values = [];
    let queries = [];

    let i = 1;
    for (let key in data) {
      if (
        key !== "id" &&
        key !== "password_hash" &&
        Object.keys(this.queryFields).includes(key)
      ) {
        values.push(data[key]);
        queries.push(`${key} = $${i++}`);
      }
      // else if (
      //   key === "password" &&
      //   typeof data[key] === "string" &&
      //   this.table === "users"
      // ) {
      //   const hashedPassword = await hashPassword(data[key]);
      //   queries.push(`password_hash = $${i++}`);
      //   values.push(hashedPassword);
      // }
    }
    if (queries.length === 0) throw createHttpError(400, "No fields provided");
    query = query + " " + queries.join(", ") + ` where id = $${i} returning *`;
    const { rows } = await pool.query(query, [...values, id]);
    return rows[0];
  }

  abstract add(data: any): Promise<any>;
}
