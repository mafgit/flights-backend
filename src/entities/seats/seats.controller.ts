import { IAddSeat, ISeat, addSchema } from "./seats.types";
import SeatsService from "./seats.service";
import BaseController from "../../global/BaseController";
import { Request, Response } from "express";
import { getIdFromParams } from "../../global/utils";

const seatsService = new SeatsService();

class SeatsController extends BaseController<ISeat, IAddSeat> {
  declare service: SeatsService;
  constructor() {
    super(seatsService, addSchema);
    this.service = seatsService;
    this.addSchema = addSchema;
  }

  addAll = async (req: Request, res: Response) => {
    const flight_id = getIdFromParams(req);
    const rows = await this.service.addAll(flight_id);
    res.json({ data: rows });
  };
}

export default SeatsController;
