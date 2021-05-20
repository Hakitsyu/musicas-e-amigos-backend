import axios from "axios";
import { UserInformations } from "../types";

export const user = async (facebookToken: string): Promise<UserInformations> | null => {
    try {
        const response = await axios.get(`https://graph.facebook.com/me?access_token=${facebookToken}&fields=email,name,id,picture`);
        return <UserInformations>response.data;
    } catch (ex) {
        return null;
    }
}