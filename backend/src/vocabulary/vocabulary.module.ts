import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { LearnedWord } from './learned-word.entity';
import { Word } from './word.entity';
import { WordCategory } from './word-category.entity';
import { VocabularyController } from './vocabulary.controller';
import { VocabularyService } from './vocabulary.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WordCategory, Word, LearnedWord]),
    AuthModule,
  ],
  controllers: [VocabularyController],
  providers: [VocabularyService],
})
export class VocabularyModule {}
