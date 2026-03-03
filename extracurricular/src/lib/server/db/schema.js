import {
	pgTable,
	uuid,
	text,
	varchar,
	timestamp,
	date,
	time,
	boolean,
	pgEnum,
	index
} from 'drizzle-orm/pg-core';
import { user } from './auth.schema';

/** Enums */
export const universityEnum = pgEnum('university', [
	'University of Limerick'
	// TODO
]);

export const degreeEnum = pgEnum('degree', [
	'Computer Science'
	// TODO
]);

export const interestEnum = pgEnum('interest', [
	'Hiking',
	'Music',
	'Gaming',
	'Reading',
	'Movies',
	'Cycling',
	'Sport',
	'Swimming',
	'Fishing',
	'Computers'
]);

export const partnerPrefEnum = pgEnum('partner_pref', ['male', 'female', 'both']);
export const genderEnum = pgEnum('gender', ['male', 'female', 'other']);
export const matchStatusEnum = pgEnum('match_status', ['pending', 'matched', 'unmatched']);

/** Tables */
export const userDetails = pgTable(
	'user_details', 
	{
		userId: text('user_id')
			.primaryKey()
			.references(() => user.id, { onDelete: 'cascade' }),
		university: universityEnum('university'),
		degree: degreeEnum('degree'),
		avatarUrl: varchar('avatar_url', { length: 256 }),
		bio: text('bio'),
		partnerPref: partnerPrefEnum('partner_pref'),
		gender: genderEnum('gender')
	}
);

export const interests = pgTable(
	'interests', 
	{
		id: uuid('id')
			.primaryKey()
			.defaultRandom(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		interest: interestEnum('interest')
	},
	(table) => [index('interests_userId_idx').on(table.userId)]
);

export const matches = pgTable(
	'matches', 
	{
		id: uuid('id')
			.primaryKey()
			.defaultRandom(),
		matcher: text('matcher')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		matched: text('matched')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		status: matchStatusEnum('status')
			.notNull()
			.default('pending'),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.notNull()
	},
	(table) => [
		index('matches_matcher_idx').on(table.matcher),
		index('matches_matched_idx').on(table.matched)
	]
);

export const events = pgTable(
	'events', 
	{
		id: uuid('id')
			.primaryKey()
			.defaultRandom(),
		name: varchar('name', { length: 50 }).notNull(),
		desc: text('desc'),
		url: varchar('url', { length: 256 }),
		imgUrl: varchar('img_url', { length: 256 }),
		date: date('date'),
		time: time('time')
	},
	(table) => [index('events_date_idx').on(table.date)]
);

export const convos = pgTable(
	'convos',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		user1: text('user_1')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		user2: text('user_2')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' })
	},
	(table) => [index('convos_user1_idx').on(table.user1), index('convos_user2_idx').on(table.user2)]
);

export const messages = pgTable(
	'messages',
	{
		id: uuid('id')
			.primaryKey()
			.defaultRandom(),
		convoId: uuid('convo_id')
			.notNull()
			.references(() => convos.id, { onDelete: 'cascade' }),
		text: text('text'),
		mediaUrl: varchar('media_url', { length: 256 }),
		senderId: text('sender_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		receiverId: text('receiver_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		timestamp: timestamp('timestamp')
			.defaultNow()
			.notNull()
	},
	(table) => [index('messages_convoId_idx').on(table.convoId)]
);

export const banned = pgTable(
	'banned', 
	{
		id: uuid('id')
			.primaryKey()
			.defaultRandom(),
		email: varchar('email', { length: 256 })
			.notNull()
			.unique()
	}
);

export * from './auth.schema';
