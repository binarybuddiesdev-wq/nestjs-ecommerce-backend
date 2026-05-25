export interface IUserPayload {
    id: string;
    email: string;
    role: string;
}

export interface IJwtPayload {
    sub: string;
    email: string;
    role: string;
}
