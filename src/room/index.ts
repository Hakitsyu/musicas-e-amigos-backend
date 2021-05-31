import Connection from "./connection";
import Manager from "./manager";
import Controller from "./controller";
import Cooldown from "../utils/cooldown";
import { Video, PlayingVideo, MemberGroup } from "../types";
import { Socket } from "socket.io";
import * as http from "http";

export const init = (): { manager: Manager, controller: Controller } => {
    const manager = new Manager();
    const controller = new Controller(manager);

    return {
        manager,
        controller
    }
}

export const initSocketConnection = (manager: Manager, httpServer: http.Server) => {
    const connection = new Connection(manager, httpServer);
    return connection;
}

export class Member {
    private _id: string;
    private _name: string;
    private _email: string;
    private _avatarUrl: string;
    private _group: MemberGroup;
    private _accessToken: string;
    private _connection: Socket;
    private _emoteCooldoown: Cooldown;
    private _messageCooldown: Cooldown;

    constructor(name: string, email: string, avatarUrl: string, accessToken: string, connection: Socket, group?: MemberGroup) {
        this._id = (() => {
            const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
            let result = "";
            for (let i = 0; i < 5; i++)
                result+= letters.charAt(Math.floor(Math.random() * letters.length - 1));

            return result;
        })();
        this._name = name;
        this._email = email;
        this._avatarUrl = avatarUrl;
        this._group = group;
        this._accessToken = accessToken;
        this._connection = connection;
        this._emoteCooldoown = !this.isAdministrator() ? new Cooldown(0.5) : null; 
        this._messageCooldown = !this.isAdministrator() ? new Cooldown(0.5) : null;
    }

    isAdministrator = (): boolean => this.group === MemberGroup.ADMINISTRATOR;

    get id() {
        return this._id;
    }

    get name() {
        return this._name;
    }

    get email() {
        return this._email;
    }

    get avatarUrl() {
        return this._avatarUrl;
    }

    get group() {
        return this._group;
    }

    get accessToken() {
        return this._accessToken;
    }

    get connection() {
        return this._connection;
    }

    get emoteCooldown() {
        return this._emoteCooldoown;
    }

    get messageCooldown() {
        return this._messageCooldown;
    }
}

export class VideoManager {
    playlist: Video[];
    playingVideo: PlayingVideo;
    lastPlayedVideo: Video;

    constructor() {
        this.playlist = [];
        this.playingVideo = null;
        this.lastPlayedVideo = null;
    }

    next = () => {
        if (this.hasNextVideo()) {
            const nextVideo = this.playlist[0];
            if (this.isPlayingVideo())
                this.lastPlayedVideo = this.playingVideo.video;

            this.removeFromPlaylist(nextVideo);
            this.playingVideo = { video: nextVideo, time: 0, isPaused: false };
        } else 
            this.playingVideo = null;
    }

    upVideoFromPlaylist = (videoId: number) => {
        if (this.containsVideoById(videoId)) {
            const video = this.getVideoById(videoId);
            const index = this.playlist.indexOf(video);

            if (index > 0) {
                const otherVideo = this.playlist[index - 1];
                this.playlist[index - 1] = video;
                this.playlist[index] = otherVideo;
            }
        }
    }
    
    downVideoFromPlaylist = (videoId: number) => {
        if (this.containsVideoById(videoId)) {
            const video = this.getVideoById(videoId);
            const index = this.playlist.indexOf(video);

            if (index != this.playlist.length - 1) {
                const otherVideo = this.playlist[index + 1];
                this.playlist[index + 1] = video;
                this.playlist[index] = otherVideo;  
            }
        }
    }

    addToPlaylist = (video) => {
        if (video != null)
            this.playlist = [...this.playlist , video];
    }

    removeFromPlaylist = (video: Video) => { 
        if (video != null)
            this.playlist.splice(this.playlist.indexOf(this.getVideoById(video.id)), 1);
    }

    getVideoById = (id: number) => this.playlist.find(video => video.id === id);

    hasNextVideo = () => this.playlist.length > 0;

    containsVideoById = (id: number): boolean => this.playlist.find(video => video.id === id) != null; 

    isPlayingVideo = (): boolean => this.playingVideo != null;
}

export class Room {
    private _id: string;
    members: Member[];
    bannedMembers: Member[];
    emoteCooldown: { member: Member, date: Date }[];
    private _videoManager: VideoManager;

    constructor(id: string) {
        this._id = id;
        this.members = [];
        this.bannedMembers = [];
        this.emoteCooldown = [];
        this._videoManager = new VideoManager();
    }

    addMember = (member: Member) => this.members = [...this.members, member];

    removeMember = (member: Member) => this.members.splice(this.members.indexOf(member), 1);
    
    ban = (member: Member) => this.bannedMembers = [...this.bannedMembers, member];

    emitAll = (event: string, ...args: any) => this.members.forEach(member => member.connection.emit(event, ...args));

    emitAllButMe = (member: Member, event: string, ...args: any) => this.members.filter(otherMember => otherMember != member).forEach(member => member.connection.emit(event, ...args));

    getMemberById = (memberId: string): Member => this.members.find(member => member.id === memberId);

    isBanned = (email: string): boolean => this.bannedMembers.find(bannedMember => bannedMember.email === email) != null;

    isConnectedById = (memberId: string): boolean => this.members.find(member => member.id === memberId) != null;

    get id() {
        return this._id;
    }

    get videoManager() {
        return this._videoManager;
    }
}