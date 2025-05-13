import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private usersRepository;
    private readonly logger;
    private readonly saltRounds;
    constructor(usersRepository: Repository<User>);
    findOneByEmail(email: string): Promise<User | null>;
    create(createUserDto: CreateUserDto): Promise<Omit<User, 'passwordHash'>>;
    findAll(): Promise<Omit<User, 'passwordHash'>[]>;
    findOne(id: string): Promise<Omit<User, 'passwordHash'>>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<Omit<User, 'passwordHash'> | null>;
    remove(id: string): Promise<void>;
    findByIdInternal(id: string): Promise<User | null>;
}
