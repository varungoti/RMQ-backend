import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Health check / Welcome message' })
  @ApiResponse({ status: 200, description: 'Returns a welcome message.', type: String })
  getHello(): string {
    return 'Hello HMR Test - Change #22  - Testing Simplified HMR';
  }

  @Get('favicon.ico')
  @ApiOperation({ summary: 'Favicon handler (returns No Content)' })
  @ApiResponse({ status: 204, description: 'No content response for favicon request.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  getFavicon(): void {
    // No need to return anything
  }
}
