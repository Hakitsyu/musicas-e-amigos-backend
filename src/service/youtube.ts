import axios from "axios";
import { Video } from "../types";

export const video = async (url: string): Promise<Video> | null => {
    try {
        const response = await axios.get(`https://youtube.com/oembed?url=${url}&format=json`);
        const id = Math.floor(Math.random() * 1000);
        const videoId = (() => {
            try {
                const youTubeIdFromLink = (url) => url.match(/(?:https?:\/\/)?(?:www\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\/?\?v=|\/embed\/|\/)([^\s&]+)/)[1];
                return youTubeIdFromLink(url);
            } catch (ex) {
                return null;
            }
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