import { IAddSeat, ISeat } from "./seats.types";
import pool from "../../database/db";
import BaseService from "../../global/BaseService";

export default class SeatsService extends BaseService<ISeat, IAddSeat> {
  constructor() {
    super("seats", {
      flight_id: "number",
      seat_number: "string",
      is_available: "boolean",
      seat_class: "string",
    });
  }

  async add() {
    return {};
  }

  async addAll(flight_id: number) {
    // todo: make it better
    const letters = "ABCDEF";
    const nums = "1234567890";
    const seatClassesOptions = ["first", "business", "economy", "premium"];
    const valuesArr = [];
    let seatsAdded = 0;

    for (let i = 0; i < letters.length; i++) {
      for (let j = 0; j < nums.length; j++) {
        const seatNum = letters[i] + nums[j];
        const seatClass = seatClassesOptions[j % 4];
        valuesArr.push(`values(${flight_id}, '${seatNum}', '${seatClass}')`);
        // seatNums.push(letters[i] + nums[j])
        // seatClasses.push(seatClassesOptions[j % 4])
        seatsAdded++;
        if (seatsAdded === 30) break;
      }
    }

    const { rows } = await pool.query(
      `insert into seats (flight_id, seat_number, seat_class) ${valuesArr.join(
        ", "
      )} returning *`,
      []
    );
    return rows;
  }
}
