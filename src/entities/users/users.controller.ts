import { Request, Response } from "express";
import { IUser } from "./users.types";
import {
  validateAddBody,
  validatePasswords,
  validateUpdateBody,
} from "./users.utils";
import UsersService from "./users.service";
import { getIdFromParams } from "../../global/utils";
import BaseController from "../../global/BaseController";

const usersService = new UsersService();

class UsersController extends BaseController<IUser> {
  service: UsersService; // overriding the base type, otherwise it would give error on using this.service.updatePassword

  constructor() {
    super(usersService);
    this.service = usersService;
  }

  add = async (req: Request, res: Response) => {
    const parsedBody = validateAddBody(req.body);
    const row = await usersService.add(parsedBody);
    res.status(201).json({ data: row });
  };

  update = async (req: Request, res: Response) => {
    const parsedBody = validateUpdateBody(req.body);
    const id = getIdFromParams(req);
    const row = await this.service.update(parsedBody, id);
    res.json({ data: row });
  };

  updatePassword = async (req: Request, res: Response) => {
    const [p1, p2] = validatePasswords(
      req.body.old_password,
      req.body.new_password
    );
    const id = getIdFromParams(req);
    const success = await this.service.updatePassword(id, p1, p2);
    res.json({ success });
  };
}

export default UsersController;
