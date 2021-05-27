import { Router } from "express";
import AuthenticationController from "./authentication/controller";
import RoomController from "./room/controller";
import Manager from "./room/manager";
import isAdminMiddleware from "./middlewares/isAdmin";

export default (manager: Manager, roomController: RoomController) => {
    const routes = Router();
    routes.get("/authentication/verify/admin", AuthenticationController.verifyAuthenticationAdmin(manager));
    routes.get("/authentication/verify", AuthenticationController.verifyAuthentication);
    routes.get("/authentication", AuthenticationController.authentication);
    routes.get("/room/create", [isAdminMiddleware(manager.admins)], roomController.create);
    routes.get("/room/list", [isAdminMiddleware(manager.admins), roomController.list]);
    routes.get("/room/delete", [isAdminMiddleware(manager.admins)], roomController.delete);
    
    return routes;
};