# Database Schema
Database is PostgreSQL
## Enums
| Enum | Values |
|------|--------|
| `university` | `University of Limerick`, ...|
| `degree` | `Computer Science`, ...|
| `partner_pref` | `male`, `female`, `both` |
| `gender` | `male`, `female`, `other` |
| `match_status` | `pending`, `matched`, `unmatched` |

---

## Tables

### `user` (BetterAuth generated + modifications)
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PRIMARY KEY |
| name | TEXT | NOT NULL |
| fname | VARCHAR(50) | |
| lname | VARCHAR(50) | |
| dob | DATE | |
| is_admin | BOOLEAN | NOT NULL, DEFAULT false |
| email | TEXT | NOT NULL, UNIQUE |
| email_verified | BOOLEAN | NOT NULL, DEFAULT false |
| image | TEXT | |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() |

---

### `session` (BetterAuth generated)
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PRIMARY KEY |
| expires_at | TIMESTAMP | NOT NULL |
| token | TEXT | NOT NULL, UNIQUE |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() |
| updated_at | TIMESTAMP | NOT NULL |
| ip_address | TEXT | |
| user_agent | TEXT | |
| user_id | TEXT | NOT NULL, FK → user(id) ON DELETE CASCADE |

**Indexes:** `session_userId_idx` on `user_id`

---

### `account` (BetterAuth generated)
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PRIMARY KEY |
| account_id | TEXT | NOT NULL |
| provider_id | TEXT | NOT NULL |
| user_id | TEXT | NOT NULL, FK → user(id) ON DELETE CASCADE |
| access_token | TEXT | |
| refresh_token | TEXT | |
| id_token | TEXT | |
| access_token_expires_at | TIMESTAMP | |
| refresh_token_expires_at | TIMESTAMP | |
| scope | TEXT | |
| password | TEXT | |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() |
| updated_at | TIMESTAMP | NOT NULL |

**Indexes:** `account_userId_idx` on `user_id`

---

### `verification` (BetterAuth generated)
| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PRIMARY KEY |
| identifier | TEXT | NOT NULL |
| value | TEXT | NOT NULL |
| expires_at | TIMESTAMP | NOT NULL |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() |

**Indexes:** `verification_identifier_idx` on `identifier`

---

### `user_details`
| Column | Type | Constraints |
|--------|------|-------------|
| user_id | TEXT | PRIMARY KEY, FK → user(id) ON DELETE CASCADE |
| university | university | |
| degree | degree | |
| avatar_url | VARCHAR(256) | |
| bio | TEXT | |
| partner_pref | partner_pref | |
| gender | gender | |

---

### `interests`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT random() |
| user_id | TEXT | NOT NULL, FK → user(id) ON DELETE CASCADE |
| interest | VARCHAR(50) | NOT NULL |

**Indexes:** `interests_userId_idx` on `user_id`

---

### `matches`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT random() |
| matcher | TEXT | NOT NULL, FK → user(id) ON DELETE CASCADE |
| matched | TEXT | NOT NULL, FK → user(id) ON DELETE CASCADE |
| status | match_status | NOT NULL, DEFAULT `pending` |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() |

**Indexes:** `matches_matcher_idx` on `matcher`, `matches_matched_idx` on `matched`

---

### `events`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT random() |
| name | VARCHAR(50) | NOT NULL |
| desc | TEXT | |
| url | VARCHAR(256) | |
| img_url | VARCHAR(256) | |
| date | DATE | |
| time | TIME | |

**Indexes:** `events_date_idx` on `date`

---

### `convos`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT random() |
| user_1 | TEXT | NOT NULL, FK → user(id) ON DELETE CASCADE |
| user_2 | TEXT | NOT NULL, FK → user(id) ON DELETE CASCADE |

**Indexes:** `convos_user1_idx` on `user_1`, `convos_user2_idx` on `user_2`

---

### `messages`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT random() |
| convo_id | UUID | NOT NULL, FK → convos(id) ON DELETE CASCADE |
| text | TEXT | |
| media_url | VARCHAR(256) | |
| sender_id | TEXT | NOT NULL, FK → user(id) ON DELETE CASCADE |
| receiver_id | TEXT | NOT NULL, FK → user(id) ON DELETE CASCADE |
| timestamp | TIMESTAMP | NOT NULL, DEFAULT NOW() |

**Indexes:** `messages_convoId_idx` on `convo_id`

---

### `banned`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT random() |
| email | VARCHAR(256) | NOT NULL, UNIQUE |

---

## Relationships
- `user` has one `user_details`
- `user` has many `interests`
- `user` has many `matches` (as matcher or matched)
- `user` has many `convos` (as user_1 or user_2)
- `convos` has many `messages`
- `user` has many `session` 
- `user` has many `account` 