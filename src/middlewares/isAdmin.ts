import { Request, Response, NextFunction } from "express";
import { authenticationData } from "../service/authentication";

const isAdmin = (adminEmails: string[]) => (req: Request, res: Response, next: NextFunction) => {
    const { access_token: accessToken } = req.query;
    if (accessToken == null)
        return res.status(400).send({ error: { message: "Precisa ser inserido o access_token" } });

    const data = authenticationData(<string>accessToken);
    if (!data.authenticated)
        return res.status(400).send({ error: { message: "Precisa estar autenticado para acessar essa função" } });

    const find = adminEmails.find(adminEmail => adminEmail.trim().toLowerCase() === data.user.email.trim().toLowerCase());
    if (find == null)
        return res.status(400).send({ error: { message: "Precisa ser um administrador para acessar essa função" } });
    return next();
}

export default isAdmin;