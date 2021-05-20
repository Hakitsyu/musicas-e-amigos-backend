import { MemberGroup } from "../types";
import { Room, Member } from "./index";
import { DisconnectedReason } from "../types";
import { Socket } from "socket.io";
import Connection from "./connection";

class Manager {
    private _rooms: Room[]; 
    private _admins: string[];
    connectedEmails: string[]

    constructor() {
        this._rooms = [new Room("wtf")];
        this._admins = this.setupAdmins();
        this.connectedEmails = [];
    }

    registerConnectedEmail = (email: string) => this.connectedEmails = [...this.connectedEmails, email];

    unregisterConnectedEmail = (email: string) =>  this.connectedEmails.splice(this.connectedEmails.indexOf(email), 1); 

    buildMember = (name: string, email: string, avatarUrl: string, accessToken: string, connection: Socket): Member => {
        const group = this.isAdmin(email) ? MemberGroup.ADMINISTRATOR : MemberGroup.MEMBER;
        const member = new Member(name, email, avatarUrl, accessToken, connection, group);

        return member;
    }

    createRoom = (): string => {
        const id = this.randomId();
        this._rooms = [...this.rooms, new Room(id)];
        return id;
    }

    deleteRoom = (roomId: string) => {
        const room = this.getRoom(roomId);
        if (room != null) {
            // First disconnect all members
            room.members.forEach(member => Connection.disconnect(member.connection, DisconnectedReason.DELETED_ROOM));
            this.rooms.splice(this.rooms.indexOf(room), 1);
        }
    }

    isAdmin = (email: string): boolean => this.admins.find(adminEmail => adminEmail.trim().toLowerCase() === email.trim().toLowerCase()) != null;

    isConnected = (email: string): boolean => this.connectedEmails.find(connectedEmail => connectedEmail === email) != null;

    getRoom = (id: string): Room => this.rooms.find(room => room.id === id);

    private setupAdmins = () => ["vitorjesus452@hotmail.com"];

    private randomId = (length?: number) => {
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        let result = "";
        for (let i = 0; i < (length | 5); i++)
            result+= letters.charAt(Math.floor(Math.random() * letters.length - 1));

        return result;
    }

    get rooms() {
        return this._rooms;
    }

    get admins() {
        return this._admins;
    }
}

export default Manager;