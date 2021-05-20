import { Server, Socket } from "socket.io";
import { authenticationData } from "../service/authentication";

interface Room {
    id: string,
    members: Member[],
    bannedAccessTokens: string[]
}

enum MemberGroup {
    MEMBER,
    ADMINISTRATOR
}

interface Member {
    id: string,
    name: string,
    accessToken: string,
    avatarUrl: string,
    group: MemberGroup,
    connection: Socket
}

interface ClientMember {
    id: string,
    name: string,
    avatarUrl: string,
    group: MemberGroup
}

interface DisconnectResponse {
    status: number,
    message?: string
}

interface JoinedResponse {
    member: {
        name: string
        avatarUrl: string,
        group: MemberGroup
    },
    room: {
        id: string,
        members: ClientMember[]
    }
}

class RoomManager {
    private _rooms: Room[];
    private _admins: string[];
    limit: number;
    idLength: number;

    constructor() {
        this._rooms = [{ id: "wtf", members: [], bannedAccessTokens: []}];
        this._admins = ["vitorjesus452@hotmail.com"]
        this.limit = null;
        this.idLength = 5;
    }

    join = (member: Member, roomId: string): Room => {
        const room = this.getRoom(roomId);
        room.members = [...room.members, member];

        this._rooms[this.rooms.indexOf(room)] = room;
        console.log(this.rooms); 
        return room;
    }

    createMember = (props: { name: string, avatarUrl: string, accessToken: string, connection: Socket }, email: string): Member => {
        const id = this.randomId(10);
        const group = this.isAdmin(email) ? MemberGroup.ADMINISTRATOR : MemberGroup.MEMBER;
        
        return <Member> { id, name: props.name, avatarUrl: props.avatarUrl, accessToken: props.accessToken, group };
    }

    isBanned = (accessToken: string, roomId: string): boolean => {
        return this.getRoom(roomId).bannedAccessTokens.find(bannedAccessToken => bannedAccessToken === accessToken) != null;
    }

    isAdmin = (email: string): boolean => this.admins.find(admin => admin.toLowerCase() === email.toLowerCase()) != null;

    existsRoom = (id: string): boolean => this.rooms.find(room => room.id === id) != null;

    getRoom = (id: string): Room => this.rooms.find(room => room.id === id);

    private randomId = (length?: number) => {
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        let result = "";
        for (let i = 0; i < (length | 5); i++)
            result+= letters.charAt(Math.floor(Math.random() * letters.length - 1));

        return result;
    }

    get admins() {
        return this._admins;
    }

    get rooms() {
        return this._rooms;
    }
}

class RoomConnection {
    private _manager: RoomManager;
    private _server: Server;

    constructor(manager: RoomManager, http) {
        this._manager = manager;
        this._server = new Server(http, {
            cors: {
                origin: '*',
            }
        });   
        this._server.on("connection", this.onConnection);
    }

    // Status dos Disconnect;
    // 0 - Falta access token ou room id
    // 1 - Não esta autenticado
    // 2- Sala não existe
    // 3 - Banido
    onConnection = (socket: Socket) => {
        const { accessToken, roomId } = socket.handshake.query;
        if (accessToken == null || roomId == null)
            return this.disconnect(socket, { status: 0, message: "'accessToken' e 'roomId' necessitam ser inseridos." });

        const authData = authenticationData(<string>accessToken);
        if (!authData.authenticated) 
            return this.disconnect(socket, { status: 1, message: "Voce não esta autenticado." });
        if (!this.manager.existsRoom(<string>roomId))
            return this.disconnect(socket, { status: 2, message: "Sala inexistente." })
        if (this.manager.isBanned(<string>accessToken, <string>roomId))
            return this.disconnect(socket, { status: 3, message: "Voce esta banido dessa sala." });

        const { name, picture, email } = authData.user;
        const member = this.manager.createMember({ name, avatarUrl: picture.data.url, accessToken: <string>accessToken, connection: socket }, email);
        const room = this.manager.join(member, <string>roomId);
        const members = room.members.map(member => {
            return {
                id: member.id,
                name: member.name,
                avatarUrl: member.avatarUrl,
                group: member.group
            }
        });

        socket.emit("joined", <JoinedResponse>{
            member: {
                id: member.id,
                name: member.name,
                avatarUrl: member.avatarUrl,
                group: member.group
            },
            room: {
                id: room.id,
                members
            }
        });
    }

    disconnect = (socket: Socket, response: DisconnectResponse) => {
        socket.emit("disconnected", response);
        socket.disconnect();
    }

    get manager() {
        return this._manager;
    }

    get server() {
        return this._server;
    }
}

export {
    RoomManager,
    RoomConnection
}