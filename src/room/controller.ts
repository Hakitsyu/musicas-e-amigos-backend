import { Request, Response } from "express";
import { Member } from "./index";
import Manager from "./manager";

class Controller {
    private _manager: Manager;

    constructor(manager: Manager) {
        this._manager = manager;
    }
    
    create = (req: Request, res: Response) => res.send({ id: this.manager.createRoom() });

    list = (req: Request, res: Response) => {
        const rooms = this.manager.rooms.map(room => {
            return {
                id: room.id,
                members: room.members.map(member => this.toClientMember(member)),
                bannedMembers: room.bannedMembers.map(bannedMember => this.toClientMember(bannedMember)),
                playingVideo: room.videoManager.playingVideo,
                playlist: room.videoManager.playlist
            }
        });
        return res.send(rooms);
    }

    delete = (req: Request, res: Response) => {
        const { room_id: roomId } = <{ room_id: string }>req.query;
        if (roomId == null)
            return res.status(400).send({ error: { message: "Precisa ser inserido o room_id" } });
        if (this.manager.getRoom(roomId) == null)
            return res.status(400).send({ error: { message: "Sala inexistente" } });
        
        this.manager.deleteRoom(roomId);
        return res.send({ id: roomId });
    }

    private toClientMember = (member: Member) => {
        return {
            name: member.name,
            avatarUrl: member.avatarUrl,
            group: member.group,
            id: member.id
        }
    }

    get manager() {
        return this._manager;
    }
}

export default Controller;