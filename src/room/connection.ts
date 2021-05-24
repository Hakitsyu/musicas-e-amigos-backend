import { Server, Socket } from "socket.io";
import { DisconnectedReason, MemberGroup, FlyingEmoteTypes, Video, MessageContext } from "../types";
import Manager from "./manager";
import { Member } from ".";
import { Client } from "socket.io/dist/client";
import { authenticationData } from "../service/authentication";
import { video } from "../service/youtube";
import * as http from "http";

class Connection {
    private _server: Server;
    private _manager: Manager;

    constructor(manager: Manager, httpServer: http.Server) {
        this._server = new Server(httpServer, {
            cors: {
                origin: '*',
            }
        });
        this._manager = manager;
        
        this.server.on("connection", this.onConnection);
    }


    private onConnection = (socket: Socket) => {
        const { roomId, accessToken } = <{ roomId?: string, accessToken?: string }>socket.handshake.query;
        if (!roomId || !accessToken)
            return Connection.disconnect(socket, DisconnectedReason.NEED_QUERYPARAMS);

        const { authenticated, user } = authenticationData(accessToken);
        if (!authenticated)
            return Connection.disconnect(socket, DisconnectedReason.NEED_AUTHENTICATE);    
        if (!user)
            return Connection.disconnect(socket);

        if (!this.manager.getRoom(roomId))
            return Connection.disconnect(socket, DisconnectedReason.ROOM_NOT_EXISTS);
        if (this.manager.getRoom(roomId).isBanned(user.email))
            return Connection.disconnect(socket, DisconnectedReason.BANNED);
        if (this.manager.isConnected(user.email))
            return Connection.disconnect(socket, DisconnectedReason.ALREADY_CONNECTED);

        const member = this.manager.buildMember(user.name, user.email, user.picture.data.url, accessToken, socket);
        this.manager.registerConnectedEmail(user.email);
        this.manager.getRoom(roomId).addMember(member);

        try {
            socket.emit("joined", this.onJoined(member, roomId));
            this.updateMembers(roomId);
            socket.on("disconnect", this.onDisconnect(member, roomId));
            socket.on("ban", this.onBan(member, roomId));
            socket.on("emote", this.onEmote(member, roomId));
            socket.on("new_video", this.onNewVideo(member, roomId));
            socket.on("delete_video", this.onDeleteVideo(member, roomId));
            socket.on("up_video", this.onUpVideo(member, roomId));
            socket.on("down_video", this.onDownVideo(member, roomId));
            socket.on("end_video", this.onEndVideo(member, roomId));
            socket.on("status_video", this.onStatusVideo(member, roomId));
            socket.on("send_message", this.onSendMessage(member, roomId));
        } catch (ex) {
            console.log("error: ", ex);
            Connection.disconnect(socket);
        }
    }

    private onSendMessage = (member: Member, roomId: string) => (message: MessageContext) => {
        const room = this.manager.getRoom(roomId);
        if (room != null && room.isConnectedById(member.id) && message != null) {
            if (!member.messageCooldown || member.messageCooldown.can()) {
                if (message.text != null && message.text.length > 500)
                    return member.connection.emit("message_error", "A mensagem não pode ter mais que 500 caracteres.");
                if ((message.text == null && message.gif == null) || (message.gif == null && message.text != null && message.text.trim() === ""))
                    return;
                room.emitAll("new_message", { author: this.toClientMember(member), context: message });
            }
        }
    }
    
    private onStatusVideo = (member: Member, roomId: string) => (time: number, isPaused?: boolean) => {
        if (member.isAdministrator()) {
            const room = this.manager.getRoom(roomId);
            if (room != null && room.isConnectedById(member.id) && room.videoManager.isPlayingVideo()) {
                room.videoManager.playingVideo.time = time;
                room.videoManager.playingVideo.isPaused = isPaused || false;

                room.emitAllButMe(member, "status_video", time, isPaused);
            }
        }
    }

    private onEndVideo = (member: Member, roomId: string) => () => {
        if (member.isAdministrator()) {
            const room = this.manager.getRoom(roomId);
            if (room != null && room.isConnectedById(member.id)) {
                room.videoManager.hasNextVideo() ? room.videoManager.next() : room.videoManager.playingVideo = null;
                room.emitAll("play_video", room.videoManager.playingVideo, room.videoManager.lastPlayedVideo);
                room.emitAll("playlist", room.videoManager.playlist);
            }
        }
    }

    private onDownVideo = (member: Member, roomId: string) => (video: Video) => {
        if (member.isAdministrator() && video != null) {
            const room = this.manager.getRoom(roomId);
            if (room != null && room.videoManager.containsVideoById(video.id) && room.isConnectedById(member.id)) {
                room.videoManager.downVideoFromPlaylist(video.id);
                room.emitAll("playlist", room.videoManager.playlist);
            }
        }
    }

    private onUpVideo = (member: Member, roomId: string) => (video: Video) => {
        if (member.isAdministrator() && video != null) {
            const room = this.manager.getRoom(roomId);
            if (room != null && room.videoManager.containsVideoById(video.id) && room.isConnectedById(member.id)) {
                room.videoManager.upVideoFromPlaylist(video.id);
                room.emitAll("playlist", room.videoManager.playlist);
            }
        }  
    } 

    
    private onDeleteVideo = (member: Member, roomId: string) => (video: Video) => {
        if (member.isAdministrator() && video != null) {
            const room = this.manager.getRoom(roomId);
            if (room != null && room.videoManager.containsVideoById(video.id) && room.isConnectedById(member.id)) {
                room.videoManager.removeFromPlaylist(video);
                room.emitAll("playlist", room.videoManager.playlist);
            }
        }
    }

    private onNewVideo = (member: Member, roomId: string) => async (url: string) => {
        if (member.isAdministrator() && url != null && url.trim() != "") {
            const videoData = await video(url);
            const room = this.manager.getRoom(roomId);

            if (videoData != null && room != null && room.isConnectedById(member.id)) {
                if (room.videoManager.isPlayingVideo()) {
                    room.videoManager.addToPlaylist(videoData);       
                    room.emitAll("playlist", room.videoManager.playlist);
                } else {
                    room.videoManager.playingVideo = { video: videoData, time: 0, isPaused: false };
                    room.emitAll("play_video", room.videoManager.playingVideo, room.videoManager.lastPlayedVideo);
                }
            }
        }
    }
    

    private onEmote = (member: Member, roomId: string) => (emote: FlyingEmoteTypes) => {
        const room = this.manager.getRoom(roomId);
        if (emote != null && Object.values(FlyingEmoteTypes).includes(emote) && room.isConnectedById(member.id) && room.videoManager.isPlayingVideo()) {
            if (!member.emoteCooldown || member.emoteCooldown.can())
                room.emitAll("emote", emote);
        }
    }

    private onBan = (member: Member, roomId: string) => (targetId: string) => {
        if (targetId != null) {
            const room = this.manager.getRoom(roomId);
            const target = room.getMemberById(targetId);

            if (room != null && target != null && this.isAdministrator(member) && member != target && room.isConnectedById(member.id)) {
                room.ban(target);
                this.updateMembers(roomId);
                Connection.disconnect(target.connection, DisconnectedReason.BANNED);
            }
        }
    } 

    private onJoined = (member: Member, roomId: string) => {
        const { id, members, videoManager, emitAll } = this.manager.getRoom(roomId);
        const clientMember = this.toClientMember(member);

        return {
            member: clientMember,
            room: {
                id,
                members: members.map(member => this.toClientMember(member)),
                playlist: videoManager.playlist,
                playingVideo: videoManager.playingVideo
            }
        }
    }

    private onDisconnect = (member: Member, roomId: string) => () => {
        this.manager.getRoom(roomId).removeMember(member);
        this.manager.unregisterConnectedEmail(member.email);
        this.updateMembers(roomId);
    }

    private updateMembers = (roomId: string) => {
        const room = this.manager.getRoom(roomId);
        room.emitAll("members", room.members.map(member => this.toClientMember(member)));
    }

    static disconnect = (socket: Socket,  reason?: DisconnectedReason) => {
        socket.emit("disconnected", reason || DisconnectedReason.DEFAULT);
        return socket.disconnect();
    }

    private isAdministrator = (member: Member) => member.group === MemberGroup.ADMINISTRATOR;

    private toClientMember = (member: Member) => {
        return {
            name: member.name,
            avatarUrl: member.avatarUrl,
            group: member.group,
            id: member.id
        }
    }

    get server() {
        return this._server;
    }

    get manager() {
        return this._manager;
    }
}

export default Connection;