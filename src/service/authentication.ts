import * as jwt from "jsonwebtoken";
import { UserInformations, AuthenticationData } from "../types";
const secretKey = "JSIOADJISAJIODojioajkznasdbuiasudhuySUYDAGUYD";

export const authenticationData = (accessToken: string): AuthenticationData => {
    let result = null;

    jwt.verify(accessToken, secretKey, (err, decoded) => {
        if (err)
            return result = { authenticated: false }; 
        result = {
            authenticated: true,
            user: decoded as UserInformations
        }
    });

    return result;
}

export const authenticate = (data: UserInformations) => jwt.sign(data, secretKey, { expiresIn: "1d" })