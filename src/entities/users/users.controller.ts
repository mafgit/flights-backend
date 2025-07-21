import { Request, Response } from "express";
import { IAddUser, IUser, addSchema, roleSchema } from "./users.types";
import { validatePasswords } from "./users.utils";
import UsersService from "./users.service";
import { getIdFromParams } from "../../global/utils";
import BaseController from "../../global/BaseController";
import { AuthRequest } from "../auth/auth.types";

const usersService = new UsersService();

class UsersController extends BaseController<IUser, IAddUser> {
  service: UsersService; // overriding the base type, otherwise it would give error on using this.service.updatePassword

  constructor() {
    super(usersService, addSchema);
    this.service = usersService;
    this.addSchema = addSchema;
  }

  updatePassword = async (req: Request, res: Response) => {
    const [p1, p2] = validatePasswords(
      req.body.old_password,
      req.body.new_password
    );
    const id = getIdFromParams(req);
    const success = await this.service.updatePassword(id, p1, p2);
    res.json({ success });
  };

  updateRole = async (req: AuthRequest, res: Response) => {
    const id = getIdFromParams(req);
    const role = roleSchema.parse(req.body.role);
    const myRole = req.role!
    const success = await this.service.updateRole(id, myRole, role);
    res.json({ success });
  };
}

export default UsersController;
