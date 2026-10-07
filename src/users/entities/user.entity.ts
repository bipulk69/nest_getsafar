import { BaseEntity } from "../../common/entities/base.entity.js";

export class UserEntity extends BaseEntity {
    private _email: string;
    private _name: string;

    constructor(id: string, name: string, email: string, createdAt?: Date) {
        super(id, createdAt)
        this._name = name;
        this._email = email;
    }

    get name(): string {
        return this._name;
    }

    get email(): string {
        return this._email;
    }

    public updateName(newName: string): void {
        if (!newName || newName.trim().length === 0) {
            throw new Error('Name cannot be empty');
        }
        this._name = newName;
    }


}
