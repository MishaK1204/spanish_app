import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WordCategory } from './word-category.entity';

@Entity('words')
export class Word {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  spanish: string;

  @Column({ type: 'text' })
  english: string;

  @ManyToOne(() => WordCategory, (category) => category.words, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'categoryId' })
  category: WordCategory;
}
