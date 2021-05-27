import { Socket } from "socket.io";

export interface AuthenticationData {
    authenticated: boolean,
    user?: UserInformations
}

export interface UserInformations {
    id: string
    name: string,
    email: string,
    picture: {
        data: {
            url: string
        }
    }
}

export enum MemberGroup {
    ADMINISTRATOR,
    MEMBER
}

export interface ClientMember {
    id: string,
    name: string,
    avatarUrl: string,
    group: MemberGroup
}

export interface ClientRoom {
    id: string,
    members: ClientMember[]
}

export enum DisconnectedReason {
    DEFAULT = "Disconectado do servidor",
    ROOM_NOT_EXISTS = "Sala que voce tentou se conectar não existe",
    BANNED = "Voce foi banido dessa sala",
    NEED_QUERYPARAMS = "Falta os parametros 'accessToken' ou 'roomId'",
    NEED_AUTHENTICATE = "Voce não esta autenticado",
    ALREADY_CONNECTED = "Voce ja esta conectado em uma sala",
    DELETED_ROOM = "A sala foi deletada"
}

export enum FlyingEmoteTypes {
    HAPPY = "happy",
    LIKE = "like",
    LOVE = "love"
}

export interface Video {
    title: string,
    url: string,
    thumbnail: string,
    author: string,
    videoId: string,
    id: number
}

export interface PlayingVideo {
    video: Video,
    time: number,
    isPaused: boolean
}

export interface Message {
    author: ClientMember,
    context: MessageContext,
    type: MessageType
}

export enum MessageType {
    DEFAULT,
    JOIN_LOG,
    LEAVE_LOG
}

export interface MessageContext {
    text?: string,
    gif?: any,
    answering?: ClientMember
}

export interface ClientRoom {
    id: string,
    members: ClientMember[],
    bannedMembers: ClientMember[],
    playingVideo: PlayingVideo,
    playlist: Video[]
}