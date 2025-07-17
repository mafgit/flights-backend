import { Request, Response } from "express";
import { IAirline } from "./airlines.types";
import { validate_add_body, validate_update_body } from "./airlines.utils";
import AirlinesService from "./airlines.service";
import { get_id_from_params } from "../../global/utils";
import BaseController from "../../global/BaseController";

const airlines_service = new AirlinesService();

class AirlinesController extends BaseController<IAirline> {
  constructor() {
    super(airlines_service);
  }

  async add(req: Request, res: Response) {
    const parsed_body = validate_add_body(req.body);
    const row = await airlines_service.add(parsed_body);
    res.status(201).json({ data: row });
  }

  async update(req: Request, res: Response) {
    const parsed_body = validate_update_body(req.body);
    const id = get_id_from_params(req);
    const row = await this.service.update(parsed_body, id);
    res.json({ data: row });
  }
}

export default AirlinesController;
