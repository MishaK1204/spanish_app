import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { AuthUserPayload } from '../auth/auth-user';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';
import {
  learnedScopeForUser,
  VocabularyService,
} from './vocabulary.service';

@Controller('vocabulary')
export class VocabularyController {
  constructor(private readonly vocabulary: VocabularyService) {}

  @Get('categories')
  listCategories() {
    return this.vocabulary.listCategories();
  }

  /** Optional `categoryId` scopes results to one category; omit to search the whole vocabulary. */
  @Get('search')
  searchVocabulary(
    @Query('q') q?: string,
    @Query('categoryId') categoryIdStr?: string,
    @Query('limit') limitStr?: string,
  ) {
    const raw = (q ?? '').trim();
    if (raw.length > 256) {
      throw new BadRequestException('Search query too long');
    }
    let categoryId: number | undefined;
    if (categoryIdStr !== undefined && categoryIdStr !== '') {
      const n = parseInt(categoryIdStr, 10);
      if (!Number.isFinite(n) || n <= 0) {
        throw new BadRequestException('Invalid categoryId');
      }
      categoryId = n;
    }
    const limit = Math.min(
      Math.max(parseInt(limitStr ?? '300', 10) || 300, 1),
      500,
    );
    return this.vocabulary.searchWords(raw, limit, categoryId);
  }

  @Get('learned')
  @UseGuards(OptionalJwtAuthGuard)
  listLearned(@CurrentUser() user?: AuthUserPayload) {
    if (!user) return { wordIds: [] };
    return this.vocabulary.listLearnedWordIds(learnedScopeForUser(user));
  }

  @Get('learned/words')
  @UseGuards(OptionalJwtAuthGuard)
  listLearnedWords(@CurrentUser() user?: AuthUserPayload) {
    if (!user) return [];
    return this.vocabulary.listLearnedWords(learnedScopeForUser(user));
  }

  @Post('words/:wordId/learned')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async markLearned(
    @CurrentUser() user: AuthUserPayload,
    @Param('wordId', ParseIntPipe) wordId: number,
  ): Promise<void> {
    await this.vocabulary.markLearned(learnedScopeForUser(user), wordId);
  }

  @Delete('words/:wordId/learned')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async unmarkLearned(
    @CurrentUser() user: AuthUserPayload,
    @Param('wordId', ParseIntPipe) wordId: number,
  ): Promise<void> {
    await this.vocabulary.unmarkLearned(learnedScopeForUser(user), wordId);
  }

  @Delete('learned')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async clearLearned(@CurrentUser() user: AuthUserPayload): Promise<void> {
    await this.vocabulary.clearLearned(learnedScopeForUser(user));
  }

  @Get('categories/:id/search')
  searchCategory(
    @Param('id', ParseIntPipe) id: number,
    @Query('q') q?: string,
    @Query('limit') limitStr?: string,
  ) {
    const raw = (q ?? '').trim();
    if (raw.length > 256) {
      throw new BadRequestException('Search query too long');
    }
    const limit = Math.min(
      Math.max(parseInt(limitStr ?? '200', 10) || 200, 1),
      500,
    );
    return this.vocabulary.searchInCategory(id, raw, limit);
  }

  @Get('categories/:id/words')
  listWords(
    @Param('id', ParseIntPipe) id: number,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    const limit = Math.min(
      Math.max(parseInt(limitStr ?? '500', 10) || 500, 1),
      5000,
    );
    const offset = Math.max(parseInt(offsetStr ?? '0', 10) || 0, 0);
    return this.vocabulary.listWords(id, limit, offset);
  }
}
