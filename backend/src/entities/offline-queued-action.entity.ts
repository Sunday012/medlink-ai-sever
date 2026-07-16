import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum ActionType {
  CREATE_REFERRAL = 'create_referral',
  UPDATE_REFERRAL = 'update_referral',
  UPDATE_REFERRAL_STATUS = 'update_referral_status',
  CREATE_PATIENT = 'create_patient',
  UPDATE_PATIENT = 'update_patient',
  DISPATCH_AMBULANCE = 'dispatch_ambulance',
  UPDATE_DISPATCH_STATUS = 'update_dispatch_status',
}

export enum EntityType {
  REFERRAL = 'referral',
  PATIENT = 'patient',
  AMBULANCE_DISPATCH = 'ambulance_dispatch',
}

@Entity('offline_queued_actions')
@Index(['user_id', 'created_at'])
@Index(['synced_at'])
@Index(['entity_type', 'entity_id'])
export class OfflineQueuedAction extends BaseEntity {
  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: string;

  @Column({
    type: 'enum',
    enum: ActionType,
  })
  action_type: ActionType;

  @Column({
    type: 'enum',
    enum: EntityType,
  })
  entity_type: EntityType;

  @Column()
  entity_id: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({ nullable: true })
  synced_at: Date;

  @Column({ default: false })
  sync_failed: boolean;

  @Column({ nullable: true })
  sync_error: string;
}
