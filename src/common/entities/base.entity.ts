export abstract class BaseEntity {
    public readonly id: string;
    public readonly createdAt: Date;

    constructor(id: string, createdAt?: Date) {
        this.id = id;
        this.createdAt = createdAt ?? new Date();
    }
}
