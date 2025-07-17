import { Request, Response } from "express";
import BaseService from "./BaseService";
import { getIdFromParams } from "./utils";

export default abstract class BaseController<T> {
  service: BaseService<T>;
  constructor(service: BaseService<T>) {
    this.service = service;
  }

  getAll = async (req: Request, res: Response) => {
    const rows = await this.service.getAll();
    res.json({ data: rows });
  };

  delete = async (req: Request, res: Response) => {
    const id = getIdFromParams(req);
    const success = await this.service.delete(id);
    res.json({ success });
  };

  getById = async (req: Request, res: Response) => {
    const id = getIdFromParams(req);
    const row = await this.service.getById(id);
    res.json({ data: row });
  };
}
