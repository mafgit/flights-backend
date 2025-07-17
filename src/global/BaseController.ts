import { Request, Response } from "express";
import BaseService from "./BaseService";
import { get_id_from_params } from "./utils";

export default abstract class BaseController<T> {
  service: BaseService<T>;
  constructor(service: BaseService<T>) {
    this.service = service;
  }
  async get_all(req: Request, res: Response) {
    const rows = await this.service.get_all();
    res.json({ data: rows });
  }

  async delete(req: Request, res: Response) {
    const id = get_id_from_params(req);
    const success = await this.service.delete(id);
    res.json({ success });
  }

  async get_by_id(req: Request, res: Response) {
    const id = get_id_from_params(req);
    const row = await this.service.get_by_id(id);
    res.json({ data: row });
  }
}
