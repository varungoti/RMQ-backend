import { UsersService } from '../users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<Omit<User, "passwordHash">>;
    findAll(): Promise<Omit<User, "passwordHash">[]>;
    findOne(id: string): Promise<Omit<User, "passwordHash">>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<Omit<User, "passwordHash">>;
    remove(id: string): Promise<void>;
}
