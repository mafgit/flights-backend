import pool from "../database/db_connection";

type IField = Record<string, "string" | "boolean" | "number">;

export default abstract class BaseService<T> {
  table: string;
  fields: IField;
  constructor(table: string, fields: IField) {
    this.table = table;
    this.fields = fields;
  }

  async get_all(
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
          if (key !== "id" && this.fields[key] === "string") {
            query += ` and ${key} ILIKE $${i++}`;
          } else {
            query += ` and ${key} = $${i++}`;
          }
          values.push("%" + where[key as keyof T] + "%");
        }
      });
    }

    if (limit) {
      query += ` limit $${i++} offset $${i++}`;
      values.push(limit);
      values.push(offset ?? 0);
    }

    if (orderBy && Object.keys(this.fields).includes(orderBy)) {
      query += ` order by ${orderBy} ${asc ? "asc" : "desc"}`;
    }

    const { rows } = await pool.query(query, values);
    return rows;
  }

  async get_by_id(id: number) {
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
      if (key !== "id" && Object.keys(this.fields).includes(key)) {
        values.push(data[key as keyof T]);
        queries.push(`${key} = $${i++}`);
      }
    }

    query = query + " " + queries.join(", ") + ` where id = $${i} returning *`;
    const { rows } = await pool.query(query, [...values, id]);
    return rows[0];
  }
}
