import axios from "axios";
import { Video } from "../types";

export const video = async (url: string): Promise<Video> | null => {
    try {
        const response = await axios.get(`https://youtube.com/oembed?url=${url}&format=json`);
        const id = Math.floor(Math.random() * 1000);
        const videoId = (() => {
            if (url.startsWith("https://www.youtube.com/watch?v="))
                return url.split("https://www.youtube.com/watch?v=")[1];
            if (url.startsWith("https://youtu.be/"))
                return url.split("https://youtu.be/")[1];
            return null;
        })();

        if (videoId != null)
            return <Video> {
                title: response.data.title,
                url,
                thumbnail: response.data.thumbnail_url,
                author: response.data.author_name,
                id,
                videoId
            };
    } catch (ex) {
        return null;
    }
}