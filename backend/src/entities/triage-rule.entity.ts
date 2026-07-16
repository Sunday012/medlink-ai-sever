import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('triage_rules')
export class TriageRule extends BaseEntity {
  @Column()
  version: number;

  @Column({ type: 'jsonb' })
  rule_set: Record<string, any>;

  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'created_by' })
  created_by_user: User;

  @Column({ nullable: true })
  created_by: string;

  @Column({ default: false })
  active: boolean;

  @Column({ nullable: true })
  published_at: Date;

  @Column({ nullable: true })
  description: string;
}
