import { User } from "../models/User";

class UserService {

    getUser = (where?: Record<string, any>, attributes?: string[]): Promise<any> => {
        return User.findOne({ where, attributes, raw: true });
    }

}

export const userService = new UserService();