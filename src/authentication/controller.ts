import * as api from "../service/authentication";
import { Request, Response } from "express";
import { authenticationData } from "../service/authentication";
import { user } from "../service/facebook";
import Manager from "../room/manager";

class AuthenticationController {
    static verifyAuthentication = async (req: Request, res: Response) => {
        const { access_token: accessToken} = req.query;
        if (accessToken == null)
            return res.status(400).send({ error: { message: "Precisa ser inserido o access_token" } });

        const data = authenticationData(<string>accessToken);
        return res.send(data);
    }

    static verifyAuthenticationAdmin = (manager: Manager) => async (req: Request, res: Response) => {
        const { access_token: accessToken} = req.query;
        if (accessToken == null)
            return res.status(400).send({ error: { message: "Precisa ser inserido o access_token" } });

        const data = authenticationData(<string>accessToken);
        return res.send({ ...data, isAdmin: data.user ? manager.isAdmin(data.user.email) : false });
    }

    static authentication = async (req: Request, res: Response) => {
        const { facebook_token: facebookToken } = req.query;
        if (facebookToken == null)
            return res.status(400).send({ error: { message: "Precisa ser inserido o facebook_token" } });

        const userInformations = await user(<string>facebookToken);
        if (userInformations == null)
            return res.status(400).send({ error: { message: "O token inserido é invalido" } });

        return res.send({ accessToken: api.authenticate(userInformations) });
    }
}

export default AuthenticationController;