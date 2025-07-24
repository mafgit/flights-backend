import { Request, Response } from "express";
import BaseService from "./BaseService";
import { getIdFromParams, validateAddBody, validateUpdateBody } from "./utils";
import { z } from "zod";

export default abstract class BaseController<T, AddT> {
  service: BaseService<T, AddT>;
  addSchema: z.ZodObject;
  constructor(service: BaseService<T, AddT>, addSchema: z.ZodObject) {
    this.service = service;
    this.addSchema = addSchema;
  }

  getAll = async (req: Request, res: Response) => {
    const rows = await this.service.getAll();
    res.json({ data: rows });
  };

  add = async (req: Request, res: Response) => {
    const parsedBody = validateAddBody<AddT>(this.addSchema, req.body);
    const row = await this.service.add(parsedBody);
    res.status(201).json({ data: row });
  };

  update = async (req: Request, res: Response) => {
    const parsedBody = validateUpdateBody<T>(this.addSchema, req.body);
    const id = getIdFromParams(req);
    const row = await this.service.update(parsedBody, id);
    res.json({ data: row });
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
