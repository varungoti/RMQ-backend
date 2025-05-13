/**
 * Jest setup file to mock problematic modules
 */

// Create a simple mock function factory
const createMockFunction = () => jest.fn();

// Create decorator factory
const createMockDecorator = () => jest.fn().mockImplementation(() => jest.fn());

// Mock fs for safety
jest.mock('fs', () => ({
  readFileSync: jest.fn().mockReturnValue('{}'),
  existsSync: jest.fn().mockReturnValue(true),
  readdirSync: jest.fn().mockReturnValue([]),
  statSync: jest.fn().mockReturnValue({ isDirectory: () => false }),
  promises: {
    readFile: jest.fn().mockResolvedValue('{}'),
    writeFile: jest.fn().mockResolvedValue(undefined)
  }
}));

// Mock path for safety
jest.mock('path', () => ({
  resolve: jest.fn().mockImplementation((...args) => args.join('/')),
  join: jest.fn().mockImplementation((...args) => args.join('/')),
  dirname: jest.fn().mockReturnValue('mock-dir'),
  basename: jest.fn().mockReturnValue('mock-file')
}));

// Comprehensive mock for dotenv
jest.mock('dotenv', () => {
  return {
    config: jest.fn().mockReturnValue({ parsed: {}, error: undefined }),
    parse: jest.fn().mockReturnValue({}),
    populate: jest.fn(),
    _configDotenv: jest.fn(),
    _resolveHome: jest.fn(),
    _readFile: jest.fn().mockReturnValue(''),
    _parseFile: jest.fn().mockReturnValue({})
  };
});

// Mock nest modules that are used in the tests
jest.mock('@nestjs/swagger', () => ({
  ApiProperty: createMockDecorator(),
  ApiPropertyOptional: createMockDecorator(),
  ApiTags: createMockDecorator(),
  ApiOperation: createMockDecorator(),
  ApiResponse: createMockDecorator(),
  ApiBody: createMockDecorator(),
  ApiParam: createMockDecorator(),
  ApiQuery: createMockDecorator(),
  ApiExtraModels: createMockDecorator(),
  getSchemaPath: jest.fn().mockImplementation(modelName => modelName),
  ApiOkResponse: createMockDecorator(),
  ApiUnauthorizedResponse: createMockDecorator(),
  ApiBadRequestResponse: createMockDecorator(),
  ApiCreatedResponse: createMockDecorator(),
  ApiNotFoundResponse: createMockDecorator(),
  ApiHeader: createMockDecorator(),
  ApiSecurity: createMockDecorator(),
  ApiExcludeEndpoint: createMockDecorator(),
  ApiExcludeController: createMockDecorator(),
  ApiConsumes: createMockDecorator(),
  ApiProduces: createMockDecorator(),
  ApiBearerAuth: createMockDecorator(),
  PartialType: jest.fn().mockImplementation(type => class extends type {}),
  SwaggerModule: {
    createDocument: createMockFunction(),
    setup: createMockFunction()
  }
}));

// Mock class-validator
jest.mock('class-validator', () => {
  const validators = [
    'IsUUID', 'IsOptional', 'IsNumber', 'Min', 'Max', 'IsString', 'IsEnum', 'IsArray', 
    'IsUrl', 'IsBoolean', 'ValidateNested', 'IsNotEmpty', 'IsEmail', 'IsDate',
    'IsPositive', 'IsInt', 'IsObject', 'MinLength', 'MaxLength', 'Length', 'Matches',
    'IsDefined', 'IsIn', 'IsJSON', 'ValidateBy', 'IsJWT', 'IsDateString'
  ];
  
  const mocks = {};
  validators.forEach(validator => {
    mocks[validator] = createMockDecorator();
  });
  
  return {
    ...mocks,
    ValidationOptions: {},
    ValidationArguments: {},
    isObject: jest.fn().mockImplementation(obj => obj !== null && typeof obj === 'object')
  };
});

// Mock class-transformer
jest.mock('class-transformer', () => ({
  Type: createMockDecorator(),
  Expose: createMockDecorator(),
  Exclude: createMockDecorator(),
  Transform: createMockDecorator(),
  plainToClass: jest.fn().mockImplementation((cls, plain) => plain),
  classToPlain: jest.fn().mockImplementation(obj => obj)
}));

// Mock typeorm entities
jest.mock('typeorm', () => {
  const mockRepository = {
    save: jest.fn().mockImplementation(entity => {
      if (Array.isArray(entity)) {
        return entity.map((e, index) => ({ ...e, id: e.id || `mock-id-${index}` }));
      }
      return { ...entity, id: entity.id || 'mock-id' };
    }),
    findOne: jest.fn().mockImplementation(() => ({})),
    findOneBy: jest.fn().mockImplementation(() => ({})),
    findOneByOrFail: jest.fn().mockImplementation(() => ({})),
    find: jest.fn().mockImplementation(() => []),
    findBy: jest.fn().mockImplementation(() => []),
    findByIds: jest.fn().mockImplementation(() => []),
    count: jest.fn().mockReturnValue(10),
    create: jest.fn().mockImplementation(entity => entity),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    query: jest.fn().mockResolvedValue([])
  };

  return {
    // Basic entity decorators
    Entity: jest.fn().mockImplementation(() => jest.fn()),
    PrimaryGeneratedColumn: jest.fn().mockImplementation(() => jest.fn()),
    Column: jest.fn().mockImplementation(() => jest.fn()),
    CreateDateColumn: jest.fn().mockImplementation(() => jest.fn()),
    UpdateDateColumn: jest.fn().mockImplementation(() => jest.fn()),
    
    // Relationship decorators
    ManyToOne: jest.fn().mockImplementation(() => jest.fn()),
    OneToMany: jest.fn().mockImplementation(() => jest.fn()),
    JoinColumn: jest.fn().mockImplementation(() => jest.fn()),
    ManyToMany: jest.fn().mockImplementation(() => jest.fn()),
    OneToOne: jest.fn().mockImplementation(() => jest.fn()),
    JoinTable: jest.fn().mockImplementation(() => jest.fn()),
    
    // Constraints
    Unique: jest.fn().mockImplementation(() => jest.fn()),
    Index: jest.fn().mockImplementation(() => jest.fn()),
    Check: jest.fn().mockImplementation(() => jest.fn()),
    
    // Connection handling
    createConnection: jest.fn().mockResolvedValue({}),
    getConnection: jest.fn().mockReturnValue({
      createQueryRunner: jest.fn().mockReturnValue({
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          ...mockRepository
        }
      })
    }),
    
    // Manager
    getManager: jest.fn().mockReturnValue({
      ...mockRepository
    }),
    
    // DataSource
    DataSource: jest.fn().mockImplementation(() => ({
      initialize: jest.fn().mockResolvedValue({}),
      getRepository: jest.fn().mockReturnValue({
        ...mockRepository
      })
    })),
    
    // Repository
    Repository: jest.fn().mockImplementation(() => ({
      ...mockRepository
    })),
    
    // Type functions
    DeleteResult: jest.fn(),
    UpdateResult: jest.fn(),
    EntityTarget: jest.fn(),
    
    // Additional typeorm exports
    Not: jest.fn(),
    LessThan: jest.fn(),
    MoreThan: jest.fn(),
    Equal: jest.fn(),
    Like: jest.fn(),
    In: jest.fn(),
    IsNull: jest.fn(),
    Between: jest.fn(),
    FindOperator: jest.fn()
  };
});

// Mock @nestjs/graphql
jest.mock('@nestjs/graphql', () => {
  return {
    GraphQLModule: {
      forRoot: jest.fn().mockImplementation(() => ({
        imports: [],
        providers: [],
        exports: []
      }))
    },
    ObjectType: jest.fn().mockImplementation(() => jest.fn()),
    Field: jest.fn().mockImplementation(() => jest.fn()),
    InputType: jest.fn().mockImplementation(() => jest.fn()),
    Args: jest.fn().mockImplementation(() => jest.fn()),
    ArgsType: jest.fn().mockImplementation(() => jest.fn()),
    Resolver: jest.fn().mockImplementation(() => jest.fn()),
    Query: jest.fn().mockImplementation(() => jest.fn()),
    Mutation: jest.fn().mockImplementation(() => jest.fn()),
    Subscription: jest.fn().mockImplementation(() => jest.fn()),
    Int: jest.fn().mockImplementation(() => Number),
    Float: jest.fn().mockImplementation(() => Number),
    ID: jest.fn().mockImplementation(() => String),
    registerEnumType: jest.fn()
  };
});

// Mock @nestjs/apollo
jest.mock('@nestjs/apollo', () => {
  return {
    ApolloDriver: jest.fn(),
    ApolloDriverConfig: jest.fn()
  };
});

// Mock path and fs modules
jest.mock('path', () => {
  return {
    join: jest.fn().mockImplementation((...args) => args.join('/')),
    resolve: jest.fn().mockImplementation((...args) => args.join('/')),
    dirname: jest.fn().mockImplementation((path) => path),
    basename: jest.fn().mockImplementation((path) => path.split('/').pop())
  };
});

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockImplementation((password) => Promise.resolve(`hashed_${password}`)),
  compare: jest.fn().mockImplementation((password, hash) => Promise.resolve(hash === `hashed_${password}`)),
  genSalt: jest.fn().mockImplementation(() => Promise.resolve('salt')),
}));

// Mock @nestjs/typeorm
jest.mock('@nestjs/typeorm', () => {
  return {
    InjectRepository: jest.fn().mockImplementation(() => {
      return (target, key, index) => {
        // This mock just needs to exist, it doesn't need to do anything
      };
    }),
    getRepositoryToken: jest.fn().mockImplementation((entity) => {
      return `${entity.name}Repository`;
    }),
    TypeOrmModule: {
      forRoot: jest.fn().mockImplementation(() => ({
        imports: [],
        providers: [],
        exports: []
      })),
      forRootAsync: jest.fn().mockImplementation(() => ({
        imports: [],
        providers: [],
        exports: []
      })),
      forFeature: jest.fn().mockImplementation(() => ({
        imports: [],
        providers: [],
        exports: []
      }))
    }
  };
});

// Mock @nestjs/config
jest.mock('@nestjs/config', () => {
  return {
    ConfigModule: {
      forRoot: jest.fn().mockImplementation(() => ({
        imports: [],
        providers: [],
        exports: []
      }))
    },
    ConfigService: jest.fn().mockImplementation(() => ({
      get: jest.fn().mockImplementation((key) => {
        return process.env[key];
      }),
      getOrThrow: jest.fn().mockImplementation((key) => {
        const value = process.env[key];
        if (!value) {
          throw new Error(`Config value for ${key} not found`);
        }
        return value;
      })
    }))
  };
});

// Mock Joi
jest.mock('joi', () => {
  return {
    object: jest.fn().mockReturnThis(),
    string: jest.fn().mockReturnThis(),
    number: jest.fn().mockReturnThis(),
    boolean: jest.fn().mockReturnThis(),
    array: jest.fn().mockReturnThis(),
    required: jest.fn().mockReturnThis(),
    optional: jest.fn().mockReturnThis(),
    default: jest.fn().mockReturnThis(),
    valid: jest.fn().mockReturnThis(),
    min: jest.fn().mockReturnThis(),
    max: jest.fn().mockReturnThis(),
    uri: jest.fn().mockReturnThis(),
    uuid: jest.fn().mockReturnThis(),
    email: jest.fn().mockReturnThis(),
    pattern: jest.fn().mockReturnThis()
  };
});

// Mock more NestJS modules
jest.mock('@nestjs/core', () => {
  return {
    RouterModule: {
      register: jest.fn().mockImplementation(() => ({
        imports: [],
        providers: [],
        exports: []
      }))
    },
    Reflector: jest.fn().mockImplementation(() => ({
      get: jest.fn(),
      getAllAndOverride: jest.fn()
    }))
  };
});

// Setup process.env with test values
process.env.DATABASE_HOST = 'localhost';
process.env.DATABASE_PORT = '5432';
process.env.DATABASE_USERNAME = 'test_user';
process.env.DATABASE_PASSWORD = 'test_password';
process.env.DATABASE_NAME = 'test_db';
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.JWT_EXPIRATION_TIME = '3600';
process.env.ENABLE_SWAGGER = 'true';

console.log('Jest setup script executed - mocked modules initialized'); 