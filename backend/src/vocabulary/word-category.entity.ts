import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Word } from './word.entity';

@Entity('word_categories')
export class WordCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 512, unique: true })
  name: string;

  @OneToMany(() => Word, (word) => word.category)
  words: Word[];
}
